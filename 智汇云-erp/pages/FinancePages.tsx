
import React, { useState, useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend, ComposedChart, Line, Area, ReferenceLine
} from 'recharts';
import { Icons } from '../components/Icons';
import { Page, User } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
    user?: User;
}

// --- Types & Interfaces ---

interface FinancialTarget {
    revenue: number;
    profit: number;
    expenseLimit: number;
}

interface Transaction {
    id: string;
    date: string;
    entity: string;
    type: string;
    category: string;
    amount: number; // Negative for expense, positive for income
    operator: string;
    status: string;
    flow: 'in' | 'out';
    relatedId?: string; // New field for linking
}

interface CostCategory {
    id: string;
    name: string;
    budget: number;
    lastMonth: number;
    icon: any;
    color: string;
}

// --- Mock Data Constants ---

const INITIAL_TARGETS: FinancialTarget = {
    revenue: 800000,
    profit: 250000,
    expenseLimit: 500000
};

const COST_CATEGORIES_CONFIG: CostCategory[] = [
    { id: 'c1', name: '采购成本', budget: 300000, lastMonth: 270000, icon: Icons.ShoppingCart, color: '#3b82f6' },
    { id: 'c2', name: '人力薪酬', budget: 85000, lastMonth: 82000, icon: Icons.Users, color: '#10b981' },
    { id: 'c3', name: '物流运输', budget: 20000, lastMonth: 18000, icon: Icons.Truck, color: '#f59e0b' },
    { id: 'c4', name: '房租水电', budget: 15000, lastMonth: 15000, icon: Icons.Building, color: '#6366f1' },
    { id: 'c5', name: '餐饮差旅', budget: 10000, lastMonth: 5000, icon: Icons.Archive, color: '#ec4899' },
    { id: 'c6', name: '商务宴请', budget: 8000, lastMonth: 4000, icon: Icons.Briefcase, color: '#8b5cf6' },
];

const INITIAL_TRANSACTIONS: Transaction[] = [
    { id: 'TRX-1027-01', date: '2023-10-27 10:30', entity: '上海建工集团', type: '销售回款', category: '主营业务收入', amount: 50000.00, operator: '张出纳', status: '已入账', flow: 'in', relatedId: 'SO-20231027-089' },
    { id: 'TRX-1026-05', date: '2023-10-26 16:15', entity: '顺丰速运', type: '物流支出', category: '物流运输', amount: -2450.00, operator: '李财务', status: '已支付', flow: 'out', relatedId: 'DO-20231026-050' },
    { id: 'TRX-1026-02', date: '2023-10-26 09:45', entity: '老四川火锅', type: '商务餐饮', category: '商务宴请', amount: -1280.00, operator: '王经理', status: '已支付', flow: 'out' },
    { id: 'TRX-1025-11', date: '2023-10-25 14:20', entity: '高铁管家', type: '差旅费', category: '餐饮差旅', amount: -650.00, operator: '赵业务', status: '已报销', flow: 'out' },
    { id: 'TRX-1025-03', date: '2023-10-25 11:00', entity: '园区物业', type: '房租水电', category: '房租水电', amount: -12000.00, operator: '李财务', status: '审批中', flow: 'out' },
    { id: 'TRX-1024-09', date: '2023-10-24 15:30', entity: '社保局', type: '社保缴纳', category: '人力薪酬', amount: -15000.00, operator: '李财务', status: '已支付', flow: 'out' },
    { id: 'TRX-1024-05', date: '2023-10-24 10:00', entity: '金固五金', type: '采购付款', category: '采购成本', amount: -28000.00, operator: '李财务', status: '已支付', flow: 'out', relatedId: 'PO-20231024-001' },
];

const MONTHLY_TREND_DATA = [
    { name: '8月', income: 680, expense: 420, profit: 260, target: 650 },
    { name: '9月', income: 720, expense: 450, profit: 270, target: 700 },
    { name: '10月', income: 620, expense: 410, profit: 210, target: 800 },
];

