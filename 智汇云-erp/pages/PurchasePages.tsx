
import React, { useState, useMemo } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend, ComposedChart, Line, ReferenceLine, Cell
} from 'recharts';
import { Icons } from '../components/Icons';
import { Page, User } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
    user?: User;
}

// --- Enhanced Data Models ---

interface SupplierOption {
    id: string;
    name: string;
    price: number;
    moq: number; // Minimum Order Quantity
    leadTime: number; // Days
    score: number; // 0-100 score based on past performance
    isRecommended: boolean;
}

interface ReplenishmentItem {
    id: number;
    sku: string;
    name: string;
    category: string;
    img: string;
    
    // Stock Status
    currentStock: number;
    incomingStock: number; // POs placed but not received
    committedStock: number; // Sales Orders locked but not shipped
    
    // Velocity & Metrics
    dailyVelocity: number; // Avg sales per day
    stockCoverage: number; // Days of Inventory Remaining
    stockoutDate: string; // Estimated date
    
    // Recommendation
    unit: string;
    reason: 'stockout_risk' | 'safety_level' | 'promotion' | 'seasonality';
    
    // Suppliers
    suppliers: SupplierOption[];
    
    // Chart Data (Mocked for visual)
    historyData: { date: string; value: number }[];
    projectionData: { date: string; stockLevel: number; safetyLine: number }[];
}

// --- Mock Data Generator ---

const generateMockItem = (id: number, name: string, sku: string, velocity: number, stock: number, incoming: number): ReplenishmentItem => {
    const today = new Date();
    const history = [];
    const projection = [];
    
    // Generate 30 days history sales
    for(let i=30; i>0; i--) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        history.push({
            date: `${d.getMonth()+1}/${d.getDate()}`,
            value: Math.max(0, Math.round(velocity + (Math.random() * velocity * 0.5 - velocity * 0.25)))
        });
    }

    // Generate 30 days projection stock level
    let currentLevel = stock;
    const safetyStock = velocity * 15; // 15 days safety
    for(let i=0; i<30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        // Simulate sales deduction
        currentLevel = Math.max(0, currentLevel - velocity);
        // Simulate incoming (simple logic: arrives in 5 days if any)
        if(i === 5 && incoming > 0) currentLevel += incoming;
        
        projection.push({
            date: `${d.getMonth()+1}/${d.getDate()}`,
            stockLevel: Math.round(currentLevel),
            safetyLine: Math.round(safetyStock)
        });
    }

    const coverage = stock / velocity;
    const stockoutDayOffset = Math.floor(coverage);
    const stockoutDateObj = new Date(today);
    stockoutDateObj.setDate(stockoutDateObj.getDate() + stockoutDayOffset);

    return {
        id, sku, name, img: 'https://images.unsplash.com/photo-1581235720704-06d3acfcb36f?w=100&h=100&fit=crop',
        category: '五金工具',
        currentStock: stock,
        incomingStock: incoming,
        committedStock: Math.round(velocity * 2), // Mock committed
        dailyVelocity: velocity,
        stockCoverage: coverage,
        stockoutDate: coverage < 30 ? `${stockoutDateObj.getMonth()+1}月${stockoutDateObj.getDate()}日` : '充足',
        unit: '个',
        reason: coverage < 7 ? 'stockout_risk' : coverage < 15 ? 'safety_level' : 'seasonality',
        suppliers: [
            { id: 'S1', name: '金固五金制品厂', price: 12.5, moq: 100, leadTime: 3, score: 95, isRecommended: true },
            { id: 'S2', name: '义乌小商品批发', price: 11.8, moq: 500, leadTime: 7, score: 88, isRecommended: false }
        ],
        historyData: history,
        projectionData: projection
    };
};

const MOCK_ITEMS: ReplenishmentItem[] = [
    generateMockItem(1, '304不锈钢六角螺栓 M8', 'BOLT-304-M8', 120, 500, 0),
    generateMockItem(2, '博世手电钻 GSR 12V', 'DRILL-GSR-12', 5, 12, 10),
    generateMockItem(3, 'PVC排水管 DN110', 'PVC-DN110', 45, 80, 0),
    generateMockItem(4, '工业级美工刀', 'CUTTER-PRO', 15, 300, 0),
    generateMockItem(5, '防锈漆 18L', 'PAINT-RUST', 8, 30, 20),
];

