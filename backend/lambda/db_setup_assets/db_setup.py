# backend/lambda/db_setup_assets/db_setup.py
# [V13 - 强制种子数据修复版]
# 核心修复:
# 1. 明确检查 event 中的 `apply_seed` 标志。
# 2. 当 `apply_seed` 为 True 时，无论租户是否存在，都强制执行种子数据填充逻辑。
# 3. 当 `apply_seed` 为 False (默认)，则对已存在的租户跳过所有操作，保持原有的安全行为。
# 这确保了 `db-setup` 流程的幂等性，并提供了一个可控的、强制覆盖数据的官方途径。

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
    # 核心修复：读取 apply_seed 标志
    apply_seed = event.get('apply_seed', False)
    if apply_seed:
        logger.info("检测到 apply_seed=true，将对所有已定义租户强制应用种子数据。")

    conn = None
    try:
        db_host = get_env_variable('DB_HOST')
        db_port = get_env_variable('DB_PORT')
        db_name = get_env_variable('DB_NAME')
        db_user = get_env_variable('DB_USER')
        db_password = get_env_variable('DB_PASSWORD')
        
        initial_tenants = [
            {"name": "demo", "domain": "demo", "admin_name": "Demo Admin", "admin_email": "admin@example.com"}
        ]

        schema_public_sql = read_sql_file('schema_public.sql')
        schema_tenant_sql = read_sql_file('schema_tenant.sql')
        seed_sql = read_sql_file('seed.sql')
        
        conn = psycopg2.connect(
            host=db_host, port=db_port, dbname=db_name, user=db_user, password=db_password
        )
        with conn.cursor() as cur:
            logger.info("数据库连接成功，事务开始。")

            # Step 1 & 2: 执行SQL定义 (幂等)
            cur.execute(schema_public_sql)
            cur.execute(schema_tenant_sql)

            # Step 3: 循环创建和配置租户
            for tenant_info in initial_tenants:
                tenant_domain = tenant_info["domain"]
                logger.info(f"正在处理域为 '{tenant_domain}' 的租户...")

                cur.execute("SELECT id, schema_name FROM public.tenants WHERE domain = %s;", (tenant_domain,))
                existing_tenant = cur.fetchone()
                
                schema_name = None
                
                if existing_tenant and existing_tenant[1]:
                    tenant_id, schema_name = existing_tenant
                    # 核心修复：根据 apply_seed 决定行为
                    if not apply_seed:
                        logger.warning(f"租户 '{tenant_domain}' 已存在且未指定 apply_seed=true，跳过所有操作。")
                        continue # 跳到下一个租户
                    
                    logger.info(f"租户 '{tenant_domain}' 已存在，将强制应用种子数据...")

                else: # 租户不存在或不完整，执行创建流程
                    if not existing_tenant:
                        logger.info(f"租户 '{tenant_domain}' 不存在，开始创建...")
                        cur.execute(
                            "INSERT INTO public.tenants (name, domain, status, admin_name, admin_email) VALUES (%s, %s, 'active', %s, %s) RETURNING id;",
                            (tenant_info["name"], tenant_domain, tenant_info["admin_name"], tenant_info["admin_email"])
                        )
                        tenant_id = cur.fetchone()[0]
                        logger.info(f"新租户已插入，ID: {tenant_id}")
                    else:
                        tenant_id = existing_tenant[0]
                        logger.warning(f"租户 '{tenant_domain}' (ID: {tenant_id}) 存在但 schema 配置不完整，将尝试重新配置。")

                    cur.execute("SELECT schema_name FROM public.tenants WHERE id = %s;", (tenant_id,))
                    schema_name = cur.fetchone()[0]
                    if not schema_name:
                        raise Exception(f"致命错误: 触发器未能为租户ID {tenant_id} 设置 schema_name。")
                    logger.info(f"已确认租户 (ID: {tenant_id}) 的 schema 为 '{schema_name}'。")

                    logger.info(f"在 '{schema_name}' 中调用函数以创建表...")
                    cur.execute("SELECT create_tenant_tables_and_roles(%s);", (schema_name,))
                    logger.info(f"表已在 '{schema_name}' 中创建。")

                # 统一的种子数据填充逻辑
                # 只有在新创建租户或 apply_seed=true 的情况下才会执行到这里
                logger.info(f"为 '{schema_name}' 设置 search_path 并填充种子数据...")
                cur.execute(f"SET search_path TO \"{schema_name}\", public;")
                cur.execute(seed_sql)
                logger.info(f"种子数据已成功填充到 '{schema_name}'。")

            logger.info("所有租户处理完毕，提交事务。")
            conn.commit()
            
            return {'statusCode': 200, 'body': "数据库和所有租户已成功初始化。"}

    except (Exception, psycopg2.Error) as error:
        logger.error(f"发生致命错误: {error}")
        if conn:
            conn.rollback()
        return {'statusCode': 500, 'body': f"处理失败: {error}"}
    finally:
        if conn:
            conn.close()
            logger.info("数据库连接已关闭。")
