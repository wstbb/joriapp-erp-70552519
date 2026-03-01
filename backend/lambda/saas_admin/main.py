# backend/lambda/saas_admin/main.py
# 职责：处理所有 SaaS 后台管理 API 请求，需超级管理员 JWT，返回/修改 public 数据。

import json
import logging
from db_utils import get_db_connection, build_response, CustomEncoder
from psycopg2.extras import RealDictCursor

logger = logging.getLogger()
logger.setLevel(logging.INFO)


def _json_serial(obj):
    if hasattr(obj, 'isoformat'):
        return obj.isoformat()
    raise TypeError(type(obj).__name__)


def handler(event, context):
    path = (event.get('rawPath') or event.get('path', '')).strip('/')
    method = (event.get('requestContext') or {}).get('http', {}).get('method') or event.get('httpMethod', 'GET')
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    conn = get_db_connection(event)
    if not conn:
        return build_response(403, {"message": "需要有效的超级管理员凭证"})

    try:
        path_parts = path.split('/')
        # path 可能是 "admin/plans" 或 "admin/plans/1"
        if len(path_parts) >= 2 and path_parts[0] == 'admin':
            resource = path_parts[1]
            resource_id = path_parts[2] if len(path_parts) > 2 else None

            if resource == 'tenants':
                return _handle_tenants(conn)
            if resource == 'plans':
                return _handle_plans(conn, method, resource_id, body)
            if resource == 'industries':
                return _handle_industries(conn, method, resource_id, body)
        return build_response(404, {"message": f"路径未实现: {path}"})
    except Exception as e:
        logger.exception("saas_admin 处理错误")
        return build_response(500, {"error": str(e)})
    finally:
        if conn:
            conn.close()


def _handle_tenants(conn):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name, domain, status, admin_name, admin_email, plan_id, industry_id, created_at
            FROM public.tenants ORDER BY id
        """)
        rows = cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
        out.append(d)
    return build_response(200, out, encoder=CustomEncoder)


def _handle_plans(conn, method, plan_id, body):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if method == 'GET':
            cur.execute("""
                SELECT id, code, name, description, max_users, max_storage_gb, ai_calls_per_day
                FROM public.plans ORDER BY id
            """)
            rows = cur.fetchall()
            out = []
            for r in rows:
                d = dict(r)
                for k, v in d.items():
                    if hasattr(v, 'isoformat'):
                        d[k] = v.isoformat()
                out.append(d)
            return build_response(200, out, encoder=CustomEncoder)
        if method == 'PUT' and plan_id:
            cur.execute(
                """UPDATE public.plans SET
                    name = COALESCE(%s, name),
                    description = COALESCE(%s, description),
                    max_users = COALESCE(%s, max_users),
                    max_storage_gb = COALESCE(%s, max_storage_gb),
                    ai_calls_per_day = COALESCE(%s, ai_calls_per_day)
                WHERE id = %s RETURNING id, code, name, description, max_users, max_storage_gb, ai_calls_per_day
                """,
                (
                    body.get('name'),
                    body.get('description'),
                    body.get('max_users'),
                    body.get('max_storage_gb'),
                    body.get('ai_calls_per_day'),
                    int(plan_id),
                ),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return build_response(404, {"message": "方案不存在"})
            d = dict(row)
            for k, v in d.items():
                if hasattr(v, 'isoformat'):
                    d[k] = v.isoformat()
            return build_response(200, d, encoder=CustomEncoder)
    return build_response(400, {"message": "请求方法或参数不正确"})


def _handle_industries(conn, method, industry_id, body):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if method == 'GET':
            cur.execute("SELECT id, name FROM public.industries ORDER BY id")
            rows = cur.fetchall()
            out = [dict(r) for r in rows]
            return build_response(200, out, encoder=CustomEncoder)
        if method == 'POST' and not industry_id:
            name = (body.get('name') or '').strip()
            if not name:
                return build_response(400, {"message": "缺少 name"})
            cur.execute(
                "INSERT INTO public.industries (name) VALUES (%s) RETURNING id, name",
                (name,),
            )
            row = cur.fetchone()
            conn.commit()
            return build_response(201, dict(row), encoder=CustomEncoder)
        if method == 'PUT' and industry_id:
            name = (body.get('name') or '').strip()
            if not name:
                return build_response(400, {"message": "缺少 name"})
            cur.execute(
                "UPDATE public.industries SET name = %s WHERE id = %s RETURNING id, name",
                (name, int(industry_id)),
            )
            row = cur.fetchone()
            conn.commit()
            if not row:
                return build_response(404, {"message": "行业不存在"})
            return build_response(200, dict(row), encoder=CustomEncoder)
    return build_response(400, {"message": "请求方法或参数不正确"})
