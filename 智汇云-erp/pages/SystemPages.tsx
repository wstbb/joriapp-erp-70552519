
import React, { useState } from 'react';
import { Icons } from '../components/Icons';
import { Page, User, Ticket } from '../types';
import apiClient from '../api';

interface PageProps {
    setPage?: (page: Page) => void;
    user?: User;
    onAddTicket?: (ticket: Ticket) => void;
}

// --- Workflow Types & Data (Kept from previous version) ---
type IconName = 'ShoppingCart' | 'Warehouse' | 'Check' | 'Users' | 'FileText' | 'User' | 'Settings' | 'Banknote' | 'Briefcase' | 'Clock' | 'Wallet';
type ColorTheme = 'blue' | 'orange' | 'green' | 'purple' | 'gray' | 'red';

interface NodeData {
    title: string;
    subtitle: string;
    icon: IconName;
    color: ColorTheme;
    isCC?: boolean;
}

interface WorkflowNode {
    id: string;
    type: 'node';
    data: NodeData;
}

interface WorkflowBranch {
    id: string;
    type: 'branch';
    conditions: {
        id: string;
        label: string;
        nodes: WorkflowNode[];
    }[];
}

type WorkflowStep = WorkflowNode | WorkflowBranch;

interface WorkflowDefinition {
    id: string;
    name: string;
    description: string;
    icon: IconName;
    color: ColorTheme;
    updatedAt: string;
    status: 'active' | 'draft';
    steps: WorkflowStep[];
}

const DEFAULT_WORKFLOW: WorkflowStep[] = [
    {
        id: '1',
        type: 'node',
        data: { title: '申请提交', subtitle: '发起人', icon: 'User', color: 'blue' }
    },
    {
        id: '2',
        type: 'node',
        data: { title: '部门审核', subtitle: '部门主管', icon: 'Check', color: 'orange' }
    },
    {
        id: '3',
        type: 'branch',
        conditions: [
            {
                id: 'c1',
                label: '常规流程',
                nodes: [
                    { id: '3-1', type: 'node', data: { title: '自动归档', subtitle: '系统', icon: 'FileText', color: 'green' } }
                ]
            },
            {
                id: 'c2',
                label: '特殊情况',
                nodes: [
                    { id: '3-2-1', type: 'node', data: { title: '总经理审批', subtitle: '老板', icon: 'Users', color: 'purple' } }
                ]
            }
        ]
    }
];

const WORKFLOW_TEMPLATES: WorkflowDefinition[] = [
    {
        id: 'wf-001', name: '采购入库审批', description: '适用于原材料、五金件采购入库的审批流程', icon: 'ShoppingCart', color: 'blue', updatedAt: '2023-10-25', status: 'active',
        steps: DEFAULT_WORKFLOW 
    },
    {
        id: 'wf-002', name: '销售折扣审批', description: '销售开单低于最低限价时的审批流', icon: 'Banknote', color: 'green', updatedAt: '2023-10-20', status: 'active',
        steps: DEFAULT_WORKFLOW
    },
    {
        id: 'wf-003', name: '财务付款审批', description: '供应商货款结算、费用报销等资金支出', icon: 'Wallet', color: 'purple', updatedAt: '2023-10-15', status: 'active',
        steps: DEFAULT_WORKFLOW
    },
    {
        id: 'wf-004', name: '员工请假流程', description: '员工日常请假、调休申请', icon: 'Clock', color: 'orange', updatedAt: '2023-09-10', status: 'draft',
        steps: DEFAULT_WORKFLOW
    }
];

