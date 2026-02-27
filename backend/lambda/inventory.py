
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    return psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)

def lambda_handler(event, context):
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    body = json.loads(event.get('body', '{}'))
    query_params = event.get('queryStringParameters', {})

    router = path_parts[1] if len(path_parts) > 1 else ''
    entity_id = path_parts[2] if len(path_parts) > 2 else None

    if router == 'warehouses':
        return handle_warehouses(method, entity_id, body)
    elif router == 'stocks':
        return handle_stocks(method, body, query_params)
    elif router == 'logs':
        return handle_inventory_logs(method, query_params)
    elif router == 'transfer':
        return handle_stock_transfer(method, body)
    elif router == 'audits':
        return handle_inventory_audits(method, entity_id, body)
    elif router == 'stats':
        return get_inventory_stats(query_params)

    return {'statusCode': 404, 'body': json.dumps({'error': '资源未找到'})}

def get_inventory_stats(query_params):
    """获取库存统计数据, 支持按仓库过滤。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    warehouse_id = query_params.get('warehouse_id')

    try:
        # 总SKU数
        sku_query = "SELECT COUNT(DISTINCT product_id) as total_sku FROM stocks"
        cursor.execute(sku_query + (f" WHERE warehouse_id = '{warehouse_id}'" if warehouse_id else ''))
        total_sku = cursor.fetchone()['total_sku']

        # 库存总价值
        value_query = """
            SELECT SUM(s.quantity * p.cost_price) as total_value
            FROM stocks s
            JOIN products p ON s.product_id = p.id
        """
        cursor.execute(value_query + (f" WHERE s.warehouse_id = '{warehouse_id}'" if warehouse_id else ''))
        total_value = cursor.fetchone()['total_value'] or 0

        # 库存健康度
        health_query = """
            SELECT 
                p.id, 
                SUM(s.quantity) as total_quantity,
                p.safety_stock_level
            FROM stocks s
            JOIN products p ON s.product_id = p.id
            GROUP BY p.id, p.safety_stock_level
        """
        cursor.execute(health_query)
        all_products = cursor.fetchall()

        health_stats = {'healthy': 0, 'low': 0, 'out': 0, 'dead': 0}
        for p in all_products:
            if p['total_quantity'] == 0:
                health_stats['out'] += 1
            elif p['total_quantity'] < p['safety_stock_level']:
                health_stats['low'] += 1
            else:
                health_stats['healthy'] += 1 # 简化：此处未计算呆滞库存

        # 待办事项 (简化)
        inbound_query = "SELECT COUNT(*) as count FROM purchase_orders WHERE status = 'pending'"
        cursor.execute(inbound_query)
        inbound = cursor.fetchone()['count']

        outbound_query = "SELECT COUNT(*) as count FROM sales_orders WHERE status = 'pending'"
        cursor.execute(outbound_query)
        outbound = cursor.fetchone()['count']
        
        return {
            'statusCode': 200,
            'body': json.dumps({
                'totalSku': total_sku,
                'totalValue': float(total_value),
                'stockHealth': health_stats,
                'flow': {
                    'inbound': inbound,
                    'outbound': outbound
                },
                'audit': {'urgent': 0, 'coverage': 0} # 简化
            })
        }
    finally:
        cursor.close()
        conn.close()

# ... (handle_warehouses, handle_inventory_logs - 保持不变) ...

def handle_stocks(method, body, query_params):
    """处理带货架信息的实时库存查询和调整。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            # 查询: /inventory/stocks?warehouse_id=...&product_id=...
            query = "SELECT s.*, p.name as product_name, p.sku, p.spec, p.image_url as img, p.category, w.name as warehouse_name FROM stocks s JOIN products p ON s.product_id = p.id JOIN warehouses w ON s.warehouse_id = w.id"
            filters = []
            values = []
            for key in ['warehouse_id', 'product_id', 'location_code']:
                if query_params.get(key):
                    filters.append(f"s.{key} = %s")
                    values.append(query_params[key])
            if filters:
                query += " WHERE " + " AND ".join(filters)
            cursor.execute(query, tuple(values))
            return {'statusCode': 200, 'body': json.dumps(cursor.fetchall(), default=str)}

        elif method == 'POST': # 直接调整指定货架的库存
            # body: { warehouse_id, product_id, location_code, quantity }
            keys = ['warehouse_id', 'product_id', 'location_code', 'quantity']
            w_id, p_id, loc, qty = [body.get(k) for k in keys]

            cursor.execute("SELECT quantity FROM stocks WHERE warehouse_id=%s AND product_id=%s AND location_code=%s", (w_id, p_id, loc))
            current_qty = (cursor.fetchone() or {}).get('quantity', 0)
            change_qty = qty - current_qty

            upsert_query = """
                INSERT INTO stocks (warehouse_id, product_id, location_code, quantity)
                VALUES (%s, %s, %s, %s)
                ON CONFLICT (warehouse_id, product_id, location_code) 
                DO UPDATE SET quantity = %s; """
            cursor.execute(upsert_query, (w_id, p_id, loc, qty, qty))

            # 记录盘点流水
            log_query = "INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type, reference_id) VALUES (%s, %s, %s, 'adjustment', NULL)"
            cursor.execute(log_query, (p_id, w_id, change_qty))
            
            conn.commit()
            return {'statusCode': 200, 'body': json.dumps({'message': '库存调整成功'})}

    finally:
        cursor.close()
        conn.close()

