
import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts';
import { Icons } from '../components/Icons';
import { StatCardProps, Page } from '../types';

interface DashboardProps {
  setPage: (page: Page) => void;
}

const salesData = [
  { name: '1月', sales: 4000, profit: 2400, target: 3000 },
  { name: '2月', sales: 3000, profit: 1398, target: 3200 },
  { name: '3月', sales: 2000, profit: 9800, target: 3500 },
  { name: '4月', sales: 2780, profit: 3908, target: 4000 },
  { name: '5月', sales: 1890, profit: 4800, target: 4200 },
  { name: '6月', sales: 2390, profit: 3800, target: 4500 },
  { name: '7月', sales: 3490, profit: 4300, target: 4800 },
];

const categoryData = [
  { name: '紧固件', value: 400 },
  { name: '电动工具', value: 300 },
  { name: '手动工具', value: 300 },
  { name: '劳保用品', value: 200 },
];

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel, icon, color, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
        <div className={`p-4 rounded-full ${color.replace('bg-', 'text-')}`}>
            {React.cloneElement(icon as React.ReactElement, { className: 'w-16 h-16' })}
        </div>
    </div>
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-inner`}>
            {icon}
        </div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        <div className="mt-4 flex items-center text-xs font-medium">
        <span className={`flex items-center px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {trend >= 0 ? <Icons.TrendingUp className="w-3 h-3 mr-1" /> : <Icons.TrendingDown className="w-3 h-3 mr-1" />}
            {Math.abs(trend)}%
        </span>
        <span className="text-gray-400 ml-2">{trendLabel}</span>
        </div>
    </div>
  </div>
);

