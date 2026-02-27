
import React, { useState, useEffect } from 'react';
import { Icons } from '../components/Icons';
import { Page } from '../types';

interface PageProps {
    setPage?: (page: Page) => void;
}

// ----------------------------------------------------------------------
// WAREHOUSE MAP (VISUAL VIEW) - EXISTING CODE RENAMED TO LAYOUT
// ----------------------------------------------------------------------

interface RackLayer {
  name: string;
  level: string;
  usage: string;
  usagePercent: number;
  usageType: 'empty' | 'partial' | 'full';
  items: { name: string; sku: string; qty: number; unit: string }[];
}

interface RackData {
  id: string;
  name: string;
  row: string;
  unit: string;
  type: 'water' | 'electric' | 'protect' | 'fastener';
  load: number;
  maxLoad: number;
  skuCount: number;
  layers: RackLayer[];
}

const INITIAL_RACKS: Record<string, RackData> = {
  'A-01': {
    id: 'A-01', name: '不锈钢紧固件架', row: 'Row A', unit: 'Unit 01', type: 'fastener', load: 450, maxLoad: 500, skuCount: 15,
    layers: [
      { name: '螺栓区', level: 'L1', usage: '已满', usagePercent: 95, usageType: 'full', items: [{ name: '304螺栓 M8', sku: 'BOLT-01', qty: 5000, unit: '个' }] },
      { name: '垫片区', level: 'L2', usage: '部分', usagePercent: 40, usageType: 'partial', items: [{ name: '平垫 M8', sku: 'WASH-01', qty: 2000, unit: '个' }] }
    ]
  },
  'A-02': { id: 'A-02', name: '管材配件架', row: 'Row A', unit: 'Unit 02', type: 'water', load: 120, maxLoad: 300, skuCount: 8, layers: [] },
  'B-01': { id: 'B-01', name: '动力工具展示架', row: 'Row B', unit: 'Unit 01', type: 'electric', load: 320, maxLoad: 500, skuCount: 12, layers: [] },
  'B-02': { id: 'B-02', name: '安全帽/劳保架', row: 'Row B', unit: 'Unit 02', type: 'protect', load: 180, maxLoad: 400, skuCount: 24, layers: [] }
};

