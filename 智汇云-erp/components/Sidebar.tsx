
import React, { useMemo } from 'react';
import { Page, User, Role } from '../types';
import { Icons } from './Icons';

interface SidebarProps {
  activePage: Page;
  setPage: (page: Page) => void;
  user: User | null;
}

// Permission configuration: Which roles can see which pages?
// If a page isn't listed here, assume it's allowed for 'admin' only unless handled by default.
// '*' means all roles.
const ROLE_ACCESS: Record<string, Role[]> = {
    [Page.DASHBOARD]: ['admin', 'sales', 'warehouse', 'finance'],
    
    // Sales Related
    [Page.POS]: ['admin', 'sales'],
    [Page.ORDER_LIST]: ['admin', 'sales', 'finance'],
    [Page.QUOTATIONS]: ['admin', 'sales'],
    [Page.SUPPLIERS_CUSTOMERS]: ['admin', 'sales', 'finance'],
    [Page.RETURN_MANAGEMENT]: ['admin', 'sales', 'warehouse'],
    
    // Inventory/Warehouse Related
    [Page.INVENTORY_LIST]: ['admin', 'warehouse', 'sales'], // Sales can view stock
    [Page.INVENTORY_HISTORY]: ['admin', 'warehouse'],
    [Page.WAREHOUSE]: ['admin', 'warehouse'],
    [Page.INVENTORY_CHECK]: ['admin', 'warehouse', 'finance'],
    [Page.SCAN_INBOUND]: ['admin', 'warehouse'],
    [Page.SALES_OUTBOUND]: ['admin', 'warehouse'],
    [Page.STOCK_TRANSFER]: ['admin', 'warehouse'],
    
    // Purchase
    [Page.PURCHASE_ORDERS]: ['admin', 'warehouse', 'finance'], // Warehouse needs to see POs to receive
    [Page.PURCHASE_PLAN]: ['admin', 'warehouse', 'sales'],

    // Product Mgmt
    [Page.PRODUCTS]: ['admin', 'sales', 'warehouse'],
    [Page.CATEGORY_MGMT]: ['admin', 'sales'],

    // Finance
    [Page.FINANCE]: ['admin', 'finance'],
    [Page.RECONCILIATION]: ['admin', 'finance', 'sales'], // Sales might need to check customer balance
    [Page.INVOICE_MANAGEMENT]: ['admin', 'finance'],

    // System
    [Page.APPROVALS]: ['admin', 'finance', 'sales', 'warehouse'], // Everyone has approvals
    [Page.APPROVAL_WORKFLOW]: ['admin'],
    [Page.PERMISSION_MANAGEMENT]: ['admin'],
    [Page.SETTINGS]: ['admin'],
    [Page.PRINT_CENTER]: ['admin', 'sales', 'warehouse', 'finance'], // Everyone prints
};

