import React, { useState } from 'react';
import { Icons } from '../components/Icons';

export const POS: React.FC = () => {
  const [cartItems] = useState([
    { id: 1, name: '304不锈钢六角螺栓 M8', price: 0.45, qty: 50, total: 22.5 },
    { id: 2, name: 'PVC排水管 DN110', price: 18.50, qty: 5, total: 92.5 },
    { id: 3, name: '立邦内墙乳胶漆 18L', price: 268.00, qty: 1, total: 268.0 },
  ]);
  
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay' | 'cash' | 'card'>('wechat');

  const totalAmount = cartItems.reduce((sum, item) => sum + item.total, 0);

  const handleHoldOrder = () => {
      alert("挂单成功！单号：H-20231024-001");
  };

  const handleMember = () => {
      const member = prompt("请输入会员手机号：");
      if (member) alert(`会员 ${member} 识别成功，当前享受 95 折优惠`);
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex gap-4 animate-fade-in">
      {/* Left: Cart & Product Entry */}
      <div className="flex-1 flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <span className="text-sm font-medium text-gray-700">收银台 #01 - 在线</span>
          </div>
          <div className="text-sm text-gray-500">
            收银员: 张三
          </div>
        </div>

        {/* Product Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Icons.Scan className="h-5 w-5 text-primary-500" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-12 py-3 border-2 border-primary-100 rounded-lg leading-5 bg-gray-100 focus:bg-white placeholder-gray-400 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-50 text-lg transition-colors"
              placeholder="扫描商品条码或输入商品名称 (F2)"
              autoFocus
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-gray-400 text-xs border border-gray-200 rounded px-1.5 py-0.5">Enter</span>
            </div>
          </div>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto p-2">
          <table className="w-full text-left">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500 sticky top-0">
              <tr>
                <th className="px-4 py-3 font-semibold rounded-l-lg">商品名称</th>
                <th className="px-4 py-3 font-semibold text-right">单价</th>
                <th className="px-4 py-3 font-semibold text-center">数量</th>
                <th className="px-4 py-3 font-semibold text-right">小计</th>
                <th className="px-4 py-3 font-semibold text-center rounded-r-lg">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {cartItems.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50/50 group">
                  <td className="px-4 py-3 font-medium text-gray-900">{item.name}</td>
                  <td className="px-4 py-3 text-right text-gray-600">¥{item.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center border border-gray-300 rounded-md bg-white">
                      <button className="px-2 py-1 hover:bg-gray-100 text-gray-600">-</button>
                      <input 
                        type="text" 
                        value={item.qty} 
                        className="w-10 text-center border-x border-gray-300 py-1 text-sm focus:outline-none bg-gray-50"
                        readOnly 
                      />
                      <button className="px-2 py-1 hover:bg-gray-100 text-gray-600">+</button>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-bold text-gray-900">¥{item.total.toFixed(2)}</td>
                  <td className="px-4 py-3 text-center">
                    <button className="text-gray-400 hover:text-red-500 transition-colors">
                      <Icons.Delete className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center">
          <div className="flex gap-3">
             <button onClick={handleHoldOrder} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm active:scale-95 transition-transform">
                <Icons.Order className="w-4 h-4 mr-2 text-orange-500" />
                挂单 (F6)
                <span className="ml-2 bg-orange-100 text-orange-800 text-xs px-1.5 rounded-full">3</span>
             </button>
             <button onClick={handleMember} className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 shadow-sm active:scale-95 transition-transform">
                <Icons.Users className="w-4 h-4 mr-2 text-blue-500" />
                会员 (F8)
             </button>
          </div>
          <div className="text-sm text-gray-500">
            商品总数: <span className="font-bold text-gray-900">3</span> | 件数: <span className="font-bold text-gray-900">56</span>
          </div>
        </div>
      </div>

      {/* Right: Payment & Summary */}
      <div className="w-96 flex flex-col gap-4">
        <div className="bg-primary-600 rounded-xl p-6 text-white shadow-lg shadow-primary-500/30 flex flex-col justify-between h-48 relative overflow-hidden">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="relative z-10">
            <p className="text-primary-100 text-sm font-medium mb-1">应收金额</p>
            <h2 className="text-5xl font-bold tracking-tight">¥ {totalAmount.toFixed(2)}</h2>
          </div>
          <div className="relative z-10">
             <div className="flex justify-between items-end border-t border-white/20 pt-4 mt-2">
               <span className="text-sm text-primary-100">优惠金额</span>
               <span className="text-xl font-semibold">¥ 0.00</span>
             </div>
          </div>
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-6 flex flex-col">
          <h3 className="text-lg font-bold text-gray-900 mb-4">支付方式</h3>
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button onClick={() => setPaymentMethod('wechat')} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${paymentMethod === 'wechat' ? 'border-2 border-primary-500 bg-primary-50 text-primary-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-icons text-3xl mb-1">qr_code</span>
              <span className="text-sm font-bold">微信支付</span>
            </button>
            <button onClick={() => setPaymentMethod('alipay')} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${paymentMethod === 'alipay' ? 'border-2 border-blue-400 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-icons text-3xl mb-1 text-blue-500">account_balance_wallet</span>
              <span className="text-sm font-medium">支付宝</span>
            </button>
            <button onClick={() => setPaymentMethod('cash')} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${paymentMethod === 'cash' ? 'border-2 border-green-500 bg-green-50 text-green-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-icons text-3xl mb-1 text-green-600">payments</span>
              <span className="text-sm font-medium">现金</span>
            </button>
            <button onClick={() => setPaymentMethod('card')} className={`flex flex-col items-center justify-center p-4 border rounded-xl transition-all ${paymentMethod === 'card' ? 'border-2 border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <span className="material-icons text-3xl mb-1 text-purple-500">credit_card</span>
              <span className="text-sm font-medium">银行卡</span>
            </button>
          </div>

          <div className="mt-auto">
            <button className="w-full py-4 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xl font-bold shadow-lg shadow-primary-500/20 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]">
              <Icons.Print className="w-6 h-6" />
              收款并打印 (Enter)
            </button>
            <button className="w-full mt-3 py-3 text-gray-500 hover:text-red-500 text-sm font-medium transition-colors">
              取消交易 (Esc)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};