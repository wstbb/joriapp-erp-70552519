
// 智汇云-erp/utils/saasUtils.ts
// 最终极简版 - SaaS 模块的辅助函数与可重用组件

import React from 'react';
import { Tenant, StatCardProps } from '../types';

/**
 * (主动重构 - 类型安全终极版)
 * 将从API获取的原始租户数据转换为前端严格的 Tenant 类型。
 * - 彻底告别不安全的 `any` 属性访问。
 * - 使用解构赋值和默认值，确保即使API返回的数据缺少某些字段，程序也绝不会在运行时崩溃，
 *   而是使用合理、可预测的回退值。这可以为您节省未来宝贵的调试时间。
 */
export const transformTenantFromApi = (apiTenant: any): Tenant => {
  const {
    id = '', // 如果 id 不存在，默认为空字符串
    name = '未知租户',
    domain = '',
    status = 'suspended', // 如果 status 不存在，默认为 'suspended'
    admin_name = 'N/A',
    admin_email = 'N/A',
    created_at = new Date().toISOString(),
    plan_name = 'N/A', // 如果 plan_name 不存在，默认为 'N/A'
    plan_code = '',
    industry_name = 'N/A'
  } = apiTenant || {}; // 使用 `|| {}` 防止 apiTenant 本身为 null 或 undefined

  return {
    id,
    name,
    domain,
    status,
    admin_name,
    admin_email,
    created_at,
    plan: plan_name,      // 字段映射
    plan_code,
    industry: industry_name // 字段映射
  };
};

export const formatDate = (dateString: string): string => {
    if (!dateString) return 'N/A';
    try {
        return new Date(dateString).toISOString().split('T')[0];
    } catch (error) {
        return 'Invalid Date';
    }
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, trend, trendLabel, icon, color, onClick }) => (
  <div 
    onClick={onClick} 
    className={`bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all ${onClick ? 'cursor-pointer' : ''} group relative overflow-hidden`}
  >
    <div className={`absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500 ${color ? color.replace('bg-', 'text-') : 'text-gray-600'}`}>
      {React.isValidElement(icon) ? React.cloneElement(icon, { className: 'w-16 h-16' }) : null}
    </div>
    
    <div className="relative z-10">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${color} shadow-inner`}>
        {icon}
      </div>
      <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-gray-900 tracking-tight">{value}</h3>
      
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
