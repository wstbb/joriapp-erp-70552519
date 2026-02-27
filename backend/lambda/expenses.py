
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
    """处理费用支出的 CRUD 操作。"""
    method = event.get('httpMethod')
    # tenant_id 应从认证信息中获取
    tenant_id = event.get('requestContext', {}).get('authorizer', {}).get('tenant_id')

    if method == 'POST':
        return add_expense(tenant_id, json.loads(event.get('body', '{}')))
    
    return {'statusCode': 405, 'body': json.dumps({'error': f'不支持的方法: {method}'})}

def add_expense(tenant_id, body):
    """
    记录一笔新的费用支出。
    body: { amount, description, payment_method, category, expense_date }
    """
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 从 body 中提取费用信息
        amount = body.get('amount')
        description = body.get('description')
        payment_method = body.get('payment_method', '现金') # 默认支付方式
        # 可以在 description 中增加更详细的分类，如 category
        category = body.get('category', '日常运营')
        full_description = f"{category}: {description}"

        if not amount or not description:
            return {'statusCode': 400, 'body': json.dumps({'error': '金额和描述不能为空'})}

        # 插入到 financial_transactions 表
        cursor.execute(
            """INSERT INTO financial_transactions 
               (tenant_id, type, amount, payment_method, description)
               VALUES (%s, 'expense', %s, %s, %s) RETURNING *""",
            (tenant_id, amount, payment_method, full_description)
        )
        new_expense = cursor.fetchone()
        conn.commit()

        return {'statusCode': 201, 'body': json.dumps(new_expense, default=str)}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

