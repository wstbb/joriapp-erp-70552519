# backend/lambda/layers/database_utils/db_utils.py
# [架构最终版] 此文件是数据库连接的唯一来源。
# 它现在提供三种连接方式：
# 1. get_db_connection: (安全) 用于需要身份验证的、租户隔离的操作，它会检查 JWT 并设置 search_path。
# 2. get_public_connection: (公共) 用于无需身份验证的公共数据查询，如获取租户列表。
# 3. get_tenant_db_connection: (租户直连) 用于在登录时，根据 schema 名称直接连接到特定租户的数据库以验证凭据。

import json
import os
import psycopg2
import jwt
from datetime import date, datetime
from decimal import Decimal

JWT_SECRET = os.environ.get("JWT_SECRET")

class CustomEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        if isinstance(obj, Decimal):
            return float(obj)
        return super(CustomEncoder, self).default(obj)

# [新增] 用于登录流程的租户直连函数
def get_tenant_db_connection(tenant_schema):
    """根据给定的 schema 名称，建立一个直连到该租户数据库的连接。"""
    if not tenant_schema or not tenant_schema.startswith('tenant_'):
        print(f"[SECURITY_ERROR] 无效或危险的 schema 名称: {tenant_schema}")
        return None
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            dbname=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            sslmode=os.environ.get('DB_SSL_MODE', 'prefer'),
            # [关键] 直接将会话的 search_path 设置为指定的租户 schema
            options=f'-c search_path={tenant_schema},public'
        )
        return conn
    except Exception as e:
        print(f"[DB_ERROR] 在 get_tenant_db_connection 中出现错误: {e}")
        return None

def get_public_connection():
    """建立一个指向 public schema 的、无需认证的数据库连接。"""
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            dbname=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            sslmode=os.environ.get('DB_SSL_MODE', 'prefer'),
            options='-c search_path=public'
        )
        return conn
    except Exception as e:
        print(f"[DB_ERROR] 在 get_public_connection 中出现错误: {e}")
        return None

def get_db_connection(event):
    """
    建立一个安全的、经过身份验证的数据库连接，并根据 JWT 设置租户隔离的 search_path。
    """
    conn = None
    try:
        conn = psycopg2.connect(
            host=os.environ.get('DB_HOST'),
            port=os.environ.get('DB_PORT'),
            dbname=os.environ.get('DB_NAME'),
            user=os.environ.get('DB_USER'),
            password=os.environ.get('DB_PASSWORD'),
            sslmode=os.environ.get('DB_SSL_MODE', 'prefer')
        )

        headers = {k.lower(): v for k, v in event.get('headers', {}).items()}
        auth_header = headers.get('authorization', '')
        
        if not auth_header.startswith('Bearer '):
            raise ValueError("无效或缺失的 Authorization 请求头")
        
        token = auth_header.split(' ')[1]
        payload = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])

        with conn.cursor() as cur:
            if payload.get('is_super_admin'):
                cur.execute("SET search_path TO public;")
            elif 'tenant_id' in payload:
                tenant_schema = f"tenant_{payload['tenant_id']}"
                cur.execute("SET search_path TO %s, public;", (tenant_schema,))
            else:
                raise ValueError("令牌缺少必要的声明 (tenant_id 或 is_super_admin)")
        return conn

    except (jwt.ExpiredSignatureError, jwt.InvalidTokenError, ValueError) as e:
        print(f"[AUTH_ERROR] 在 get_db_connection 中出现认证/授权错误: {e}")
        if conn:
            conn.close()
        return None
    except Exception as e:
        print(f"[DB_ERROR] 在 get_db_connection 中出现数据库错误: {e}")
        if conn:
            conn.close()
        return None

def build_response(status_code, body, methods='*', headers=None, encoder=None):
    """
    构建一个标准的 API Gateway 代理响应。
    """
    response_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': methods,
        'Access-Control-Allow-Headers': 'Content-Type,Authorization'
    }
    if headers:
        response_headers.update(headers)
    
    return {
        'statusCode': status_code,
        'headers': response_headers,
        'body': json.dumps(body, cls=encoder)
    }
