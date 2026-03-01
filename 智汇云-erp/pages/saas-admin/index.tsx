
// 智汇云-erp/pages/saas-admin/index.tsx
// SaaS 后台管理系统 - 主仪表盘 (最终精确修正版)

import React, { useState, useEffect } from 'react';
// 修正 #1: 从 react-router-dom 导入 useNavigate
import { useNavigate, Link } from 'react-router-dom';
import apiClient from '../../api'; 
import { Icons } from '../../components/Icons';
import { Tenant, Plan, Industry } from '../../types';
import { StatCard, formatDate, transformTenantFromApi, getTenantsArrayFromResponse } from '../../utils/saasUtils';

const SaasAdminDashboard: React.FC<{ onLogout: () => void; }> = ({ onLogout }) => {
    
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [plans, setPlans] = useState<Plan[]>([]);
    const [industries, setIndustries] = useState<Industry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    // 修正 #2: 初始化 useNavigate
    const navigate = useNavigate();

    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [creationResult, setCreationResult] = useState<{ tenant: { id: string; name: string; domain: string; admin_name?: string; admin_email?: string }; password?: string } | null>(null);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // 先单独拉取租户列表并立即展示，避免因 plans/industries 失败导致整页无数据
                const tenantsRes = await apiClient.get('/api/tenants').catch((e) => {
                    console.error('GET /api/tenants 失败:', e);
                    return { data: [] };
                });
                const rawList = getTenantsArrayFromResponse(tenantsRes.data);
                setTenants(rawList.map((t: any) => transformTenantFromApi(t)));
            } catch (e) {
                console.error('租户列表加载失败:', e);
            }
            try {
                const [plansRes, industriesRes] = await Promise.all([
                    apiClient.get('/admin/plans'),
                    apiClient.get('/admin/industries'),
                ]);
                setPlans(Array.isArray(plansRes.data) ? plansRes.data : []);
                setIndustries(Array.isArray(industriesRes.data) ? industriesRes.data : []);
            } catch (error) {
                console.error('加载 plans/industries 失败:', error);
            }
            setIsLoading(false);
        };
        fetchData();
    }, []);

    const refreshTenants = async () => {
        try {
            const response = await apiClient.get('/api/tenants');
            const rawList = getTenantsArrayFromResponse(response.data);
            setTenants(rawList.map((t: any) => transformTenantFromApi(t)));
        } catch (error) {
            console.error("刷新租户列表失败:", error);
        }
    };

    const handleCreateTenant = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        const form = e.target as HTMLFormElement;
        const payload = {
            name: (form.elements.namedItem('name') as HTMLInputElement).value,
            domain: `${(form.elements.namedItem('domain') as HTMLInputElement).value}.erp.com`,
            admin_name: (form.elements.namedItem('admin_name') as HTMLInputElement).value,
            admin_email: (form.elements.namedItem('admin_email') as HTMLInputElement).value,
            industry_id: parseInt((form.elements.namedItem('industry_id') as HTMLSelectElement).value, 10),
            plan_code: (form.elements.namedItem('plan_code') as HTMLSelectElement).value,
        };

        try {
            const response = await apiClient.post('/api/tenants', payload);
            setCreationResult(response.data as { tenant: { id: string; name: string; domain: string }; password?: string });
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

    const navigateToTenantConsole = (tenantId: string) => {
        // 修正 #3: 使用 navigate 进行页面跳转
        navigate(`/saasadmin/tenants/${tenantId}`);
    };

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
            <header className="bg-gray-900 text-white px-8 py-4 flex justify-between items-center shadow-lg"> 
                <div><h1 className="text-lg font-bold tracking-tight">SaaS 运营管理平台</h1></div>
                <div><button onClick={onLogout} className="p-2 hover:bg-gray-800 rounded-full"><Icons.LogOut className="w-5 h-5" /></button></div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                <div className="animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                        <StatCard title="总租户" value={isLoading ? "..." : tenants.length.toString()} icon={<Icons.Users className="w-6 h-6 text-primary-600" />} color="bg-primary-50" />
                        <StatCard title="活跃租户" value={isLoading ? "..." : tenants.filter(t=>t.status==='active').length.toString()} icon={<Icons.Activity className="w-6 h-6 text-green-600" />} color="bg-green-50" />
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                        <Link to="/saasadmin" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-500 hover:shadow transition-all">
                            <Icons.Users className="w-8 h-8 text-primary-600" />
                            <span className="font-medium text-gray-900">租户管理</span>
                        </Link>
                        <Link to="/saasadmin/plans" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-500 hover:shadow transition-all">
                            <Icons.FileText className="w-8 h-8 text-primary-600" />
                            <span className="font-medium text-gray-900">订阅方案</span>
                        </Link>
                        <Link to="/saasadmin/industries" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-500 hover:shadow transition-all">
                            <Icons.Briefcase className="w-8 h-8 text-primary-600" />
                            <span className="font-medium text-gray-900">行业管理</span>
                        </Link>
                        <Link to="/saasadmin/tickets" className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-primary-500 hover:shadow transition-all">
                            <Icons.HelpCircle className="w-8 h-8 text-primary-600" />
                            <span className="font-medium text-gray-900">工单中心</span>
                        </Link>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        <div className="p-6 border-b flex justify-between items-center">
                            <h2 className="text-lg font-bold text-gray-900">租户管理</h2>
                            <button onClick={() => setShowCreateModal(true)} className="px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-bold shadow-sm hover:bg-primary-700 flex items-center gap-2"><Icons.Plus className="w-4 h-4" /> 新建租户</button>
                        </div>
                        <div className="overflow-x-auto">
                            {isLoading ? <div className="p-12 text-center">加载中...</div> : (
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                      <tr className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        <th className="px-6 py-3">企业名称</th>
                                        <th className="px-6 py-3">管理员</th>
                                        <th className="px-6 py-3">订阅方案</th>
                                        <th className="px-6 py-3">创建时间</th>
                                        <th className="px-6 py-3">状态</th>
                                        <th className="px-6 py-3"></th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {tenants.map(tenant => (
                                            <tr key={tenant.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 font-medium text-gray-900">{tenant.name}</td>
                                                <td className="px-6 py-4 text-gray-600">{tenant.admin_name}</td>
                                                <td className="px-6 py-4 text-gray-600">{tenant.plan}</td>
                                                <td className="px-6 py-4 text-gray-600">{formatDate(tenant.created_at)}</td>
                                                <td className="px-6 py-4">
                                                    <span className={`px-2 py-1 rounded text-xs font-bold ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tenant.status === 'active' ? '运行中' : '已停用'}</span>
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <button onClick={() => navigateToTenantConsole(tenant.id)} className="font-medium text-primary-600 hover:text-primary-800">管理</button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            {showCreateModal && (
                 <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center animate-fade-in-fast" onClick={closeAndResetModal}>
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b">
                            <h3 className="text-xl font-bold text-gray-900">{creationResult ? '租户创建成功' : '新建租户实例'}</h3>
                            <p className="text-sm text-gray-500 mt-1">创建一个新的企业租户，并为其配置初始信息。</p>
                        </div>
                        
                        {isSubmitting && !creationResult ? (
                            <div className="p-12 text-center"><p className="text-lg font-semibold">正在创建实例...</p></div>
                        ) : creationResult ? (
                            <div className="p-8 text-center bg-green-50">
                                <Icons.CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                                <h4 className="text-2xl font-bold text-gray-900 mb-2">创建成功！</h4>
                                <p className="text-gray-600 mb-6">租户 <strong>{creationResult.tenant.name}</strong> 已准备就绪。</p>
                                <div className="bg-white border rounded-lg p-4 space-y-2 text-left">
                                    <p className="text-sm"><span className="font-semibold">登录地址:</span> {creationResult.tenant.domain}</p>
                                    <p className="text-sm"><span className="font-semibold">管理员账号:</span> admin@{creationResult.tenant.domain}</p>
                                    <p className="text-sm"><span className="font-semibold">初始密码:</span> <strong className="text-lg text-red-600">{creationResult.password}</strong></p>
                                </div>
                                <p className="text-xs text-gray-500 mt-4">请妥善保管初始密码，建议管理员首次登录后立即修改。</p>
                                <button onClick={closeAndResetModal} className="mt-6 w-full px-4 py-3 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700">完成</button>
                            </div>
                        ) : (
                            <form onSubmit={handleCreateTenant} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">企业名称</label><input name="name" required className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500" /></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">专属子域名</label><div className="flex items-center"><input name="domain" required className="w-full border-gray-300 rounded-l-lg shadow-sm focus:border-primary-500 focus:ring-primary-500" /><span className="inline-flex items-center px-3 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">.erp.com</span></div></div>
                                </div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">管理员姓名</label><input name="admin_name" required className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500" /></div>
                                <div><label className="block text-sm font-medium text-gray-700 mb-1">联系邮箱</label><input name="admin_email" type="email" required className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500" /></div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">所属行业</label><select name="industry_id" required className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"><option value="">选择行业</option>{industries.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}</select></div>
                                    <div><label className="block text-sm font-medium text-gray-700 mb-1">订阅方案</label><select name="plan_code" required className="w-full border-gray-300 rounded-lg shadow-sm focus:border-primary-500 focus:ring-primary-500"><option value="">选择方案</option>{plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}</select></div>
                                </div>
                                <div className="flex justify-end gap-4 pt-4">
                                    <button type="button" onClick={closeAndResetModal} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">取消</button>
                                    <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg shadow-sm hover:bg-primary-700">立即创建</button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SaasAdminDashboard;
