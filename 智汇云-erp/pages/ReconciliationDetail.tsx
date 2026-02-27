
import React, { useState, useMemo } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
}

interface SaleItem {
    id: string;
    no: string;
    date: string;
    amount: number;
    items: string;
    status: 'unsettled';
}

interface PaymentItem {
    id: string;
    type: string;
    method: string;
    date: string;
    amount: number;
    note: string;
}

export const ReconciliationDetail: React.FC<PageProps> = ({ setPage }) => {
    // Mock Data
    const salesData: SaleItem[] = [
        { id: '1', no: 'XS-20231024-01', date: '2023-10-24 14:30', amount: 15000.00, items: '茅台飞天 53度 x 5箱...', status: 'unsettled' },
        { id: '2', no: 'XS-20231025-08', date: '2023-10-25 09:15', amount: 20000.00, items: '五粮液 52度 x 10箱...', status: 'unsettled' },
        { id: '3', no: 'XS-20231026-03', date: '2023-10-26 11:00', amount: 53500.00, items: '洋河蓝色经典...', status: 'unsettled' },
        { id: '4', no: 'XS-20231027-12', date: '2023-10-27 16:20', amount: 8800.00, items: '国窖1573 x 2箱...', status: 'unsettled' },
    ];

    const paymentsData: PaymentItem[] = [
        { id: 'p1', type: '银行转账', method: '建设银行', date: '2023-10-28 10:00', amount: 30000.00, note: '10月份部分货款' },
        { id: 'p2', type: '微信支付', method: '', date: '2023-10-28 10:05', amount: 5000.00, note: '尾款补充' },
        { id: 'p3', type: '银行转账', method: '工商银行', date: '2023-10-29 09:30', amount: 20000.00, note: '预付款' },
    ];

    // State
    const [selectedSales, setSelectedSales] = useState<string[]>(['1', '2']);
    const [selectedPayments, setSelectedPayments] = useState<string[]>(['p1', 'p2']);

    // Calculations
    const totalSalesSelected = useMemo(() => 
        salesData.filter(item => selectedSales.includes(item.id)).reduce((acc, curr) => acc + curr.amount, 0)
    , [selectedSales]);

    const totalPaymentsSelected = useMemo(() => 
        paymentsData.filter(item => selectedPayments.includes(item.id)).reduce((acc, curr) => acc + curr.amount, 0)
    , [selectedPayments]);

    const difference = totalSalesSelected - totalPaymentsSelected;
    const isBalanced = Math.abs(difference) < 0.01;

    // Handlers
    const toggleSale = (id: string) => {
        setSelectedSales(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const togglePayment = (id: string) => {
        setSelectedPayments(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in bg-gray-50/50">
            {/* Top Navigation Tabs */}
            <div className="px-6 pt-4 border-b border-gray-200 bg-white flex items-end gap-1 shrink-0">
                <button 
                    onClick={() => setPage(Page.RECONCILIATION)}
                    className="px-5 py-2.5 text-sm font-medium text-gray-500 hover:text-gray-700 bg-gray-50 border-t border-x border-gray-200 rounded-t-lg transition-colors"
                >
                    客户账期列表
                </button>
                <div className="px-5 py-2.5 text-sm font-bold text-primary-600 bg-white border-t border-x border-gray-200 rounded-t-lg relative -mb-px flex items-center gap-2 shadow-sm z-10">
                    盛世名酒行 - 对账
                    <button 
                        onClick={() => setPage(Page.RECONCILIATION)}
                        className="p-0.5 hover:bg-gray-100 rounded-full text-gray-400 hover:text-gray-600"
                    >
                        <Icons.Close className="w-3 h-3"/>
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 overflow-hidden p-6 flex flex-col">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full overflow-hidden">
                    {/* Workspace Header */}
                    <div className="h-16 border-b border-gray-200 px-6 flex items-center justify-between shrink-0 bg-white">
                        <div className="flex items-center gap-4">
                            <h2 className="text-lg font-bold text-gray-900">盛世名酒行 - 对账工作台</h2>
                            <span className="px-2.5 py-1 rounded bg-red-50 text-red-600 text-xs font-medium border border-red-100">
                                欠款: ¥ 88,500.00
                            </span>
                        </div>
                        <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium transition-colors shadow-sm">
                            <Icons.WeChat className="w-4 h-4"/> 微信分享账单
                        </button>
                    </div>

                    {/* Dual Column Layout */}
                    <div className="flex-1 flex overflow-hidden">
                        {/* Left: Sales Orders */}
                        <div className="w-1/2 flex flex-col border-r border-gray-200 bg-gray-50/30">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Icons.FileText className="w-4 h-4 text-gray-400"/> 待对账销售单
                                </h3>
                                <div className="text-sm">
                                    <span className="text-gray-500 mr-2">已选:</span>
                                    <span className="font-bold text-primary-600">¥ {totalSalesSelected.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {salesData.map(sale => {
                                    const isSelected = selectedSales.includes(sale.id);
                                    return (
                                        <div 
                                            key={sale.id}
                                            onClick={() => toggleSale(sale.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${isSelected ? 'bg-blue-50/50 border-primary-500 ring-1 ring-primary-500' : 'bg-white border-gray-200 hover:border-primary-300'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm">销售单 #{sale.no}</div>
                                                    <div className="text-xs text-gray-500 mt-1">{sale.date}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-gray-900">¥ {sale.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected} 
                                                        readOnly 
                                                        className="mt-2 w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500 cursor-pointer pointer-events-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
                                                <span className="text-gray-500 truncate max-w-[200px]">商品: {sale.items}</span>
                                                <span className="text-orange-500 font-medium">未结清</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Right: Payments */}
                        <div className="w-1/2 flex flex-col bg-white">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-white">
                                <h3 className="font-bold text-gray-700 flex items-center gap-2">
                                    <Icons.Banknote className="w-4 h-4 text-gray-400"/> 已收款记录
                                </h3>
                                <div className="text-sm">
                                    <span className="text-gray-500 mr-2">已选:</span>
                                    <span className="font-bold text-green-600">¥ {totalPaymentsSelected.toLocaleString('en-US', {minimumFractionDigits: 2})}</span>
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                {paymentsData.map(payment => {
                                    const isSelected = selectedPayments.includes(payment.id);
                                    return (
                                        <div 
                                            key={payment.id}
                                            onClick={() => togglePayment(payment.id)}
                                            className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${isSelected ? 'bg-green-50/50 border-green-500 ring-1 ring-green-500' : 'bg-gray-50/50 border-gray-200 hover:border-green-300'}`}
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <div className="font-bold text-gray-900 text-sm flex items-center gap-2">
                                                        {payment.type}
                                                        {payment.method && <span className="font-normal text-gray-500 text-xs">({payment.method})</span>}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{payment.date}</div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-bold text-green-600">+ ¥ {payment.amount.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                                                    <input 
                                                        type="checkbox" 
                                                        checked={isSelected} 
                                                        readOnly 
                                                        className="mt-2 w-5 h-5 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer pointer-events-none"
                                                    />
                                                </div>
                                            </div>
                                            <div className="pt-3 border-t border-gray-200 flex justify-between items-center text-xs">
                                                <span className="text-gray-500">备注: {payment.note}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Bottom Calculation Bar */}
                    <div className="h-20 bg-white border-t border-gray-200 px-8 flex items-center justify-between shrink-0 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] z-20">
                        <div className="flex items-center gap-8">
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">已选销售额</div>
                                <div className="text-xl font-bold text-gray-900">¥ {totalSalesSelected.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                            </div>
                            <div className="text-gray-300 text-2xl font-light">-</div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">已选收款额</div>
                                <div className="text-xl font-bold text-green-600">¥ {totalPaymentsSelected.toLocaleString('en-US', {minimumFractionDigits: 2})}</div>
                            </div>
                            <div className="text-gray-300 text-2xl font-light">=</div>
                            <div>
                                <div className="text-[10px] text-gray-400 uppercase font-bold tracking-wider mb-1">差额</div>
                                <div className="flex items-center gap-3">
                                    <div className={`text-2xl font-black ${isBalanced ? 'text-gray-900' : 'text-red-500'}`}>
                                        ¥ {Math.abs(difference).toLocaleString('en-US', {minimumFractionDigits: 2})}
                                    </div>
                                    {isBalanced && (
                                        <span className="bg-green-100 text-green-700 text-xs font-bold px-2 py-0.5 rounded flex items-center gap-1">
                                            <Icons.Check className="w-3 h-3"/> 平账
                                        </span>
                                    )}
                                    {!isBalanced && (
                                        <span className="bg-red-100 text-red-700 text-xs font-bold px-2 py-0.5 rounded">
                                            {difference > 0 ? '需收款' : '需退款'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <button className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-lg shadow-primary-200 transition-transform active:scale-95">
                            一键对账并生成报表
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
