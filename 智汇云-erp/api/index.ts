
import axios from 'axios';
import { User, Tenant } from '../types'; // [修正] 路径从 ../types 改为 ./types

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'https://rbg9venhb0.execute-api.ap-northeast-1.amazonaws.com', // The final, correct, and active HTTP API Invoke URL
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  }
});

/**
 * Fetches the list of all tenants.
 * This is used on the login page to allow tenant selection.
 * @returns A promise that resolves to an array of Tenant objects.
 */
export const getTenants = async (): Promise<Tenant[]> => {
  try {
    // The path MUST match the route key in API Gateway, which is /api/tenants
    const response = await apiClient.get('/api/tenants');
    // The backend returns an array of tenants directly.
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '获取租户列表失败。');
    } else {
      throw new Error('网络请求失败，请稍后重试。');
    }
  }
};

/**
 * [V2 - 已修复] 登录函数，用于验证用户身份。
 * - 对于租户用户, `tenantDomain` 是必需的。
 * - 对于超级管理员, `tenantDomain` 必须被省略。
 * @param username 用户的登录名。
 * @param password 用户的密码。
 * @param tenantDomain (可选) 用户试图登录的租户域。
 * @returns 后端返回的用户对象。
 */
export const login = async (username: string, password: string, tenantDomain?: string): Promise<User> => {
  try {
    // 动态构建请求体
    const payload: { [key: string]: string } = { username, password };
    if (tenantDomain) {
      payload.tenantDomain = tenantDomain;
    }

    const response = await apiClient.post('/api/auth/login', payload);
    
    if (response.data.token && response.data.user) {
      // 在 localStorage 中存储 token 以在页面重新加载后保持会话。
      localStorage.setItem('token', response.data.token);
      
      // 为此会话中的所有后续 API 调用设置 Authorization 头。
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // 将用户对象返回给调用方 (LoginPage -> App)，这将触发页面跳转。
      return response.data.user;
    } else {
      // 如果响应格式不正确，则抛出错误。
      throw new Error('登录响应缺少 token 或用户数据。');
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      throw new Error(error.response.data.message || '登录失败，请检查您的凭据或所选租户是否正确。');
    } else {
      throw new Error('网络请求失败，请稍后重试。');
    }
  }
};

export default apiClient;
