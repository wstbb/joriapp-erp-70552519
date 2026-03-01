/**
 * 平台管理（saasadmin）入口：侧边栏为「系统设置」下的租户 admin，此处为超级管理员的「后台管理」。
 * 使用 HashRouter 支持 S3 静态托管下的子路由。
 */
import React, { useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import SaasAdminDashboard from './saas-admin/index';
import TenantConsolePage from './saas-admin/tenants/[tenantId]';
import PlansPage from './saas-admin/plans';
import IndustriesPage from './saas-admin/industries';
import TicketsPage from './saas-admin/tickets';

interface SaasAdminProps {
  onLogout: () => void;
  tickets?: unknown[];
  onResolveTicket?: (id: string) => void;
  token: string;
}

function SaasAdminRoutes({ onLogout, token }: SaasAdminProps) {
  const loc = useLocation();
  useEffect(() => {
    if (loc.pathname === '/' || loc.pathname === '') {
      window.location.hash = '#/saasadmin';
    }
  }, [loc.pathname]);
  return (
    <Routes>
      <Route path="/saasadmin" element={<SaasAdminDashboard onLogout={onLogout} />} />
      <Route path="/saasadmin/tenants/:tenantId" element={<TenantConsolePage />} />
      <Route path="/saasadmin/plans" element={<PlansPage />} />
      <Route path="/saasadmin/industries" element={<IndustriesPage />} />
      <Route path="/saasadmin/tickets" element={<TicketsPage />} />
      <Route path="/" element={<Navigate to="/saasadmin" replace />} />
      <Route path="*" element={<Navigate to="/saasadmin" replace />} />
    </Routes>
  );
}

export default function SaasAdmin(props: SaasAdminProps) {
  return (
    <HashRouter>
      <SaasAdminRoutes {...props} />
    </HashRouter>
  );
}
