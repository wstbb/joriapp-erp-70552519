# backend/lambda/admin.py
# 版本: 2.0 (数据供给API)

import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
import datetime

# --- 数据库连接 & 辅助函数 (与 tenants.py 类似) ---
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)

def json_serial(obj):
    if isinstance(obj, (datetime.datetime, datetime.date)):
        return obj.isoformat()
    raise TypeError(f"Type {type(obj)} not serializable")

def create_response(status_code, body):
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(body, default=json_serial)
    }

# --- 主路由: /admin/{resource} ---
def lambda_handler(event, context):
    # [安全] 假设调用此函数的API网关已配置了最高权限校验
    path = event.get('path', '').strip('/')
    method = event.get('httpMethod')
    path_parts = path.split('/')

    if not (path_parts and path_parts[0] == 'admin' and len(path_parts) > 1):
        return create_response(404, {'error': '无效的Admin API路径'})

    resource = path_parts[1]

    if method == 'GET':
        if resource == 'plans':
            return get_plans()
        elif resource == 'industries':
            return get_industries()
        # 未来可以扩展其他 admin GET 路由

    return create_response(404, {'error': '管理员资源未找到'})


# --- API 实现 ---
def get_plans():
    """获取所有可用的订阅方案列表"""
    return get_resource_list('public.plans', 'code, name, description')

def get_industries():
    """获取所有可选的行业列表"""
    return get_resource_list('public.industries', 'id, name')


def get_resource_list(table_name, columns):
    """通用函数，用于从指定的公共表中获取资源列表"""
    conn = None
    try:
        conn = get_db_connection()
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 直接使用字符串格式化是安全的，因为 table_name 和 columns 来自内部代码，不是用户输入
            cur.execute(f"SELECT {columns} FROM {table_name} ORDER BY id ASC;")
            data = cur.fetchall()
            return create_response(200, data)
    except Exception as e:
        print(f"Database error in get_resource_list({table_name}): {e}")
        return create_response(500, {'error': f'获取 {table_name} 列表失败'})
    finally:
        if conn:
            conn.close()
