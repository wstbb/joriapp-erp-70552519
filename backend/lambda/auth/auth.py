# backend/lambda/auth/auth.py

# ===================================================================
# == [V2 修复版] 认证服务: 修正租户登录字段                    ==
# ===================================================================
#
# 此版本修复了租户登录时的核心错误:
#
# 1. **数据库字段修正**:
#    - `tenant_user_login` 函数中，查询 users 表的 SQL 语句，
#      已将 `WHERE username = %s` 修正为 `WHERE name = %s`。
#    - 从数据库记录中提取用户信息时，已将 `user_record['username']`
#      修正为 `user_record['name']`。
#
# ===================================================================

import json
import os
import bcrypt
import jwt
import psycopg2
import psycopg2.extras # 导入DictCursor
import boto3
from datetime import datetime, timedelta

# 从 Lambda Layer 导入我们的数据库工具
from db_utils import build_response, get_public_connection, get_tenant_db_connection

# 全局常量
JWT_SECRET = os.environ.get("JWT_SECRET")
SUPER_ADMIN_USERNAME = "superadmin"
SUPER_ADMIN_SECRET_ARN = os.environ.get("SUPER_ADMIN_SECRET_ARN")

# 初始化 AWS 客户端
secrets_manager_client = boto3.client('secretsmanager')

def get_super_admin_password_hash():
    """安全地从 AWS Secrets Manager 获取密码，并实现自播种逻辑。"""
    try:
        get_secret_value_response = secrets_manager_client.get_secret_value(
            SecretId=SUPER_ADMIN_SECRET_ARN
        )
        secret_string = get_secret_value_response['SecretString']
        secret_data = json.loads(secret_string)
        password = secret_data['password']

        if password.startswith('$2b$'):
            return password.encode('utf-8')
        else:
            print("[INFO] 检测到明文密码，正在执行首次哈希和更新...")
            plaintext_password = password.encode('utf-8')
            hashed_password = bcrypt.hashpw(plaintext_password, bcrypt.gensalt())
            
            secret_data['password'] = hashed_password.decode('utf-8')

            secrets_manager_client.update_secret(
                SecretId=SUPER_ADMIN_SECRET_ARN,
                SecretString=json.dumps(secret_data)
            )
            print("[SUCCESS] 密码已成功哈希并安全存储。")
            return hashed_password

    except Exception as e:
        print(f"[FATAL_ERROR] 无法从 Secrets Manager 获取或处理超级管理员密码: {e}")
        return None

