
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { ProductList } from './pages/ProductList';
import { ProductEntry, CategoryManagement } from './pages/ProductPages';
import { POS } from './pages/POS';
import { WarehouseLayout, WarehouseManagement, WarehouseEdit } from './pages/WarehouseMap';
import { ScanInbound, InboundDetail, SalesOutbound, OutboundDetail, StockTransfer, StockTransferDetail, InventoryCheck, InventoryCheckDetail } from './pages/InventoryOperations';
import { Quotations, SupplierCustomer, PrintCenter, PartnerDetail, QuotationDetail } from './pages/BusinessPages';
import { SalesOrderList, PurchaseOrderList, SalesOrderEntry, OrderDetail, PurchaseOrderDetail, PurchaseOrderEntry } from './pages/OrderPages';
import { InventoryList, InventoryHistory, InventoryHistoryDetail } from './pages/InventoryPages';
import { FinancialReports } from './pages/FinancePages';
import { ReconciliationWorkbench } from './pages/ReconciliationWorkbench';
import { ReconciliationDetail } from './pages/ReconciliationDetail';
import { Approvals, UserManagement, Settings, Notifications, WorkflowConfig, UserDetailEdit, PermissionManagement } from './pages/SystemPages';
import { PurchasePlan } from './pages/PurchasePages';
import { ReturnManagement, ReturnDetail } from './pages/ReturnManagement'; 
import { InvoiceManagement } from './pages/InvoiceManagement';
import { Page, User, Role, Ticket } from './types';
import { Icons } from './components/Icons';
import { LoginPage } from './pages/LoginPage';
import { MobileApp } from './pages/MobileApp';
import { SaasAdmin } from './pages/SaasAdmin';

const MOCK_TICKETS: Ticket[] = [
    { id: 'TK-001', tenantName: '智汇五金机电', type: 'bug', title: '库存同步延迟问题', description: '在进行大批量入库操作时，系统库存更新有约5分钟的延迟，影响后续出库操作。', priority: 'high', status: 'pending', date: '2023-10-27 10:30' },
    { id: 'TK-002', tenantName: '顺达建材', type: 'billing', title: '申请升级企业版发票', description: '我们需要升级到企业版，请提供相关的发票信息和对公账户。', priority: 'medium', status: 'pending', date: '2023-10-26 15:20' },
];

const SuccessPage: React.FC<{ title: string, sub: string, back: () => void }> = ({ title, sub, back }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="w-16 h-16 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-4">
            <Icons.Check className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-500 mb-6">{sub}</p>
        <button onClick={back} className="px-6 py-2 bg-primary-600 text-white rounded-lg">返回列表</button>
    </div>
);

const UnauthorizedPage: React.FC<{ back: () => void }> = ({ back }) => (
    <div className="flex flex-col items-center justify-center h-[60vh] animate-fade-in">
        <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mb-4">
            <Icons.Ban className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">无访问权限</h2>
        <p className="text-gray-500 mb-6">您的账号权限不足，无法访问此模块。</p>
        <button onClick={back} className="px-6 py-2 bg-primary-600 text-white rounded-lg">返回首页</button>
    </div>
);

