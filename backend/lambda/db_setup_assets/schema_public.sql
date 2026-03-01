-- backend/lambda/db_setup_assets/schema_public.sql

-- ####################################################################
-- #                                                                    #
-- # [V13 - 最终修正版] 这是多租户ERP系统的 public schema 定义。          #
-- #                                                                    #
-- # 核心修正:                                                        #
-- # 1. 彻底移除所有 `ON CONFLICT` 语句，与 V12 版本的 `db_setup.py`    #
-- #    的 “先查后写” 逻辑保持完全一致，解决部署冲突。                  #
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

DROP TRIGGER IF EXISTS update_tenants_changetimestamp ON public.tenants;
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

DROP TRIGGER IF EXISTS on_tenant_insert_create_schema ON public.tenants;
CREATE TRIGGER on_tenant_insert_create_schema
  AFTER INSERT ON public.tenants
  FOR EACH ROW EXECUTE PROCEDURE create_tenant_schema_and_tables();


-- ####################################################################
-- #                                                                    #
-- # 预置初始数据 (Idempotent - 幂等操作)                           #
-- #                                                                    #
-- ####################################################################

-- ========= 插入初始行业数据 =========
INSERT INTO public.industries (name) SELECT '五金机电' WHERE NOT EXISTS (SELECT 1 FROM public.industries WHERE name='五金机电');
INSERT INTO public.industries (name) SELECT '服装鞋帽' WHERE NOT EXISTS (SELECT 1 FROM public.industries WHERE name='服装鞋帽');
INSERT INTO public.industries (name) SELECT '餐饮零售' WHERE NOT EXISTS (SELECT 1 FROM public.industries WHERE name='餐饮零售');
INSERT INTO public.industries (name) SELECT '其他' WHERE NOT EXISTS (SELECT 1 FROM public.industries WHERE name='其他');

-- ========= 插入初始订阅方案数据 =========
INSERT INTO public.plans (code, name, description) SELECT 'basic', '基础版', '包含核心进销存功能，满足基本日常运营需求' WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code='basic');
INSERT INTO public.plans (code, name, description) SELECT 'pro', '专业版', '包含所有基础版功能，并增加移动端App支持和高级报表' WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code='pro');
INSERT INTO public.plans (code, name, description) SELECT 'enterprise', '企业版', '包含所有专业版功能，并提供AI智能分析、开放平台和专属客户支持' WHERE NOT EXISTS (SELECT 1 FROM public.plans WHERE code='enterprise');

-- ========= 插入初始功能模块数据 =========
INSERT INTO public.features (code, name, description) SELECT 'DASHBOARD', '仪表盘', '系统主页和数据概览' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='DASHBOARD');
INSERT INTO public.features (code, name, description) SELECT 'PRODUCT_LIST', '商品列表', '管理和查看所有商品信息' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='PRODUCT_LIST');
INSERT INTO public.features (code, name, description) SELECT 'INVENTORY', '库存中心', '管理库存、仓库和调拨' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='INVENTORY');
INSERT INTO public.features (code, name, description) SELECT 'ORDERS', '订单中心', '管理销售订单和采购订单' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='ORDERS');
INSERT INTO public.features (code, name, description) SELECT 'PARTNERS', '往来单位', '管理客户和供应商' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='PARTNERS');
INSERT INTO public.features (code, name, description) SELECT 'FINANCE', '财务中心', '管理应收应付和发票' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='FINANCE');
INSERT INTO public.features (code, name, description) SELECT 'MOBILE_APP', '移动端App', '通过手机App进行核心操作' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='MOBILE_APP');
INSERT INTO public.features (code, name, description) SELECT 'AI_ANALYSIS', 'AI智能分析', '基于数据的智能预测和分析' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='AI_ANALYSIS');
INSERT INTO public.features (code, name, description) SELECT 'SAAS_ADMIN', 'SaaS平台管理', '管理租户、订阅和系统设置' WHERE NOT EXISTS (SELECT 1 FROM public.features WHERE code='SAAS_ADMIN');

-- ========= 绑定方案与功能 =========
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

    -- 清空旧的绑定关系，以确保幂等性
    DELETE FROM public.plan_features;

    -- 基础版功能
    IF basic_plan_id IS NOT NULL THEN
        INSERT INTO public.plan_features (plan_id, feature_id) VALUES
        (basic_plan_id, dashboard_feature_id),
        (basic_plan_id, product_list_feature_id),
        (basic_plan_id, inventory_feature_id),
        (basic_plan_id, orders_feature_id),
        (basic_plan_id, partners_feature_id),
        (basic_plan_id, finance_feature_id);
    END IF;

    -- 专业版功能
    IF pro_plan_id IS NOT NULL THEN
        INSERT INTO public.plan_features (plan_id, feature_id) VALUES
        (pro_plan_id, dashboard_feature_id),
        (pro_plan_id, product_list_feature_id),
        (pro_plan_id, inventory_feature_id),
        (pro_plan_id, orders_feature_id),
        (pro_plan_id, partners_feature_id),
        (pro_plan_id, finance_feature_id),
        (pro_plan_id, mobile_app_feature_id);
    END IF;

    -- 企业版功能
    IF enterprise_plan_id IS NOT NULL THEN
        INSERT INTO public.plan_features (plan_id, feature_id) VALUES
        (enterprise_plan_id, dashboard_feature_id),
        (enterprise_plan_id, product_list_feature_id),
        (enterprise_plan_id, inventory_feature_id),
        (enterprise_plan_id, orders_feature_id),
        (enterprise_plan_id, partners_feature_id),
        (enterprise_plan_id, finance_feature_id),
        (enterprise_plan_id, mobile_app_feature_id),
        (enterprise_plan_id, ai_analysis_feature_id);
    END IF;
