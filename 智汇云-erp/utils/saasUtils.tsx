
// 智汇云-erp/utils/saasUtils.ts
// 最终极简版 - SaaS 模块的辅助函数与可重用组件

import React from 'react';
import { Tenant, StatCardProps } from '../types';

// ... (其他辅助函数保持不变)
export const transformTenantFromApi = (apiTenant: any): Tenant => ({
  id: apiTenant.id,
  name: apiTenant.name,
  domain: apiTenant.domain,
  status: apiTenant.status,
  admin_name: apiTenant.admin_name,
  admin_email: apiTenant.admin_email,
  created_at: apiTenant.created_at,
  plan: apiTenant.plan_name || 'N/A',
  plan_code: apiTenant.plan_code || '',
  industry: apiTenant.industry_name || 'N/A',
});

export const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
        return 'Invalid Date';
    }
};

/**
 * (最终极简安全版) 全局可重用的统计卡片UI组件。
 * - 使用最简单的 "隐式返回" 写法 `=> (...)`，彻底杜绝因忘记 `return` 而导致的渲染错误。
 * - 这是 React 组件最直接、最不容易出错的声明方式。
 */
export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel, icon, color, onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''} group relative overflow-hidden`}
  >
    {/* 背景装饰性大图标 (安全渲染) */}
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${color ? color.replace('bg-', 'text-') : 'text-gray-600'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon, { className: 'w-16 h-16' }) : null}
    </div>
    
    {/* 主要内容 */}
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-inner`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      
      {/* 趋势元素 (安全渲染) */}
      {typeof trend === 'number' && (
        <div className="flex items-center text-sm mt-2">
          <span className={`px-2 py-1 rounded-full text-xs font-bold ${trend >= 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {(trend > 0 ? '+' : '') + trend + '%'}
          </span>
          {trendLabel && <span className="text-gray-500 ml-2">{trendLabel}</span>}
        </div>
      )}
    </div>
  </div>
);

