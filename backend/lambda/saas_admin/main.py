# backend/lambda/saas_admin/main.py
# 职责：处理所有 SaaS 后台管理 API 请求，返回真实的数据库数据。

import json
import logging
from db_utils import get_db_connection # 使用公共的数据库连接工具

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    统一处理所有 /admin/* 请求。
    目前主要实现获取所有租户列表的功能。
    """
    logger.info(f"SaasAdminFunction 收到了请求: {json.dumps(event)}")

    path = event.get('rawPath', '')
    conn = None
    
    try:
        # 任何后台管理API都需要连接到主数据库
        conn = get_db_connection()
        with conn.cursor() as cur:
            # 根据请求路径，路由到不同的处理逻辑
            if path.startswith("/admin/tenants"):
                logger.info("路由到：获取租户列表")
                cur.execute(
                    "SELECT id, name, domain, status, admin_name, admin_email, plan_id, created_at FROM public.tenants ORDER BY id;"
                )
                rows = cur.fetchall()
                
                # 将查询结果转换为字典列表以便JSON序列化
                tenants = [
                    {
                        "id": row[0],
                        "name": row[1],
                        "domain": row[2],
                        "status": row[3],
                        "admin_name": row[4],
                        "admin_email": row[5],
                        "plan_id": row[6],
                        "created_at": row[7].isoformat() # 转换 datetime 对象为字符串
                    }
                    for row in rows
                ]
                response_body = tenants
            
            # --- 未来在此处添加 /admin/plans, /admin/industries 等路由的处理逻辑 ---
            else:
                logger.warning(f"收到了未处理的路径请求: {path}")
                response_body = {"message": f"路径 {path} 未实现"}

            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*', 
                    'Content-Type': 'application/json'
                },
                'body': json.dumps(response_body)
            }

    except Exception as e:
        logger.error(f"处理请求时发生错误: {e}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({"error": "服务器内部错误"})
        }
    finally:
        if conn:
            conn.close()
