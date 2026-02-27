
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { User, Role } from '../types';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// --- TYPES & MOCK DATA ---
type MobileView = 'boss_home' | 'boss_approval' | 'boss_finance' | 'boss_inventory' | 'scanner_home' | 'scanner_work' | 'wh_inventory';

interface MobileProps { user: User; onExit: () => void; }

const SALES_DATA = [
    { d: 'M', v: 4000 }, { d: 'T', v: 3000 }, { d: 'W', v: 2000 }, { d: 'T', v: 2780 }, { d: 'F', v: 1890 }, { d: 'S', v: 2390 }, { d: 'S', v: 3490 }
];

const PENDING_APPROVALS = [
    { id: 1, type: '采购申请', title: '补充 M8 螺栓库存', user: '李采购', amount: '¥ 12,000', time: '10:30' },
    { id: 2, type: '报销', title: '10月差旅费报销', user: '张销售', amount: '¥ 850', time: '09:15' },
    { id: 3, type: '特价审批', title: '上海建工大额订单折扣', user: '王经理', amount: '95折', time: '昨天' },
];

const MOCK_INVENTORY = [
    { id: 1, name: '304不锈钢螺栓 M2', sku: '88291001', loc: 'A-01', qty: 950, status: 'normal' },
    { id: 2, name: '304不锈钢螺栓 M4', sku: '88291002', loc: 'A-02', qty: 900, status: 'normal' },
    { id: 3, name: '304不锈钢螺栓 M6', sku: '88291003', loc: 'A-03', qty: 850, status: 'low' },
    { id: 4, name: '304不锈钢螺栓 M8', sku: '88291004', loc: 'A-04', qty: 800, status: 'normal' },
    { id: 5, name: '304不锈钢螺栓 M10', sku: '88291005', loc: 'A-05', qty: 750, status: 'normal' },
    { id: 6, name: '304不锈钢螺栓 M12', sku: '88291006', loc: 'A-06', qty: 700, status: 'low' },
];

const MOCK_NOTIFICATIONS: {id: number, type: 'approval' | 'inventory' | 'order' | 'system', title: string, message: string, time: string, read: boolean}[] = [
    { id: 1, type: 'approval', title: '审批通过', message: '采购申请 #PO-20231024-01 已通过审批', time: '10分钟前', read: false },
    { id: 2, type: 'inventory', title: '库存预警', message: '商品 "M6螺栓" 库存低于安全水位', time: '30分钟前', read: false },
    { id: 3, type: 'order', title: '新订单', message: '收到新的销售订单 #SO-20231024-05', time: '1小时前', read: true },
    { id: 4, type: 'system', title: '系统维护', message: '系统将于 02:00 进行例行维护', time: '昨天', read: true },
];


// --- SHARED COMPONENTS ---

const BottomNav: React.FC<{ active: string; items: any[]; onChange: (id: string) => void }> = ({ active, items, onChange }) => (
    <div className="fixed bottom-0 left-0 right-0 bg-white/80 border-t border-gray-200/80 px-6 py-2 flex justify-between items-center z-50 backdrop-blur-lg safe-area-pb">
        {items.map(item => (
            <button key={item.id} onClick={() => onChange(item.id)} className={`flex flex-col items-center gap-1 p-2 transition-colors ${active === item.id ? 'text-blue-600' : 'text-gray-400'}`}>
                <item.icon className={`w-6 h-6`} />
                <span className="text-[10px] font-medium">{item.label}</span>
            </button>
        ))}
    </div>
);

const MobileHeader: React.FC<{ title: string; onBack?: () => void; user?: User; onLogout?: () => void; onNotificationClick?: () => void; }> = ({ title, onBack, user, onLogout, onNotificationClick }) => {
    const [showMenu, setShowMenu] = useState(false);
    return (
        <div className="bg-white/80 backdrop-blur-lg px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-30">
            <div className="flex items-center gap-3">
                {onBack && <button onClick={onBack} className="p-1 -ml-2 text-gray-600"><Icons.ArrowLeft className="w-6 h-6" /></button>}
                <h1 className="text-lg font-bold text-gray-900">{title}</h1>
            </div>
            <div className="flex items-center gap-3">
                <button onClick={onNotificationClick} className="relative p-1 text-gray-600"><Icons.Bell className="w-6 h-6" /><span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 border-2 border-white rounded-full"></span></button>
                {user && (
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)}><img alt="user avatar" src={user.avatar} className="w-8 h-8 rounded-full border"/></button>
                        {showMenu && <div onClick={onLogout} className="absolute right-0 top-full mt-2 w-32 bg-white rounded-xl shadow-lg border text-red-600 font-bold p-3 text-sm flex items-center gap-2 z-50"><Icons.LogOut className="w-4 h-4" />退出登录</div>}
                        {showMenu && <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)}></div>}
                    </div>
                )}
            </div>
        </div>
    );
};

