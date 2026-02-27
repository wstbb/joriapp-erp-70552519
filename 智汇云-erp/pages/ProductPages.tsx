
import React, { useState, useMemo } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Icons } from '../components/Icons';
import { Page } from '../types';

// --- Types for Category Management ---
type AttributeType = 'text' | 'number' | 'select';

interface CategoryAttribute {
    id: string;
    name: string;
    type: AttributeType;
    options?: string;
    required: boolean;
    filterable: boolean;
}

interface Category {
    id: string;
    parentId: string | null;
    name: string;
    code: string;
    sortOrder: number;
    description: string;
    attributes: CategoryAttribute[];
    children?: Category[];
}

const INITIAL_CATEGORIES: Category[] = [
    { 
        id: '1', parentId: null, name: '五金紧固件', code: 'CAT-FASTENER', sortOrder: 10, description: '各类螺栓、螺母、垫片等', 
        attributes: [
            { id: 'a1', name: '材质', type: 'select', options: '304不锈钢,201不锈钢,碳钢,黄铜', required: true, filterable: true },
            { id: 'a2', name: '螺纹规格', type: 'select', options: 'M3,M4,M5,M6,M8,M10,M12', required: true, filterable: true },
            { id: 'a3', name: '长度(mm)', type: 'number', required: true, filterable: false }
        ] 
    },
    { id: '1-1', parentId: '1', name: '螺栓/螺钉', code: 'CAT-BOLT', sortOrder: 1, description: '', attributes: [] },
    { id: '1-2', parentId: '1', name: '螺母/螺帽', code: 'CAT-NUT', sortOrder: 2, description: '', attributes: [] },
    { 
        id: '2', parentId: null, name: '手动工具', code: 'CAT-HANDTOOL', sortOrder: 20, description: '扳手、钳子、螺丝刀', 
        attributes: [
            { id: 'b1', name: '品牌', type: 'text', required: true, filterable: true },
            { id: 'b2', name: '尺寸', type: 'text', required: false, filterable: true }
        ] 
    },
    { id: '2-1', parentId: '2', name: '测量工具', code: 'CAT-MEASURE', sortOrder: 1, description: '卷尺、水平仪', attributes: [] },
];

