
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
    """POS 收银台主处理函数，用于快速处理一笔完整的零售交易。"""
    if event.get('httpMethod') != 'POST':
        return {'statusCode': 405, 'body': json.dumps({'error': '仅支持POST方法'})}

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    body = json.loads(event.get('body', '{}'))

    try:
        # body: { user_id, partner_id, warehouse_id, total_amount, payment_method, items: [...] }
        # items: [{ product_id, location_code, quantity, unit_price, total_price }]
        user_id = body.get('user_id')
        # 对于散客，可以是一个默认的匿名客户ID
        partner_id = body.get('partner_id', '00000000-0000-0000-0000-000000000002') # 假设的匿名散客ID
        warehouse_id = body.get('warehouse_id')
        total_amount = body.get('total_amount')
        payment_method = body.get('payment_method')
        items = body.get('items', [])

        # --- 1. 创建一个已完成的销售订单 ---
        order_type = 'sales'
        order_status = 'completed'
        payment_status = 'paid'
        
        cursor.execute(
            """INSERT INTO orders (type, partner_id, user_id, total_amount, status, payment_status, order_no)
               VALUES (%s, %s, %s, %s, %s, %s, 'TEMP') RETURNING id""",
            (order_type, partner_id, user_id, total_amount, order_status, payment_status)
        )
        order_id = cursor.fetchone()['id']
        order_no = f"POS-{order_id.split('-')[0].upper()}"
        cursor.execute("UPDATE orders SET order_no = %s WHERE id = %s", (order_no, order_id))

        # --- 2. 插入订单明细并扣减库存 ---
        for item in items:
            p_id, loc, qty, price, total = [item.get(k) for k in ['product_id', 'location_code', 'quantity', 'unit_price', 'total_price']]
            
            # a. 插入订单明细
            cursor.execute(
                """INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price)
                   VALUES (%s, %s, %s, %s, %s)""", (order_id, p_id, qty, price, total))

            # b. 检查并扣减库存
            cursor.execute("SELECT quantity FROM stocks WHERE warehouse_id=%s AND product_id=%s AND location_code=%s FOR UPDATE", (warehouse_id, p_id, loc))
            stock = cursor.fetchone()
            if not stock or stock['quantity'] < qty:
                raise Exception(f"商品 {p_id} 在货架 {loc} 库存不足")
            
            cursor.execute("UPDATE stocks SET quantity = quantity - %s WHERE warehouse_id=%s AND product_id=%s AND location_code=%s", (qty, warehouse_id, p_id, loc))

            # c. 记录库存流水
            cursor.execute(
                """INSERT INTO inventory_logs (product_id, warehouse_id, change_qty, type, reference_id)
                   VALUES (%s, %s, %s, 'outbound', %s)""", (p_id, warehouse_id, -qty, order_id))

        # --- 3. 创建财务收款记录 ---
        cursor.execute(
            """INSERT INTO financial_transactions (partner_id, order_id, type, amount, payment_method, description)
               VALUES (%s, %s, 'income', %s, %s, %s)""",
            (partner_id, order_id, total_amount, payment_method, f"POS 销售单 {order_no}")
        )
        # 注意：这里没有像之前一样更新 partner balance，因为对于匿名散客，通常不维护其长期余额
        
        conn.commit()
        return {'statusCode': 200, 'body': json.dumps({'message': '交易成功', 'order_id': order_id, 'order_no': order_no})}

    except Exception as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'交易失败: {str(error)}'})}
    finally:
        cursor.close()
        conn.close()
