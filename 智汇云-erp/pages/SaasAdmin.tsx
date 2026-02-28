
import React, { useState, useEffect } from 'react';
import apiClient from '../api'; // 【修正】导入 apiClient
import { Icons } from '../components/Icons';
import { Tenant, Ticket, StatCardProps } from '../types';

// 【修正】删除硬编码的 API_ENDPOINT
// const API_ENDPOINT = 'https://w3uhc17ssi.execute-api.ap-northeast-1.amazonaws.com/';

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString();
};

const transformTenantFromApi = (apiTenant: any): Tenant => ({
    id: apiTenant.id,
    name: apiTenant.name,
    domain: apiTenant.domain,
    adminName: apiTenant.admin_name || 'N/A',
    adminEmail: apiTenant.admin_email || 'N/A',
    status: apiTenant.status,
    createdAt: apiTenant.created_at,
    plan: apiTenant.plan,
    industry: apiTenant.industry
});

const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel, icon, color, onClick }) => (
  <div onClick={onClick} className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden`}>
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500`}>
        <div className={`p-4 rounded-full ${color.replace('bg-', 'text-')}`}>{React.cloneElement(icon as React.ReactElement, { className: 'w-16 h-16' })}</div>
    </div>
    <div className="relative z-10">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-inner`}>{icon}</div>
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
        {trend !== undefined && (
            <div className="mt-4 flex items-center text-xs font-medium">
            <span className={`flex items-center px-2 py-0.5 rounded-full ${trend >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {trend >= 0 ? <Icons.TrendingUp className="w-3 h-3 mr-1" /> : <Icons.TrendingDown className="w-3 h-3 mr-1" />}
                {Math.abs(trend)}%
            </span>
            <span className="text-gray-400 ml-2">{trendLabel}</span>
            </div>
        )}
    </div>
  </div>
);

