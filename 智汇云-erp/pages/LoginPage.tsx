
import React, { useState, useEffect } from 'react';
import { Icons } from '@/components/Icons';
import { User, Tenant } from '@/types';
import { login, getTenants } from '@/api';

const getErrorMessage = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return '发生未知错误，请检查网络或联系管理员。';
};

interface LoginPageProps {
  onLogin: (user: User, isMobile: boolean) => void;
  initialMobileMode?: boolean;
}

interface ChildLoginProps {
    onLogin: (user: User) => void;
}

interface DesktopLoginProps extends ChildLoginProps {
    onSwitchToMobile: () => void;
}

interface MobileLoginProps extends ChildLoginProps {
    onSwitchToDesktop: () => void;
}

const QuickLoginButton: React.FC<{ 
    onClick: () => void, 
    children: React.ReactNode, 
    variant?: 'light' | 'dark' 
}> = ({ onClick, children, variant = 'light' }) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs transition-colors";
    const lightClasses = "bg-gray-100 hover:bg-gray-200 text-gray-600";
    const darkClasses = "bg-gray-800 hover:bg-gray-700 text-white";
    const classes = `${baseClasses} ${variant === 'dark' ? darkClasses : lightClasses}`;
    
    return (
        <button type="button" onClick={onClick} className={classes}>{children}</button>
    );
};