export const PurchasePlan: React.FC<PageProps> = ({ setPage, user }) => {
    const [selectedId, setSelectedId] = useState<number>(MOCK_ITEMS[0].id);
    const [strategy, setStrategy] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
    const [searchTerm, setSearchTerm] = useState('');

    const activeItem = MOCK_ITEMS.find(i => i.id === selectedId) || MOCK_ITEMS[0];

    // Strategy Parameters
    const strategyParams = {
        conservative: { days: 60, safetyFactor: 1.5, label: '保守 (60天)' },
        balanced: { days: 45, safetyFactor: 1.2, label: '平衡 (45天)' },
        aggressive: { days: 30, safetyFactor: 1.0, label: '激进 (30天)' }
    };

    // Recalculate suggested Qty based on strategy formula
    // Logic: (Daily Velocity * Target Days) + Safety Buffer - (Current + Incoming - Committed)
    const currentSuggestedQty = useMemo(() => {
        const { days, safetyFactor } = strategyParams[strategy];
        const targetStock = activeItem.dailyVelocity * days * safetyFactor;
        const netStock = activeItem.currentStock + activeItem.incomingStock - activeItem.committedStock;
        const qty = Math.max(0, Math.round(targetStock - netStock));
        return qty;
    }, [activeItem, strategy]);

    const handleCreateOrder = () => {
        // In a real app, this would dispatch an action or pass state.
        // Here we simulate the effect.
        const supplier = activeItem.suppliers.find(s => s.isRecommended)?.name || activeItem.suppliers[0].name;
        alert(`已为您创建针对 [${supplier}] 的采购草稿。\n\n包含商品：${activeItem.name}\n数量：${currentSuggestedQty} ${activeItem.unit}\n\n正在跳转...`);
        setPage(Page.PURCHASE_ORDER_ENTRY);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in bg-gray-50/50">
            {/* 1. Top Control Bar */}
            <div className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        智能补货中心
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">AI Pilot V2.0</span>
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">基于 <span className="font-bold text-gray-700">销售速率</span> 与 <span className="font-bold text-gray-700">交货周期</span> 的动态库存平衡计算</p>
                </div>
                <div className="flex gap-4">
                    <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
                        <button onClick={() => setStrategy('conservative')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${strategy === 'conservative' ? 'bg-white text-green-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>保守 (60天)</button>
                        <button onClick={() => setStrategy('balanced')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${strategy === 'balanced' ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>平衡 (45天)</button>
                        <button onClick={() => setStrategy('aggressive')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${strategy === 'aggressive' ? 'bg-white text-purple-700 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}>激进 (30天)</button>
                    </div>
                    <button 
                        onClick={handleCreateOrder}
                        className="px-5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-bold shadow-md flex items-center gap-2 transition-transform active:scale-95"
                    >
                        <Icons.ShoppingCart className="w-4 h-4"/> 生成采购单
                    </button>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* 2. Left Panel: Replenishment List */}
                <div className="w-[420px] bg-white border-r border-gray-200 flex flex-col z-10 shadow-sm">
                    <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                        <div className="relative">
                            <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                            <input 
                                type="text" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="搜索 SKU 或名称..." 
                                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div className="flex justify-between items-center mt-3 text-xs text-gray-500">
                            <span>待处理: <b className="text-gray-900">{MOCK_ITEMS.length}</b> SKU</span>
                            <span className="flex items-center gap-1 cursor-pointer hover:text-primary-600"><Icons.Filter className="w-3 h-3"/> 筛选</span>
                        </div>
                    </div>
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        {MOCK_ITEMS.map(item => (
                            <div 
                                key={item.id}
                                onClick={() => setSelectedId(item.id)}
                                className={`p-4 border-b border-gray-100 cursor-pointer transition-all hover:bg-gray-50 relative ${selectedId === item.id ? 'bg-blue-50/60 border-l-4 border-l-primary-500' : 'border-l-4 border-l-transparent'}`}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h4 className={`font-bold text-sm ${selectedId === item.id ? 'text-primary-900' : 'text-gray-800'}`}>{item.name}</h4>
                                        <p className="text-xs text-gray-400 font-mono mt-0.5">{item.sku}</p>
                                    </div>
                                    {item.stockCoverage < 7 && (
                                        <span className="bg-red-100 text-red-600 text-[10px] px-2 py-0.5 rounded font-bold animate-pulse">急缺</span>
                                    )}
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <div className="flex gap-4">
                                        <div>
                                            <p className="text-gray-400">现有</p>
                                            <p className="font-bold font-mono text-gray-700">{item.currentStock}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-400">可售天数</p>
                                            <p className={`font-bold font-mono ${item.stockCoverage < 7 ? 'text-red-500' : 'text-gray-700'}`}>{item.stockCoverage.toFixed(1)} 天</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-gray-400">建议补货</p>
                                        {/* Show recalculated suggested qty here too for consistency, or keep static mock if complex */}
                                        <p className="font-bold text-lg text-primary-600">
                                            {/* Dynamic calculation for list view is complex without memoizing all, simplifying to selected logic or keeping mock base */}
                                            {/* For simplicity in this demo, let's just show a base value, but the main view updates correctly */}
                                            {selectedId === item.id ? currentSuggestedQty : '...'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 3. Right Panel: Deep Analysis & Decision */}
                <div className="flex-1 overflow-y-auto bg-gray-50 p-6">
                    <div className="max-w-5xl mx-auto space-y-6">
                        
                        {/* KPI Summary for Item */}
                        <div className="grid grid-cols-4 gap-4">
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">日均销量 (Velocity)</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-gray-900">{activeItem.dailyVelocity}</span>
                                    <span className="text-xs text-gray-500 mb-1">{activeItem.unit}/天</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">预计断货日期</p>
                                <div className="flex items-end gap-2">
                                    <span className={`text-2xl font-black ${activeItem.stockCoverage < 7 ? 'text-red-600' : 'text-gray-900'}`}>{activeItem.stockoutDate}</span>
                                    {activeItem.stockCoverage < 7 && <Icons.AlertTriangle className="w-5 h-5 text-red-500 mb-1"/>}
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">在途库存 (Incoming)</p>
                                <div className="flex items-end gap-2">
                                    <span className="text-2xl font-black text-blue-600">{activeItem.incomingStock}</span>
                                    <span className="text-xs text-gray-500 mb-1">{activeItem.unit}</span>
                                </div>
                            </div>
                            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                                <p className="text-xs font-bold text-gray-400 uppercase mb-1">缺货风险等级</p>
                                <div className="w-full bg-gray-100 h-2 rounded-full mt-2 overflow-hidden">
                                    <div 
                                        className={`h-full rounded-full ${activeItem.stockCoverage < 7 ? 'bg-red-500' : activeItem.stockCoverage < 15 ? 'bg-orange-500' : 'bg-green-500'}`} 
                                        style={{width: `${Math.min(100, (30/activeItem.stockCoverage)*30)}%`}}
                                    ></div>
                                </div>
                                <p className="text-xs text-right mt-1 font-bold text-gray-500">
                                    {activeItem.stockCoverage < 7 ? '极高风险' : activeItem.stockCoverage < 15 ? '中等风险' : '安全'}
                                </p>
                            </div>
                        </div>

                        {/* Inventory Projection Chart */}
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <div className="flex justify-between items-center mb-6">
                                <h3 className="text-lg font-bold text-gray-900">库存燃尽与补货预测 (Burn-down Chart)</h3>
                                <div className="flex items-center gap-4 text-xs">
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm"></span> 安全警戒线</span>
                                    <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-full"></span> 预计库存结余</span>
                                </div>
                            </div>
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <ComposedChart data={activeItem.projectionData} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                        <Tooltip 
                                            contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                            labelStyle={{color: '#64748b', fontSize: '12px', marginBottom: '4px'}}
                                        />
                                        <ReferenceLine y={0} stroke="#cbd5e1" />
                                        <Area type="monotone" dataKey="stockLevel" stroke="#3b82f6" strokeWidth={3} fill="url(#colorStock)" fillOpacity={0.1} />
                                        <Line type="step" dataKey="safetyLine" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                                        <defs>
                                            <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                    </ComposedChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Calculation & Supplier Selection */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Calculation Logic */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Calculator className="w-5 h-5 text-gray-400"/> 建议值计算公式
                                </h3>
                                <div className="space-y-4 text-sm">
                                    <div className={`flex justify-between items-center p-3 rounded-lg border ${
                                        strategy === 'conservative' ? 'bg-green-50 border-green-200' : 
                                        strategy === 'aggressive' ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'
                                    }`}>
                                        <span className="text-gray-600">
                                            目标备货天数: <span className="font-bold">{strategyParams[strategy].label}</span>
                                        </span>
                                        <span className="font-bold text-gray-900">{strategyParams[strategy].days} 天</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                                        <span className="text-gray-500">(-) 现有库存</span>
                                        <span className="font-mono text-gray-900">{activeItem.currentStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                                        <span className="text-gray-500">(-) 在途库存</span>
                                        <span className="font-mono text-gray-900">{activeItem.incomingStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-dashed border-gray-200 pb-2">
                                        <span className="text-gray-500">(+) 已锁定/占用</span>
                                        <span className="font-mono text-gray-900">{activeItem.committedStock}</span>
                                    </div>
                                    <div className="flex justify-between items-center pt-2">
                                        <span className="font-bold text-primary-700">建议补货量</span>
                                        <span className="font-black text-2xl text-primary-600">{currentSuggestedQty} <span className="text-sm font-normal text-gray-500">{activeItem.unit}</span></span>
                                    </div>
                                    <p className="text-xs text-gray-400 mt-2">* 计算公式: (日均销量 x 目标天数 x 安全系数) - (现有 + 在途 - 锁定)</p>
                                </div>
                            </div>

                            {/* Supplier Selection */}
                            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Icons.Truck className="w-5 h-5 text-gray-400"/> 供应商优选
                                </h3>
                                <div className="space-y-3">
                                    {activeItem.suppliers.map(supplier => (
                                        <div key={supplier.id} className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${supplier.isRecommended ? 'border-primary-500 bg-primary-50/30' : 'border-gray-100 hover:border-gray-200'}`}>
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-bold text-gray-900">{supplier.name}</span>
                                                        {supplier.isRecommended && <span className="text-[10px] bg-primary-600 text-white px-1.5 py-0.5 rounded">AI推荐</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1 space-x-3">
                                                        <span>起订量: {supplier.moq}</span>
                                                        <span>交期: {supplier.leadTime}天</span>
                                                        <span>评分: {supplier.score}</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="block font-bold text-lg text-gray-900">¥ {supplier.price}</span>
                                                    <input type="radio" name="supplier" defaultChecked={supplier.isRecommended} className="mt-1"/>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};