def super_admin_login(username, password):
    """处理超级管理员登录逻辑, 返回统一的 {token, user} 对象。"""
    if username != SUPER_ADMIN_USERNAME:
        return build_response(401, {"message": "无效的凭据"})

    password_hash = get_super_admin_password_hash()
    if not password_hash:
        return build_response(500, {"message": "无法验证超级管理员: 内部配置错误"})

    if bcrypt.checkpw(password.encode('utf-8'), password_hash):
        user_object = {
            "id": "superadmin",
            "username": username,
            "is_super_admin": True,
            "email": "superadmin@internal.system"
        }
        payload = {
            "username": username,
            "is_super_admin": True,
            "exp": datetime.utcnow() + timedelta(hours=8) 
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return build_response(200, {"token": token, "user": user_object})
    else:
        return build_response(401, {"message": "无效的凭据"})

def tenant_user_login(tenant_domain, username, password):
    """处理租户用户登录逻辑, 使用 name 字段并返回统一的 {token, user} 对象。"""
    # ==================== [START DEBUG LOGGING] ====================
    print(f"[DEBUG] tenant_user_login: 收到请求: tenant_domain='{tenant_domain}', username='{username}', password='{password}'")
    # ===================== [END DEBUG LOGGING] =====================
    public_conn = None
    tenant_conn = None
    try:
        public_conn = get_public_connection()
        if not public_conn:
            # ==================== [START DEBUG LOGGING] ====================
            print("[ERROR] tenant_user_login: get_public_connection() 返回了 None。")
            # ===================== [END DEBUG LOGGING] =====================
            return build_response(503, {"message": "无法连接到认证服务"})

        with public_conn.cursor() as cur:
            cur.execute("SELECT schema_name, id, status FROM public.tenants WHERE domain = %s;", (tenant_domain,))
            tenant_data = cur.fetchone()
        
        if not tenant_data:
            # ==================== [START DEBUG LOGGING] ====================
            print(f"[ERROR] tenant_user_login: 在 public.tenants 中未找到域为 '{tenant_domain}' 的租户。")
            # ===================== [END DEBUG LOGGING] =====================
            return build_response(404, {"message": f"域为 '{tenant_domain}' 的租户不存在"})
        
        schema_name, tenant_id, status = tenant_data
        # ==================== [START DEBUG LOGGING] ====================
        print(f"[DEBUG] tenant_user_login: 成功从 public.tenants 获取到租户信息. Schema='{schema_name}', ID='{tenant_id}', 状态='{status}'")
        # ===================== [END DEBUG LOGGING] =====================

        if status != 'active':
            # ==================== [START DEBUG LOGGING] ====================
            print(f"[ERROR] tenant_user_login: 租户 '{tenant_domain}' 状态为 '{status}', 非 'active'。")
            # ===================== [END DEBUG LOGGING] =====================
            return build_response(403, {"message": f"租户 '{tenant_domain}' 当前未激活"})

        tenant_conn = get_tenant_db_connection(schema_name)
        if not tenant_conn:
             # ==================== [START DEBUG LOGGING] ====================
             print(f"[ERROR] tenant_user_login: get_tenant_db_connection('{schema_name}') 返回了 None。")
             # ===================== [END DEBUG LOGGING] =====================
             return build_response(503, {"message": "无法连接到租户数据库"})

        with tenant_conn.cursor() as cur:
            cur.execute(f'''SET search_path TO \"{schema_name}\", public;''')
            # ==================== [START DEBUG LOGGING] ====================
            print(f"[DEBUG] tenant_user_login: 已为当前连接成功执行 SET search_path TO \"{schema_name}\"。")
            # ===================== [END DEBUG LOGGING] =====================

        with tenant_conn.cursor(cursor_factory=psycopg2.extras.DictCursor) as cur:
            # [修正] 使用 `name` 而非 `username` 进行查询
            cur.execute("SELECT * FROM users WHERE name = %s;", (username,))
            user_record = cur.fetchone()

        if not user_record:
            # ==================== [START DEBUG LOGGING] ====================
            print(f"[ERROR] tenant_user_login: 在 schema '{schema_name}' 中执行查询后，未能找到用户 '{username}'。user_record is None。")
            # ===================== [END DEBUG LOGGING] =====================
            return build_response(401, {"message": "无效的凭据"})
        
        # ==================== [START DEBUG LOGGING] ====================
        print(f"[DEBUG] tenant_user_login: 成功找到用户记录: {dict(user_record)}")
        # ===================== [END DEBUG LOGGING] =====================
        
        password_hash = user_record['password_hash']
        # ==================== [START DEBUG LOGGING] ====================
        print(f"[DEBUG] tenant_user_login: 用于校验的 password (明文): '{password}'")
        print(f"[DEBUG] tenant_user_login: 用于校验的 password_hash (来自DB): '{password_hash}'")
        # ===================== [END DEBUG LOGGING] =====================

        is_password_correct = bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        # ==================== [START DEBUG LOGGING] ====================
        print(f"[DEBUG] tenant_user_login: bcrypt.checkpw 密码比对结果: {is_password_correct}")
        # ===================== [END DEBUG LOGGING] =====================

        if is_password_correct:
            user_object = {
                "id": user_record["id"],
                "username": user_record["name"], # [修正] 从 `name` 字段获取用户名
                "email": user_record["email"],
                "createdAt": user_record["created_at"].isoformat()
            }
            payload = {
                "user_id": user_record["id"],
                "tenant_id": tenant_id,
                "username": user_record["name"], # [修正] 从 `name` 字段获取用户名
                "exp": datetime.utcnow() + timedelta(hours=24)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
            return build_response(200, {"token": token, "user": user_object})
        else:
            return build_response(401, {"message": "无效的凭据"})

    finally:
        if public_conn: public_conn.close()
        if tenant_conn: tenant_conn.close()

def handler(event, context):
    """Lambda 函数的主处理程序，采用正确的登录逻辑路由。"""
    try:
        body = json.loads(event.get('body', '{}'))
        password = body.get('password')
        username = body.get('username') 
        tenant_domain = body.get('tenantDomain')
        
        # 1. 优先判断是否为超级管理员登录
        if username == SUPER_ADMIN_USERNAME:
            print(f"[INFO] 路由到超级管理员登录, 用户: {username}")
            if not password:
                return build_response(400, {"message": "超级管理员登录需要 'password'"})
            return super_admin_login(username, password)
        
        # 2. 如果不是超级管理员, 则继续处理租户登录
        elif tenant_domain:
            print(f"[INFO] 路由到租户登录, 租户: {tenant_domain}, 用户: {username}")
            if not username or not password:
                return build_response(400, {"message": "租户登录需要 'username' 和 'password'"})
            return tenant_user_login(tenant_domain, username, password)

        # 3. 如果两种都不是, 则是无效请求
        else:
            return build_response(400, {"message": "无效的登录请求，需要提供 'tenantDomain' 或以 'superadmin' 用户名登录"})

    except json.JSONDecodeError:
        return build_response(400, {"message": "无效的 JSON 请求体"})
    except Exception as e:
        print(f"[UNEXPECTED_ERROR] 在 handler 中出现意外错误: {e}")
        return build_response(500, {"message": "服务器内部错误"})
