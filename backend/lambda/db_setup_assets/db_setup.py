# backend/lambda/db_setup_assets/db_setup.py
# [V8 - 精简版]
# 核心修复:
# 1. 在插入新租户时，明确将其 `status` 设置为 `'active'`。
# 2. 根据用户要求，初始化列表只包含 `demo` 租户。

import os
import psycopg2
import logging

# 配置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_env_variable(var_name):
    value = os.environ.get(var_name)
    if value is None:
        raise ValueError(f"环境变量 '{var_name}' 未设置。")
    return value

def read_sql_file(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def handler(event, context):
    conn = None
    try:
        db_host = get_env_variable('DB_HOST')
        db_port = get_env_variable('DB_PORT')
        db_name = get_env_variable('DB_NAME')
        db_user = get_env_variable('DB_USER')
        db_password = get_env_variable('DB_PASSWORD')
        
        # 根据您的要求，只初始化 demo 租户
        initial_tenants = [
            {"name": "demo", "domain": "demo"}
        ]

        schema_public_sql = read_sql_file('schema_public.sql')
        schema_tenant_sql = read_sql_file('schema_tenant.sql')
        seed_sql = read_sql_file('seed.sql')
        
        conn = psycopg2.connect(
            host=db_host, port=db_port, dbname=db_name, user=db_user, password=db_password
        )
        with conn.cursor() as cur:
            logger.info("数据库连接成功，事务开始。")

            # Step 1: 创建 public schema 和 tenants 表
            cur.execute(schema_public_sql)

            # Step 2: 循环创建初始租户
            for tenant_info in initial_tenants:
                tenant_name = tenant_info["name"]
                tenant_domain = tenant_info["domain"]

                cur.execute("SELECT id FROM public.tenants WHERE name = %s OR domain = %s;", (tenant_name, tenant_domain))
                if cur.fetchone():
                    logger.warning(f"租户 '{tenant_name}' 或域名 '{tenant_domain}' 已存在，跳过创建。")
                else:
                    logger.info(f"租户 '{tenant_name}' 不存在，开始创建流程。")
                    
                    # 【核心修复】插入新租户时，明确将 status 设置为 'active'
                    cur.execute(
                        "INSERT INTO public.tenants (name, domain, status) VALUES (%s, %s, 'active') RETURNING id;",
                        (tenant_name, tenant_domain)
                    )
                    tenant_id = cur.fetchone()[0]
                    logger.info(f"成功插入记录到 public.tenants，新租户ID: {tenant_id}")
                    
                    cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
                    schema_name = cur.fetchone()[0]
                    if not schema_name:
                        raise Exception(f"创建 schema 后，无法从租户 {tenant_id} 中读取 schema_name。")

                    logger.info(f"租户 Schema '{schema_name}' 已由触发器创建。")
                    
                    cur.execute(schema_tenant_sql)
                    cur.execute("SELECT create_tenant_tables_and_roles(%s);", (schema_name,))
                    
                    cur.execute(f"SET search_path TO {schema_name}, public;")
                    cur.execute(seed_sql)
                    logger.info(f"在 '{schema_name}' 中成功填充种子数据。")

            logger.info("所有操作成功完成，提交事务。")
            conn.commit()
            
            return {'statusCode': 200, 'body': "数据库初始化和租户设置成功完成。"}

    except (Exception, psycopg2.Error) as error:
        logger.error(f"发生错误: {error}")
        if conn:
            conn.rollback()
        return {'statusCode': 500, 'body': f"处理失败: {error}"}
    finally:
        if conn:
            conn.close()
            logger.info("数据库连接已关闭。")
