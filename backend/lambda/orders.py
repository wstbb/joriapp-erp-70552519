
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

# 数据库连接信息
DB_HOST = os.environ.get('DB_HOST')
DB_USER = os.environ.get('DB_USER')
DB_PASSWORD = os.environ.get('DB_PASSWORD')
DB_NAME = os.environ.get('DB_NAME')

def get_db_connection():
    conn = psycopg2.connect(host=DB_HOST, user=DB_USER, password=DB_PASSWORD, dbname=DB_NAME)
    return conn

def lambda_handler(event, context):
    """主路由函数，根据路径和方法将请求分发到不同的订单处理函数。"""
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    
    body = json.loads(event.get('body', '{}'))

    # 路由: /orders, /orders/{id}, /orders/{id}/status
    if path_parts[0] == 'orders':
        order_id = path_parts[1] if len(path_parts) > 1 else None
        
        if order_id and len(path_parts) > 2 and path_parts[2] == 'status':
            return handle_order_status_update(order_id, body)
        elif order_id:
            return handle_single_order(method, order_id)
        else:
            return handle_multiple_orders(method, body, event.get('queryStringParameters', {}))

    return {'statusCode': 404, 'body': json.dumps({'error': '资源未找到'})}

def handle_multiple_orders(method, body, query_params):
    """处理订单的批量获取和创建。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            # 根据查询参数（如type, status）过滤订单
            query = "SELECT o.*, p.name as partner_name, u.name as user_name FROM orders o JOIN partners p ON o.partner_id = p.id JOIN users u ON o.user_id = u.id"
            filters = []
            values = []
            for key, value in query_params.items():
                if key in ['type', 'status', 'partner_id', 'user_id']:
                    filters.append(f"o.{key} = %s")
                    values.append(value)
            if filters:
                query += " WHERE " + " AND ".join(filters)
            
            cursor.execute(query, tuple(values))
            orders = cursor.fetchall()
            return {'statusCode': 200, 'body': json.dumps(orders, default=str)}

        elif method == 'POST':
            # 创建新订单
            # body: { type, partner_id, user_id, total_amount, items: [...] }
            order = body
            # 1. 插入主订单表
            cursor.execute(
                """INSERT INTO orders (type, partner_id, user_id, total_amount, status, order_no)
                   VALUES (%s, %s, %s, %s, 'draft', 'TEMP') RETURNING id""",
                (order['type'], order['partner_id'], order['user_id'], order['total_amount'])
            )
            order_id = cursor.fetchone()['id']
            
            # 2. 生成唯一的订单号 (例如: XS-20231027-0001)
            order_no = f"{order['type'].upper()[:2]}-{order_id.split('-')[0].upper()}"
            cursor.execute("UPDATE orders SET order_no = %s WHERE id = %s", (order_no, order_id))

            # 3. 插入订单明细表
            for item in order['items']:
                cursor.execute(
                    """INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (order_id, item['product_id'], item['quantity'], item['unit_price'], item['total_price'])
                )

            # [重要] 库存联动：如果是销售单，需检查并预扣库存
            if order['type'] == 'sales':
                # 此处应调用库存服务检查库存，为简化，我们暂时只记录
                # 在实际场景中，这里可能会触发一个“待出库”状态
                pass
                
            conn.commit()
            return {'statusCode': 201, 'body': json.dumps({'id': order_id, 'order_no': order_no})}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

def handle_single_order(method, order_id):
    """处理单个订单的获取和删除。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            # 获取订单主信息
            cursor.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
            order = cursor.fetchone()
            if not order:
                return {'statusCode': 404, 'body': json.dumps({'error': '订单未找到'})}
            
            # 获取订单明细
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
            order['items'] = cursor.fetchall()
            return {'statusCode': 200, 'body': json.dumps(order, default=str)}
        
        elif method == 'DELETE': # 通常是取消，而不是物理删除
            # 实际业务中很少物理删除，而是更新状态为 'cancelled'
            cursor.execute("UPDATE orders SET status = 'cancelled' WHERE id = %s RETURNING id", (order_id,))
            updated = cursor.fetchone()
            conn.commit()
            if updated:
                # [重要] 库存联动: 如果是已批准的销售单被取消，需要释放预扣的库存
                return {'statusCode': 200, 'body': json.dumps({'message': '订单已取消'})}
            else:
                return {'statusCode': 404, 'body': json.dumps({'error': '订单未找到'})}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

def handle_order_status_update(order_id, body):
    """处理订单状态的流转，这是工作流的核心。"""
    new_status = body.get('status')
    if not new_status:
        return {'statusCode': 400, 'body': json.dumps({'error': '缺少 status 字段'})}

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. 获取当前订单信息，特别是类型和当前状态
        cursor.execute("SELECT type, status FROM orders WHERE id = %s", (order_id,))
        order = cursor.fetchone()
        if not order:
            return {'statusCode': 404, 'body': json.dumps({'error': '订单未找到'})}

        # [工作流逻辑] 在这里可以添加复杂的逻辑，例如检查前置状态
        # if order['status'] != 'pending_approval' and new_status == 'approved':
        #     return {'statusCode': 400, 'body': json.dumps({'error': '订单状态不正确，无法批准'})}

        # 2. 更新订单状态
        cursor.execute("UPDATE orders SET status = %s, updated_at = CURRENT_TIMESTAMP WHERE id = %s", (new_status, order_id))

        # 3. [核心] 根据新状态触发库存变动
        if new_status == 'completed':
            cursor.execute("SELECT * FROM order_items WHERE order_id = %s", (order_id,))
            items = cursor.fetchall()
            
            # 假设默认仓库ID为 'your_default_warehouse_id' (实际应从配置或订单中获取)
            warehouse_id = '00000000-0000-0000-0000-000000000001' # 临时硬编码

            for item in items:
                change_qty = item['quantity']
                log_type = ''

                if order['type'] == 'sales':
                    change_qty = -change_qty
                    log_type = 'outbound'
                elif order['type'] == 'purchase':
                    log_type = 'inbound'
                elif order['type'] == 'return_sales':
                    log_type = 'inbound'
                elif order['type'] == 'return_purchase':
                    change_qty = -change_qty
                    log_type = 'outbound'
                
                # 更新库存
                cursor.execute(
                    """INSERT INTO stocks (warehouse_id, product_id, quantity)
                       VALUES (%s, %s, %s)
                       ON CONFLICT (warehouse_id, product_id) DO UPDATE SET quantity = stocks.quantity + %s""",
                    (warehouse_id, item['product_id'], change_qty, change_qty)
                )
                # 记录流水
                cursor.execute(
                    """INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type, reference_id)
                       VALUES (%s, %s, %s, %s, %s)""",
                    (item['product_id'], warehouse_id, change_qty, log_type, order_id)
                )

        conn.commit()
        return {'statusCode': 200, 'body': json.dumps({'message': f'订单 {order_id} 状态已更新为 {new_status}'})}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()
