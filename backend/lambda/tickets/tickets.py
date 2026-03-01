# backend/lambda/tickets/tickets.py
# 工单：租户用户在系统设置→技术支持提交；后台管理员在工单中心查看/回复。

import json
import os
import jwt
import logging
from db_utils import get_public_connection, build_response, CustomEncoder
from psycopg2.extras import RealDictCursor

logger = logging.getLogger()
logger.setLevel(logging.INFO)
JWT_SECRET = os.environ.get('JWT_SECRET')


def _auth(event):
    headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
    auth = headers.get('authorization', '')
    if not auth.startswith('Bearer '):
        return None, None
    try:
        payload = jwt.decode(auth.split(' ')[1], JWT_SECRET, algorithms=['HS256'])
        is_super = bool(payload.get('is_super_admin'))
        tenant_id = payload.get('tenant_id')
        return is_super, str(tenant_id) if tenant_id is not None else None
    except Exception:
        return None, None


def _cors_headers():
    return {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
        'Access-Control-Allow-Headers': 'Content-Type,Authorization',
    }


def handler(event, context):
    method = (event.get('requestContext') or {}).get('http', {}).get('method') or event.get('httpMethod', 'GET')
    path = (event.get('rawPath') or event.get('path', '')).strip('/')
    path_parts = path.split('/')
    # /api/tickets 或 /api/tickets/123 或 /api/tickets/123/reply 等
    if path_parts[0] != 'api' or (len(path_parts) < 2 or path_parts[1] != 'tickets'):
        return {'statusCode': 404, 'headers': _cors_headers(), 'body': json.dumps({'error': 'Not found'})}
    ticket_id = path_parts[2] if len(path_parts) > 2 else None
    action = path_parts[3] if len(path_parts) > 3 else None  # reply | status
    body = {}
    if event.get('body'):
        try:
            body = json.loads(event['body'])
        except Exception:
            pass

    is_super, tenant_id = _auth(event)
    if is_super is None and tenant_id is None:
        return {'statusCode': 403, 'headers': _cors_headers(), 'body': json.dumps({'message': '需要登录'})}

    conn = get_public_connection()
    if not conn:
        return {'statusCode': 503, 'headers': _cors_headers(), 'body': json.dumps({'message': '数据库不可用'})}
    try:
        if method == 'POST' and not ticket_id:
            return create_ticket(conn, body, tenant_id, is_super)
        if method == 'GET':
            return get_tickets(conn, ticket_id, tenant_id, is_super)
        if method == 'POST' and ticket_id and action == 'reply':
            return add_reply(conn, ticket_id, body, is_super)
        if method == 'PUT' and ticket_id and (action == 'status' or not action):
            return update_status(conn, ticket_id, body, is_super)
        return {'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({'error': '无效请求'})}
    finally:
        conn.close()


def create_ticket(conn, body, tenant_id, is_super):
    if not is_super and not tenant_id:
        return {'statusCode': 403, 'headers': _cors_headers(), 'body': json.dumps({'message': '租户用户才能提交工单'})}
    tid = body.get('tenant_id') if is_super else tenant_id
    if not tid:
        return {'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({'message': '缺少租户'})}
    contact_email = (body.get('contact_email') or body.get('email') or '').strip()
    subject = (body.get('subject') or body.get('title') or '').strip()
    typ = (body.get('type') or 'other')[:50]
    priority = (body.get('priority') or 'medium')[:50]
    body_text = (body.get('body') or body.get('description') or '')[:10000]
    if not subject:
        return {'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({'message': '请填写标题'})}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute(
            """INSERT INTO public.tickets (tenant_id, contact_email, subject, type, priority, status, body)
               VALUES (%s, %s, %s, %s, %s, 'open', %s) RETURNING id, tenant_id, subject, status, created_at;""",
            (int(tid), contact_email or 'unknown', subject, typ, priority, body_text),
        )
        row = cur.fetchone()
        conn.commit()
    out = dict(row)
    for k, v in out.items():
        if hasattr(v, 'isoformat'):
            out[k] = v.isoformat()
    return {'statusCode': 201, 'headers': _cors_headers(), 'body': json.dumps(out, cls=CustomEncoder)}


def get_tickets(conn, ticket_id, tenant_id, is_super):
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        if ticket_id:
            cur.execute(
                """SELECT t.id, t.tenant_id, t.contact_email, t.subject, t.type, t.priority, t.status, t.body, t.created_at, t.updated_at,
                          n.name AS tenant_name
                   FROM public.tickets t
                   LEFT JOIN public.tenants n ON n.id = t.tenant_id
                   WHERE t.id = %s""",
                (int(ticket_id),),
            )
            row = cur.fetchone()
            if not row:
                return {'statusCode': 404, 'headers': _cors_headers(), 'body': json.dumps({'message': '工单不存在'})}
            if not is_super and str(row['tenant_id']) != str(tenant_id):
                return {'statusCode': 403, 'headers': _cors_headers(), 'body': json.dumps({'message': '无权查看'})}
            cur.execute(
                "SELECT id, ticket_id, author_type, content, created_at FROM public.ticket_replies WHERE ticket_id = %s ORDER BY created_at;",
                (int(ticket_id),),
            )
            replies = [dict(r) for r in cur.fetchall()]
            out = dict(row)
            for k, v in out.items():
                if hasattr(v, 'isoformat'):
                    out[k] = v.isoformat()
            for r in replies:
                if hasattr(r.get('created_at'), 'isoformat'):
                    r['created_at'] = r['created_at'].isoformat()
            out['replies'] = replies
            return {'statusCode': 200, 'headers': _cors_headers(), 'body': json.dumps(out, cls=CustomEncoder)}
        # list
        if is_super:
            cur.execute(
                """SELECT t.id, t.tenant_id, t.subject, t.type, t.priority, t.status, t.created_at, n.name AS tenant_name
                   FROM public.tickets t LEFT JOIN public.tenants n ON n.id = t.tenant_id ORDER BY t.created_at DESC"""
            )
        else:
            cur.execute(
                """SELECT t.id, t.tenant_id, t.subject, t.type, t.priority, t.status, t.created_at, n.name AS tenant_name
                   FROM public.tickets t LEFT JOIN public.tenants n ON n.id = t.tenant_id
                   WHERE t.tenant_id = %s ORDER BY t.created_at DESC""",
                (int(tenant_id),),
            )
        rows = cur.fetchall()
    out = []
    for r in rows:
        d = dict(r)
        for k, v in d.items():
            if hasattr(v, 'isoformat'):
                d[k] = v.isoformat()
        out.append(d)
    return {'statusCode': 200, 'headers': _cors_headers(), 'body': json.dumps(out, cls=CustomEncoder)}


def add_reply(conn, ticket_id, body, is_super):
    if not is_super:
        return {'statusCode': 403, 'headers': _cors_headers(), 'body': json.dumps({'message': '仅后台管理员可回复'})}
    content = (body.get('content') or body.get('body') or '').strip()[:5000]
    if not content:
        return {'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({'message': '请填写回复内容'})}
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM public.tickets WHERE id = %s;", (int(ticket_id),))
        if not cur.fetchone():
            return {'statusCode': 404, 'headers': _cors_headers(), 'body': json.dumps({'message': '工单不存在'})}
        cur.execute(
            "INSERT INTO public.ticket_replies (ticket_id, author_type, content) VALUES (%s, 'staff', %s) RETURNING id, created_at;",
            (int(ticket_id), content),
        )
        row = cur.fetchone()
        cur.execute("UPDATE public.tickets SET status = 'answered', updated_at = CURRENT_TIMESTAMP WHERE id = %s;", (int(ticket_id),))
        conn.commit()
    out = {'id': row['id'], 'created_at': row['created_at'].isoformat() if row.get('created_at') else None}
    return {'statusCode': 201, 'headers': _cors_headers(), 'body': json.dumps(out, cls=CustomEncoder)}


def update_status(conn, ticket_id, body, is_super):
    if not is_super:
        return {'statusCode': 403, 'headers': _cors_headers(), 'body': json.dumps({'message': '仅后台管理员可更新状态'})}
    status = (body.get('status') or '').strip()[:50]
    if status not in ('open', 'answered', 'closed'):
        return {'statusCode': 400, 'headers': _cors_headers(), 'body': json.dumps({'message': '无效状态'})}
    with conn.cursor() as cur:
        cur.execute("UPDATE public.tickets SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s RETURNING id;", (status, int(ticket_id)))
        if not cur.fetchone():
            return {'statusCode': 404, 'headers': _cors_headers(), 'body': json.dumps({'message': '工单不存在'})}
        conn.commit()
    return {'statusCode': 200, 'headers': _cors_headers(), 'body': json.dumps({'message': '状态已更新', 'status': status})}
