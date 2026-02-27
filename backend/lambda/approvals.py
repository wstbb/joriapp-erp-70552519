
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
    """主路由函数，处理审批相关的 API 请求。"""
    path = event.get('path', '')
    method = event.get('httpMethod')
    path_parts = path.strip('/').split('/')
    body = json.loads(event.get('body', '{}'))

    # 路由: /approvals, /approvals/{id}, /approvals/{id}/status
    if path_parts[0] == 'approvals':
        approval_id = path_parts[1] if len(path_parts) > 1 else None
        
        # 更新审批状态 (批准/驳回)
        if approval_id and len(path_parts) > 2 and path_parts[2] == 'status':
            return handle_approval_status_update(approval_id, body)
        # 获取或创建审批
        else:
            return handle_approvals(method, approval_id, body, event.get('queryStringParameters', {}))

    return {'statusCode': 404, 'body': json.dumps({'error': '资源未找到'})}

def handle_approvals(method, approval_id, body, query_params):
    """处理审批请求的获取和创建。"""
    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            if approval_id:
                cursor.execute("SELECT * FROM approvals WHERE id = %s", (approval_id,))
                approval = cursor.fetchone()
                return {'statusCode': 200, 'body': json.dumps(approval, default=str)} if approval else {'statusCode': 404, 'body': json.dumps({'error': '审批未找到'})}
            else:
                # 根据状态或请求人过滤
                query = "SELECT * FROM approvals"
                filters = []
                values = []
                if query_params.get('status'):
                    filters.append("status = %s")
                    values.append(query_params['status'])
                if query_params.get('request_user_id'):
                    filters.append("request_user_id = %s")
                    values.append(query_params['request_user_id'])
                
                if filters:
                    query += " WHERE " + " AND ".join(filters)
                
                cursor.execute(query, tuple(values))
                approvals = cursor.fetchall()
                return {'statusCode': 200, 'body': json.dumps(approvals, default=str)}

        elif method == 'POST':
            # 创建一个新的审批请求
            # body: { target_type, target_id, request_user_id, comments }
            keys = ['target_type', 'target_id', 'request_user_id', 'comments']
            values = [body.get(k) for k in keys]

            # [核心] 创建审批请求后，必须将原业务对象的状态改为 "pending_approval"
            target_type = body.get('target_type') # e.g., 'orders'
            target_id = body.get('target_id')

            if not target_type or not target_id:
                return {'statusCode': 400, 'body': json.dumps({'error': 'target_type 和 target_id 是必需的'})}

            # 1. 插入审批记录
            cursor.execute(
                """INSERT INTO approvals (target_type, target_id, request_user_id, comments, status)
                   VALUES (%s, %s, %s, %s, 'pending') RETURNING *""",
                values
            )
            new_approval = cursor.fetchone()

            # 2. 更新原业务单据的状态 (例如: orders, financial_transactions)
            # 注意：表名不能作为参数传递，需要硬编码或使用映射
            if target_type == 'order':
                cursor.execute("UPDATE orders SET status = 'pending_approval' WHERE id = %s", (target_id,))
            # elif target_type == 'finance': # 为未来的财务审批预留
            #     cursor.execute("UPDATE financial_transactions SET status = 'pending_approval' WHERE id = %s", (target_id,))

            conn.commit()
            return {'statusCode': 201, 'body': json.dumps(new_approval, default=str)}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()

def handle_approval_status_update(approval_id, body):
    """处理审批的“批准”或“驳回”操作。"""
    new_status = body.get('status') # 'approved' or 'rejected'
    if new_status not in ['approved', 'rejected']:
        return {'statusCode': 400, 'body': json.dumps({'error': '无效的状态，必须是 "approved" 或 "rejected"'})}

    conn = get_db_connection()
    cursor = conn.cursor(cursor_factory=RealDictCursor)

    try:
        # 1. 更新审批记录本身的状态
        cursor.execute("UPDATE approvals SET status = %s WHERE id = %s RETURNING *", (new_status, approval_id))
        approval = cursor.fetchone()
        if not approval:
            return {'statusCode': 404, 'body': json.dumps({'error': '审批记录未找到'})}

        # 2. [核心] 根据审批结果，回调更新原业务单据的状态
        target_type = approval['target_type']
        target_id = approval['target_id']
        
        # 批准则进入下一状态，驳回则打回草稿
        target_status = 'approved' if new_status == 'approved' else 'draft' 

        if target_type == 'order':
            cursor.execute(f"UPDATE orders SET status = %s WHERE id = %s", (target_status, target_id))
        # elif target_type == 'finance': # 为未来的财务审批预留
        #     cursor.execute(f"UPDATE financial_transactions SET status = %s WHERE id = %s", (target_status, target_id))

        conn.commit()
        return {'statusCode': 200, 'body': json.dumps({'message': f'审批完成，业务单据 {target_id} 状态已更新'})}

    except (Exception, psycopg2.Error) as error:
        conn.rollback()
        return {'statusCode': 500, 'body': json.dumps({'error': f'数据库操作失败: {error}'})}
    finally:
        cursor.close()
        conn.close()