const ROLE_ACCESS: Record<string, Role[]> = {
    [Page.DASHBOARD]: ['admin', 'sales', 'warehouse', 'finance'],
    [Page.POS]: ['admin', 'sales'],
    [Page.ORDER_LIST]: ['admin', 'sales', 'finance'],
    [Page.QUOTATIONS]: ['admin', 'sales'],
    [Page.SUPPLIERS_CUSTOMERS]: ['admin', 'sales', 'finance'],
    [Page.RETURN_MANAGEMENT]: ['admin', 'sales', 'warehouse'],
    [Page.INVENTORY_LIST]: ['admin', 'warehouse', 'sales'],
    [Page.INVENTORY_HISTORY]: ['admin', 'warehouse'],
    [Page.WAREHOUSE]: ['admin', 'warehouse'],
    [Page.WAREHOUSE_LAYOUT]: ['admin', 'warehouse'],
    [Page.WAREHOUSE_EDIT]: ['admin', 'warehouse'],
    [Page.RACK_MGMT]: ['admin', 'warehouse'],
    [Page.INVENTORY_CHECK]: ['admin', 'warehouse', 'finance'],
    [Page.INVENTORY_CHECK_DETAIL]: ['admin', 'warehouse', 'finance'],
    [Page.SCAN_INBOUND]: ['admin', 'warehouse'],
    [Page.INBOUND_DETAIL]: ['admin', 'warehouse'],
    [Page.SALES_OUTBOUND]: ['admin', 'warehouse'],
    [Page.OUTBOUND_DETAIL]: ['admin', 'warehouse'],
    [Page.STOCK_TRANSFER]: ['admin', 'warehouse'],
    [Page.STOCK_TRANSFER_DETAIL]: ['admin', 'warehouse'],
    [Page.PURCHASE_ORDERS]: ['admin', 'warehouse', 'finance'],
    [Page.PURCHASE_ORDER_DETAIL]: ['admin', 'warehouse', 'finance'],
    [Page.PURCHASE_ORDER_ENTRY]: ['admin', 'warehouse', 'finance'],
    [Page.PURCHASE_PLAN]: ['admin', 'warehouse', 'sales'],
    [Page.PRODUCTS]: ['admin', 'sales', 'warehouse'],
    [Page.PRODUCT_ENTRY]: ['admin', 'sales', 'warehouse'],
    [Page.CATEGORY_MGMT]: ['admin', 'sales'],
    [Page.FINANCE]: ['admin', 'finance'],
    [Page.RECONCILIATION]: ['admin', 'finance', 'sales'],
    [Page.RECONCILIATION_DETAIL]: ['admin', 'finance', 'sales'],
    [Page.APPROVALS]: ['admin', 'finance', 'sales', 'warehouse'],
    [Page.APPROVAL_WORKFLOW]: ['admin'],
    [Page.PERMISSION_MANAGEMENT]: ['admin'],
    [Page.USER_MANAGEMENT]: ['admin'],
    [Page.USER_DETAIL]: ['admin'],
    [Page.SETTINGS]: ['admin'],
    [Page.NOTIFICATIONS]: ['admin', 'sales', 'warehouse', 'finance'],
    [Page.PRINT_CENTER]: ['admin', 'sales', 'warehouse', 'finance'],
    [Page.ORDER_DETAIL]: ['admin', 'sales', 'finance'],
    [Page.SALES_ORDER_ENTRY]: ['admin', 'sales'],
    [Page.PARTNER_DETAIL]: ['admin', 'sales', 'finance'],
    [Page.QUOTATION_DETAIL]: ['admin', 'sales'],
    [Page.RETURN_DETAIL]: ['admin', 'sales', 'warehouse'],
    [Page.INVOICE_MANAGEMENT]: ['admin', 'finance'],
};

