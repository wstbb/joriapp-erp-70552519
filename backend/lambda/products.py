
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from auth import require_permission

# --- 数据库连接 (保持不变) ---
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)

# --- 主路由与分发 --- 
def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    router = path_parts[0]
    entity_id = path_parts[1] if len(path_parts) > 1 else None

    # 根据路径路由到商品或分类处理器
    if router == 'products':
        if method == 'GET':
            return get_products(event, context) # 读取操作，无需权限
        elif method == 'POST':
            return create_product(event, context)
        elif method == 'PUT':
            return update_product(event, context)
        elif method == 'DELETE':
            return delete_product(event, context)
            
    elif router == 'categories':
        # 分类操作的路由（为简化，暂时不加权限）
        pass 

    return {'statusCode': 405, 'body': json.dumps({'error': '不支持的方法'})}

# --- 商品CRUD的具体实现 ---

def get_products(event, context):
    """获取商品列表或单个商品（开放权限）。"""
    # ... (此处省略了具体的数据库查询代码，与原始版本相同) ...
    return {'statusCode': 200, 'body': json.dumps([])}

@require_permission('products.create')
def create_product(event, context):
    """创建一个新商品，需要 'products.create' 权限。"""
    body = json.loads(event.get('body', '{}'))
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        keys = ['category_id', 'name', 'sku', 'specs', 'unit', 'base_price', 'cost_price']
        values = [body.get(k) for k in keys]
        cursor.execute("INSERT INTO products (...) VALUES (...) RETURNING *", values)
        new_product = cursor.fetchone()
        conn.commit()
        return {'statusCode': 201, 'body': json.dumps(new_product, default=str)}
    finally:
        cursor.close()
        conn.close()

@require_permission('products.update')
def update_product(event, context):
    """更新一个商品，需要 'products.update' 权限。"""
    # ... (此处省略了具体的数据库更新代码) ...
    return {'statusCode': 200, 'body': json.dumps({'message':'更新成功'})}

@require_permission('products.delete')
def delete_product(event, context):
    """删除一个商品，需要 'products.delete' 权限。"""
    # ... (此处省略了具体的数据库删除代码) ...
    return {'statusCode': 200, 'body': json.dumps({'message':'删除成功'})}

# --- 分类处理器 (保持不变) ---
def handle_categories(method, category_id, body):
    # ... (省略) ...
    pass
