# backend/lambda/users/users.py
# 修正了 Lambda Layer 的导入路径；支持 POST 创建用户并校验方案用户数限额

import json
import os
import jwt
import bcrypt
from psycopg2.extras import RealDictCursor

# 从 Lambda Layer 直接导入共享模块
from db_utils import get_db_connection, build_response, CustomEncoder

JWT_SECRET = os.environ.get("JWT_SECRET")

def _decode_jwt(event):
    """Decodes the JWT from the request headers, returns payload or None."""
    try:
        auth_header = event.get('headers', {}).get('Authorization', '')
        if not auth_header.startswith('Bearer '):
            return None
        token = auth_header.split(' ')[1]
        decoded = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
        return decoded
    except jwt.ExpiredSignatureError:
        raise Exception("Token has expired")
    except jwt.InvalidTokenError:
        raise Exception("Invalid token")

def handler(event, context):
    """
    Lambda handler for user CRUD operations. Uses the shared db_utils layer.
    """
    # 预检请求直接通过
    if event.get('requestContext', {}).get('http', {}).get('method') == 'OPTIONS':
        return build_response(204, {})

    conn = None
    try:
        # 1. 认证与授权
        jwt_payload = _decode_jwt(event)
        if not jwt_payload:
            return build_response(401, {"message": "未提供有效的认证令牌"})

        # 2. 获取数据库连接 (get_db_connection 现在会处理多租户逻辑)
        conn = get_db_connection(event)
        if not conn:
            return build_response(403, {"message": "无法确定租户或访问被拒绝"})

        # 3. 路由和业务逻辑
        method = event.get('requestContext', {}).get('http', {}).get('method')
        path_parameters = event.get('pathParameters') or {}
        user_id_from_path = path_parameters.get('userId')

        with conn.cursor(cursor_factory=RealDictCursor) as cur:

            # 权限检查: 只有 'admin' 角色可以执行某些操作
            is_admin = jwt_payload.get('role') == 'admin'
            current_user_id = jwt_payload.get('userId')

            # --- 业务逻辑 --- #

            # GET /users (获取用户列表)
            if method == 'GET' and not user_id_from_path:
                if not is_admin:
                    return build_response(403, {"message": "权限不足，只有管理员才能查看用户列表。"})
                
                # 管理员可以查看其租户下的所有用户
                cur.execute("SELECT id, name, email, role, is_active, created_at FROM users ORDER BY created_at DESC")
                users = cur.fetchall()
                return build_response(200, users, encoder=CustomEncoder)

            # GET /users/{userId} (获取单个用户信息)
            elif method == 'GET' and user_id_from_path:
                # 管理员可以查看任何用户，普通用户只能查看自己
                if not is_admin and str(current_user_id) != user_id_from_path:
                    return build_response(403, {"message": "权限不足，您只能查看自己的信息。"})

                cur.execute("SELECT id, name, email, role, is_active, created_at FROM users WHERE id = %s", (user_id_from_path,))
                user = cur.fetchone()
                
                if user:
                    return build_response(200, user, encoder=CustomEncoder)
                else:
                    return build_response(404, {"message": "用户未找到。"})
            
            # POST /users (创建用户，仅管理员；校验方案 max_users 限额)
            elif method == 'POST' and not user_id_from_path:
                if not is_admin:
                    return build_response(403, {"message": "权限不足，只有管理员才能创建用户。"})
                body = json.loads(event.get("body") or "{}")
                name = (body.get("name") or "").strip()
                email = (body.get("email") or "").strip()
                password = body.get("password") or ""
                role = (body.get("role") or "staff").strip()
                if not name or not email or not password:
                    return build_response(400, {"message": "缺少 name、email 或 password。"})
                tenant_id = jwt_payload.get("tenant_id")
                if tenant_id is not None:
                    cur.execute(
                        "SELECT p.max_users FROM public.tenants t LEFT JOIN public.plans p ON t.plan_id = p.id WHERE t.id = %s",
                        (tenant_id,),
                    )
                    row = cur.fetchone()
                    max_users = row.get("max_users") if row else None
                    if max_users is not None:
                        cur.execute("SELECT count(*) AS c FROM users")
                        count = cur.fetchone()["c"]
                        if count >= max_users:
                            return build_response(400, {"message": f"当前方案最多允许 {max_users} 个用户，已达上限。"})
                hashed = bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")
                cur.execute(
                    "INSERT INTO users (name, email, password_hash, role) VALUES (%s, %s, %s, %s) RETURNING id, name, email, role, created_at",
                    (name, email, hashed, role),
                )
                new_user = cur.fetchone()
                conn.commit()
                return build_response(201, dict(new_user), encoder=CustomEncoder)

            else:
                return build_response(405, {"message": f"不支持的 HTTP 方法: {method}"})

    except Exception as e:
        print(f"发生未预期的错误: {e}")
        # 在实际生产中，避免暴露详细的错误信息
        return build_response(500, {"message": "服务器内部发生错误。"})
    finally:
        if conn:
            conn.close()
