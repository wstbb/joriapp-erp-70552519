
import React, { useState, useRef, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
   setPage?: (page: Page) => void;
}

// ----------------------------------------------------------------------
// INBOUND MODULE
// ----------------------------------------------------------------------

export const ScanInbound: React.FC<PageProps> = ({ setPage }) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const mockData = [
    { id: 'PO-20231026-0042', supplier: '金固五金制品', items: '5 品种', total: 1200, received: 360, date: '2023-10-26', status: '收货中', type: 'pending' },
    { id: 'PO-20231025-011', supplier: '博世工具(中国)', items: '12 品种', total: 500, received: 0, date: '2023-10-25', status: '待入库', type: 'qc' },
    { id: 'PO-20231024-009', supplier: '山东紧固件厂', items: '3 品种', total: 10000, received: 10000, date: '2023-10-24', status: '已完成', type: 'completed' },
  ];

  const filteredData = activeFilter ? mockData.filter(d => d.type === activeFilter) : mockData;

  return (
    <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)]">
       <div className="flex justify-between items-center mb-6 shrink-0">
          <h1 className="text-2xl font-bold text-gray-900">入库管理工作台</h1>
          <button onClick={() => setPage && setPage(Page.INBOUND_DETAIL)} className="flex items-center gap-2 bg-primary-600 hover:bg-primary-700 text-white px-5 py-2.5 rounded-lg shadow-lg shadow-primary-100 transition-all active:scale-95">
             <Icons.Scan className="w-5 h-5" />
             <span className="font-bold">扫描收货入库 (F1)</span>
          </button>
       </div>

       {/* KPIs */}
       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6 shrink-0">
          <div onClick={() => setActiveFilter(activeFilter === 'pending' ? null : 'pending')} className={`bg-white p-6 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${activeFilter === 'pending' ? 'border-primary-500 ring-2 ring-primary-50' : 'border-gray-200 hover:shadow-md'}`}>
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm font-medium text-gray-500">今日待入库</p>
                   <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-3xl font-bold text-gray-900">24</h3>
                      <span className="text-xs text-gray-400 font-medium">单</span>
                   </div>
                   <p className="text-[10px] text-green-600 mt-2 font-bold flex items-center gap-1"><Icons.TrendingUp className="w-3 h-3"/> +5% 较昨日</p>
                </div>
                <div className="p-2.5 bg-blue-50 rounded-xl text-primary-500"><Icons.Inbound className="w-6 h-6"/></div>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-primary-500/10"><div className="h-full bg-primary-500 w-3/4"></div></div>
          </div>
          <div onClick={() => setActiveFilter(activeFilter === 'qc' ? null : 'qc')} className={`bg-white p-6 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${activeFilter === 'qc' ? 'border-orange-500 ring-2 ring-orange-50' : 'border-gray-200 hover:shadow-md'}`}>
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm font-medium text-gray-500">待质检确认</p>
                   <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-3xl font-bold text-orange-600">8</h3>
                      <span className="text-xs text-gray-400 font-medium">单</span>
                   </div>
                   <p className="text-[10px] text-gray-400 mt-2">需在 17:00 前完成</p>
                </div>
                <div className="p-2.5 bg-orange-50 rounded-xl text-orange-500"><Icons.ClipboardCheck className="w-6 h-6"/></div>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-orange-500/10"><div className="h-full bg-orange-500 w-1/4"></div></div>
          </div>
          <div className="bg-white p-6 rounded-xl border relative overflow-hidden hover:shadow-md transition-all">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm font-medium text-gray-500">上架完成率</p>
                   <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-3xl font-bold text-purple-600">92%</h3>
                   </div>
                   <p className="text-[10px] text-purple-500 mt-2 font-bold uppercase tracking-wider">高效运转</p>
                </div>
                <div className="p-2.5 bg-purple-50 rounded-xl text-purple-500"><Icons.Warehouse className="w-6 h-6"/></div>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-purple-500/10"><div className="h-full bg-purple-500 w-[92%]"></div></div>
          </div>
          <div onClick={() => setActiveFilter(activeFilter === 'completed' ? null : 'completed')} className={`bg-white p-6 rounded-xl border relative overflow-hidden cursor-pointer transition-all ${activeFilter === 'completed' ? 'border-green-500 ring-2 ring-green-50' : 'border-gray-200 hover:shadow-md'}`}>
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-sm font-medium text-gray-500">今日已入库 (SKU)</p>
                   <div className="flex items-baseline gap-1 mt-1">
                      <h3 className="text-3xl font-bold text-gray-900">1,240</h3>
                   </div>
                   <p className="text-[10px] text-green-600 mt-2 font-bold flex items-center gap-1"><Icons.Check className="w-3 h-3"/> 15单 已结案</p>
                </div>
                <div className="p-2.5 bg-green-50 rounded-xl text-green-500"><Icons.CheckCircle2 className="w-6 h-6"/></div>
             </div>
             <div className="absolute bottom-0 left-0 w-full h-1 bg-green-500/10"><div className="h-full bg-green-500 w-full"></div></div>
          </div>
       </div>

       {/* Toolbar */}
       <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4 flex flex-wrap gap-4 items-center shrink-0">
          <div className="relative flex-1 min-w-[300px]">
             <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4" />
             <input type="text" placeholder="搜索采购单号、供应商..." className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:bg-white text-gray-900 outline-none focus:ring-2 focus:ring-primary-500 transition-all" />
          </div>
          <select className="px-4 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-700 outline-none hover:bg-white focus:ring-2 focus:ring-primary-500 cursor-pointer">
             <option>所有状态</option>
             <option>收货中</option>
             <option>待质检</option>
          </select>
          <div className="flex gap-2 ml-auto">
             <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50">
                <Icons.Download className="w-4 h-4"/> 导出报表
             </button>
             <button className="flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-600 rounded-lg text-sm font-bold border border-primary-100 hover:bg-primary-100">
                <Icons.Plus className="w-4 h-4"/> 新建入库单
             </button>
          </div>
       </div>

       <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
          <div className="overflow-auto flex-1">
             <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
                   <tr className="text-gray-500 font-semibold uppercase tracking-wider text-xs">
                      <th className="px-6 py-4 w-12"><input type="checkbox" className="rounded border-gray-300"/></th>
                      <th className="px-6 py-4">采购单号</th>
                      <th className="px-6 py-4">供应商</th>
                      <th className="px-6 py-4">商品种类</th>
                      <th className="px-6 py-4 text-right">总数量</th>
                      <th className="px-6 py-4">预计到货</th>
                      <th className="px-6 py-4 w-48">入库进度</th>
                      <th className="px-6 py-4 text-center">状态</th>
                      <th className="px-6 py-4 text-right">操作</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                   {filteredData.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 group cursor-pointer" onClick={() => setPage && setPage(Page.INBOUND_DETAIL)}>
                         <td className="px-6 py-4"><input type="checkbox" className="rounded border-gray-300" onClick={(e) => e.stopPropagation()}/></td>
                         <td className="px-6 py-4 font-bold text-primary-600">{row.id}</td>
                         <td className="px-6 py-4 font-medium text-gray-900">{row.supplier}</td>
                         <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 rounded text-xs font-medium text-gray-600">{row.items}</span></td>
                         <td className="px-6 py-4 text-right font-mono font-bold text-gray-700">{row.total.toLocaleString()}</td>
                         <td className="px-6 py-4 text-gray-500">{row.date}</td>
                         <td className="px-6 py-4">
                            <div className="flex justify-between items-center text-[10px] mb-1.5"><span className="text-gray-400">已收 {row.received} / {row.total}</span><span className="font-bold">{Math.round((row.received/row.total)*100)}%</span></div>
                            <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                               <div className={`h-full rounded-full ${row.type === 'qc' ? 'bg-orange-400' : row.type === 'completed' ? 'bg-green-500' : 'bg-primary-500'}`} style={{width: `${(row.received/row.total)*100}%`}}></div>
                            </div>
                         </td>
                         <td className="px-6 py-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${row.type === 'completed' ? 'bg-green-50 text-green-700 border-green-200' : row.type === 'qc' ? 'bg-orange-50 text-orange-700 border-orange-200' : 'bg-blue-50 text-blue-700 border-blue-200'}`}>{row.status}</span>
                         </td>
                         <td className="px-6 py-4 text-right">
                            <button className="px-3 py-1.5 bg-white border border-gray-200 rounded text-xs font-bold text-primary-600 hover:bg-primary-50 hover:border-primary-200 transition-colors">继续收货</button>
                         </td>
                      </tr>
                   ))}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}

