
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from auth import authorize

# --- 数据库连接 ---
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)


@authorize(required_plan=['pro', 'enterprise'], required_roles=['admin', 'warehouse_manager'], required_client='app')
def lambda_handler(event, context):
    """专为移动端App设计的库存查询API。"""
    query_params = event.get('queryStringParameters', {}) or {}
    sku = query_params.get('sku')

    if not sku:
        return {'statusCode': 400, 'body': json.dumps({'error': '必须提供SKU进行查询'})}

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 一个高效的查询，用于快速返回扫码所需的核心信息
        cursor.execute(
            """SELECT p.name, p.sku, p.specs, p.unit, l.current_stock, l.location_code
               FROM products p
               LEFT JOIN ( SELECT product_id, SUM(change_quantity) as current_stock, MAX(location_code) as location_code
                           FROM inventory_logs GROUP BY product_id ) l ON p.id = l.product_id
               WHERE p.sku = %s""",
            (sku,)
        )
        product_info = cursor.fetchone()
        if not product_info:
            return {'statusCode': 404, 'body': json.dumps({'error': '未找到该SKU对应的商品'})}

        return {'statusCode': 200, 'body': json.dumps(product_info, default=str)}

    except (Exception, psycopg2.Error) as error:
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库查询失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

