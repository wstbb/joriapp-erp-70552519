
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
    """主路由函数，处理所有与合作伙伴（客户/供应商）相关的 API 请求。"""
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    body = json.loads(event.get('body', '{}'))
    query_params = event.get('queryStringParameters', {})

    # 路由: /partners, /partners/{id}
    if path_parts[0] == 'partners':
        partner_id = path_parts[1] if len(path_parts) > 1 else None
        return handle_partners(method, partner_id, body, query_params)

    return {'statusCode': 404, 'body': json.dumps({'error': '资源未找到'})}

def handle_partners(method, partner_id, body, query_params):
    """处理合作伙伴的 CRUD 操作。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        if method == 'GET':
            if partner_id:
                cursor.execute("SELECT * FROM partners WHERE id = %s", (partner_id,))
                partner = cursor.fetchone()
                return {'statusCode': 200, 'body': json.dumps(partner, default=str)} if partner else {'statusCode': 404, 'body': '伙伴未找到'}
            else:
                # 根据类型（customer/supplier）进行筛选
                base_query = "SELECT * FROM partners"
                if query_params.get('type'):
                    base_query += " WHERE type = %s OR type = 'both'"
                    cursor.execute(base_query, (query_params['type'],))
                else:
                    cursor.execute(base_query)
                
                partners = cursor.fetchall()
                return {'statusCode': 200, 'body': json.dumps(partners, default=str)}

        elif method == 'POST':
            # body: { type, name, contact_person, phone, email, address, credit_limit }
            keys = ['type', 'name', 'contact_person', 'phone', 'email', 'address', 'credit_limit']
            # balance 默认为 0，不从前端接收
            values = [body.get(k) for k in keys]

            cursor.execute(
                """INSERT INTO partners (type, name, contact_person, phone, email, address, credit_limit, balance)
                   VALUES (%s, %s, %s, %s, %s, %s, %s, 0) RETURNING *""",
                values
            )
            new_partner = cursor.fetchone()
            conn.commit()
            return {'statusCode': 201, 'body': json.dumps(new_partner, default=str)}

        elif method == 'PUT' and partner_id:
            # body 与 POST 类似，但不应允许直接修改 balance
            keys = ['type', 'name', 'contact_person', 'phone', 'email', 'address', 'credit_limit']
            values = [body.get(k) for k in keys] + [partner_id]

            cursor.execute(
                """UPDATE partners SET 
                   type=%s, name=%s, contact_person=%s, phone=%s, email=%s, address=%s, credit_limit=%s 
                   WHERE id=%s RETURNING *""",
                values
            )
            updated_partner = cursor.fetchone()
            conn.commit()
            return {'statusCode': 200, 'body': json.dumps(updated_partner, default=str)} if updated_partner else {'statusCode': 404, 'body': '伙伴未找到'}

        # 通常不提供物理删除伙伴的功能，而是将其状态设为 inactive
        elif method == 'DELETE' and partner_id:
            cursor.execute("UPDATE partners SET status = 'inactive' WHERE id = %s RETURNING id", (partner_id,))
            deleted = cursor.fetchone()
            conn.commit()
            return {'statusCode': 200, 'body': json.dumps({'message': '伙伴已禁用'})} if deleted else {'statusCode': 404, 'body': '伙伴未找到'}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()
