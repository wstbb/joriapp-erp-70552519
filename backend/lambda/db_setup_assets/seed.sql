-- [V9 - 密码修复版]
-- 职责: 插入标准数据，并强制修正 admin 用户的密码哈希。

-- 插入或更新 admin 用户
-- 使用 ON CONFLICT 确保无论用户是否存在，其密码哈希都会被更新为正确的值。
-- 密码 '123456' 对应的哈希值
INSERT INTO users (name, email, password_hash, role)
VALUES ('admin', 'admin@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'admin')
ON CONFLICT (email) 
DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- 插入其他用户，如果 email 已存在，则什么都不做
INSERT INTO users (name, email, password_hash, role)
SELECT 'wh', 'wh@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'warehouse'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'wh@example.com');

INSERT INTO users (name, email, password_hash, role)
SELECT 'fin', 'fin@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'finance'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE email = 'fin@example.com');


-- 插入默认分类，如果已存在则跳过
INSERT INTO categories (name)
SELECT '默认分类' WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '默认分类');

-- 插入默认仓库，如果已存在则跳过
INSERT INTO warehouses (name, location)
SELECT '默认仓库', '中心城区' WHERE NOT EXISTS (SELECT 1 FROM warehouses WHERE name = '默认仓库');

-- 插入示例产品，如果 sku 已存在则跳过
DO $$
DECLARE
    default_cat_id INT;
BEGIN
    SELECT id INTO default_cat_id FROM categories WHERE name = '默认分类' LIMIT 1;
    IF default_cat_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM products WHERE sku = 'SKU-001') THEN
        INSERT INTO products (category_id, sku, name, specs, unit, base_price, cost_price)
        VALUES (default_cat_id, 'SKU-001', '示例产品', '红色, 500g', '件', 199.99, 99.99);
    END IF;
END;
$$;

-- 插入初始库存，如果已存在则跳过
DO $$
DECLARE
    prod_id INT;
    wh_id INT;
BEGIN
    SELECT id INTO prod_id FROM products WHERE sku = 'SKU-001' LIMIT 1;
    SELECT id INTO wh_id FROM warehouses WHERE name = '默认仓库' LIMIT 1;

    IF prod_id IS NOT NULL AND wh_id IS NOT NULL AND NOT EXISTS (SELECT 1 FROM inventory WHERE product_id = prod_id AND warehouse_id = wh_id) THEN
        INSERT INTO inventory (product_id, warehouse_id, quantity)
        VALUES (prod_id, wh_id, 100);
    END IF;
END;
$$;
