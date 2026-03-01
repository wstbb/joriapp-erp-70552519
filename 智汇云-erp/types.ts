
export enum Page {
  DASHBOARD = 'DASHBOARD',
  PRODUCTS = 'PRODUCTS', 
  PRODUCT_ENTRY = 'PRODUCT_ENTRY',
  CATEGORY_MGMT = 'CATEGORY_MGMT',
  POS = 'POS',
  WAREHOUSE = 'WAREHOUSE', // Warehouse Management List
  WAREHOUSE_LAYOUT = 'WAREHOUSE_LAYOUT', // Visual Map View
  WAREHOUSE_EDIT = 'WAREHOUSE_EDIT', // Create/Edit Warehouse
  RACK_MGMT = 'RACK_MGMT',
  INVENTORY_LIST = 'INVENTORY_LIST', 
  INVENTORY_HISTORY = 'INVENTORY_HISTORY', 
  INVENTORY_HISTORY_DETAIL = 'INVENTORY_HISTORY_DETAIL',
  SCAN_INBOUND = 'SCAN_INBOUND',
  INBOUND_DETAIL = 'INBOUND_DETAIL',
  SCAN_INBOUND_SUCCESS = 'SCAN_INBOUND_SUCCESS',
  SALES_OUTBOUND = 'SALES_OUTBOUND',
  OUTBOUND_DETAIL = 'OUTBOUND_DETAIL',
  STOCK_TRANSFER = 'STOCK_TRANSFER',
  STOCK_TRANSFER_DETAIL = 'STOCK_TRANSFER_DETAIL',
  STOCK_TRANSFER_SUCCESS = 'STOCK_TRANSFER_SUCCESS',
  INVENTORY_CHECK = 'INVENTORY_CHECK',
  INVENTORY_CHECK_DETAIL = 'INVENTORY_CHECK_DETAIL',
  QUOTATIONS = 'QUOTATIONS',
  SUPPLIERS_CUSTOMERS = 'SUPPLIERS_CUSTOMERS',
  FINANCE = 'FINANCE',
  RECONCILIATION = 'RECONCILIATION',
  RECONCILIATION_DETAIL = 'RECONCILIATION_DETAIL',
  APPROVALS = 'APPROVALS',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  USER_DETAIL = 'USER_DETAIL',
  SETTINGS = 'SETTINGS',
  NOTIFICATIONS = 'NOTIFICATIONS',
  ORDER_LIST = 'ORDER_LIST', 
  ORDER_DETAIL = 'ORDER_DETAIL',
  PURCHASE_ORDERS = 'PURCHASE_ORDERS',
  PURCHASE_ORDER_DETAIL = 'PURCHASE_ORDER_DETAIL',
  PURCHASE_ORDER_ENTRY = 'PURCHASE_ORDER_ENTRY',
  SALES_ORDER_ENTRY = 'SALES_ORDER_ENTRY',
  APPROVAL_WORKFLOW = 'APPROVAL_WORKFLOW',
  PRINT_CENTER = 'PRINT_CENTER',
  PERMISSION_MANAGEMENT = 'PERMISSION_MANAGEMENT',
  PARTNER_DETAIL = 'PARTNER_DETAIL',
  PURCHASE_PLAN = 'PURCHASE_PLAN',
  QUOTATION_DETAIL = 'QUOTATION_DETAIL',
  RETURN_MANAGEMENT = 'RETURN_MANAGEMENT',
  RETURN_DETAIL = 'RETURN_DETAIL',
  INVOICE_MANAGEMENT = 'INVOICE_MANAGEMENT',
  SAAS_ADMIN = 'SAAS_ADMIN'
}

export type Role = 'admin' | 'sales' | 'warehouse' | 'finance' | 'super_admin';

export type PlanType = 'basic' | 'pro' | 'enterprise';

/**
 * @interface Plan
 * @description 定义了订阅方案的数据结构，从API `/admin/plans` 获取。
 */
export interface Plan {
  code: string;       // 方案的唯一代码 (例如: "pro", "enterprise")
  name: string;       // 方案的显示名称 (例如: "专业版")
  description: string; // 方案的简要描述
}

