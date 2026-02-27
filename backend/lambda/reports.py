
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
    path_parts = path.strip('/').split('/')
    query_params = event.get('queryStringParameters', {}) or {}
    tenant_id = event.get('requestContext', {}).get('authorizer', {}).get('tenant_id')

    report_type = path_parts[1] if len(path_parts) > 1 else None
    start_date = query_params.get('start_date')
    end_date = query_params.get('end_date')

    if report_type == 'cashflow':
        return get_cashflow_report(tenant_id, start_date, end_date)
    elif report_type == 'profit':
        return get_profit_report(tenant_id, start_date, end_date)
    
    return {'statusCode': 404, 'body': json.dumps({'error': '报表类型未找到'})}

def get_cashflow_report(tenant_id, start_date, end_date):
    """生成现金流报告。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        query = """
            SELECT 
                COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) as total_income,
                COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) as total_expense
            FROM financial_transactions
            WHERE tenant_id = %s AND created_at BETWEEN %s AND %s;
        """
        cursor.execute(query, (tenant_id, start_date, end_date))
        result = cursor.fetchone()
        result['net_cashflow'] = result['total_income'] - result['total_expense']
        return {'statusCode': 200, 'body': json.dumps(result, default=str)}
    finally:
        cursor.close()
        conn.close()

def get_profit_report(tenant_id, start_date, end_date):
    """生成利润报告。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    try:
        # 1. 计算总销售收入
        cursor.execute(
            """SELECT COALESCE(SUM(total_amount), 0) as total_revenue 
               FROM orders WHERE tenant_id = %s AND type = 'sales' AND status = 'completed' 
               AND updated_at BETWEEN %s AND %s""",
            (tenant_id, start_date, end_date)
        )
        total_revenue = cursor.fetchone()['total_revenue']

        # 2. 计算总销售成本
        cursor.execute(
            """SELECT COALESCE(SUM(oi.quantity * p.cost_price), 0) as total_cost
               FROM order_items oi
               JOIN products p ON oi.product_id = p.id
               JOIN orders o ON oi.order_id = o.id
               WHERE o.tenant_id = %s AND o.type = 'sales' AND o.status = 'completed'
               AND o.updated_at BETWEEN %s AND %s""",
            (tenant_id, start_date, end_date)
        )
        total_cost = cursor.fetchone()['total_cost']

        gross_profit = total_revenue - total_cost
        profit_margin = (gross_profit / total_revenue) * 100 if total_revenue > 0 else 0

        report = {
            'total_revenue': total_revenue,
            'total_cost_of_goods_sold': total_cost,
            'gross_profit': gross_profit,
            'profit_margin_percentage': profit_margin
        }
        return {'statusCode': 200, 'body': json.dumps(report, default=str)}
    finally:
        cursor.close()
        conn.close()

