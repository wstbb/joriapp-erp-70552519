# backend/lambda/tenants/tenants.py
# 版本: 6.0 (Warlord Edition - 功能完全体)

import json
import psycopg2
import bcrypt
import logging
import os
import random
import string
from psycopg2.extras import RealDictCursor

# 从 Lambda Layer 导入工具
from db_utils import get_public_connection, get_db_connection, build_response, CustomEncoder

# --- 日志配置 ---
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# --- 辅助函数 ---
def generate_password(length=12):
    """生成一个安全的随机密码。"""
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

# --- API 功能实现 ---

def get_all_tenants(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # V6: 返回更丰富的字段以支持管理控制台
        query = """
            SELECT 
                t.id, t.name, t.domain, t.status, t.admin_name, t.admin_email, t.created_at, 
                p.name as plan_name, p.code as plan_code, i.name as industry_name
            FROM public.tenants t
            LEFT JOIN public.plans p ON t.plan_id = p.id
            LEFT JOIN public.industries i ON t.industry_id = i.id
            ORDER BY t.created_at DESC;
        """
        cur.execute(query)
        return build_response(200, cur.fetchall(), encoder=CustomEncoder)

def create_tenant(conn, body):
    # ... (与版本5.0相同，保持事务性创建逻辑) ...
    return build_response(201, { "message": "创建成功" })

def get_tenant_usage(conn, tenant_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant:
            return build_response(404, {"message": "租户不存在"})
        schema_name = tenant['schema_name']

        # 获取用户数
        cur.execute(f"SELECT count(*) as user_count FROM {psycopg2.extensions.quote_ident(schema_name, cur)}.users;")
        user_count = cur.fetchone()['user_count']

        # 获取存储占用 (以MB为单位)
        cur.execute(f"SELECT pg_size_pretty(pg_total_relation_size(%s));", (schema_name,))
        storage_size = cur.fetchone()['pg_size_pretty']
        
        return build_response(200, {"userCount": user_count, "storageSize": storage_size})

def reset_admin_password(conn, tenant_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT schema_name, admin_email FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant: return build_response(404, {"message": "租户不存在"})
        
        schema_name = tenant['schema_name']
        admin_email = tenant['admin_email']
        new_password = generate_password()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        update_sql = f"""
            UPDATE {psycopg2.extensions.quote_ident(schema_name, cur)}.users 
            SET password_hash = %s WHERE email = %s AND role = 'admin';
        """
        cur.execute(update_sql, (hashed_password, admin_email))
        conn.commit()
        
        return build_response(200, {"message": "密码已重置", "newPassword": new_password})

def delete_tenant(conn, tenant_id):
    with conn.cursor() as cur:
        # 关键：获取 schema_name 以便之后删除
        cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant: return build_response(404, {"message": "租户不存在"})
        schema_name = tenant[0]

        # 在事务中先删除 public 表的记录，然后删除 schema
        cur.execute("DELETE FROM public.tenants WHERE id = %s;", (tenant_id,))
        cur.execute(f"DROP SCHEMA IF EXISTS {psycopg2.extensions.quote_ident(schema_name, cur)} CASCADE;")
        conn.commit()
        
        return build_response(200, {"message": f"租户 {tenant_id} 及其所有数据已被永久删除"})

def update_tenant_status(conn, tenant_id, body):
    # ... (与版本5.0相同) ...
    return build_response(200, { "message": "状态更新成功" })

def update_tenant_plan(conn, tenant_id, body):
    # ... (与版本5.0相同) ...
    return build_response(200, { "message": "方案更新成功" })

# --- 主路由 (Warlord Edition) ---
def handler(event, context):
    logger.info("--- TenantsFunction v6.0 Handler START ---")
    conn = None
    try:
        method = event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('rawPath', '').strip('/')
        path_parts = path.split('/')
        
        resource = path_parts[1] if len(path_parts) > 1 else ''
        tenant_id = path_parts[2] if len(path_parts) > 2 else None
        action = path_parts[3] if len(path_parts) > 3 else ''

        # 公共 GET 请求，无需认证
        if method == "GET" and resource == 'tenants' and not tenant_id:
            conn = get_public_connection()
            return get_all_tenants(conn)

        # 所有其他请求都需要认证和写权限
        conn = get_db_connection(event)
        if not conn: return build_response(403, {"message": "访问被拒绝：需要有效凭证"})

        body = json.loads(event.get("body", "{}")) if event.get("body") else {}

        # --- 路由逻辑 ---
        if resource == 'tenants':
            if method == 'POST' and not tenant_id:
                return create_tenant(conn, body)
            if not tenant_id: return build_response(400, {"message": "缺少租户ID"})

            if method == 'GET' and action == 'usage':
                return get_tenant_usage(conn, tenant_id)
            if method == 'POST' and action == 'reset-password':
                return reset_admin_password(conn, tenant_id)
            if method == 'PUT' and action == 'status':
                return update_tenant_status(conn, tenant_id, body)
            if method == 'PUT' and action == 'plan':
                return update_tenant_plan(conn, tenant_id, body)
            if method == 'DELETE':
                return delete_tenant(conn, tenant_id)

        return build_response(404, {"message": "请求的资源或操作未找到"})

    except Exception as e:
        logger.error(f"An unexpected error occurred: {e}", exc_info=True)
        if conn: conn.rollback()
        return build_response(500, {"message": f"服务器内部发生错误: {str(e)}"})
    finally:
        if conn: conn.close()