/**
 * @interface Industry
 * @description 定义了所属行业的数据结构，从API `/admin/industries` 获取。
 */
export interface Industry {
  id: number;  // 行业的唯一ID
  name: string; // 行业的名称 (例如: "五金机电")
}

/**
 * @interface Tenant
 * @description (规范化修正版) 定义了租户的核心数据结构，字段命名与数据库 schema (snake_case) 完全一致。
 */
export interface Tenant {
  id: string;          // 租户的唯一ID
  name: string;        // 公司或组织名称
  domain: string;      // 分配的二级域名
  admin_name: string;  // 管理员姓名 (snake_case)
  admin_email: string; // 管理员邮箱 (snake_case)
  status: 'active' | 'deploying' | 'suspended'; // 租户状态：'运行中', '部署中', '已停用'
  created_at: string;  // 创建时间的 ISO 字符串 (snake_case)
  plan: string;        // 完整的订阅方案名称 (例如: "专业版")
  plan_code: string;   // 订阅方案的唯一代码 (snake_case)
  industry: string;    // 所属行业的名称
}

export interface User {
  id: string;
  username: string;
  fullName: string;
  email: string;
  role: Role;
  tenant_id: string;
  is_active: boolean;
  name?: string;
  roleName?: string;
  avatar?: string;
  mobileAccess?: boolean;
  permissions?: string[];
  tenantPlan?: PlanType;
  is_super_admin?: boolean;
  token?: string;
}

export interface Ticket {
  id: string;
  tenantName: string;
  type: 'bug' | 'billing' | 'feature';
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'processing' | 'resolved';
  date: string;
}

export type InvoiceType = 'vat_special' | 'vat_normal' | 'electronic'; // 专票, 普票, 电子票
export type InvoiceDirection = 'inbound' | 'outbound'; // 进项(采购), 销项(销售)
export type InvoiceStatus = 'draft' | 'issued' | 'cancelled' | 'verified'; // 草稿, 已开, 作废, 已认证(进项)

export interface Invoice {
  id: string;
  number: string; // 发票号码
  code: string; // 发票代码
  type: InvoiceType;
  direction: InvoiceDirection;
  amount: number; // 不含税金额
  tax: number; // 税额
  total: number; // 价税合计
  rate: number; // 税率 0.13, 0.06 etc.
  date: string;
  counterparty: string; // 购买方/销售方名称
  relatedOrderId?: string; // 关联订单ID
  relatedOrderType?: 'sales' | 'purchase';
  status: InvoiceStatus;
  fileUrl?: string; // 电子发票链接
}

export interface InvoicePoolStats {
  totalInboundTax: number; // 进项税总额
  totalOutboundTax: number; // 销项税总额
  balance: number; // 抵扣余额
  monthlyQuota: number; // 月度开票限额
  usedQuota: number; // 已用额度
  alertThreshold: number; // 预警阈值 (百分比)
}

export interface QuotationItem {
    name: string;
    sku: string;
    price: number;
    qty: number;
    unit: string;
    discount?: string;
    total: number;
}

export interface Quotation {
    id: string;
    client: string;
    amount: number;
    date: string;
    status: 'pending' | 'accepted' | 'expired' | 'rejected';
    items: QuotationItem[];
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  specs: string;
  unit: string;
  stock: number;
  price: number;
  location: string;
  image: string;
  status: 'normal' | 'low_stock' | 'out_of_stock';
}

/**
 * @interface StatCardProps
 * @description (语法修正版) 统计卡片组件的属性定义。
 */
export interface StatCardProps {
  title: string;        // 卡片标题
  value: string;        // 显示的主要数值
  trend?: number;       // (可选) 趋势百分比，例如 10 或 -5。
  trendLabel?: string;  // (可选) 趋势标签，例如 "相比上月"。
  icon: React.ReactElement<{ className?: string }>;            // 卡片图标 (类型修正为 any)
  color: string;        // 卡片颜色相关的CSS类
  onClick?: () => void; // (可选) 卡片点击事件
}
