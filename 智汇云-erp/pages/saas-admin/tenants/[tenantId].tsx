
// 智汇云-erp/pages/saas-admin/tenants/[tenantId].tsx
// SaaS 后台管理系统 - 单个租户的管理控制台 (最终精确修正版)

import React, { useState, useEffect } from 'react';
// 修正 #1: 从 react-router-dom 导入正确的 hooks 和组件
import { useParams, useNavigate, Link } from 'react-router-dom';
import apiClient from '../../../api'; 
import { Icons } from '../../../components/Icons';
import { Tenant } from '../../../types';
import { formatDate, transformTenantFromApi, getTenantsArrayFromResponse } from '../../../utils/saasUtils';

const TenantConsolePage: React.FC = () => {
    // 修正 #2: 使用正确的 hooks 获取路由参数和导航函数
    const { tenantId } = useParams<{ tenantId: string }>();
    const navigate = useNavigate();

    const [tenant, setTenant] = useState<Tenant | null>(null);
    const [usage, setUsage] = useState<{ userCount: number; storageSize: string; maxUsers?: number; maxStorageGb?: number; aiCallsPerDay?: number; storageBytes?: number } | null>(null);
    const [history, setHistory] = useState<{ id: number; action: string; changed_by: string; changed_at: string; payload?: unknown }[]>([]);
    const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    const fetchTenantData = async () => {
        if (!tenantId) return;
        setIsLoading(true);
        try {
            const tenantsRes = await apiClient.get('/api/tenants'); 
            const rawList = getTenantsArrayFromResponse(tenantsRes.data);
            const currentTenant = rawList.map((t: any) => transformTenantFromApi(t)).find((t: Tenant) => t.id === tenantId);
            
            if (currentTenant) {
                setTenant(currentTenant);
                const [usageRes, historyRes] = await Promise.all([
                    apiClient.get(`/api/tenants/${tenantId}/usage`),
                    apiClient.get(`/api/tenants/${tenantId}/history`).catch(() => ({ data: [] })),
                ]);
                setUsage(usageRes.data);
                setHistory(Array.isArray(historyRes.data) ? historyRes.data : []);
            } else {
                throw new Error('找不到指定的租户');
            }
        } catch (error) {
            console.error("获取租户数据失败:", error);
            alert("无法加载租户信息。");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchTenantData();
    }, [tenantId]);

    const updateTenant = async (endpoint: string, payload: object, successMessage: string) => {
        if (isUpdating) return;
        setIsUpdating(true);
        try {
            await apiClient.put(endpoint, payload);
            alert(successMessage);
            await fetchTenantData();
        } catch (error) {
            alert(`操作失败: ${(error as any).response?.data?.message || (error as Error).message}`);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleStatusChange = () => {
        if (!tenant) return;
        const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
        if (window.confirm(`确定要将此租户状态变更为 "${newStatus}"吗？`)) {
            updateTenant(`/api/tenants/${tenant.id}/status`, { status: newStatus }, "状态更新成功！");
        }
    };

    const handlePlanChange = () => {
        if (!tenant) return;
        const newPlanCode = prompt("请输入新的订阅方案代码 (e.g., basic, pro, enterprise):", tenant.plan_code);
        if (newPlanCode && newPlanCode !== tenant.plan_code) {
            updateTenant(`/api/tenants/${tenant.id}/plan`, { planCode: newPlanCode }, "订阅方案已成功变更！");
        }
    };

    const handleResetPassword = async () => {
        if (!tenant) return;
        if (window.confirm("确定要重置该租户管理员的密码吗？新密码将显示在屏幕上。")) {
            try {
                const response = await apiClient.post(`/api/tenants/${tenant.id}/reset-password`);
                alert(`密码重置成功！新密码是: ${response.data.newPassword}`);
            } catch (error) {
                 alert(`密码重置失败: ${(error as any).response?.data?.message || (error as Error).message}`);
            }
        }
    };

    const handleDeleteTenant = async () => {
        if (!tenant) return;
        const confirmation = prompt(`这是一个不可逆的操作！请输入租户名称 "${tenant.name}" 以确认删除：`);
        if (confirmation === tenant.name) {
            try {
                await apiClient.delete(`/api/tenants/${tenant.id}`);
                alert("租户已永久删除。");
                // 修正 #3: 使用 navigate进行页面跳转
                navigate('/saasadmin');
            } catch (error) {
                alert(`删除失败: ${(error as any).response?.data?.message || (error as Error).message}`);
            }
        }
    };

    if (isLoading) return <div className="flex h-screen items-center justify-center"><p>加载租户信息中...</p></div>;
    if (!tenant) return <div className="flex h-screen items-center justify-center"><p>未找到该租户。</p></div>

    return (
        <div className="min-h-screen bg-gray-50 font-sans text-gray-900">
             <header className="bg-white border-b border-gray-200 px-8 py-4 flex justify-between items-center"> 
                <div className="flex items-center gap-4">
                    {/* 修正 #4: 使用 react-router-dom 的 Link 写法 */}
                    <Link to="/saasadmin" className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                       <Icons.ArrowLeft className="w-5 h-5 text-gray-600"/>
                    </Link>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight text-gray-900">{tenant.name}</h1>
                        <p className="text-sm text-gray-500">管理控制台</p>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto p-8">
                <div className="animate-fade-in space-y-6">
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Info className="w-5 h-5 text-gray-400"/> 基础信息</h3>
                            <div className="grid grid-cols-2 gap-y-6 gap-x-4">
                                <div><label className="text-xs font-bold text-gray-500 uppercase">企业名称</label><p className="font-medium text-gray-900 mt-1">{tenant.name}</p></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">所属行业</label><p className="font-medium text-gray-900 mt-1">{tenant.industry}</p></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">管理员</label><p className="font-medium text-gray-900 mt-1">{tenant.admin_name} ({tenant.admin_email})</p></div>
                                <div><label className="text-xs font-bold text-gray-500 uppercase">创建时间</label><p className="font-medium text-gray-900 mt-1">{formatDate(tenant.created_at)}</p></div>
                                <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">当前状态</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className={`px-2 py-1 rounded text-xs font-bold ${tenant.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{tenant.status === 'active' ? '运行中' : '已停用'}</span>
                                        <button onClick={handleStatusChange} disabled={isUpdating} className="text-xs text-primary-600 hover:underline disabled:text-gray-400">{tenant.status === 'active' ? '停用' : '恢复'}</button>
                                    </div>
                                </div>
                            <div>
                                    <label className="text-xs font-bold text-gray-500 uppercase">订阅方案</label>
                                    <div className="mt-1 flex items-center gap-2">
                                        <span className="px-2 py-1 rounded text-xs font-bold bg-gray-50 text-gray-600 border border-gray-200">{tenant.plan}</span>
                                        <button onClick={handlePlanChange} disabled={isUpdating} className="text-xs text-primary-600 hover:underline disabled:text-gray-400">变更</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Icons.Activity className="w-5 h-5 text-gray-400"/> 资源用量</h3>
                            {usage ? (
                                <div className="space-y-6">
                                    <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">用户数</span><span className="font-bold text-gray-900">{usage.maxUsers != null ? `${usage.userCount} / ${usage.maxUsers}` : usage.userCount}</span></div></div>
                                    <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">存储空间</span><span className="font-bold text-gray-900">{usage.maxStorageGb != null ? `${usage.storageSize} / ${usage.maxStorageGb} GB` : usage.storageSize}</span></div></div>
                                    {usage.aiCallsPerDay != null && <div><div className="flex justify-between text-sm mb-1"><span className="text-gray-600">AI 调用/日</span><span className="font-bold text-gray-900">限额 {usage.aiCallsPerDay} 次</span></div></div>}
                                </div>
                            ) : <p className="text-sm text-gray-500">加载用量数据中...</p>}
                            {tenant?.domain && (
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs font-bold text-gray-500 uppercase mb-1">登录地址</p>
                                    <p className="text-sm font-medium text-gray-900">{tenant.domain}</p>
                                    <button type="button" onClick={async () => { try { await apiClient.post(`/api/tenants/${tenant.id}/provision-subdomain`); alert('子域名部署功能即将开放，敬请期待。'); } catch (e: any) { alert(e?.response?.data?.message || '操作失败'); } }} className="mt-2 text-xs text-primary-600 font-bold hover:underline">部署子域名（即将开放）</button>
                                </div>
                            )}
                        </div>
                        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 shadow-sm p-6">
                            <div className="flex gap-4 border-b border-gray-200 mb-4">
                                <button type="button" onClick={() => setActiveTab('info')} className={`pb-2 text-sm font-medium ${activeTab === 'info' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>基础信息与用量</button>
                                <button type="button" onClick={() => setActiveTab('history')} className={`pb-2 text-sm font-medium ${activeTab === 'history' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-500'}`}>变更历史</button>
                            </div>
                            {activeTab === 'info' && <p className="text-sm text-gray-500">以上为当前基础信息与资源用量。</p>}
                            {activeTab === 'history' && (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {history.length === 0 ? <p className="text-sm text-gray-500">暂无变更记录</p> : history.map((h) => (
                                        <div key={h.id} className="flex items-start gap-2 text-sm py-2 border-b border-gray-100 last:border-0">
                                            <span className="text-gray-500 shrink-0">{h.changed_at?.replace('T', ' ').slice(0, 19)}</span>
                                            <span className="font-medium">{h.action === 'created' ? '创建' : '更新'}</span>
                                            <span className="text-gray-600">{h.changed_by}</span>
                                            {h.payload && <span className="text-gray-500 truncate">{JSON.stringify(h.payload)}</span>}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
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
            </main>
        </div>
    );
};

export default TenantConsolePage;
