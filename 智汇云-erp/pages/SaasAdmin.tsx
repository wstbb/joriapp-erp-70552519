
import React, { useState, useEffect } from 'react';
import apiClient from '../api'; 
import { Icons } from '../components/Icons';
import { Tenant, Ticket, StatCardProps, Plan, Industry } from '../types';

// --- 辅助函数 ---
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const transformTenantFromApi = (apiTenant: any): Tenant => ({
    id: apiTenant.id.toString(), // 确保ID是字符串
    name: apiTenant.name,
    domain: apiTenant.domain,
    adminName: apiTenant.admin_name || 'N/A',
    adminEmail: apiTenant.admin_email || 'N/A',
    status: apiTenant.status,
    createdAt: apiTenant.created_at,
    plan: apiTenant.plan_name || 'N/A',
    planCode: apiTenant.plan_code || '',
    industry: apiTenant.industry_name || 'N/A',
});

// --- UI 子组件 ---
const StatCard: React.FC<StatCardProps> = ({ title, value, icon, color }) => (
  <div className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm`}>
    <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-inner`}>{icon}</div>
    <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
    <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
  </div>
);

// --- 主组件 ---
export const SaasAdmin: React.FC<{ onLogout: () => void; token: string; }> = ({ onLogout, token }) => {
    
    // --- 状态管理 ---
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [view, setView] = useState<'dashboard' | 'tenant_console'>('dashboard');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

    // 创建/结果 状态
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationResult, setCreationResult] = useState<{ tenant: Tenant, password?: string } | null>(null);

    // --- 数据获取 ---
    useEffect(() => {
        const fetchData = async () => {
            if (!token) { setIsLoading(false); return; }
            try {
                setIsLoading(true);
                const [tenantsRes, plansRes, industriesRes] = await Promise.all([
                    apiClient.get('/api/tenants'),
                    apiClient.get('/admin/plans'),
                    apiClient.get('/admin/industries'),
                ]);
                setTenants(tenantsRes.data.map(transformTenantFromApi));
                setPlans(plansRes.data);
                setIndustries(industriesRes.data);
            } catch (error) { console.error("加载初始数据失败:", error); }
            finally { setIsLoading(false); }
        };
        fetchData();
    }, [token]);

    // --- 核心业务逻辑 ---
    const refreshTenants = async () => {
        try {
            const response = await apiClient.get('/api/tenants');
            setTenants(response.data.map(transformTenantFromApi));
        } catch (error) {
            console.error("刷新租户列表失败:", error);
            alert("无法刷新租户列表，请检查网络连接。");
        }
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.target as HTMLFormElement;
        const payload = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            domain: `${(form.elements.namedItem('domain') as HTMLInputElement).value}.erp.com`,
            adminName: (form.elements.namedItem('adminName') as HTMLInputElement).value,
            adminEmail: (form.elements.namedItem('adminEmail') as HTMLInputElement).value,
            industryId: parseInt((form.elements.namedItem('industryId') as HTMLSelectElement).value, 10),
            planCode: (form.elements.namedItem('planCode') as HTMLSelectElement).value,
        };

        try {
            const response = await apiClient.post('/api/tenants', payload);
            setCreationResult(response.data);
            await refreshTenants(); 
        } catch (error) {
            console.error("创建租户失败:", error);
            alert(`创建失败: ${(error as any).response?.data?.message || (error as Error).message}`);
            setIsSubmitting(false);
        }
    };

    const closeAndResetModal = () => {
        setShowCreateModal(false);
        setIsSubmitting(false);
        setCreationResult(null);
    };
    
    // --- 租户控制台 (TenantConsole) ---
    const TenantConsole = () => {
        if (!selectedTenant) return null;

        const [usage, setUsage] = useState<{ userCount: number; storageSize: string; } | null>(null);
        const [isUpdating, setIsUpdating] = useState(false);

        useEffect(() => {
            const fetchUsage = async () => {
                try {
                    const response = await apiClient.get(`/api/tenants/${selectedTenant.id}/usage`);
                    setUsage(response.data);
                } catch (error) {
                    console.error("获取租户用量失败:", error);
                }
            };
            fetchUsage();
        }, [selectedTenant.id]);

        const updateTenant = async (endpoint: string, payload: object, successMessage: string) => {
            if (isUpdating) return;
            setIsUpdating(true);
            try {
                await apiClient.put(endpoint, payload);
                alert(successMessage);
                await refreshTenants(); // 刷新列表以更新状态
                // 刷新当前选中的租户信息
                const updatedTenant = tenants.find(t => t.id === selectedTenant.id);
                if (updatedTenant) setSelectedTenant(updatedTenant);

            } catch (error) {
                alert(`操作失败: ${(error as any).response?.data?.message || (error as Error).message}`);
            } finally {
                setIsUpdating(false);
            }
        };
        
        const handleStatusChange = () => {
            const newStatus = selectedTenant.status === 'active' ? 'suspended' : 'active';
            if (window.confirm(`确定要将此租户状态变更为 "${newStatus}"吗？`)) {
                updateTenant(`/api/tenants/${selectedTenant.id}/status`, { status: newStatus }, "状态更新成功！");
            }
        };

        const handlePlanChange = () => {
            const newPlanCode = prompt("请输入新的订阅方案代码 (e.g., basic, pro, enterprise):", selectedTenant.planCode);
            if (newPlanCode && newPlanCode !== selectedTenant.planCode) {
                updateTenant(`/api/tenants/${selectedTenant.id}/plan`, { planCode: newPlanCode }, "订阅方案已成功变更！");
            }
        };

        const handleResetPassword = async () => {
            if (window.confirm("确定要重置该租户管理员的密码吗？新密码将显示在屏幕上。")) {
                try {
                    const response = await apiClient.post(`/api/tenants/${selectedTenant.id}/reset-password`);
                    alert(`密码重置成功！新密码是: ${response.data.newPassword}`);
                } catch (error) {
                     alert(`密码重置失败: ${(error as any).response?.data?.message || (error as Error).message}`);
                }
            }
        };

        const handleDeleteTenant = async () => {
            const confirmation = prompt(`这是一个不可逆的操作！请输入租户名称 "${selectedTenant.name}" 以确认删除：`);
            if (confirmation === selectedTenant.name) {
                try {
                    await apiClient.delete(`/api/tenants/${selectedTenant.id}`);
                    alert("租户已永久删除。");
                    setView('dashboard');
                    await refreshTenants();
                } catch (error) {
                    alert(`删除失败: ${(error as any).response?.data?.message || (error as Error).message}`);
                }
            }
        };

        return (
            <div className="animate-fade-in space-y-6">
                 <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.ArrowLeft className="w-5 h-5 text-gray-600"/></button>
                    <div><h2 className="text-2xl font-bold text-gray-900">{selectedTenant.name} - 管理控制台</h2></div>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* ... 基础信息卡片 ... */}
                    <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Info className="w-5 h-5 text-gray-400"/> 基础信息</h3>
                         <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                            <div><label className="text-xs font-bold text-gray-500 uppercase">企业名称</label><p className="font-medium text-gray-900 mt-1">{selectedTenant.name}</p></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">所属行业</label><p className="font-medium text-gray-900 mt-1">{selectedTenant.industry}</p></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">管理员</label><p className="font-medium text-gray-900 mt-1">{selectedTenant.adminName} ({selectedTenant.adminEmail})</p></div>
                            <div><label className="text-xs font-bold text-gray-500 uppercase">创建时间</label><p className="font-medium text-gray-900 mt-1">{formatDate(selectedTenant.createdAt)}</p></div>
                            <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">当前状态</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${selectedTenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedTenant.status === 'active' ? '运行中' : '已停用'}</span>
                                    <button onClick={handleStatusChange} disabled={isUpdating} className="text-xs text-primary-600 hover:underline disabled:text-gray-400">{selectedTenant.status === 'active' ? '停用' : '恢复'}</button>
                                </div>
                            </div>
                           <div>
                                <label className="text-xs font-bold text-gray-500 uppercase">订阅方案</label>
                                <div className="mt-1 flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded text-xs font-bold border 'bg-gray-50 text-gray-600 border-gray-200'}`}>{selectedTenant.plan}</span>
                                    <button onClick={handlePlanChange} disabled={isUpdating} className="text-xs text-primary-600 hover:underline disabled:text-gray-400">变更</button>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* ... 资源用量卡片 ... */}
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                        <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Activity className="w-5 h-5 text-gray-400"/> 资源用量</h3>
                        {usage ? (
                            <div className="space-y-6"> 
                                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">用户数</span><span className="font-bold text-gray-900">{usage.userCount}</span></div></div>
                                <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">存储空间</span><span className="font-bold text-gray-900">{usage.storageSize}</span></div></div>
                            </div>
                        ) : <p className="text-sm text-gray-500">加载用量数据中...</p>}
                    </div>
                    {/* ... 危险区域卡片 ... */}
                    <div className="lg:col-span-3 bg-red-50 rounded-xl border border-red-100 p-6">
                        <h3 className="font-bold text-red-800">危险区域</h3>
                        <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div className="flex flex-col gap-1">
                                <p className="font-semibold text-gray-800">重置管理员密码</p>
                                <p className="text-red-700">管理员将丢失访问权限，直到您提供新密码。</p>
                                <button onClick={handleResetPassword} className="mt-2 text-left text-primary-600 font-bold hover:underline">立即重置</button>
                            </div>
                             <div className="flex flex-col gap-1">
                                <p className="font-semibold text-gray-800">删除此租户</p>
                                <p className="text-red-700">此操作无法撤销，所有相关数据将被永久删除。</p>
                                <button onClick={handleDeleteTenant} className="mt-2 text-left text-red-600 font-bold hover:underline">永久删除</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };
    
    // --- 主渲染 ---
    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg"> 
                <div><h1 className="text-lg font-bold tracking-tight">SaaS 运营管理平台</h1></div>
                <div><button onClick={onLogout} className="p-2 hover:bg-gray-800 rounded-full"><Icons.LogOut className="w-5 h-5" /></button></div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {view === 'dashboard' ? (
                    <div className="animate-fade-in">
                         <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard title="总租户" value={isLoading ? "..." : tenants.length.toString()} icon={<Icons.Users className="w-6 h-6 text-primary-600" />} color="bg-primary-50" />
                            <StatCard title="活跃租户" value={isLoading ? "..." : tenants.filter(t=>t.status==='active').length.toString()} icon={<Icons.Activity className="w-6 h-6 text-green-600" />} color="bg-green-50" />
                        </div>
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                             <div className="p-6 border-b flex justify-between items-center">
                                <h2 className="text-lg font-bold text-gray-900">租户管理</h2>
                                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> 新建租户</button>
                            </div>
                             <div className="overflow-x-auto">
                                {isLoading ? <div className="p-12 text-center">加载中...</div> : (
                                    <table className="w-full text-left text-sm">
                                        <thead><tr><th>企业名称</th><th>管理员</th><th>订阅方案</th><th>创建时间</th><th>状态</th><th></th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tenants.map(tenant => (
                                                <tr key={tenant.id} className="hover:bg-gray-50">
                                                    <td>{tenant.name}</td>
                                                    <td>{tenant.adminName}</td>
                                                    <td>{tenant.plan}</td>
                                                    <td>{formatDate(tenant.createdAt)}</td>
                                                    <td>{tenant.status}</td>
                                                    <td><button onClick={() => { setSelectedTenant(tenant); setView('tenant_console'); }}>管理</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                ) : <TenantConsole />}
            </main>

            {showCreateModal && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                        <div className="px-8 py-6 border-b"><h3 className="text-xl font-bold">{creationResult ? '租户创建成功' : '新建租户实例'}</h3></div>
                        {isSubmitting ? (
                            <div className="p-8 text-center">
                                {creationResult ? (
                                    <div>
                                        <p>初始密码: <strong>{creationResult.password}</strong></p>
                                        <button onClick={closeAndResetModal}>完成</button>
                                    </div>
                                ) : <p>创建中...</p>}
                            </div>
                        ) : (
                            <form onSubmit={handleCreateTenant} className="p-8 space-y-6">
                                {/* ... 表单字段 ... */}
                                <div><label>企业名称</label><input name="name" required /></div>
                                <div><label>专属子域名</label><input name="domain" required /><span>.erp.com</span></div>
                                <div><label>管理员姓名</label><input name="adminName" required /></div>
                                <div><label>联系邮箱</label><input name="adminEmail" type="email" required /></div>
                                <div><label>所属行业</label><select name="industryId" required><option value="">选择行业</option>{industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
                                <div><label>订阅方案</label><select name="planCode" required><option value="">选择方案</option>{plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
                                <button type="submit">立即创建</button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