export const InboundDetail: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPage && setPage(Page.SCAN_INBOUND)} className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 text-gray-500"><Icons.ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">入库作业: PO-20231026-0042</h2>
                    <p className="text-sm text-gray-500">供应商: 金固五金制品 | 仓库: 五金总仓 A区</p>
                </div>
                <div className="ml-auto">
                    <button onClick={() => setPage && setPage(Page.SCAN_INBOUND_SUCCESS)} className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-md flex items-center gap-2">
                        <Icons.CheckCircle2 className="w-5 h-5"/> 完成入库
                    </button>
                </div>
            </div>

            <div className="flex gap-6 h-full">
                {/* Left: Scan Input & List */}
                <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center gap-3">
                        <div className="relative flex-1">
                            <Icons.Scan className="absolute left-3 top-3 text-primary-600 w-5 h-5"/>
                            <input autoFocus type="text" placeholder="扫描商品条码 / 包装箱码..." className="w-full pl-10 pr-4 py-2.5 border-2 border-primary-500 rounded-lg text-lg focus:outline-none shadow-sm"/>
                        </div>
                        <button className="px-4 py-2.5 bg-white border border-gray-200 rounded-lg font-bold text-gray-700 hover:bg-gray-50">手动输入</button>
                    </div>
                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 text-gray-500 text-xs uppercase sticky top-0">
                                <tr>
                                    <th className="px-6 py-3">商品信息</th>
                                    <th className="px-6 py-3 text-center">待收</th>
                                    <th className="px-6 py-3 text-center">已扫</th>
                                    <th className="px-6 py-3 text-right">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                <tr className="bg-green-50/50">
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">304不锈钢六角螺栓 M8</div>
                                        <div className="text-xs text-gray-500">SKU: BOLT-304-M8-40</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">1000</td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-green-600">1000</td>
                                    <td className="px-6 py-4 text-right"><span className="text-xs font-bold text-green-600 bg-green-100 px-2 py-1 rounded">完成</span></td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">PVC排水管 DN110</div>
                                        <div className="text-xs text-gray-500">SKU: PVC-DN110</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">50</td>
                                    <td className="px-6 py-4 text-center font-mono font-bold text-primary-600">20</td>
                                    <td className="px-6 py-4 text-right"><span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">进行中</span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Camera/Info */}
                <div className="w-80 flex flex-col gap-4">
                    <div className="bg-black rounded-xl overflow-hidden aspect-video relative flex items-center justify-center">
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50"></div>
                        <p className="text-white/50 text-sm">摄像头预览区域</p>
                        <div className="absolute bottom-4 left-0 right-0 text-center text-white text-xs font-mono">Scanner Active</div>
                    </div>
                    <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm flex-1">
                        <h3 className="font-bold text-gray-900 mb-4">当前扫描</h3>
                        <div className="aspect-square bg-gray-100 rounded-lg mb-4 flex items-center justify-center">
                            <Icons.Image className="w-12 h-12 text-gray-300"/>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm text-gray-500">名称: <span className="text-gray-900 font-bold">PVC排水管 DN110</span></p>
                            <p className="text-sm text-gray-500">条码: <span className="font-mono">69200018821</span></p>
                            <div className="flex items-center gap-2 mt-4">
                                <button className="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200 font-bold text-xl">-</button>
                                <input type="number" className="w-20 text-center text-xl font-bold border-b-2 border-primary-500 outline-none" defaultValue={1}/>
                                <button className="flex-1 py-2 bg-gray-100 rounded hover:bg-gray-200 font-bold text-xl">+</button>
                            </div>
                            <button className="w-full py-3 bg-primary-600 text-white rounded-lg font-bold mt-4 shadow-sm hover:bg-primary-700">确认数量 (Enter)</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// OUTBOUND MODULE
