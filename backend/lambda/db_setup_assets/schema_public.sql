-- backend/lambda/db_setup_assets/schema_public.sql

-- ####################################################################
-- #                                                                    #
-- # [V6 - 修复版] 这是多租户ERP系统的 public schema 定义。          #
-- #                                                                    #
-- # 核心修复:                                                        #
-- # 1. 将 `domain` 和 `schema_name` 的 `NOT NULL` 约束移除。         #
-- #    - `domain` 将由应用层代码（db_setup.py）在插入时提供。        #
-- #    - `schema_name` 必须允许为NULL，以便 `AFTER INSERT` 触发器    #
-- #      能够先创建记录，再根据新生成的ID来填充此字段。              #
-- #                                                                    #
-- ####################################################################


-- ========= 创建 tenants 表 =========
-- 这是系统的核心，用于存储所有租户的元数据。
CREATE TABLE IF NOT EXISTS public.tenants (
    id SERIAL PRIMARY KEY,                          -- 租户的唯一数字ID (例如: 1, 2, 3)
    name VARCHAR(255) NOT NULL,                     -- 租户的公司或组织名称 (例如: "ACME Corp")
    domain VARCHAR(255) UNIQUE,                     -- 租户用于登录的唯一子域名 (例如: "acme"), 在插入时由脚本提供
    schema_name VARCHAR(255) UNIQUE,                -- 租户在数据库中的隔离schema名称 (例如: "tenant_1"), 由触发器在之后填充
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

-- 清理旧触发器，以防万一
DROP TRIGGER IF EXISTS update_tenants_changetimestamp ON public.tenants;

CREATE TRIGGER update_tenants_changetimestamp BEFORE UPDATE
ON public.tenants FOR EACH ROW EXECUTE PROCEDURE 
update_changetimestamp_column();


-- ========= 自动创建租户 Schema 的触发器 =========
-- 当一个新的租户被插入到 public.tenants 表时，此触发器会自动执行以下操作：
-- (逻辑与之前版本相同，但现在可以正常工作了)
CREATE OR REPLACE FUNCTION create_tenant_schema_and_tables()
  RETURNS TRIGGER AS $$
DECLARE
  _schema_name text;
BEGIN
  _schema_name := 'tenant_' || NEW.id;
  UPDATE public.tenants SET schema_name = _schema_name WHERE id = NEW.id;
  
  EXECUTE 'CREATE SCHEMA ' || quote_ident(_schema_name);
  EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 清理旧触发器，以防万一
DROP TRIGGER IF EXISTS on_tenant_insert_create_schema ON public.tenants;

CREATE TRIGGER on_tenant_insert_create_schema
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE PROCEDURE create_tenant_schema_and_tables();
