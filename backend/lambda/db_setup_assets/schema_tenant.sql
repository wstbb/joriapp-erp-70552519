-- #################################################################
-- # 智汇云 (Zhihui Cloud) ERP - 租户模板 Schema (schema_tenant.sql)
-- # 版本: 3.1
-- #
-- # --- 用途 ---
-- # 此脚本定义了一个核心函数 `create_tenant_schema`。
-- # 这个函数封装了为新租户创建其私有schema和所有业务表的全部逻辑。
-- # 它应该在数据库初始化时，在 `schema_public.sql` 之后执行一次。
-- #
-- # --- 如何更新 ---
-- # 如果未来需要为新租户的表结构增加字段或添加新表，只需更新此函数即可。
-- #################################################################

BEGIN;

CREATE OR REPLACE FUNCTION create_tenant_schema(schema_name TEXT)
RETURNS void AS $$
BEGIN
    -- 步骤 1: 创建新的 schema
    EXECUTE format('CREATE SCHEMA %I', schema_name);

    -- 步骤 2: 在新的 schema 中创建所有业务表

    -- 用户表
    EXECUTE format('CREATE TABLE %I.users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT \'staff\',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name);

    -- 分类表
    EXECUTE format('CREATE TABLE %I.categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES %I.categories(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name);

    -- 产品表
    EXECUTE format('CREATE TABLE %I.products (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES %I.categories(id),
        sku VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        specs TEXT,
        unit VARCHAR(50),
        base_price NUMERIC(12, 2) DEFAULT 0.00,
        cost_price NUMERIC(12, 2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name);

    -- 仓库表
    EXECUTE format('CREATE TABLE %I.warehouses (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE
    )', schema_name);

    -- 库存表
    EXECUTE format('CREATE TABLE %I.inventory (
        product_id INTEGER NOT NULL REFERENCES %I.products(id) ON DELETE CASCADE,
        warehouse_id INTEGER NOT NULL REFERENCES %I.warehouses(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (product_id, warehouse_id)
    )', schema_name, schema_name, schema_name);

    -- 合作伙伴表
    EXECUTE format('CREATE TABLE %I.partners (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL, -- 'supplier' or 'customer'
        name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name);

    -- 订单表
    EXECUTE format('CREATE TABLE %I.orders (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(100) NOT NULL UNIQUE,
        partner_id INTEGER NOT NULL REFERENCES %I.partners(id),
        user_id INTEGER REFERENCES %I.users(id),
        type VARCHAR(50) NOT NULL, -- 'purchase', 'sales'
        status VARCHAR(50) DEFAULT \'draft\',
        total_amount NUMERIC(12, 2) NOT NULL,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name, schema_name);

    -- 订单明细表
    EXECUTE format('CREATE TABLE %I.order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES %I.orders(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES %I.products(id),
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL
    )', schema_name, schema_name, schema_name);

    -- 库存流水表
    EXECUTE format('CREATE TABLE %I.inventory_movements (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES %I.products(id),
        warehouse_id INTEGER NOT NULL REFERENCES %I.warehouses(id),
        type VARCHAR(50) NOT NULL, -- 'purchase_in', 'sale_out', etc.
        quantity_change INTEGER NOT NULL,
        reference_id INTEGER, -- e.g., orders.id
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name, schema_name);

END;
$$ LANGUAGE plpgsql;

COMMIT;