export const WorkflowConfig: React.FC<PageProps> = ({ user }) => {
    const [viewMode, setViewMode] = useState<'list' | 'editor'>('list');
    const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowDefinition | null>(null);
    const [workflowSteps, setWorkflowSteps] = useState<WorkflowStep[]>([]);
    const [editingItem, setEditingItem] = useState<{ type: 'node' | 'condition', id: string, data: any } | null>(null);

    const handleCreateWorkflow = () => {
        if (user?.tenantPlan === 'basic') {
            alert('基础版不支持自定义审批流，请升级至专业版或企业版。');
            return;
        }
        alert('新建流程功能 (Mock)');
    };

    const handleSelectWorkflow = (wf: WorkflowDefinition) => {
        setSelectedWorkflow(wf);
        setWorkflowSteps(JSON.parse(JSON.stringify(wf.steps))); // Deep copy
        setViewMode('editor');
    };

    // Helpers
    const getIcon = (name: IconName) => {
        const IconComp = Icons[name as keyof typeof Icons] || Icons.User;
        return <IconComp className="w-5 h-5" />;
    };

    const getColorClasses = (color: ColorTheme) => {
        const map = {
            blue: 'bg-blue-50 text-blue-600 border-blue-200',
            orange: 'bg-orange-50 text-orange-600 border-orange-200',
            green: 'bg-green-50 text-green-600 border-green-200',
            purple: 'bg-purple-50 text-purple-600 border-purple-200',
            gray: 'bg-gray-100 text-gray-600 border-gray-200',
            red: 'bg-red-50 text-red-600 border-red-200',
        };
        return map[color] || map.gray;
    };

    const updateNode = (id: string, newData: Partial<NodeData>) => {
        const newWorkflow = [...workflowSteps];
        const updateInList = (list: WorkflowStep[]) => {
            for (let item of list) {
                if (item.type === 'node' && item.id === id) {
                    item.data = { ...item.data, ...newData };
                    return true;
                }
                if (item.type === 'branch') {
                    for (let cond of item.conditions) {
                        for (let n of cond.nodes) {
                            if (n.id === id) {
                                n.data = { ...n.data, ...newData };
                                return true;
                            }
                        }
                    }
                }
            }
            return false;
        };
        updateInList(newWorkflow);
        setWorkflowSteps(newWorkflow);
        setEditingItem(null);
    };

    const updateCondition = (id: string, newLabel: string) => {
        const newWorkflow = [...workflowSteps];
        newWorkflow.forEach(step => {
            if (step.type === 'branch') {
                const cond = step.conditions.find(c => c.id === id);
                if (cond) cond.label = newLabel;
            }
        });
        setWorkflowSteps(newWorkflow);
        setEditingItem(null);
    };

    const renderNodeCard = (node: WorkflowNode, isBranchNode = false) => (
        <div 
            onClick={() => setEditingItem({ type: 'node', id: node.id, data: node.data })}
            className={`w-64 bg-white border rounded-lg shadow-sm p-4 flex items-center gap-3 cursor-pointer relative z-10 transition-all hover:shadow-md ${isBranchNode ? 'ring-2 ring-primary-50 border-primary-200' : 'border-gray-200 hover:border-primary-400'}`}
        >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getColorClasses(node.data.color).split(' ')[0]} ${getColorClasses(node.data.color).split(' ')[1]}`}>
                {getIcon(node.data.icon)}
            </div>
            <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{node.data.title}</h3>
                <p className="text-xs text-gray-500 truncate">{node.data.subtitle}</p>
            </div>
            {node.data.isCC && <span className="absolute top-2 right-2 text-[10px] bg-gray-100 text-gray-500 px-1 rounded">抄送</span>}
            <Icons.UserEdit className="w-4 h-4 text-gray-300 hover:text-primary-600" />
        </div>
    );

    // --- LIST VIEW RENDER ---
    if (viewMode === 'list') {
        return (
            <div className="animate-fade-in pb-10">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">审批流程配置</h2>
                        <p className="text-sm text-gray-500 mt-1">管理企业内部各类业务的审批流转规则。</p>
                    </div>
                    <button onClick={handleCreateWorkflow} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2">
                        <Icons.Plus className="w-4 h-4"/> 新建流程
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {WORKFLOW_TEMPLATES.map(wf => (
                        <div key={wf.id} onClick={() => handleSelectWorkflow(wf)} className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md hover:border-primary-200 transition-all cursor-pointer group flex flex-col h-full">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${getColorClasses(wf.color)}`}>
                                    {getIcon(wf.icon)}
                                </div>
                                <span className={`px-2 py-0.5 rounded text-xs font-medium ${wf.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {wf.status === 'active' ? '已启用' : '草稿'}
                                </span>
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">{wf.name}</h3>
                            <p className="text-sm text-gray-500 mb-6 flex-1 line-clamp-2">{wf.description}</p>
                            <div className="pt-4 border-t border-gray-100 flex justify-between items-center text-xs text-gray-400">
                                <span>更新于: {wf.updatedAt}</span>
                                <span className="flex items-center gap-1 group-hover:text-primary-600 font-medium">配置 <Icons.ArrowRight className="w-3 h-3"/></span>
                            </div>
                        </div>
                    ))}
                    {/* Add New Placeholder */}
                    <button onClick={handleCreateWorkflow} className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center text-gray-400 hover:border-primary-300 hover:text-primary-600 hover:bg-primary-50 transition-all min-h-[240px]">
                        <Icons.PlusCircle className="w-12 h-12 mb-3 opacity-50"/>
                        <span className="font-medium">创建自定义审批流</span>
                    </button>
                </div>
            </div>
        );
    }

    // --- EDITOR VIEW RENDER ---
    return (
        <div className="flex h-[calc(100vh-6rem)] animate-fade-in flex-col">
            <div className="flex justify-between items-center mb-4 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => setViewMode('list')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors">
                        <Icons.ArrowLeft className="w-5 h-5"/>
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {selectedWorkflow?.name}
                            <span className="text-sm font-normal text-gray-500 px-2 py-0.5 rounded border border-gray-200">版本 V1.2</span>
                        </h2>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button onClick={() => setViewMode('list')} className="px-4 py-2 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 text-sm font-medium text-gray-700">关闭</button>
                    <button onClick={() => alert('保存成功')} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm flex items-center gap-2"><Icons.Save className="w-4 h-4"/> 保存配置</button>
                </div>
            </div>

            <div className="flex-1 bg-gray-50 rounded-xl border border-gray-200 relative overflow-hidden flex flex-col items-center p-10 overflow-y-auto custom-scrollbar" style={{backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px'}}>
                <div className="flex flex-col items-center w-full max-w-4xl pb-20">
                    {workflowSteps.map((step, index) => (
                        <React.Fragment key={step.id}>
                            {/* Node Renderer */}
                            {step.type === 'node' ? (
                                <>
                                    {renderNodeCard(step)}
                                    <div className="h-8 w-px bg-gray-300 relative group flex items-center justify-center">
                                        <button className="absolute w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 z-20 shadow-sm"><Icons.Plus className="w-4 h-4"/></button>
                                    </div>
                                </>
                            ) : (
                                /* Branch Renderer */
                                <div className="flex gap-16 relative mt-8 mb-4">
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 w-[calc(100%-16rem)] h-px bg-gray-300"></div>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-gray-300"></div>
                                    {step.conditions.map((branch) => (
                                        <div key={branch.id} className="flex flex-col items-center relative">
                                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 h-8 w-px bg-gray-300"></div>
                                            <div 
                                                onClick={() => setEditingItem({ type: 'condition', id: branch.id, data: { label: branch.label } })}
                                                className="bg-white px-3 py-1 text-xs font-medium text-gray-600 border border-gray-200 rounded-full shadow-sm mb-4 cursor-pointer hover:border-primary-400 hover:text-primary-600 transition-colors z-10"
                                            >
                                                {branch.label}
                                            </div>
                                            <div className="flex flex-col items-center">
                                                {branch.nodes.map((bNode, bnIdx) => (
                                                    <React.Fragment key={bNode.id}>
                                                        {renderNodeCard(bNode, true)}
                                                        {bnIdx < branch.nodes.length - 1 && <div className="h-8 w-px bg-gray-300"></div>}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                    <div className="w-32 bg-gray-100 border border-gray-200 rounded-full py-2 text-center text-xs text-gray-500 font-medium">流程结束</div>
                </div>
            </div>

            {/* Edit Modal (Same as before) */}
            {editingItem && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
                        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-900">
                                {editingItem.type === 'node' ? '编辑节点配置' : '修改分支条件'}
                            </h3>
                            <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-5 h-5"/></button>
                        </div>
                        <div className="p-6 space-y-4">
                            {editingItem.type === 'node' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">节点标题</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" defaultValue={editingItem.data.title} id="edit-title"/>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">描述</label>
                                        <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" defaultValue={editingItem.data.subtitle} id="edit-subtitle"/>
                                    </div>
                                </>
                            ) : (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">条件逻辑</label>
                                    <input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none" defaultValue={editingItem.data.label} id="edit-condition"/>
                                </div>
                            )}
                        </div>
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
                            <button onClick={() => setEditingItem(null)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white">取消</button>
                            <button 
                                onClick={() => {
                                    if (editingItem.type === 'node') {
                                        const title = (document.getElementById('edit-title') as HTMLInputElement).value;
                                        const subtitle = (document.getElementById('edit-subtitle') as HTMLInputElement).value;
                                        updateNode(editingItem.id, { title, subtitle });
                                    } else {
                                        const label = (document.getElementById('edit-condition') as HTMLInputElement).value;
                                        updateCondition(editingItem.id, label);
                                    }
                                }}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm"
                            >
                                确认修改
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export const Approvals: React.FC = () => {
  const [activeContext, setActiveContext] = useState<'pending' | 'initiated' | 'cc'>('pending');
  const [activeCategory, setActiveCategory] = useState('all');
  const [items, setItems] = useState([
    { id: 1, title: '大额采购申请 - 固万基螺栓一批', type: '采购审批', typeId: 'procurement', user: '李采购', date: '2023-10-24 14:00', amount: '¥ 12,000.00', status: 'pending', urgency: 'high', desc: '库存低于安全线，需紧急补货 M8 规格螺栓。' },
    { id: 2, title: '新增供应商入库申请', type: '供应商管理', typeId: 'procurement', user: '张经理', date: '2023-10-24 09:30', amount: '-', status: 'pending', urgency: 'normal', desc: '引进新供应商“宁波甬港紧固件”，已完成资质审核。' },
    { id: 3, title: '销售出库折扣申请 (95折)', type: '销售审批', typeId: 'sales', user: '王销售', date: '2023-10-23 16:20', amount: '¥ 500.00', status: 'pending', urgency: 'normal', desc: '老客户“宏达建材”周年庆活动申请额外折扣。' },
    { id: 4, title: '报销申请 - 10月差旅费', type: '财务报销', typeId: 'finance', user: '赵业务', date: '2023-10-23 10:00', amount: '¥ 1,250.00', status: 'pending', urgency: 'normal', desc: '前往苏州拜访客户产生的高铁及住宿费用。' },
    { id: 5, title: '员工请假 - 李四 (事假)', type: '人事考勤', typeId: 'hr', user: '李四', date: '2023-10-22 15:00', amount: '2 天', status: 'pending', urgency: 'low', desc: '因家中急事申请调休。' },
    { id: 6, title: '合同审批 - 2024年度物流合作', type: '行政合同', typeId: 'admin', user: 'Admin', date: '2023-10-21 11:00', amount: '-', status: 'approved', urgency: 'high', desc: '顺丰速运年度合作协议续签。' },
  ]);

  const handleAction = (id: number) => {
      setItems(prev => prev.filter(i => i.id !== id));
  };

  const filteredItems = items.filter(item => {
      if (activeContext === 'pending' && item.status !== 'pending') return false;
      if (activeCategory !== 'all' && item.typeId !== activeCategory) return false;
      return true;
  });

  return (
    <div className="flex h-[calc(100vh-6rem)] animate-fade-in gap-6">
        {/* Left Sidebar Context */}
        <div className="w-64 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
            <div className="p-4 bg-gray-50 border-b border-gray-100">
                <button className="w-full py-2.5 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center justify-center gap-2">
                    <Icons.Plus className="w-4 h-4"/> 发起审批
                </button>
            </div>
            <div className="flex-1 p-2 space-y-1">
                <button onClick={() => setActiveContext('pending')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors ${activeContext === 'pending' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className="flex items-center gap-3 font-medium"><Icons.CheckSquare className="w-4 h-4"/> 待我审批</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${activeContext === 'pending' ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-500'}`}>{items.filter(i=>i.status==='pending').length}</span>
                </button>
                <button onClick={() => setActiveContext('initiated')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors ${activeContext === 'initiated' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className="flex items-center gap-3 font-medium"><Icons.FileText className="w-4 h-4"/> 我发起的</span>
                </button>
                <button onClick={() => setActiveContext('cc')} className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between group transition-colors ${activeContext === 'cc' ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}>
                    <span className="flex items-center gap-3 font-medium"><Icons.Mail className="w-4 h-4"/> 抄送我的</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-500">2</span>
                </button>
            </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 flex flex-col min-w-0">
            {/* Category Tabs */}
            <div className="bg-white border border-gray-200 rounded-xl p-1 mb-4 flex gap-1 shadow-sm shrink-0 overflow-x-auto">
                {[
                    { id: 'all', label: '全部' },
                    { id: 'procurement', label: '采购管理' },
                    { id: 'sales', label: '销售业务' },
                    { id: 'finance', label: '财务资金' },
                    { id: 'hr', label: '人事行政' },
                ].map(cat => (
                    <button 
                        key={cat.id} 
                        onClick={() => setActiveCategory(cat.id)}
                        className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors ${activeCategory === cat.id ? 'bg-gray-800 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto space-y-4">
                {filteredItems.map((item) => (
                    <div key={item.id} className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        {item.urgency === 'high' && <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-bl from-red-500 to-transparent opacity-10 pointer-events-none"></div>}
                        
                        <div className="flex justify-between items-start">
                            <div className="flex gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold shrink-0 ${
                                    item.typeId === 'procurement' ? 'bg-blue-100 text-blue-600' :
                                    item.typeId === 'finance' ? 'bg-green-100 text-green-600' :
                                    item.typeId === 'sales' ? 'bg-purple-100 text-purple-600' :
                                    'bg-orange-100 text-orange-600'
                                }`}>
                                    {item.user.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                        {item.title}
                                        {item.urgency === 'high' && <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-600 rounded border border-red-200 font-bold">加急</span>}
                                    </h4>
                                    <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
                                        <span className="font-medium text-gray-700">{item.user}</span>
                                        <span>•</span>
                                        <span>{item.type}</span>
                                        <span>•</span>
                                        <span>{item.date}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2 bg-gray-50 p-2 rounded border border-gray-100">{item.desc}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                {item.amount !== '-' && (
                                    <div className="text-xl font-bold text-gray-900 mb-1">{item.amount}</div>
                                )}
                                <div className="text-xs text-gray-400">当前节点: 部门主管审批</div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="mt-4 pt-4 border-t border-gray-100 flex justify-end gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleAction(item.id)} className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 hover:text-red-600 hover:border-red-200 transition-colors">退回 / 拒绝</button>
                            <button className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 transition-colors">转交</button>
                            <button onClick={() => handleAction(item.id)} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 shadow-sm transition-colors">同意</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// USER DETAIL EDIT (ENHANCED)
// ----------------------------------------------------------------------

export const UserDetailEdit: React.FC<PageProps> = ({ setPage }) => {
    const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'activity'>('profile');

    return (
        <div className="animate-fade-in max-w-6xl mx-auto pb-10">
            <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setPage && setPage(Page.PERMISSION_MANAGEMENT)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                    <Icons.ArrowLeft className="w-5 h-5 text-gray-600"/>
                </button>
                <h2 className="text-2xl font-bold text-gray-900">员工档案</h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Profile Card */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 rounded-full border-4 border-gray-100 mb-4 overflow-hidden relative group cursor-pointer">
                            <img src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80" className="w-full h-full object-cover"/>
                            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white font-medium">更换</div>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900">张伟</h3>
                        <p className="text-gray-500 text-sm mb-4">销售部 · 资深销售</p>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold mb-6">在职</span>
                        
                        <div className="w-full grid grid-cols-2 gap-2 text-center text-xs mb-6 border-t border-b border-gray-100 py-4">
                            <div>
                                <p className="text-gray-400 mb-1">本月业绩</p>
                                <p className="font-bold text-lg text-gray-900">¥12W</p>
                            </div>
                            <div>
                                <p className="text-gray-400 mb-1">开单数</p>
                                <p className="font-bold text-lg text-gray-900">34</p>
                            </div>
                        </div>

                        <div className="w-full space-y-2">
                            <button className="w-full py-2 bg-primary-50 text-primary-700 rounded-lg text-sm font-bold hover:bg-primary-100">发送消息</button>
                            <button className="w-full py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50">排班管理</button>
                        </div>
                    </div>
                </div>

                {/* Right Content */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                        <div className="flex border-b border-gray-100 px-6">
                            <button onClick={() => setActiveTab('profile')} className={`py-4 mr-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'profile' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>基本资料</button>
                            <button onClick={() => setActiveTab('security')} className={`py-4 mr-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'security' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>账号安全</button>
                            <button onClick={() => setActiveTab('activity')} className={`py-4 mr-6 text-sm font-bold border-b-2 transition-colors ${activeTab === 'activity' ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-800'}`}>操作日志</button>
                        </div>

                        <div className="p-6">
                            {activeTab === 'profile' && (
                                <div className="grid grid-cols-2 gap-6 animate-fade-in">
                                    <div className="col-span-2"><h4 className="text-sm font-bold text-gray-900 mb-4">身份信息</h4></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">员工工号</label>
                                        <input type="text" defaultValue="EMP-2023-089" disabled className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-500"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">真实姓名</label>
                                        <input type="text" defaultValue="张伟" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">手机号码</label>
                                        <input type="text" defaultValue="13800138000" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"/>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">电子邮箱</label>
                                        <input type="email" defaultValue="zhangwei@hardware.com" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none"/>
                                    </div>
                                    
                                    <div className="col-span-2 mt-4"><h4 className="text-sm font-bold text-gray-900 mb-4">职位信息</h4></div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">所属部门</label>
                                        <select className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none">
                                            <option>销售部</option>
                                            <option>仓储部</option>
                                            <option>财务部</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1">入职日期</label>
                                        <input type="date" defaultValue="2023-10-15" className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none"/>
                                    </div>
                                    
                                    <div className="col-span-2 mt-6 flex justify-end">
                                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">保存更改</button>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'security' && (
                                <div className="space-y-6 animate-fade-in">
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-lg border border-gray-200"><Icons.Ban className="w-6 h-6 text-gray-600"/></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">登录密码</h4>
                                                <p className="text-xs text-gray-500">建议每 3 个月更换一次密码</p>
                                            </div>
                                        </div>
                                        <button className="text-sm font-bold text-primary-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-gray-50">重置密码</button>
                                    </div>
                                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 bg-white rounded-lg border border-gray-200"><Icons.ShieldCheck className="w-6 h-6 text-green-600"/></div>
                                            <div>
                                                <h4 className="text-sm font-bold text-gray-900">账号状态</h4>
                                                <p className="text-xs text-gray-500">当前账号正常使用中</p>
                                            </div>
                                        </div>
                                        <button className="text-sm font-bold text-red-600 bg-white border border-gray-200 px-3 py-1.5 rounded-lg hover:bg-red-50">冻结账号</button>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-bold text-gray-900 mb-3 mt-6">最近登录记录</h4>
                                        <table className="w-full text-left text-sm">
                                            <thead className="text-gray-500 border-b border-gray-100 text-xs uppercase">
                                                <tr>
                                                    <th className="py-2">时间</th>
                                                    <th className="py-2">IP 地址</th>
                                                    <th className="py-2">设备</th>
                                                    <th className="py-2 text-right">状态</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                <tr>
                                                    <td className="py-3">2023-10-27 08:55</td>
                                                    <td className="py-3 font-mono text-gray-600">192.168.1.105</td>
                                                    <td className="py-3">Chrome / Windows</td>
                                                    <td className="py-3 text-right text-green-600 font-bold text-xs">成功</td>
                                                </tr>
                                                <tr>
                                                    <td className="py-3">2023-10-26 09:01</td>
                                                    <td className="py-3 font-mono text-gray-600">192.168.1.105</td>
                                                    <td className="py-3">Chrome / Windows</td>
                                                    <td className="py-3 text-right text-green-600 font-bold text-xs">成功</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'activity' && (
                                <div className="space-y-4 animate-fade-in">
                                    {[
                                        { action: '创建销售订单', target: 'SO-20231027-089', time: '今天 14:30', icon: Icons.FileText, color: 'bg-blue-100 text-blue-600' },
                                        { action: '完成库存盘点', target: 'IV-20231025-001', time: '10-25 16:00', icon: Icons.ClipboardCheck, color: 'bg-purple-100 text-purple-600' },
                                        { action: '修改客户资料', target: '上海建工集团', time: '10-24 11:20', icon: Icons.User, color: 'bg-orange-100 text-orange-600' },
                                        { action: '打印出库单', target: 'DO-20231023-012', time: '10-23 09:45', icon: Icons.Print, color: 'bg-gray-100 text-gray-600' },
                                    ].map((log, i) => (
                                        <div key={i} className="flex gap-4 items-start p-3 hover:bg-gray-50 rounded-lg transition-colors">
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${log.color}`}>
                                                <log.icon className="w-4 h-4"/>
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-gray-900">{log.action}</p>
                                                <p className="text-xs text-gray-500 mt-0.5">{log.target}</p>
                                            </div>
                                            <div className="ml-auto text-xs text-gray-400">{log.time}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// PERMISSION MANAGEMENT (RE-ARCHITECTED)
// ----------------------------------------------------------------------

export const PermissionManagement: React.FC<PageProps> = ({ setPage, user }) => {
    const [selectedUserIndex, setSelectedUserIndex] = useState(0);
    const [searchTerm, setSearchTerm] = useState('');

    const users = [
        { name: '张伟', id: 'EMP001', role: '销售专员', dept: '销售部', avatar: 'ZW', active: true, permissions: ['pos_access', 'order_create'] },
        { name: '李晓红', id: 'EMP002', role: '财务主管', dept: '财务部', avatar: 'LX', active: true, permissions: ['finance_view', 'report_view'] },
        { name: '王强', id: 'EMP003', role: '仓库管理员', dept: '仓储部', avatar: 'WQ', active: true, permissions: ['mobile_app', 'inventory_scan', 'inventory_view'] },
        { name: '陈总', id: 'EMP000', role: '总经理', dept: '总经办', avatar: 'CZ', active: true, permissions: ['mobile_app', 'admin_panel', 'pos_access', 'inventory_scan', 'finance_view', 'approval_manage'] },
    ];

    const handleAddUser = () => {
        const currentCount = users.length;
        const plan = user?.tenantPlan || 'basic';
        let limit = 5;
        if (plan === 'pro') limit = 50;
        if (plan === 'enterprise') limit = 99999;

        if (currentCount >= limit) {
            alert(`当前订阅方案 (${plan}) 用户数已达上限 (${limit}人)。请升级方案以添加更多用户。`);
            return;
        }
        setPage && setPage(Page.USER_DETAIL);
    };

    const roles = [
        { id: 'admin', name: '系统管理员', desc: '拥有所有权限' },
        { id: 'manager', name: '店长/经理', desc: '除系统设置外所有权限' },
        { id: 'sales', name: '销售/收银', desc: '开单、会员、查询库存' },
        { id: 'warehouse', name: '仓管员', desc: '入库、出库、盘点' },
        { id: 'finance', name: '财务', desc: '资金、报表、对账' },
    ];

    const permissions = [
        {
            category: '系统访问',
            icon: Icons.Smartphone,
            items: [
                { id: 'mobile_app', label: '移动端 App 访问权限' },
            ]
        },
        { 
            category: '销售管理', 
            icon: Icons.POS,
            items: [
                { id: 'pos_access', label: '前台收银访问' },
                { id: 'order_create', label: '新建销售订单' },
                { id: 'view_cost', label: '查看商品进价/利润' },
                { id: 'discount', label: '整单折扣权限' },
            ] 
        },
        { 
            category: '库存管理', 
            icon: Icons.Inventory,
            items: [
                { id: 'stock_view', label: '库存查询' },
                { id: 'inbound', label: '采购入库操作' },
                { id: 'outbound', label: '销售出库操作' },
                { id: 'audit', label: '库存盘点/调整' },
            ] 
        },
        { 
            category: '财务数据', 
            icon: Icons.Banknote,
            items: [
                { id: 'report_view', label: '查看经营报表' },
                { id: 'expense', label: '费用录入' },
                { id: 'reconciliation', label: '客户对账' },
            ] 
        },
    ];

    const currentUser = users[selectedUserIndex];

    return (
        <div className="flex h-[calc(100vh-6rem)] animate-fade-in gap-6">
            {/* Left Employee List */}
            <div className="w-72 bg-white rounded-xl border border-gray-200 flex flex-col shadow-sm shrink-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="font-bold text-gray-900">员工列表</h3>
                        <button onClick={handleAddUser} className="text-xs font-bold text-primary-600 flex items-center hover:bg-primary-50 px-2 py-1 rounded transition-colors"><Icons.Plus className="w-3 h-3 mr-1"/>新增</button>
                    </div>
                    <div className="relative">
                        <Icons.Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"/>
                        <input 
                            type="text" 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all" 
                            placeholder="搜索姓名或工号..."
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
                    {users.map((u, i) => (
                        <div key={i} onClick={() => setSelectedUserIndex(i)} className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-all ${i === selectedUserIndex ? 'bg-primary-50 border border-primary-200 shadow-sm' : 'hover:bg-gray-50 border border-transparent'}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs shadow-sm relative ${i === selectedUserIndex ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                {u.avatar}
                                {u.active && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></div>}
                            </div>
                            <div className="min-w-0">
                                <div className="flex justify-between items-center">
                                    <h4 className={`font-bold text-sm truncate ${i === selectedUserIndex ? 'text-primary-900' : 'text-gray-900'}`}>{u.name}</h4>
                                </div>
                                <p className="text-xs text-gray-500 truncate">{u.role} · {u.dept}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Matrix */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-lg font-bold text-gray-600">
                            {currentUser.avatar}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {currentUser.name} 
                                <button onClick={() => setPage && setPage(Page.USER_DETAIL)} className="text-gray-400 hover:text-primary-600"><Icons.UserEdit className="w-4 h-4"/></button>
                            </h2>
                            <p className="text-sm text-gray-500">工号: {currentUser.id} | 部门: {currentUser.dept}</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button className="px-4 py-2 border border-gray-200 rounded-lg text-sm font-bold text-gray-600 hover:bg-gray-50">重置更改</button>
                        <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm flex items-center gap-2"><Icons.Save className="w-4 h-4"/> 保存权限</button>
                    </div>
                </div>
                
                <div className="flex-1 overflow-y-auto p-8 bg-gray-50/30">
                    {/* Role Presets */}
                    <div className="mb-8">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Icons.Briefcase className="w-4 h-4 text-primary-600"/> 快速角色模板
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                            {roles.map(role => (
                                <button key={role.id} className={`p-4 rounded-xl border text-left transition-all hover:shadow-md group ${currentUser.role.includes(role.name.split('/')[0]) ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-white border-gray-200 hover:border-primary-300'}`}>
                                    <div className={`font-bold text-sm mb-1 ${currentUser.role.includes(role.name.split('/')[0]) ? 'text-white' : 'text-gray-900'}`}>{role.name}</div>
                                    <div className={`text-[10px] ${currentUser.role.includes(role.name.split('/')[0]) ? 'text-primary-100' : 'text-gray-500'}`}>{role.desc}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Detailed Matrix */}
                    <div className="space-y-6">
                        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Icons.ShieldCheck className="w-4 h-4 text-primary-600"/> 详细权限配置
                        </h3>
                        
                        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                            {permissions.map((group, idx) => (
                                <div key={idx} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                    <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center gap-2">
                                        <group.icon className="w-4 h-4 text-gray-500"/>
                                        <h4 className="font-bold text-gray-900">{group.category}</h4>
                                    </div>
                                    <div className="p-2">
                                        {group.items.map(perm => {
                                            const isChecked = currentUser.permissions?.includes(perm.id) || false;
                                            
                                            return (
                                                <label key={perm.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                                                    <span className="text-sm font-medium text-gray-700">{perm.label}</span>
                                                    <div className="relative inline-flex items-center cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            className="sr-only peer" 
                                                            checked={isChecked} 
                                                            readOnly // Since we don't have a real update handler for this mock
                                                        />
                                                        <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-primary-600"></div>
                                                    </div>
                                                </label>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export const UserManagement: React.FC<PageProps> = ({ setPage, user }) => {
   return <PermissionManagement setPage={setPage} user={user} />
}

// ----------------------------------------------------------------------
// SETTINGS
// ----------------------------------------------------------------------

export const Settings: React.FC<PageProps> = ({ user, onAddTicket }) => {
    const [activeTab, setActiveTab] = useState('general');
    const [ticketForm, setTicketForm] = useState({
        type: 'bug',
        title: '',
        priority: 'medium',
        desc: ''
    });

    const [ticketSubmitting, setTicketSubmitting] = useState(false);
    const handleSubmitTicket = async (e: React.FormEvent) => {
        e.preventDefault();
        setTicketSubmitting(true);
        try {
            await apiClient.post('/api/tickets', {
                contact_email: user?.email || '',
                subject: ticketForm.title,
                type: ticketForm.type,
                priority: ticketForm.priority,
                body: ticketForm.desc,
            });
            alert('工单提交成功！我们将尽快处理。');
            setTicketForm({ type: 'bug', title: '', priority: 'medium', desc: '' });
            if (onAddTicket) {
                const newTicket: Ticket = {
                    id: `TK-${Date.now().toString().slice(-4)}`,
                    tenantName: user?.tenantName || '未知租户',
                    type: ticketForm.type as any,
                    title: ticketForm.title,
                    description: ticketForm.desc,
                    priority: ticketForm.priority as any,
                    status: 'pending',
                    date: new Date().toLocaleString(),
                };
                onAddTicket(newTicket);
            }
        } catch (err: any) {
            alert('提交失败：' + (err?.response?.data?.message || err?.message || '请稍后重试'));
        } finally {
            setTicketSubmitting(false);
        }
    };

    return (
        <div className="flex h-[calc(100vh-6rem)] animate-fade-in gap-6">
            {/* Sidebar */}
            <div className="w-64 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col shrink-0 overflow-hidden">
                <div className="p-4 border-b border-gray-100 font-bold text-gray-900">设置选项</div>
                <nav className="flex-1 p-2 space-y-1">
                    {[
                        { id: 'general', label: '通用设置', icon: Icons.Settings },
                        { id: 'account', label: '账号安全', icon: Icons.ShieldCheck },
                        { id: 'notification', label: '通知偏好', icon: Icons.Bell },
                        { id: 'integrations', label: '外部集成', icon: Icons.Link },
                        { id: 'backup', label: '数据备份', icon: Icons.Download },
                        { id: 'architecture', label: '系统架构', icon: Icons.Activity },
                        { id: 'support', label: '技术支持', icon: Icons.HelpCircle },
                    ].map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === item.id ? 'bg-primary-50 text-primary-700' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <item.icon className={`w-4 h-4 mr-3 ${activeTab === item.id ? 'text-primary-500' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Content */}
            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-8 overflow-y-auto">
                <h2 className="text-xl font-bold text-gray-900 mb-6 border-b border-gray-100 pb-4">
                    {activeTab === 'general' && '通用设置'}
                    {activeTab === 'account' && '账号安全'}
                    {activeTab === 'notification' && '通知偏好'}
                    {activeTab === 'integrations' && '外部集成'}
                    {activeTab === 'backup' && '数据备份'}
                    {activeTab === 'support' && '技术支持与工单'}
                    {activeTab === 'architecture' && '云原生系统架构'}
                </h2>
                
                {activeTab === 'general' && (
                    <div className="space-y-6 max-w-lg">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">企业名称</label>
                            <input type="text" defaultValue="智汇五金机电有限公司" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">系统语言</label>
                            <select className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white">
                                <option>简体中文 (zh-CN)</option>
                                <option>English (en-US)</option>
                            </select>
                        </div>
                        <div className="pt-4">
                            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">保存设置</button>
                        </div>
                    </div>
                )}

                {activeTab === 'support' && (
                    <div className="max-w-2xl animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-6 mb-8 flex items-start gap-4">
                            <div className="p-2 bg-blue-100 text-blue-600 rounded-lg shrink-0"><Icons.Headphones className="w-6 h-6"/></div>
                            <div>
                                <h3 className="font-bold text-blue-900 text-lg">需要帮助？</h3>
                                <p className="text-sm text-blue-700 mt-1 mb-4">如果您在使用过程中遇到问题或有功能建议，请提交工单，我们的技术团队将尽快为您解决。</p>
                                <div className="flex gap-4 text-sm font-medium text-blue-800">
                                    <span className="flex items-center gap-1"><Icons.Phone className="w-4 h-4"/> 400-888-1234</span>
                                    <span className="flex items-center gap-1"><Icons.Mail className="w-4 h-4"/> support@erp.com</span>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSubmitTicket} className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">工单类型</label>
                                    <select 
                                        value={ticketForm.type}
                                        onChange={e => setTicketForm({...ticketForm, type: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="bug">故障报修</option>
                                        <option value="billing">财务咨询</option>
                                        <option value="feature">功能建议</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">优先级</label>
                                    <select 
                                        value={ticketForm.priority}
                                        onChange={e => setTicketForm({...ticketForm, priority: e.target.value})}
                                        className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none bg-white"
                                    >
                                        <option value="low">低 - 不影响使用</option>
                                        <option value="medium">中 - 部分功能受限</option>
                                        <option value="high">高 - 系统无法使用</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">工单标题</label>
                                <input 
                                    type="text" 
                                    required
                                    value={ticketForm.title}
                                    onChange={e => setTicketForm({...ticketForm, title: e.target.value})}
                                    placeholder="请简要描述您遇到的问题"
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" 
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-2">详细描述</label>
                                <textarea 
                                    rows={5}
                                    required
                                    value={ticketForm.desc}
                                    onChange={e => setTicketForm({...ticketForm, desc: e.target.value})}
                                    placeholder="请提供详细的操作步骤、错误提示或截图链接..."
                                    className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none resize-none" 
                                ></textarea>
                            </div>
                            <div className="pt-2 flex justify-end">
                                <button type="submit" disabled={ticketSubmitting} className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2 disabled:opacity-50">
                                    <Icons.Send className="w-4 h-4"/> {ticketSubmitting ? '提交中...' : '提交工单'}
                                </button>
                            </div>
                        </form>
                    </div>
                )}
                
                {activeTab === 'account' && (
                    <div className="space-y-8 animate-fade-in max-w-3xl">
                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.Lock className="w-5 h-5 text-gray-500"/> 修改密码
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-2">
                                    <label className="block text-sm font-bold text-gray-700 mb-2">当前密码</label>
                                    <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">新密码</label>
                                    <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">确认新密码</label>
                                    <input type="password" className="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-primary-500 outline-none" />
                                </div>
                            </div>
                            <div className="mt-4 flex justify-end">
                                <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-sm font-bold hover:bg-gray-50">更新密码</button>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                    <Icons.ShieldCheck className="w-5 h-5 text-gray-500"/> 两步验证 (2FA)
                                </h3>
                                <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
                                    <input type="checkbox" name="toggle" id="toggle" className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer"/>
                                    <label htmlFor="toggle" className="toggle-label block overflow-hidden h-6 rounded-full bg-gray-300 cursor-pointer"></label>
                                </div>
                            </div>
                            <p className="text-sm text-gray-500 mb-4">开启后，登录时需要输入手机验证码或 Authenticator 动态码，提升账号安全性。</p>
                            <button className="text-primary-600 text-sm font-bold hover:underline">配置验证方式</button>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">最近登录活动</h3>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-4 py-3 font-medium">设备</th>
                                            <th className="px-4 py-3 font-medium">IP 地址</th>
                                            <th className="px-4 py-3 font-medium">时间</th>
                                            <th className="px-4 py-3 font-medium text-right">状态</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <td className="px-4 py-3">Chrome / Windows 10</td>
                                            <td className="px-4 py-3 font-mono text-gray-600">192.168.1.101</td>
                                            <td className="px-4 py-3 text-gray-500">刚刚</td>
                                            <td className="px-4 py-3 text-right text-green-600 font-bold text-xs">当前在线</td>
                                        </tr>
                                        <tr>
                                            <td className="px-4 py-3">Safari / iPhone 13</td>
                                            <td className="px-4 py-3 font-mono text-gray-600">112.10.xx.xx</td>
                                            <td className="px-4 py-3 text-gray-500">2小时前</td>
                                            <td className="px-4 py-3 text-right text-gray-500 text-xs">成功</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'notification' && (
                    <div className="space-y-6 animate-fade-in max-w-3xl">
                        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
                            <Icons.Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5"/>
                            <p className="text-sm text-blue-700">系统重要通知（如安全警报、服务变更）将强制通过系统消息发送，无法关闭。</p>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                    <tr>
                                        <th className="px-6 py-4 font-medium">通知类型</th>
                                        <th className="px-6 py-4 font-medium text-center">站内信</th>
                                        <th className="px-6 py-4 font-medium text-center">邮件</th>
                                        <th className="px-6 py-4 font-medium text-center">短信</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {[
                                        { label: '库存预警', desc: '当商品库存低于安全水位时' },
                                        { label: '订单状态变更', desc: '新订单、发货、退款等状态更新' },
                                        { label: '审批任务提醒', desc: '有新的审批待办或审批结果通知' },
                                        { label: '每日经营日报', desc: '每天早上 9:00 推送昨日经营数据' },
                                    ].map((item, i) => (
                                        <tr key={i} className="hover:bg-gray-50">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{item.label}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">{item.desc}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center"><input type="checkbox" defaultChecked className="rounded text-primary-600 focus:ring-primary-500"/></td>
                                            <td className="px-6 py-4 text-center"><input type="checkbox" defaultChecked={i < 3} className="rounded text-primary-600 focus:ring-primary-500"/></td>
                                            <td className="px-6 py-4 text-center"><input type="checkbox" defaultChecked={i === 0} className="rounded text-primary-600 focus:ring-primary-500"/></td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="flex justify-end">
                            <button className="px-6 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700">保存偏好设置</button>
                        </div>
                    </div>
                )}

                {activeTab === 'integrations' && (
                    <div className="space-y-8 animate-fade-in max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-primary-200 hover:shadow-sm transition-all">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-xl">E</div>
                                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">已连接</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">企业 ERP 系统</h3>
                                    <p className="text-sm text-gray-500 mt-2">同步商品档案、库存数据及财务凭证。</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-400">上次同步: 10分钟前</span>
                                    <button className="text-sm font-bold text-gray-600 hover:text-primary-600">配置</button>
                                </div>
                            </div>
                            <div className="border border-gray-200 rounded-xl p-6 flex flex-col justify-between hover:border-primary-200 hover:shadow-sm transition-all">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">W</div>
                                        <span className="px-2 py-1 bg-gray-100 text-gray-500 rounded text-xs font-bold">未连接</span>
                                    </div>
                                    <h3 className="font-bold text-gray-900 text-lg">微信公众号/小程序</h3>
                                    <p className="text-sm text-gray-500 mt-2">绑定后可推送订单通知，支持微商城订单同步。</p>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                    <span className="text-xs text-gray-400"></span>
                                    <button className="px-4 py-1.5 bg-primary-600 text-white rounded-lg text-xs font-bold hover:bg-primary-700">立即连接</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <Icons.Code className="w-5 h-5 text-gray-500"/> API 密钥管理
                            </h3>
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <p className="text-sm text-gray-600">用于开发者调用系统 API 进行二次开发或数据对接。</p>
                                    <button className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-50">生成新密钥</button>
                                </div>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-white p-3 border border-gray-200 rounded-lg">
                                        <div>
                                            <p className="text-sm font-bold text-gray-900">Production Key 1</p>
                                            <p className="text-xs text-gray-400 font-mono mt-0.5">pk_live_51Mz...x82z</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs text-gray-400">创建于 2023-01-15</span>
                                            <button className="text-red-600 hover:bg-red-50 p-1.5 rounded"><Icons.Trash2 className="w-4 h-4"/></button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'backup' && (
                    <div className="space-y-8 animate-fade-in max-w-4xl">
                        <div className="bg-white border border-gray-200 rounded-xl p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">立即备份</h3>
                                <p className="text-sm text-gray-500 mt-1">手动创建当前系统数据的完整快照，包含数据库与文件。</p>
                            </div>
                            <button className="px-6 py-3 bg-primary-600 text-white rounded-xl font-bold shadow-md hover:bg-primary-700 flex items-center gap-2 transition-transform active:scale-95">
                                <Icons.Download className="w-5 h-5"/> 开始备份
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="border border-gray-200 rounded-xl p-6">
                                <h4 className="font-bold text-gray-900 mb-4">自动备份策略</h4>
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-gray-700">启用自动备份</span>
                                        <div className="relative inline-block w-10 align-middle select-none">
                                            <input type="checkbox" checked className="absolute block w-5 h-5 rounded-full bg-white border-4 appearance-none cursor-pointer right-0 border-primary-600"/>
                                            <div className="block overflow-hidden h-5 rounded-full bg-primary-600 cursor-pointer"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">备份频率</label>
                                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                                            <option>每天 (凌晨 02:00)</option>
                                            <option>每周 (周日 03:00)</option>
                                            <option>每月 (1号 04:00)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 mb-1">保留策略</label>
                                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none bg-white">
                                            <option>保留最近 7 天</option>
                                            <option>保留最近 30 天</option>
                                            <option>永久保留</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="border border-gray-200 rounded-xl p-6 flex flex-col">
                                <h4 className="font-bold text-gray-900 mb-4">存储空间使用</h4>
                                <div className="flex-1 flex flex-col justify-center items-center">
                                    <div className="w-32 h-32 rounded-full border-8 border-gray-100 border-t-primary-500 flex items-center justify-center mb-4">
                                        <div className="text-center">
                                            <span className="block text-2xl font-black text-gray-900">12%</span>
                                            <span className="text-xs text-gray-500">已用</span>
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600">已用 12.5 GB / 总量 100 GB</p>
                                    <button className="mt-4 text-xs font-bold text-primary-600 hover:underline">扩容存储</button>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold text-gray-900 mb-4">备份历史</h3>
                            <div className="border border-gray-200 rounded-xl overflow-hidden">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">备份时间</th>
                                            <th className="px-6 py-3 font-medium">类型</th>
                                            <th className="px-6 py-3 font-medium">大小</th>
                                            <th className="px-6 py-3 font-medium text-right">操作</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {[
                                            { time: '2023-10-27 02:00:00', type: '自动备份', size: '1.2 GB' },
                                            { time: '2023-10-26 02:00:00', type: '自动备份', size: '1.1 GB' },
                                            { time: '2023-10-25 15:30:00', type: '手动备份', size: '1.1 GB' },
                                        ].map((b, i) => (
                                            <tr key={i} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-gray-900">{b.time}</td>
                                                <td className="px-6 py-4 text-gray-500">
                                                    <span className={`px-2 py-0.5 rounded text-xs ${b.type === '自动备份' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-600'}`}>{b.type}</span>
                                                </td>
                                                <td className="px-6 py-4 font-mono text-gray-600">{b.size}</td>
                                                <td className="px-6 py-4 text-right">
                                                    <button className="text-primary-600 hover:text-primary-800 text-xs font-bold mr-3">下载</button>
                                                    <button className="text-gray-500 hover:text-gray-800 text-xs font-bold">恢复</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}
                {activeTab === 'architecture' && (
                    <div className="space-y-8 animate-fade-in max-w-5xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-4 bg-orange-50 border border-orange-100 rounded-xl">
                                <div className="flex items-center gap-2 text-orange-700 font-bold mb-2">
                                    <Icons.Cloud className="w-5 h-5"/> AWS 基础设施
                                </div>
                                <ul className="text-xs text-orange-800 space-y-2">
                                    <li>• <b>API Gateway</b>: 统一接口管理与限流</li>
                                    <li>• <b>Lambda</b>: 无服务器后端逻辑处理</li>
                                    <li>• <b>RDS PostgreSQL</b>: 高可用关系型数据库</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl">
                                <div className="flex items-center gap-2 text-blue-700 font-bold mb-2">
                                    <Icons.ShieldCheck className="w-5 h-5"/> 税务局对接
                                </div>
                                <ul className="text-xs text-blue-800 space-y-2">
                                    <li>• <b>电子发票接口</b>: 实时对接税务局系统</li>
                                    <li>• <b>API 安全</b>: 使用双向 TLS 证书认证</li>
                                    <li>• <b>自动申报</b>: 销项发票自动上传与核销</li>
                                </ul>
                            </div>
                            <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                                <div className="flex items-center gap-2 text-green-700 font-bold mb-2">
                                    <Icons.Print className="w-5 h-5"/> 局域网打印方案
                                </div>
                                <ul className="text-xs text-green-800 space-y-2">
                                    <li>• <b>WebSocket 代理</b>: 解决云端访问内网难题</li>
                                    <li>• <b>零配置入网</b>: 无需公网 IP 或内网穿透</li>
                                    <li>• <b>安全冲突</b>: 仅限出站连接，无安全隐患</li>
                                </ul>
                            </div>
                        </div>

                        <div className="bg-white border border-gray-200 rounded-xl p-6">
                            <h3 className="text-lg font-bold text-gray-900 mb-6">本地打印架构详解</h3>
                            <div className="relative flex flex-col items-center gap-8 py-10">
                                {/* Cloud Side */}
                                <div className="w-full max-w-md p-6 bg-gray-900 text-white rounded-2xl shadow-xl relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-orange-500 text-white text-[10px] font-black rounded-full uppercase">AWS Cloud (Public)</div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Icons.Activity className="w-5 h-5 text-orange-400"/>
                                            <span className="font-bold">Lambda Backend</span>
                                        </div>
                                        <span className="text-xs text-gray-400">Node.js / Python</span>
                                    </div>
                                    <div className="p-3 bg-white/10 rounded-lg border border-white/10 text-xs font-mono">
                                        POST /api/print-job {"{ docId: 'INV-001' }"}
                                    </div>
                                </div>

                                {/* Connection Line */}
                                <div className="flex flex-col items-center gap-2">
                                    <div className="w-px h-16 bg-dashed border-l-2 border-gray-300"></div>
                                    <div className="px-4 py-1.5 bg-white border border-gray-200 rounded-full text-[10px] font-bold text-gray-500 shadow-sm">
                                        WebSocket (Secure WSS)
                                    </div>
                                    <div className="w-px h-16 bg-dashed border-l-2 border-gray-300"></div>
                                </div>

                                {/* Local Side */}
                                <div className="w-full max-w-md p-6 bg-white border-2 border-primary-600 rounded-2xl shadow-xl relative">
                                    <div className="absolute -top-3 left-6 px-3 py-1 bg-primary-600 text-white text-[10px] font-black rounded-full uppercase">Local LAN (Private)</div>
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex items-center gap-2">
                                            <Icons.Monitor className="w-5 h-5 text-primary-600"/>
                                            <span className="font-bold text-gray-900">Print Agent</span>
                                        </div>
                                        <span className="text-xs text-green-600 font-bold flex items-center gap-1">
                                            <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div> 已连接
                                        </span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center gap-2">
                                            <Icons.Print className="w-6 h-6 text-gray-400"/>
                                            <span className="text-[10px] font-bold text-gray-600">标签打印机</span>
                                        </div>
                                        <div className="p-3 bg-gray-50 rounded-lg border border-gray-100 flex flex-col items-center gap-2">
                                            <Icons.Print className="w-6 h-6 text-gray-400"/>
                                            <span className="text-[10px] font-bold text-gray-600">A4 文档打印</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-200">
                                <h4 className="font-bold text-gray-900 text-sm mb-2">安全建议</h4>
                                <p className="text-xs text-gray-600 leading-relaxed">
                                    1. <b>单向连接</b>: 打印代理仅发起向云端的出站连接，无需在防火墙上开启任何入站端口，极大降低了被攻击的风险。<br/>
                                    2. <b>凭证管理</b>: 每个打印代理应使用独立的 AWS IAM 凭证，并遵循最小权限原则，仅允许访问其所属租户的打印队列。<br/>
                                    3. <b>数据加密</b>: 传输过程全程使用 TLS 1.3 加密，确保打印内容（如发票敏感信息）不会被中间人窃取。
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab !== 'general' && activeTab !== 'support' && activeTab !== 'account' && activeTab !== 'notification' && activeTab !== 'integrations' && activeTab !== 'backup' && activeTab !== 'architecture' && (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <Icons.Settings className="w-12 h-12 mb-3 opacity-20" />
                        <p>该模块配置项正在开发中...</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ----------------------------------------------------------------------
// NOTIFICATIONS
// ----------------------------------------------------------------------

export const Notifications: React.FC<PageProps> = ({ setPage }) => {
    const [filter, setFilter] = useState('all');
    
    const notifications = [
        { id: 1, title: '库存预警：304螺栓库存不足', time: '10分钟前', type: 'alert', read: false, desc: 'A-01-02货位库存已低于安全水位线(1000)，请及时补货。' },
        { id: 2, title: '审批通过：10月采购计划', time: '1小时前', type: 'success', read: false, desc: '总经理已批准采购申请 PO-20231027-001。' },
        { id: 3, title: '新订单：上海建工集团', time: '2小时前', type: 'info', read: true, desc: '收到新的销售订单 SO-20231027-089，金额 ¥12,500.00。' },
        { id: 4, title: '系统维护通知', time: '昨天', type: 'system', read: true, desc: '系统将于本周日凌晨 02:00 进行例行维护，预计耗时 2 小时。' },
    ];

    return (
        <div className="flex h-[calc(100vh-6rem)] animate-fade-in flex-col max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h1 className="text-2xl font-bold text-gray-900">消息通知中心</h1>
                <div className="flex gap-2">
                    <button className="text-sm text-gray-500 hover:text-primary-600 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm">全部已读</button>
                    <button className="text-sm text-gray-500 hover:text-primary-600 px-3 py-1.5 bg-white border border-gray-200 rounded-lg shadow-sm"><Icons.Settings className="w-4 h-4" /></button>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col flex-1 overflow-hidden">
                <div className="flex border-b border-gray-100 p-2 gap-2">
                    {['all', 'unread', 'system'].map(f => (
                        <button 
                            key={f} 
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${filter === f ? 'bg-gray-100 text-gray-900' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}
                        >
                            {f === 'all' ? '全部消息' : f === 'unread' ? '未读' : '系统公告'}
                        </button>
                    ))}
                </div>
                <div className="flex-1 overflow-y-auto">
                    {notifications.map(n => (
                        <div key={n.id} className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors flex gap-4 ${!n.read ? 'bg-blue-50/30' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                                n.type === 'alert' ? 'bg-red-100 text-red-600' :
                                n.type === 'success' ? 'bg-green-100 text-green-600' :
                                n.type === 'system' ? 'bg-gray-100 text-gray-600' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                                {n.type === 'alert' ? <Icons.AlertTriangle className="w-5 h-5"/> : 
                                 n.type === 'success' ? <Icons.CheckCircle2 className="w-5 h-5"/> :
                                 n.type === 'system' ? <Icons.Settings className="w-5 h-5"/> :
                                 <Icons.Bell className="w-5 h-5"/>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-1">
                                    <h4 className={`text-sm font-bold ${!n.read ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</h4>
                                    <span className="text-xs text-gray-400 whitespace-nowrap ml-2">{n.time}</span>
                                </div>
                                <p className="text-sm text-gray-500 line-clamp-2">{n.desc}</p>
                            </div>
                            {!n.read && <div className="w-2 h-2 rounded-full bg-red-500 mt-2"></div>}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