export const Dashboard: React.FC<DashboardProps> = ({ setPage }) => {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');

  return (
    <div className="space-y-8 animate-fade-in pb-10">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 tracking-tight">下午好，王总 👋</h2>
          <div className="flex items-center gap-3 mt-1">
            <p className="text-gray-500">这是您今日的业务概览，各项指标运行良好。</p>
            <div className="flex items-center gap-2 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-[10px] font-bold border border-blue-100">
                <Icons.Cloud className="w-3 h-3" /> AWS Cloud: 运行中
            </div>
            <div className="flex items-center gap-2 px-2 py-0.5 bg-green-50 text-green-600 rounded-full text-[10px] font-bold border border-green-100">
                <Icons.ShieldCheck className="w-3 h-3" /> 税务局对接: 已连接
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 bg-white p-1.5 rounded-xl border border-gray-200 shadow-sm">
          {['day', 'week', 'month'].map((range) => (
            <button 
                key={range}
                onClick={() => setTimeRange(range as any)}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${timeRange === range ? 'bg-gray-900 text-white shadow-md' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'}`}
            >
                {range === 'day' ? '今日' : range === 'week' ? '本周' : '本月'}
            </button>
          ))}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="今日销售额"
          value="¥ 12,450.00"
          trend={12.5}
          trendLabel="较昨日"
          icon={<Icons.Dollar className="w-6 h-6 text-primary-600" />}
          color="bg-primary-50"
          onClick={() => setPage(Page.FINANCE)}
        />
        <StatCard
          title="待处理订单"
          value="85"
          trend={5.2}
          trendLabel="较昨日"
          icon={<Icons.Order className="w-6 h-6 text-indigo-600" />}
          color="bg-indigo-50"
          onClick={() => setPage(Page.ORDER_LIST)}
        />
        <StatCard
          title="本月新增客户"
          value="12"
          trend={-2.1}
          trendLabel="较上月"
          icon={<Icons.NewUser className="w-6 h-6 text-orange-600" />}
          color="bg-orange-50"
          onClick={() => setPage(Page.SUPPLIERS_CUSTOMERS)}
        />
        <StatCard
          title="库存周转率"
          value="4.2%"
          trend={0.8}
          trendLabel="较上周"
          icon={<Icons.Activity className="w-6 h-6 text-teal-600" />}
          color="bg-teal-50"
          onClick={() => setPage(Page.WAREHOUSE)}
        />
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Sales Trend */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <div>
                <h3 className="text-lg font-bold text-gray-900">销售趋势分析</h3>
                <p className="text-xs text-gray-500 mt-1">过去 7 个月的销售额与预期目标对比</p>
            </div>
            <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600"><Icons.MoreHorizontal className="w-5 h-5"/></button>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={salesData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <Tooltip 
                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                    cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                />
                <Area type="monotone" dataKey="sales" name="实际销售" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorSales)" strokeWidth={3} />
                <Area type="step" dataKey="target" name="预期目标" stroke="#cbd5e1" fill="none" strokeWidth={2} strokeDasharray="4 4"/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Distribution */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm flex flex-col">
            <h3 className="text-lg font-bold text-gray-900 mb-2">销售占比</h3>
            <p className="text-xs text-gray-500 mb-6">按产品分类统计</p>
            <div className="flex-1 min-h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {categoryData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip />
                        <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                </ResponsiveContainer>
                {/* Center Text */}
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none pb-8">
                    <span className="text-3xl font-bold text-gray-900">1.2W</span>
                    <span className="text-xs text-gray-500">总销量</span>
                </div>
            </div>
        </div>
      </div>

      {/* Bottom Section: Quick Actions & Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">常用功能</h3>
            <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setPage(Page.POS)} className="flex flex-col items-center justify-center p-4 bg-blue-50 text-blue-700 rounded-xl hover:bg-blue-100 transition-colors group">
                    <Icons.POS className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">前台收银</span>
                </button>
                <button onClick={() => setPage(Page.SCAN_INBOUND)} className="flex flex-col items-center justify-center p-4 bg-green-50 text-green-700 rounded-xl hover:bg-green-100 transition-colors group">
                    <Icons.Inbound className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">扫码入库</span>
                </button>
                <button onClick={() => setPage(Page.SALES_OUTBOUND)} className="flex flex-col items-center justify-center p-4 bg-orange-50 text-orange-700 rounded-xl hover:bg-orange-100 transition-colors group">
                    <Icons.Outbound className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">扫码出库</span>
                </button>
                <button onClick={() => setPage(Page.PRODUCT_ENTRY)} className="flex flex-col items-center justify-center p-4 bg-purple-50 text-purple-700 rounded-xl hover:bg-purple-100 transition-colors group">
                    <Icons.Plus className="w-8 h-8 mb-2 group-hover:scale-110 transition-transform" />
                    <span className="font-bold text-sm">新增商品</span>
                </button>
            </div>
        </div>

        {/* Inventory Alerts */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                    <Icons.AlertTriangle className="w-5 h-5 text-red-500"/> 库存预警
                </h3>
                <button onClick={() => setPage(Page.WAREHOUSE)} className="text-sm text-primary-600 hover:underline font-medium">查看全部</button>
            </div>
            <div className="space-y-3">
                {[
                    { name: '304不锈钢六角螺栓 M8', location: 'A-01', current: 5, min: 100, img: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=100&h=100&fit=crop' },
                    { name: '冲击钻 20V 无刷', location: 'B-01', current: 2, min: 10, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=100&h=100&fit=crop' },
                    { name: '镀锌自攻螺丝', location: 'A-02', current: 12, min: 200, img: 'https://images.unsplash.com/photo-1579730230230-05e839e9477e?w=100&h=100&fit=crop' },
                ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100 hover:bg-red-50 transition-colors cursor-pointer group">
                        <div className="flex items-center gap-4">
                            <img src={item.img} alt={item.name} className="w-12 h-12 rounded-lg object-cover border border-red-100" />
                            <div>
                                <h4 className="font-bold text-gray-900 text-sm">{item.name}</h4>
                                <p className="text-xs text-gray-500 mt-0.5">库位: {item.location}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <div className="text-sm font-bold text-red-600">{item.current} <span className="text-gray-400 font-normal text-xs">/ {item.min}</span></div>
                                <div className="text-[10px] text-red-400">低于安全库存</div>
                            </div>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setPage(Page.SCAN_INBOUND); }} 
                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-600 hover:text-white transition-colors shadow-sm"
                            >
                                补货
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
      </div>
    </div>
  );
};

