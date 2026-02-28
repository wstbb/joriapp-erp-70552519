# backend/lambda/tenants/tenants.py
# 版本: 3.3 (最终语法修复)

import json
import psycopg2
import bcrypt
import logging
from psycopg2.extras import RealDictCursor

# 配置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# 从 Lambda Layer 导入两种连接函数及其他工具
from db_utils import get_public_connection, get_db_connection, build_response, CustomEncoder

def get_all_tenants(conn):
    """处理 GET /tenants 请求，查询并返回所有租户列表。"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id, name, domain FROM public.tenants ORDER BY created_at DESC;")
        tenants = cur.fetchall()
        return build_response(200, tenants, encoder=CustomEncoder)

def create_tenant(conn, event):
    """处理 POST /tenants 请求，完成创建租户的完整流程。"""
    body = json.loads(event.get("body", "{}"))
    
    required_fields = ["name", "domain", "adminName", "adminEmail"]
    if not all(field in body for field in required_fields):
        return build_response(400, {"message": "缺少必要字段 (name, domain, adminName, adminEmail)"})

    with conn.cursor() as cur:
        tenant_sql = """
            INSERT INTO public.tenants (name, domain, plan, industry, status)
            VALUES (%s, %s, %s, %s, %s)
            RETURNING id;
        """
        cur.execute(tenant_sql, (body["name"], body["domain"], body.get("plan", "basic"), body.get("industry"), 'active'))
        tenant_id = cur.fetchone()[0]
        schema_name = f"tenant_{tenant_id}"

        cur.execute("UPDATE public.tenants SET schema_name = %s WHERE id = %s;", (schema_name, tenant_id))

        cur.execute("SELECT create_tenant_tables_and_roles(%s);", (schema_name,))

        password = "123456"
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # [语法修复] 使用正确的 f"""...""" 格式
        user_sql = f"""
            INSERT INTO {psycopg2.extensions.quote_ident(schema_name, cur)}.users (name, email, password_hash, role)
            VALUES (%s, %s, %s, %s);
        """
        cur.execute(user_sql, (body["adminName"], body["adminEmail"], hashed_password, 'admin'))
        
        conn.commit()
        
        cur.execute("SELECT * FROM public.tenants WHERE id = %s;", (tenant_id,))
        new_tenant_details = cur.fetchone()
        
        columns = [desc[0] for desc in cur.description]
        new_tenant = dict(zip(columns, new_tenant_details))

        return build_response(201, {
            "message": "租户及管理员创建成功，数据库 Schema 已初始化。",
            "tenant": new_tenant
        }, encoder=CustomEncoder)

def handler(event, context):
    """
    主处理函数，根据 HTTP 方法路由到不同的连接策略。
    """
    logger.info("--- TenantsFunction v3.3 Handler (for HttpApi) START ---")
    
    conn = None
    try:
        # 从 HTTP API v2.0 事件格式中获取方法
        method = event.get('requestContext', {}).get('http', {}).get('method')
        logger.info(f"v3.3: Method resolved from HttpApi event is: {method}")

        # 关键逻辑：GET 请求使用公开连接，无需认证
        if method == "GET":
            logger.info("v3.3: Method is GET, using public connection.")
            conn = get_public_connection()
            if not conn:
                return build_response(500, {"message": "数据库连接失败。"})
            return get_all_tenants(conn)
        
        # 其他所有请求 (如 POST) 才需要认证
        elif method == "POST":
            logger.info(f"v3.3: Method is POST, using authenticated connection.")
            conn = get_db_connection(event)
            if not conn:
                return build_response(403, {"message": "访问被拒绝：POST 请求需要有效凭证。"})
            return create_tenant(conn, event)

        else:
            return build_response(405, {"message": f"不支持的 HTTP 方法: '{method}'"})

    except psycopg2.Error as e:
        logger.error(f"数据库错误: {e}")
        if conn:
            conn.rollback()
        return build_response(500, {"message": f"数据库操作失败: {e}"})
    except Exception as e:
        logger.error(f"发生未预期的错误: {e}")
        if conn:
            conn.rollback()
        return build_response(500, {"message": "服务器内部发生错误。"})
    
    finally:
        if conn:
            conn.close()
