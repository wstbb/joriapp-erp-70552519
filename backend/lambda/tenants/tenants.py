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
        rows = cur.fetchall()
        logger.info(f"[TENANTS_DEBUG] public list (no auth) returned {len(rows)} rows from public.tenants")
        return build_response(200, rows, encoder=CustomEncoder)

# [受保护函数] 为管理员提供包含所有详细信息的完整租户列表（与前端 transformTenantFromApi 字段一致）
def get_all_tenants_for_admin(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        # 调试：确认当前库与 schema，以及 public.tenants 行数
        try:
            cur.execute("SELECT current_database() AS db, current_schema() AS schema;")
            diag = cur.fetchone()
            logger.info(f"[TENANTS_DEBUG] current_database={diag.get('db')}, current_schema={diag.get('schema')}")
            cur.execute("SELECT count(*) AS n FROM public.tenants;")
            cnt = cur.fetchone().get('n')
            logger.info(f"[TENANTS_DEBUG] public.tenants row count={cnt}")
        except Exception as e:
            logger.warning(f"[TENANTS_DEBUG] diagnostic query failed: {e}")

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
        rows = cur.fetchall()
        logger.info(f"[TENANTS_DEBUG] admin list query returned {len(rows)} rows")
        if rows:
            first = dict(rows[0])
            for k, v in list(first.items()):
                if hasattr(v, 'isoformat'):
                    first[k] = v.isoformat()
            logger.info(f"[TENANTS_DEBUG] first row keys={list(first.keys())}, id={first.get('id')}, name={first.get('name')}, domain={first.get('domain')}")

        # 前端 Tenant.id 为 string；统一把 id 转为 str，避免类型不一致
        out = []
        for r in rows:
            d = dict(r)
            if d.get('id') is not None:
                d['id'] = str(d['id'])
            for k, v in d.items():
                if hasattr(v, 'isoformat'):
                    d[k] = v.isoformat()
            out.append(d)
        return build_response(200, out, encoder=CustomEncoder)

# --- 创建租户（完整实现：插入 tenants、建表、创建 admin 用户、写历史、返回密码）---
def create_tenant(conn, body):
    name = (body.get('name') or '').strip()
    domain = (body.get('domain') or '').strip()
    admin_name = (body.get('admin_name') or '').strip()
    admin_email = (body.get('admin_email') or '').strip()
    industry_id = body.get('industry_id')
    plan_code = (body.get('plan_code') or '').strip()
    if not name or not domain or not admin_email or not plan_code:
        return build_response(400, {"message": "缺少必填项: name, domain, admin_email, plan_code"})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM public.plans WHERE code = %s;", (plan_code,))
        plan_row = cur.fetchone()
        if not plan_row:
            return build_response(400, {"message": "无效的订阅方案代码"})
        plan_id = plan_row['id']
        if industry_id is not None:
            cur.execute("SELECT id FROM public.industries WHERE id = %s;", (industry_id,))
            if not cur.fetchone():
                industry_id = None
        cur.execute(
            """INSERT INTO public.tenants (name, domain, status, admin_name, admin_email, plan_id, industry_id)
               VALUES (%s, %s, 'active', %s, %s, %s, %s) RETURNING id, name, domain, schema_name, admin_name, admin_email, plan_id, industry_id, created_at;""",
            (name, domain, admin_name or name, admin_email, plan_id, industry_id),
        )
        row = cur.fetchone()
        if not row:
            return build_response(500, {"message": "插入租户失败"})
        tenant_id = row['id']
        schema_name = row['schema_name']
        if not schema_name:
            conn.rollback()
            return build_response(500, {"message": "触发器未设置 schema_name"})
        cur.execute("SELECT create_tenant_tables_and_roles(%s);", (schema_name,))
        initial_password = generate_password()
        hashed = bcrypt.hashpw(initial_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        cur.execute(
            f'INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}."users" (name, email, password_hash, role) VALUES (%s, %s, %s, %s);',
            ('admin', admin_email, hashed, 'admin'),
        )
        if industry_id is not None:
            cur.execute("SELECT name, sort_order FROM public.industry_category_templates WHERE industry_id = %s ORDER BY sort_order, id;", (industry_id,))
            cat_templates = cur.fetchall()
            first_cat_id = None
            for ct in cat_templates:
                cur.execute(
                    f'INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}."categories" (name) VALUES (%s) RETURNING id;',
                    (ct['name'],),
                )
                rid = cur.fetchone()
                if rid and first_cat_id is None:
                    first_cat_id = rid['id']
            cur.execute("SELECT sku, name, specs, unit, base_price, cost_price FROM public.industry_demo_products WHERE industry_id = %s ORDER BY id;", (industry_id,))
            prod_templates = cur.fetchall()
            if first_cat_id is None and cat_templates:
                cur.execute(f'SELECT id FROM {psycopg2.extensions.quote_ident(schema_name, cur)}."categories" ORDER BY id LIMIT 1;')
                row = cur.fetchone()
                first_cat_id = row['id'] if row else None
            if first_cat_id is None:
                cur.execute(f'INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}."categories" (name) VALUES (%s) RETURNING id;', ('默认分类',))
                first_cat_id = cur.fetchone()['id']
            for pt in prod_templates:
                cur.execute(
                    f'INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}."products" (category_id, sku, name, specs, unit, base_price, cost_price) VALUES (%s, %s, %s, %s, %s, %s, %s);',
                    (first_cat_id, pt['sku'], pt['name'], pt.get('specs') or '', pt.get('unit') or '件', pt.get('base_price') or 0, pt.get('cost_price') or 0),
                )
        else:
            cur.execute(f'INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}."categories" (name) VALUES (%s);', ('默认分类',))
        cur.execute(
            """INSERT INTO public.tenant_history (tenant_id, action, changed_by, payload)
               VALUES (%s, 'created', 'system', %s);""",
            (tenant_id, json.dumps({"name": name, "domain": domain, "plan_id": plan_id, "industry_id": industry_id})),
        )
        conn.commit()
    tenant_out = {
        "id": str(row['id']),
        "name": row['name'],
        "domain": row['domain'],
        "admin_name": row['admin_name'],
        "admin_email": row['admin_email'],
        "created_at": row['created_at'].isoformat() if row.get('created_at') else None,
    }
    return build_response(201, {"tenant": tenant_out, "password": initial_password}, encoder=CustomEncoder)

def get_tenant_usage(conn, tenant_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT t.schema_name, p.max_users, p.max_storage_gb, p.ai_calls_per_day FROM public.tenants t LEFT JOIN public.plans p ON t.plan_id = p.id WHERE t.id = %s;", (tenant_id,))
        row = cur.fetchone()
        if not row:
            return build_response(404, {"message": "租户不存在"})
        schema_name = row['schema_name']
        max_users = row.get('max_users')
        max_storage_gb = row.get('max_storage_gb')
        ai_calls_per_day = row.get('ai_calls_per_day')
        cur.execute("SELECT count(*) as user_count FROM " + psycopg2.extensions.quote_ident(schema_name, cur) + '."users";')
        user_count = cur.fetchone()['user_count']
        cur.execute(
            """SELECT coalesce(sum(pg_total_relation_size(quote_ident(schemaname) || '.' || quote_ident(tablename))), 0)::bigint AS schema_bytes
               FROM pg_tables WHERE schemaname = %s;""",
            (schema_name,),
        )
        schema_bytes = cur.fetchone()['schema_bytes'] or 0
        storage_mb = round(schema_bytes / (1024 * 1024), 2)
        storage_gb = round(schema_bytes / (1024 * 1024 * 1024), 2)
        out = {"userCount": user_count, "storageSize": f"{storage_gb} GB", "storageSizeMb": storage_mb, "storageBytes": schema_bytes}
        if max_users is not None:
            out["maxUsers"] = max_users
        if max_storage_gb is not None:
            out["maxStorageGb"] = max_storage_gb
        if ai_calls_per_day is not None:
            out["aiCallsPerDay"] = ai_calls_per_day
        return build_response(200, out, encoder=CustomEncoder)

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

def _append_tenant_history(conn, tenant_id, action, payload):
    with conn.cursor() as cur:
        cur.execute(
            "INSERT INTO public.tenant_history (tenant_id, action, changed_by, payload) VALUES (%s, %s, 'system', %s);",
            (tenant_id, action, json.dumps(payload)),
        )

def update_tenant_status(conn, tenant_id, body):
    status = body.get('status')
    if not status: return build_response(400, {"message": "缺少 status"})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT status FROM public.tenants WHERE id = %s;", (tenant_id,))
        old = cur.fetchone()
        cur.execute("UPDATE public.tenants SET status = %s WHERE id = %s;", (status, tenant_id))
        _append_tenant_history(conn, tenant_id, 'updated', {"status": {"from": old['status'] if old else None, "to": status}})
    conn.commit()
    return build_response(200, {"message": "状态更新成功"})

def update_tenant_plan(conn, tenant_id, body):
    plan_id = body.get('plan_id')
    plan_code = (body.get('plan_code') or '').strip()
    if not plan_id and plan_code:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT id FROM public.plans WHERE code = %s;", (plan_code,))
            row = cur.fetchone()
            if row:
                plan_id = row['id']
    if not plan_id: return build_response(400, {"message": "缺少 plan_id 或 plan_code"})
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT plan_id FROM public.tenants WHERE id = %s;", (tenant_id,))
        old = cur.fetchone()
        cur.execute("UPDATE public.tenants SET plan_id = %s WHERE id = %s;", (plan_id, tenant_id))
        _append_tenant_history(conn, tenant_id, 'updated', {"plan_id": {"from": old['plan_id'] if old else None, "to": plan_id}})
    conn.commit()
    return build_response(200, {"message": "方案更新成功"})

def get_tenant_history(conn, tenant_id):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            "SELECT id, tenant_id, action, changed_by, changed_at, payload FROM public.tenant_history WHERE tenant_id = %s ORDER BY changed_at DESC;",
            (tenant_id,),
        )
        rows = cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        if d.get('changed_at'):
            d['changed_at'] = d['changed_at'].isoformat()
        if isinstance(d.get('payload'), str):
            try:
                d['payload'] = json.loads(d['payload'])
            except Exception:
                pass
        out.append(d)
    return build_response(200, out, encoder=CustomEncoder)

def provision_subdomain(conn, tenant_id):
    """预留：子域名部署接口，当前仅返回即将开放提示。"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, domain FROM public.tenants WHERE id = %s;", (tenant_id,))
        if not cur.fetchone():
            return build_response(404, {"message": "租户不存在"})
    return build_response(200, {"message": "子域名部署功能即将开放", "status": "not_implemented"})


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
            if method == 'GET' and action == 'history':
                return get_tenant_history(conn, tenant_id)
            if method == 'POST' and action == 'reset-password':
                return reset_admin_password(conn, tenant_id)
            if method == 'POST' and action == 'provision-subdomain':
                return provision_subdomain(conn, tenant_id)
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
