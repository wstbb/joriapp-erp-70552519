# backend/lambda/db_setup_assets/db_setup.py
# [V5 - 总指挥版]
# 职责:
# 1. 作为数据库初始化和租户创建的唯一入口点。
# 2. 实现"双轨制":
#    - 初始化模式: 创建'demo'租户 (如果不存在)。
#    - 按需创建模式: 根据传入的'tenant_name'创建新租户。
# 3. 所有操作都在一个事务中，失败则自动回滚。

import os
import psycopg2
import logging

# 配置日志
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def get_env_variable(var_name):
    """获取环境变量，如果缺失则抛出异常。"""
    value = os.environ.get(var_name)
    if value is None:
        raise ValueError(f"环境变量 '{var_name}' 未设置。")
    return value

def read_sql_file(file_path):
    """读取SQL文件的内容。"""
    with open(file_path, 'r', encoding='utf-8') as f:
        return f.read()

def handler(event, context):
    """
    Lambda 主处理函数。
    根据 event 中是否包含 'tenant_name' 来决定执行初始化还是按需创建。
    """
    conn = None
    try:
        # --- 1. 获取数据库连接和配置 ---
        db_host = get_env_variable('DB_HOST')
        db_port = get_env_variable('DB_PORT')
        db_name = get_env_variable('DB_NAME')
        db_user = get_env_variable('DB_USER')
        db_password = get_env_variable('DB_PASSWORD')

        # 从 event 中获取 tenant_name，如果没有，则默认为 'demo'
        # 这统一了两种模式的入口
        tenant_name = event.get('tenant_name', 'demo')
        
        # 对租户名称进行合法性检查
        if not tenant_name.isalnum() or '_' in tenant_name:
             return {
                'statusCode': 400,
                'body': "租户名称只能包含字母和数字。"
            }

        logger.info(f"开始处理租户: '{tenant_name}'")

        # --- 2. 读取所有 SQL 模板文件 ---
        schema_public_sql = read_sql_file('schema_public.sql')
        schema_tenant_sql = read_sql_file('schema_tenant.sql')
        seed_sql = read_sql_file('seed.sql')
        
        # --- 3. 连接数据库并开启事务 ---
        conn = psycopg2.connect(
            host=db_host,
            port=db_port,
            dbname=db_name,
            user=db_user,
            password=db_password
        )
        with conn.cursor() as cur:
            logger.info("数据库连接成功，事务开始。")

            # --- 4. 核心执行逻辑 ---
            
            # 步骤 4.1: 执行 public schema，确保 tenants 表存在
            logger.info("执行 schema_public.sql...")
            cur.execute(schema_public_sql)
            
            # 步骤 4.2: 检查租户是否已存在
            cur.execute("SELECT EXISTS(SELECT 1 FROM public.tenants WHERE name = %s);", (tenant_name,))
            tenant_exists = cur.fetchone()[0]

            if tenant_exists:
                logger.warning(f"租户 '{tenant_name}' 已存在，跳过创建。")
                # 如果是按需创建，并且租户已存在，可以返回一个错误或提示
                if 'tenant_name' in event:
                    conn.rollback() # 回滚事务
                    return {
                        'statusCode': 409, # 409 Conflict
                        'body': f"租户 '{tenant_name}' 已存在。"
                    }
            else:
                logger.info(f"租户 '{tenant_name}' 不存在，开始创建流程。")
                
                # 步骤 4.3: 插入新的租户记录
                cur.execute("INSERT INTO public.tenants (name) VALUES (%s) RETURNING tenant_id;", (tenant_name,))
                tenant_id = cur.fetchone()[0]
                logger.info(f"成功插入记录到 public.tenants，新租户ID: {tenant_id}")
                
                # 步骤 4.4: 使用函数创建租户专属的 schema 和表
                # schema_tenant_sql 包含我们需要的 `create_tenant_schema` 函数
                logger.info("执行 schema_tenant.sql 以定义 create_tenant_schema 函数...")
                cur.execute(schema_tenant_sql)
                
                schema_name = f"tenant_{tenant_name}" # 根据您的要求，使用名字构成schema名
                logger.info(f"调用 create_tenant_schema 函数，创建 schema '{schema_name}' 及其内部的表...")
                cur.execute("SELECT create_tenant_schema(%s);", (schema_name,))
                
                # 步骤 4.5: 在新创建的 schema 中填充种子数据
                logger.info(f"设置 search_path 到 '{schema_name}'...")
                cur.execute(f"SET search_path TO {schema_name}, public;")
                
                logger.info("在新 schema 中执行 seed.sql...")
                cur.execute(seed_sql)

            # --- 5. 提交事务 ---
            logger.info("所有操作成功完成，提交事务。")
            conn.commit()
            
            return {
                'statusCode': 200,
                'body': f"租户 '{tenant_name}' 处理成功。"
            }

    except (Exception, psycopg2.Error) as error:
        logger.error(f"发生错误: {error}")
        if conn:
            # 如果发生任何错误，回滚所有更改
            conn.rollback()
            logger.info("事务已回滚。")
        return {
            'statusCode': 500,
            'body': f"处理失败: {error}"
        }
    finally:
        if conn:
            conn.close()
            logger.info("数据库连接已关闭。")