// --- BOSS & WAREHOUSE VIEWS (Inventory is shared) ---

const InventoryReadOnly = () => (
    <div className="flex flex-col h-full bg-gray-50">
        <div className="bg-white p-4 shadow-sm z-10 border-b">
             <div className="relative"><Icons.Search className="absolute left-3.5 top-3 text-gray-400 w-5 h-5"/><input type="text" placeholder="搜索库存..." className="w-full pl-11 pr-4 py-3 bg-gray-100 rounded-xl text-sm"/></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
            {MOCK_INVENTORY.map(item => (
                <div key={item.id} className="bg-white p-4 rounded-xl shadow-sm border flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2"><span className="font-bold">{item.name}</span>{item.status === 'low' && <span className="text-[10px] bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-medium">缺货</span>}</div>
                        <p className="text-xs text-gray-500 mt-1 font-mono">SKU: {item.sku} | {item.loc}</p>
                    </div>
                    <div className="text-right"><p className="font-bold text-2xl">{item.qty}</p><p className="text-xs text-gray-400">件</p></div>
                </div>
            ))}
        </div>
    </div>
);

// --- BOSS VIEWS ---
const BossDashboard = () => (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-5 text-white shadow-lg shadow-blue-200"><p className="text-blue-100 text-xs font-medium uppercase">今日实时销售</p><h2 className="text-3xl font-black mt-1">¥ 42,580</h2><div className="h-16 -mx-2 mt-2"><ResponsiveContainer><AreaChart data={SALES_DATA}><defs><linearGradient id="c" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#fff" stopOpacity={0.3}/><stop offset="95%" stopColor="#fff" stopOpacity={0}/></linearGradient></defs><Area type="monotone" dataKey="v" stroke="#fff" strokeWidth={2} fill="url(#c)" /></AreaChart></ResponsiveContainer></div><div className="flex justify-between mt-2 text-xs text-blue-100"><span>订单: 24笔</span><span>毛利: ¥ 12,400</span></div></div>
        <div className="grid grid-cols-2 gap-3"><div className="bg-white p-4 rounded-xl shadow-sm border"><div className="flex items-center gap-2 mb-2 text-gray-500"><Icons.Wallet className="w-4 h-4" /><span className="text-xs font-bold">资金结余</span></div><p className="text-xl font-bold">¥ 1.24M</p></div><div className="bg-white p-4 rounded-xl shadow-sm border"><div className="flex items-center gap-2 mb-2 text-gray-500"><Icons.AlertTriangle className="w-4 h-4 text-orange-500" /><span className="text-xs font-bold">库存预警</span></div><p className="text-xl font-bold">12 <span className="text-xs font-normal text-gray-400">SKU</span></p></div></div>
        <div><div className="flex justify-between items-center mb-3"><h3 className="font-bold">待办审批 (3)</h3><span className="text-xs text-blue-600 font-medium">查看全部</span></div><div className="bg-white rounded-xl shadow-sm border divide-y">{PENDING_APPROVALS.map(item => (<div key={item.id} className="p-4 flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">{item.user.substring(0,1)}</div><div><p className="text-sm font-bold">{item.title}</p><p className="text-xs text-gray-500 mt-0.5">{item.type} • {item.amount}</p></div></div><button className="px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg shadow-sm">审批</button></div>))}</div></div>
    </div>
);

