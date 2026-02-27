import React, { useState, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Page, Invoice, InvoiceType, InvoiceDirection, InvoiceStatus, InvoicePoolStats } from '../types';

interface InvoiceManagementProps {
  setPage?: (page: Page) => void;
}

// Mock Data
const MOCK_INVOICES: Invoice[] = [
  { id: 'INV-001', number: '12345678', code: '3300231130', type: 'vat_special', direction: 'inbound', amount: 10000, tax: 1300, total: 11300, rate: 0.13, date: '2023-10-25', counterparty: '上海宝钢集团', relatedOrderId: 'PO-20231027-001', relatedOrderType: 'purchase', status: 'verified' },
  { id: 'INV-002', number: '87654321', code: '3300231130', type: 'vat_normal', direction: 'outbound', amount: 5000, tax: 650, total: 5650, rate: 0.13, date: '2023-10-26', counterparty: '杭州建工集团', relatedOrderId: 'SO-20231027-089', relatedOrderType: 'sales', status: 'issued' },
  { id: 'INV-003', number: '11223344', code: '3300231140', type: 'electronic', direction: 'outbound', amount: 200, tax: 12, total: 212, rate: 0.06, date: '2023-10-27', counterparty: '个人客户', relatedOrderId: 'SO-20231025-003', relatedOrderType: 'sales', status: 'issued' },
];

const MOCK_STATS: InvoicePoolStats = {
  totalInboundTax: 15600.50,
  totalOutboundTax: 8450.20,
  balance: 7150.30,
  monthlyQuota: 1000000, // 100万
  usedQuota: 450000,
  alertThreshold: 0.8 // 80%
};