// ----------------------------------------------------------------------

const CreateOutboundModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <h3 className="text-xl font-bold text-gray-900">新建出库任务</h3>
                        <p className="text-xs text-gray-500 mt-1">适用于非标准销售流程（如样品、补发、内部领用）</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.Close className="w-5 h-5 text-gray-500"/></button>
                </div>
                
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-sm font-bold text-gray-700 block">业务类型 <span className="text-red-500">*</span></label>
                        <div className="grid grid-cols-2 gap-3">
                            <label className="flex items-center gap-3 p-3 border border-primary-200 bg-primary-50 rounded-lg cursor-pointer">
                                <input type="radio" name="out_type" className="text-primary-600 focus:ring-primary-500 w-4 h-4" defaultChecked />
                                <div>
                                    <div className="font-bold text-primary-900 text-sm">样品/赠品</div>
                                    <div className="text-[10px] text-primary-600">不计入销售额，计入营销费用</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <input type="radio" name="out_type" className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">售后补发/换货</div>
                                    <div className="text-[10px] text-gray-500">关联原订单，库存报损或置换</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <input type="radio" name="out_type" className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">内部领用</div>
                                    <div className="text-[10px] text-gray-500">部门自用，计入管理费用</div>
                                </div>
                            </label>
                            <label className="flex items-center gap-3 p-3 border border-gray-200 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                <input type="radio" name="out_type" className="text-primary-600 focus:ring-primary-500 w-4 h-4" />
                                <div>
                                    <div className="font-bold text-gray-900 text-sm">其他出库</div>
                                    <div className="text-[10px] text-gray-500">特殊情况处理</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">发货仓库</label>
                            <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                <option>五金总仓 A区</option>
                                <option>管材专用仓 B区</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-gray-500 uppercase">优先级</label>
                            <select className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                                <option>普通 Normal</option>
                                <option>加急 Urgent</option>
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">领用人 / 客户名称</label>
                        <div className="relative">
                            <input type="text" className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="输入名称或员工号..." />
                            <Icons.User className="absolute left-3 top-3 text-gray-400 w-4 h-4" />
                        </div>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-xs font-bold text-gray-500 uppercase">备注说明</label>
                        <textarea className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none" placeholder="填写出库原因..."></textarea>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 bg-white border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 text-sm font-bold transition-colors">取消</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-200 hover:bg-primary-700 text-sm font-bold transition-transform active:scale-95 flex items-center justify-center gap-2">
                        下一步：选择商品 <Icons.ArrowRight className="w-4 h-4"/>
                    </button>
                </div>
            </div>
        </div>
    );
};

