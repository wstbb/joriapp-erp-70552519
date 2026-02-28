-- #################################################################
-- # 智汇云 (Zhihui Cloud) ERP - 租户模板 Schema (schema_tenant.sql)
-- # 版本: 5.0 (终极健壮修复版)
-- #
-- # --- 核心修复 ---
-- # 1. 函数名修正为 `create_tenant_tables_and_roles`。
-- # 2. 修正了 SQL 字符串中的单引号转义 (使用 '')。
-- # 3. 为所有表名和引用添加了双引号。
-- # 4. **关键新增**: 为所有 `CREATE TABLE` 语句添加 `IF NOT EXISTS`，
-- #    确保此脚本在重复执行时不会因表已存在而报错，增强了初始化过程的健壮性。
-- #################################################################

CREATE OR REPLACE FUNCTION create_tenant_tables_and_roles(schema_name TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."users" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT ''staff'',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."categories" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        parent_id INTEGER REFERENCES %I."categories"(id) ON DELETE SET NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."products" (
        id SERIAL PRIMARY KEY,
        category_id INTEGER REFERENCES %I."categories"(id),
        sku VARCHAR(100) NOT NULL UNIQUE,
        name VARCHAR(200) NOT NULL,
        specs TEXT,
        unit VARCHAR(50),
        base_price NUMERIC(12, 2) DEFAULT 0.00,
        cost_price NUMERIC(12, 2) DEFAULT 0.00,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."warehouses" (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL UNIQUE,
        location VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE
    )', schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."inventory" (
        product_id INTEGER NOT NULL REFERENCES %I."products"(id) ON DELETE CASCADE,
        warehouse_id INTEGER NOT NULL REFERENCES %I."warehouses"(id) ON DELETE CASCADE,
        quantity INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (product_id, warehouse_id)
    )', schema_name, schema_name, schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."partners" (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL, -- ''supplier'' or ''customer''
        name VARCHAR(150) NOT NULL,
        contact_person VARCHAR(100),
        email VARCHAR(100),
        phone VARCHAR(50),
        address TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."orders" (
        id SERIAL PRIMARY KEY,
        order_no VARCHAR(100) NOT NULL UNIQUE,
        partner_id INTEGER NOT NULL REFERENCES %I."partners"(id),
        user_id INTEGER REFERENCES %I."users"(id),
        type VARCHAR(50) NOT NULL, -- ''purchase'', ''sales''
        status VARCHAR(50) DEFAULT ''draft'',
        total_amount NUMERIC(12, 2) NOT NULL,
        order_date DATE NOT NULL DEFAULT CURRENT_DATE,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name, schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."order_items" (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL REFERENCES %I."orders"(id) ON DELETE CASCADE,
        product_id INTEGER NOT NULL REFERENCES %I."products"(id),
        quantity INTEGER NOT NULL,
        unit_price NUMERIC(12, 2) NOT NULL
    )', schema_name, schema_name, schema_name);

    EXECUTE format('CREATE TABLE IF NOT EXISTS %I."inventory_movements" (
        id SERIAL PRIMARY KEY,
        product_id INTEGER NOT NULL REFERENCES %I."products"(id),
        warehouse_id INTEGER NOT NULL REFERENCES %I."warehouses"(id),
        type VARCHAR(50) NOT NULL, -- ''purchase_in'', ''sale_out'', etc.
        quantity_change INTEGER NOT NULL,
        reference_id INTEGER, -- e.g., orders.id
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    )', schema_name, schema_name, schema_name);

END;
$$ LANGUAGE plpgsql;
