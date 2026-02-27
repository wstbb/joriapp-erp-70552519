
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# --- 数据库连接 (保持不变) ---
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)

# --- 主路由与分发 --- 
def lambda_handler(event, context):
    # [安全] 此处应有最高权限校验
    path = event.get('path', '').strip('/')
    method = event.get('httpMethod')
    path_parts = path.split('/')
    body = json.loads(event.get('body', '{}'))

    # 路由: /admin/tenants/{id}/{action}
    if path_parts[0] == 'admin' and path_parts[1] == 'tenants':
        tenant_id = path_parts[2] if len(path_parts) > 2 else None
        action = path_parts[3] if len(path_parts) > 3 else None

        if method == 'GET':
            return get_tenants(tenant_id)
        elif method == 'POST' and not tenant_id:
            return create_tenant(body)
        elif method == 'PUT' and tenant_id and action == 'status':
            return update_tenant_status(tenant_id, body)
        elif method == 'PUT' and tenant_id and action == 'plan':
            return update_tenant_plan(tenant_id, body)

    return {'statusCode': 404, 'body': json.dumps({'error': '管理员资源或操作未找到'})}

# --- 具体的租户管理实现 ---

def get_tenants(tenant_id):
    # ... (与之前版本相同的获取租户列表或详情的代码) ...
    return {'statusCode': 200, 'body': json.dumps([])}

def create_tenant(body):
    # ... (与之前版本相同的创建新租户的代码) ...
    return {'statusCode': 201, 'body': json.dumps({'message': '租户已创建'})}

def update_tenant_status(tenant_id, body):
    """锁定或解锁租户。 Body: {"status": "locked" | "active"}"""
    new_status = body.get('status')
    if new_status not in ['active', 'locked']:
        return {'statusCode': 400, 'body': json.dumps({'error': '无效的状态'})}
    
    # ... (此处省略数据库UPDATE tenants SET status=%s WHERE id=%s的代码) ...
    return {'statusCode': 200, 'body': json.dumps({'message': f'租户 {tenant_id} 状态已更新为 {new_status}'})}


def update_tenant_plan(tenant_id, body):
    """更新租户的订阅方案。 Body: {"plan": "basic" | "pro" | "enterprise"}"""
    new_plan = body.get('plan')
    if new_plan not in ['basic', 'pro', 'enterprise']:
        return {'statusCode': 400, 'body': json.dumps({'error': '无效的订阅方案'})}

    # ... (此处省略数据库UPDATE tenants SET plan=%s WHERE id=%s的代码) ...
    return {'statusCode': 200, 'body': json.dumps({'message': f'租户 {tenant_id} 订阅方案已更新为 {new_plan}'})}

