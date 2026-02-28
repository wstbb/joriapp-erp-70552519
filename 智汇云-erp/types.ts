
import React from 'react';

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

export interface Tenant {
  id: string;
  name: string;
  domain: string;
  adminName: string;
  adminEmail: string;
  status: 'active' | 'deploying' | 'suspended';
  createdAt: string;
  plan: PlanType;
  industry?: string;
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

export interface StatCardProps {
  title: string;
  value: string;
  trend: number;
  trendLabel: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
}
