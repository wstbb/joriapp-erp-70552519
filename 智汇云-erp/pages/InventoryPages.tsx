
import React, { useState } from 'react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage: (page: Page) => void;
}

export const InventoryList: React.FC<PageProps> = ({ setPage }) => {
  const [filterMode, setFilterMode] = useState<'all' | 'alert' | 'out_of_stock' | 'dead_stock'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Mock Inventory Data
  const items = [
    { id: '1', name: '304不锈钢六角螺栓 M8', sku: 'BOLT-304-M8-40', spec: 'M8 x 40mm', loc: 'A-01-02', total: 5200, avail: 4500, safetyStock: 1000, img: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=150&h=150&fit=crop', category: '紧固件', status: 'healthy', lastCount: '2023-10-01' },
    { id: '2', name: '冲击钻 20V 无刷', sku: 'PTL-DR-20V-PRO', spec: '20V Max / Kit', loc: 'B-03-12-1', total: 15, avail: 2, safetyStock: 20, alert: true, img: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=150&h=150&fit=crop', category: '电动工具', status: 'low', lastCount: '2023-10-25' },
    { id: '3', name: '活动扳手 8寸', sku: 'HTL-WR-ADJ-08', spec: '8 inch / 200mm', loc: '华东-C02', total: 1200, avail: 1150, safetyStock: 100, img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=150&h=150&fit=crop', category: '手动工具', status: 'healthy', lastCount: '2023-09-15' },
    { id: '4', name: 'PVC排水管 DN110', sku: 'PVC-PIPE-110', spec: 'DN110 x 4m', loc: 'D-05-01', total: 0, avail: 0, safetyStock: 50, img: 'https://images.unsplash.com/photo-1579730230230-05e839e9477e?w=150&h=150&fit=crop', category: '管材', status: 'out', lastCount: '2023-10-20' },
    { id: '5', name: '陈旧库存-防尘口罩', sku: 'MSK-KN95-OLD', spec: 'KN95 / 盒', loc: 'Z-99-01', total: 5000, avail: 5000, safetyStock: 0, img: 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=150&h=150&fit=crop', category: '劳保', status: 'dead', lastCount: '2023-01-10' },
  ];

  const filteredItems = items.filter(item => {
      let matchesFilter = true;
      if (filterMode === 'alert') matchesFilter = item.avail < item.safetyStock && item.avail > 0;
      if (filterMode === 'out_of_stock') matchesFilter = item.avail === 0;
      if (filterMode === 'dead_stock') matchesFilter = item.status === 'dead';
      
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || item.sku.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesFilter && matchesSearch;
  });

  // Mock KPI Statistics
  const stats = {
      totalSku: 1245,
      totalValue: 2458000,
      stockHealth: {
          healthy: 1100,
          low: 85, // Alert
          out: 12, // Out of stock
          dead: 48 // Dead stock / Overstock
      },
      flow: {
          inbound: 15, // Orders waiting to be received
          outbound: 23, // Orders waiting to be shipped
      },
      audit: {
          urgent: 35, // Items not counted in > 90 days
          coverage: 92 // %
      }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] flex-col gap-6 animate-fade-in">
      
      {/* 1. Inventory Summary Dashboard (Top Section) */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 shrink-0">
          
          {/* Card 1: Asset Value Overview */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
              <div className="flex justify-between items-start z-10">
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">库存总资产</p>
                      <h3 className="text-2xl font-black text-gray-900 mt-1">¥ 245.8<span className="text-sm font-medium text-gray-500 ml-1">万</span></h3>
                  </div>
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Banknote className="w-5 h-5"/></div>
              </div>
              <div className="mt-4 z-10">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>总SKU数</span>
                      <span className="font-bold text-gray-800">{stats.totalSku.toLocaleString()}</span>
                  </div>
                  <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                      <div className="bg-blue-500 h-full w-[75%]"></div>
                  </div>
              </div>
              <div className="absolute -right-6 -bottom-6 text-blue-50 opacity-50"><Icons.Package className="w-32 h-32"/></div>
          </div>

          {/* Card 2: Stock Health (Interactive Filter) */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between lg:col-span-2">
              <div className="flex justify-between items-center mb-2">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <Icons.Activity className="w-5 h-5 text-primary-600"/> 库存健康分布
                  </h3>
                  <span className="text-xs text-gray-400">点击色块快速筛选</span>
              </div>
              
              <div className="flex gap-4 items-end">
                  {/* Healthy */}
                  <div 
                    onClick={() => setFilterMode('all')}
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${filterMode === 'all' ? 'bg-gray-100 border-gray-300 ring-1 ring-gray-300' : 'bg-gray-50 border-gray-100 hover:border-gray-300'}`}
                  >
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-green-500"></span>
                          <span className="text-xs text-gray-500 font-bold">健康</span>
                      </div>
                      <p className="text-xl font-black text-gray-900">{stats.stockHealth.healthy}</p>
                  </div>

                  {/* Low Stock (Warning) */}
                  <div 
                    onClick={() => setFilterMode('alert')}
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${filterMode === 'alert' ? 'bg-orange-50 border-orange-300 ring-1 ring-orange-300' : 'bg-white border-gray-200 hover:border-orange-300'}`}
                  >
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          <span className="text-xs text-orange-600 font-bold">预警补货</span>
                      </div>
                      <p className="text-xl font-black text-orange-600">{stats.stockHealth.low}</p>
                  </div>

                  {/* Out of Stock (Critical) */}
                  <div 
                    onClick={() => setFilterMode('out_of_stock')}
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${filterMode === 'out_of_stock' ? 'bg-red-50 border-red-300 ring-1 ring-red-300' : 'bg-white border-gray-200 hover:border-red-300'}`}
                  >
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-red-600"></span>
                          <span className="text-xs text-red-600 font-bold">已缺货</span>
                      </div>
                      <p className="text-xl font-black text-red-600">{stats.stockHealth.out}</p>
                  </div>

                  {/* Dead Stock */}
                  <div 
                    onClick={() => setFilterMode('dead_stock')}
                    className={`flex-1 p-3 rounded-lg border cursor-pointer transition-all ${filterMode === 'dead_stock' ? 'bg-gray-100 border-gray-400 ring-1 ring-gray-400' : 'bg-white border-gray-200 hover:border-gray-400'}`}
                  >
                      <div className="flex items-center gap-2 mb-1">
                          <span className="w-2 h-2 rounded-full bg-gray-400"></span>
                          <span className="text-xs text-gray-500 font-bold">呆滞积压</span>
                      </div>
                      <p className="text-xl font-black text-gray-600">{stats.stockHealth.dead}</p>
                  </div>
              </div>
          </div>

          {/* Card 3: Action Required */}
          <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col justify-between">
              <div>
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">待办事项</p>
                  <div className="mt-3 space-y-3">
                      <div 
                        onClick={() => setPage(Page.INVENTORY_CHECK)}
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1.5 -mx-1.5 rounded transition-colors group"
                      >
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Icons.ClipboardCheck className="w-4 h-4 text-purple-500"/> 急需盘点
                          </span>
                          <span className="text-sm font-bold text-purple-600 group-hover:underline">{stats.audit.urgent} SKU</span>
                      </div>
                      <div className="w-full h-px bg-gray-100"></div>
                      <div 
                        onClick={() => setPage(Page.SCAN_INBOUND)}
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1.5 -mx-1.5 rounded transition-colors group"
                      >
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Icons.ArrowDownLeft className="w-4 h-4 text-blue-500"/> 待入库
                          </span>
                          <span className="text-sm font-bold text-gray-900 group-hover:text-blue-600 group-hover:underline">{stats.flow.inbound} 单</span>
                      </div>
                      <div 
                        onClick={() => setPage(Page.SALES_OUTBOUND)}
                        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-1.5 -mx-1.5 rounded transition-colors group"
                      >
                          <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                              <Icons.ArrowUpRight className="w-4 h-4 text-orange-500"/> 待出库
                          </span>
                          <span className="text-sm font-bold text-gray-900 group-hover:text-orange-600 group-hover:underline">{stats.flow.outbound} 单</span>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      {/* 2. Detailed List Filter & Search */}
      <section className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row gap-4 items-center justify-between bg-gray-50/50">
              <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm text-sm font-bold text-gray-700">
                      {filterMode === 'all' && '全部库存'}
                      {filterMode === 'alert' && <span className="text-orange-600 flex items-center gap-1"><Icons.AlertTriangle className="w-4 h-4"/> 预警商品列表</span>}
                      {filterMode === 'out_of_stock' && <span className="text-red-600 flex items-center gap-1"><Icons.Ban className="w-4 h-4"/> 缺货商品列表</span>}
                      {filterMode === 'dead_stock' && <span className="text-gray-600 flex items-center gap-1"><Icons.Archive className="w-4 h-4"/> 呆滞积压列表</span>}
                  </div>
                  <div className="h-6 w-px bg-gray-300"></div>
                  <div className="relative">
                      <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                      <input 
                        type="text" 
                        value={searchTerm} 
                        onChange={(e) => setSearchTerm(e.target.value)} 
                        placeholder="搜索 SKU / 名称 / 货位..." 
                        className="w-64 pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white transition-all"
                      />
                  </div>
              </div>
              
              <div className="flex gap-2">
                  <button onClick={() => setPage(Page.INVENTORY_CHECK)} className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                      <Icons.ClipboardCheck className="w-4 h-4" /> 发起盘点
                  </button>
                  <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 shadow-sm transition-colors">
                      <Icons.Download className="w-4 h-4" /> 导出
                  </button>
              </div>
          </div>

          <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200 font-semibold uppercase text-xs tracking-wider sticky top-0 z-10">
                  <tr>
                    <th className="px-6 py-4">商品信息</th>
                    <th className="px-6 py-4">分类</th>
                    <th className="px-6 py-4">仓库位置</th>
                    <th className="px-6 py-4 text-right">现有库存</th>
                    <th className="px-6 py-4 text-center">状态</th>
                    <th className="px-6 py-4 text-right">上次盘点</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredItems.map((item) => {
                    return (
                      <tr 
                        key={item.id} 
                        onClick={() => setPage(Page.INVENTORY_HISTORY_DETAIL)}
                        className="hover:bg-gray-50 group transition-colors cursor-pointer"
                      >
                        <td className="px-6 py-4 flex gap-3">
                          <div className="relative w-10 h-10 shrink-0">
                              <img src={item.img} className="w-10 h-10 rounded border border-gray-200 object-cover"/>
                              {item.avail === 0 && <div className="absolute inset-0 bg-black/50 rounded flex items-center justify-center text-white text-[10px] font-bold backdrop-blur-[1px]">缺货</div>}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{item.name}</div>
                            <div className="text-xs text-gray-400 font-mono uppercase">{item.sku}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                            <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">{item.category}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-gray-700 font-medium">{item.loc}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                            <div className="flex flex-col items-end">
                                <span className={`font-mono font-bold text-base ${item.avail === 0 ? 'text-red-500' : item.avail < item.safetyStock ? 'text-orange-500' : 'text-gray-900'}`}>
                                    {item.avail.toLocaleString()}
                                </span>
                                <span className="text-[10px] text-gray-400">安全线: {item.safetyStock}</span>
                            </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          {item.avail === 0 ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                                  <Icons.Ban className="w-3 h-3"/> 缺货
                              </span>
                          ) : item.avail < item.safetyStock ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                                  <Icons.AlertTriangle className="w-3 h-3"/> 预警
                              </span>
                          ) : item.status === 'dead' ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  <Icons.Archive className="w-3 h-3"/> 呆滞
                              </span>
                          ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-700 border border-green-200">
                                  <Icons.Check className="w-3 h-3"/> 正常
                              </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right text-xs text-gray-500">
                            {item.lastCount}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {item.avail < item.safetyStock && (
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setPage(Page.PURCHASE_PLAN); }} 
                                    className="px-2 py-1 bg-primary-50 text-primary-600 text-xs font-bold rounded border border-primary-100 hover:bg-primary-100 transition-colors"
                                >
                                    补货
                                </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); }} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded-lg transition-colors">
                              <Icons.MoreHorizontal className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
          </div>
      </section>
    </div>
  );
};

export const InventoryHistory: React.FC<PageProps> = ({ setPage }) => {
    // ... (Keep existing implementation of InventoryHistory)
    // Redacting for brevity as no changes requested here, but normally would include full content.
    // Assuming previous content is preserved. To be safe, I'll include the full content below.
    const transactions = [
        {
            time: '2023-10-24 10:30:45',
            product: { name: '304不锈钢六角螺栓', spec: 'M12×50mm | DIN933', img: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=100&h=100&fit=crop' },
            warehouse: '主仓库',
            type: '采购入库',
            typeColor: 'bg-green-100 text-green-800',
            refDoc: 'PO-20231024-001',
            pre: 1000,
            change: 5000,
            post: 6000,
            cost: '¥0.45',
            operator: '李明',
            operatorInitial: '李',
            operatorColor: 'bg-blue-100 text-blue-600',
            note: '季度常规补货，供应商A'
        },
        {
            time: '2023-10-24 14:15:22',
            product: { name: '工业级活动扳手', spec: '10寸 | 铬钒钢', img: 'https://images.unsplash.com/photo-1586864387967-d02ef85d93e8?w=100&h=100&fit=crop' },
            warehouse: '城北分仓',
            type: '销售出库',
            typeColor: 'bg-blue-100 text-blue-800',
            refDoc: 'SO-20231024-055',
            pre: 200,
            change: -50,
            post: 150,
            cost: '¥28.00',
            operator: '张伟',
            operatorInitial: '张',
            operatorColor: 'bg-purple-100 text-purple-600',
            note: '客户自提，加急单'
        },
        {
            time: '2023-10-23 09:05:11',
            product: { name: 'BV铜芯电线', spec: '2.5平方 | 红色 | 100米/卷', img: 'https://images.unsplash.com/photo-1558317374-a3594743e42b?w=100&h=100&fit=crop' },
            warehouse: '主仓库',
            type: '调拨出库',
            typeColor: 'bg-amber-100 text-amber-800',
            refDoc: 'TR-20231023-002',
            pre: 500,
            change: -100,
            post: 400,
            cost: '¥145.00',
            operator: '李明',
            operatorInitial: '李',
            operatorColor: 'bg-blue-100 text-blue-600',
            note: '调往城北分仓'
        },
        {
            time: '2023-10-22 16:45:00',
            product: { name: '抛光瓷砖', spec: '800*800mm | 浅灰', img: 'https://images.unsplash.com/photo-1620612948622-921370423c21?w=100&h=100&fit=crop' },
            warehouse: '次品暂存库',
            type: '报损出库',
            typeColor: 'bg-red-100 text-red-800',
            refDoc: 'DM-20231022-001',
            pre: 12,
            change: -5,
            post: 7,
            cost: '¥45.00',
            operator: '王强',
            operatorInitial: '王',
            operatorColor: 'bg-green-100 text-green-600',
            note: '搬运破碎，不可修复'
        },
        {
            time: '2023-10-21 11:00:00',
            product: { name: '镀锌钢管', spec: 'DN25 | 3.0mm壁厚', img: 'https://images.unsplash.com/photo-1535205504780-2646d6b83f0c?w=100&h=100&fit=crop' },
            warehouse: '城北分仓',
            type: '库存盘盈',
            typeColor: 'bg-indigo-100 text-indigo-800',
            refDoc: 'IV-20231021-009',
            pre: 340,
            change: 10,
            post: 350,
            cost: '¥55.00',
            operator: '张伟',
            operatorInitial: '张',
            operatorColor: 'bg-purple-100 text-purple-600',
            note: '月底盘点发现多余库存'
        },
    ];

    const handleDocClick = (docNo: string) => {
        if (docNo.startsWith('PO')) {
            setPage(Page.INBOUND_DETAIL);
        } else if (docNo.startsWith('SO')) {
            setPage(Page.OUTBOUND_DETAIL);
        } else if (docNo.startsWith('TR')) {
            setPage(Page.STOCK_TRANSFER_DETAIL);
        } else if (docNo.startsWith('IV') || docNo.startsWith('PD')) {
            setPage(Page.INVENTORY_CHECK);
        } else if (docNo.startsWith('DM')) {
            alert(`查看报损单详情: ${docNo}`);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] w-full animate-fade-in space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
                <div>
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                        <span onClick={() => setPage(Page.DASHBOARD)} className="hover:text-primary-600 cursor-pointer">首页</span>
                        <Icons.ChevronRight className="w-3 h-3" />
                        <span onClick={() => setPage(Page.INVENTORY_LIST)} className="hover:text-primary-600 cursor-pointer">库存管理</span>
                        <Icons.ChevronRight className="w-3 h-3" />
                        <span className="text-primary-600 font-medium">库存变动明细账</span>
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900">全局库存变动流水明细账</h1>
                    <p className="text-sm text-gray-500 mt-1">
                        追踪所有仓库的实时进销存流水记录与审计详情
                    </p>
                </div>
                <div className="flex gap-3">
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors shadow-sm text-gray-700">
                        <Icons.Print className="w-4 h-4" /> 打印报表
                    </button>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-colors">
                        <Icons.Download className="w-4 h-4" /> 导出审计 Excel
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">今日物料吞吐</p>
                            <h3 className="text-lg font-black text-gray-900 mt-1">8,950 <span className="text-xs font-normal text-gray-400">件</span></h3>
                        </div>
                        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Icons.Transfer className="w-5 h-5"/></div>
                    </div>
                    <div className="flex items-center justify-between text-xs mt-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                            <span className="text-gray-600">入: <span className="font-bold text-green-600">+5,200</span></span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-orange-500"></span>
                            <span className="text-gray-600">出: <span className="font-bold text-orange-600">-3,750</span></span>
                        </div>
                    </div>
                    <div className="w-full bg-gray-100 h-1.5 rounded-full mt-2 overflow-hidden flex">
                        <div className="h-full bg-green-500" style={{width: '58%'}}></div>
                        <div className="h-full bg-orange-500" style={{width: '42%'}}></div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">高频异动品类</p>
                            <h3 className="text-lg font-black text-gray-900 mt-1">紧固件类</h3>
                        </div>
                        <div className="p-2 bg-purple-50 text-purple-600 rounded-lg"><Icons.Activity className="w-5 h-5"/></div>
                    </div>
                    <div className="mt-3">
                        <p className="text-xs text-gray-500">占今日变动总量的 <span className="font-bold text-purple-600">65%</span></p>
                        <div className="flex gap-1 mt-2">
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">螺栓</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">垫片</span>
                            <span className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">+3</span>
                        </div>
                    </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-4 rounded-xl shadow-md text-white flex flex-col justify-between relative overflow-hidden group cursor-pointer hover:shadow-lg transition-all" onClick={() => setPage(Page.INBOUND_DETAIL)}>
                    <div className="absolute right-0 top-0 w-24 h-24 bg-white/10 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <div className="flex justify-between items-start relative z-10">
                        <div>
                            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wider flex items-center gap-1"><Icons.BellRing className="w-3 h-3"/> 大宗入库提醒</p>
                            <h3 className="text-lg font-black mt-1">PO-20231024</h3>
                        </div>
                    </div>
                    <div className="mt-3 relative z-10">
                        <p className="text-xs text-indigo-100">单笔入库 <span className="font-bold text-white text-sm">5,000</span> 件</p>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/20">
                            <span className="text-[10px] text-indigo-200">10:30 AM • 李明</span>
                            <span className="text-[10px] font-bold bg-white/20 px-2 py-0.5 rounded hover:bg-white/30 transition-colors">查看详情 &rarr;</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">损益监控 (本周)</p>
                            <h3 className="text-lg font-black text-red-600 mt-1">- ¥ 45.00</h3>
                        </div>
                        <div className="p-2 bg-red-50 text-red-600 rounded-lg"><Icons.AlertCircle className="w-5 h-5"/></div>
                    </div>
                    <div className="mt-2 space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">报损 (Damaged)</span>
                            <span className="font-mono text-gray-900">3 件</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500">盘亏 (Loss)</span>
                            <span className="font-mono text-gray-900">2 件</span>
                        </div>
                        <div className="w-full bg-gray-100 h-1 rounded-full overflow-hidden">
                            <div className="h-full bg-red-500" style={{width: '15%'}}></div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 shrink-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    <div className="col-span-1 lg:col-span-2 xl:col-span-2">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">变动日期范围</label>
                        <div className="relative flex items-center">
                            <Icons.Calendar className="absolute left-3 text-gray-400 w-4 h-4" />
                            <input className="w-full pl-10 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none transition-shadow text-gray-900" placeholder="选择日期范围" type="text" defaultValue="2023-10-01 - 2023-10-31"/>
                        </div>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">仓库</label>
                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer text-gray-900">
                            <option value="">全部仓库</option>
                            <option value="1">主仓库 (Main)</option>
                            <option value="2">城北分仓 (North)</option>
                            <option value="3">次品暂存库 (Defect)</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">变动类型</label>
                        <select className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none cursor-pointer text-gray-900">
                            <option value="">全部类型</option>
                            <option value="in_purchase">采购入库</option>
                            <option value="out_sales">销售出库</option>
                            <option value="transfer">调拨入/出</option>
                            <option value="audit_gain">盘盈</option>
                            <option value="audit_loss">盘亏</option>
                            <option value="damage">报损</option>
                        </select>
                    </div>
                    <div className="col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">操作员</label>
                        <input className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900" placeholder="输入姓名/工号" type="text"/>
                    </div>
                    <div className="col-span-1 xl:col-span-1">
                        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase">商品搜索</label>
                        <div className="relative">
                            <Icons.Search className="absolute right-3 top-2.5 text-gray-400 w-4 h-4 cursor-pointer hover:text-primary-600" />
                            <input className="w-full pl-3 pr-9 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none text-gray-900" placeholder="SKU/名称/规格" type="text"/>
                        </div>
                    </div>
                </div>
                <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-100">
                    <button className="px-4 py-1.5 text-sm text-gray-500 hover:text-primary-600 transition-colors">重置筛选</button>
                    <button className="px-6 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all flex items-center gap-2">
                        <Icons.Filter className="w-4 h-4" /> 查询记录
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col flex-1 overflow-hidden min-h-[400px]">
                <div className="overflow-auto flex-1 relative custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 backdrop-blur-sm shadow-sm">
                            <tr>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 w-40">变动时间</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 min-w-[240px]">商品信息 (规格/材质)</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200">所属仓库</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-center">变动类型</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200">关联单据</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-right">变动前</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-right">变动数量</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-right">变动后</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 text-right">成本单价</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200">操作人</th>
                                <th className="px-4 py-3 whitespace-nowrap border-b border-gray-200 min-w-[150px]">备注</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {transactions.map((tx, idx) => (
                                <tr key={idx} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-4 py-3 text-gray-500 whitespace-nowrap font-mono text-xs">{tx.time}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-start gap-3">
                                            <div className="h-10 w-10 rounded bg-gray-100 flex-shrink-0 overflow-hidden relative border border-gray-200">
                                                <img src={tx.product.img} alt={tx.product.name} className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <div className="font-bold text-gray-900">{tx.product.name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{tx.product.spec}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-900">{tx.warehouse}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${tx.typeColor}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${
                                                tx.type === '销售出库' ? 'bg-rose-500' :
                                                tx.type === '采购入库' ? 'bg-emerald-500' :
                                                tx.type === '库内调拨' ? 'bg-blue-500' :
                                                'bg-amber-500'
                                            }`}></span>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <button 
                                            onClick={() => handleDocClick(tx.refDoc)}
                                            className="text-primary-600 hover:text-primary-800 hover:underline decoration-dotted underline-offset-2 font-mono text-xs font-medium"
                                        >
                                            {tx.refDoc}
                                        </button>
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-500">{tx.pre.toLocaleString()}</td>
                                    <td className={`px-4 py-3 text-right font-bold font-mono ${tx.change > 0 ? 'text-green-600' : 'text-red-500'}`}>
                                        {tx.change > 0 ? '+' : ''}{tx.change.toLocaleString()}
                                    </td>
                                    <td className="px-4 py-3 text-right font-mono font-medium text-gray-900">{tx.post.toLocaleString()}</td>
                                    <td className="px-4 py-3 text-right font-mono text-gray-500">{tx.cost}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${tx.operatorColor}`}>
                                                {tx.operatorInitial}
                                            </div>
                                            <span className="text-gray-900">{tx.operator}</span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-gray-500 text-xs truncate max-w-[200px]" title={tx.note}>{tx.note}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="border-t border-gray-200 p-4 bg-gray-50 flex flex-col md:flex-row items-center justify-between gap-4 shrink-0">
                    <div className="flex flex-wrap items-center gap-6 text-sm">
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">本页入库:</span>
                            <span className="font-bold text-green-600 font-mono text-base">+5,010</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300"></div>
                        <div className="flex items-center gap-2">
                            <span className="text-gray-500">本页出库:</span>
                            <span className="font-bold text-red-600 font-mono text-base">-155</span>
                        </div>
                        <div className="h-4 w-px bg-gray-300 hidden lg:block"></div>
                        <div className="flex items-center gap-2 hidden lg:flex">
                            <span className="text-gray-500">筛选累计金额变动:</span>
                            <span className="font-bold text-gray-900 font-mono">+¥48,220.00</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500 mr-2">共 1,248 条记录</span>
                        <div className="flex items-center rounded-lg border border-gray-200 bg-white overflow-hidden shadow-sm">
                            <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 border-r border-gray-200 disabled:opacity-50">
                                <Icons.ArrowLeft className="w-4 h-4" />
                            </button>
                            <button className="px-3 py-1.5 bg-primary-600 text-white text-sm font-bold">1</button>
                            <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm font-medium">2</button>
                            <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm font-medium">3</button>
                            <span className="px-2 text-gray-400 text-xs">...</span>
                            <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 text-sm font-medium">25</button>
                            <button className="px-3 py-1.5 hover:bg-gray-50 text-gray-500 border-l border-gray-200">
                                <Icons.ArrowRight className="w-4 h-4" />
                            </button>
                        </div>
                        <select className="ml-2 px-2 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-gray-700 outline-none focus:ring-1 focus:ring-primary-500 cursor-pointer">
                            <option>20 条/页</option>
                            <option>50 条/页</option>
                            <option>100 条/页</option>
                        </select>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const InventoryHistoryDetail: React.FC<PageProps> = ({ setPage }) => {
    // ... (This function remains unchanged, simply re-declaring to complete the file export as per request format)
    const trendData = [
        { date: '10/01', stock: 4500, safety: 1000 },
        { date: '10/05', stock: 4200, safety: 1000 },
        { date: '10/10', stock: 4800, safety: 1000 },
        { date: '10/15', stock: 5100, safety: 1000 },
        { date: '10/20', stock: 4700, safety: 1000 },
        { date: '10/25', stock: 4300, safety: 1000 },
        { date: '10/31', stock: 5240, safety: 1000 },
    ];

    const transactions = [
        { id: '1', date: '2023-10-25', time: '14:32:10', type: '销售出库', doc: 'SO-20231025-004', user: '王志强 (ZH008)', change: -120, balance: 5240, loc: 'A1 主仓库', locDetail: 'S-04-12' },
        { id: '2', date: '2023-10-24', time: '09:15:44', type: '采购入库', doc: 'PO-20231018-092', user: '李华 (ZH042)', change: 500, balance: 5360, loc: 'A1 主仓库', locDetail: 'S-04-12' },
        { id: '3', date: '2023-10-22', time: '16:50:21', type: '库内调拨', doc: 'TR-20231022-015', user: '系统自动调拨', change: -200, balance: 4860, loc: 'B2 华东分库', locDetail: '至 C3 售后中心' },
        { id: '4', date: '2023-10-20', time: '11:05:00', type: '库存调整', doc: 'AD-20231020-001', user: '管理员 (ADMIN)', change: -5, balance: 5060, loc: 'A1 主仓库', locDetail: '盘亏调整' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-6 animate-fade-in pb-10">
            {/* Breadcrumbs */}
            <nav className="flex items-center gap-2 text-sm text-gray-500">
                <button onClick={() => setPage(Page.DASHBOARD)} className="hover:text-primary-600 transition-colors">库存首页</button>
                <Icons.ChevronRight className="w-3 h-3" />
                <button onClick={() => setPage(Page.INVENTORY_LIST)} className="hover:text-primary-600 transition-colors">紧固件</button>
                <Icons.ChevronRight className="w-3 h-3" />
                <span className="text-gray-900 font-medium">交易历史</span>
            </nav>

            {/* Product Header */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-6">
                    <div className="w-24 h-24 rounded-lg bg-gray-100 flex items-center justify-center border border-gray-200 overflow-hidden shrink-0">
                        <img alt="Hardware items" className="w-full h-full object-cover" src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=150&h=150&fit=crop" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">M8 不锈钢六角螺栓 (Hex Bolt)</h1>
                        <div className="mt-1 flex flex-wrap gap-4 text-sm">
                            <span className="flex items-center gap-1 text-gray-500"><b className="text-gray-700">SKU:</b> HW-M8-SS-001</span>
                            <span className="flex items-center gap-1 text-gray-500"><b className="text-gray-700">当前总库存:</b> 5,240 件</span>
                            <span className="flex items-center gap-1 text-gray-500"><b className="text-gray-700">单位:</b> 件</span>
                        </div>
                    </div>
                </div>
                <div className="flex gap-3 w-full md:w-auto">
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                        <Icons.FileEdit className="w-4 h-4" /> 编辑商品
                    </button>
                    <button className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-lg shadow-primary-100">
                        <Icons.Download className="w-4 h-4" /> 导出数据
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">日期范围</label>
                        <div className="relative">
                            <Icons.Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                            <input className="w-full pl-10 pr-4 py-2 bg-gray-50 border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none border" type="text" defaultValue="2023-10-01 - 2023-10-31" />
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">事务类型</label>
                        <select className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                            <option>全部交易</option>
                            <option>采购入库 (Inbound)</option>
                            <option>销售出库 (Outbound)</option>
                            <option>库存调拨 (Transfer)</option>
                            <option>库存调整 (Adjustment)</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">选择仓库</label>
                        <select className="w-full py-2 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none">
                            <option>所有分库</option>
                            <option>A1 主仓库</option>
                            <option>B2 华东分拨中心</option>
                            <option>C3 售后备件中心</option>
                        </select>
                    </div>
                    <div className="flex items-end pb-0.5">
                        <button className="w-full py-2 bg-primary-50 text-primary-600 font-semibold rounded-lg text-sm hover:bg-primary-100 transition-colors">
                            应用筛选器
                        </button>
                    </div>
                </div>
            </div>

            {/* Statistics Summary & Trend Chart Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Stats */}
                <div className="lg:col-span-1 space-y-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Icons.PlusCircle className="w-12 h-12 text-emerald-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">期间累计入库</p>
                        <p className="text-3xl font-bold text-emerald-600 mt-2">+1,250 <span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Icons.TrendingUp className="w-3 h-3 text-emerald-500" /> 较上期增长 12%
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Icons.Minus className="w-12 h-12 text-rose-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">期间累计出库</p>
                        <p className="text-3xl font-bold text-rose-600 mt-2">-845 <span className="text-sm font-normal text-gray-400 ml-1">件</span></p>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Icons.TrendingDown className="w-3 h-3 text-rose-500" /> 较上期减少 5%
                        </p>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                            <Icons.Activity className="w-12 h-12 text-blue-500" />
                        </div>
                        <p className="text-sm font-medium text-gray-500">当前库存周转率</p>
                        <p className="text-3xl font-bold text-blue-600 mt-2">4.2 <span className="text-sm font-normal text-gray-400 ml-1">次/年</span></p>
                        <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                            <Icons.CheckCircle2 className="w-3 h-3 text-blue-500" /> 处于健康水平
                        </p>
                    </div>
                </div>

                {/* Trend Chart */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">库存变动趋势 (近30天)</h3>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={trendData}>
                                <defs>
                                    <linearGradient id="colorStock" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#94a3b8'}} />
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <Tooltip 
                                    contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                    cursor={{stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4'}}
                                />
                                <Area type="monotone" dataKey="stock" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorStock)" />
                                <Area type="step" dataKey="safety" stroke="#f87171" strokeWidth={2} strokeDasharray="4 4" fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Transaction List */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                    <h3 className="font-bold text-gray-900">详细变动记录</h3>
                    <button className="text-sm text-primary-600 font-medium hover:underline">查看全部</button>
                </div>
                <table className="w-full text-left text-sm">
                    <thead className="bg-white text-gray-500 border-b border-gray-200 uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 font-medium">日期/时间</th>
                            <th className="px-6 py-3 font-medium">业务类型</th>
                            <th className="px-6 py-3 font-medium">关联单据</th>
                            <th className="px-6 py-3 font-medium text-right">变动数量</th>
                            <th className="px-6 py-3 font-medium text-right">结存</th>
                            <th className="px-6 py-3 font-medium">操作人</th>
                            <th className="px-6 py-3 font-medium">备注/位置</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {transactions.map((tx, i) => (
                            <tr key={i} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{tx.date}</div>
                                    <div className="text-xs text-gray-500">{tx.time}</div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex px-2 py-0.5 rounded text-xs font-bold ${
                                        tx.type === '采购入库' ? 'bg-green-100 text-green-700' :
                                        tx.type === '销售出库' ? 'bg-blue-100 text-blue-700' :
                                        'bg-gray-100 text-gray-700'
                                    }`}>
                                        {tx.type}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono text-gray-600">{tx.doc}</td>
                                <td className={`px-6 py-4 text-right font-bold ${tx.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {tx.change > 0 ? '+' : ''}{tx.change}
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-medium">{tx.balance}</td>
                                <td className="px-6 py-4 text-gray-600">{tx.user}</td>
                                <td className="px-6 py-4 text-gray-500 text-xs">
                                    <div>{tx.loc}</div>
                                    <div className="scale-90 origin-left">{tx.locDetail}</div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
