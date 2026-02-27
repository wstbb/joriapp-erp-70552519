-- [V5 - 极简/恢复版]
-- 职责: 只负责向当前指定的 schema 中插入标准的业务和用户数据。
-- 移除了所有与主程序冲突的逻辑。
-- 恢复了为前端快捷登录设计的用户 (admin, wh, fin)。

-- 注意：search_path 应该由调用此脚本的 db_setup.py 程序来设置。

-- 恢复您需要的核心用户
INSERT INTO users (name, email, password_hash, role) VALUES
('admin', 'admin@example.com', '$2b$12$DfemgSJETe.T0M5.K/d3/eJgy.8i.25m.bSS9.6S.P.sS.sS.p.pS', 'admin'),  -- 密码: password
('wh', 'wh@example.com', '$2b$12$DfemgSJETe.T0M5.K/d3/eJgy.8i.25m.bSS9.6S.P.sS.sS.p.pS', 'warehouse'), -- 密码: password
('fin', 'fin@example.com', '$2b$12$DfemgSJETe.T0M5.K/d3/eJgy.8i.25m.bSS9.6S.P.sS.sS.p.pS', 'finance');  -- 密码: password

-- 插入一些标准的业务数据作为示例
INSERT INTO categories (name) VALUES
('默认分类');

INSERT INTO warehouses (name, location) VALUES
('默认仓库', '中心城区');

INSERT INTO products (category_id, sku, name, specs, unit, base_price, cost_price) VALUES
(1, 'SKU-001', '示例产品', '红色, 500g', '件', 199.99, 99.99);

INSERT INTO inventory (product_id, warehouse_id, quantity) VALUES
(1, 1, 100);

INSERT INTO partners (type, name, contact_person) VALUES
('customer', '示例客户', '张三'),
('supplier', '示例供应商', '李四');