export const InvoiceManagement: React.FC<InvoiceManagementProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<'pool' | 'inbound' | 'outbound'>('pool');
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | 'all'>('all');

  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      if (activeTab === 'inbound' && inv.direction !== 'inbound') return false;
      if (activeTab === 'outbound' && inv.direction !== 'outbound') return false;
      if (filterStatus !== 'all' && inv.status !== filterStatus) return false;
      return true;
    });
  }, [invoices, activeTab, filterStatus]);

  const getStatusBadge = (status: InvoiceStatus) => {
    switch (status) {
      case 'draft': return <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-bold">草稿</span>;
      case 'issued': return <span className="px-2 py-1 bg-blue-100 text-blue-600 rounded text-xs font-bold">已开票</span>;
      case 'verified': return <span className="px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-bold">已认证</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-600 rounded text-xs font-bold">已作废</span>;
      default: return null;
    }
  };

  const getTypeLabel = (type: InvoiceType) => {
    switch (type) {
      case 'vat_special': return '增值税专票';
      case 'vat_normal': return '增值税普票';
      case 'electronic': return '电子发票';
      default: return type;
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col animate-fade-in gap-6">
      <div className="flex justify-between items-center shrink-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">发票管理中心</h1>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-sm text-gray-500">统一管理进项、销项发票及税务申报</p>
            <div className="flex items-center gap-2 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">
                <Icons.CheckCircle2 className="w-3 h-3" /> 税务局系统: 已连接 (API Gateway)
            </div>
          </div>
        </div>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center gap-2 shadow-sm">
            <Icons.RefreshCw className="w-4 h-4" /> 同步税务数据
          </button>
          <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium text-sm flex items-center gap-2 shadow-sm">
            <Icons.Download className="w-4 h-4" /> 导出报表
          </button>
          <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-bold text-sm flex items-center gap-2 shadow-sm">
            <Icons.Plus className="w-4 h-4" /> 录入发票
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button 
          onClick={() => setActiveTab('pool')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'pool' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          发票池概览
        </button>
        <button 
          onClick={() => setActiveTab('inbound')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'inbound' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          进项发票 (采购)
        </button>
        <button 
          onClick={() => setActiveTab('outbound')}
          className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'outbound' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
        >
          销项发票 (销售)
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'pool' && (
          <div className="space-y-6 animate-fade-in">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">本月进项税额</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">¥ {MOCK_STATS.totalInboundTax.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-green-50 text-green-600 rounded-lg"><Icons.ArrowDownLeft className="w-5 h-5"/></div>
                </div>
                <div className="text-xs text-gray-400">可抵扣税额累计</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">本月销项税额</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">¥ {MOCK_STATS.totalOutboundTax.toLocaleString()}</h3>
                  </div>
                  <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Icons.ArrowUpRight className="w-5 h-5"/></div>
                </div>
                <div className="text-xs text-gray-400">需缴纳税额累计</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">抵扣余额 (留抵)</p>
                    <h3 className={`text-2xl font-bold mt-1 ${MOCK_STATS.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ¥ {MOCK_STATS.balance.toLocaleString()}
                    </h3>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Wallet className="w-5 h-5"/></div>
                </div>
                <div className="text-xs text-gray-400">进项 - 销项</div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                <div className="flex justify-between items-start mb-4 relative z-10">
                  <div>
                    <p className="text-sm text-gray-500 font-medium">开票额度使用率</p>
                    <h3 className="text-2xl font-bold text-gray-900 mt-1">{(MOCK_STATS.usedQuota / MOCK_STATS.monthlyQuota * 100).toFixed(1)}%</h3>
                  </div>
                  <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><Icons.AlertCircle className="w-5 h-5"/></div>
                </div>
                <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden relative z-10">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${MOCK_STATS.usedQuota / MOCK_STATS.monthlyQuota > MOCK_STATS.alertThreshold ? 'bg-red-500' : 'bg-green-500'}`} 
                    style={{width: `${(MOCK_STATS.usedQuota / MOCK_STATS.monthlyQuota * 100)}%`}}
                  ></div>
                </div>
                <div className="text-xs text-gray-400 mt-2 relative z-10">
                  已用: ¥{(MOCK_STATS.usedQuota/10000).toFixed(1)}万 / 限额: ¥{(MOCK_STATS.monthlyQuota/10000).toFixed(1)}万
                </div>
              </div>
            </div>

            {/* Recent Activity or Charts could go here */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex items-start gap-4">
              <Icons.Info className="w-6 h-6 text-blue-600 shrink-0" />
              <div>
                <h3 className="font-bold text-blue-900">税务合规提示</h3>
                <p className="text-sm text-blue-700 mt-1">
                  请注意，本月开票额度已使用 45%，建议合理规划开票时间。对于超过单张限额（¥100,000）的销售订单，系统将自动提示拆分发票。
                  所有进项发票请务必在收到后360天内完成认证抵扣。
                </p>
              </div>
            </div>
          </div>
        )}

        {(activeTab === 'inbound' || activeTab === 'outbound') && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <div className="flex gap-2">
                <button onClick={() => setFilterStatus('all')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'all' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>全部</button>
                <button onClick={() => setFilterStatus('issued')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'issued' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>已开票</button>
                {activeTab === 'inbound' && (
                  <button onClick={() => setFilterStatus('verified')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'verified' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>已认证</button>
                )}
                <button onClick={() => setFilterStatus('draft')} className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${filterStatus === 'draft' ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>草稿</button>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Icons.Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" placeholder="搜索发票号/抬头..." className="pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none w-64" />
                </div>
              </div>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4">发票号码/代码</th>
                  <th className="px-6 py-4">类型</th>
                  <th className="px-6 py-4">{activeTab === 'inbound' ? '销售方' : '购买方'}</th>
                  <th className="px-6 py-4 text-right">不含税金额</th>
                  <th className="px-6 py-4 text-right">税额</th>
                  <th className="px-6 py-4 text-right">价税合计</th>
                  <th className="px-6 py-4">关联单据</th>
                  <th className="px-6 py-4">开票日期</th>
                  <th className="px-6 py-4 text-center">状态</th>
                  <th className="px-6 py-4 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filteredInvoices.length > 0 ? (
                  filteredInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-gray-900">{inv.number}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{inv.code}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-600">{getTypeLabel(inv.type)}</td>
                      <td className="px-6 py-4 font-medium text-gray-900">{inv.counterparty}</td>
                      <td className="px-6 py-4 text-right font-mono">¥{inv.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-right font-mono text-gray-600">¥{inv.tax.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4 text-right font-bold font-mono">¥{inv.total.toLocaleString(undefined, {minimumFractionDigits: 2})}</td>
                      <td className="px-6 py-4">
                        {inv.relatedOrderId ? (
                          <button 
                            onClick={() => {
                              if (setPage) {
                                if (inv.relatedOrderType === 'sales') setPage(Page.ORDER_DETAIL);
                                else if (inv.relatedOrderType === 'purchase') setPage(Page.PURCHASE_ORDER_DETAIL);
                              }
                            }}
                            className="text-primary-600 hover:text-primary-800 hover:underline font-mono text-xs flex items-center gap-1 transition-colors"
                          >
                            <Icons.Link className="w-3 h-3" />
                            {inv.relatedOrderId}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs">-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-gray-500">{inv.date}</td>
                      <td className="px-6 py-4 text-center">{getStatusBadge(inv.status)}</td>
                      <td className="px-6 py-4 text-right">
                        <button className="text-primary-600 hover:text-primary-800 font-medium text-xs">查看详情</button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="px-6 py-12 text-center text-gray-400">
                      <div className="flex flex-col items-center justify-center">
                        <Icons.FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p>暂无发票记录</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
