-- backend/lambda/db_setup_assets/schema_public.sql

-- ####################################################################
-- #                                                                    #
-- # [V8 - 架构升级] 这是多租户ERP系统的 public schema 定义。          #
-- #                                                                    #
-- # 核心升级:                                                        #
-- # 1. 新增 `industries`, `features`, `plans` 核心元数据表。         #
-- # 2. 新增 `plan_features` 关联表，实现 Plan -> Features 的动态授权。#
-- # 3. 改造 `tenants` 表，使用外键关联 `plans` 和 `industries`。     #
-- # 4. 预置了初始的行业、功能和订阅方案数据。                        #
-- #                                                                    #
-- ####################################################################

-- ========= 创建 industries (行业) 表 =========
CREATE TABLE IF NOT EXISTS public.industries (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE -- 行业名称, e.g., '五金机电', '服装鞋帽'
);

-- ========= 创建 features (功能模块) 表 =========
CREATE TABLE IF NOT EXISTS public.features (
    id SERIAL PRIMARY KEY,
    code VARCHAR(100) NOT NULL UNIQUE, -- 机器可读的唯一标识, e.g., 'MOBILE_APP', 'AI_ANALYSIS'
    name VARCHAR(100) NOT NULL,       -- 人类可读的名称, e.g., '移动端App', 'AI智能分析'
    description TEXT
);

-- ========= 创建 plans (订阅方案) 表 =========
CREATE TABLE IF NOT EXISTS public.plans (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL UNIQUE, -- 机器可读的唯一标识, e.g., 'basic', 'pro', 'enterprise'
    name VARCHAR(100) NOT NULL,      -- 人类可读的名称, e.g., '基础版', '专业版', '企业版'
    description TEXT
);

-- ========= 创建 plan_features (方案-功能关联) 表 =========
CREATE TABLE IF NOT EXISTS public.plan_features (
    plan_id INT NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
    feature_id INT NOT NULL REFERENCES public.features(id) ON DELETE CASCADE,
    PRIMARY KEY (plan_id, feature_id)
);


-- ========= 改造 tenants 表 =========
-- 注意：这是一个破坏性改动。如果旧表已存在，需要先手动迁移数据。
DROP TABLE IF EXISTS public.tenants CASCADE; -- 使用 CASCADE 以删除依赖此表的触发器等对象
CREATE TABLE public.tenants (
    id SERIAL PRIMARY KEY,                          -- 租户的唯一数字ID
    name VARCHAR(255) NOT NULL,                     -- 租户的公司或组织名称
    domain VARCHAR(255) UNIQUE,                     -- 租户用于登录的唯一子域名
    schema_name VARCHAR(255) UNIQUE,                -- 租户在数据库中的隔离schema名称
    plan_id INT REFERENCES public.plans(id),        -- 外键，关联到订阅方案
    industry_id INT REFERENCES public.industries(id), -- 外键，关联到所属行业
    status VARCHAR(50) NOT NULL,                    -- 租户账户的状态 (e.g., 'active', 'disabled', 'pending')
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    admin_name VARCHAR(255),                        -- 租户的管理员姓名
    admin_email VARCHAR(255)                        -- 租户管理员的联系邮箱
);

-- ========= 重新创建 tenants 表的相关触发器 =========

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

-- 自动创建租户 Schema 的触发器
CREATE OR REPLACE FUNCTION create_tenant_schema_and_tables()
  RETURNS TRIGGER AS $$
DECLARE
  _schema_name text;
BEGIN
  _schema_name := 'tenant_' || NEW.id;
  UPDATE public.tenants SET schema_name = _schema_name WHERE id = NEW.id;
  
  EXECUTE 'CREATE SCHEMA IF NOT EXISTS ' || quote_ident(_schema_name);
  EXECUTE 'GRANT ALL PRIVILEGES ON SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);
  EXECUTE 'GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA ' || quote_ident(_schema_name) || ' TO ' || quote_ident(current_user);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_tenant_insert_create_schema
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE PROCEDURE create_tenant_schema_and_tables();


-- ####################################################################
-- #                                                                    #
-- # 预置初始数据 (Idempotent - 幂等操作)                           #
-- #                                                                    #
-- ####################################################################

-- ========= 插入初始行业数据 =========
INSERT INTO public.industries (name) VALUES ('五金机电'), ('服装鞋帽'), ('餐饮零售'), ('其他') ON CONFLICT (name) DO NOTHING;

-- ========= 插入初始订阅方案数据 =========
INSERT INTO public.plans (code, name, description) VALUES 
('basic', '基础版', '包含核心进销存功能，满足基本日常运营需求'),
('pro', '专业版', '包含所有基础版功能，并增加移动端App支持和高级报表'),
('enterprise', '企业版', '包含所有专业版功能，并提供AI智能分析、开放平台和专属客户支持')
ON CONFLICT (code) DO NOTHING;