export const WarehouseLayout: React.FC<{ isStandaloneMgmt?: boolean, setPage?: (page: Page) => void }> = ({ isStandaloneMgmt = false, setPage }) => {
  const [activeWarehouse, setActiveWarehouse] = useState('A');
  const [selectedRackId, setSelectedRackId] = useState<string>('A-01');
  const [zoom, setZoom] = useState(1);
  const [visibleCategories, setVisibleCategories] = useState<string[]>(['water', 'electric', 'protect', 'fastener']);
  const [isManageMode, setIsManageMode] = useState(isStandaloneMgmt);
  const [racks, setRacks] = useState<Record<string, RackData>>(INITIAL_RACKS);
  const [showModal, setShowModal] = useState(false);
  const [editingRack, setEditingRack] = useState<Partial<RackData>>({});

  useEffect(() => {
      if (isStandaloneMgmt) setIsManageMode(true);
  }, [isStandaloneMgmt]);

  const selectedRack = racks[selectedRackId] || INITIAL_RACKS['A-01'];

  const getRackColor = (type: string, isWarning: boolean) => {
    if (isWarning) return 'border-red-400 bg-red-50 text-red-600';
    switch (type) {
      case 'water': return 'border-blue-400 bg-blue-50 text-blue-600';
      case 'electric': return 'border-amber-400 bg-amber-50 text-amber-600';
      case 'protect': return 'border-emerald-400 bg-emerald-50 text-emerald-600';
      case 'fastener': return 'border-indigo-400 bg-indigo-50 text-indigo-600';
      default: return 'border-gray-200 bg-gray-50';
    }
  };

  const handleRackClick = (id: string) => {
    if (isManageMode) {
      setEditingRack(racks[id]);
      setShowModal(true);
    } else {
      setSelectedRackId(id);
    }
  };

  const handleAddRack = (row: string) => {
      const newId = `${row === 'Row A' ? 'A' : 'B'}-0${(Object.values(racks) as RackData[]).filter(r => r.row === row).length + 1}`;
      setEditingRack({ id: newId, row, name: '新货架', type: 'fastener', maxLoad: 500, load: 0, skuCount: 0, layers: [] });
      setShowModal(true);
  };

  const saveRack = () => {
    if (editingRack.id) {
      setRacks({ ...racks, [editingRack.id]: editingRack as RackData });
      setShowModal(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-6rem)] animate-fade-in gap-6">
      {/* Sidebar Control */}
      <div className="w-72 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
        <div className="p-5 border-b border-gray-100 bg-gray-50/30">
          <div className="flex items-center gap-3 mb-4">
             <button onClick={() => setPage && setPage(Page.WAREHOUSE)} className="p-1 hover:bg-gray-200 rounded-full transition-colors"><Icons.ArrowLeft className="w-5 h-5 text-gray-500"/></button>
             <h3 className="font-bold text-lg text-gray-900">视图控制</h3>
          </div>
          <div className="flex justify-between items-center mb-4">
             <button 
                onClick={() => setIsManageMode(!isManageMode)}
                className={`w-full px-3 py-2 rounded-lg text-xs font-bold transition-all border shadow-sm ${isManageMode ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-200 text-gray-500 hover:bg-gray-50'}`}
             >
                {isManageMode ? '退出管理模式' : '进入货架编辑模式'}
             </button>
          </div>
          <select value={activeWarehouse} onChange={e => setActiveWarehouse(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none font-medium">
            <option value="A">五金总仓 A区</option>
            <option value="B">管材专用仓 B区</option>
          </select>
        </div>
        
        <div className="p-5 flex-1 space-y-6 overflow-y-auto">
          {isManageMode && (
            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100 text-sm">
               <p className="font-bold text-primary-800 mb-1">管理模式已开启</p>
               <p className="text-primary-600 text-xs leading-relaxed">您可以点击货位进行属性编辑，或点击末尾的虚线框新增库位。</p>
            </div>
          )}

          <div className="space-y-3">
             <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">品类筛选</h4>
             {[
               { id: 'water', label: '水暖器材', color: 'bg-blue-500' },
               { id: 'electric', label: '电动工具', color: 'bg-amber-500' },
               { id: 'protect', label: '劳保防护', color: 'bg-emerald-500' },
               { id: 'fastener', label: '标准紧固件', color: 'bg-indigo-500' },
             ].map((cat) => (
               <label key={cat.id} className="flex items-center group cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={visibleCategories.includes(cat.id)}
                    onChange={() => setVisibleCategories(prev => prev.includes(cat.id) ? prev.filter(c => c !== cat.id) : [...prev, cat.id])}
                    className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-4 w-4 bg-white" 
                  />
                  <span className={`w-3 h-3 rounded-full ${cat.color} ml-3 shadow-sm`}></span>
                  <span className="ml-2 text-sm text-gray-600 group-hover:text-gray-900 transition-colors">{cat.label}</span>
               </label>
             ))}
          </div>
        </div>
      </div>

      {/* Main Map */}
      <div className="flex-1 bg-gray-100 rounded-xl border border-gray-200 relative overflow-hidden flex flex-col shadow-inner">
          <div className="absolute top-4 left-4 z-10 flex gap-2">
             <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-1 flex">
                <button onClick={() => setZoom(z => Math.min(z + 0.2, 2.5))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors"><Icons.Plus className="w-5 h-5"/></button>
                <div className="w-px bg-gray-100 my-1.5"></div>
                <button onClick={() => setZoom(z => Math.max(z - 0.2, 0.4))} className="p-2 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors font-bold text-xl leading-none">－</button>
             </div>
             <div className="bg-white/90 backdrop-blur rounded-full shadow-md border border-gray-200 px-4 py-1.5 flex items-center gap-2 text-[10px] font-bold text-gray-600">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                实时仓库数据
             </div>
          </div>

          <div className="flex-1 overflow-auto p-20 flex items-center justify-center bg-[radial-gradient(#d1d5db_1px,transparent_1px)] [background-size:24px_24px]">
             <div 
               className="bg-white p-20 rounded shadow-2xl border-4 border-dashed border-gray-200 min-w-[1000px] relative transition-transform duration-300 origin-center"
               style={{ transform: `scale(${zoom})` }}
             >
                <div className="grid grid-cols-2 gap-40 relative">
                   {['Row A', 'Row B'].map(row => (
                     <div key={row} className="space-y-10">
                        {(Object.values(racks) as RackData[]).filter(r => r.row === row).map(rack => {
                           const isVisible = visibleCategories.includes(rack.type);
                           const isWarning = (rack.load / rack.maxLoad) > 0.85;
                           if (!isVisible) return <div key={rack.id} className="h-32 w-full border-2 border-dashed border-gray-100 rounded-2xl opacity-10"></div>;
                           return (
                             <div 
                               key={rack.id} 
                               onClick={() => handleRackClick(rack.id)}
                               className={`h-32 w-full border-2 rounded-2xl p-5 flex flex-col justify-between transition-all cursor-pointer shadow-sm relative group/rack ${selectedRackId === rack.id ? 'ring-4 ring-primary-100 border-primary-500 z-10' : 'hover:border-primary-400 hover:shadow-lg'} ${getRackColor(rack.type, isWarning)}`}
                             >
                               <div className="flex justify-between items-start">
                                  <div className="flex flex-col">
                                     <span className="text-xs font-black tracking-tighter opacity-50 uppercase">{rack.id}</span>
                                     <span className="text-sm font-bold truncate max-w-[120px]">{rack.name}</span>
                                  </div>
                                  {isManageMode && <div className="p-1 bg-white rounded-lg shadow-sm text-primary-500"><Icons.Settings className="w-4 h-4"/></div>}
                               </div>
                               <div className="space-y-2">
                                  <div className="flex justify-between items-end text-[10px] font-bold">
                                     <span className="opacity-50 uppercase">Capacity</span>
                                     <span className={isWarning ? 'text-red-600' : 'text-gray-900'}>{Math.round((rack.load/rack.maxLoad)*100)}%</span>
                                  </div>
                                  <div className="w-full bg-black/5 h-2 rounded-full overflow-hidden">
                                     <div className={`h-full rounded-full transition-all duration-700 ${isWarning ? 'bg-red-500' : 'bg-current'}`} style={{width: `${(rack.load/rack.maxLoad)*100}%`}}></div>
                                  </div>
                               </div>
                             </div>
                           );
                        })}
                        {isManageMode && (
                          <button 
                            onClick={() => handleAddRack(row)}
                            className="h-32 w-full border-2 border-dashed border-primary-200 bg-primary-50/20 rounded-2xl flex flex-col items-center justify-center text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-all group/add"
                          >
                             <Icons.Plus className="w-8 h-8 group-hover/add:scale-110 transition-transform"/>
                             <span className="text-[10px] font-black uppercase tracking-widest mt-2">New Location</span>
                          </button>
                        )}
                     </div>
                   ))}
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-90 text-gray-100 font-black text-6xl tracking-[2em] pointer-events-none uppercase opacity-30 italic">Warehouse Aisle</div>
                </div>
             </div>
          </div>
      </div>

      {/* Detail Panel */}
      {!isManageMode && (
        <div className="w-80 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0">
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 rounded-2xl bg-primary-600 text-white flex items-center justify-center font-black text-xl shadow-xl shadow-primary-100 border-2 border-white">{selectedRack?.id}</div>
                <div className="min-w-0">
                   <h2 className="text-lg font-bold text-gray-900 truncate leading-tight">{selectedRack?.name}</h2>
                   <p className="text-xs text-gray-500 font-medium mt-1">{selectedRack?.row} • {selectedRack?.unit}</p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">负荷</p>
                   <p className="text-lg font-bold text-primary-600">{selectedRack?.load}<span className="text-[10px] text-gray-400 font-normal ml-1">/{selectedRack?.maxLoad}k</span></p>
                </div>
                <div className="bg-white p-3.5 rounded-xl border border-gray-100 shadow-sm">
                   <p className="text-[10px] text-gray-400 font-black uppercase tracking-wider mb-1">品项</p>
                   <p className="text-lg font-bold text-gray-900">{selectedRack?.skuCount}<span className="text-[10px] text-gray-400 font-normal ml-1">种</span></p>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
             {selectedRack?.layers.map((layer, idx) => (
                <div key={idx} className="bg-white rounded-xl border border-gray-200 p-4 hover:border-primary-500 transition-all shadow-sm relative overflow-hidden">
                   <div className={`absolute left-0 top-0 w-1 h-full ${layer.usageType === 'full' ? 'bg-red-500' : 'bg-green-500'}`} />
                   <h4 className="font-bold text-gray-900 text-sm mb-3">层级 {layer.level} - {layer.name}</h4>
                   <div className="space-y-2">
                      {layer.items.map((item, i) => (
                        <div key={i} className="flex justify-between text-xs">
                           <span className="text-gray-600">{item.name}</span>
                           <span className="font-bold">{item.qty} {item.unit}</span>
                        </div>
                      ))}
                   </div>
                </div>
             ))}
             {selectedRack?.layers.length === 0 && <p className="text-center text-gray-300 py-10 italic">暂无存放记录</p>}
          </div>

          <div className="p-4 bg-gray-50 border-t border-gray-200 rounded-b-xl flex gap-3">
             <button className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg font-bold text-xs shadow-md">移动库位</button>
             <button className="px-3 py-2.5 bg-white border border-gray-200 rounded-lg"><Icons.Print className="w-4 h-4 text-gray-400"/></button>
          </div>
        </div>
      )}

      {/* Edit Modal - Strictly light backgrounds */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <h3 className="text-lg font-bold text-gray-900">货架属性管理</h3>
                 <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-900"><Icons.Close className="w-5 h-5"/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-400 uppercase">货位 ID</label>
                       <input 
                         type="text" 
                         value={editingRack.id} 
                         onChange={e => setEditingRack({...editingRack, id: e.target.value})}
                         className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                       />
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-400 uppercase">排号 (Row)</label>
                       <select value={editingRack.row} onChange={e => setEditingRack({...editingRack, row: e.target.value})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none">
                          <option value="Row A">Row A (左侧)</option>
                          <option value="Row B">Row B (右侧)</option>
                       </select>
                    </div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-400 uppercase">显示名称</label>
                    <input 
                      type="text" 
                      value={editingRack.name} 
                      onChange={e => setEditingRack({...editingRack, name: e.target.value})}
                      className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                    />
                 </div>
                 <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-400 uppercase">存储类型</label>
                       <select value={editingRack.type} onChange={e => setEditingRack({...editingRack, type: e.target.value as any})} className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none">
                          <option value="water">水暖器材</option>
                          <option value="electric">电动工具</option>
                          <option value="protect">劳保防护</option>
                          <option value="fastener">紧固件</option>
                       </select>
                    </div>
                    <div className="space-y-1.5">
                       <label className="text-xs font-bold text-gray-400 uppercase">最大载重 (kg)</label>
                       <input 
                         type="number" 
                         value={editingRack.maxLoad} 
                         onChange={e => setEditingRack({...editingRack, maxLoad: Number(e.target.value)})}
                         className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:ring-2 focus:ring-primary-500 outline-none"
                       />
                    </div>
                 </div>
              </div>
              <div className="p-6 bg-gray-50 border-t border-gray-100 flex gap-4">
                 <button onClick={() => setShowModal(false)} className="flex-1 py-2.5 bg-white border border-gray-300 text-gray-600 rounded-xl hover:bg-gray-100 text-sm font-bold">取消</button>
                 <button onClick={saveRack} className="flex-1 py-2.5 bg-primary-600 text-white rounded-xl shadow-lg shadow-primary-100 hover:bg-primary-700 text-sm font-bold">保存并应用</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// WAREHOUSE EDIT / CREATE (NEW)
// ----------------------------------------------------------------------

export const WarehouseEdit: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="flex flex-col h-[calc(100vh-6rem)] animate-fade-in bg-gray-50/50">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5 bg-white border-b border-gray-200 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setPage && setPage(Page.WAREHOUSE)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <Icons.ArrowLeft className="w-5 h-5"/>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">新建/编辑仓库</h1>
                        <p className="text-xs text-gray-500 mt-0.5">配置仓库基础信息、位置及负责人</p>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setPage && setPage(Page.WAREHOUSE)} className="px-5 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">取消</button>
                    <button onClick={() => { alert('保存成功'); setPage && setPage(Page.WAREHOUSE); }} className="px-6 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-md transition-colors flex items-center gap-2">
                        <Icons.Save className="w-4 h-4"/> 保存配置
                    </button>
                </div>
            </div>

            {/* Form Content */}
            <div className="flex-1 overflow-y-auto p-8">
                <div className="max-w-4xl mx-auto space-y-6">
                    
                    {/* Basic Info */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Icons.Home className="w-5 h-5 text-gray-400"/> 基础信息
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">仓库名称 <span className="text-red-500">*</span></label>
                                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="例如：五金总仓 A区"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">仓库编码</label>
                                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-gray-50" placeholder="自动生成 (如: WH-001)"/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">仓库类型</label>
                                <select className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                    <option>中心主仓</option>
                                    <option>区域分仓</option>
                                    <option>中转仓</option>
                                    <option>次品/报损仓</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">运营状态</label>
                                <div className="flex gap-4 pt-2">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="status" defaultChecked className="text-primary-600 focus:ring-primary-500"/>
                                        <span className="text-sm text-gray-900">正常运营</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="status" className="text-primary-600 focus:ring-primary-500"/>
                                        <span className="text-sm text-gray-900">暂停盘点</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input type="radio" name="status" className="text-primary-600 focus:ring-primary-500"/>
                                        <span className="text-sm text-gray-500">已关闭</span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Location & Management */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Icons.MapPin className="w-5 h-5 text-gray-400"/> 位置与管理
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">详细地址</label>
                                <div className="flex gap-2">
                                    <input type="text" className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="输入仓库详细地址..."/>
                                    <button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-50 text-sm font-medium"><Icons.MapPin className="w-4 h-4 inline mr-1"/> 定位</button>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">负责人姓名</label>
                                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="输入负责人..."/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">联系电话</label>
                                <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" placeholder="138..."/>
                            </div>
                        </div>
                    </div>

                    {/* Capacity Settings */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center gap-2 border-b border-gray-100 pb-2">
                            <Icons.Box className="w-5 h-5 text-gray-400"/> 容量配置
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">设计总货位 (个)</label>
                                <input type="number" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" defaultValue={500}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">最大库容体积 (m³)</label>
                                <input type="number" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" defaultValue={1200}/>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">库容预警阈值 (%)</label>
                                <div className="flex items-center gap-2">
                                    <input type="number" className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none" defaultValue={85}/>
                                    <span className="text-sm text-gray-500">%</span>
                                </div>
                            </div>
                            <div className="col-span-1 md:col-span-3">
                                <label className="block text-sm font-bold text-gray-700 mb-1.5">备注说明</label>
                                <textarea className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 outline-none h-24 resize-none" placeholder="关于该仓库的其他说明..."></textarea>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// WAREHOUSE MANAGEMENT LIST (UPDATED)
// ----------------------------------------------------------------------

export const WarehouseManagement: React.FC<PageProps> = ({ setPage }) => {
    return (
        <div className="animate-fade-in space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900">仓库网络管理</h2>
                    <p className="text-sm text-gray-500 mt-1">管理多级仓库体系，监控库容使用率与库存价值。</p>
                </div>
                <button 
                    onClick={() => setPage && setPage(Page.WAREHOUSE_EDIT)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-bold shadow-md transition-all active:scale-95"
                >
                    <Icons.Plus className="w-5 h-5"/> 新建仓库
                </button>
            </div>

            {/* KPI Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">运营仓库总数</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">3 <span className="text-sm font-medium text-gray-400">个</span></p>
                    </div>
                    <div className="p-3 bg-blue-50 rounded-xl text-blue-600"><Icons.Warehouse className="w-8 h-8"/></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">平均库容利用率</p>
                        <p className="text-3xl font-black text-orange-600 mt-2">72%</p>
                    </div>
                    <div className="p-3 bg-orange-50 rounded-xl text-orange-600"><Icons.PieChart className="w-8 h-8"/></div>
                </div>
                <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
                    <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">仓储管理人员</p>
                        <p className="text-3xl font-black text-gray-900 mt-2">12 <span className="text-sm font-medium text-gray-400">人</span></p>
                    </div>
                    <div className="p-3 bg-purple-50 rounded-xl text-purple-600"><Icons.Users className="w-8 h-8"/></div>
                </div>
            </div>

            {/* Warehouse List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Warehouse 1 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:border-primary-400 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-primary-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-primary-600 font-black text-xl">A</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">五金总仓 A区</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-xs font-bold rounded">核心仓</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Icons.MapPin className="w-3 h-3"/> 杭州市西湖区</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setPage && setPage(Page.WAREHOUSE_EDIT)} className="text-gray-400 hover:text-primary-600 transition-colors p-1 hover:bg-gray-100 rounded"><Icons.FileEdit className="w-5 h-5"/></button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">SKU 数量</p>
                                <p className="font-bold text-gray-900">1,240</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">库存货值</p>
                                <p className="font-bold text-gray-900">¥ 245W</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">负责人</p>
                                <p className="font-bold text-gray-900">李主管</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>库容使用率</span>
                                <span className="text-red-500">85% (高负荷)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-red-500 h-full w-[85%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setPage && setPage(Page.WAREHOUSE_LAYOUT)} className="flex-1 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 transition-colors flex items-center justify-center gap-2">
                                <Icons.Eye className="w-4 h-4"/> 可视化视图
                            </button>
                            <button onClick={() => setPage && setPage(Page.INVENTORY_LIST)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                                库存明细
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warehouse 2 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:border-blue-400 transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 z-0"></div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-blue-600 font-black text-xl">B</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">城北分仓</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded">中转仓</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Icons.MapPin className="w-3 h-3"/> 拱墅区祥园路</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setPage && setPage(Page.WAREHOUSE_EDIT)} className="text-gray-400 hover:text-primary-600 transition-colors p-1 hover:bg-gray-100 rounded"><Icons.FileEdit className="w-5 h-5"/></button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">SKU 数量</p>
                                <p className="font-bold text-gray-900">450</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">库存货值</p>
                                <p className="font-bold text-gray-900">¥ 82W</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">负责人</p>
                                <p className="font-bold text-gray-900">王强</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>库容使用率</span>
                                <span className="text-green-600">45% (健康)</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-green-500 h-full w-[45%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setPage && setPage(Page.WAREHOUSE_LAYOUT)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2">
                                <Icons.Eye className="w-4 h-4"/> 可视化视图
                            </button>
                            <button onClick={() => setPage && setPage(Page.INVENTORY_LIST)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                                库存明细
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warehouse 3 */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 relative overflow-hidden group hover:border-gray-400 transition-all opacity-80 hover:opacity-100">
                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-white border border-gray-100 rounded-xl flex items-center justify-center shadow-sm text-gray-600 font-black text-xl">C</div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">次品暂存库</h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-bold rounded">暂存仓</span>
                                        <span className="text-xs text-gray-500 flex items-center gap-1"><Icons.MapPin className="w-3 h-3"/> 园区 B2</span>
                                    </div>
                                </div>
                            </div>
                            <button onClick={() => setPage && setPage(Page.WAREHOUSE_EDIT)} className="text-gray-400 hover:text-primary-600 transition-colors p-1 hover:bg-gray-100 rounded"><Icons.FileEdit className="w-5 h-5"/></button>
                        </div>

                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">SKU 数量</p>
                                <p className="font-bold text-gray-900">45</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">待处理</p>
                                <p className="font-bold text-red-600">12 单</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">负责人</p>
                                <p className="font-bold text-gray-900">老赵</p>
                            </div>
                        </div>

                        <div className="space-y-2 mb-6">
                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                <span>库容使用率</span>
                                <span className="text-gray-600">12%</span>
                            </div>
                            <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                                <div className="bg-gray-400 h-full w-[12%] rounded-full"></div>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4 border-t border-gray-100">
                            <button className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-400 rounded-lg text-sm font-bold cursor-not-allowed">
                                无可视化视图
                            </button>
                            <button onClick={() => setPage && setPage(Page.INVENTORY_LIST)} className="flex-1 py-2.5 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50 transition-colors">
                                查看明细
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