export const Sidebar: React.FC<SidebarProps> = ({ activePage, setPage, user }) => {
  
  const hasAccess = (pageId: Page) => {
      if (!user) return false;
      const allowedRoles = ROLE_ACCESS[pageId];
      if (!allowedRoles) return user.role === 'admin'; // Default strict
      return allowedRoles.includes(user.role);
  };

  const menuGroups = useMemo(() => {
      const allGroups = [
        {
          title: '运营中心',
          items: [
            { id: Page.DASHBOARD, label: '仪表盘', icon: Icons.Dashboard },
            { id: Page.POS, label: '前台收银', icon: Icons.POS },
            { id: Page.PRINT_CENTER, label: '单据打印', icon: Icons.Print },
          ]
        },
        {
          title: '订单管理',
          items: [
            { id: Page.ORDER_LIST, label: '销售订单', icon: Icons.Order },
            { id: Page.PURCHASE_ORDERS, label: '采购订单', icon: Icons.ShoppingCart },
            { id: Page.RETURN_MANAGEMENT, label: '退货管理', icon: Icons.Undo },
            { id: Page.PURCHASE_PLAN, label: '智能补货', icon: Icons.Calculator },
          ]
        },
        {
          title: '库存中心',
          items: [
            { id: Page.INVENTORY_LIST, label: '实时库存', icon: Icons.Inventory },
            { id: Page.INVENTORY_HISTORY, label: '变动明细', icon: Icons.Activity },
            { id: Page.WAREHOUSE, label: '仓库管理', icon: Icons.Warehouse },
            { id: Page.INVENTORY_CHECK, label: '库存盘点', icon: Icons.ClipboardCheck },
            { id: Page.SCAN_INBOUND, label: '入库管理', icon: Icons.Inbound },
            { id: Page.SALES_OUTBOUND, label: '出库管理', icon: Icons.Outbound },
            { id: Page.STOCK_TRANSFER, label: '仓库调拨', icon: Icons.Transfer },
          ]
        },
        {
          title: '商品管理',
          items: [
            { id: Page.PRODUCTS, label: '商品档案', icon: Icons.Product },
            { id: Page.CATEGORY_MGMT, label: '分类管理', icon: Icons.Category },
          ]
        },
        {
          title: '业务往来',
          items: [
            { id: Page.QUOTATIONS, label: '报价单', icon: Icons.FileText },
            { id: Page.SUPPLIERS_CUSTOMERS, label: '客户供应商', icon: Icons.Briefcase },
          ]
        },
        {
          title: '财务管理',
          items: [
            { id: Page.RECONCILIATION, label: '对账工作台', icon: Icons.FileCheck },
            { id: Page.FINANCE, label: '财务管理中心', icon: Icons.Chart },
            { id: Page.INVOICE_MANAGEMENT, label: '发票管理', icon: Icons.FileText },
          ]
        },
        {
          title: '审批中心',
          items: [
            { id: Page.APPROVALS, label: '业务审批', icon: Icons.CheckSquare },
            { id: Page.APPROVAL_WORKFLOW, label: '审批流配置', icon: Icons.FileCheck },
          ]
        },
        {
          title: '系统管理',
          items: [
            { id: Page.PERMISSION_MANAGEMENT, label: '员工权限', icon: Icons.Users },
            { id: Page.SETTINGS, label: '系统设置', icon: Icons.Settings },
          ]
        }
      ];

      // Filter groups and items
      return allGroups.map(group => ({
          ...group,
          items: group.items.filter(item => hasAccess(item.id))
      })).filter(group => group.items.length > 0);

  }, [user]);

  return (
    <aside className="w-64 bg-white border-r border-gray-200 h-screen flex-col hidden md:flex fixed left-0 top-0 z-20 overflow-y-auto custom-scrollbar">
      <div className="h-20 flex items-center px-6 border-b border-gray-100 flex-shrink-0 sticky top-0 bg-white/90 backdrop-blur z-30">
        <div className="w-10 h-10 bg-primary-500 rounded-2xl flex items-center justify-center mr-3 text-white font-black text-xl shadow-lg shadow-primary-100 transform rotate-3">
          五
        </div>
        <span className="text-xl font-black text-gray-800 tracking-tighter italic">智汇五金 ERP</span>
      </div>

      <div className="flex-1 py-6">
        {menuGroups.map((group, idx) => (
          <div key={idx} className="mb-8 px-4">
            <div className="px-4 mb-3 text-[9px] font-black text-gray-400 uppercase tracking-[0.3em] italic border-l-2 border-gray-100 ml-2">
              {group.title}
            </div>
            <nav className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon || Icons.File; // Fallback icon
                const isActive = activePage === item.id || (activePage === Page.WAREHOUSE_LAYOUT && item.id === Page.WAREHOUSE);
                return (
                  <button
                    key={item.id}
                    onClick={() => setPage(item.id)}
                    className={`w-full flex items-center px-4 py-3 text-xs font-bold uppercase tracking-widest rounded-xl transition-all ${
                      isActive
                        ? 'bg-primary-600 text-white shadow-lg shadow-primary-100'
                        : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                    }`}
                  >
                    <Icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>
        ))}
      </div>

      {user && (
        <div className="p-5 border-t border-gray-100 sticky bottom-0 bg-white/90 backdrop-blur">
            <div className="flex items-center gap-3 p-3 rounded-2xl hover:bg-gray-50 cursor-pointer transition-all border border-transparent hover:border-gray-100 group" onClick={() => setPage(Page.USER_DETAIL)}>
            <div className="w-10 h-10 rounded-xl overflow-hidden ring-2 ring-primary-100 p-0.5 group-hover:scale-110 transition-transform">
                <img className="h-full w-full rounded-lg object-cover" src={user.avatar || "https://picsum.photos/100/100"} alt="Avatar" />
            </div>
            <div className="min-w-0">
                <p className="text-sm font-black text-gray-900 truncate">{user.name}</p>
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest">{user.roleName}</p>
            </div>
            </div>
        </div>
      )}
    </aside>
  );
};
