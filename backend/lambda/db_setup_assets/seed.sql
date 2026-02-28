-- [V7 - 终极幂等版 - 密码已修正]
-- 职责: 向当前指定的 schema 中插入标准的业务和用户数据。
-- 特性: 全面使用 ON CONFLICT DO NOTHING/UPDATE 保证重复执行的安全性。
-- 注释: 用户的密码哈希值已根据 '123456' 重新生成。

-- 注意：search_path 应该由调用此脚本的 db_setup.py 程序来设置。

-- 插入核心用户，如果 email 已存在，则什么都不做
-- 密码 '123456' 对应的哈希值
INSERT INTO users (name, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'admin'),
('wh', 'wh@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'warehouse'),
('fin', 'fin@example.com', '$2b$12$E1J6bK/YJOBm9c0NOYPqk.Eq8aY4hAAmAq8PPdSUq47i2AoN/W9am', 'finance')
ON CONFLICT (email) DO NOTHING;

-- 插入默认分类，如果已存在则跳过
INSERT INTO categories (name) VALUES ('默认分类') ON CONFLICT (name) DO NOTHING;

-- 插入默认仓库，如果已存在则跳过
INSERT INTO warehouses (name, location) VALUES ('默认仓库', '中心城区') ON CONFLICT (name) DO NOTHING;

-- 插入示例产品，如果 sku 已存在则跳过
-- 使用 CTE 获取 category_id，避免硬编码
WITH default_category AS (
  SELECT id FROM categories WHERE name = '默认分类' LIMIT 1
)
INSERT INTO products (category_id, sku, name, specs, unit, base_price, cost_price)
SELECT id, 'SKU-001', '示例产品', '红色, 500g', '件', 199.99, 99.99 FROM default_category
ON CONFLICT (sku) DO NOTHING;

-- 插入初始库存，如果已存在则更新数量（这里选择更新，也可以选择 DO NOTHING）
-- 使用 CTE 获取 product_id 和 warehouse_id
WITH target_refs AS (
  SELECT p.id AS product_id, w.id AS warehouse_id
  FROM products p, warehouses w
  WHERE p.sku = 'SKU-001' AND w.name = '默认仓库'
)
INSERT INTO inventory (product_id, warehouse_id, quantity)
SELECT product_id, warehouse_id, 100 FROM target_refs
ON CONFLICT (product_id, warehouse_id) DO UPDATE SET quantity = EXCLUDED.quantity;