export const FinancialReports: React.FC<PageProps> = ({ setPage, user }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [targets, setTargets] = useState<FinancialTarget>(INITIAL_TARGETS);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [isEditingTargets, setIsEditingTargets] = useState(false);
  const [isRecordingExpense, setIsRecordingExpense] = useState(false);
  const [transFilter, setTransFilter] = useState('all');

  const handleTabChange = (tab: string) => {
      if (tab === 'cost' && user?.tenantPlan !== 'enterprise') {
          alert('成本管控模块仅向企业版客户开放，包含预算预警与详细成本分析。');
          return;
      }
      setActiveTab(tab);
  };

  const handleSetBudget = () => {
      if (user?.tenantPlan !== 'enterprise') {
          alert('预算设定功能仅向企业版客户开放。');
          return;
      }
      setIsEditingTargets(true);
  };

  // --- Dynamic Calculation ---
  const costBreakdown = useMemo(() => {
      const breakdown = COST_CATEGORIES_CONFIG.map(cat => ({...cat, amount: 0}));
      
      transactions.forEach(t => {
          if (t.flow === 'out') {
              const catIndex = breakdown.findIndex(c => c.name === t.category);
              if (catIndex > -1) {
                  breakdown[catIndex].amount += Math.abs(t.amount);
              }
          }
      });
      // Mock Data Base values
      breakdown.forEach(b => {
          if(b.name === '采购成本') b.amount += 250000;
          if(b.name === '人力薪酬') b.amount += 70000;
          if(b.name === '物流运输') b.amount += 20000;
      });
      
      return breakdown;
  }, [transactions]);

  const currentTotalExpense = costBreakdown.reduce((acc, curr) => acc + curr.amount, 0);
  const currentTotalIncome = 620000 + transactions.filter(t => t.flow === 'in').reduce((acc, curr) => acc + curr.amount, 0) - 50000;

  // --- Components ---

  const TargetProgressCard = ({ title, current, target, colorClass, icon: Icon, type = 'more_is_better' }: any) => {
      // ... (Keep existing TargetProgressCard)
      const percentage = Math.min(100, Math.round((current / target) * 100));
      const isExceeded = current > target;
      
      let progressColor = 'bg-blue-600';
      let textColor = 'text-gray-900';
      
      if (type === 'more_is_better') {
          progressColor = percentage >= 100 ? 'bg-green-500' : 'bg-blue-600';
          textColor = percentage >= 100 ? 'text-green-600' : 'text-blue-600';
      } else {
          progressColor = isExceeded ? 'bg-red-500' : 'bg-green-500';
          textColor = isExceeded ? 'text-red-600' : 'text-green-600';
      }

      return (
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">{title}</p>
                      <h3 className="text-2xl font-black text-gray-900">¥ {current.toLocaleString()}</h3>
                  </div>
                  <div className={`p-2.5 rounded-lg ${colorClass}`}>
                      <Icon className="w-5 h-5"/>
                  </div>
              </div>
              
              <div className="space-y-2">
                  <div className="flex justify-between text-xs font-medium">
                      <span className="text-gray-500">目标: ¥ {target.toLocaleString()}</span>
                      <span className={textColor}>{percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${progressColor}`} style={{ width: `${percentage}%` }}></div>
                  </div>
                  <div className="flex justify-between items-center mt-1">
                      <p className="text-[10px] text-gray-400">
                          {type === 'more_is_better' 
                            ? (isExceeded ? '已超额完成 🎉' : `缺口: ¥ ${(target - current).toLocaleString()}`) 
                            : (isExceeded ? '⚠️ 已超预算' : `剩余预算: ¥ ${(Math.max(0, target - current)).toLocaleString()}`)
                          }
                      </p>
                  </div>
              </div>
          </div>
      );
  };

  const RecordExpenseModal = () => {
      const [formData, setFormData] = useState({
          type: 'out',
          category: '商务宴请',
          amount: '',
          entity: '',
          date: new Date().toISOString().slice(0, 10),
          note: '',
          relatedType: 'none', // none, order, customer
          relatedId: ''
      });

      const handleSubmit = () => {
          if(!formData.amount || !formData.entity) return alert('请填写完整信息');
          
          const newTx: Transaction = {
              id: `TRX-${Date.now().toString().slice(-6)}`,
              date: `${formData.date} ${new Date().toLocaleTimeString().slice(0,5)}`,
              entity: formData.entity,
              type: formData.category === '物流运输' ? '物流支出' : formData.category === '人力薪酬' ? '工资发放' : '费用支出',
              category: formData.category,
              amount: -Number(formData.amount),
              operator: '当前用户',
              status: '已支付',
              flow: 'out',
              relatedId: formData.relatedId
          };

          setTransactions([newTx, ...transactions]);
          setIsRecordingExpense(false);
      };

      return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                        <Icons.FileEdit className="w-5 h-5 text-primary-600"/> 记一笔 (费用录入)
                    </h3>
                    <button onClick={() => setIsRecordingExpense(false)} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-5 h-5"/></button>
                </div>
                <div className="p-6 space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">支出科目</label>
                            <select 
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.category}
                                onChange={e => setFormData({...formData, category: e.target.value})}
                            >
                                {COST_CATEGORIES_CONFIG.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">发生日期</label>
                            <input 
                                type="date" 
                                className="w-full px-3 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                value={formData.date}
                                onChange={e => setFormData({...formData, date: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">支出金额</label>
                        <div className="relative">
                            <span className="absolute left-3 top-2.5 text-gray-500 font-bold">¥</span>
                            <input 
                                type="number" 
                                className="w-full pl-8 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono font-bold text-red-600 text-lg"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={e => setFormData({...formData, amount: e.target.value})}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">往来单位/个人</label>
                        <input 
                            type="text" 
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                            placeholder="例如: 顺丰速运、房东、员工张三..."
                            value={formData.entity}
                            onChange={e => setFormData({...formData, entity: e.target.value})}
                        />
                    </div>
                    
                    {/* Enhanced Related Section */}
                    <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-2">关联业务 (可选)</label>
                        <div className="flex gap-3 mb-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="relatedType" checked={formData.relatedType === 'none'} onChange={() => setFormData({...formData, relatedType: 'none', relatedId: ''})}/>
                                <span className="text-sm text-gray-700">无关联</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="relatedType" checked={formData.relatedType === 'order'} onChange={() => setFormData({...formData, relatedType: 'order', relatedId: ''})}/>
                                <span className="text-sm text-gray-700">关联订单</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="relatedType" checked={formData.relatedType === 'customer'} onChange={() => setFormData({...formData, relatedType: 'customer', relatedId: ''})}/>
                                <span className="text-sm text-gray-700">关联客户</span>
                            </label>
                        </div>
                        
                        {formData.relatedType === 'order' && (
                            <input 
                                type="text" 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"
                                placeholder="输入 SO/PO 单号 (例如: SO-20231027...)"
                                value={formData.relatedId}
                                onChange={e => setFormData({...formData, relatedId: e.target.value})}
                            />
                        )}
                        {formData.relatedType === 'customer' && (
                            <select 
                                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm outline-none"
                                value={formData.relatedId}
                                onChange={e => setFormData({...formData, relatedId: e.target.value})}
                            >
                                <option value="">选择客户...</option>
                                <option value="上海建工集团">上海建工集团</option>
                                <option value="博世中国">博世中国</option>
                                <option value="杭州西湖装修">杭州西湖装修</option>
                            </select>
                        )}
                    </div>

                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">备注说明</label>
                        <textarea 
                            className="w-full px-4 py-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none h-20 resize-none"
                            placeholder="填写费用详情..."
                            value={formData.note}
                            onChange={e => setFormData({...formData, note: e.target.value})}
                        ></textarea>
                    </div>
                </div>
                <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button onClick={() => setIsRecordingExpense(false)} className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 font-bold">取消</button>
                    <button onClick={handleSubmit} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700 transition-colors">确认入账</button>
                </div>
            </div>
        </div>
      );
  };

  const OverviewView = () => (
    <div className="space-y-6 animate-fade-in">
       {/* 1. Target Setting & KPI Cards */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
           <TargetProgressCard 
                title="本月营业收入" 
                current={currentTotalIncome} 
                target={targets.revenue} 
                colorClass="bg-blue-50 text-blue-600" 
                icon={Icons.TrendingUp}
                type="more_is_better"
           />
           <TargetProgressCard 
                title="本月经营净利" 
                current={currentTotalIncome - currentTotalExpense} 
                target={targets.profit} 
                colorClass="bg-green-50 text-green-600" 
                icon={Icons.PieChart}
                type="more_is_better"
           />
           <TargetProgressCard 
                title="本月总支出控制" 
                current={currentTotalExpense} 
                target={targets.expenseLimit} 
                colorClass="bg-red-50 text-red-600" 
                icon={Icons.TrendingDown}
                type="less_is_better"
           />
       </div>

       {/* 2. Charts Section */}
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
           {/* Left: Profit Trend */}
           <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
               <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                   <div>
                       <h2 className="text-lg font-bold text-gray-900">收支利润趋势</h2>
                       <p className="text-xs text-gray-500 mt-1">实际业绩 vs 目标设定</p>
                   </div>
                   <div className="flex items-center gap-3 text-xs">
                       <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-500 rounded-sm"></span> 收入</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 bg-red-400 rounded-sm"></span> 支出</span>
                       <span className="flex items-center gap-1"><span className="w-3 h-3 border border-gray-400 border-dashed rounded-sm"></span> 目标</span>
                   </div>
               </div>
               <div className="p-6 h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart data={MONTHLY_TREND_DATA} margin={{top: 10, right: 10, left: 0, bottom: 0}}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} dy={10} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                cursor={{fill: '#f8fafc'}}
                            />
                            <Bar dataKey="income" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} name="收入" />
                            <Bar dataKey="expense" fill="#f87171" radius={[4, 4, 0, 0]} barSize={20} name="支出" />
                            <Line type="monotone" dataKey="profit" stroke="#10b981" strokeWidth={3} dot={{r: 4, fill: '#10b981'}} name="净利" />
                            <Line type="monotone" dataKey="target" stroke="#94a3b8" strokeWidth={2} strokeDasharray="5 5" dot={false} name="目标" />
                        </ComposedChart>
                    </ResponsiveContainer>
               </div>
           </div>

           {/* Right: Quick Budget Status */}
           <div className="lg:col-span-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col p-6">
               <div className="flex justify-between items-center mb-6">
                   <h2 className="text-lg font-bold text-gray-900">预算预警</h2>
                   <button onClick={() => setActiveTab('cost')} className="text-xs text-primary-600 font-bold hover:underline">查看详情</button>
               </div>
               <div className="flex-1 space-y-5">
                   {costBreakdown.filter(c => c.amount > c.budget * 0.8).map(cat => {
                       const pct = Math.round((cat.amount / cat.budget) * 100);
                       const isOver = pct > 100;
                       return (
                           <div key={cat.id} className="space-y-1">
                               <div className="flex justify-between text-sm">
                                   <span className="font-bold text-gray-700 flex items-center gap-2">
                                       <cat.icon className={`w-4 h-4 ${isOver ? 'text-red-500' : 'text-orange-500'}`}/>
                                       {cat.name}
                                   </span>
                                   <span className={`font-mono font-bold ${isOver ? 'text-red-600' : 'text-gray-900'}`}>
                                       {pct}%
                                   </span>
                               </div>
                               <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                   <div className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-orange-400'}`} style={{width: `${Math.min(pct, 100)}%`}}></div>
                               </div>
                               <p className="text-[10px] text-gray-400 text-right">
                                   已用 ¥{cat.amount.toLocaleString()} / 预算 ¥{cat.budget.toLocaleString()}
                               </p>
                           </div>
                       )
                   })}
                   {costBreakdown.filter(c => c.amount > c.budget * 0.8).length === 0 && (
                       <div className="flex flex-col items-center justify-center h-full text-gray-400">
                           <Icons.CheckCircle2 className="w-12 h-12 text-green-100 mb-2"/>
                           <p className="text-sm">各项费用均在预算范围内</p>
                       </div>
                   )}
               </div>
           </div>
       </div>
    </div>
  );

  const CostControlView = () => (
      <div className="animate-fade-in space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Pie Chart */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">成本结构分布</h3>
                  <div className="h-64 w-full relative">
                      <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                              <Pie
                                  data={costBreakdown}
                                  dataKey="amount"
                                  nameKey="name"
                                  cx="50%"
                                  cy="50%"
                                  outerRadius={80}
                                  innerRadius={60}
                                  paddingAngle={2}
                              >
                                  {costBreakdown.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                              </Pie>
                              <Tooltip formatter={(value: number) => `¥ ${value.toLocaleString()}`} />
                              <Legend verticalAlign="middle" align="right" layout="vertical" iconType="circle" />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none pr-32">
                          <div className="text-center">
                              <p className="text-xs text-gray-400">总支出</p>
                              <p className="text-xl font-black text-gray-900">¥ {(currentTotalExpense/10000).toFixed(1)}w</p>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Bar Chart - Budget vs Actual */}
              <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">预算执行情况对比</h3>
                  <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={costBreakdown} layout="vertical" margin={{top: 5, right: 30, left: 40, bottom: 5}}>
                              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9"/>
                              <XAxis type="number" hide />
                              <YAxis dataKey="name" type="category" width={80} tick={{fontSize: 12, fill: '#64748b'}} axisLine={false} tickLine={false}/>
                              <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                              <Bar dataKey="budget" name="预算" fill="#f1f5f9" radius={[0, 4, 4, 0]} barSize={20} />
                              <Bar dataKey="amount" name="实际" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} style={{transform: 'translateY(-16px)'}} />
                          </BarChart>
                      </ResponsiveContainer>
                  </div>
              </div>
          </div>

          {/* Detailed Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">费用科目明细表</h3>
                  <button className="text-xs font-bold text-primary-600 bg-white border border-primary-200 px-3 py-1.5 rounded-lg shadow-sm hover:bg-primary-50">
                      <Icons.Download className="w-3 h-3 inline mr-1"/> 导出报表
                  </button>
              </div>
              <table className="w-full text-left text-sm">
                  <thead className="bg-white text-gray-500 uppercase font-bold text-xs border-b border-gray-100">
                      <tr>
                          <th className="px-6 py-4">费用科目</th>
                          <th className="px-6 py-4 text-right">本月预算</th>
                          <th className="px-6 py-4 text-right">实际支出</th>
                          <th className="px-6 py-4 text-center">执行率</th>
                          <th className="px-6 py-4 text-right">上月同期</th>
                          <th className="px-6 py-4 text-right">环比变化</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                      {costBreakdown.map((item) => {
                          const rate = (item.amount / item.budget) * 100;
                          const mom = ((item.amount - item.lastMonth) / item.lastMonth) * 100;
                          return (
                              <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                  <td className="px-6 py-4 font-bold text-gray-900 flex items-center gap-3">
                                      <div className="p-2 rounded-lg bg-gray-100 text-gray-600">
                                          <item.icon className="w-4 h-4"/>
                                      </div>
                                      {item.name}
                                  </td>
                                  <td className="px-6 py-4 text-right text-gray-500 font-mono">¥ {item.budget.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono">¥ {item.amount.toLocaleString()}</td>
                                  <td className="px-6 py-4 text-center">
                                      <span className={`px-2 py-1 rounded text-xs font-bold ${rate > 100 ? 'bg-red-100 text-red-600' : rate > 80 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                          {rate.toFixed(1)}%
                                      </span>
                                  </td>
                                  <td className="px-6 py-4 text-right text-gray-500 font-mono">¥ {item.lastMonth.toLocaleString()}</td>
                                  <td className={`px-6 py-4 text-right font-bold text-xs ${mom > 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {mom > 0 ? '+' : ''}{mom.toFixed(1)}%
                                  </td>
                              </tr>
                          );
                      })}
                  </tbody>
              </table>
          </div>
      </div>
  );

  const TargetSettingModal = () => (
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                  <h3 className="font-bold text-gray-900">设定本月财务目标</h3>
                  <button onClick={() => setIsEditingTargets(false)} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-5 h-5"/></button>
              </div>
              <div className="p-6 space-y-5">
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">营收目标 (Revenue Target)</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 font-bold">¥</span>
                          <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 outline-none font-mono font-bold text-gray-900"
                            defaultValue={targets.revenue}
                            onChange={(e) => setTargets({...targets, revenue: Number(e.target.value)})}
                          />
                      </div>
                  </div>
                  <div>
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">利润目标 (Profit Target)</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 font-bold">¥</span>
                          <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none font-mono font-bold text-green-700"
                            defaultValue={targets.profit}
                            onChange={(e) => setTargets({...targets, profit: Number(e.target.value)})}
                          />
                      </div>
                  </div>
                  <div className="pt-4 border-t border-gray-100">
                      <label className="block text-sm font-bold text-gray-700 mb-1.5">总支出预算上限 (Expense Limit)</label>
                      <div className="relative">
                          <span className="absolute left-3 top-2.5 text-gray-500 font-bold">¥</span>
                          <input 
                            type="number" 
                            className="w-full pl-8 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none font-mono font-bold text-red-700 bg-red-50"
                            defaultValue={targets.expenseLimit}
                            onChange={(e) => setTargets({...targets, expenseLimit: Number(e.target.value)})}
                          />
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                          * 此设置将作为仪表盘及预警系统的基准线。
                      </p>
                  </div>
              </div>
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                  <button onClick={() => setIsEditingTargets(false)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white text-gray-700 hover:bg-gray-50 font-bold">取消</button>
                  <button onClick={() => setIsEditingTargets(false)} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-md hover:bg-primary-700">保存设定</button>
              </div>
          </div>
      </div>
  );

  const TransactionsView = () => {
      const filtered = transactions.filter(t => transFilter === 'all' || t.flow === transFilter);
      return (
        <div className="flex flex-col h-full animate-fade-in gap-6">
            {/* Filter Bar */}
            <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-wrap gap-4 items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex bg-gray-100 p-1 rounded-lg">
                        {[{id:'all', label:'全部'}, {id:'in', label:'收入'}, {id:'out', label:'支出'}].map(opt => (
                            <button 
                                key={opt.id} 
                                onClick={() => setTransFilter(opt.id)} 
                                className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${transFilter === opt.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                    <div className="h-6 w-px bg-gray-200 mx-2"></div>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                        <input className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none w-64" placeholder="搜索单号、摘要..." />
                    </div>
                </div>
                <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm">
                    <Icons.Download className="w-4 h-4"/> 导出流水
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="overflow-auto flex-1">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-500 uppercase font-bold text-xs tracking-wider sticky top-0 z-10 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">流水号 / 时间</th>
                                <th className="px-6 py-4">往来单位 / 摘要</th>
                                <th className="px-6 py-4">费用科目</th>
                                <th className="px-6 py-4 text-right">发生金额</th>
                                <th className="px-6 py-4 text-center">状态</th>
                                <th className="px-6 py-4 text-right">经办人</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filtered.map((row) => (
                                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="font-mono font-medium text-gray-900">{row.id}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{row.date}</div>
                                        {row.relatedId && <div className="text-[10px] text-primary-600 mt-1 flex items-center gap-1"><Icons.Link className="w-3 h-3"/> {row.relatedId}</div>}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="font-bold text-gray-800">{row.entity}</div>
                                        <div className="text-xs text-gray-500">{row.type}</div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 border border-gray-200">
                                            {row.category}
                                        </span>
                                    </td>
                                    <td className={`px-6 py-4 text-right font-mono font-bold text-base ${row.flow === 'in' ? 'text-green-600' : 'text-gray-900'}`}>
                                        {row.flow === 'in' ? '+' : ''} {row.amount.toLocaleString(undefined, {minimumFractionDigits: 2})}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold ${
                                            row.status.includes('已') ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                                        }`}>
                                            {row.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right text-gray-600">{row.operator}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in bg-gray-50/50">
       {isEditingTargets && <TargetSettingModal />}
       {isRecordingExpense && <RecordExpenseModal />}

       {/* Top Toolbar */}
       <div className="bg-white border-b border-gray-200 px-6 py-3 flex flex-col md:flex-row justify-between items-center gap-4 shrink-0 sticky top-0 z-10">
          <div className="flex items-center gap-6">
             <div className="flex items-center gap-2 text-gray-900">
                 <Icons.Bank className="w-6 h-6 text-primary-600"/>
                 <h1 className="text-xl font-bold tracking-tight">财务管理中心</h1>
             </div>
             <div className="hidden md:flex bg-gray-100 p-1 rounded-lg">
                 {['overview', 'cost', 'transactions'].map((key) => {
                     const labels: any = { overview: '概览 & 目标', cost: '成本管控', transactions: '资金流水' };
                     return (
                         <button 
                            key={key}
                            onClick={() => handleTabChange(key)}
                            className={`px-4 py-1.5 text-sm font-bold rounded-md transition-all ${
                                activeTab === key ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'
                            }`}
                         >
                             {labels[key]}
                             {key === 'cost' && user?.tenantPlan !== 'enterprise' && <Icons.Lock className="w-3 h-3 inline ml-1 text-gray-400"/>}
                         </button>
                     );
                 })}
             </div>
          </div>
          <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsRecordingExpense(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700 shadow-sm"
             >
                 <Icons.FileEdit className="w-3 h-3"/> 记一笔 (费用录入)
             </button>
             <button 
                onClick={handleSetBudget}
                className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-50 shadow-sm"
             >
                 <Icons.Settings className="w-3 h-3"/> 设定预算
             </button>
             <div className="relative cursor-pointer group ml-2">
                 <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden border border-gray-200 ring-2 ring-transparent group-hover:ring-primary-100 transition-all">
                     <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" alt="Avatar" className="w-full h-full object-cover"/>
                 </div>
             </div>
          </div>
       </div>

       <div className="flex-1 overflow-auto p-6 custom-scrollbar">
           {activeTab === 'overview' && <OverviewView />}
           {activeTab === 'cost' && <CostControlView />}
           {activeTab === 'transactions' && <TransactionsView />}
       </div>
    </div>
  );
};
