
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Product, Page } from '../types';

interface ProductListProps {
  setPage: (page: Page) => void;
}

const mockProducts: Product[] = [
  { id: '1', name: '304不锈钢六角螺栓', sku: 'BM-304-M8-50', category: '紧固件', specs: 'M8×50mm', unit: '个', stock: 5200, price: 0.45, location: 'A-05-3-02', image: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=150&h=150&fit=crop', status: 'normal' },
  { id: '2', name: 'PVC排水管', sku: 'PVC-DN110-W', category: '管材', specs: '外径110mm', unit: '根', stock: 45, price: 18.50, location: 'B-01-1-G', image: 'https://images.unsplash.com/photo-1579730230230-05e839e9477e?w=150&h=150&fit=crop', status: 'low_stock' },
  { id: '3', name: '立邦内墙乳胶漆', sku: 'PN-18L-W', category: '涂料', specs: '18L/象牙白', unit: '桶', stock: 82, price: 268.00, location: 'D-02-1-05', image: 'https://images.unsplash.com/photo-1562259920-47afc305f369?w=150&h=150&fit=crop', status: 'normal' },
  { id: '4', name: '工业级美工刀', sku: 'TK-2023-L', category: '工具', specs: 'SK5钢', unit: '把', stock: 240, price: 12.00, location: 'E-04-2-01', image: 'https://images.unsplash.com/photo-1598285934572-c28742b7879f?w=150&h=150&fit=crop', status: 'normal' },
  { id: '5', name: 'BV单股铜芯线', sku: 'BV-2.5-RED', category: '电工电气', specs: '2.5平方/红色', unit: '卷', stock: 15, price: 125.00, location: 'C-03-1-08', image: 'https://images.unsplash.com/photo-1558317374-a3594743e42b?w=150&h=150&fit=crop', status: 'low_stock' },
];

// Internal Category Tree Component for Sidebar
const CategoryTree = ({ onSelect }: { onSelect: (id: string) => void }) => {
    const categories = [
        { id: 'all', name: '全部分类', count: 1240, icon: Icons.List },
        { id: 'fastener', name: '紧固件', count: 450, icon: Icons.Disc },
        { id: 'tools', name: '五金工具', count: 320, icon: Icons.Hammer }, // Using generic icon
        { id: 'pipe', name: '管材管件', count: 180, icon: Icons.Circle },
        { id: 'electric', name: '电工电气', count: 150, icon: Icons.Zap }, // Using generic icon concept
        { id: 'paint', name: '涂料化工', count: 80, icon: Icons.Palette }, // Using generic icon
    ];

    const [activeId, setActiveId] = useState('all');

    return (
        <div className="py-2">
            {categories.map(cat => (
                <button
                    key={cat.id}
                    onClick={() => { setActiveId(cat.id); onSelect(cat.id); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 mb-1 rounded-lg text-sm transition-colors ${
                        activeId === cat.id 
                        ? 'bg-primary-50 text-primary-700 font-bold' 
                        : 'text-gray-600 hover:bg-gray-50'
                    }`}
                >
                    <div className="flex items-center gap-3">
                        {/* Fallback icon handling if specific icon doesn't exist in map */}
                        <cat.icon className={`w-4 h-4 ${activeId === cat.id ? 'text-primary-600' : 'text-gray-400'}`}/>
                        {cat.name}
                    </div>
                    <span className={`text-xs ${activeId === cat.id ? 'text-primary-500' : 'text-gray-400'}`}>{cat.count}</span>
                </button>
            ))}
        </div>
    );
};

export const ProductList: React.FC<ProductListProps> = ({ setPage }) => {
  const [activeCategory, setActiveCategory] = useState('all');
  
  // KPI Cards Data - Focused on Master Data Health (Not Inventory)
  const kpiCards = [
      { id: 'total', label: '商品档案总数', value: '1,240', icon: Icons.Package, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' },
      { id: 'new', label: '本月新建档案', value: '35', icon: Icons.PlusSquare, color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' },
      { id: 'incomplete', label: '资料不全 (无图/无码)', value: '12', icon: Icons.Image, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
      { id: 'inactive', label: '已下架/停售', value: '58', icon: Icons.Ban, color: 'text-gray-600', bg: 'bg-gray-100', border: 'border-gray-200' },
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in space-y-6">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shrink-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">商品档案管理 (MDM)</h2>
          <p className="text-sm text-gray-500 mt-1">集中管理商品基础信息、规格属性、价格体系及条码。</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 shadow-sm transition-colors">
            <Icons.Upload className="w-4 h-4 mr-2 text-gray-500" />
            Excel 导入
          </button>
          <button 
            onClick={() => setPage(Page.PRODUCT_ENTRY)}
            className="flex items-center px-5 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-transform active:scale-95"
          >
            <Icons.Plus className="w-4 h-4 mr-2" />
            新建商品档案
          </button>
        </div>
      </div>

      {/* Quick Access Cards - MDM Focused */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
          {kpiCards.map(card => (
              <div key={card.id} className={`bg-white p-4 rounded-xl border ${card.border} shadow-sm flex items-center justify-between cursor-pointer hover:shadow-md transition-all`}>
                  <div>
                      <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{card.label}</p>
                      <p className="text-2xl font-black text-gray-900 mt-1">{card.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${card.bg} ${card.color}`}>
                      <card.icon className="w-6 h-6"/>
                  </div>
              </div>
          ))}
      </div>

      {/* Main Content: Sidebar + Table */}
      <div className="flex gap-6 h-full overflow-hidden">
          
          {/* Left Sidebar: Category Tree */}
          <div className="w-64 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0">
              <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-gray-800 text-sm">品类导航</h3>
                  <button onClick={() => setPage(Page.CATEGORY_MGMT)} className="text-xs text-primary-600 hover:underline">管理</button>
              </div>
              <div className="flex-1 overflow-y-auto px-2 custom-scrollbar">
                  <CategoryTree onSelect={setActiveCategory} />
              </div>
          </div>

          {/* Right Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex-1 flex flex-col overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-wrap items-center gap-4">
                <div className="relative flex-1 min-w-[300px]">
                  <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="输入商品名称、SKU、条码搜索..."
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all shadow-sm"
                  />
                </div>
                
                <div className="flex gap-3">
                    <select className="px-4 py-2 border border-gray-200 bg-white rounded-lg text-sm text-gray-700 font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 cursor-pointer min-w-[120px] shadow-sm hover:border-gray-300 transition-colors">
                      <option>所有状态</option>
                      <option>正常销售</option>
                      <option>仅采购</option>
                      <option>已停售</option>
                    </select>
                    
                    <button className="px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 flex items-center gap-2">
                        <Icons.Filter className="w-4 h-4"/> 筛选
                    </button>
                </div>
            </div>

            {/* Data Table */}
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider sticky top-0 z-10 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-4 w-20 text-center">图片</th>
                    <th className="px-6 py-4">商品定义 (名称/编码)</th>
                    <th className="px-6 py-4">规格属性</th>
                    <th className="px-6 py-4 text-right">参考进价</th>
                    <th className="px-6 py-4 text-right">标准售价</th>
                    <th className="px-6 py-4">首选供应商</th>
                    <th className="px-6 py-4 text-center">状态</th>
                    <th className="px-6 py-4 text-right">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 text-sm">
                  {mockProducts.map((product) => (
                    <tr 
                      key={product.id} 
                      onClick={() => setPage(Page.PRODUCT_ENTRY)}
                      className="hover:bg-gray-50 transition-all group cursor-pointer"
                    >
                      <td className="px-6 py-4">
                        <div className="h-10 w-10 rounded bg-white border border-gray-200 flex items-center justify-center overflow-hidden shadow-sm">
                          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 group-hover:text-primary-600 transition-colors">{product.name}</span>
                          <span className="text-xs text-gray-400 font-mono mt-0.5 font-medium">{product.sku}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1 items-start">
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                            {product.category}
                          </span>
                          <span className="text-gray-500 text-xs font-medium">{product.specs}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right font-mono text-gray-500 text-xs">
                        ***.**
                      </td>
                      <td className="px-6 py-4 text-right">
                        <span className="font-mono font-bold text-gray-900">¥ {product.price.toFixed(2)}</span>
                        <span className="text-xs text-gray-400 ml-1">/{product.unit}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-xs text-gray-600 truncate max-w-[120px] block">金固五金制品...</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> 正常
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={(e) => { e.stopPropagation(); setPage(Page.PRODUCT_ENTRY); }}
                            className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                            title="编辑档案"
                          >
                            <Icons.FileEdit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); }}
                            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                            title="打印条码" 
                          >
                            <Icons.Tags className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Pagination Footer */}
            <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
                <span className="text-xs text-gray-500 font-medium">显示 1-5 共 1,240 条档案</span>
                <div className="flex gap-1">
                    <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50 disabled:opacity-50">上一页</button>
                    <button className="px-3 py-1 bg-primary-600 border border-primary-600 rounded text-xs text-white font-bold">1</button>
                    <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">2</button>
                    <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">...</button>
                    <button className="px-3 py-1 bg-white border border-gray-200 rounded text-xs text-gray-600 hover:bg-gray-50">下一页</button>
                </div>
            </div>
          </div>
      </div>
    </div>
  );
};