def handle_stock_transfer(method, body):
    """处理带货架的仓库间库存调拨。"""
    # body: { product_id, from_warehouse_id, from_location_code, to_warehouse_id, to_location_code, quantity }
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        p_id, from_w, from_loc, to_w, to_loc, qty = [body.get(k) for k in ['product_id', 'from_warehouse_id', 'from_location_code', 'to_warehouse_id', 'to_location_code', 'quantity']]
        
        # 1. 检查源库存
        cursor.execute("SELECT quantity FROM stocks WHERE warehouse_id=%s AND product_id=%s AND location_code=%s", (from_w, p_id, from_loc))
        source_stock = cursor.fetchone()
        if not source_stock or source_stock['quantity'] < qty:
            return {'statusCode': 400, 'body': json.dumps({'error': '源货架库存不足'})}

        # 2. 减源库存
        cursor.execute("UPDATE stocks SET quantity = quantity - %s WHERE warehouse_id=%s AND product_id=%s AND location_code=%s", (qty, from_w, p_id, from_loc))
        
        # 3. 加目标库存 (upsert)
        cursor.execute("INSERT INTO stocks (warehouse_id, product_id, location_code, quantity) VALUES (%s, %s, %s, %s) ON CONFLICT (warehouse_id, product_id, location_code) DO UPDATE SET quantity = stocks.quantity + %s", (to_w, p_id, to_loc, qty, qty))

        # 4. 记录流水
        cursor.execute("INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type) VALUES (%s, %s, %s, 'transfer_out')", (p_id, from_w, -qty))
        cursor.execute("INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type) VALUES (%s, %s, %s, 'transfer_in')", (p_id, to_w, qty))

        conn.commit()
        return {'statusCode': 200, 'body': json.dumps({'message': '调拨成功'})}
    finally:
        cursor.close()
        conn.close()

# 新增：盘点任务管理
CREATE_AUDIT_TABLE_SQL = """
CREATE TABLE IF NOT EXISTS inventory_audits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    warehouse_id UUID REFERENCES warehouses(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, completed
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS inventory_audit_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    audit_id UUID REFERENCES inventory_audits(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id),
    location_code VARCHAR(100),
    expected_qty INT,
    counted_qty INT,
    difference INT
);
"""

def handle_inventory_audits(method, audit_id, body):
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 自动创建表
        cursor.execute(CREATE_AUDIT_TABLE_SQL)
        conn.commit()

        if method == 'POST': # 创建盘点单
            # body: { warehouse_id, items: [{product_id, location_code, counted_qty}] }
            w_id = body['warehouse_id']
            cursor.execute("INSERT INTO inventory_audits (warehouse_id, status) VALUES (%s, 'pending') RETURNING id", (w_id,))
            audit_id = cursor.fetchone()['id']

            for item in body['items']:
                p_id, loc, counted_qty = [item.get(k) for k in ['product_id', 'location_code', 'counted_qty']]
                cursor.execute("SELECT quantity FROM stocks WHERE warehouse_id=%s AND product_id=%s AND location_code=%s", (w_id, p_id, loc))
                expected_qty = (cursor.fetchone() or {}).get('quantity', 0)
                diff = counted_qty - expected_qty

                cursor.execute("INSERT INTO inventory_audit_items (audit_id, product_id, location_code, expected_qty, counted_qty, difference) VALUES (%s, %s, %s, %s, %s, %s)", (audit_id, p_id, loc, expected_qty, counted_qty, diff))

                # 更新库存并记录流水
                upsert_query = "INSERT INTO stocks (warehouse_id, product_id, location_code, quantity) VALUES (%s, %s, %s, %s) ON CONFLICT (warehouse_id, product_id, location_code) DO UPDATE SET quantity = %s;"
                cursor.execute(upsert_query, (w_id, p_id, loc, counted_qty, counted_qty))
                if diff != 0:
                    log_query = "INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type, reference_id) VALUES (%s, %s, %s, 'adjustment', %s)"
                    cursor.execute(log_query, (p_id, w_id, diff, audit_id))

            cursor.execute("UPDATE inventory_audits SET status = 'completed' WHERE id = %s", (audit_id,))
            conn.commit()
            return {'statusCode': 201, 'body': json.dumps({'audit_id': audit_id})}

        elif method == 'GET':
            # ... 查询盘点单逻辑 ...
            return {'statusCode': 200, 'body': json.dumps([])}

    finally:
        cursor.close()
        conn.close()
