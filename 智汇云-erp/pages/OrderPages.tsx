
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
    setDraft?: (data: any) => void;
    initialData?: any;
}

const ProductSelectModal: React.FC<{ 
    isOpen: boolean; 
    onClose: () => void; 
    onSelect: (product: any) => void;
    priceType?: 'purchase' | 'sales'; 
    supplierId?: string;
}> = ({ isOpen, onClose, onSelect, priceType = 'sales', supplierId }) => {
    const [search, setSearch] = useState('');
    
    // Mock Data
    const allProducts = [
        { id: 1, name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-001', stock: 120, unit: '个', purchasePrice: 0.35, salesPrice: 0.80, category: '紧固件', supplierId: 'jg' },
        { id: 2, name: 'PVC排水管 DN110', sku: 'PVC-PIPE-110', stock: 45, unit: '根', purchasePrice: 15.00, salesPrice: 28.50, category: '管材', supplierId: 'jg' },
        { id: 3, name: '博世手电钻 GSR 120-LI', sku: 'BOSCH-GSR-120', stock: 10, unit: '台', purchasePrice: 350.00, salesPrice: 499.00, category: '电动工具', supplierId: 'bosch' },
        { id: 4, name: '三棵树内墙乳胶漆 18L', sku: '3TREE-PAINT-18', stock: 0, unit: '桶', purchasePrice: 220.00, salesPrice: 360.00, category: '涂料', supplierId: '3tree' },
        { id: 5, name: '普通铁钉 50mm', sku: 'NAIL-IRON-50', stock: 5000, unit: 'kg', purchasePrice: 4.50, salesPrice: 8.00, category: '耗材', supplierId: 'other' },
    ];

    if (!isOpen) return null;

    const filteredProducts = allProducts.filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
                              p.sku.toLowerCase().includes(search.toLowerCase());
        return matchesSearch;
    });

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">添加商品</h3>
                        <p className="text-xs text-gray-500">双击行或点击添加按钮选择商品</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.Close className="w-5 h-5 text-gray-500"/></button>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white space-y-3">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm" 
                            placeholder="输入商品名称、SKU编码或条码..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">商品信息</th>
                                <th className="px-6 py-3 font-medium text-right">参考{priceType === 'sales' ? '售价' : '进价'}</th>
                                <th className="px-6 py-3 font-medium text-center">可用库存</th>
                                <th className="px-6 py-3 w-24 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredProducts.map(p => {
                                const price = priceType === 'sales' ? p.salesPrice : p.purchasePrice;
                                return (
                                    <tr key={p.id} className="hover:bg-blue-50/50 group transition-colors cursor-pointer" onDoubleClick={() => { onSelect({...p, price}); onClose(); }}>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">{p.name}</div>
                                            <div className="text-xs text-gray-500 font-mono mt-0.5">{p.sku} <span className="mx-1 text-gray-300">|</span> {p.category}</div>
                                        </td>
                                        <td className="px-6 py-4 text-right font-mono font-medium text-gray-700">¥ {price.toFixed(2)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {p.stock === 0 ? (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-700">缺货</span>
                                            ) : (
                                                <span className={`font-mono ${p.stock < 10 ? 'text-orange-600 font-bold' : 'text-gray-600'}`}>{p.stock} {p.unit}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <button 
                                                disabled={p.stock === 0 && priceType === 'sales'}
                                                onClick={() => { onSelect({...p, price}); onClose(); }}
                                                className="px-3 py-1.5 bg-white border border-primary-200 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-50 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
                                            >
                                                选择
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const QuotationSelectModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    onSelect: (quotation: any) => void;
}> = ({ isOpen, onClose, onSelect }) => {
    const [search, setSearch] = useState('');

    // Mock Quotations
    const quotations = [
        { id: 'QT-20231027-01', client: '浙江建工集团', amount: 158000, date: '2023-11-10', status: 'pending', items: [
            { name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-001', price: 0.35, qty: 50000, total: 17500 },
            { name: 'PVC排水管 DN110', sku: 'PVC-PIPE-110', price: 28.50, qty: 200, total: 5700 }
        ]},
        { id: 'QT-20231026-05', client: '博世中国', amount: 42000, date: '2023-11-01', status: 'accepted', items: [
            { name: '博世手电钻 GSR 120-LI', sku: 'BOSCH-GSR-120', price: 499.00, qty: 80, total: 39920 }
        ]},
    ];

    if (!isOpen) return null;

    const filtered = quotations.filter(q => 
        q.id.toLowerCase().includes(search.toLowerCase()) || 
        q.client.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[85vh]">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="font-bold text-gray-900 text-lg">选择报价单</h3>
                        <p className="text-xs text-gray-500">提取报价单内容生成销售订单</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.Close className="w-5 h-5 text-gray-500"/></button>
                </div>
                <div className="p-4 border-b border-gray-100 bg-white space-y-3">
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                        <input 
                            autoFocus
                            type="text" 
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none shadow-sm" 
                            placeholder="搜索报价单号或客户名称..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 sticky top-0 z-10 shadow-sm">
                            <tr>
                                <th className="px-6 py-3 font-medium">报价单号</th>
                                <th className="px-6 py-3 font-medium">客户名称</th>
                                <th className="px-6 py-3 font-medium text-right">金额</th>
                                <th className="px-6 py-3 font-medium text-center">状态</th>
                                <th className="px-6 py-3 w-24 text-center">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(q => (
                                <tr key={q.id} className="hover:bg-blue-50/50 group transition-colors cursor-pointer" onDoubleClick={() => { onSelect(q); onClose(); }}>
                                    <td className="px-6 py-4 font-mono font-bold text-primary-600">{q.id}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900">{q.client}</td>
                                    <td className="px-6 py-4 text-right font-mono">¥ {q.amount.toLocaleString()}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                            q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                            q.status === 'pending' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'
                                        }`}>
                                            {q.status === 'accepted' ? '已接受' : q.status === 'pending' ? '跟进中' : '已过期'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <button 
                                            onClick={() => { onSelect(q); onClose(); }}
                                            className="px-3 py-1.5 bg-white border border-primary-200 text-primary-600 rounded-lg text-xs font-bold hover:bg-primary-50 shadow-sm"
                                        >
                                            选择
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const SalesOrderList: React.FC<PageProps> = ({ setPage, setDraft }) => {
  const [activeTab, setActiveTab] = useState('all');
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);

  const handleQuotationSelect = (quotation: any) => {
      if (setDraft) {
          setDraft(quotation);
          setPage(Page.SALES_ORDER_ENTRY);
      }
  };
  
  // Enhanced Mock Data
  const orders = [
    { id: 'SO-20231027-089', date: '2023-10-27 14:30', client: '上海建工集团', items: 12, total: 12500.00, status: 'to_review', payment: 'paid', shipping: 'pending', sales: '张伟', outOfStock: true, relatedPO: 'PO-20231027-001' },
    { id: 'SO-20231027-012', date: '2023-10-27 09:15', client: '杭州西湖装修公司', items: 5, total: 2450.00, status: 'to_ship', payment: 'unpaid', shipping: 'pending', sales: '李强', outOfStock: false },
    { id: 'SO-20231026-115', date: '2023-10-26 16:45', client: '博世中国 (采购部)', items: 45, total: 58900.00, status: 'shipped', payment: 'paid', shipping: 'partial', sales: '王总', outOfStock: false },
    { id: 'SO-20231025-003', date: '2023-10-25 11:20', client: '个人: 赵六', items: 1, total: 350.00, status: 'completed', payment: 'paid', shipping: 'shipped', sales: '前台', outOfStock: false },
    { id: 'SO-20231024-099', date: '2023-10-24 10:00', client: '宏达建材', items: 8, total: 8500.00, status: 'cancelled', payment: 'refunded', shipping: 'cancelled', sales: '张伟', outOfStock: false },
  ];

  const getStatusBadge = (status: string) => {
      const map: any = {
          'to_review': { label: '待审核', class: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
          'to_ship': { label: '待发货', class: 'bg-blue-100 text-blue-700 border-blue-200' },
          'shipped': { label: '运输中', class: 'bg-purple-100 text-purple-700 border-purple-200' },
          'completed': { label: '已完成', class: 'bg-green-100 text-green-700 border-green-200' },
          'cancelled': { label: '已取消', class: 'bg-gray-100 text-gray-500 border-gray-200' },
      };
      const s = map[status] || map['to_review'];
      return <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${s.class}`}>{s.label}</span>;
  };

  const getPaymentStatus = (status: string) => {
      return status === 'paid' 
        ? <span className="text-green-600 flex items-center text-xs font-bold"><Icons.CheckCircle2 className="w-3 h-3 mr-1"/>已付</span>
        : <span className="text-red-500 flex items-center text-xs font-bold"><Icons.AlertCircle className="w-3 h-3 mr-1"/>未付</span>;
  };

  // Quick Access Cards
  const kpiCards = [
      { id: 'sales', label: '今日销售额', value: '¥ 45,280', icon: Icons.TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', action: () => {} },
      { id: 'to_ship', label: '待发货订单', value: '12', icon: Icons.Truck, color: 'text-orange-600', bg: 'bg-orange-50', action: () => setActiveTab('to_ship') },
      { id: 'to_review', label: '待审核', value: '5', icon: Icons.FileText, color: 'text-blue-600', bg: 'bg-blue-50', action: () => setActiveTab('to_review') },
      { id: 'returns', label: '本月退货率', value: '1.2%', icon: Icons.Undo, color: 'text-red-500', bg: 'bg-red-50', action: () => setPage(Page.RETURN_MANAGEMENT) },
  ];

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)] space-y-6">
      {/* Top Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">销售订单中心</h1>
          <p className="text-sm text-gray-500 mt-1">全渠道订单统一管理，支持 B2B 批发与 B2C 零售</p>
        </div>
        <div className="flex gap-3">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm">
                <Icons.Download className="w-4 h-4" /> 导出报表
            </button>
            <button 
                onClick={() => setIsQuotationModalOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm"
            >
                <Icons.FileText className="w-4 h-4" /> 提取报价单生成
            </button>
            <button onClick={() => setPage(Page.SALES_ORDER_ENTRY)} className="flex items-center gap-2 px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md shadow-primary-200 transition-all active:scale-95">
                <Icons.Plus className="w-4 h-4" /> 新建订单
            </button>
        </div>
      </div>

      <QuotationSelectModal 
        isOpen={isQuotationModalOpen} 
        onClose={() => setIsQuotationModalOpen(false)} 
        onSelect={handleQuotationSelect} 
      />

      {/* KPI Cards (Interactive) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          {kpiCards.map((card, idx) => (
              <div 
                key={idx}
                onClick={card.action}
                className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md hover:border-gray-300 transition-all group active:scale-[0.99]"
              >
                  <div>
                      <p className="text-xs text-gray-500 font-medium uppercase group-hover:text-gray-700">{card.label}</p>
                      <p className={`text-xl font-black mt-1 ${card.color.replace('text-', 'text-gray-900 group-hover:text-')}`}>{card.value}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 ${card.bg} ${card.color}`}>
                      <card.icon className="w-5 h-5"/>
                  </div>
              </div>
          ))}
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          {/* Toolbar */}
          <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row gap-4 justify-between bg-gray-50/50">
              <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                      {[
                          { id: 'all', label: '全部' },
                          { id: 'to_review', label: '待审核' },
                          { id: 'to_ship', label: '待发货' },
                          { id: 'completed', label: '已完成' }
                      ].map(tab => (
                          <button 
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === tab.id ? 'bg-gray-100 text-gray-900 font-bold shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                          >
                              {tab.label}
                          </button>
                      ))}
                  </div>
                  <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                  <div className="relative w-full sm:w-64">
                      <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                      <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white" placeholder="搜索订单号、客户..."/>
                  </div>
              </div>
              
              <div className="flex items-center gap-2">
                  <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600">
                      <Icons.Calendar className="w-4 h-4 mr-2 text-gray-400"/>
                      <span>2023-10-01 - 2023-10-31</span>
                  </div>
                  <button className="p-2 bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"><Icons.Filter className="w-4 h-4"/></button>
              </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                  <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0 z-10">
                      <tr>
                          <th className="px-6 py-4 w-12 border-b border-gray-200"><input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"/></th>
                          <th className="px-6 py-4 border-b border-gray-200">订单号</th>
                          <th className="px-6 py-4 border-b border-gray-200">客户信息</th>
                          <th className="px-6 py-4 border-b border-gray-200 text-right">订单金额</th>
                          <th className="px-6 py-4 border-b border-gray-200 text-center">支付/物流</th>
                          <th className="px-6 py-4 border-b border-gray-200 text-center">订单状态</th>
                          <th className="px-6 py-4 border-b border-gray-200 text-right">操作</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-sm">
                      {orders.map((order, idx) => (
                          <tr key={idx} onClick={() => setPage(Page.ORDER_DETAIL)} className="hover:bg-gray-50 cursor-pointer transition-colors group">
                              <td className="px-6 py-4"><input type="checkbox" onClick={(e)=>e.stopPropagation()} className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"/></td>
                              <td className="px-6 py-4">
                                  <div className="flex items-center gap-2">
                                    <div className="font-mono font-bold text-primary-600 text-sm group-hover:underline">{order.id}</div>
                                    {order.outOfStock && <span className="px-1.5 py-0.5 bg-red-100 text-red-600 text-[10px] font-bold rounded border border-red-200">缺货</span>}
                                  </div>
                                  <div className="text-xs text-gray-400 mt-0.5">{order.date}</div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="font-bold text-gray-900">{order.client}</div>
                                  <div className="text-xs text-gray-500 mt-0.5">销售员: {order.sales}</div>
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="font-bold text-gray-900">¥ {order.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
                                  <div className="text-xs text-gray-400">{order.items} items</div>
                              </td>
                              <td className="px-6 py-4">
                                  <div className="flex flex-col items-center gap-1">
                                      {getPaymentStatus(order.payment)}
                                      <span className="text-[10px] text-gray-400 uppercase tracking-wider">{order.shipping === 'shipped' ? '已发货' : '待发货'}</span>
                                  </div>
                              </td>
                              <td className="px-6 py-4 text-center">
                                  {getStatusBadge(order.status)}
                              </td>
                              <td className="px-6 py-4 text-right">
                                  <div className="flex justify-end gap-2">
                                      {order.relatedPO && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setPage(Page.PURCHASE_ORDER_DETAIL); }}
                                            className="px-2 py-1 bg-blue-50 text-blue-600 text-xs font-bold rounded hover:bg-blue-100 border border-blue-200 flex items-center gap-1"
                                            title="查看关联采购单"
                                        >
                                            <Icons.Link className="w-3 h-3"/> 采购单
                                        </button>
                                      )}
                                      {order.status === 'to_ship' && (
                                          <button 
                                            onClick={(e) => { e.stopPropagation(); setPage(Page.SALES_OUTBOUND); }}
                                            className="px-2 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded hover:bg-primary-100 border border-primary-200"
                                            title="生成出库单"
                                          >
                                              发货
                                          </button>
                                      )}
                                      <button onClick={(e) => { e.stopPropagation(); setPage(Page.PRINT_CENTER); }} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors">
                                          <Icons.Print className="w-4 h-4"/>
                                      </button>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>
    </div>
  );
};

export const PurchaseOrderList: React.FC<PageProps> = ({ setPage }) => {
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedIds, setSelectedIds] = useState<string[]>([]);

    const orders = [
        { id: 'PO-20231027-001', supplier: '金固五金制品', rating: 5, date: '2023-10-27', amount: 12500.00, status: 'pending_shipment', label: '待发货', progress: 0 },
        { id: 'PO-20231026-005', supplier: '博世电动工具', rating: 4, date: '2023-10-26', amount: 45800.00, status: 'pending_receipt', label: '收货中', progress: 30 },
        { id: 'PO-20231025-012', supplier: '三棵树涂料', rating: 3, date: '2023-10-25', amount: 8900.00, status: 'quality_check', label: '待质检', progress: 100 },
        { id: 'PO-20231024-003', supplier: '上海紧固件总厂', rating: 4, date: '2023-10-24', amount: 3200.00, status: 'completed', label: '已完成', progress: 100 },
        { id: 'PO-20231023-008', supplier: '得力工具', rating: 5, date: '2023-10-23', amount: 1500.00, status: 'pending_shipment', label: '待发货', progress: 0 },
        { id: 'PO-20231022-011', supplier: '中天管业', rating: 2, date: '2023-10-22', amount: 5600.00, status: 'completed', label: '已完成', progress: 100 },
    ];

    const stats = useMemo(() => ({
        total: orders.reduce((sum, o) => sum + o.amount, 0),
        pending_shipment: orders.filter(o => o.status === 'pending_shipment').length,
        pending_receipt: orders.filter(o => o.status === 'pending_receipt').length,
        quality_check: orders.filter(o => o.status === 'quality_check').length,
    }), [orders]);

    const filteredOrders = filterStatus === 'all' 
        ? orders 
        : orders.filter(o => o.status === filterStatus);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(filteredOrders.map(o => o.id));
        } else {
            setSelectedIds([]);
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const cards = [
        { id: 'all', label: '本月采购总额', value: `¥ ${stats.total.toLocaleString()}`, icon: Icons.TrendingUp, color: 'text-primary-600', bg: 'bg-primary-50', activeBorder: 'border-primary-500' },
        { id: 'pending_shipment', label: '待发货', value: stats.pending_shipment, icon: Icons.Truck, color: 'text-orange-600', bg: 'bg-orange-50', activeBorder: 'border-orange-500' },
        { id: 'pending_receipt', label: '待收货/入库', value: stats.pending_receipt, icon: Icons.Inbound, color: 'text-blue-600', bg: 'bg-blue-50', activeBorder: 'border-blue-500' },
        { id: 'quality_check', label: '待质检', value: stats.quality_check, icon: Icons.ClipboardCheck, color: 'text-purple-600', bg: 'bg-purple-50', activeBorder: 'border-purple-500' },
    ];

    const getStatusStyle = (status: string) => {
        switch(status) {
            case 'pending_shipment': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'pending_receipt': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'quality_check': return 'bg-purple-100 text-purple-700 border-purple-200';
            case 'completed': return 'bg-green-100 text-green-700 border-green-200';
            default: return 'bg-gray-100 text-gray-600';
        }
    };

    const renderStars = (rating: number) => (
        <div className="flex text-yellow-400 text-[10px]">
            {[...Array(5)].map((_, i) => (
                <Icons.Star key={i} className={`w-3 h-3 ${i < rating ? 'fill-current' : 'text-gray-200'}`} />
            ))}
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">采购订单管理</h1>
                    <p className="text-sm text-gray-500 mt-1">管理供应商采购、跟踪到货进度与质检状态。</p>
                </div>
                <div className="flex gap-3">
                    <button className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold shadow-sm hover:bg-gray-50 flex items-center gap-2 transition-transform active:scale-95">
                        <Icons.ShoppingCart className="w-4 h-4"/> 按销售订单生成
                    </button>
                    <button onClick={() => setPage(Page.PURCHASE_ORDER_ENTRY)} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 flex items-center gap-2 transition-transform active:scale-95">
                        <Icons.Plus className="w-4 h-4"/> 新建采购单
                    </button>
                </div>
            </div>

            {/* Status Filter Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                {cards.map((card) => (
                    <div 
                        key={card.id}
                        onClick={() => setFilterStatus(card.id)}
                        className={`bg-white p-4 rounded-xl border shadow-sm cursor-pointer transition-all hover:shadow-md relative overflow-hidden group ${
                            filterStatus === card.id ? `border-2 ${card.activeBorder} bg-gray-50` : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                                <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
                            </div>
                            <div className={`p-2.5 rounded-lg ${card.bg} ${card.color} group-hover:scale-110 transition-transform`}>
                                <card.icon className="w-5 h-5"/>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="relative w-80">
                            <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                            <input className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="搜索采购单号、供应商..."/>
                        </div>
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50">
                            <Icons.Calendar className="w-4 h-4 mr-2 text-gray-400"/>
                            <span>2023-10-01 - 2023-10-31</span>
                        </div>
                    </div>
                    
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <Icons.Filter className="w-4 h-4 inline mr-1"/> 筛选
                        </button>
                        <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                            <Icons.Download className="w-4 h-4 inline mr-1"/> 导出
                        </button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0 z-10 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 w-12">
                                    <input 
                                        type="checkbox" 
                                        className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        checked={filteredOrders.length > 0 && selectedIds.length === filteredOrders.length}
                                        ref={input => { if (input) input.indeterminate = selectedIds.length > 0 && selectedIds.length < filteredOrders.length; }}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="px-6 py-4">采购单号</th>
                                <th className="px-6 py-4">供应商</th>
                                <th className="px-6 py-4 text-right">采购金额</th>
                                <th className="px-6 py-4 text-center">入库进度</th>
                                <th className="px-6 py-4 text-center">状态</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredOrders.map((order, i) => (
                                <tr key={i} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setPage(Page.PURCHASE_ORDER_DETAIL)}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" 
                                            onClick={(e)=>e.stopPropagation()}
                                            checked={selectedIds.includes(order.id)}
                                            onChange={() => handleSelectOne(order.id)}
                                        />
                                    </td>
                                    <td className="px-6 py-4 font-mono font-bold text-primary-600 group-hover:underline">
                                        {order.id}
                                        <div className="text-xs text-gray-400 font-normal mt-0.5">{order.date}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{order.supplier}</div>
                                        <div className="mt-1">{renderStars(order.rating)}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-mono font-medium">¥ {order.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                                    <td className="px-6 py-4">
                                        <div className="w-24 mx-auto">
                                            <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                                                <span>{order.progress}%</span>
                                            </div>
                                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                                <div className={`h-full rounded-full ${order.progress === 100 ? 'bg-green-500' : 'bg-primary-500'}`} style={{width: `${order.progress}%`}}></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${getStatusStyle(order.status)}`}>
                                            {order.label}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={(e) => { e.stopPropagation(); setPage(Page.PRINT_CENTER); }} 
                                                className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                                title="打印采购单"
                                            >
                                                <Icons.Print className="w-4 h-4"/>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredOrders.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="text-center py-12 text-gray-400">
                                        <Icons.Inbox className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                                        <p>暂无符合条件的采购订单</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export const SalesOrderEntry: React.FC<PageProps> = ({ setPage, initialData }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [customer, setCustomer] = useState('上海建工集团');

    useEffect(() => {
        if (initialData) {
            setCustomer(initialData.client);
            if (initialData.items) {
                setItems(initialData.items.map((item: any) => ({
                    ...item,
                    total: item.price * item.qty
                })));
            }
        }
    }, [initialData]);

    const handleAddProduct = (product: any) => {
        setItems(prev => [...prev, { ...product, qty: 1, total: product.price }]);
        setIsProductModalOpen(false);
    };

    const updateQty = (index: number, qty: number) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, qty, total: item.price * qty } : item));
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="flex flex-col h-full animate-fade-in">
            <ProductSelectModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onSelect={handleAddProduct}
                priceType="sales"
            />

            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage(Page.ORDER_LIST)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <Icons.ArrowLeft className="w-5 h-5"/>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">新建销售订单</h1>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">保存草稿</button>
                    <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors">提交订单</button>
                </div>
            </div>
            
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">客户信息</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={customer}
                            onChange={(e) => setCustomer(e.target.value)}
                        >
                            <option>选择客户...</option>
                            <option>上海建工集团</option>
                            <option>博世中国</option>
                            <option>浙江建工集团</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">销售员</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all" defaultValue="张伟" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">订单日期</label>
                        <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                </div>
                
                {items.length === 0 ? (
                    <div className="border border-gray-200 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 min-h-[300px]">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Icons.ShoppingCart className="w-10 h-10 text-gray-300"/>
                        </div>
                        <p className="text-sm font-medium mb-1">暂无商品明细</p>
                        <p className="text-xs mb-6 opacity-70">点击下方按钮添加商品或直接扫描条码</p>
                        <button 
                            onClick={() => setIsProductModalOpen(true)}
                            className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm"
                        >
                            + 添加商品
                        </button>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-xl">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">商品名称</th>
                                        <th className="px-4 py-3 text-right">单价</th>
                                        <th className="px-4 py-3 text-center w-32">数量</th>
                                        <th className="px-4 py-3 text-right">小计</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">¥ {item.price.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                                                    className="w-full text-center border border-gray-300 rounded p-1"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">¥ {item.total.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button 
                                onClick={() => setIsProductModalOpen(true)}
                                className="text-primary-600 text-sm font-bold hover:underline flex items-center gap-1"
                            >
                                <Icons.Plus className="w-4 h-4"/> 继续添加商品
                            </button>
                            <div className="text-xl font-bold text-gray-900">
                                总计: <span className="text-primary-600">¥ {totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export const PurchaseOrderEntry: React.FC<PageProps> = ({ setPage }) => {
    const [items, setItems] = useState<any[]>([]);
    const [isProductModalOpen, setIsProductModalOpen] = useState(false);
    const [supplier, setSupplier] = useState('金固五金制品');
    const [relatedSalesOrder, setRelatedSalesOrder] = useState('');

    const handleAddProduct = (product: any) => {
        setItems(prev => [...prev, { ...product, qty: 1, total: product.price }]);
        setIsProductModalOpen(false);
    };

    const updateQty = (index: number, qty: number) => {
        setItems(prev => prev.map((item, i) => i === index ? { ...item, qty, total: item.price * qty } : item));
    };

    const removeItem = (index: number) => {
        setItems(prev => prev.filter((_, i) => i !== index));
    };

    const handleSelectSalesOrder = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const soId = e.target.value;
        setRelatedSalesOrder(soId);
        if (soId === 'SO-20231027-089') {
            // Simulate auto-fill from Sales Order
            setItems([
                { name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-001', price: 0.35, qty: 1000, total: 350.00 },
                { name: '镀锌平垫 M8', sku: 'WASHER-M8-ZP', price: 0.05, qty: 5000, total: 250.00 }
            ]);
            // Simulate auto-select supplier based on items or history
            setSupplier('上海紧固件总厂');
        } else {
            setItems([]);
        }
    };

    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

    return (
        <div className="flex flex-col h-full animate-fade-in">
             <ProductSelectModal 
                isOpen={isProductModalOpen} 
                onClose={() => setIsProductModalOpen(false)} 
                onSelect={handleAddProduct}
                priceType="purchase"
            />

             <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage(Page.PURCHASE_ORDERS)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <Icons.ArrowLeft className="w-5 h-5"/>
                    </button>
                    <h1 className="text-2xl font-bold text-gray-900">新建采购订单</h1>
                </div>
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors">提交采购单</button>
            </div>
             <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex-1 flex flex-col overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6 shrink-0">
                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 relative group">
                        <label className="block text-xs font-bold text-blue-700 mb-1">供应商关联</label>
                        <select 
                            value={supplier}
                            onChange={(e) => setSupplier(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-gray-900 font-bold focus:ring-0 cursor-pointer text-lg"
                        >
                            <option>金固五金制品</option>
                            <option>博世电动工具</option>
                            <option>上海紧固件总厂</option>
                        </select>
                        <div className="absolute right-3 top-3 text-blue-400 pointer-events-none"><Icons.ChevronDown className="w-4 h-4"/></div>
                        <div className="flex gap-1 mt-1 text-xs text-blue-600/70">
                            <span>信用评级:</span>
                            <div className="flex text-yellow-500"><Icons.Star className="w-3 h-3 fill-current"/><Icons.Star className="w-3 h-3 fill-current"/><Icons.Star className="w-3 h-3 fill-current"/><Icons.Star className="w-3 h-3 fill-current"/><Icons.Star className="w-3 h-3 text-blue-200"/></div>
                        </div>
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">关联销售订单 (可选)</label>
                        <select 
                            className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                            value={relatedSalesOrder}
                            onChange={handleSelectSalesOrder}
                        >
                            <option value="">不关联</option>
                            <option value="SO-20231027-089">SO-20231027-089 (上海建工集团)</option>
                        </select>
                        {relatedSalesOrder && <p className="text-xs text-green-600 mt-1">已自动填充缺货商品</p>}
                    </div>
                     <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">预计到货</label>
                        <input type="date" className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">采购备注</label>
                        <input type="text" className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none transition-all" placeholder="可选填..." defaultValue={relatedSalesOrder ? "客户急需，请优先发货" : ""} />
                    </div>
                </div>
                 
                 {items.length === 0 ? (
                    <div className="border border-gray-200 border-dashed rounded-xl flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50 min-h-[300px]">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mb-4 shadow-sm">
                            <Icons.ShoppingCart className="w-10 h-10 text-gray-300"/>
                        </div>
                        <p className="text-sm font-medium mb-1">暂无采购明细</p>
                        <p className="text-xs mb-6 opacity-70">请添加需要采购的商品</p>
                        <button 
                            onClick={() => setIsProductModalOpen(true)}
                            className="px-6 py-2.5 bg-white border border-gray-300 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-all shadow-sm"
                        >
                            + 添加采购商品
                        </button>
                    </div>
                 ) : (
                    <div className="flex-1 flex flex-col overflow-hidden border border-gray-200 rounded-xl">
                        <div className="flex-1 overflow-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold">
                                    <tr>
                                        <th className="px-4 py-3">商品名称</th>
                                        <th className="px-4 py-3 text-right">进价</th>
                                        <th className="px-4 py-3 text-center w-32">采购数量</th>
                                        <th className="px-4 py-3 text-right">小计</th>
                                        <th className="px-4 py-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {items.map((item, index) => (
                                        <tr key={index} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div className="font-bold text-gray-900">{item.name}</div>
                                                <div className="text-xs text-gray-500">{item.sku}</div>
                                            </td>
                                            <td className="px-4 py-3 text-right">¥ {item.price.toFixed(2)}</td>
                                            <td className="px-4 py-3">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    value={item.qty}
                                                    onChange={(e) => updateQty(index, parseInt(e.target.value) || 1)}
                                                    className="w-full text-center border border-gray-300 rounded p-1"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-right font-medium">¥ {item.total.toFixed(2)}</td>
                                            <td className="px-4 py-3 text-center">
                                                <button onClick={() => removeItem(index)} className="text-gray-400 hover:text-red-500"><Icons.Trash2 className="w-4 h-4"/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center">
                            <button 
                                onClick={() => setIsProductModalOpen(true)}
                                className="text-primary-600 text-sm font-bold hover:underline flex items-center gap-1"
                            >
                                <Icons.Plus className="w-4 h-4"/> 继续添加商品
                            </button>
                            <div className="text-xl font-bold text-gray-900">
                                采购总额: <span className="text-primary-600">¥ {totalAmount.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                 )}
             </div>
        </div>
    );
};

export const PurchaseOrderDetail: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="flex flex-col h-full animate-fade-in max-w-5xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPage(Page.PURCHASE_ORDERS)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">采购单 #PO-20231027-001</h1>
                    <p className="text-sm text-gray-500">供应商: <span className="font-bold text-gray-700">金固五金制品</span></p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                        <Icons.Print className="w-4 h-4"/> 打印
                    </button>
                    <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors">
                        确认收货
                    </button>
                </div>
            </div>
            
            {/* Status Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-orange-50 rounded-full text-orange-600">
                        <Icons.Truck className="w-6 h-6"/>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">当前状态</p>
                        <p className="text-lg font-bold text-orange-600">待发货 / 运输中</p>
                    </div>
                </div>
                <div className="text-right">
                    <p className="text-xs text-gray-500 uppercase font-bold tracking-wider">采购总金额</p>
                    <p className="text-2xl font-black text-gray-900">¥ 12,500.00</p>
                </div>
            </div>

             <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden">
                 <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-900">采购商品明细</h3>
                 </div>
                 <table className="w-full text-left text-sm">
                     <thead className="bg-white text-gray-500 border-b border-gray-100 text-xs uppercase">
                         <tr>
                             <th className="py-3 px-6 font-semibold">商品名称</th>
                             <th className="py-3 px-6 text-right font-semibold">采购单价</th>
                             <th className="py-3 px-6 text-center font-semibold">采购数量</th>
                             <th className="py-3 px-6 text-right font-semibold">小计</th>
                         </tr>
                     </thead>
                     <tbody className="divide-y divide-gray-50">
                         <tr className="hover:bg-gray-50 transition-colors">
                             <td className="py-4 px-6">
                                 <div className="font-bold text-blue-600 hover:underline cursor-pointer">304不锈钢六角螺栓 M8</div>
                                 <div className="text-xs text-gray-500 mt-0.5">规格: M8*30mm</div>
                             </td>
                             <td className="py-4 px-6 text-right">¥ 0.35</td>
                             <td className="py-4 px-6 text-center font-mono font-bold">10,000</td>
                             <td className="py-4 px-6 text-right font-bold text-gray-900">¥ 3,500.00</td>
                         </tr>
                         <tr className="hover:bg-gray-50 transition-colors">
                             <td className="py-4 px-6">
                                 <div className="font-bold text-blue-600 hover:underline cursor-pointer">镀锌平垫 M8</div>
                                 <div className="text-xs text-gray-500 mt-0.5">规格: M8 标准</div>
                             </td>
                             <td className="py-4 px-6 text-right">¥ 0.05</td>
                             <td className="py-4 px-6 text-center font-mono font-bold">50,000</td>
                             <td className="py-4 px-6 text-right font-bold text-gray-900">¥ 2,500.00</td>
                         </tr>
                     </tbody>
                     <tfoot className="bg-gray-50 border-t border-gray-200">
                        <tr>
                            <td colSpan={3} className="py-4 px-6 text-right font-bold text-gray-500">合计:</td>
                            <td className="py-4 px-6 text-right font-black text-lg text-primary-600">¥ 6,000.00</td>
                        </tr>
                     </tfoot>
                 </table>
             </div>

             {/* Invoice Entry Section */}
             <div className="mt-6 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-gray-400"/> 进项发票录入
                    </h3>
                    <button className="text-sm text-primary-600 font-bold hover:underline flex items-center gap-1">
                        <Icons.Plus className="w-4 h-4"/> 录入发票
                    </button>
                </div>
                
                <div className="bg-gray-50 rounded-lg border border-gray-200 border-dashed p-8 flex flex-col items-center justify-center text-gray-500">
                    <Icons.Upload className="w-10 h-10 mb-3 text-gray-300"/>
                    <p className="font-medium text-sm">点击录入或拖拽上传发票文件</p>
                    <p className="text-xs mt-1 opacity-70">支持 PDF, OFD, JPG 格式，系统将自动识别发票内容</p>
                </div>
             </div>
        </div>
    );
};

export const OrderDetail: React.FC<PageProps> = ({ setPage }) => {
  return (
    <div className="animate-fade-in pb-10 max-w-6xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setPage(Page.ORDER_LIST)} className="p-2 bg-white border border-gray-200 rounded-full text-gray-500 hover:bg-gray-50 transition-colors shadow-sm">
                <Icons.ArrowLeft className="w-5 h-5" />
            </button>
            <div>
                <div className="flex items-center gap-3">
                    <h1 className="text-2xl font-bold text-gray-900">订单 #SO-20231027-089</h1>
                    <span className="px-2.5 py-0.5 bg-yellow-100 text-yellow-800 border border-yellow-200 rounded-full text-xs font-bold uppercase">待审核</span>
                </div>
                <p className="text-sm text-gray-500 mt-1">创建时间: 2023-10-27 14:30 • 销售员: 张伟</p>
            </div>
            <div className="ml-auto flex gap-3">
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                    <Icons.Print className="w-4 h-4"/> 打印订单
                </button>
                <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 hover:border-red-200 shadow-sm">
                    取消订单
                </button>
                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center gap-2">
                    <Icons.CheckCircle2 className="w-4 h-4"/> 审核通过
                </button>
            </div>
        </div>
        
        {/* Lifecycle Stepper */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8 mb-6">
            <div className="relative flex items-center justify-between">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-gray-100 -z-0"></div>
                <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[25%] h-1 bg-primary-500 -z-0"></div>
                
                {[
                    { label: '提交订单', date: '10/27 14:30', status: 'done' },
                    { label: '审核确认', date: '处理中...', status: 'current' },
                    { label: '财务收款', date: '待处理', status: 'pending' },
                    { label: '仓库发货', date: '待处理', status: 'pending' },
                    { label: '客户签收', date: '待处理', status: 'pending' },
                ].map((step, i) => (
                    <div key={i} className="relative z-10 flex flex-col items-center bg-white px-2">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all ${
                            step.status === 'done' ? 'bg-primary-600 border-primary-100 text-white' :
                            step.status === 'current' ? 'bg-white border-primary-500 text-primary-600 ring-4 ring-primary-50' :
                            'bg-gray-100 border-gray-100 text-gray-400'
                        }`}>
                            {step.status === 'done' ? <Icons.Check className="w-5 h-5"/> : <span className="text-sm font-bold">{i+1}</span>}
                        </div>
                        <p className={`text-sm font-bold mt-2 ${step.status === 'pending' ? 'text-gray-400' : 'text-gray-900'}`}>{step.label}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{step.date}</p>
                    </div>
                ))}
            </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
            {/* Main Details */}
            <div className="flex-1 space-y-6">
                {/* Line Items */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                        <h3 className="font-bold text-gray-900">商品明细 (3)</h3>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs">
                            <tr>
                                <th className="px-6 py-3 font-semibold">商品信息</th>
                                <th className="px-6 py-3 font-semibold text-right">单价</th>
                                <th className="px-6 py-3 font-semibold text-center">数量</th>
                                <th className="px-6 py-3 font-semibold text-right">小计</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {[
                                { name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-001', price: 0.80, qty: 1000, unit: '个', total: 800.00 },
                                { name: '博世手电钻 GSR 120-LI', sku: 'BOSCH-GSR-120', price: 499.00, qty: 2, unit: '台', total: 998.00 },
                                { name: 'PVC排水管 DN110', sku: 'PVC-PIPE-110', price: 28.50, qty: 20, unit: '根', total: 570.00 },
                            ].map((item, i) => (
                                <tr key={i} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 text-right">¥ {item.price.toFixed(2)}</td>
                                    <td className="px-6 py-4 text-center font-bold text-gray-900">{item.qty} <span className="text-xs font-normal text-gray-400">{item.unit}</span></td>
                                    <td className="px-6 py-4 text-right font-medium">¥ {item.total.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot className="bg-gray-50/50 border-t border-gray-200">
                            <tr>
                                <td colSpan={3} className="px-6 py-3 text-right text-gray-500">商品总额:</td>
                                <td className="px-6 py-3 text-right font-bold text-gray-900">¥ 2,368.00</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-6 py-1 text-right text-gray-500">运费:</td>
                                <td className="px-6 py-1 text-right font-bold text-gray-900">¥ 50.00</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-6 py-1 text-right text-gray-500">折扣:</td>
                                <td className="px-6 py-1 text-right font-bold text-green-600">- ¥ 18.00</td>
                            </tr>
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-right text-lg font-bold text-gray-900">应付总额:</td>
                                <td className="px-6 py-4 text-right text-2xl font-black text-primary-600">¥ 2,400.00</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>

                {/* Shipping & Notes */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.Truck className="w-5 h-5 text-gray-400"/> 配送信息
                    </h3>
                    <div className="grid grid-cols-2 gap-6 text-sm">
                        <div>
                            <p className="text-gray-500 mb-1">收货人</p>
                            <p className="font-bold text-gray-900">王工程</p>
                        </div>
                        <div>
                            <p className="text-gray-500 mb-1">联系电话</p>
                            <p className="font-bold text-gray-900">139-1234-5678</p>
                        </div>
                        <div className="col-span-2">
                            <p className="text-gray-500 mb-1">收货地址</p>
                            <p className="font-medium text-gray-900">上海市浦东新区张江高科园区 88 号工地现场</p>
                        </div>
                        <div className="col-span-2 border-t border-gray-100 pt-4">
                            <p className="text-gray-500 mb-1">订单备注</p>
                            <p className="text-gray-700 bg-yellow-50 p-3 rounded-lg border border-yellow-100">
                                请务必在工作日送达，送货前需提前电话联系。货物需带托盘。
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sidebar Info */}
            <div className="w-full lg:w-80 space-y-6">
                {/* Customer Card */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                    <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <Icons.User className="w-5 h-5 text-gray-400"/> 客户资料
                    </h3>
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold shadow-sm">上</div>
                        <div>
                            <p className="font-bold text-gray-900 text-sm">上海建工集团</p>
                            <p className="text-xs text-green-600 bg-green-50 px-1.5 py-0.5 rounded inline-block mt-0.5">VIP 客户</p>
                        </div>
                    </div>
                    <div className="space-y-2 text-sm border-t border-gray-100 pt-3">
                        <div className="flex justify-between">
                            <span className="text-gray-500">信用额度</span>
                            <span className="font-medium text-gray-900">¥ 500,000</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">可用余额</span>
                            <span className="font-medium text-green-600">¥ 120,500</span>
                        </div>
                    </div>
                </div>
                {/* Invoice Info */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-gray-900 flex items-center gap-2">
                            <Icons.FileText className="w-5 h-5 text-gray-400"/> 发票信息
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500">是否开票</span>
                            <button className="w-11 h-6 bg-primary-600 rounded-full relative transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500">
                                <span className="translate-x-6 inline-block w-4 h-4 transform bg-white rounded-full transition-transform" />
                            </button>
                        </div>
                    </div>
                    
                    <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <span className="text-xs font-bold text-primary-600 bg-primary-50 px-2 py-0.5 rounded border border-primary-100">增值税专票</span>
                                    <p className="font-bold text-gray-900 mt-1">上海建工集团有限公司</p>
                                    <p className="text-sm text-gray-500 font-mono mt-0.5">913100001322000000</p>
                                </div>
                                <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded">待开票</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-gray-200">
                                <div>
                                    <span className="text-gray-500 block text-xs">开票金额</span>
                                    <span className="font-bold text-gray-900">¥ 2,400.00</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 block text-xs">税额 (13%)</span>
                                    <span className="font-bold text-gray-900">¥ 276.11</span>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button className="flex-1 py-1.5 bg-white border border-gray-300 rounded text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                                    预览发票
                                </button>
                                <button className="flex-1 py-1.5 bg-primary-600 text-white rounded text-sm font-bold hover:bg-primary-700 shadow-sm">
                                    生成发票
                                </button>
                            </div>
                        </div>

                        {/* Split Invoice Warning */}
                        <div className="flex items-start gap-2 p-3 bg-yellow-50 text-yellow-800 rounded-lg text-xs border border-yellow-100">
                            <Icons.AlertTriangle className="w-4 h-4 shrink-0 mt-0.5"/>
                            <div>
                                <p className="font-bold">金额超限预警</p>
                                <p className="mt-0.5 opacity-90">当前开票金额超过单张限额（¥100,000），系统将自动拆分为多张发票。</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
  );
};
