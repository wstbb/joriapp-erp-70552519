# backend/lambda/auth/auth.py

# ====================================================================
# == [最终版] 认证服务: 安全、多租户、云原生                       ==
# ====================================================================
#
# 此 Lambda 函数作为整个系统的统一认证入口，处理两种截然不同的
# 登录流程：
#
# 1. 租户用户登录 (当请求体包含 `tenantDomain`):
#    - 通过公共连接查询 `public.tenants` 表，找到租户的 schema。
#    - 使用 `get_tenant_db_connection` 直连到租户的数据库。
#    - 验证用户凭据并颁发一个标准的、有租户范围的 JWT。
#
# 2. 超级管理员登录 (当请求体不含 `tenantDomain`):
#    - 从环境变量中获取 `SUPER_ADMIN_SECRET_ARN`。
#    - 调用 AWS Secrets Manager (使用 boto3) 来获取密码。
#    - [核心特性: 自播种] 首次运行时，它会获取明文密码，
#      用 bcrypt 将其哈希，然后立即用哈希值更新回 Secrets Manager，
#      实现安全的自动化密码初始化。
#    - 验证凭据并颁发一个特殊的、有超级管理员权限的 JWT。
#
# 这个最终设计实现了安全性、可管理性和清晰架构的完美平衡。
#
# ====================================================================

import json
import os
import bcrypt
import jwt
import psycopg2
import boto3 # 用于与 AWS Secrets Manager 交互
from datetime import datetime, timedelta

# 从 Lambda Layer 导入我们的数据库工具
from db_utils import build_response, get_public_connection, get_tenant_db_connection

# 全局常量
JWT_SECRET = os.environ.get("JWT_SECRET")
SUPER_ADMIN_USERNAME = "superadmin" # 预定义的超级管理员用户名
SUPER_ADMIN_SECRET_ARN = os.environ.get("SUPER_ADMIN_SECRET_ARN")

# 初始化 AWS 客户端
secrets_manager_client = boto3.client('secretsmanager')

def get_super_admin_password_hash():
    """安全地从 AWS Secrets Manager 获取密码，并实现自播种逻辑。"""
    try:
        # 1. 从 Secrets Manager 获取密钥
        get_secret_value_response = secrets_manager_client.get_secret_value(
            SecretId=SUPER_ADMIN_SECRET_ARN
        )
        secret = get_secret_value_response['SecretString']

        # 2. [自播种逻辑] 检查它是否已经是 bcrypt 哈希
        if secret.startswith('$2b$'):
            return secret.encode('utf-8') # 如果是哈希，直接返回
        else:
            # 3. 如果不是哈希 (即，是首次运行的明文密码)
            print("[INFO] 检测到明文密码，正在执行首次哈希和存储...")
            plaintext_password = secret.encode('utf-8')
            hashed_password = bcrypt.hashpw(plaintext_password, bcrypt.gensalt())

            # 4. 立即用哈希值覆盖掉 Secrets Manager 中的明文
            secrets_manager_client.update_secret(
                SecretId=SUPER_ADMIN_SECRET_ARN,
                SecretString=hashed_password.decode('utf-8')
            )
            print("[SUCCESS] 密码已成功哈希并安全存储。明文已销毁。")
            return hashed_password

    except Exception as e:
        print(f"[FATAL_ERROR] 无法从 Secrets Manager 获取或处理超级管理员密码: {e}")
        return None

def super_admin_login(username, password):
    """处理超级管理员登录逻辑。"""
    if username != SUPER_ADMIN_USERNAME:
        return build_response(401, {"message": "无效的凭据"})

    password_hash = get_super_admin_password_hash()
    if not password_hash:
        return build_response(500, {"message": "无法验证超级管理员: 内部配置错误"})

    if bcrypt.checkpw(password.encode('utf-8'), password_hash):
        # 密码正确，生成超级管理员 JWT
        payload = {
            "username": username,
            "is_super_admin": True,
            "exp": datetime.utcnow() + timedelta(hours=8) 
        }
        token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
        return build_response(200, {"token": token, "is_super_admin": True})
    else:
        return build_response(401, {"message": "无效的凭据"})

def tenant_user_login(tenant_domain, email, password):
    """处理租户用户登录逻辑。"""
    public_conn = None
    tenant_conn = None
    try:
        # 1. 连接到 public schema 以查找租户
        public_conn = get_public_connection()
        if not public_conn:
            return build_response(503, {"message": "无法连接到认证服务"})

        with public_conn.cursor() as cur:
            cur.execute(
                "SELECT schema_name, id, status FROM public.tenants WHERE domain = %s;", 
                (tenant_domain,)
            )
            tenant_data = cur.fetchone()
        
        if not tenant_data:
            return build_response(404, {"message": f"域为 '{tenant_domain}' 的租户不存在"})
        
        schema_name, tenant_id, status = tenant_data
        if status != 'active':
            return build_response(403, {"message": f"租户 '{tenant_domain}' 当前未激活"})

        # 2. 直连到租户的 schema 以验证用户
        tenant_conn = get_tenant_db_connection(schema_name)
        if not tenant_conn:
             return build_response(503, {"message": "无法连接到租户数据库"})

        with tenant_conn.cursor() as cur:
            cur.execute("SELECT id, password_hash FROM users WHERE email = %s;", (email,))
            user_data = cur.fetchone()

        if not user_data:
            return build_response(401, {"message": "无效的凭据"})
        
        user_id, password_hash = user_data

        # 3. 验证密码并颁发 JWT
        if bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8')):
            payload = {
                "user_id": user_id,
                "tenant_id": tenant_id,
                "exp": datetime.utcnow() + timedelta(hours=24)
            }
            token = jwt.encode(payload, JWT_SECRET, algorithm="HS256")
            return build_response(200, {"token": token})
        else:
            return build_response(401, {"message": "无效的凭据"})

    finally:
        if public_conn: public_conn.close()
        if tenant_conn: tenant_conn.close()

def handler(event, context):
    """Lambda 函数的主处理程序。"""
    try:
        body = json.loads(event.get('body', '{}'))
        tenant_domain = body.get('tenantDomain')
        email = body.get('email')
        password = body.get('password')
        username = body.get('username') # 主要用于超级管理员

        # 根据是否存在 tenantDomain 来路由到不同的登录逻辑
        if tenant_domain:
            if not email or not password:
                return build_response(400, {"message": "租户登录需要 'email' 和 'password'"})
            return tenant_user_login(tenant_domain, email, password)
        else:
            if not username or not password:
                 return build_response(400, {"message": "超级管理员登录需要 'username' 和 'password'"})
            return super_admin_login(username, password)

    except json.JSONDecodeError:
        return build_response(400, {"message": "无效的 JSON 请求体"})
    except Exception as e:
        print(f"[UNEXPECTED_ERROR] 在 handler 中出现意外错误: {e}")
        return build_response(500, {"message": "服务器内部错误"})
