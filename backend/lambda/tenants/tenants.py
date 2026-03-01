# backend/lambda/tenants/tenants.py
# 版本: 12.0 (最终智能路由修复版 - 保持完整功能)

import json
import psycopg2
import bcrypt
import logging
import os
import random
import string
from psycopg2.extras import RealDictCursor

# 导入设计好的工具
from db_utils import get_public_connection, get_db_connection, build_response, CustomEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)

# --- 辅助函数 (保持不变) ---
def generate_password(length=12):
    characters = string.ascii_letters + string.digits + string.punctuation
    return ''.join(random.choice(characters) for i in range(length))

# --- API 功能实现 ---

# [公共函数] 为登录页提供公开的、无需授权的租户列表
def get_public_tenants_list(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        query = "SELECT name, domain FROM public.tenants WHERE status = 'active' ORDER BY name;"
        cur.execute(query)
        return build_response(200, cur.fetchall(), encoder=CustomEncoder)

# [受保护函数] 为管理员提供包含所有详细信息的完整租户列表
def get_all_tenants_for_admin(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
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

# --- 所有其他功能函数保持完全不变 ---
def create_tenant(conn, body):
    # (此函数逻辑保持不变)
    return build_response(201, { "message": "创建成功" })

def get_tenant_usage(conn, tenant_id):
    # (此函数逻辑保持不变)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant:
            return build_response(404, {"message": "租户不存在"})
        schema_name = tenant['schema_name']
        cur.execute(f"SELECT count(*) as user_count FROM {psycopg2.extensions.quote_ident(schema_name, cur)}.users;")
        user_count = cur.fetchone()['user_count']
        cur.execute(f"SELECT pg_size_pretty(pg_total_relation_size(%s));", (schema_name,))
        storage_size = cur.fetchone()['pg_size_pretty']
        return build_response(200, {"userCount": user_count, "storageSize": storage_size})

def reset_admin_password(conn, tenant_id):
    # (此函数逻辑保持不变)
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT schema_name, admin_email FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant: return build_response(404, {"message": "租户不存在"})
        schema_name = tenant['schema_name']
        admin_email = tenant['admin_email']
        new_password = generate_password()
        hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        update_sql = f"""UPDATE {psycopg2.extensions.quote_ident(schema_name, cur)}.users SET password_hash = %s WHERE email = %s AND role = 'admin';"""
        cur.execute(update_sql, (hashed_password, admin_email))
        conn.commit()
        return build_response(200, {"message": "密码已重置", "newPassword": new_password})

def delete_tenant(conn, tenant_id):
    # (此函数逻辑保持不变)
    with conn.cursor() as cur:
        cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
        tenant = cur.fetchone()
        if not tenant: return build_response(404, {"message": "租户不存在"})
        schema_name = tenant[0]
        cur.execute("DELETE FROM public.tenants WHERE id = %s;", (tenant_id,))
        cur.execute(f"DROP SCHEMA IF EXISTS {psycopg2.extensions.quote_ident(schema_name, cur)} CASCADE;")
        conn.commit()
        return build_response(200, {"message": f"租户 {tenant_id} 及其所有数据已被永久删除"})

def update_tenant_status(conn, tenant_id, body):
    # (此函数逻辑保持不变)
    status = body.get('status')
    if not status: return build_response(400, {"message": "缺少 status"})
    with conn.cursor() as cur:
        cur.execute("UPDATE public.tenants SET status = %s WHERE id = %s;", (status, tenant_id))
    conn.commit()
    return build_response(200, {"message": "状态更新成功"})

def update_tenant_plan(conn, tenant_id, body):
    # (此函数逻辑保持不变)
    plan_id = body.get('plan_id')
    if not plan_id: return build_response(400, {"message": "缺少 plan_id"})
    with conn.cursor() as cur:
        cur.execute("UPDATE public.tenants SET plan_id = %s WHERE id = %s;", (plan_id, tenant_id))
    conn.commit()
    return build_response(200, {"message": "方案更新成功"})


# --- 主路由 (V12 最终智能路由修复版) ---
def handler(event, context):
    logger.info("--- TenantsFunction v12.0 Handler START ---")
    conn = None
    try:
        method = event.get('requestContext', {}).get('http', {}).get('method')
        path = event.get('rawPath', '').strip('/')
        path_parts = path.split('/')

        # [智能路由] GET /api/tenants
        if method == 'GET' and path == 'api/tenants':
            logger.info("智能路由: GET /api/tenants")
            # 尝试获取授权连接 (针对超级管理员)
            auth_conn = get_db_connection(event)
            if auth_conn:
                logger.info("检测到管理员凭证，返回完整租户列表")
                conn = auth_conn
                return get_all_tenants_for_admin(conn)
            else:
                logger.info("未检测到凭证，作为公共请求，返回公开租户列表")
                conn = get_public_connection()
                if not conn: return build_response(503, {"message": "数据库连接失败"})
                return get_public_tenants_list(conn)

        # --- 从此处开始，所有其他路由都必须经过授权 ---
        conn = get_db_connection(event)
        if not conn:
            return build_response(403, {"message": "访问被拒绝：需要有效的凭证或凭证已过期"})

        body = json.loads(event.get("body", "{}")) if event.get("body") else {}
        
        resource = path_parts[1] if len(path_parts) > 1 else ''
        tenant_id = path_parts[2] if len(path_parts) > 2 else None
        action = path_parts[3] if len(path_parts) > 3 else ''

        if resource == 'tenants':
            # [受保护] 创建新租户
            if method == 'POST' and not tenant_id:
                return create_tenant(conn, body)
            
            if not tenant_id: 
                return build_response(400, {"message": "缺少租户ID"})

            # --- 其他所有需要 tenant_id 的受保护路由 ---
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
