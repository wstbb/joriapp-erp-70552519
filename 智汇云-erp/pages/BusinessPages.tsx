
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage?: (page: Page) => void;
}

// ----------------------------------------------------------------------
// HELPER COMPONENTS
// ----------------------------------------------------------------------

const PrinterSettingsModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [printers, setPrinters] = useState([
        { id: 'p1', name: '总经办 - HP LaserJet Pro', ip: '192.168.1.101', type: 'A4 文档', status: 'online', isDefault: true },
        { id: 'p2', name: '一号仓 - Zebra ZT410', ip: '192.168.1.205', type: '100x150 标签', status: 'online', isDefault: false },
        { id: 'p3', name: '财务室 - Epson LQ-630K', ip: '192.168.1.110', type: '多联单据', status: 'offline', isDefault: false },
    ]);
    const [isAdding, setIsAdding] = useState(false);
    const [newPrinter, setNewPrinter] = useState({ name: '', ip: '', type: 'A4 文档' });

    const handleAdd = () => {
        if (newPrinter.name && newPrinter.ip) {
            setPrinters([...printers, { ...newPrinter, id: `p${Date.now()}`, status: 'online', isDefault: false }]);
            setNewPrinter({ name: '', ip: '', type: 'A4 文档' });
            setIsAdding(false);
        }
    };

    const handleDelete = (id: string) => {
        setPrinters(printers.filter(p => p.id !== id));
    };

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-white w-full max-w-2xl rounded-xl flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Icons.Settings className="w-5 h-5 text-gray-500"/> 打印机配置 (局域网安全方案)
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">管理局域网内关联的打印设备及用途</p>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-5 h-5"/></button>
                </div>
                
                <div className="p-6 flex-1 overflow-y-auto max-h-[60vh]">
                    {/* Cloud Print Agent Status */}
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-100 rounded-xl flex items-start gap-4">
                        <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0">
                            <Icons.Activity className="w-6 h-6 animate-pulse"/>
                        </div>
                        <div>
                            <h4 className="font-bold text-blue-900 text-sm">本地打印代理 (Cloud Print Agent)</h4>
                            <p className="text-xs text-blue-700 mt-1 leading-relaxed">
                                当前系统运行在 AWS 云端，通过 <b>WebSocket (API Gateway)</b> 与您局域网内的代理程序保持安全长连接。
                                云端指令将加密发送至代理，实现无需公网 IP 的安全局域网打印。
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                                <span className="flex items-center gap-1 text-[10px] font-bold text-green-600 bg-green-100 px-2 py-0.5 rounded">
                                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> 代理已连接: 192.168.1.50 (杭州分公司)
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-3">
                        {printers.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-sm transition-all group bg-white">
                                <div className="flex items-center gap-4">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${p.status === 'online' ? 'bg-green-50 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                                        <Icons.Print className="w-6 h-6"/>
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h4 className="font-bold text-gray-900">{p.name}</h4>
                                            {p.isDefault && <span className="text-[10px] bg-primary-50 text-primary-600 px-1.5 py-0.5 rounded border border-primary-100">默认</span>}
                                        </div>
                                        <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                                            <span className="font-mono bg-gray-100 px-1.5 rounded">{p.ip}</span>
                                            <span>•</span>
                                            <span>{p.type}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="text-right">
                                        <div className={`text-xs font-bold flex items-center justify-end gap-1 ${p.status === 'online' ? 'text-green-600' : 'text-gray-400'}`}>
                                            <div className={`w-2 h-2 rounded-full ${p.status === 'online' ? 'bg-green-500 animate-pulse' : 'bg-gray-300'}`}></div>
                                            {p.status === 'online' ? '在线' : '离线'}
                                        </div>
                                        <button className="text-[10px] text-primary-600 hover:underline mt-1">测试打印</button>
                                    </div>
                                    <button onClick={() => handleDelete(p.id)} className="p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                        <Icons.Delete className="w-4 h-4"/>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {isAdding ? (
                        <div className="mt-4 p-4 border-2 border-dashed border-primary-200 rounded-xl bg-primary-50/30 animate-fade-in">
                            <h4 className="text-sm font-bold text-gray-900 mb-3">添加新设备</h4>
                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">设备名称</label>
                                    <input value={newPrinter.name} onChange={e => setNewPrinter({...newPrinter, name: e.target.value})} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500" placeholder="例如: 仓库2号打包机"/>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 mb-1">IP 地址</label>
                                    <input value={newPrinter.ip} onChange={e => setNewPrinter({...newPrinter, ip: e.target.value})} className="w-full text-sm border border-gray-300 rounded-lg px-3 py-2 outline-none focus:border-primary-500" placeholder="192.168.x.x"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">用途类型</label>
                                    <div className="flex gap-2">
                                        {['A4 文档', '100x150 标签', '80mm 小票', '多联单据'].map(t => (
                                            <button key={t} onClick={() => setNewPrinter({...newPrinter, type: t})} className={`px-3 py-1.5 text-xs rounded border transition-colors ${newPrinter.type === t ? 'bg-primary-600 text-white border-primary-600' : 'bg-white border-gray-200 text-gray-600 hover:border-primary-300'}`}>
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs font-bold text-gray-500 hover:bg-gray-100 rounded">取消</button>
                                <button onClick={handleAdd} className="px-4 py-1.5 text-xs font-bold bg-primary-600 text-white rounded shadow-sm hover:bg-primary-700">确认添加</button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsAdding(true)} className="w-full mt-4 py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-bold text-gray-400 hover:text-primary-600 hover:border-primary-300 hover:bg-primary-50 transition-all flex items-center justify-center gap-2">
                            <Icons.Plus className="w-4 h-4"/> 关联新打印机
                        </button>
                    )}
                </div>
                <div className="bg-gray-50 px-6 py-3 border-t border-gray-200 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-gray-300 text-gray-700 font-bold rounded-lg text-sm hover:bg-gray-50 shadow-sm">完成</button>
                </div>
            </div>
        </div>
    );
};