export const SalesOutbound: React.FC<PageProps> = ({ setPage }) => {
    const [statusFilter, setStatusFilter] = useState<'pending' | 'picking' | 'packed' | 'shipped'>('pending');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

    const outboundOrders = [
        { id: 'DO-20231027-001', so: 'SO-20231027-001', client: '上海建工集团', items: 15, date: '10:30', status: 'pending', priority: 'high', address: '上海市浦东新区张江高科' },
        { id: 'DO-20231027-002', so: 'SO-20231027-012', client: '杭州西湖装修公司', items: 5, date: '11:15', status: 'picking', priority: 'normal', address: '杭州市西湖区' },
        { id: 'DO-20231026-088', so: 'SO-20231026-115', client: '博世中国', items: 45, date: '昨天', status: 'packed', priority: 'high', address: '苏州市工业园区' },
        { id: 'DO-20231026-050', so: 'SO-20231026-099', client: '个人: 赵六', items: 1, date: '昨天', status: 'shipped', priority: 'normal', address: '南京市鼓楼区' },
    ];

    const filtered = outboundOrders.filter(o => {
        if (statusFilter === 'pending') return o.status === 'pending';
        if (statusFilter === 'picking') return o.status === 'picking';
        if (statusFilter === 'packed') return o.status === 'packed';
        return o.status === 'shipped';
    });

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
            <CreateOutboundModal 
                isOpen={isCreateModalOpen} 
                onClose={() => setIsCreateModalOpen(false)} 
                onConfirm={() => { setIsCreateModalOpen(false); setPage && setPage(Page.OUTBOUND_DETAIL); }}
            />

            <div className="flex justify-between items-center mb-6 shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">出库管理 (Outbound)</h1>
                    <p className="text-sm text-gray-500 mt-1">处理销售订单生成出库任务，安排拣货与发货。</p>
                </div>
                <div className="flex gap-2">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm transition-colors">
                        <Icons.Print className="w-4 h-4 inline mr-2"/> 批量打单
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-colors flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4"/> 手动新建出库单
                    </button>
                </div>
            </div>

            {/* Status Tabs */}
            <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
                {[
                    { id: 'pending', label: '待拣货 (To Pick)', count: 12, color: 'border-orange-500 bg-orange-50 text-orange-700', icon: Icons.ListOrdered },
                    { id: 'picking', label: '拣货中 (Picking)', count: 5, color: 'border-blue-500 bg-blue-50 text-blue-700', icon: Icons.Package2 },
                    { id: 'packed', label: '待发货 (Packed)', count: 8, color: 'border-purple-500 bg-purple-50 text-purple-700', icon: Icons.Box },
                    { id: 'shipped', label: '已发货 (Shipped)', count: 45, color: 'border-green-500 bg-green-50 text-green-700', icon: Icons.Truck },
                ].map((stat) => (
                    <div 
                        key={stat.id} 
                        onClick={() => setStatusFilter(stat.id as any)}
                        className={`p-4 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-between shadow-sm hover:shadow-md ${statusFilter === stat.id ? stat.color : 'border-gray-200 bg-white hover:border-gray-300'}`}
                    >
                        <div>
                            <p className="text-xs font-bold uppercase tracking-wider opacity-80">{stat.label}</p>
                            <p className="text-2xl font-black mt-1">{stat.count}</p>
                        </div>
                        <stat.icon className={`w-8 h-8 opacity-20`} />
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden flex flex-col">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="relative w-96">
                        <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                        <input className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500 transition-all bg-white" placeholder="搜索出库单、关联销售单、客户..."/>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 font-bold uppercase text-xs border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">出库单号</th>
                                <th className="px-6 py-4">关联销售单</th>
                                <th className="px-6 py-4">客户信息</th>
                                <th className="px-6 py-4 text-center">商品数</th>
                                <th className="px-6 py-4">优先级</th>
                                <th className="px-6 py-4 text-center">状态</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map(order => (
                                <tr key={order.id} className="hover:bg-gray-50 transition-colors cursor-pointer group" onClick={() => setPage && setPage(Page.OUTBOUND_DETAIL)}>
                                    <td className="px-6 py-4 font-mono font-bold text-primary-600">{order.id}</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">{order.so}</td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{order.client}</div>
                                        <div className="text-xs text-gray-500 truncate max-w-[200px]">{order.address}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">{order.items}</td>
                                    <td className="px-6 py-4">
                                        {order.priority === 'high' ? <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-1 rounded border border-red-100">高优先级</span> : <span className="text-xs text-gray-500">普通</span>}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            order.status === 'pending' ? 'bg-orange-100 text-orange-700' :
                                            order.status === 'picking' ? 'bg-blue-100 text-blue-700' :
                                            order.status === 'packed' ? 'bg-purple-100 text-purple-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {order.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary-600 p-2"><Icons.ArrowRight className="w-4 h-4"/></button>
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

export const OutboundDetail: React.FC<PageProps> = ({ setPage }) => {
    const [scanCode, setScanCode] = useState('');
    const [items, setItems] = useState([
        { id: 1, name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-001', location: 'A-01-02', required: 1000, picked: 0, status: 'pending' },
        { id: 2, name: '博世手电钻 GSR 120-LI', sku: 'BOSCH-GSR-120', location: 'B-03-12', required: 2, picked: 0, status: 'pending' },
    ]);
    const [logistics, setLogistics] = useState({ company: 'SF', tracking: '', cost: '', syncFinance: true });
    const scanInputRef = useRef<HTMLInputElement>(null);

    const handleScan = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            const itemIndex = items.findIndex(i => i.sku.toLowerCase() === scanCode.toLowerCase() || i.id.toString() === scanCode);
            if (itemIndex > -1) {
                const newItems = [...items];
                const item = newItems[itemIndex];
                if (item.picked < item.required) {
                    item.picked += 1; // Or + package quantity
                    if (item.picked >= item.required) item.status = 'picked';
                    setItems(newItems);
                    setScanCode('');
                    // Visual feedback could be added here
                } else {
                    alert('该商品已拣货完成！');
                }
            } else {
                alert('未找到商品或商品不在本单中');
            }
        }
    };

    const handleConfirmShipment = () => {
        const allPicked = items.every(i => i.status === 'picked');
        if (!allPicked) {
            if(!confirm('部分商品未完成拣货，确认强制发货吗？')) return;
        }
        
        let msg = '发货成功！库存已扣减。';
        if (logistics.syncFinance && logistics.cost) {
            msg += `\n\n财务同步：物流费用 ¥${logistics.cost} 已自动计入【物流运输】科目，关联订单 DO-20231027-001。`;
        }
        alert(msg);
        setPage && setPage(Page.SALES_OUTBOUND);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-6xl mx-auto pb-10">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPage && setPage(Page.SALES_OUTBOUND)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">出库作业: DO-20231027-001</h1>
                    <p className="text-sm text-gray-500">关联订单: SO-20231027-001 | 客户: 上海建工集团</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2">
                        <Icons.Print className="w-4 h-4"/> 打印拣货单
                    </button>
                    <button onClick={handleConfirmShipment} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center gap-2">
                        <Icons.Truck className="w-4 h-4"/> 确认发货
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6 h-full overflow-hidden">
                {/* Left: Picking List */}
                <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Scanning Bar */}
                    <div className="p-4 border-b border-gray-200 bg-primary-50/30 flex items-center gap-4">
                        <div className="relative flex-1">
                            <Icons.Scan className="absolute left-3 top-3 text-primary-600 w-5 h-5"/>
                            <input 
                                ref={scanInputRef}
                                type="text" 
                                value={scanCode}
                                onChange={(e) => setScanCode(e.target.value)}
                                onKeyDown={handleScan}
                                autoFocus
                                className="w-full pl-10 pr-4 py-2.5 border-2 border-primary-500 rounded-lg text-lg focus:outline-none shadow-sm placeholder:text-gray-400"
                                placeholder="扫描商品条码或货位码拣货..."
                            />
                            <div className="absolute right-3 top-3 text-xs font-bold text-primary-400">AUTO-ENTER</div>
                        </div>
                        <div className="text-center px-4">
                            <p className="text-xs text-gray-500 font-bold uppercase">拣货进度</p>
                            <p className="text-lg font-black text-primary-600">
                                {items.filter(i => i.status === 'picked').length} / {items.length}
                            </p>
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-gray-500 border-b border-gray-100 text-xs uppercase sticky top-0 z-10">
                                <tr>
                                    <th className="py-3 px-6 font-semibold">商品信息</th>
                                    <th className="py-3 px-6 font-semibold">货位</th>
                                    <th className="py-3 px-6 text-center font-semibold">应发</th>
                                    <th className="py-3 px-6 text-center font-semibold">实发 (已扫)</th>
                                    <th className="py-3 px-6 text-center font-semibold">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {items.map(item => (
                                    <tr key={item.id} className={`transition-colors ${item.status === 'picked' ? 'bg-green-50/50' : 'hover:bg-gray-50'}`}>
                                        <td className="py-4 px-6">
                                            <div className="font-bold text-gray-900">{item.name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">SKU: {item.sku}</div>
                                        </td>
                                        <td className="py-4 px-6 font-mono text-primary-600 font-bold text-lg">{item.location}</td>
                                        <td className="py-4 px-6 text-center font-mono font-bold text-gray-500">{item.required}</td>
                                        <td className="py-4 px-6 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button onClick={() => {
                                                    const newItems = items.map(i => i.id === item.id ? {...i, picked: Math.max(0, i.picked - 1), status: 'pending'} : i);
                                                    setItems(newItems);
                                                }} className="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">-</button>
                                                <input 
                                                    type="number" 
                                                    className={`w-20 text-center border rounded p-1 font-bold ${item.picked === item.required ? 'text-green-600 border-green-500 bg-green-50' : 'border-gray-300'}`} 
                                                    value={item.picked}
                                                    onChange={(e) => {
                                                        const val = parseInt(e.target.value) || 0;
                                                        const newItems = items.map(i => i.id === item.id ? {...i, picked: val, status: val >= i.required ? 'picked' : 'pending'} : i);
                                                        setItems(newItems);
                                                    }}
                                                />
                                                <button onClick={() => {
                                                    const newItems = items.map(i => i.id === item.id ? {...i, picked: i.picked + 1, status: i.picked + 1 >= i.required ? 'picked' : 'pending'} : i);
                                                    setItems(newItems);
                                                }} className="w-6 h-6 rounded bg-gray-100 text-gray-600 hover:bg-gray-200">+</button>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-center">
                                            {item.status === 'picked' ? (
                                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold flex items-center justify-center gap-1"><Icons.Check className="w-3 h-3"/> 完成</span>
                                            ) : (
                                                <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded font-bold">拣货中</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right: Logistics & Info */}
                <div className="w-80 flex flex-col gap-6 shrink-0">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Icons.Truck className="w-5 h-5 text-gray-400"/> 物流发货信息
                        </h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">承运物流</label>
                                <select 
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                    value={logistics.company}
                                    onChange={e => setLogistics({...logistics, company: e.target.value})}
                                >
                                    <option value="SF">顺丰速运</option>
                                    <option value="STO">申通快递</option>
                                    <option value="ZTO">中通快递</option>
                                    <option value="JD">京东物流</option>
                                    <option value="OTHER">自提/其他</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">物流单号</label>
                                <div className="relative">
                                    <input 
                                        type="text" 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none pl-8"
                                        placeholder="扫码或输入..."
                                        value={logistics.tracking}
                                        onChange={e => setLogistics({...logistics, tracking: e.target.value})}
                                    />
                                    <Icons.Scan className="absolute left-2.5 top-2.5 text-gray-400 w-4 h-4"/>
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5 flex justify-between">
                                    <span>预计运费 (成本)</span>
                                    <span className="text-[10px] text-orange-600 bg-orange-50 px-1 rounded">财务联动</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-gray-500 font-bold">¥</span>
                                    <input 
                                        type="number" 
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 pl-7 text-sm font-bold text-gray-900 focus:ring-2 focus:ring-orange-500 outline-none"
                                        placeholder="0.00"
                                        value={logistics.cost}
                                        onChange={e => setLogistics({...logistics, cost: e.target.value})}
                                    />
                                </div>
                                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        className="rounded text-primary-600 focus:ring-primary-500 w-4 h-4 border-gray-300"
                                        checked={logistics.syncFinance}
                                        onChange={e => setLogistics({...logistics, syncFinance: e.target.checked})}
                                    />
                                    <span className="text-xs text-gray-600">自动计入财务成本</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
                        <h3 className="font-bold text-gray-900 mb-4 text-sm">收货人信息</h3>
                        <div className="text-sm space-y-3">
                            <div>
                                <span className="text-gray-500 block text-xs">联系人</span>
                                <span className="font-bold">王工程 (139-1234-5678)</span>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs">收货地址</span>
                                <span className="text-gray-700">上海市浦东新区张江高科园区 88 号工地现场 A座</span>
                            </div>
                            <div className="pt-3 border-t border-gray-100">
                                <span className="text-gray-500 block text-xs mb-1">发货备注</span>
                                <p className="text-xs bg-yellow-50 text-yellow-800 p-2 rounded">
                                    请务必在工作日送达，送货前需提前电话联系。
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const StockTransfer: React.FC<PageProps> = ({ setPage }) => {
    const transfers = [
        { id: 'TR-20231027-001', from: '五金总仓 A区', to: '城北分仓', items: 5, status: 'pending', date: '2023-10-27' },
        { id: 'TR-20231026-003', from: '管材专用仓 B区', to: '五金总仓 A区', items: 2, status: 'completed', date: '2023-10-26' },
        { id: 'TR-20231025-012', from: '五金总仓 A区', to: '次品暂存库', items: 10, status: 'in_transit', date: '2023-10-25' },
    ];

    const cards = [
        { id: 'all', label: '本月调拨总数', value: '18', icon: Icons.Transfer, color: 'text-primary-600', bg: 'bg-primary-50', border: 'border-primary-200' },
        { id: 'pending', label: '待审批/待出库', value: '3', icon: Icons.Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
        { id: 'in_transit', label: '在途调拨', value: '1', icon: Icons.Truck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'completed', label: '已完成', value: '14', icon: Icons.CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">库存调拨 (Transfer)</h1>
                    <p className="text-sm text-gray-500 mt-1">管理不同仓库之间的物资调动。</p>
                </div>
                <button onClick={() => setPage && setPage(Page.STOCK_TRANSFER_DETAIL)} className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 flex items-center gap-2 transition-transform active:scale-95">
                    <Icons.Plus className="w-4 h-4"/> 新建调拨单
                </button>
            </div>

            {/* Quick Access Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
                {cards.map(card => (
                    <div key={card.id} className={`bg-white p-4 rounded-xl border ${card.border} shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer`}>
                        <div className="flex justify-between items-start">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                            <div className={`p-2 rounded-lg ${card.bg} ${card.color}`}><card.icon className="w-5 h-5"/></div>
                        </div>
                        <p className="text-2xl font-black text-gray-900 mt-2">{card.value}</p>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">调拨单号</th>
                            <th className="px-6 py-4">调出仓库</th>
                            <th className="px-6 py-4">调入仓库</th>
                            <th className="px-6 py-4 text-center">商品项数</th>
                            <th className="px-6 py-4">日期</th>
                            <th className="px-6 py-4 text-center">状态</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transfers.map((tr, i) => (
                            <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => setPage && setPage(Page.STOCK_TRANSFER_DETAIL)}>
                                <td className="px-6 py-4 font-mono font-bold text-primary-600">{tr.id}</td>
                                <td className="px-6 py-4">{tr.from}</td>
                                <td className="px-6 py-4">{tr.to}</td>
                                <td className="px-6 py-4 text-center">{tr.items}</td>
                                <td className="px-6 py-4 text-gray-500">{tr.date}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        tr.status === 'completed' ? 'bg-green-100 text-green-700' : 
                                        tr.status === 'in_transit' ? 'bg-blue-100 text-blue-700' :
                                        'bg-orange-100 text-orange-700'
                                    }`}>
                                        {tr.status === 'completed' ? '已完成' : tr.status === 'in_transit' ? '运输中' : '待处理'}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button className="text-gray-400 hover:text-primary-600"><Icons.ArrowRight className="w-4 h-4"/></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const StockTransferDetail: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="flex flex-col h-full animate-fade-in max-w-4xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPage && setPage(Page.STOCK_TRANSFER)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5"/>
                </button>
                <h1 className="text-2xl font-bold text-gray-900">新建调拨单</h1>
                <button className="ml-auto px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md">
                    提交调拨
                </button>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">调出仓库 (Source)</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none">
                            <option>五金总仓 A区</option>
                            <option>管材专用仓 B区</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">调入仓库 (Destination)</label>
                        <select className="w-full border border-gray-300 rounded-lg p-2.5 bg-gray-50 focus:ring-2 focus:ring-primary-500 outline-none">
                            <option>城北分仓</option>
                            <option>五金总仓 A区</option>
                        </select>
                    </div>
                </div>

                <div className="border-t border-gray-100 pt-6">
                    <h3 className="font-bold text-gray-900 mb-4">调拨商品明细</h3>
                    <div className="bg-gray-50 rounded-lg p-8 border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                        <Icons.Package className="w-10 h-10 mb-2 opacity-50"/>
                        <p className="text-sm">暂无商品</p>
                        <button className="mt-4 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-primary-600 hover:bg-primary-50 transition-colors shadow-sm">
                            + 添加商品
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InventoryCheck: React.FC<PageProps> = ({ setPage }) => {
    // KPI Data
    const kpis = [
        { label: '进行中的盘点', value: '2', icon: Icons.Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
        { label: '上月准确率', value: '98.5%', icon: Icons.Target, color: 'text-green-600', bg: 'bg-green-50' },
        { label: '待处理差异金额', value: '¥ -450.00', icon: Icons.AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">库存盘点 (Audit)</h1>
                    <p className="text-sm text-gray-500 mt-1">定期核对系统库存与实物库存。</p>
                </div>
                <button 
                    onClick={() => setPage && setPage(Page.INVENTORY_CHECK_DETAIL)}
                    className="px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 flex items-center gap-2 transition-transform active:scale-95"
                >
                    <Icons.Plus className="w-4 h-4"/> 开始新盘点
                </button>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {kpis.map((kpi, idx) => (
                    <div key={idx} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{kpi.label}</p>
                            <p className="text-2xl font-black text-gray-900 mt-2">{kpi.value}</p>
                        </div>
                        <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                            <kpi.icon className="w-6 h-6"/>
                        </div>
                    </div>
                ))}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase sticky top-0 border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">盘点单号</th>
                            <th className="px-6 py-4">盘点范围/仓库</th>
                            <th className="px-6 py-4 text-center">进度</th>
                            <th className="px-6 py-4 text-center">差异数</th>
                            <th className="px-6 py-4">创建日期</th>
                            <th className="px-6 py-4 text-center">状态</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setPage && setPage(Page.INVENTORY_CHECK_DETAIL)}>
                            <td className="px-6 py-4 font-mono font-bold text-primary-600">IV-20231027-001</td>
                            <td className="px-6 py-4">五金总仓 A区 (全盘)</td>
                            <td className="px-6 py-4 text-center">
                                <div className="w-24 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-blue-500 h-full w-[45%]"></div>
                                </div>
                                <span className="text-[10px] text-gray-500">45%</span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-red-500">-5</td>
                            <td className="px-6 py-4 text-gray-500">2023-10-27</td>
                            <td className="px-6 py-4 text-center"><span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-bold">进行中</span></td>
                            <td className="px-6 py-4 text-right"><button className="text-primary-600 font-bold text-xs hover:underline">继续盘点</button></td>
                        </tr>
                        <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setPage && setPage(Page.INVENTORY_CHECK_DETAIL)}>
                            <td className="px-6 py-4 font-mono font-bold text-primary-600">IV-20231020-003</td>
                            <td className="px-6 py-4">城北分仓 (紧固件区)</td>
                            <td className="px-6 py-4 text-center">
                                <div className="w-24 mx-auto bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="bg-green-500 h-full w-full"></div>
                                </div>
                                <span className="text-[10px] text-gray-500">100%</span>
                            </td>
                            <td className="px-6 py-4 text-center font-bold text-gray-400">0</td>
                            <td className="px-6 py-4 text-gray-500">2023-10-20</td>
                            <td className="px-6 py-4 text-center"><span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold">已完成</span></td>
                            <td className="px-6 py-4 text-right"><button className="text-gray-400 hover:text-gray-600">查看</button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export const InventoryCheckDetail: React.FC<PageProps> = ({ setPage }) => {
    const [auditItems, setAuditItems] = useState([
        { id: 1, name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-M8-40', loc: 'A-01-02', system: 5200, count: 5200, status: 'matched' },
        { id: 2, name: '冲击钻 20V 无刷', sku: 'PTL-DR-20V', loc: 'B-03-12', system: 15, count: 12, status: 'mismatch' },
        { id: '3', name: '活动扳手 8寸', sku: 'HTL-WR-ADJ-08', loc: 'C-02', system: 1200, count: null, status: 'pending' },
        { id: '4', name: 'PVC排水管 DN110', sku: 'PVC-PIPE-110', loc: 'D-05', system: 45, count: null, status: 'pending' },
    ]);

    const stats = useMemo(() => {
        const total = auditItems.length;
        const counted = auditItems.filter(i => i.status !== 'pending').length;
        const mismatch = auditItems.filter(i => i.status === 'mismatch').length;
        return { total, counted, mismatch, progress: (counted / total) * 100 };
    }, [auditItems]);

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage && setPage(Page.INVENTORY_CHECK)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Icons.ArrowLeft className="w-5 h-5"/></button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            盘点单 #IV-20231027-001
                            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded border border-blue-200">进行中</span>
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">范围: 五金总仓 A区 (全盘) | 负责人: 张伟</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm">暂停盘点</button>
                    <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 flex items-center gap-2">
                        <Icons.CheckCircle2 className="w-4 h-4"/> 提交盘点结果
                    </button>
                </div>
            </div>

            {/* Progress & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 shrink-0">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                    <div className="flex justify-between items-end mb-2">
                        <span className="text-sm font-bold text-gray-500">盘点进度</span>
                        <span className="text-2xl font-black text-blue-600">{Math.round(stats.progress)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full transition-all duration-500" style={{width: `${stats.progress}%`}}></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2 text-right">{stats.counted}/{stats.total} SKU</p>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">差异项数</p>
                        <p className="text-2xl font-black text-red-500 mt-1">{stats.mismatch}</p>
                    </div>
                    <div className="p-3 bg-red-50 rounded-lg text-red-500"><Icons.AlertTriangle className="w-6 h-6"/></div>
                </div>
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase">匹配项数 (无差异)</p>
                        <p className="text-2xl font-black text-green-600 mt-1">{stats.counted - stats.mismatch}</p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg text-green-600"><Icons.Check className="w-6 h-6"/></div>
                </div>
            </div>

            {/* Audit Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <div className="relative w-80">
                        <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                        <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="扫描或输入商品条码..."/>
                    </div>
                    <div className="flex gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider self-center mr-2">显示:</span>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-bold hover:bg-gray-50 text-gray-800">全部</button>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium hover:bg-gray-50 text-gray-500">仅差异</button>
                        <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs font-medium hover:bg-gray-50 text-gray-500">未盘点</button>
                    </div>
                </div>
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 border-b border-gray-100 text-xs uppercase sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 font-semibold">商品信息</th>
                                <th className="px-6 py-4 font-semibold">货位</th>
                                <th className="px-6 py-4 text-center font-semibold">系统库存</th>
                                <th className="px-6 py-4 text-center font-semibold w-32">实盘数量</th>
                                <th className="px-6 py-4 text-center font-semibold">差异</th>
                                <th className="px-6 py-4 text-center font-semibold">状态</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {auditItems.map(item => (
                                <tr key={item.id} className={`hover:bg-gray-50 ${item.status === 'mismatch' ? 'bg-red-50/30' : ''}`}>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-900">{item.name}</div>
                                        <div className="text-xs text-gray-500 font-mono mt-0.5">{item.sku}</div>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-gray-700">{item.loc}</td>
                                    <td className="px-6 py-4 text-center font-mono text-gray-500">{item.system}</td>
                                    <td className="px-6 py-4 text-center">
                                        <input 
                                            type="number" 
                                            className={`w-24 text-center border rounded p-1.5 font-bold outline-none focus:ring-2 focus:ring-primary-500 ${
                                                item.status === 'pending' ? 'border-gray-300 bg-white' : 
                                                item.status === 'matched' ? 'border-green-300 bg-green-50 text-green-700' : 
                                                'border-red-300 bg-white text-red-600'
                                            }`}
                                            placeholder="-"
                                            defaultValue={item.count !== null ? item.count : ''}
                                        />
                                    </td>
                                    <td className={`px-6 py-4 text-center font-bold ${
                                        (item.count || 0) - item.system === 0 ? 'text-gray-300' : 'text-red-500'
                                    }`}>
                                        {item.count !== null ? (item.count - item.system > 0 ? `+${item.count - item.system}` : item.count - item.system) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        {item.status === 'matched' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-green-100 text-green-700"><Icons.Check className="w-3 h-3"/> 匹配</span>}
                                        {item.status === 'mismatch' && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-bold bg-red-100 text-red-700"><Icons.AlertTriangle className="w-3 h-3"/> 差异</span>}
                                        {item.status === 'pending' && <span className="text-xs text-gray-400">待盘点</span>}
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