const DesktopLogin: React.FC<DesktopLoginProps> = ({ onLogin, onSwitchToMobile }) => {
    const [usernameInput, setUsernameInput] = useState('admin');
    const [password, setPassword] = useState('••••••');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [tenants, setTenants] = useState<Tenant[]>([]);
    const [selectedTenant, setSelectedTenant] = useState('');
    const [isSuperAdmin, setIsSuperAdmin] = useState(false);

    useEffect(() => {
        const checkSuperAdmin = usernameInput.toLowerCase() === 'superadmin';
        setIsSuperAdmin(checkSuperAdmin);
    }, [usernameInput]);

    useEffect(() => {
        if (isSuperAdmin) {
            setSelectedTenant(''); // Reset tenant selection for superadmin
        } else {
            const fetchTenants = async () => {
                try {
                    const tenantsData = await getTenants();
                    setTenants(tenantsData);
                    if (tenantsData.length === 1) {
                        setSelectedTenant(tenantsData[0].domain);
                    }
                } catch (err) {
                    setError('无法加载租户列表，请联系管理员。');
                }
            };
            fetchTenants();
        }
    }, [isSuperAdmin]);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        
        if (!isSuperAdmin && !selectedTenant) {
            setError('请先选择一个租户。');
            return;
        }

        const loginPassword = password === '••••••' ? '123456' : password;

        setLoading(true);
        setError('');
        try {
            // [V2 已修复] 核心 Bug 修复：
            // - 当是超级管理员时, `tenantDomain` 参数必须为 `undefined`，以发送一个“干净”的请求。
            // - 当是租户用户时, 传递 `selectedTenant`。
            const user = await login(usernameInput, loginPassword, isSuperAdmin ? undefined : selectedTenant);
            onLogin(user);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    const handleQuickLogin = (role: string) => {
        setUsernameInput(role);
        if (role === 'superadmin') {
            setPassword('test1234');
        } else {
            setPassword('123456');
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col font-sans">
            <div className="flex-grow flex items-center justify-center p-4">
                <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 lg:p-10">
                    <div className="text-center mb-8">
                        <div className="inline-block bg-[#007BFF] text-white text-3xl font-bold p-3 rounded-lg mb-3">五</div>
                        <h1 className="text-2xl font-bold text-gray-900">智汇五金 ERP</h1>
                        <p className="text-sm text-gray-500 mt-1">企业级进销存管理系统</p>
                    </div>
                    <form onSubmit={handleLogin} className="space-y-5">
                        {error && <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center"><Icons.AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /><p>{error}</p></div>}
                        
                        {!isSuperAdmin && (
                            <div>
                                <label htmlFor="tenant" className="text-sm font-medium text-gray-700 mb-1 block">选择租户</label>
                                <div className="relative">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icons.Building className="h-5 w-5 text-gray-400" /></span>
                                    <select 
                                        id="tenant" 
                                        value={selectedTenant}
                                        onChange={(e) => setSelectedTenant(e.target.value)}
                                        className="h-12 w-full rounded-lg border-gray-200 border pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition appearance-none bg-white"
                                        required={!isSuperAdmin}
                                    >
                                        <option value="" disabled>-- {tenants.length > 0 ? '请选择您的企业实例' : '加载中...'} --</option>
                                        {tenants.map(tenant => (
                                            <option key={tenant.id} value={tenant.domain}>{tenant.name} ({tenant.domain})</option>
                                        ))}
                                    </select>
                                    <span className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none"><Icons.ChevronDown className="h-5 w-5 text-gray-400" /></span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label htmlFor="username" className="text-sm font-medium text-gray-700 mb-1 block">账号</label>
                            <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icons.User className="h-5 w-5 text-gray-400" /></span><input id="username" type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="h-12 w-full rounded-lg border-gray-200 border pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required /></div>
                        </div>
                        <div>
                            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1 block">密码</label>
                            <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none"><Icons.Lock className="h-5 w-5 text-gray-400" /></span><input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-lg border-gray-200 border pl-10 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" required autoComplete="new-password" /></div>
                        </div>
                        <button type="submit" className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-bold bg-[#007BFF] text-white hover:bg-blue-600 disabled:opacity-50 transition-colors" disabled={loading}>{loading ? <Icons.LoaderCircle className="animate-spin" /> : <> <Icons.ArrowRight className="w-5 h-5" /> 立即登录 </>}</button>
                    </form>
                    <div className="mt-6 text-center">
                        <p className="text-xs text-gray-400 mb-3">快速体验账号</p>
                        <div className="flex flex-wrap justify-center gap-2 text-xs">
                            <QuickLoginButton onClick={() => handleQuickLogin('admin')}>管理员: admin</QuickLoginButton>
                            <QuickLoginButton onClick={() => handleQuickLogin('sales')}>销售: sales</QuickLoginButton>
                            <QuickLoginButton onClick={() => handleQuickLogin('wh')}>仓管: wh</QuickLoginButton>
                            <QuickLoginButton onClick={() => handleQuickLogin('fin')}>财务: fin</QuickLoginButton>
                        </div>
                         <div className="flex flex-wrap justify-center gap-2 text-xs mt-2">
                            <QuickLoginButton onClick={() => handleQuickLogin('basic')}>基础版: basic</QuickLoginButton>
                            <QuickLoginButton onClick={() => handleQuickLogin('superadmin')} variant="dark">系统管理员</QuickLoginButton>
                        </div>
                    </div>
                </div>
            </div>
            <footer className="text-center py-4 text-gray-500 text-xs">© 2023 Smart Hardware ERP System. All rights reserved.</footer>
            <div className="fixed bottom-6 right-6"><button onClick={onSwitchToMobile} className="w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-100 transition"><Icons.Smartphone className="w-6 h-6 text-gray-600" /></button></div>
        </div>
    );
};

// MobileLogin remains largely the same, as multi-tenancy login is more of a desktop/admin feature for now.
const MobileLogin: React.FC<MobileLoginProps> = ({ onLogin, onSwitchToDesktop }) => {
    const [usernameInput, setUsernameInput] = useState('admin');
    const [password, setPassword] = useState('••••••');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        const loginPassword = password === '••••••' ? '123456' : password;

        setLoading(true);
        setError('');
        try {
            // Here we might need a default tenant or a different login flow for mobile
            const user = await login(usernameInput, loginPassword, 'YOUR_DEFAULT_TENANT_DOMAIN'); // TODO: Define default tenant for mobile
            onLogin(user);
        } catch (err) {
            setError(getErrorMessage(err));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen flex flex-col items-center justify-center p-4 font-sans">
            <div className="w-full max-w-xs mx-auto">
                <div className="text-center mb-10">
                    <div className="inline-block bg-[#007BFF] text-white text-3xl font-bold p-3 rounded-lg mb-4">五</div>
                    <h1 className="text-2xl font-bold text-gray-900">智汇五金 ERP</h1>
                    <p className="text-sm text-gray-500 mt-1">移动端 App 登录</p>
                </div>
                <form onSubmit={handleLogin} className="space-y-5">
                    {error && <div className="bg-red-100 border border-red-200 text-red-700 text-sm rounded-lg p-3 flex items-center"><Icons.AlertTriangle className="h-4 w-4 mr-2 flex-shrink-0" /><p>{error}</p></div>}
                    <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none"><Icons.User className="h-5 w-5 text-gray-400" /></span><input type="text" value={usernameInput} onChange={(e) => setUsernameInput(e.target.value)} className="h-12 w-full rounded-lg bg-white border-gray-200 border pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="账号" required /></div>
                    <div className="relative"><span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none"><Icons.Lock className="h-5 w-5 text-gray-400" /></span><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 w-full rounded-lg bg-white border-gray-200 border pl-11 pr-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" placeholder="密码" required /></div>
                    <button type="submit" className="w-full h-12 flex items-center justify-center gap-2 rounded-lg text-sm font-bold bg-[#007BFF] text-white hover:bg-blue-600 disabled:opacity-50 transition-colors" disabled={loading}>{loading ? <Icons.LoaderCircle className="animate-spin" /> : '登录'}</button>
                </form>
            </div>
            <div className="absolute bottom-8"><button onClick={onSwitchToDesktop} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"><Icons.Monitor className="h-4 w-4" /><span>切换回桌面版</span></button></div>
        </div>
    );
};

export const LoginPage: React.FC<LoginPageProps> = ({ onLogin, initialMobileMode = false }) => {
    const [isMobileView, setIsMobileView] = useState(initialMobileMode);

    const handleLoginFromChild = (user: User, isMobile: boolean) => {
        onLogin(user, isMobile);
    };



    if (isMobileView) {
        return <MobileLogin onLogin={(user) => handleLoginFromChild(user, true)} onSwitchToDesktop={() => setIsMobileView(false)} />;
    }
    
    return <DesktopLogin onLogin={(user) => handleLoginFromChild(user, false)} onSwitchToMobile={() => setIsMobileView(true)} />;
};