-- ========= 插入初始功能模块数据 =========
-- 数据来源于前端代码 `types.ts` 中的 `Page` 枚举
INSERT INTO public.features (code, name, description) VALUES
('DASHBOARD', '仪表盘', '系统主页和数据概览'),
('PRODUCT_LIST', '商品列表', '管理和查看所有商品信息'),
('INVENTORY', '库存中心', '管理库存、仓库和调拨'),
('ORDERS', '订单中心', '管理销售订单和采购订单'),
('PARTNERS', '往来单位', '管理客户和供应商'),
('FINANCE', '财务中心', '管理应收应付和发票'),
('MOBILE_APP', '移动端App', '通过手机App进行核心操作'),
('AI_ANALYSIS', 'AI智能分析', '基于数据的智能预测和分析'),
('SAAS_ADMIN', 'SaaS平台管理', '管理租户、订阅和系统设置')
ON CONFLICT (code) DO NOTHING;

-- ========= 绑定方案与功能 =========
-- 使用 CTEs (Common Table Expressions) 来获取ID，使绑定更清晰、更健壮
DO $$
DECLARE
    basic_plan_id INT;
    pro_plan_id INT;
    enterprise_plan_id INT;

    dashboard_feature_id INT;
    product_list_feature_id INT;
    inventory_feature_id INT;
    orders_feature_id INT;
    partners_feature_id INT;
    finance_feature_id INT;
    mobile_app_feature_id INT;
    ai_analysis_feature_id INT;
    saas_admin_feature_id INT;
BEGIN
    -- 获取方案ID
    SELECT id INTO basic_plan_id FROM public.plans WHERE code = 'basic';
    SELECT id INTO pro_plan_id FROM public.plans WHERE code = 'pro';
    SELECT id INTO enterprise_plan_id FROM public.plans WHERE code = 'enterprise';

    -- 获取功能ID
    SELECT id INTO dashboard_feature_id FROM public.features WHERE code = 'DASHBOARD';
    SELECT id INTO product_list_feature_id FROM public.features WHERE code = 'PRODUCT_LIST';
    SELECT id INTO inventory_feature_id FROM public.features WHERE code = 'INVENTORY';
    SELECT id INTO orders_feature_id FROM public.features WHERE code = 'ORDERS';
    SELECT id INTO partners_feature_id FROM public.features WHERE code = 'PARTNERS';
    SELECT id INTO finance_feature_id FROM public.features WHERE code = 'FINANCE';
    SELECT id INTO mobile_app_feature_id FROM public.features WHERE code = 'MOBILE_APP';
    SELECT id INTO ai_analysis_feature_id FROM public.features WHERE code = 'AI_ANALYSIS';
    SELECT id INTO saas_admin_feature_id FROM public.features WHERE code = 'SAAS_ADMIN';

    -- 清空旧的绑定关系，以确保幂等性
    DELETE FROM public.plan_features;

    -- 基础版功能
    INSERT INTO public.plan_features (plan_id, feature_id) VALUES
    (basic_plan_id, dashboard_feature_id),
    (basic_plan_id, product_list_feature_id),
    (basic_plan_id, inventory_feature_id),
    (basic_plan_id, orders_feature_id),
    (basic_plan_id, partners_feature_id),
    (basic_plan_id, finance_feature_id)
    ON CONFLICT DO NOTHING;

    -- 专业版功能 (包含基础版 + 新增)
    INSERT INTO public.plan_features (plan_id, feature_id) VALUES
    (pro_plan_id, dashboard_feature_id),
    (pro_plan_id, product_list_feature_id),
    (pro_plan_id, inventory_feature_id),
    (pro_plan_id, orders_feature_id),
    (pro_plan_id, partners_feature_id),
    (pro_plan_id, finance_feature_id),
    (pro_plan_id, mobile_app_feature_id) -- Pro 新增
    ON CONFLICT DO NOTHING;

    -- 企业版功能 (包含专业版 + 新增)
    INSERT INTO public.plan_features (plan_id, feature_id) VALUES
    (enterprise_plan_id, dashboard_feature_id),
    (enterprise_plan_id, product_list_feature_id),
    (enterprise_plan_id, inventory_feature_id),
    (enterprise_plan_id, orders_feature_id),
    (enterprise_plan_id, partners_feature_id),
    (enterprise_plan_id, finance_feature_id),
    (enterprise_plan_id, mobile_app_feature_id),
    (enterprise_plan_id, ai_analysis_feature_id) -- Enterprise 新增
    ON CONFLICT DO NOTHING;

    -- 注意: SAAS_ADMIN 功能不属于任何租户的plan，它应该由 `superadmin` 的特殊逻辑来控制。

END;
$$;