export const SaasAdmin: React.FC<{ 
    onLogout: () => void;
    tickets: Ticket[];
    onResolveTicket: (id: string) => void;
    token: string;
}> = ({ onLogout, tickets, onResolveTicket, token }) => {
    
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationResult, setCreationResult] = useState<Tenant & { initialPassword?: string } | null>(null);
    const [view, setView] = useState<'dashboard' | 'tenant_console' | 'ticket_list' | 'ticket_detail'>('dashboard');
    const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

    // 【修正】使用 apiClient 和传入的 token
    useEffect(() => {
        const fetchTenants = async () => {
            if (!token) {
                setIsLoading(false);
                // 生产环境中最好不要用 alert，但为了调试暂时保留
                alert("认证信息丢失，无法加载租户数据。");
                return;
            }

            try {
                setIsLoading(true);
                // apiClient 已经配置了 baseURL 和 Authorization header
                const response = await apiClient.get('/api/tenants');
                const transformedTenants = response.data.map(transformTenantFromApi);
                setTenants(transformedTenants);

            } catch (error) {
                console.error("Error fetching tenants:", error);
                alert(`加载租户列表失败: ${(error as Error).message}`);
            } finally {
                setIsLoading(false);
            }
        };

        fetchTenants();
    }, [token]);
    
    const activeTenants = tenants.filter(t => t.status === 'active').length;
    const pendingTickets = tickets.filter(t => t.status !== 'resolved').length;
    const newThisMonth = tenants.filter(t => {
        const createdAt = new Date(t.createdAt);
        const now = new Date();
        return createdAt.getMonth() === now.getMonth() && createdAt.getFullYear() === now.getFullYear();
    }).length;
    
    const closeAndResetModal = () => { setShowCreateModal(false); setIsSubmitting(false); setCreationResult(null); };
    const handleEnterConsole = (tenant: Tenant) => { setSelectedTenant(tenant); setView('tenant_console'); };
    const handleViewTicket = (ticket: Ticket) => { setSelectedTicket(ticket); setView('ticket_detail'); };
    const handleResolveTicket = (id: string) => { onResolveTicket(id); if (selectedTicket && selectedTicket.id === id) { setSelectedTicket({ ...selectedTicket, status: 'resolved' }); } };

    // 【修正】使用 apiClient 创建新租户
    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!token) {
            alert("认证信息丢失，无法创建租户。");
            return;
        }

        setIsSubmitting(true);
        setCreationResult(null);

        const form = e.target as HTMLFormElement;
        const name = (form.elements.namedItem('name') as HTMLInputElement).value;
        const domainPrefix = (form.elements.namedItem('domain') as HTMLInputElement).value;
        const domain = `${domainPrefix}.erp.com`;
        const adminName = (form.elements.namedItem('adminName') as HTMLInputElement).value;
        const adminEmail = (form.elements.namedItem('adminEmail') as HTMLInputElement).value;
        const industry = (form.elements.namedItem('industry') as HTMLSelectElement).value;
        const plan = (form.elements.namedItem('plan') as HTMLSelectElement).value as any;

        const newTenantPayload = { name, domain, adminName, adminEmail, industry, plan };

        try {
            // apiClient 会自动处理认证
            const response = await apiClient.post('/api/tenants', newTenantPayload);

            const result = response.data;
            const newTenant = transformTenantFromApi(result.tenant);
            
            setTenants([newTenant, ...tenants]);
            setCreationResult({ ...newTenant, initialPassword: result.password || '123456' });
            
        } catch (error) {
            console.error("Error creating tenant:", error);
            alert(`创建失败: ${(error as Error).message}`);
            setIsSubmitting(false);
        }
    };
    
    const TenantConsole = () => {
        if (!selectedTenant) return null;
        const displayTenant = { ...selectedTenant, createdAt: formatDate(selectedTenant.createdAt) };
        return (
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4 mb-2">
                    <button onClick={() => setView('dashboard')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.ArrowLeft className="w-5 h-5 text-gray-600"/></button>
                    <div><h2 className="text-2xl font-bold text-gray-900">{displayTenant.name} - 管理控制台</h2><p className="text-sm text-gray-500">Instance ID: {displayTenant.id} | Domain: {displayTenant.domain}</p></div>
                    <div className="ml-auto flex gap-3"><button className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 shadow-sm flex items-center gap-2"><Icons.Lock className="w-4 h-4"/> 重置管理员密码</button><button className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm flex items-center gap-2"><Icons.LogIn className="w-4 h-4"/> 模拟登录</button></div>
                </div>
                <div className="grid grid-cols-3 gap-6">
                    <div className="col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Info className="w-5 h-5 text-gray-400"/> 基础信息</h3><div className="grid grid-cols-2 gap-y-6 gap-x-4"><div><label className="text-xs font-bold text-gray-500 uppercase">企业名称</label><p className="font-medium text-gray-900 mt-1">{displayTenant.name}</p></div><div><label className="text-xs font-bold text-gray-500 uppercase">所属行业</label><p className="font-medium text-gray-900 mt-1">{displayTenant.industry || '未设置'}</p></div><div><label className="text-xs font-bold text-gray-500 uppercase">管理员</label><div className="flex items-center gap-2 mt-1"><div className="w-6 h-6 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-600">{displayTenant.adminName[0]}</div><span className="font-medium text-gray-900">{displayTenant.adminName}</span><span className="text-xs text-gray-400">({displayTenant.adminEmail})</span></div></div><div><label className="text-xs font-bold text-gray-500 uppercase">创建时间</label><p className="font-medium text-gray-900 mt-1">{displayTenant.createdAt}</p></div><div><label className="text-xs font-bold text-gray-500 uppercase">当前状态</label><div className="mt-1"><span className={`px-2 py-1 rounded text-xs font-bold ${displayTenant.status === 'active' ? 'bg-green-100 text-green-700' : displayTenant.status === 'suspended' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{displayTenant.status === 'active' ? '运行中' : displayTenant.status === 'suspended' ? '已停用' : '部署中'}</span></div></div><div><label className="text-xs font-bold text-gray-500 uppercase">订阅方案</label><div className="mt-1 flex items-center gap-2"><span className={`px-2 py-1 rounded text-xs font-bold border ${displayTenant.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' : displayTenant.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{displayTenant.plan.toUpperCase()}</span><button className="text-xs text-primary-600 hover:underline">变更</button></div></div></div></div>
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6"><h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Activity className="w-5 h-5 text-gray-400"/> 资源用量</h3><div className="space-y-6"><div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">用户数</span><span className="font-bold text-gray-900">12 / {displayTenant.plan === 'basic' ? 5 : displayTenant.plan === 'pro' ? 50 : '∞'}</span></div><div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="bg-blue-500 h-full rounded-full" style={{width: '24%'}}></div></div></div><div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">存储空间</span><span className="font-bold text-gray-900">45 GB / 100 GB</span></div><div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="bg-green-500 h-full rounded-full" style={{width: '45%'}}></div></div></div><div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">API 调用 (本月)</span><span className="font-bold text-gray-900">128.5k</span></div><div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden"><div className="bg-purple-500 h-full rounded-full" style={{width: '60%'}}></div></div></div></div></div>
                    <div className="col-span-3 bg-red-50 rounded-xl border border-red-100 p-6 flex justify-between items-center"><div><h3 className="font-bold text-red-800">危险区域</h3><p className="text-sm text-red-600 mt-1">停用租户将导致所有用户无法登录；删除操作不可恢复。</p></div><div className="flex gap-3">{displayTenant.status === 'active' ? (<button onClick={() => { setTenants(tenants.map(t => t.id === displayTenant.id ? {...t, status: 'suspended'} : t)); setSelectedTenant({...displayTenant, status: 'suspended', createdAt: selectedTenant.createdAt}); }} className="px-4 py-2 bg-white border border-red-200 text-red-600 rounded-lg text-sm font-bold hover:bg-red-50">停用服务</button>) : (<button onClick={() => { setTenants(tenants.map(t => t.id === displayTenant.id ? {...t, status: 'active'} : t)); setSelectedTenant({...displayTenant, status: 'active', createdAt: selectedTenant.createdAt}); }} className="px-4 py-2 bg-white border border-green-200 text-green-600 rounded-lg text-sm font-bold hover:bg-green-50">恢复服务</button>)}<button className="px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-bold hover:bg-red-700 shadow-sm">删除实例</button></div></div>
                </div>
            </div>
        );
     };
    const TicketDetail = () => {
        if (!selectedTicket) return null;
        return (
            <div className="animate-fade-in space-y-6">
                <div className="flex items-center gap-4 mb-2"><button onClick={() => setView('ticket_list')} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><Icons.ArrowLeft className="w-5 h-5 text-gray-600"/></button><div><h2 className="text-2xl font-bold text-gray-900">工单详情</h2><p className="text-sm text-gray-500">工单编号: {selectedTicket.id}</p></div><div className="ml-auto">{selectedTicket.status !== 'resolved' && (<button onClick={() => handleResolveTicket(selectedTicket.id)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold hover:bg-primary-700 shadow-sm flex items-center gap-2"><Icons.CheckCircle2 className="w-4 h-4"/> 标记为已解决</button>)}</div></div>
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-8">{/* ... */}</div>
            </div>
        );
    };
    const TicketList = () => {
        const [filter, setFilter] = useState<'all' | 'pending' | 'resolved'>('all');
        const filteredTickets = tickets.filter(t => filter === 'all' || (filter === 'pending' ? t.status !== 'resolved' : t.status === 'resolved'));
        return <div className="animate-fade-in space-y-6">{/* ... */}</div>;
    };


    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg">
                <div className="flex items-center gap-3"><div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center font-bold text-xl shadow-lg shadow-primary-900/50">S</div><div><h1 className="text-lg font-bold tracking-tight">SaaS 运营管理平台</h1><p className="text-xs text-gray-400">超级管理员控制台</p></div></div>
                <div className="flex items-center gap-4"><span className="text-sm text-gray-300">System Admin</span><button onClick={onLogout} className="p-2 hover:bg-gray-800 rounded-full transition-colors text-gray-400 hover:text-white"><Icons.LogOut className="w-5 h-5" /></button></div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                {view === 'dashboard' && (
                    <div className="animate-fade-in">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                            <StatCard title="总租户" value={isLoading ? "..." : tenants.length.toString()} icon={<Icons.Users className="w-6 h-6 text-primary-600" />} color="bg-primary-50" />
                            <StatCard title="活跃租户" value={isLoading ? "..." : activeTenants.toString()} icon={<Icons.Activity className="w-6 h-6 text-green-600" />} color="bg-green-50" />
                            <StatCard title="待处理工单" value={isLoading ? "..." : pendingTickets.toString()} icon={<Icons.AlertTriangle className="w-6 h-6 text-orange-600" />} color="bg-orange-50" onClick={() => setView('ticket_list')} />
                            <StatCard title="本月新增" value={isLoading ? "..." : newThisMonth.toString()} icon={<Icons.NewUser className="w-6 h-6 text-indigo-600" />} color="bg-indigo-50" />
                        </div>

                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <div><h2 className="text-lg font-bold text-gray-900">租户管理</h2><p className="text-sm text-gray-500 mt-1">管理所有企业实例及部署状态</p></div>
                                <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2 transition-all active:scale-95"><Icons.Plus className="w-4 h-4" /> 新建租户实例</button>
                            </div>
                            <div className="overflow-x-auto">
                                {isLoading ? <div className="text-center p-12 text-gray-500">加载租户列表中...</div> : (
                                    <table className="w-full text-left text-sm">
                                        <thead className="bg-gray-50 text-gray-500 font-medium border-b border-gray-200"><tr><th className="px-6 py-4">企业名称 / 域名</th><th className="px-6 py-4">管理员</th><th className="px-6 py-4">订阅方案</th><th className="px-6 py-4">创建时间</th><th className="px-6 py-4">状态</th><th className="px-6 py-4 text-right">操作</th></tr></thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {tenants.map(tenant => (
                                                <tr key={tenant.id} className="hover:bg-gray-50 transition-colors group">
                                                    <td className="px-6 py-4"><div className="font-bold text-gray-900">{tenant.name}</div><div className="text-xs text-gray-500 font-mono mt-0.5 flex items-center gap-1"><Icons.Link className="w-3 h-3"/> {tenant.domain}</div></td>
                                                    <td className="px-6 py-4"><div className="font-medium text-gray-900">{tenant.adminName}</div><div className="text-xs text-gray-500">{tenant.adminEmail}</div></td>
                                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-xs font-bold uppercase tracking-wider border ${tenant.plan === 'enterprise' ? 'bg-purple-50 text-purple-700 border-purple-100' : tenant.plan === 'pro' ? 'bg-blue-50 text-blue-700 border-blue-100' : 'bg-gray-50 text-gray-600 border-gray-200'}`}>{tenant.plan}</span></td>
                                                    <td className="px-6 py-4 text-gray-500 font-mono text-xs">{formatDate(tenant.createdAt)}</td>
                                                    <td className="px-6 py-4"><span className={`flex items-center gap-1.5 text-xs font-bold ${tenant.status === 'active' ? 'text-green-600' : tenant.status === 'deploying' ? 'text-blue-600' : 'text-red-500'}`}><span className={`w-2 h-2 rounded-full ${tenant.status === 'active' ? 'bg-green-500' : tenant.status === 'deploying' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></span>{tenant.status === 'active' ? '运行中' : tenant.status === 'deploying' ? '部署中' : '已停用'}</span></td>
                                                    <td className="px-6 py-4 text-right"><button onClick={() => handleEnterConsole(tenant)} className="text-gray-400 hover:text-primary-600 font-medium text-xs border border-gray-200 hover:border-primary-200 rounded px-3 py-1.5 transition-colors bg-white">管理控制台</button></td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {view === 'tenant_console' && <TenantConsole />}
                {view === 'ticket_list' && <TicketList />}
                {view === 'ticket_detail' && <TicketDetail />}
            </main>

            {showCreateModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden transition-all">
                        <div className="px-8 py-6 border-b border-gray-100 bg-gray-50 flex justify-between items-center"><h3 className="text-xl font-bold text-gray-900">{creationResult ? '租户创建成功' : '新建租户实例'}</h3><button onClick={closeAndResetModal} className="text-gray-400 hover:text-gray-600"><Icons.Close className="w-6 h-6"/></button></div>
                        {isSubmitting ? (
                            !creationResult ? (
                                <div className="p-12 flex flex-col items-center justify-center text-center"><div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mb-6"></div><h4 className="text-lg font-bold text-gray-900 mb-2">正在创建实例...</h4><div className="space-y-2 text-sm text-gray-500 w-full max-w-xs"><div className="flex justify-between items-center"><span>初始化数据库</span> <Icons.Check className="w-4 h-4 text-green-500"/></div><div className="flex justify-between items-center"><span>配置独立域名</span> <Icons.Check className="w-4 h-4 text-green-500"/></div><div className="flex justify-between items-center"><span>生成管理员账号</span> <span className="animate-pulse">...</span></div></div></div>
                            ) : (
                                <div className="p-8"><div className="text-center mb-6"><div className="w-20 h-20 mx-auto bg-green-100 rounded-full flex items-center justify-center border-4 border-green-200"><Icons.Rocket className="w-10 h-10 text-green-600" /></div></div><div className="space-y-3 bg-gray-50 rounded-xl p-6 border border-gray-200"><div className="flex justify-between"><span className="text-sm text-gray-500">企业名称</span><span className="text-sm font-bold text-gray-900">{creationResult.name}</span></div><div className="flex justify-between"><span className="text-sm text-gray-500">访问域名</span><span className="text-sm font-mono text-gray-900">{creationResult.domain}</span></div><div className="flex justify-between"><span className="text-sm text-gray-500">管理员账号</span><span className="text-sm font-mono text-gray-900">{creationResult.adminEmail}</span></div><div className="flex justify-between items-center"><span className="text-sm text-gray-500">初始密码</span><span className="text-lg font-bold text-red-600 bg-red-50 px-2 rounded">{creationResult.initialPassword}</span></div></div><div className="mt-6"><button onClick={closeAndResetModal} className="w-full py-3 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all">完成</button></div></div>
                            )
                        ) : (
                            <form onSubmit={handleCreateTenant} className="p-8 space-y-6">
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">企业名称</label><input name="name" type="text" required placeholder="例如: 杭州xx科技有限公司" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow" /></div>
                                <div><label className="block text-sm font-bold text-gray-700 mb-2">专属子域名</label><div className="flex items-center"><input name="domain" type="text" required placeholder="company-name" className="flex-1 border border-gray-300 rounded-l-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow z-10 relative" /><span className="bg-gray-100 border border-l-0 border-gray-300 text-gray-500 px-4 py-3 rounded-r-xl font-mono text-sm">.erp.com</span></div><p className="text-xs text-gray-400 mt-2">系统将自动配置 SSL 证书与 DNS 解析</p></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">管理员姓名</label><input name="adminName" type="text" required placeholder="张三" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow" /></div><div><label className="block text-sm font-bold text-gray-700 mb-2">联系邮箱</label><input name="adminEmail" type="email" required placeholder="admin@company.com" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none transition-shadow" /></div></div>
                                <div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold text-gray-700 mb-2">所属行业</label><select name="industry" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none bg-white"><option value="hardware">五金机电</option><option value="construction">建筑建材</option><option value="manufacturing">生产制造</option><option value="retail">零售百货</option><option value="other">其他行业</option></select></div><div><label className="block text-sm font-bold text-gray-700 mb-2">订阅方案</label><select name="plan" className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary-500 outline-none bg-white"><option value="basic">基础版 (Basic) - max 5 users</option><option value="pro">专业版 (Pro) - max 50 users, Mobile App</option><option value="enterprise">企业版 (Enterprise) - Unlimited, AI Features</option></select></div></div>
                                <div className="pt-4"><button type="submit" className="w-full py-4 bg-gray-900 text-white rounded-xl font-bold shadow-lg hover:bg-black transition-all active:scale-95 flex items-center justify-center gap-2"><Icons.Rocket className="w-5 h-5" /> 立即创建</button></div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