function App() {
  const [user, setUser] = useState<User | null>(null);
  const [activePage, setActivePage] = useState<Page>(Page.DASHBOARD);
  const [isMobileView, setIsMobileView] = useState(() => localStorage.getItem('erp_is_mobile') === 'true');
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [salesOrderDraft, setSalesOrderDraft] = useState<any>(null);

  const handleAddTicket = (ticket: Ticket) => {
      setTickets([ticket, ...tickets]);
  };

  const handleResolveTicket = (id: string) => {
      setTickets(tickets.map(t => t.id === id ? { ...t, status: 'resolved' } : t));
  };

  // --- ROOT CAUSE FIX --- 
  // 1. Added explicit `User` type to the `newUser` parameter, fixing the downstream red-underline issue in LoginPage.
  // 2. Renamed `isMobile` to `isMobileView` for clarity.
  const handleLogin = (newUser: User, isMobileView: boolean) => {
      setUser(newUser);
      localStorage.setItem('erp_user', JSON.stringify(newUser));
      localStorage.setItem('erp_is_mobile', String(isMobileView));
      setIsMobileView(isMobileView);
      setActivePage(Page.DASHBOARD);
  };

  useEffect(() => {
      const storedUser = localStorage.getItem('erp_user');
      if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch (e) {
            console.error("Failed to parse user from localStorage", e);
            localStorage.removeItem('erp_user');
          }
      }
  }, []);

  const handleLogout = () => {
      setUser(null);
      localStorage.removeItem('erp_user');
      localStorage.removeItem('erp_is_mobile');
      setActivePage(Page.DASHBOARD); // Reset to default page
      setIsMobileView(false); // Default to desktop view after logout
  };

  const hasAccess = (page: Page): boolean => {
      if (!user) return false;
      if(user.role === 'super_admin') return true;
      const allowedRoles = ROLE_ACCESS[page];
      if (!allowedRoles) return false;
      return allowedRoles.includes(user.role);
  };

  const renderPage = () => {
    if (!user) return null;

    if (!hasAccess(activePage)) {
        return <UnauthorizedPage back={() => setActivePage(Page.DASHBOARD)} />;
    }

    switch (activePage) {
        // Simplified for brevity, add other pages here
        case Page.DASHBOARD: return <Dashboard setPage={setActivePage} />;
        case Page.PRODUCTS: return <ProductList setPage={setActivePage} />;
        case Page.PRODUCT_ENTRY: return <ProductEntry setPage={setActivePage} />;
        case Page.CATEGORY_MGMT: return <CategoryManagement />;
        case Page.POS: return <POS />;
        case Page.WAREHOUSE: return <WarehouseManagement setPage={setActivePage} />;
        case Page.WAREHOUSE_LAYOUT: return <WarehouseLayout setPage={setActivePage} />;
        case Page.WAREHOUSE_EDIT: return <WarehouseEdit setPage={setActivePage} />;
        case Page.RACK_MGMT: return <WarehouseLayout isStandaloneMgmt={true} setPage={setActivePage} />;
        case Page.SCAN_INBOUND: return <ScanInbound setPage={setActivePage} />;
        case Page.INBOUND_DETAIL: return <InboundDetail setPage={setActivePage} />;
        case Page.SALES_OUTBOUND: return <SalesOutbound setPage={setActivePage} />;
        case Page.OUTBOUND_DETAIL: return <OutboundDetail setPage={setActivePage} />;
        case Page.STOCK_TRANSFER: return <StockTransfer setPage={setActivePage} />;
        case Page.STOCK_TRANSFER_DETAIL: return <StockTransferDetail setPage={setActivePage} />;
        case Page.INVENTORY_CHECK: return <InventoryCheck setPage={setActivePage} />;
        case Page.INVENTORY_CHECK_DETAIL: return <InventoryCheckDetail setPage={setActivePage} />;
        case Page.QUOTATIONS: return <Quotations setPage={setActivePage} />;
        case Page.QUOTATION_DETAIL: return <QuotationDetail setPage={setActivePage} />;
        case Page.SUPPLIERS_CUSTOMERS: return <SupplierCustomer setPage={setActivePage} />;
        case Page.PARTNER_DETAIL: return <PartnerDetail setPage={setActivePage} />;
        case Page.FINANCE: return <FinancialReports setPage={setActivePage} user={user} />;
        case Page.RECONCILIATION: return <ReconciliationWorkbench setPage={setActivePage} />;
        case Page.RECONCILIATION_DETAIL: return <ReconciliationDetail setPage={setActivePage} />;
        case Page.APPROVALS: return <Approvals />;
        case Page.APPROVAL_WORKFLOW: return <WorkflowConfig setPage={setActivePage} user={user} />;
        case Page.USER_MANAGEMENT: return <UserManagement setPage={setActivePage} user={user} />;
        case Page.USER_DETAIL: return <UserDetailEdit setPage={setActivePage} />;
        case Page.PERMISSION_MANAGEMENT: return <PermissionManagement setPage={setActivePage} user={user} />;
        case Page.SETTINGS: return <Settings user={user} onAddTicket={handleAddTicket} />;
        case Page.NOTIFICATIONS: return <Notifications setPage={setActivePage} />;
        case Page.ORDER_LIST: return <SalesOrderList setPage={setActivePage} setDraft={setSalesOrderDraft} />;
        case Page.ORDER_DETAIL: return <OrderDetail setPage={setActivePage} />; 
        case Page.SALES_ORDER_ENTRY: return <SalesOrderEntry setPage={setActivePage} initialData={salesOrderDraft} />;
        case Page.PURCHASE_ORDERS: return <PurchaseOrderList setPage={setActivePage} />;
        case Page.PURCHASE_ORDER_DETAIL: return <PurchaseOrderDetail setPage={setActivePage} />;
        case Page.PURCHASE_ORDER_ENTRY: return <PurchaseOrderEntry setPage={setActivePage} />;
        case Page.PRINT_CENTER: return <PrintCenter setPage={setActivePage} />;
        case Page.PURCHASE_PLAN: return <PurchasePlan setPage={setActivePage} user={user} />;
        case Page.RETURN_MANAGEMENT: return <ReturnManagement setPage={setActivePage} />;
        case Page.RETURN_DETAIL: return <ReturnDetail setPage={setActivePage} />;
        case Page.INVOICE_MANAGEMENT: return <InvoiceManagement setPage={setActivePage} />;
        case Page.INVENTORY_LIST: return <InventoryList setPage={setActivePage} />;
        case Page.INVENTORY_HISTORY: return <InventoryHistory setPage={setActivePage} />;
        case Page.INVENTORY_HISTORY_DETAIL: return <InventoryHistoryDetail setPage={setActivePage} />;
        default: return <Dashboard setPage={setActivePage} />;
    }
  };

  // This is the main router of the application
  if (!user) {
      return <LoginPage onLogin={handleLogin} initialMobileMode={isMobileView} />;
  }

  // --- ROOT CAUSE FIX --- 
  // 3. This logic now correctly checks the `isMobileView` state variable.
  //    It renders MobileApp or the desktop Layout without passing invalid props.
  if (isMobileView) {
      return <MobileApp user={user} onExit={handleLogout} />;
  }

  if (user.role === 'super_admin') {
      return <SaasAdmin onLogout={handleLogout} tickets={tickets} onResolveTicket={handleResolveTicket} />;
  }

  return (
      <Layout activePage={activePage} setPage={setActivePage} user={user} onLogout={handleLogout}>
          {renderPage()}
      </Layout>
  );
}

export default App;
