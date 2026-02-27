# backend/lambda/users/users.py
# 修正了 Lambda Layer 的导入路径

import json
import os
import jwt
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
                cur.execute("SELECT id, name, email, role, created_at, last_login_at FROM users ORDER BY created_at DESC")
                users = cur.fetchall()
                return build_response(200, users, encoder=CustomEncoder)

            # GET /users/{userId} (获取单个用户信息)
            elif method == 'GET' and user_id_from_path:
                # 管理员可以查看任何用户，普通用户只能查看自己
                if not is_admin and str(current_user_id) != user_id_from_path:
                    return build_response(403, {"message": "权限不足，您只能查看自己的信息。"})

                cur.execute("SELECT id, name, email, role, created_at, last_login_at FROM users WHERE id = %s", (user_id_from_path,))
                user = cur.fetchone()
                
                if user:
                    return build_response(200, user, encoder=CustomEncoder)
                else:
                    return build_response(404, {"message": "用户未找到。"})
            
            # 其他方法 (POST, PUT, DELETE) 待实现

            else:
                return build_response(405, {"message": f"不支持的 HTTP 方法: {method}"})

    except Exception as e:
        print(f"发生未预期的错误: {e}")
        # 在实际生产中，避免暴露详细的错误信息
        return build_response(500, {"message": "服务器内部发生错误。"})
    finally:
        if conn:
            conn.close()
