-- backend/lambda/db_setup_assets/schema_public.sql

-- ####################################################################
-- #                                                                    #
-- # [最终版] 这是多租户ERP系统的 public schema 定义。                 #
-- #                                                                    #
-- # 它只包含一个核心表：tenants。                                      #
-- # 此表作为所有租户的中央目录。                                       #
-- #                                                                    #
-- # 注意：超级管理员表 (super_admins) 已被完全移除。                  #
-- #       其认证和凭证管理现已迁移至 AWS Secrets Manager，            #
-- #       以实现更高的安全性和可管理性。                               #
-- #                                                                    #
-- ####################################################################


-- ========= 创建 tenants 表 =========
-- 这是系统的核心，用于存储所有租户的元数据。
CREATE TABLE IF NOT EXISTS public.tenants (
    id SERIAL PRIMARY KEY,                          -- 租户的唯一数字ID (例如: 1, 2, 3)
    name VARCHAR(255) NOT NULL,                     -- 租户的公司或组织名称 (例如: "ACME Corp")
    domain VARCHAR(255) UNIQUE NOT NULL,            -- 租户用于登录的唯一子域名 (例如: "acme")
    schema_name VARCHAR(255) UNIQUE NOT NULL,       -- 租户在数据库中的隔离schema名称 (例如: "tenant_1")
    plan VARCHAR(50) DEFAULT 'basic',               -- 租户的订阅计划 (例如: 'basic', 'premium')
    status VARCHAR(50) DEFAULT 'pending',           -- 租户账户的状态 (例如: 'active', 'disabled', 'pending')
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- 记录创建时间
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP  -- 记录最后更新时间
);

-- 为 updated_at 字段创建自动更新触发器
CREATE OR REPLACE FUNCTION update_changetimestamp_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW(); 
   RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_changetimestamp BEFORE UPDATE
ON public.tenants FOR EACH ROW EXECUTE PROCEDURE 
update_changetimestamp_column();


-- ========= 自动创建租户 Schema 的触发器 =========
-- 当一个新的租户被插入到 public.tenants 表时，此触发器会自动执行以下操作：
-- 1. 根据新租户的 ID 生成一个唯一的 schema 名称 (例如, tenant_1, tenant_2)。
-- 2. 在数据库中创建这个新的 schema。
-- 3. 将生成的 schema 名称写回到 public.tenants 表的 schema_name 字段中。
-- 4. 授权数据库主用户访问这个新的 schema。
-- 5. 使用 `schema_tenant.sql` 文件中的模板，在新 schema 中创建所有租户专属的表 (users, products, etc.)。
CREATE OR REPLACE FUNCTION create_tenant_schema_and_tables()
  RETURNS TRIGGER AS $$
DECLARE
  _schema_name text;
  _template_sql text;
BEGIN
  -- 1. 生成 Schema 名称
  _schema_name := 'tenant_' || NEW.id;
  
  -- 2. 创建 Schema
  EXECUTE 'CREATE SCHEMA ' || quote_ident(_schema_name);
  
  -- 3. 更新 tenants 表中的 schema_name
  UPDATE public.tenants SET schema_name = _schema_name WHERE id = NEW.id;
  
  -- 4. 授权
  EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);

  -- 5. 使用模板在 Schema 中创建表 (这部分在实际部署中需要更复杂的处理)
  -- 注意: 在这个SQL环境中，我们无法直接读取另一个文件。
  -- 这个逻辑需要在应用层面或者更高级的部署脚本中实现。
  -- 这里我们仅作演示。
  -- 实际部署时，我们会在 `db_setup.py` 中调用此函数后，再执行 `schema_tenant.sql` 的内容。

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tenant_insert_create_schema
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE PROCEDURE create_tenant_schema_and_tables();