END;
$$;

-- ========= [V14] 方案用量限额列 (basic=5/2GB/null, pro=20/20GB/10每日, enterprise=无限制) =========
DO $$
BEGIN
    ALTER TABLE public.plans ADD COLUMN max_users INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
    ALTER TABLE public.plans ADD COLUMN max_storage_gb INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
DO $$
BEGIN
    ALTER TABLE public.plans ADD COLUMN ai_calls_per_day INT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
UPDATE public.plans SET max_users = 5, max_storage_gb = 2, ai_calls_per_day = NULL WHERE code = 'basic';
UPDATE public.plans SET max_users = 20, max_storage_gb = 20, ai_calls_per_day = 10 WHERE code = 'pro';
UPDATE public.plans SET max_users = NULL, max_storage_gb = NULL, ai_calls_per_day = NULL WHERE code = 'enterprise';

-- ========= 租户变更历史表 =========
CREATE TABLE IF NOT EXISTS public.tenant_history (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    changed_by VARCHAR(255),
    changed_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    payload JSONB
);

-- ========= 工单表 (租户在系统设置→技术支持提交，后台管理员在工单中心查看/回复) =========
CREATE TABLE IF NOT EXISTS public.tickets (
    id SERIAL PRIMARY KEY,
    tenant_id INT NOT NULL REFERENCES public.tenants(id) ON DELETE CASCADE,
    contact_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    priority VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'open',
    body TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS public.ticket_replies (
    id SERIAL PRIMARY KEY,
    ticket_id INT NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
    author_type VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
DROP TRIGGER IF EXISTS update_tickets_changetimestamp ON public.tickets;
CREATE TRIGGER update_tickets_changetimestamp BEFORE UPDATE ON public.tickets
FOR EACH ROW EXECUTE PROCEDURE update_changetimestamp_column();

-- ========= 行业默认分类/示例商品模板 (新建租户时按 industry_id 写入其 schema) =========
CREATE TABLE IF NOT EXISTS public.industry_category_templates (
    id SERIAL PRIMARY KEY,
    industry_id INT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sort_order INT DEFAULT 0
);
CREATE TABLE IF NOT EXISTS public.industry_demo_products (
    id SERIAL PRIMARY KEY,
    industry_id INT NOT NULL REFERENCES public.industries(id) ON DELETE CASCADE,
    sku VARCHAR(100) NOT NULL,
    name VARCHAR(200) NOT NULL,
    specs TEXT,
    unit VARCHAR(50),
    base_price NUMERIC(12, 2) DEFAULT 0,
    cost_price NUMERIC(12, 2) DEFAULT 0
);
-- 为已有行业插入默认分类与示例商品模板（新建租户时按行业写入其 schema）
DO $$
DECLARE
    i_五金 INT; i_服装 INT; i_餐饮 INT; i_其他 INT;
BEGIN
    SELECT id INTO i_五金 FROM public.industries WHERE name = '五金机电' LIMIT 1;
    SELECT id INTO i_服装 FROM public.industries WHERE name = '服装鞋帽' LIMIT 1;
    SELECT id INTO i_餐饮 FROM public.industries WHERE name = '餐饮零售' LIMIT 1;
    SELECT id INTO i_其他 FROM public.industries WHERE name = '其他' LIMIT 1;
    IF i_五金 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.industry_category_templates WHERE industry_id = i_五金) THEN
        INSERT INTO public.industry_category_templates (industry_id, name, sort_order) VALUES (i_五金, '五金配件', 0), (i_五金, '机电设备', 1);
        INSERT INTO public.industry_demo_products (industry_id, sku, name, specs, unit, base_price, cost_price) VALUES (i_五金, 'SAMPLE-001', '示例螺丝刀', '标准型', '把', 25.00, 12.00);
    END IF;
    IF i_服装 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.industry_category_templates WHERE industry_id = i_服装) THEN
        INSERT INTO public.industry_category_templates (industry_id, name, sort_order) VALUES (i_服装, '上衣', 0), (i_服装, '鞋帽', 1);
        INSERT INTO public.industry_demo_products (industry_id, sku, name, specs, unit, base_price, cost_price) VALUES (i_服装, 'SAMPLE-002', '示例T恤', '均码', '件', 89.00, 45.00);
    END IF;
    IF i_餐饮 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.industry_category_templates WHERE industry_id = i_餐饮) THEN
        INSERT INTO public.industry_category_templates (industry_id, name, sort_order) VALUES (i_餐饮, '食材', 0), (i_餐饮, '饮料', 1);
        INSERT INTO public.industry_demo_products (industry_id, sku, name, specs, unit, base_price, cost_price) VALUES (i_餐饮, 'SAMPLE-003', '示例饮料', '500ml', '瓶', 5.00, 2.00);
    END IF;
    IF i_其他 IS NOT NULL AND NOT EXISTS (SELECT 1 FROM public.industry_category_templates WHERE industry_id = i_其他) THEN
        INSERT INTO public.industry_category_templates (industry_id, name, sort_order) VALUES (i_其他, '默认分类', 0);
        INSERT INTO public.industry_demo_products (industry_id, sku, name, specs, unit, base_price, cost_price) VALUES (i_其他, 'SAMPLE-000', '示例商品', '通用', '件', 99.00, 50.00);
    END IF;
END $$;
