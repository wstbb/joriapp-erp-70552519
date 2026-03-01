
# backend/lambda/debug_dump/debug_dump.py
# 一个临时的、不安全的调试工具，用于转储数据库中的所有数据到日志中。

import os
import psycopg2
import logging
import json
from psycopg2.extras import RealDictCursor

# 借用现有的工具层
from db_utils import get_public_connection, build_response, CustomEncoder

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def handler(event, context):
    """
    主处理函数：连接数据库，获取所有schema，然后转储每个schema下所有表的内容。
    """
    logger.info("!!!!!! [DebugDbDumpFunction] START: THIS IS AN INSECURE DEBUG FUNCTION. !!!!!!")
    conn = None
    all_data_for_response = {} # 用于API响应的聚合数据
    
    try:
        # 使用公共连接（通常是超级用户），以确保有足够权限读取所有内容
        conn = get_public_connection()
        if not conn:
            # 如果没有连接，则记录错误并返回
            logger.error("Database connection failed.")
            return build_response(503, {"message": "Database connection failed"})

        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # 1. 获取所有租户的 schema 名称
            logger.info("Step 1: Fetching all tenant schemas from public.tenants...")
            cur.execute("SELECT name, schema_name FROM public.tenants;")
            tenants = cur.fetchall()
            tenant_schemas = [row['schema_name'] for row in tenants if row.get('schema_name')]
            logger.info(f"Found tenant schemas: {tenant_schemas}")
            
            # 将 'public' schema 和所有租户 schema 合并为一个列表
            schemas_to_dump = ['public'] + tenant_schemas
            logger.info(f"Total schemas to dump: {schemas_to_dump}")
            all_data_for_response['schemas_found'] = schemas_to_dump
            all_data_for_response['tenants_public_data'] = tenants

            # 2. 遍历每一个 schema
            for schema in schemas_to_dump:
                all_data_for_response[schema] = {}
                logger.info(f"========== Dumping Schema: {schema} ==========")

                # 获取当前 schema 下的所有表名
                cur.execute("""
                    SELECT table_name 
                    FROM information_schema.tables 
                    WHERE table_schema = %s;
                """, (schema,))
                
                tables = [row['table_name'] for row in cur.fetchall()]
                if not tables:
                    logger.warning(f"No tables found in schema '{schema}'.")
                    continue
                
                logger.info(f"Found tables in '{schema}': {tables}")

                # 3. 遍历并转储每一个表的内容
                for table in tables:
                    # 使用安全的方式引用表名，避免SQL注入
                    table_fqn = psycopg2.extensions.quote_ident(table, cur)
                    schema_fqn = psycopg2.extensions.quote_ident(schema, cur)
                    
                    logger.info(f"----- Dumping Table: {schema}.{table} -----")
                    try:
                        cur.execute(f"SELECT * FROM {schema_fqn}.{table_fqn};")
                        table_content = cur.fetchall()
                        
                        # 为了方便在日志中阅读，将内容格式化为 JSON 并打印
                        pretty_json = json.dumps(table_content, indent=2, cls=CustomEncoder, ensure_ascii=False)
                        logger.info(pretty_json)
                        
                        all_data_for_response[schema][table] = table_content

                    except Exception as e:
                        error_message = f"Could not dump table {schema}.{table}. Reason: {e}"
                        logger.error(error_message)
                        all_data_for_response[schema][table] = {"error": error_message}

        logger.info("!!!!!! [DebugDbDumpFunction] END: All requested schemas and tables have been processed. !!!!!!")
        # 虽然主要目的是打印日志，但也将数据返回给API调用者，方便直接查看
        return build_response(200, all_data_for_response, encoder=CustomEncoder)

    except (Exception, psycopg2.Error) as e:
        logger.error(f"A critical error occurred: {e}", exc_info=True)
        return build_response(500, {"message": f"A critical error occurred: {str(e)}"})
    finally:
        if conn:
            conn.close()
            logger.info("Database connection closed.")
