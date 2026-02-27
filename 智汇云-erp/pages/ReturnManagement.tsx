
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
}

export const ReturnManagement: React.FC<PageProps> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<'sales' | 'purchase'>('sales');
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const mockReturns = {
    sales: [
      { id: 'RET-S-102401', order: 'SO-20231024-001', customer: '宏达五金', date: '2023-10-24', amount: '¥ 1,200.00', status: '待质检入库', type: 'quality', rawStatus: 'pending' },
      { id: 'RET-S-102315', order: 'SO-20231021-005', customer: '上海建工', date: '2023-10-23', amount: '¥ 15,000.00', status: '已入库/待退款', type: 'excess', rawStatus: 'processing' },
      { id: 'RET-S-102308', order: 'SO-20231019-022', customer: '个人: 李四', date: '2023-10-22', amount: '¥ 350.00', status: '已完成', type: 'quality', rawStatus: 'completed' },
    ],
    purchase: [
      { id: 'RET-P-102405', order: 'PO-20231102-005', supplier: '博世工具', date: '2023-10-24', amount: '¥ 45,200.00', status: '厂家已确认', type: 'damaged', rawStatus: 'processing' },
      { id: 'RET-P-102401', order: 'PO-20231015-001', supplier: '金固五金', date: '2023-10-20', amount: '¥ 2,400.00', status: '已完成', type: 'excess', rawStatus: 'completed' },
    ]
  };

  const currentData = (activeTab === 'sales' ? mockReturns.sales : mockReturns.purchase).filter(item => {
      const matchesSearch = item.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (item as any).order.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.rawStatus === filterStatus;
      return matchesSearch && matchesStatus;
  });

  const statusCards = [
      { id: 'all', label: '全部申请', count: activeTab === 'sales' ? 24 : 15, icon: Icons.List, color: 'text-gray-600', bg: 'bg-white border-gray-200' },
      { id: 'pending', label: '待处理/质检', count: activeTab === 'sales' ? 5 : 2, icon: Icons.Clock, color: 'text-orange-600', bg: 'bg-orange-50 border-orange-200' },
      { id: 'processing', label: '退货中', count: activeTab === 'sales' ? 3 : 8, icon: Icons.Truck, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-200' },
      { id: 'completed', label: '已完成/退款', count: activeTab === 'sales' ? 16 : 5, icon: Icons.CheckCircle2, color: 'text-green-600', bg: 'bg-green-50 border-green-200' },
  ];

  return (
    <div className="flex h-[calc(100vh-6rem)] animate-fade-in flex-col gap-6">
      <div className="flex items-center justify-between shrink-0">
        <div>
           <h2 className="text-2xl font-bold text-gray-900">退货管理中心</h2>
           <p className="text-sm text-gray-500 mt-1">处理错发、质量问题或订单余料的逆向物流申请。</p>
        </div>
        <button 
            onClick={() => setPage(Page.RETURN_DETAIL)}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 active:scale-95 flex items-center gap-2"
        >
          <Icons.Plus className="w-4 h-4"/> 发起退货申请
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          {statusCards.map(card => (
              <div 
                key={card.id}
                onClick={() => setFilterStatus(card.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm hover:shadow-md ${filterStatus === card.id ? `ring-2 ring-offset-1 ring-primary-500 ${card.bg}` : 'bg-white border-gray-200 hover:border-primary-200'}`}
              >
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{card.label}</p>
                      <p className="text-2xl font-black text-gray-900">{card.count}</p>
                  </div>
                  <div className={`p-3 rounded-full ${card.id === filterStatus ? 'bg-white' : 'bg-gray-50'} ${card.color}`}>
                      <card.icon className="w-6 h-6"/>
                  </div>
              </div>
          ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap justify-between items-center bg-gray-50 gap-4">
           <div className="flex bg-white p-1 rounded-lg border border-gray-200">
              <button onClick={() => setActiveTab('sales')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'sales' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>销售退货</button>
              <button onClick={() => setActiveTab('purchase')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'purchase' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>采购退货</button>
           </div>
           <div className="relative flex-1 max-w-sm">
              <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="搜索单号、关联订单..." 
                className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-primary-500"
              />
           </div>
        </div>
        
        <div className="overflow-auto flex-1">
           <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-[10px] tracking-widest sticky top-0 z-10 border-b border-gray-100">
                 <tr>
                    <th className="px-6 py-4">单据编号</th>
                    <th className="px-6 py-4">日期</th>
                    <th className="px-6 py-4">{activeTab === 'sales' ? '往来客户' : '供应商'}</th>
                    <th className="px-6 py-4">关联单号</th>
                    <th className="px-6 py-4 text-right">金额</th>
                    <th className="px-6 py-4 text-center">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                 </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                 {currentData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setPage(Page.RETURN_DETAIL)}>
                        <td className="px-6 py-4 font-mono font-bold text-primary-600 group-hover:underline">{row.id}</td>
                        <td className="px-6 py-4 text-gray-500">{row.date}</td>
                        <td className="px-6 py-4 font-bold text-gray-900">{(row as any).customer || (row as any).supplier}</td>
                        <td className="px-6 py-4 font-mono text-xs text-gray-400">{row.order}</td>
                        <td className="px-6 py-4 text-right font-bold text-gray-900">{row.amount}</td>
                        <td className="px-6 py-4 text-center">
                           <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                               row.rawStatus === 'completed' ? 'bg-green-50 text-green-700 border-green-200' :
                               row.rawStatus === 'processing' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                               'bg-orange-50 text-orange-700 border-orange-200'
                           }`}>{row.status}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                           <div className="flex justify-end gap-2">
                              <button onClick={(e) => { e.stopPropagation(); setPage(Page.PRINT_CENTER); }} className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors" title="打印"><Icons.Print className="w-4 h-4"/></button>
                              <button className="p-1.5 text-gray-400 hover:text-primary-600 transition-colors"><Icons.Eye className="w-4 h-4"/></button>
                           </div>
                        </td>
                    </tr>
                 ))}
                 {currentData.length === 0 && (
                    <tr><td colSpan={7} className="text-center py-12 text-gray-400">
                        <Icons.Inbox className="w-12 h-12 mx-auto mb-2 opacity-20"/>
                        <p>暂无符合条件的退货单</p>
                    </td></tr>
                 )}
              </tbody>
           </table>
        </div>
      </div>
    </div>
  );
};

export const ReturnDetail: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="relative flex h-[calc(100vh-6rem)] w-full flex-col group/design-root overflow-x-hidden animate-fade-in">
            {/* Top Navigation / Breadcrumb - Adapted from header */}
            <div className="flex items-center gap-4 mb-4 shrink-0">
                <button onClick={() => setPage(Page.RETURN_MANAGEMENT)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 leading-tight tracking-tight">退货单详情</h2>
                    <p className="text-xs text-gray-500">PR-20231027-0042</p>
                </div>
            </div>

            <main className="flex-1 overflow-y-auto pb-6 space-y-6">
                {/* Workflow Stepper */}
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between w-full relative">
                        {/* Step 1: Draft */}
                        <div className="flex items-center gap-3 z-10 bg-white pr-4">
                            <div className="w-10 h-10 rounded-full bg-primary-600 text-white flex items-center justify-center">
                                <Icons.FileEdit className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-900 text-sm font-bold">拟稿中</p>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Current Status</p>
                            </div>
                        </div>
                        <div className="h-[2px] grow bg-gray-100 absolute left-0 top-5 -z-0"></div>
                        {/* Step 2: Pending Approval */}
                        <div className="flex items-center gap-3 z-10 bg-white px-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-gray-200">
                                <Icons.ClipboardCheck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold">待审批</p>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Approval</p>
                            </div>
                        </div>
                        {/* Step 3: Executing */}
                        <div className="flex items-center gap-3 z-10 bg-white px-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-gray-200">
                                <Icons.Truck className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold">退货出库/入库</p>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Executing</p>
                            </div>
                        </div>
                        {/* Step 4: Finished */}
                        <div className="flex items-center gap-3 z-10 bg-white pl-4">
                            <div className="w-10 h-10 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center border-2 border-gray-200">
                                <Icons.CheckCircle2 className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-gray-400 text-sm font-bold">已完成</p>
                                <p className="text-gray-400 text-xs uppercase tracking-wider">Completed</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Header Controls & Metadata */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <div className="flex bg-gray-200 p-1 rounded-lg">
                            <button className="px-6 py-1.5 rounded-md text-sm font-bold bg-white shadow-sm text-primary-600 transition-all">采购退货</button>
                            <button className="px-6 py-1.5 rounded-md text-sm font-medium text-gray-600 hover:text-gray-900 transition-all">销售退货</button>
                        </div>
                        <div className="flex gap-3">
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50">
                                <Icons.Print className="w-5 h-5" /> 打印预览
                            </button>
                            <button className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-700 bg-white hover:bg-gray-50">
                                <Icons.Download className="w-5 h-5" /> 导出PDF
                            </button>
                        </div>
                    </div>
                    <div className="p-6 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">退货单号</label>
                            <div className="flex items-center">
                                <input className="w-full h-11 bg-gray-50 border border-gray-200 rounded-lg px-3 text-gray-900 font-medium focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" readOnly type="text" value="PR-20231027-0042"/>
                                <button className="ml-2 text-primary-600 p-2 hover:bg-primary-50 rounded-md">
                                    <Icons.Refresh className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">关联采购单号</label>
                            <div className="relative">
                                <input className="w-full h-11 border border-gray-200 rounded-lg px-3 pl-10 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="搜索或扫码..." type="text"/>
                                <Icons.Link className="absolute left-3 top-3 text-gray-400 w-5 h-5" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">供应商 (往来单位)</label>
                            <select className="w-full h-11 border border-gray-200 rounded-lg px-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                                <option>上海精工五金器材有限公司</option>
                                <option>佛山中德标准件厂</option>
                                <option>温州坚朗建筑五金</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">退货日期</label>
                            <input className="w-full h-11 border border-gray-200 rounded-lg px-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" type="date" defaultValue="2023-10-27"/>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">退入仓库</label>
                            <select className="w-full h-11 border border-gray-200 rounded-lg px-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                                <option>1号成品总库</option>
                                <option>2号原材料仓</option>
                                <option>待处理退货区</option>
                            </select>
                        </div>
                        <div className="md:col-span-2 lg:col-span-3 space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wide">退货原因</label>
                            <div className="flex gap-2">
                                <select className="min-w-[200px] h-11 border border-gray-200 rounded-lg px-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none bg-white">
                                    <option>质量问题 - 表面锈迹</option>
                                    <option>规格不符 - 尺寸超差</option>
                                    <option>包装破损</option>
                                    <option>库存积压退回</option>
                                    <option>其他原因</option>
                                </select>
                                <input className="flex-1 h-11 border border-gray-200 rounded-lg px-3 text-gray-900 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none" placeholder="补充详细说明..." type="text"/>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Detail List Section */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="flex items-center gap-4 flex-1 max-w-xl">
                            <h3 className="text-gray-900 font-bold whitespace-nowrap">退货明细</h3>
                            <div className="relative w-full group">
                                <input autoFocus className="w-full h-10 bg-white border-primary-500/50 rounded-lg pl-10 focus:ring-2 focus:ring-primary-500 ring-offset-1 border-2 placeholder:text-gray-400 outline-none" placeholder="扫码添加商品 (自动连续扫码模式)..." type="text"/>
                                <Icons.Scan className="absolute left-3 top-2.5 text-primary-600 w-5 h-5" />
                                <div className="absolute right-3 top-2.5 text-[10px] bg-primary-100 text-primary-600 px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">Auto-Focus</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 transition-all shadow-md">
                                <Icons.PlusSquare className="w-5 h-5" /> 选择库存商品
                            </button>
                            <button className="flex items-center justify-center p-2 text-red-500 hover:bg-red-50 rounded-lg border border-red-200">
                                <Icons.DeleteSweep className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider w-12">#</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">商品编码</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">商品名称</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider">规格型号</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center">单位</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-32">退货数量</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-32">含税单价</th>
                                    <th className="px-4 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right w-40">合计金额</th>
                                    <th className="px-6 py-3 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-center w-20">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {/* Row 1 */}
                                <tr className="hover:bg-gray-50/50 group">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">01</td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-900">HW-304-M8-50</td>
                                    <td className="px-4 py-4 text-sm text-gray-700">六角头螺栓 (不锈钢)</td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">M8 x 50mm</span>
                                        <span className="ml-1 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">SUS 304</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 text-center">千只</td>
                                    <td className="px-4 py-4 text-right">
                                        <input className="w-full text-right bg-transparent focus:ring-1 focus:ring-primary-500/50 p-1 text-sm rounded border-none outline-none font-bold text-gray-900" type="number" defaultValue="15.00"/>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <input className="w-full text-right bg-transparent focus:ring-1 focus:ring-primary-500/50 p-1 text-sm rounded border-none outline-none text-gray-600" type="number" defaultValue="125.00"/>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">¥ 1,875.00</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Icons.Minus className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 2 */}
                                <tr className="hover:bg-gray-50/50 group">
                                    <td className="px-6 py-4 text-sm text-gray-400 font-medium">02</td>
                                    <td className="px-4 py-4 text-sm font-bold text-gray-900">TL-GD-420-OR</td>
                                    <td className="px-4 py-4 text-sm text-gray-700">工业切削油 (长效型)</td>
                                    <td className="px-4 py-4">
                                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200">20L/桶</span>
                                    </td>
                                    <td className="px-4 py-4 text-sm text-gray-600 text-center">桶</td>
                                    <td className="px-4 py-4 text-right">
                                        <input className="w-full text-right bg-transparent focus:ring-1 focus:ring-primary-500/50 p-1 text-sm rounded border-none outline-none font-bold text-gray-900" type="number" defaultValue="4.00"/>
                                    </td>
                                    <td className="px-4 py-4 text-right">
                                        <input className="w-full text-right bg-transparent focus:ring-1 focus:ring-primary-500/50 p-1 text-sm rounded border-none outline-none text-gray-600" type="number" defaultValue="340.00"/>
                                    </td>
                                    <td className="px-4 py-4 text-right text-sm font-bold text-gray-900">¥ 1,360.00</td>
                                    <td className="px-6 py-4 text-center">
                                        <button className="text-gray-300 hover:text-red-500 transition-colors">
                                            <Icons.Minus className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                                {/* Row 3 (Empty Placeholder) */}
                                <tr className="bg-gray-50/20">
                                    <td className="px-6 py-4 text-center text-gray-400 text-xs italic tracking-widest" colSpan={9}>
                                        -- 以上为已添加明细 --
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {/* Footer Summary Bar */}
                    <div className="bg-gray-900 text-white p-6 mt-auto flex flex-col md:flex-row justify-between items-center gap-6">
                        <div className="flex gap-12">
                            <div className="space-y-1">
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">总项数</p>
                                <p className="text-2xl font-bold">2 <span className="text-sm font-normal text-gray-500">Items</span></p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-wider">合计数量</p>
                                <p className="text-2xl font-bold">19.00</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-primary-500 text-[10px] font-bold uppercase tracking-wider">退货总金额 (含税)</p>
                                <p className="text-2xl font-bold text-primary-500">¥ 3,235.00</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <button onClick={() => setPage(Page.RETURN_MANAGEMENT)} className="px-8 py-3 rounded-lg border border-gray-700 text-sm font-bold text-white hover:bg-gray-800 transition-all">
                                保存草稿
                            </button>
                            <button className="px-10 py-3 rounded-lg bg-primary-600 text-white text-sm font-bold hover:bg-primary-500 transition-all shadow-lg shadow-primary-900/20 flex items-center gap-2">
                                提交审核 <Icons.Send className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Notes Section */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm mb-6">
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-sm font-bold text-gray-700">备注信息</label>
                            <textarea className="w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none p-3 text-sm outline-none" placeholder="填写更多退货细节或物流单号..." rows={2}></textarea>
                        </div>
                        <div className="w-72 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">制单人:</span>
                                <span className="text-gray-900 font-medium">张大伟 (2023-10-27 14:20)</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500">最后修改:</span>
                                <span className="text-gray-900 font-medium">-</span>
                            </div>
                            <div className="pt-2 border-t border-gray-100 flex items-center gap-2">
                                <Icons.ShieldCheck className="text-gray-400 w-5 h-5" />
                                <span className="text-xs text-gray-400">本单据符合 ISO-9001 质量回退标准</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};