const PrintPreviewModal: React.FC<{ job: any; onClose: () => void }> = ({ job, onClose }) => {
    if (!job) return null;

    // Mock details based on job type for visualization
    const items = [
        { name: '304不锈钢六角螺栓 M8', spec: 'M8*50', qty: 1000, unit: '个', price: 0.85, total: 850.00 },
        { name: '博世手电钻 GSR 120-LI', spec: '12V 双电版', qty: 5, unit: '台', price: 499.00, total: 2495.00 },
        { name: 'PVC排水管 DN110', spec: '4米/根', qty: 20, unit: '根', price: 28.50, total: 570.00 },
        { name: '工业级活动扳手', spec: '10寸', qty: 10, unit: '把', price: 35.00, total: 350.00 },
    ];
    
    const totalAmount = items.reduce((acc, item) => acc + item.total, 0);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div className="bg-gray-200 w-full max-w-4xl h-[90vh] rounded-xl flex flex-col overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                {/* Modal Header */}
                <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                            <Icons.Print className="w-5 h-5 text-gray-500"/> 打印预览
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">正在预览: {job.docNo} ({job.type})</p>
                    </div>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">取消</button>
                        <button onClick={() => { alert('打印指令已发送到打印机'); onClose(); }} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-colors flex items-center gap-2">
                            <Icons.Print className="w-4 h-4"/> 立即打印
                        </button>
                    </div>
                </div>

                {/* Preview Viewport */}
                <div className="flex-1 overflow-auto bg-gray-100 p-8 flex justify-center custom-scrollbar">
                    {/* A4 Paper Simulation */}
                    <div className="bg-white w-[210mm] min-h-[297mm] shadow-lg p-[15mm] text-gray-900 flex flex-col relative shrink-0 transition-transform origin-top hover:scale-[1.02] duration-300">
                        
                        {/* Print Header */}
                        <div className="border-b-2 border-gray-800 pb-4 mb-6">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-black text-white flex items-center justify-center font-black text-xl rounded">五</div>
                                    <div>
                                        <h1 className="text-2xl font-black tracking-tight">智汇五金机电有限公司</h1>
                                        <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Smart Hardware ERP System</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <h2 className="text-3xl font-black text-gray-900 tracking-wider mb-1">{job.type}</h2>
                                    <p className="font-mono text-sm font-bold text-gray-600">NO: {job.docNo}</p>
                                </div>
                            </div>
                            <div className="flex justify-between mt-6 text-sm">
                                <div className="space-y-1">
                                    <p><span className="text-gray-500 w-16 inline-block">往来单位:</span> <span className="font-bold border-b border-gray-300 min-w-[200px] inline-block">{job.target}</span></p>
                                    <p><span className="text-gray-500 w-16 inline-block">联系人员:</span> <span className="font-medium">张经理 (138****8888)</span></p>
                                    <p><span className="text-gray-500 w-16 inline-block">业务日期:</span> <span className="font-medium">2023-10-27</span></p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p><span className="text-gray-500">打印时间:</span> {new Date().toLocaleString()}</p>
                                    <p><span className="text-gray-500">操作员:</span> 管理员</p>
                                    <p><span className="text-gray-500">页码:</span> 1 / {job.pages}</p>
                                </div>
                            </div>
                        </div>

                        {/* Print Content Table */}
                        <div className="flex-1">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="border-b-2 border-black">
                                        <th className="py-2 text-left w-10">序号</th>
                                        <th className="py-2 text-left">商品名称</th>
                                        <th className="py-2 text-left">规格型号</th>
                                        <th className="py-2 text-center w-16">单位</th>
                                        <th className="py-2 text-right w-24">数量</th>
                                        <th className="py-2 text-right w-24">单价</th>
                                        <th className="py-2 text-right w-28">金额</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {items.map((item, i) => (
                                        <tr key={i} className="border-b border-gray-200">
                                            <td className="py-3 text-gray-500">{i + 1}</td>
                                            <td className="py-3 font-bold">{item.name}</td>
                                            <td className="py-3 text-gray-600">{item.spec}</td>
                                            <td className="py-3 text-center">{item.unit}</td>
                                            <td className="py-3 text-right font-mono">{item.qty}</td>
                                            <td className="py-3 text-right font-mono">¥ {item.price.toFixed(2)}</td>
                                            <td className="py-3 text-right font-mono font-bold">¥ {item.total.toFixed(2)}</td>
                                        </tr>
                                    ))}
                                    {/* Empty rows filler */}
                                    {[...Array(6)].map((_, i) => (
                                        <tr key={`empty-${i}`} className="border-b border-gray-100 h-10">
                                            <td colSpan={7}></td>
                                        </tr>
                                    ))}
                                </tbody>
                                <tfoot>
                                    <tr className="border-t-2 border-black bg-gray-50">
                                        <td colSpan={4} className="py-3 pl-2 font-bold uppercase">Total Amount (RMB)</td>
                                        <td colSpan={3} className="py-3 text-right pr-2 text-lg font-black">¥ {totalAmount.toFixed(2)}</td>
                                    </tr>
                                    <tr>
                                        <td colSpan={7} className="py-2 text-right italic text-gray-500">大写: 肆仟贰佰陆拾伍元整</td>
                                    </tr>
                                </tfoot>
                            </table>
                        </div>

                        {/* Print Footer */}
                        <div className="mt-auto pt-8 border-t border-gray-200">
                            <div className="grid grid-cols-4 gap-8 text-sm">
                                <div>
                                    <p className="text-gray-500 mb-8">制单人:</p>
                                    <p className="font-bold">王志强</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-8">审核人:</p>
                                    <p className="font-bold">_____________</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-8">仓库发货:</p>
                                    <p className="font-bold">_____________</p>
                                </div>
                                <div>
                                    <p className="text-gray-500 mb-8">客户签收 (盖章):</p>
                                    <p className="font-bold">_____________</p>
                                </div>
                            </div>
                            <div className="mt-6 text-center text-[10px] text-gray-400">
                                <p>白联: 存根  |  红联: 客户  |  黄联: 财务  |  蓝联: 仓库</p>
                                <p className="mt-1">地址: 杭州市西湖区五金机电城 A区 101-102  电话: 0571-88888888</p>
                            </div>
                        </div>

                        {/* Stamp Watermark */}
                        <div className="absolute bottom-32 right-32 opacity-20 pointer-events-none rotate-[-15deg]">
                            <div className="w-32 h-32 border-4 border-red-600 rounded-full flex items-center justify-center p-2">
                                <div className="w-full h-full border border-red-600 rounded-full flex items-center justify-center text-center text-red-600 font-bold text-xs leading-none">
                                    <div className="scale-75">
                                        <p>智汇五金机电</p>
                                        <p className="text-xl my-1">业务专用章</p>
                                        <p>2023-10-27</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// QUOTATION MODULE
// ----------------------------------------------------------------------

export const Quotations: React.FC<PageProps> = ({ setPage }) => {
    // Quick Access Cards Data
    const cards = [
        { id: 'pending', label: '待处理报价', value: '5', icon: Icons.FileText, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
        { id: 'accepted', label: '本月已成交', value: '¥ 245K', icon: Icons.CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
        { id: 'rate', label: '报价转化率', value: '68%', icon: Icons.TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200' },
        { id: 'expired', label: '即将过期', value: '3', icon: Icons.Clock, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
    ];

    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">报价单管理</h2>
                    <p className="text-sm text-gray-500 mt-1">管理发出的报价，追踪客户意向与转化率。</p>
                </div>
                <button onClick={() => setPage && setPage(Page.QUOTATION_DETAIL)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95">
                    <Icons.Plus className="w-5 h-5"/> 新建报价
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

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200">
                        <tr>
                            <th className="px-6 py-4">报价单号</th>
                            <th className="px-6 py-4">客户名称</th>
                            <th className="px-6 py-4 text-right">报价金额</th>
                            <th className="px-6 py-4">有效期</th>
                            <th className="px-6 py-4 text-center">状态</th>
                            <th className="px-6 py-4 text-right">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[
                            { id: 'QT-20231027-01', client: '浙江建工集团', amount: 158000, date: '2023-11-10', status: 'pending' },
                            { id: 'QT-20231026-05', client: '博世中国', amount: 42000, date: '2023-11-01', status: 'accepted' },
                            { id: 'QT-20231025-02', client: '宏达装饰', amount: 8500, date: '2023-10-30', status: 'expired' },
                        ].map((q, i) => (
                            <tr key={i} className="hover:bg-gray-50 cursor-pointer" onClick={() => setPage && setPage(Page.QUOTATION_DETAIL)}>
                                <td className="px-6 py-4 font-mono font-bold text-primary-600">{q.id}</td>
                                <td className="px-6 py-4 font-bold text-gray-900">{q.client}</td>
                                <td className="px-6 py-4 text-right font-mono">¥ {q.amount.toLocaleString()}</td>
                                <td className="px-6 py-4 text-gray-500">{q.date}</td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                                        q.status === 'accepted' ? 'bg-green-100 text-green-700' :
                                        q.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-500'
                                    }`}>
                                        {q.status === 'accepted' ? '已接受' : q.status === 'pending' ? '跟进中' : '已过期'}
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

export const QuotationDetail: React.FC<PageProps> = ({ setPage }) => {
    const [showStockModal, setShowStockModal] = useState(false);

    // Logic to handle conversion
    const handleConvertToSalesOrder = () => {
        // Mock stock check
        // Assuming "PVC排水管 DN110" is low on stock (logic from previous conversations)
        // We simulate a shortage here to trigger the modal
        setShowStockModal(true);
    };

    return (
        <div className="flex flex-col h-full animate-fade-in max-w-6xl mx-auto pb-10">
            {/* Navigation */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <button onClick={() => setPage && setPage(Page.QUOTATIONS)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5"/>
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                        报价单 QT-20231027-01
                        <span className="text-sm bg-blue-50 text-blue-700 px-3 py-0.5 rounded-full border border-blue-200">跟进中</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">创建日期: 2023-10-27 | 有效期至: 2023-11-10</p>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Icons.Print className="w-4 h-4"/> 打印
                    </button>
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <Icons.Mail className="w-4 h-4"/> 发送邮件
                    </button>
                    <button onClick={handleConvertToSalesOrder} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center gap-2">
                        <Icons.CheckCircle2 className="w-4 h-4"/> 转为销售订单
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Content: Quotation Document */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Customer Header */}
                        <div className="p-6 border-b border-gray-200 bg-gray-50">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">客户信息 (Bill To)</p>
                                    <h3 className="text-lg font-bold text-gray-900">浙江建工集团有限公司</h3>
                                    <p className="text-sm text-gray-600 mt-1">张经理 (采购部)</p>
                                    <p className="text-sm text-gray-600">杭州市西湖区文三路 123 号</p>
                                    <p className="text-sm text-gray-600">138-1234-5678</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-20 h-20 bg-gray-200 rounded-lg mb-2 ml-auto flex items-center justify-center text-gray-400">Logo</div>
                                </div>
                            </div>
                        </div>

                        {/* Items Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-white border-b border-gray-200 text-gray-500 font-medium">
                                    <tr>
                                        <th className="px-6 py-3 w-16">#</th>
                                        <th className="px-6 py-3">商品名称 & 规格</th>
                                        <th className="px-6 py-3 text-right">单价</th>
                                        <th className="px-6 py-3 text-center">数量</th>
                                        <th className="px-6 py-3 text-right">折扣</th>
                                        <th className="px-6 py-3 text-right">金额</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    <tr>
                                        <td className="px-6 py-4 text-gray-400">1</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">304不锈钢六角螺栓 M8</div>
                                            <div className="text-xs text-gray-500">SKU: BOLT-304-001 | 规格: M8*50mm</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">¥ 0.35</td>
                                        <td className="px-6 py-4 text-center">50,000</td>
                                        <td className="px-6 py-4 text-right text-gray-400">-</td>
                                        <td className="px-6 py-4 text-right font-medium">¥ 17,500.00</td>
                                    </tr>
                                    <tr>
                                        <td className="px-6 py-4 text-gray-400">2</td>
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900">PVC排水管 DN110</div>
                                            <div className="text-xs text-gray-500">SKU: PVC-PIPE-110 | 4米/根</div>
                                        </td>
                                        <td className="px-6 py-4 text-right">¥ 28.50</td>
                                        <td className="px-6 py-4 text-center">200</td>
                                        <td className="px-6 py-4 text-right text-green-600">95折</td>
                                        <td className="px-6 py-4 text-right font-medium">¥ 5,415.00</td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Totals */}
                        <div className="p-6 border-t border-gray-200 bg-gray-50/50">
                            <div className="flex flex-col items-end space-y-2">
                                <div className="flex justify-between w-64 text-sm">
                                    <span className="text-gray-600">商品总额:</span>
                                    <span className="font-medium text-gray-900">¥ 22,915.00</span>
                                </div>
                                <div className="flex justify-between w-64 text-sm">
                                    <span className="text-gray-600">税额 (13%):</span>
                                    <span className="font-medium text-gray-900">¥ 2,978.95</span>
                                </div>
                                <div className="flex justify-between w-64 text-sm">
                                    <span className="text-gray-600">运费:</span>
                                    <span className="font-medium text-gray-900">¥ 500.00</span>
                                </div>
                                <div className="w-64 h-px bg-gray-300 my-2"></div>
                                <div className="flex justify-between w-64 text-lg">
                                    <span className="font-bold text-gray-900">总计:</span>
                                    <span className="font-black text-primary-600">¥ 26,393.95</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">备注条款</h3>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                            <li>报价有效期为 15 天，过期请重新询价。</li>
                            <li>以上价格含 13% 增值税专票。</li>
                            <li>交货期：合同签订后 3 个工作日内发货。</li>
                            <li>付款方式：预付 30%，发货前付清尾款。</li>
                        </ul>
                    </div>
                </div>

                {/* Sidebar: Meta Info */}
                <div className="space-y-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">销售负责人</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <Icons.User className="w-5 h-5 text-gray-500"/>
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">王志强</p>
                                <p className="text-xs text-gray-500">销售一部 | 139-0000-0000</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="font-bold text-gray-900 mb-4">历史报价记录</h3>
                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-gray-700">QT-20230915-02</p>
                                    <p className="text-xs text-gray-500">2023-09-15</p>
                                </div>
                                <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">已过期</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <div>
                                    <p className="font-medium text-gray-700">QT-20230810-01</p>
                                    <p className="text-xs text-gray-500">2023-08-10</p>
                                </div>
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded">已成交</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Stock Shortage Warning Modal */}
            {showStockModal && (
                <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-gray-100 bg-red-50 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-red-700 flex items-center gap-2">
                                <Icons.Warning className="w-5 h-5"/> 库存不足预警
                            </h3>
                            <button onClick={() => setShowStockModal(false)} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-gray-600 mb-4">
                                以下商品库存不足，无法满足当前订单需求。请选择处理方式：
                            </p>
                            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-6">
                                <div className="flex justify-between items-center text-sm mb-2">
                                    <span className="font-bold text-gray-900">PVC排水管 DN110</span>
                                    <span className="text-xs text-gray-500">SKU: PVC-PIPE-110</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">当前库存: <b className="text-gray-900">45</b></span>
                                    <span className="text-gray-500">订单需求: <b className="text-red-600">200</b></span>
                                    <span className="text-red-600 font-bold">缺口: -155</span>
                                </div>
                            </div>
                            
                            <div className="space-y-3">
                                <button 
                                    onClick={() => { setShowStockModal(false); setPage && setPage(Page.PURCHASE_ORDER_ENTRY); }}
                                    className="w-full py-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between px-4 hover:bg-blue-100 transition-colors group"
                                >
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-blue-800">生成采购单 (补货)</div>
                                        <div className="text-xs text-blue-600">跳转至采购界面，针对缺口进行补货</div>
                                    </div>
                                    <Icons.ArrowRight className="w-4 h-4 text-blue-400 group-hover:text-blue-600"/>
                                </button>
                                
                                <button 
                                    onClick={() => { setShowStockModal(false); setPage && setPage(Page.SALES_ORDER_ENTRY); }}
                                    className="w-full py-3 bg-white border border-gray-200 rounded-xl flex items-center justify-between px-4 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="text-left">
                                        <div className="text-sm font-bold text-gray-800">强制生成销售单 (缺货销售)</div>
                                        <div className="text-xs text-gray-500">生成待发货订单，等待后续补货入库</div>
                                    </div>
                                    <Icons.ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500"/>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ----------------------------------------------------------------------
// PARTNER MODULE (RE-ARCHITECTED)
// ----------------------------------------------------------------------

export const SupplierCustomer: React.FC<PageProps> = ({ setPage }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'customer' | 'supplier'>('all');
    const [filterRisk, setFilterRisk] = useState(false);

    // Mock Partner Data with Enhanced Fields
    const partners = [
        { 
            id: '1', name: '上海建工集团', type: 'customer', contact: '李工', phone: '13900139000', location: '上海浦东', 
            creditScore: 85, balance: 120000, overdue: 0, overdueDays: 0, lastTx: '2023-10-27', 
            tags: ['VVIP', '核心客户'], status: 'good'
        },
        { 
            id: '2', name: '杭州西湖装修公司', type: 'customer', contact: '赵老板', phone: '13700137000', location: '杭州西湖', 
            creditScore: 45, balance: 85000, overdue: 12000, overdueDays: 35, lastTx: '2023-09-15', 
            tags: ['需催款', '风险'], status: 'risk' 
        },
        { 
            id: '3', name: '金固五金制品有限公司', type: 'supplier', contact: '张经理', phone: '13800138000', location: '浙江嘉兴', 
            creditScore: 98, balance: -25000, overdue: 0, overdueDays: 0, lastTx: '2023-10-26', 
            tags: ['优质供应商', '月结'], status: 'good', paymentDue: '2023-11-25'
        },
        { 
            id: '4', name: '宏达建材市场', type: 'customer', contact: '孙总', phone: '15800001111', location: '江苏苏州', 
            creditScore: 60, balance: 32000, overdue: 5000, overdueDays: 7, lastTx: '2023-10-20', 
            tags: ['关注'], status: 'warning'
        },
        { 
            id: '5', name: '博世电动工具(中国)', type: 'supplier', contact: '王总监', phone: '021-66886688', location: '上海', 
            creditScore: 100, balance: -15000, overdue: 0, overdueDays: 0, lastTx: '2023-10-25', 
            tags: ['现结'], status: 'good', paymentDue: '2023-10-30', urgentPay: true
        },
    ];

    const filteredPartners = partners.filter(p => {
        if (filterRisk && p.status === 'good') return false;
        if (activeTab === 'customer' && p.type !== 'customer') return false;
        if (activeTab === 'supplier' && p.type !== 'supplier') return false;
        return true;
    });

    const highRiskCustomers = partners.filter(p => p.type === 'customer' && (p.status === 'risk' || p.overdue > 0));
    const urgentSuppliers = partners.filter(p => p.type === 'supplier' && (p.urgentPay || (p.paymentDue && new Date(p.paymentDue) <= new Date('2023-11-05'))));

    const getScoreColor = (score: number) => {
        if (score >= 90) return 'bg-green-500';
        if (score >= 60) return 'bg-blue-500';
        if (score >= 40) return 'bg-orange-500';
        return 'bg-red-500';
    };

    return (
        <div className="animate-fade-in flex flex-col h-[calc(100vh-6rem)] space-y-6">
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">往来单位管理</h2>
                    <p className="text-sm text-gray-500 mt-1">管理客户与供应商档案，监控信用风险与资金往来。</p>
                </div>
                <button onClick={() => setPage && setPage(Page.PARTNER_DETAIL)} className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95">
                    <Icons.Plus className="w-5 h-5"/> 新建单位
                </button>
            </div>

            {/* Insight Dashboard Blocks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 shrink-0">
                {/* Left: Customer Risk Watch */}
                <div className="bg-white rounded-xl border border-red-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-red-100 bg-red-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-red-800 flex items-center gap-2">
                            <Icons.AlertTriangle className="w-5 h-5"/> 客户信用风险预警
                        </h3>
                        <span className="text-xs font-bold bg-white text-red-600 px-2 py-1 rounded border border-red-100">{highRiskCustomers.length} 户需关注</span>
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                        {highRiskCustomers.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 hover:bg-red-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-xs">
                                        {c.name.substring(0,1)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{c.name}</p>
                                        <p className="text-xs text-red-500 font-medium">逾期 {c.overdueDays} 天</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-red-600">¥ {c.overdue.toLocaleString()}</p>
                                    <button className="text-[10px] text-gray-400 group-hover:text-primary-600 hover:underline">发送催款提醒</button>
                                </div>
                            </div>
                        ))}
                        {highRiskCustomers.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">暂无高风险客户</div>}
                    </div>
                </div>

                {/* Right: Supplier Payment Schedule */}
                <div className="bg-white rounded-xl border border-orange-100 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-5 py-4 border-b border-orange-100 bg-orange-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-orange-800 flex items-center gap-2">
                            <Icons.Calendar className="w-5 h-5"/> 供应商付款急需
                        </h3>
                        <span className="text-xs font-bold bg-white text-orange-600 px-2 py-1 rounded border border-orange-100">{urgentSuppliers.length} 笔待付</span>
                    </div>
                    <div className="flex-1 p-2 space-y-2">
                        {urgentSuppliers.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 hover:bg-orange-50 rounded-lg transition-colors cursor-pointer group">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-xs">
                                        {s.name.substring(0,1)}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-gray-900">{s.name}</p>
                                        <p className="text-xs text-orange-500 font-medium">应付日: {s.paymentDue}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-gray-900">¥ {Math.abs(s.balance).toLocaleString()}</p>
                                    <button className="text-[10px] text-gray-400 group-hover:text-primary-600 hover:underline">安排付款</button>
                                </div>
                            </div>
                        ))}
                        {urgentSuppliers.length === 0 && <div className="p-4 text-center text-gray-400 text-sm">暂无急需付款项</div>}
                    </div>
                </div>
            </div>

            {/* Main List Section */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {/* Filter Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            <button onClick={() => setActiveTab('all')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'all' ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>全部</button>
                            <button onClick={() => setActiveTab('customer')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'customer' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}>客户</button>
                            <button onClick={() => setActiveTab('supplier')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === 'supplier' ? 'bg-blue-50 text-blue-700' : 'text-gray-500 hover:text-gray-700'}`}>供应商</button>
                        </div>
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
                            <input type="checkbox" checked={filterRisk} onChange={e => setFilterRisk(e.target.checked)} className="rounded border-gray-300 text-red-600 focus:ring-red-500"/>
                            仅显示风险/关注对象
                        </label>
                    </div>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64 bg-white" placeholder="搜索单位名称、联系人..."/>
                    </div>
                </div>

                {/* Enhanced Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-white text-gray-500 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10 border-b border-gray-100 shadow-sm">
                            <tr>
                                <th className="px-6 py-4">单位信息</th>
                                <th className="px-6 py-4">信用与标签</th>
                                <th className="px-6 py-4 text-right">财务状态 (欠款/待付)</th>
                                <th className="px-6 py-4 text-center">近期行为</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredPartners.map(p => (
                                <tr key={p.id} onClick={() => setPage && setPage(Page.PARTNER_DETAIL)} className="hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${p.type === 'customer' ? 'bg-primary-100 text-primary-700' : 'bg-blue-100 text-blue-700'}`}>
                                                {p.name.substring(0,1)}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{p.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                                                    <Icons.User className="w-3 h-3"/> {p.contact} <span className="mx-1">•</span> {p.phone}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                                    <div className={`h-full rounded-full ${getScoreColor(p.creditScore)}`} style={{width: `${p.creditScore}%`}}></div>
                                                </div>
                                                <span className="text-xs font-mono font-bold text-gray-500">{p.creditScore}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {p.tags.map(t => <span key={t} className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-[10px] rounded border border-gray-200">{t}</span>)}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className={`text-base font-black font-mono ${p.balance > 0 ? (p.overdue > 0 ? 'text-red-600' : 'text-primary-600') : 'text-green-600'}`}>
                                                {p.balance > 0 ? '+' : ''}¥ {Math.abs(p.balance).toLocaleString()}
                                            </span>
                                            {p.overdue > 0 && (
                                                <span className="text-[10px] font-bold text-white bg-red-500 px-1.5 py-0.5 rounded">逾期 ¥{p.overdue.toLocaleString()}</span>
                                            )}
                                            {p.paymentDue && (
                                                <span className="text-[10px] text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded">应付日 {p.paymentDue}</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs text-gray-500">最近交易</span>
                                            <span className="text-xs font-bold text-gray-900">{p.lastTx}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="text-gray-400 hover:text-primary-600 p-2"><Icons.MoreHorizontal className="w-4 h-4"/></button>
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

export const PartnerDetail: React.FC<PageProps> = ({ setPage }) => {
    const [detailTab, setDetailTab] = useState<'history' | 'products' | 'statement'>('statement');
    const [productSearch, setProductSearch] = useState('');

    // Mock Data for Statement
    const unpaidInvoices = [
        { id: 'INV-20231025-01', date: '2023-10-25', amount: 5000.00, overdue: true },
        { id: 'INV-20231020-03', date: '2023-10-20', amount: 3500.00, overdue: true },
        { id: 'INV-20231015-08', date: '2023-10-15', amount: 8500.00, overdue: true },
    ];

    // Mock Data for Products
    const relatedProducts = [
        { id: 1, name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304', price: 0.35, stock: 5200 },
        { id: 2, name: '镀锌平垫 M8', sku: 'WASH-M8', price: 0.05, stock: 12000 },
        { id: 3, name: '外六角扳手 12mm', sku: 'TOOL-WR-12', price: 5.50, stock: 45 },
        { id: 4, name: 'M8 防松螺母', sku: 'NUT-LOCK-M8', price: 0.12, stock: 3500 },
    ];

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-10 flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-4 mb-6 shrink-0">
                <button onClick={() => setPage && setPage(Page.SUPPLIERS_CUSTOMERS)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5"/>
                </button>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xl font-bold shadow-md">金</div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-gray-900">金固五金制品有限公司</h1>
                            <div className="flex text-yellow-400 text-sm">
                                <Icons.Star className="w-4 h-4 fill-current"/>
                                <Icons.Star className="w-4 h-4 fill-current"/>
                                <Icons.Star className="w-4 h-4 fill-current"/>
                                <Icons.Star className="w-4 h-4 fill-current"/>
                                <Icons.Star className="w-4 h-4 fill-current"/>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs">
                            <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded border border-blue-200">供应商</span>
                            <span className="text-gray-500">编码: SUP-001</span>
                            <span className="px-2 py-0.5 bg-purple-50 text-purple-700 rounded border border-purple-100">账期: 月结 30天</span>
                            <span className="px-2 py-0.5 bg-green-50 text-green-700 rounded border border-green-100">额度: ¥ 500,000</span>
                        </div>
                    </div>
                </div>
                <div className="ml-auto flex gap-3">
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm">
                        编辑资料
                    </button>
                    <button 
                        onClick={() => setPage && setPage(Page.PURCHASE_ORDER_ENTRY)}
                        className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center gap-2"
                    >
                        <Icons.Plus className="w-4 h-4"/> 新建采购
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden">
                {/* Left Column: Info */}
                <div className="space-y-6 overflow-y-auto pr-1">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">基本信息</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">联系人</span>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                    张经理 <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">主联系人</span>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">联系电话</span>
                                <div className="font-medium text-gray-900 flex items-center gap-2">
                                    138-0013-8000 <Icons.PhoneCall className="w-3 h-3 text-primary-600 cursor-pointer"/>
                                </div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">电子邮箱</span>
                                <div className="font-medium text-gray-900">sales@jingu-hardware.com</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">办公地址</span>
                                <div className="font-medium text-gray-900">浙江省嘉兴市海盐县标准件工业园 A区 8栋</div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-4 border-b border-gray-100 pb-2">财务信息</h3>
                        <div className="space-y-4 text-sm">
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">开户银行</span>
                                <div className="font-medium text-gray-900">中国工商银行嘉兴分行</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">银行账号</span>
                                <div className="font-medium text-gray-900 font-mono">6222 **** **** 8888</div>
                            </div>
                            <div>
                                <span className="text-gray-500 block text-xs mb-1">税号</span>
                                <div className="font-medium text-gray-900 font-mono">91330400MA2BCDEFGH</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Tabs */}
                <div className="lg:col-span-2 flex flex-col overflow-hidden">
                    {/* Tabs Content */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                        <div className="flex border-b border-gray-200 bg-gray-50 px-2">
                            <button onClick={() => setDetailTab('statement')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${detailTab === 'statement' ? 'border-primary-600 text-primary-600 bg-white -mb-px rounded-t-lg' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>对账单 (Statement)</button>
                            <button onClick={() => setDetailTab('history')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${detailTab === 'history' ? 'border-primary-600 text-primary-600 bg-white -mb-px rounded-t-lg' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>交易流水</button>
                            <button onClick={() => setDetailTab('products')} className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${detailTab === 'products' ? 'border-primary-600 text-primary-600 bg-white -mb-px rounded-t-lg' : 'border-transparent text-gray-600 hover:text-gray-900'}`}>关联商品</button>
                        </div>
                        
                        <div className="flex-1 overflow-auto p-0">
                            {detailTab === 'statement' && (
                                <div className="flex flex-col h-full">
                                    <div className="p-6 bg-gray-50 border-b border-gray-200 grid grid-cols-3 gap-6">
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">当前应付总额</p>
                                            <p className="text-2xl font-black text-gray-900">¥ 17,000.00</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-500 uppercase font-bold mb-1">其中已逾期</p>
                                            <p className="text-2xl font-black text-red-600">¥ 17,000.00</p>
                                        </div>
                                        <div className="flex items-center justify-end">
                                            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">生成对账单</button>
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h4 className="text-sm font-bold text-gray-900 mb-3 ml-2">未结清款项列表</h4>
                                        <div className="space-y-2">
                                            {unpaidInvoices.map(inv => (
                                                <div key={inv.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-center gap-3">
                                                        <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"/>
                                                        <div>
                                                            <div className="font-bold text-gray-900 text-sm">{inv.id}</div>
                                                            <div className="text-xs text-gray-500">{inv.date}</div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="font-bold text-red-600">¥ {inv.amount.toLocaleString()}</div>
                                                        {inv.overdue && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded">已逾期</span>}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-between items-center px-2">
                                            <span className="text-sm text-gray-500">已选 0 笔</span>
                                            <button className="text-sm font-bold text-primary-600 hover:underline">核销选中项</button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {detailTab === 'history' && (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-white text-gray-500 border-b border-gray-100 font-medium">
                                        <tr>
                                            <th className="px-6 py-3">流水号</th>
                                            <th className="px-6 py-3">类型</th>
                                            <th className="px-6 py-3">日期</th>
                                            <th className="px-6 py-3 text-right">金额 (借/贷)</th>
                                            <th className="px-6 py-3 text-center">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {[
                                            { id: 'TRX-1024', type: '采购入库', date: '2023-10-24', amount: -12000, status: '完成' },
                                            { id: 'PAY-1020', type: '付款单', date: '2023-10-20', amount: 5000, status: '完成' },
                                            { id: 'TRX-1015', type: '采购入库', date: '2023-10-15', amount: -8500, status: '完成' },
                                        ].map((row, i) => (
                                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 font-mono font-medium text-gray-600">{row.id}</td>
                                                <td className="px-6 py-4 text-gray-900">{row.type}</td>
                                                <td className="px-6 py-4 text-gray-500">{row.date}</td>
                                                <td className={`px-6 py-4 text-right font-mono font-bold ${row.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {row.amount > 0 ? '+' : ''}{row.amount.toLocaleString()}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-xs font-bold">{row.status}</span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}

                            {detailTab === 'products' && (
                                <div className="flex flex-col h-full">
                                    <div className="p-4 bg-gray-50 border-b border-gray-200">
                                        <div className="relative">
                                            <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                                            <input 
                                                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-primary-500" 
                                                placeholder="搜索关联商品..."
                                                value={productSearch}
                                                onChange={e => setProductSearch(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-auto">
                                        <table className="w-full text-left text-sm">
                                            <thead className="bg-white text-gray-500 border-b border-gray-100 font-medium">
                                                <tr>
                                                    <th className="px-6 py-3">商品名称</th>
                                                    <th className="px-6 py-3">SKU</th>
                                                    <th className="px-6 py-3 text-right">上次进价</th>
                                                    <th className="px-6 py-3 text-center">当前库存</th>
                                                    <th className="px-6 py-3 text-center">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {relatedProducts.filter(p => p.name.includes(productSearch) || p.sku.includes(productSearch)).map((prod, i) => (
                                                    <tr key={i} className="hover:bg-gray-50">
                                                        <td className="px-6 py-4 font-bold text-gray-900">{prod.name}</td>
                                                        <td className="px-6 py-4 text-gray-500 font-mono">{prod.sku}</td>
                                                        <td className="px-6 py-4 text-right font-mono">¥ {prod.price.toFixed(2)}</td>
                                                        <td className="px-6 py-4 text-center font-mono">{prod.stock}</td>
                                                        <td className="px-6 py-4 text-center">
                                                            <button 
                                                                onClick={() => setPage && setPage(Page.PURCHASE_ORDER_ENTRY)}
                                                                className="text-xs bg-primary-50 text-primary-600 px-2 py-1 rounded border border-primary-200 hover:bg-primary-100 transition-colors"
                                                            >
                                                                补货
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// PRINT CENTER (RESTORED & ENHANCED)
// ----------------------------------------------------------------------

export const PrintCenter: React.FC<PageProps> = ({ setPage }) => {
    const [activeTab, setActiveTab] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [previewJob, setPreviewJob] = useState<any>(null);
    const [showSettings, setShowSettings] = useState(false);

    const printers = [
        { id: 'p1', name: '总经办 - HP LaserJet', status: 'ready', queue: 0, ink: 85, type: 'A4 文档' },
        { id: 'p2', name: '一号仓 - Zebra ZT410', status: 'warning', queue: 2, ink: 15, type: '100x150 标签' },
        { id: 'p3', name: '财务室 - Epson LQ-630', status: 'offline', queue: 0, ink: 0, type: '多联单据' },
    ];

    const jobs = [
        { id: 'PJ-001', type: '销售出库单', docNo: 'DO-20231027-001', target: '上海建工集团', operator: '王志强', time: '10:30', status: 'printed', pages: 1, category: 'sales' },
        { id: 'PJ-002', type: '销售订单', docNo: 'SO-20231027-089', target: '上海建工集团', operator: '张伟', time: '10:25', status: 'pending', pages: 2, category: 'sales' },
        { id: 'PJ-003', type: '采购入库单', docNo: 'PO-20231026-005', target: '博世电动工具', operator: '李华', time: '09:15', status: 'printed', pages: 1, category: 'inventory' },
        { id: 'PJ-004', type: '财务对账单', docNo: 'ST-202310-001', target: '杭州西湖装修', operator: '赵财务', time: '昨天', status: 'error', pages: 3, category: 'finance' },
    ];

    const filteredJobs = jobs.filter(j => {
        if (activeTab !== 'all' && j.category !== activeTab) return false;
        if (filterStatus !== 'all' && j.status !== filterStatus) return false;
        return true;
    });

    const getPrinterStatusColor = (status: string) => {
        switch(status) {
            case 'ready': return 'bg-green-500';
            case 'warning': return 'bg-orange-500';
            case 'offline': return 'bg-gray-400';
            default: return 'bg-gray-400';
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
            {previewJob && <PrintPreviewModal job={previewJob} onClose={() => setPreviewJob(null)} />}
            {showSettings && <PrinterSettingsModal onClose={() => setShowSettings(false)} />}

            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">单据打印中心</h2>
                    <p className="text-sm text-gray-500 mt-1">集中管理所有业务单据的打印任务，监控打印机状态。</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                        <Icons.Refresh className="w-4 h-4"/> 刷新状态
                    </button>
                    <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors">
                        <Icons.Settings className="w-4 h-4"/> 打印设置
                    </button>
                </div>
            </div>

            {/* Printer Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {printers.map(p => (
                    <div key={p.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all relative overflow-hidden">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${getPrinterStatusColor(p.status)} shadow-sm`}></div>
                                <div>
                                    <h4 className="font-bold text-gray-900 text-sm">{p.name}</h4>
                                    <p className="text-xs text-gray-500">{p.type}</p>
                                </div>
                            </div>
                            <div className={`p-2 rounded-lg ${p.status === 'offline' ? 'bg-gray-100 text-gray-400' : 'bg-blue-50 text-blue-600'}`}>
                                <Icons.Print className="w-5 h-5"/>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs font-medium text-gray-600">
                                <span>耗材余量</span>
                                <span className={p.ink < 20 ? 'text-red-600' : 'text-green-600'}>{p.ink}%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className={`h-full rounded-full ${p.ink < 20 ? 'bg-red-500' : 'bg-green-500'}`} style={{width: `${p.ink}%`}}></div>
                            </div>
                            <div className="flex justify-between items-center mt-2 pt-2 border-t border-gray-100">
                                <span className="text-xs text-gray-400">当前队列</span>
                                <span className="text-xs font-bold text-gray-900 bg-gray-100 px-2 py-0.5 rounded">{p.queue} 任务</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Area */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-gray-200 flex flex-col xl:flex-row gap-4 justify-between bg-gray-50/50">
                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                        <div className="flex bg-white p-1 rounded-lg border border-gray-200 shadow-sm">
                            {[
                                { id: 'all', label: '全部单据' },
                                { id: 'sales', label: '销售类' },
                                { id: 'inventory', label: '库存类' },
                                { id: 'finance', label: '财务类' }
                            ].map(tab => (
                                <button 
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === tab.id ? 'bg-primary-50 text-primary-700' : 'text-gray-500 hover:text-gray-700'}`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="h-6 w-px bg-gray-300 hidden sm:block"></div>
                        <div className="relative w-full sm:w-64">
                            <Icons.Search className="absolute left-3 top-2.5 text-gray-400 w-4 h-4"/>
                            <input className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white" placeholder="搜索单号、关联业务..."/>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <div className="flex items-center bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-600 shadow-sm cursor-pointer hover:bg-gray-50">
                            <Icons.Calendar className="w-4 h-4 mr-2 text-gray-400"/>
                            <span>最近 7 天</span>
                        </div>
                        <select 
                            className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-700 outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer shadow-sm"
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                        >
                            <option value="all">所有状态</option>
                            <option value="pending">待打印</option>
                            <option value="printed">已打印</option>
                            <option value="error">打印失败</option>
                        </select>
                    </div>
                </div>

                {/* Table */}
                <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 font-bold uppercase text-xs border-b border-gray-200 sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4">任务编号</th>
                                <th className="px-6 py-4">单据类型</th>
                                <th className="px-6 py-4">关联单号</th>
                                <th className="px-6 py-4">往来单位</th>
                                <th className="px-6 py-4">发起人 / 时间</th>
                                <th className="px-6 py-4 text-center">页数</th>
                                <th className="px-6 py-4 text-center">状态</th>
                                <th className="px-6 py-4 text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredJobs.map((job) => (
                                <tr key={job.id} className="hover:bg-gray-50 group transition-colors">
                                    <td className="px-6 py-4 font-mono text-gray-500">{job.id}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex px-2 py-0.5 rounded text-xs font-medium border ${
                                            job.category === 'sales' ? 'bg-blue-50 text-blue-700 border-blue-100' :
                                            job.category === 'inventory' ? 'bg-orange-50 text-orange-700 border-orange-100' :
                                            'bg-purple-50 text-purple-700 border-purple-100'
                                        }`}>
                                            {job.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-primary-600 font-bold">{job.docNo}</td>
                                    <td className="px-6 py-4 text-gray-700">{job.target}</td>
                                    <td className="px-6 py-4 text-gray-600">
                                        <div className="font-medium">{job.operator}</div>
                                        <div className="text-xs text-gray-400">{job.time}</div>
                                    </td>
                                    <td className="px-6 py-4 text-center font-mono">{job.pages}</td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                            job.status === 'printed' ? 'bg-green-100 text-green-700' :
                                            job.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                                            'bg-red-100 text-red-700'
                                        }`}>
                                            {job.status === 'printed' ? '已打印' : job.status === 'pending' ? '待打印' : '打印失败'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2">
                                            <button 
                                                onClick={() => setPreviewJob(job)}
                                                className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 text-xs font-bold rounded hover:bg-gray-50 flex items-center gap-1 shadow-sm transition-all active:scale-95"
                                            >
                                                <Icons.Eye className="w-3 h-3"/> 预览
                                            </button>
                                            <button className="px-3 py-1.5 bg-primary-600 text-white text-xs font-bold rounded hover:bg-primary-700 shadow-sm flex items-center gap-1 transition-all active:scale-95">
                                                <Icons.Print className="w-3 h-3"/> 打印
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {filteredJobs.length === 0 && (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400 min-h-[300px]">
                            <Icons.Print className="w-12 h-12 opacity-20 mb-3"/>
                            <p>暂无符合条件的打印任务</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