export const CategoryManagement: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>(INITIAL_CATEGORIES);
  const [selectedId, setSelectedId] = useState<string>('1');
  const [expandedIds, setExpandedIds] = useState<string[]>(['1', '2']);
  const [activeTab, setActiveTab] = useState<'basic' | 'attr'>('attr');

  const categoryTree = useMemo(() => {
      const tree: Category[] = [];
      const map = new Map<string, Category & { children: Category[] }>();
      categories.forEach(cat => map.set(cat.id, { ...cat, children: [] }));
      categories.forEach(cat => {
          const node = map.get(cat.id)!;
          if (cat.parentId && map.has(cat.parentId)) {
              map.get(cat.parentId)!.children.push(node);
          } else {
              tree.push(node);
          }
      });
      const sortNodes = (nodes: Category[]) => {
          nodes.sort((a, b) => a.sortOrder - b.sortOrder);
          nodes.forEach(n => { if (n.children && n.children.length > 0) sortNodes(n.children); });
      };
      sortNodes(tree);
      return tree;
  }, [categories]);

  const selectedCategory = categories.find(c => c.id === selectedId);
  
  const handleAddRootCategory = () => {
      const newId = Date.now().toString();
      setCategories([...categories, { id: newId, parentId: null, name: '新分类', code: 'NEW', sortOrder: 99, description: '', attributes: [] }]);
      setSelectedId(newId);
  };

  const renderTreeItem = (node: Category) => {
      const isExpanded = expandedIds.includes(node.id);
      const isSelected = selectedId === node.id;
      const hasChildren = node.children && node.children.length > 0;
      return (
          <div key={node.id} className="select-none">
              <div onClick={() => setSelectedId(node.id)} className={`flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors text-sm mb-0.5 ${isSelected ? 'bg-primary-50 text-primary-700' : 'hover:bg-gray-50 text-gray-700'}`}>
                  <div onClick={(e) => { e.stopPropagation(); if(hasChildren) setExpandedIds(prev => prev.includes(node.id) ? prev.filter(i => i !== node.id) : [...prev, node.id]); }} className={`w-5 h-5 flex items-center justify-center rounded hover:bg-black/5 transition-colors ${hasChildren ? 'text-gray-400' : 'text-transparent'}`}>
                      {hasChildren && (isExpanded ? <Icons.ChevronDown className="w-3.5 h-3.5"/> : <Icons.ChevronRight className="w-3.5 h-3.5"/>)}
                  </div>
                  <span className={`${isSelected ? 'text-primary-600' : 'text-gray-400'}`}>{node.parentId === null ? <Icons.Category className="w-4 h-4"/> : <div className="w-1.5 h-1.5 rounded-full bg-current opacity-40"></div>}</span>
                  <span className="font-medium truncate flex-1">{node.name}</span>
                  {hasChildren && <span className="text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded">{node.children?.length}</span>}
              </div>
              {hasChildren && isExpanded && <div className="pl-4 ml-2.5 border-l border-gray-100">{node.children!.map(child => renderTreeItem(child))}</div>}
          </div>
      );
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] animate-fade-in overflow-hidden gap-6">
      <aside className="w-72 bg-white border border-gray-200 flex flex-col rounded-xl shadow-sm flex-shrink-0">
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex justify-between items-center">
            <h3 className="font-bold text-gray-800 text-sm">分类层级</h3>
            <button onClick={handleAddRootCategory} className="text-xs text-primary-600 hover:bg-primary-50 px-2 py-1 rounded border border-transparent hover:border-primary-100 transition-all">+ 新增根分类</button>
        </div>
        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">{categoryTree.map(renderTreeItem)}</div>
      </aside>
      
      <section className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden flex flex-col">
          {selectedCategory ? (
            <div className="flex flex-col h-full">
                <div className="px-8 py-6 border-b border-gray-200 bg-gray-50 shrink-0">
                    <div className="flex justify-between items-start">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                                {selectedCategory.name}
                                <span className="text-sm font-normal text-gray-500 px-2 py-0.5 bg-white border border-gray-200 rounded font-mono">{selectedCategory.code}</span>
                            </h2>
                            <p className="text-sm text-gray-500 mt-2">{selectedCategory.description || '暂无描述'}</p>
                        </div>
                        <div className="flex bg-white rounded-lg border border-gray-200 p-1 shadow-sm">
                            <button onClick={() => setActiveTab('basic')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'basic' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>基本信息</button>
                            <button onClick={() => setActiveTab('attr')} className={`px-4 py-1.5 text-sm font-medium rounded-md transition-colors ${activeTab === 'attr' ? 'bg-primary-50 text-primary-700 font-bold' : 'text-gray-600 hover:bg-gray-50'}`}>规格属性 ({selectedCategory.attributes.length})</button>
                        </div>
                    </div>
                </div>

                <div className="flex-1 overflow-auto p-8">
                    {activeTab === 'attr' ? (
                        <div className="space-y-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="font-bold text-gray-900">扩展属性定义</h3>
                                <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm">
                                    <Icons.Plus className="w-4 h-4"/> 添加属性
                                </button>
                            </div>
                            
                            {selectedCategory.attributes.length > 0 ? (
                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 font-bold border-b border-gray-200">
                                            <tr>
                                                <th className="px-6 py-3 w-1/4">属性名称</th>
                                                <th className="px-6 py-3 w-1/4">数据类型</th>
                                                <th className="px-6 py-3 w-1/4">必填项</th>
                                                <th className="px-6 py-3 w-1/4 text-right">操作</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {selectedCategory.attributes.map(attr => (
                                                <tr key={attr.id} className="group hover:bg-gray-50">
                                                    <td className="px-6 py-4 font-medium text-gray-900">{attr.name}</td>
                                                    <td className="px-6 py-4">
                                                        <span className="inline-flex items-center px-2 py-1 rounded bg-gray-100 text-xs font-mono text-gray-600 border border-gray-200">
                                                            {attr.type}
                                                        </span>
                                                        {attr.type === 'select' && <div className="text-xs text-gray-400 mt-1 truncate max-w-[200px]">{attr.options}</div>}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        {attr.required ? <span className="text-green-600 font-bold text-xs">是</span> : <span className="text-gray-400 text-xs">否</span>}
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <button className="text-primary-600 font-bold text-xs hover:underline mr-4">编辑</button>
                                                        <button className="text-red-600 font-bold text-xs hover:underline">删除</button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            ) : (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <Icons.List className="w-12 h-12 mx-auto text-gray-300 mb-2"/>
                                    <p className="text-gray-500">暂无扩展属性</p>
                                    <p className="text-xs text-gray-400 mt-1">添加属性后，该分类下的商品将拥有统一的规格字段</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-2xl space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">分类名称</label>
                                    <input type="text" defaultValue={selectedCategory.name} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-1">分类编码</label>
                                    <input type="text" defaultValue={selectedCategory.code} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">上级分类</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 bg-white">
                                        <option value="">无 (根分类)</option>
                                        {categories.filter(c => c.id !== selectedCategory.id).map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">描述备注</label>
                                    <textarea defaultValue={selectedCategory.description} className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-primary-500 h-24 resize-none"></textarea>
                                </div>
                            </div>
                            <div className="pt-4 border-t border-gray-100 flex gap-4">
                                <button className="px-6 py-2 bg-primary-600 text-white rounded-lg font-bold shadow-sm hover:bg-primary-700">保存修改</button>
                                <button className="px-6 py-2 bg-white border border-gray-300 text-red-600 rounded-lg font-bold hover:bg-red-50">删除分类</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          ) : <div className="flex-1 flex items-center justify-center text-gray-400">请选择分类</div>}
      </section>
    </div>
  );
}

export const ProductEntry: React.FC<{ setPage: (page: Page) => void }> = ({ setPage }) => {
  const [activeTab, setActiveTab] = useState<'basic' | 'price' | 'inventory' | 'sales'>('basic');

  // Sales Trend Mock Data
  const salesTrend = [
      { date: '10-01', sales: 120 }, { date: '10-05', sales: 150 }, { date: '10-10', sales: 180 },
      { date: '10-15', sales: 220 }, { date: '10-20', sales: 190 }, { date: '10-25', sales: 250 },
      { date: '10-30', sales: 310 },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-10 animate-fade-in">
        {/* Sticky Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-sm px-8 h-16 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
                <button onClick={() => setPage(Page.PRODUCTS)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"><Icons.ArrowLeft className="w-5 h-5"/></button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900 leading-none flex items-center gap-2">
                        304不锈钢六角螺栓 M8*50 
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded border border-green-200">销售中</span>
                    </h1>
                    <p className="text-xs text-gray-500 mt-1">SKU: BOLT-304-M8-50 | 条码: 692000188231</p>
                </div>
            </div>
            <div className="flex items-center gap-3">
                <div className="flex bg-gray-100 p-1 rounded-lg mr-4">
                    {[{id:'basic', label:'基础信息'}, {id:'price', label:'价格体系'}, {id:'inventory', label:'库存分布'}, {id:'sales', label:'销售分析'}].map(tab => (
                        <button 
                            key={tab.id} 
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${activeTab === tab.id ? 'bg-white text-primary-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">取消</button>
                <button className="flex items-center px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-lg shadow-sm hover:bg-primary-700 transition-colors">
                    <Icons.Save className="w-4 h-4 mr-2" /> 保存变更
                </button>
            </div>
        </header>

        <main className="max-w-7xl mx-auto px-8 py-8 w-full">
            {activeTab === 'basic' && (
                <div className="grid grid-cols-12 gap-8 animate-fade-in">
                    {/* Left Form */}
                    <div className="col-span-8 space-y-6">
                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><span className="w-1 h-5 bg-primary-500 rounded-full"></span> 核心属性</h3>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">商品名称</label>
                                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5 focus:ring-2 focus:ring-primary-500 outline-none" defaultValue="304不锈钢六角螺栓 M8*50"/>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">所属分类</label>
                                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2.5 bg-white"><option>紧固件 &gt; 螺栓</option></select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">品牌</label>
                                    <input className="w-full border border-gray-300 rounded-lg px-3 py-2.5" defaultValue="金固"/>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">商品描述 (用于打印标签/商城展示)</label>
                                    <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2.5 h-24 resize-none" defaultValue="符合DIN933标准，全牙，A2-70材质。"></textarea>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2"><span className="w-1 h-5 bg-orange-500 rounded-full"></span> 多单位换算</h3>
                            <div className="flex items-center gap-4 p-4 bg-orange-50 rounded-lg border border-orange-100">
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">基本单位</p>
                                    <p className="text-xl font-black text-gray-900">1 个</p>
                                </div>
                                <Icons.ArrowRight className="text-orange-300"/>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">中包装</p>
                                    <p className="text-xl font-black text-orange-600">100 个 / 盒</p>
                                </div>
                                <Icons.ArrowRight className="text-orange-300"/>
                                <div className="text-center">
                                    <p className="text-xs text-gray-500 uppercase font-bold">大包装</p>
                                    <p className="text-xl font-black text-orange-600">20 盒 / 箱</p>
                                </div>
                                <button className="ml-auto text-sm text-orange-600 font-bold hover:underline">修改换算率</button>
                            </div>
                        </section>
                    </div>

                    {/* Right Media */}
                    <div className="col-span-4 space-y-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">商品主图</h3>
                            <div className="aspect-square bg-gray-100 rounded-xl mb-4 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden relative group cursor-pointer">
                                <img src="https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=600&h=600&fit=crop" className="w-full h-full object-cover"/>
                                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-medium">点击更换</div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {[1,2,3].map(i => <div key={i} className="aspect-square bg-gray-50 rounded-lg border border-gray-200"></div>)}
                                <div className="aspect-square bg-white border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:text-primary-600 hover:border-primary-400 cursor-pointer transition-all"><Icons.Plus className="w-5 h-5"/></div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <h3 className="text-sm font-bold text-gray-900 mb-4">快速操作</h3>
                            <button className="w-full py-2.5 mb-3 bg-gray-800 text-white rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-900"><Icons.Print className="w-4 h-4"/> 打印商品标签</button>
                            <button className="w-full py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold flex items-center justify-center gap-2 hover:bg-gray-50"><Icons.Copy className="w-4 h-4"/> 复制为新品</button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'price' && (
                <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Cost Management */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full"></span> 成本管理
                        </h3>
                        <div className="grid grid-cols-2 gap-6 mb-6">
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">最新采购价</p>
                                <p className="text-2xl font-black text-gray-900">¥ 0.35</p>
                                <p className="text-xs text-green-600 mt-1 flex items-center">
                                    <Icons.TrendingDown className="w-3 h-3 mr-1"/> 比上月低 5%
                                </p>
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">加权平均成本</p>
                                <p className="text-2xl font-black text-gray-900">¥ 0.38</p>
                                <p className="text-xs text-gray-400 mt-1">含税/含运费</p>
                            </div>
                        </div>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">默认税率</label>
                                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white"><option>13% 增值税</option></select>
                            </div>
                            <div className="flex items-center gap-2">
                                <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" id="cost_protect"/>
                                <label htmlFor="cost_protect" className="text-sm text-gray-700">启用成本保护 (低于成本禁止销售)</label>
                            </div>
                        </div>
                    </div>

                    {/* Sales Price Strategy */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-1 h-5 bg-green-500 rounded-full"></span> 销售价格体系
                        </h3>
                        <div className="space-y-5">
                            <div className="flex items-center gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-bold text-gray-700 mb-1">标准零售价 (Level 0)</label>
                                    <div className="relative">
                                        <span className="absolute left-3 top-2.5 text-gray-500">¥</span>
                                        <input type="number" className="w-full pl-7 border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-green-500 outline-none font-bold" defaultValue="0.80"/>
                                    </div>
                                </div>
                                <div className="w-32">
                                    <label className="block text-xs font-bold text-gray-500 mb-1">毛利率</label>
                                    <div className="px-3 py-2 bg-green-50 text-green-700 font-bold rounded-lg text-sm text-center">52.6%</div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">多级会员价</h4>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-24">VIP 银卡</span>
                                        <input type="number" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="价格" defaultValue="0.75"/>
                                        <span className="text-xs text-gray-400 w-20 text-right">9.4折</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-sm text-gray-600 w-24">VIP 金卡</span>
                                        <input type="number" className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm" placeholder="价格" defaultValue="0.68"/>
                                        <span className="text-xs text-gray-400 w-20 text-right">8.5折</span>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h4 className="text-sm font-bold text-gray-900 mb-3">阶梯批发价</h4>
                                <div className="flex items-center gap-2 text-sm bg-gray-50 p-2 rounded-lg border border-gray-200">
                                    <span>购买数量 &ge;</span>
                                    <input type="number" className="w-20 border border-gray-300 rounded px-2 py-1 text-center" defaultValue="1000"/>
                                    <span>时，单价为</span>
                                    <input type="number" className="w-24 border border-gray-300 rounded px-2 py-1 text-center font-bold text-primary-600" defaultValue="0.55"/>
                                    <span className="text-gray-400 text-xs ml-auto">利润: 31%</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'inventory' && (
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-500 text-xs font-bold uppercase">总库存量</p>
                            <p className="text-4xl font-black text-gray-900 mt-2">5,200 <span className="text-lg font-medium text-gray-400">个</span></p>
                            <div className="mt-4 flex gap-2">
                                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-bold">库存充足</span>
                                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">周转天数: 45天</span>
                            </div>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-500 text-xs font-bold uppercase">待入库 (采购中)</p>
                            <p className="text-4xl font-black text-blue-600 mt-2">10,000 <span className="text-lg font-medium text-gray-400">个</span></p>
                            <p className="text-xs text-gray-400 mt-2">预计 2023-10-30 到货</p>
                        </div>
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                            <p className="text-gray-500 text-xs font-bold uppercase">待出库 (锁定)</p>
                            <p className="text-4xl font-black text-orange-600 mt-2">500 <span className="text-lg font-medium text-gray-400">个</span></p>
                            <p className="text-xs text-gray-400 mt-2">关联 2 张销售订单</p>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 font-bold text-gray-700">分仓库存分布</div>
                        <table className="w-full text-left text-sm">
                            <thead className="bg-white text-gray-500 border-b border-gray-100 uppercase text-xs">
                                <tr>
                                    <th className="px-6 py-3">仓库名称</th>
                                    <th className="px-6 py-3">货位号</th>
                                    <th className="px-6 py-3 text-right">现有库存</th>
                                    <th className="px-6 py-3 text-right">安全预警线</th>
                                    <th className="px-6 py-3 text-center">状态</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                <tr>
                                    <td className="px-6 py-4 font-bold text-gray-900">五金总仓 A区</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">A-01-02-B</td>
                                    <td className="px-6 py-4 text-right font-bold">4,500</td>
                                    <td className="px-6 py-4 text-right text-gray-500">1,000</td>
                                    <td className="px-6 py-4 text-center"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span></td>
                                </tr>
                                <tr>
                                    <td className="px-6 py-4 font-bold text-gray-900">城北分仓</td>
                                    <td className="px-6 py-4 font-mono text-gray-600">C-05-11</td>
                                    <td className="px-6 py-4 text-right font-bold">700</td>
                                    <td className="px-6 py-4 text-right text-gray-500">500</td>
                                    <td className="px-6 py-4 text-center"><span className="w-2 h-2 bg-green-500 rounded-full inline-block"></span></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {activeTab === 'sales' && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                        <h3 className="font-bold text-gray-900 mb-6">近30天销售趋势</h3>
                        <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={salesTrend}>
                                    <defs>
                                        <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <XAxis dataKey="date" axisLine={false} tickLine={false}/>
                                    <YAxis axisLine={false} tickLine={false}/>
                                    <CartesianGrid vertical={false} stroke="#f3f4f6"/>
                                    <Tooltip/>
                                    <Area type="monotone" dataKey="sales" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                </div>
            )}
        </main>
    </div>
  );
};
