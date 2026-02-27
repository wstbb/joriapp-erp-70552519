
import React from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
}

export const ReconciliationWorkbench: React.FC<PageProps> = ({ setPage }) => {
    // Mock Data based on screenshot
    const clients = [
        { 
            id: '#CUST-90122', 
            name: '环球星辰五金有限公司', 
            avatar: 'GS', 
            avatarColor: 'bg-primary-50 text-primary-600',
            totalOwed: '¥450,200.00',
            dueSoon: '¥120,000.00',
            overdue: '¥32,400.00',
            status: '已逾期',
            statusColor: 'bg-red-100 text-red-600',
            lastReconciled: '2023-10-15'
        },
        { 
            id: '#CUST-44109', 
            name: '钢铁大师有限公司', 
            avatar: 'SM', 
            avatarColor: 'bg-green-50 text-green-600',
            totalOwed: '¥1,120,000.00',
            dueSoon: '¥340,000.00',
            overdue: '¥0.00',
            status: '正常',
            statusColor: 'bg-green-100 text-green-600',
            lastReconciled: '2023-11-01'
        },
        { 
            id: '#CUST-33087', 
            name: '筑基建筑供应', 
            avatar: 'BT', 
            avatarColor: 'bg-orange-50 text-orange-600',
            totalOwed: '¥320,500.00',
            dueSoon: '¥210,000.00',
            overdue: '¥12,000.00',
            status: '已发对账单',
            statusColor: 'bg-yellow-100 text-yellow-700',
            lastReconciled: '2023-10-28'
        },
        { 
            id: '#CUST-55121', 
            name: '远洋轨道集团', 
            avatar: 'OR', 
            avatarColor: 'bg-gray-100 text-gray-600',
            totalOwed: '¥559,300.00',
            dueSoon: '¥55,000.00',
            overdue: '¥80,100.00',
            status: '已逾期',
            statusColor: 'bg-red-100 text-red-600',
            lastReconciled: '2023-09-30'
        },
    ];

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 shrink-0">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 tracking-tight">对账工作台</h1>
                    <p className="text-gray-500 mt-1">管理大客户往来账目与财务状况概览。</p>
                </div>
                <div className="flex gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 transition-colors shadow-sm">
                        <Icons.Download className="w-4 h-4"/> 导出数据
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-lg shadow-primary-200 transition-colors">
                        <Icons.Plus className="w-4 h-4"/> 新建对账单
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
                {/* Total Receivables */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">总应收额</span>
                        <div className="p-2 bg-primary-50 rounded-lg text-primary-600">
                            <Icons.Bank className="w-5 h-5"/>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">¥2,450,000.00</p>
                        <p className="text-xs font-bold text-green-600 mt-2 flex items-center">
                            <Icons.TrendingUp className="w-3 h-3 mr-1"/> 较上月增长 5.2%
                        </p>
                    </div>
                </div>

                {/* Est Recovery */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">本月预计回收</span>
                        <div className="p-2 bg-orange-50 rounded-lg text-orange-600">
                            <Icons.Calendar className="w-5 h-5"/>
                        </div>
                    </div>
                    <div className="w-full">
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">¥890,000.00</p>
                        <div className="w-full bg-gray-100 h-1.5 rounded-full mt-3 overflow-hidden">
                            <div className="bg-orange-500 h-full w-[65%] rounded-full"></div>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-2 font-medium">已回款目标的 65%</p>
                    </div>
                </div>

                {/* Overdue */}
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between h-40 relative overflow-hidden group hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start">
                        <span className="text-sm font-medium text-gray-500">总逾期金额</span>
                        <div className="p-2 bg-red-50 rounded-lg text-red-500">
                            <Icons.Warning className="w-5 h-5"/>
                        </div>
                    </div>
                    <div>
                        <p className="text-3xl font-bold text-gray-900 tracking-tight">¥124,500.00</p>
                        <p className="text-xs font-bold text-red-600 mt-2 flex items-center">
                            ! 12 个客户账户已逾期
                        </p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-2 flex flex-col md:flex-row items-center gap-4 shrink-0">
                <div className="relative flex-1 w-full md:w-auto">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 focus:bg-white focus:border-primary-500 rounded-lg text-sm outline-none transition-all" 
                        placeholder="按客户名称搜索..." 
                        type="text"
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto px-2">
                    <select className="px-4 py-2.5 bg-gray-50 border border-transparent hover:bg-white hover:border-gray-200 rounded-lg text-sm text-gray-700 outline-none cursor-pointer font-medium min-w-[140px]">
                        <option>全部状态</option>
                        <option>已逾期</option>
                        <option>正常</option>
                        <option>已发对账单</option>
                    </select>
                    <div className="h-6 w-px bg-gray-200 mx-2 hidden md:block"></div>
                    <span className="text-xs text-gray-400 whitespace-nowrap">排序方式:</span>
                    <button className="text-sm font-bold text-gray-900 flex items-center gap-1 hover:text-primary-600 transition-colors">
                        欠款总额 <Icons.ChevronDown className="w-4 h-4"/>
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">客户名称 (大客户)</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">总欠款额</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">即将到期</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">逾期金额</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-center">状态</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">上次对账日期</th>
                                <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">操作</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {clients.map((client) => (
                                <tr key={client.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${client.avatarColor}`}>
                                                {client.avatar}
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{client.name}</div>
                                                <div className="text-xs text-gray-400 font-medium">ID: {client.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right font-bold text-gray-900 font-mono text-base">{client.totalOwed}</td>
                                    <td className="px-6 py-4 text-right font-medium text-gray-600 font-mono">{client.dueSoon}</td>
                                    <td className={`px-6 py-4 text-right font-bold font-mono ${client.overdue !== '¥0.00' ? 'text-red-500' : 'text-gray-300'}`}>
                                        {client.overdue}
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${client.statusColor}`}>
                                            {client.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 font-medium text-xs">{client.lastReconciled}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button 
                                            onClick={() => setPage(Page.RECONCILIATION_DETAIL)}
                                            className="px-4 py-1.5 bg-primary-600 text-white text-xs font-bold rounded-lg shadow-sm hover:bg-primary-700 transition-all opacity-0 group-hover:opacity-100 active:scale-95"
                                        >
                                            去对账
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Pagination */}
                <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between mt-auto">
                    <p className="text-sm text-gray-500 font-medium">显示 <span className="font-bold text-gray-900">1 - 4</span> / 48 个主要客户</p>
                    <div className="flex gap-1">
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-50 transition-colors">
                            <Icons.ArrowLeft className="w-4 h-4" />
                        </button>
                        <button className="w-8 h-8 flex items-center justify-center bg-primary-600 text-white rounded-lg font-bold text-sm shadow-sm">1</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">2</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 font-medium text-sm transition-colors">3</button>
                        <button className="w-8 h-8 flex items-center justify-center bg-white border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors">
                            <Icons.ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
