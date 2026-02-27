
import axios from 'axios';
import { User, Tenant } from '../types'; // Adjusted path to root

// Create an Axios instance
const apiClient = axios.create({
  baseURL: 'https://w3uhc17ssi.execute-api.ap-northeast-1.amazonaws.com', // The final, correct, and active HTTP API Invoke URL
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
 * Login function to authenticate a user for a specific tenant.
 * @param username The user's username.
 * @param password The user's password.
 * @param tenantDomain The domain of the tenant the user is trying to log into.
 * @returns The user object from the backend.
 */
export const login = async (username: string, password: string, tenantDomain: string): Promise<User> => {
  try {
    // The path MUST match the route key in API Gateway, which is /api/auth/login
    // The request body now includes the tenantDomain.
    const response = await apiClient.post('/api/auth/login', { username, password, tenantDomain });
    
    if (response.data.token && response.data.user) {
      // Store the token to maintain the session across page reloads.
      localStorage.setItem('token', response.data.token);
      
      // Set the Authorization header for all subsequent API calls in this session.
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
      
      // Return the user object to the caller (LoginPage -> App), which will trigger the redirect.
      return response.data.user;
    } else {
      // If the response is malformed, throw an error.
      throw new Error('Login response is missing token or user data.');
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
