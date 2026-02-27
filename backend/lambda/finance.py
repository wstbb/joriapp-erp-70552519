
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
    """主路由函数，根据路径将请求分发到发票或财务流水处理函数。"""
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    body = json.loads(event.get('body', '{}'))
    query_params = event.get('queryStringParameters', {})

    # 路由: /finance/invoices, /finance/transactions
    router = path_parts[1] if len(path_parts) > 1 else ''
    entity_id = path_parts[2] if len(path_parts) > 2 else None

    if router == 'invoices':
        return handle_invoices(method, entity_id, body, query_params)
    elif router == 'transactions':
        return handle_transactions(method, entity_id, body, query_params)

    return {'statusCode': 404, 'body': json.dumps({'error': '财务资源未找到'})}

def handle_invoices(method, invoice_id, body, query_params):
    """处理发票的 CRUD 操作。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            if invoice_id:
                cursor.execute("SELECT * FROM invoices WHERE id = %s", (invoice_id,))
                invoice = cursor.fetchone()
                return {'statusCode': 200, 'body': json.dumps(invoice, default=str)} if invoice else {'statusCode': 404, 'body': '发票未找到'}
            else:
                # 按订单ID或发票号查询
                base_query = "SELECT * FROM invoices"
                filters = []
                values = []
                if query_params.get('order_id'):
                    filters.append("order_id = %s")
                    values.append(query_params['order_id'])
                if filters:
                    base_query += " WHERE " + " AND ".join(filters)
                cursor.execute(base_query, tuple(values))
                invoices = cursor.fetchall()
                return {'statusCode': 200, 'body': json.dumps(invoices, default=str)}
        
        elif method == 'POST':
            # body: { order_id, type, amount, tax, status, file_url }
            # 自动生成发票号
            order_id = body.get('order_id')
            cursor.execute("SELECT COUNT(*) FROM invoices")
            count = cursor.fetchone()['count'] + 1
            invoice_no = f"INV-{count:06d}"

            keys = ['order_id', 'type', 'amount', 'tax', 'status', 'file_url']
            values = [body.get(k) for k in keys]
            values.insert(1, invoice_no) # 插入发票号

            cursor.execute(
                """INSERT INTO invoices (order_id, invoice_no, type, amount, tax, status, file_url)
                   VALUES (%s, %s, %s, %s, %s, %s, %s) RETURNING *""",
                values
            )
            new_invoice = cursor.fetchone()
            conn.commit()
            return {'statusCode': 201, 'body': json.dumps(new_invoice, default=str)}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

def handle_transactions(method, transaction_id, body, query_params):
    """处理财务流水（收付款）的CRUD操作。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            # 支持按 partner_id, order_id, type 进行复杂查询，用于对账
            base_query = "SELECT * FROM financial_transactions"
            filters = []
            values = []
            for key in ['partner_id', 'order_id', 'type']:
                if query_params.get(key):
                    filters.append(f"{key} = %s")
                    values.append(query_params[key])
            if filters:
                base_query += " WHERE " + " AND ".join(filters)
            
            cursor.execute(base_query, tuple(values))
            transactions = cursor.fetchall()
            return {'statusCode': 200, 'body': json.dumps(transactions, default=str)}

        elif method == 'POST':
            # body: { partner_id, order_id, type, amount, payment_method, description }
            keys = ['partner_id', 'order_id', 'type', 'amount', 'payment_method', 'description']
            values = [body.get(k) for k in keys]

            # 1. 插入财务流水记录
            cursor.execute(
                """INSERT INTO financial_transactions (partner_id, order_id, type, amount, payment_method, description)
                   VALUES (%s, %s, %s, %s, %s, %s) RETURNING *""",
                values
            )
            new_transaction = cursor.fetchone()
            
            # 2. [核心] 更新订单的支付状态和客户/供应商的余额
            amount = body.get('amount', 0)
            # 如果是收款(income)，则减少伙伴欠款；如果是付款(expense)，则增加伙伴欠款
            balance_change = -amount if body.get('type') == 'income' else amount
            cursor.execute("UPDATE partners SET balance = balance + %s WHERE id = %s", (balance_change, body.get('partner_id')))

            # 3. 更新订单支付状态 (简单逻辑：任何一笔收款/付款都标记为'partial', 金额足够则'paid')
            order_id = body.get('order_id')
            if order_id:
                cursor.execute("SELECT total_amount FROM orders WHERE id = %s", (order_id,))
                order_total = cursor.fetchone()['total_amount']
                cursor.execute("SELECT SUM(amount) FROM financial_transactions WHERE order_id = %s", (order_id,))
                paid_total = cursor.fetchone()['sum'] or 0
                
                payment_status = 'partial'
                if paid_total >= order_total:
                    payment_status = 'paid'
                
                cursor.execute("UPDATE orders SET payment_status = %s WHERE id = %s", (payment_status, order_id))

            conn.commit()
            return {'statusCode': 201, 'body': json.dumps(new_transaction, default=str)}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()