const BossApprovals = () => (
    <div className="p-4 space-y-4 pb-24 animate-fade-in">{PENDING_APPROVALS.map(item => (<div key={item.id} className="bg-white rounded-xl p-5 shadow-sm border"><div className="flex justify-between items-start mb-4"><span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-1 rounded">{item.type}</span><span className="text-xs text-gray-400">{item.time}</span></div><h3 className="text-lg font-bold mb-1">{item.title}</h3><p className="text-sm text-gray-500 mb-4">申请人: {item.user} | 涉及金额: <span className="font-bold">{item.amount}</span></p><div className="grid grid-cols-2 gap-3"><button className="w-full py-3 bg-white border border-gray-200 text-gray-600 rounded-lg text-sm font-bold">驳回</button><button className="w-full py-3 bg-blue-600 text-white rounded-lg text-sm font-bold shadow-md">批准</button></div></div>))}</div>
);

const BossFinance = () => (
    <div className="p-4 space-y-4 pb-24 animate-fade-in"><div className="bg-white p-4 rounded-xl shadow-sm border"><h3 className="font-bold mb-4">财务概览</h3><div className="space-y-4"><div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">本月营收</span><span className="font-bold">¥ 1,245,000</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">本月支出</span><span className="font-bold">¥ 850,000</span></div><div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><span className="text-sm text-gray-500">净利润</span><span className="font-bold text-green-600">+ ¥ 395,000</span></div></div></div></div>
);

// --- WAREHOUSE VIEWS ---

const ScannerHome = ({ onNavigate }: { onNavigate: (view: MobileView) => void }) => (
    <div className="p-6 pb-24 animate-fade-in flex flex-col h-full justify-center">
        <div className="text-center mb-8"><h2 className="text-3xl font-black text-gray-800">库存作业</h2><p className="text-gray-500 mt-1">请选择作业类型以启动扫描</p></div>
        <div className="space-y-4">
            <button onClick={() => onNavigate('scanner_work')} className="group relative w-full overflow-hidden bg-blue-600 rounded-2xl p-6 text-left shadow-lg shadow-blue-200 active:scale-95 transition-transform"><div className="absolute -right-4 -bottom-4 opacity-10"><Icons.Inbound className="w-32 h-32 text-white" /></div><div className="relative"><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white"><Icons.Inbound className="w-6 h-6" /></div><h3 className="text-xl font-bold text-white">入库扫描</h3><p className="text-blue-100 text-xs mt-1">采购收货 / 退货入库</p></div></button>
            <button onClick={() => onNavigate('scanner_work')} className="group relative w-full overflow-hidden bg-orange-500 rounded-2xl p-6 text-left shadow-lg shadow-orange-200 active:scale-95 transition-transform"><div className="absolute -right-4 -bottom-4 opacity-10"><Icons.Outbound className="w-32 h-32 text-white" /></div><div className="relative"><div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4 text-white"><Icons.Outbound className="w-6 h-6" /></div><h3 className="text-xl font-bold text-white">出库扫描</h3><p className="text-orange-100 text-xs mt-1">销售发货 / 领料出库</p></div></button>
            <button onClick={() => onNavigate('scanner_work')} className="group relative w-full overflow-hidden bg-white border-2 border-gray-200 rounded-2xl p-6 text-left active:scale-95 transition-transform"><div className="flex items-center justify-between"><h3 className="text-xl font-bold text-gray-900">库存盘点</h3><p className="text-gray-500 text-xs mt-1">周期性核对 / 抽盘</p><div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center text-gray-600"><Icons.ClipboardCheck className="w-6 h-6" /></div></div></button>
        </div>
    </div>
);

// --- GENERIC VIEWS ---
const PermissionDenied = ({ user, onExit }: { user: User, onExit: () => void}) => (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center bg-gray-50"><div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6"><Icons.Ban className="w-10 h-10 text-red-500" /></div><h2 className="text-xl font-bold">访问被拒绝</h2><p className="text-gray-500 mt-2 mb-8">{user.tenantPlan === 'basic' ? `当前订阅方案 (基础版) 不支持移动端。` : `您的账号 (${user.role}) 暂无移动端权限。`}</p><button onClick={onExit} className="w-full py-3 bg-white border rounded-xl shadow-sm">返回登录</button></div>
);

const NotificationPanel: React.FC<{role: Role, onClose: () => void}> = ({ role, onClose }) => {
    const filteredNotifications = MOCK_NOTIFICATIONS.filter(n => {
        if (role === 'admin') return true;
        if (role === 'warehouse') return n.type === 'inventory' || n.type === 'system';
        if (role === 'sales') return n.type === 'order' || n.type === 'approval';
        return false;
    });

    return (
        <div className="absolute inset-0 z-50 flex flex-col">
            <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
            <div className="bg-white rounded-t-2xl p-4 shadow-2xl animate-slide-in-up max-h-[70%] flex flex-col">
                <div className="flex justify-between items-center mb-4 flex-shrink-0"><h3 className="font-bold text-lg">消息通知</h3><button onClick={onClose} className="p-1 bg-gray-100 rounded-full"><Icons.Close className="w-5 h-5"/></button></div>
                <div className="overflow-y-auto space-y-3">
                    {filteredNotifications.length > 0 ? filteredNotifications.map(n => (
                        <div key={n.id} className={`p-3 rounded-xl flex gap-3 ${n.read ? 'bg-gray-50' : 'bg-blue-50'}`}><div className={`w-8 h-8 rounded-full flex items-center justify-center text-blue-600 ${n.read ? 'bg-gray-200' : 'bg-blue-100'}`}><Icons.Bell /></div><div><h4 className="font-bold text-sm">{n.title}</h4><p className="text-xs text-gray-600">{n.message}</p><p className="text-[10px] text-gray-400 mt-1">{n.time}</p></div></div>
                    )) : <p className='text-center text-gray-500 py-8'>暂无通知</p>}
                </div>
            </div>
        </div>
    );
};


// --- MAIN APP ---
export const MobileApp: React.FC<MobileProps> = ({ user, onExit }) => {
    const [view, setView] = useState<MobileView | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);

    useEffect(() => {
        if(user.role === 'admin' || user.role === 'sales') setView('boss_home');
        else if(user.role === 'warehouse') setView('scanner_home');
    }, [user.role]);

    if (!user.mobileAccess || user.tenantPlan === 'basic') {
        return <PermissionDenied user={user} onExit={onExit} />;
    }

    const renderContent = () => {
        if (!view) return <div className="flex-1 flex items-center justify-center"><Icons.LoaderCircle className="animate-spin text-2xl text-gray-400"/></div>;
        
        if (user.role === 'admin' || user.role === 'sales') {
            switch(view) {
                case 'boss_home': return <BossDashboard />;
                case 'boss_approval': return <BossApprovals />;
                case 'boss_finance': return <BossFinance />;
                case 'boss_inventory': return <InventoryReadOnly />;
                default: setView('boss_home'); return null;
            }
        } 
        else if (user.role === 'warehouse') {
            switch(view) {
                case 'scanner_home': return <ScannerHome onNavigate={(v) => setView(v)} />;
                case 'wh_inventory': return <InventoryReadOnly />;
                case 'scanner_work': return <div className="p-4">Scanner Work-in-progress</div>;
                default: setView('scanner_home'); return null;
            }
        } else {
             return <PermissionDenied user={user} onExit={onExit} />;
        }
    };

    const getNavItems = () => {
        if (user.role === 'admin' || user.role === 'sales') return [
            {id: 'boss_home', label: '概览', icon: Icons.Dashboard},
            {id: 'boss_approval', label: '审批', icon: Icons.CheckSquare},
            {id: 'boss_finance', label: '财务', icon: Icons.Wallet},
            {id: 'boss_inventory', label: '库存', icon: Icons.Box},
        ];
        if (user.role === 'warehouse') return [
            {id: 'scanner_home', label: '作业', icon: Icons.Scan},
            {id: 'wh_inventory', label: '库存', icon: Icons.Box},
        ];
        return [];
    };

    const getHeaderTitle = () => {
        if(view === 'boss_home') return '老板驾驶舱';
        if(view === 'boss_approval') return '审批中心';
        if(view === 'boss_finance') return '财务报表';
        if(view === 'boss_inventory' || view === 'wh_inventory') return '库存查询';
        if(view === 'scanner_home') return '作业中心';
        return '移动端';
    };

    return (
        <div className="w-full h-full bg-gray-50 flex flex-col font-sans relative">
            <MobileHeader title={getHeaderTitle()} user={user} onLogout={onExit} onNotificationClick={() => setShowNotifications(true)} />
            <div className="flex-1 overflow-y-auto bg-gray-50">
                {renderContent()}
            </div>
            {getNavItems().length > 0 && <BottomNav active={view || ''} items={getNavItems()} onChange={(v) => setView(v as MobileView)} />}
            {showNotifications && <NotificationPanel role={user.role} onClose={() => setShowNotifications(false)} />}
        </div>
    );
};
