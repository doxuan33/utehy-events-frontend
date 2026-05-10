import axios from 'axios';
import { toast } from 'sonner';
import { useAuthStore } from '../store/auth.store';



const rawBaseUrl = (import.meta as any).env.VITE_API_URL || 'http://localhost:3001/api/v1';

export const BASE_URL = rawBaseUrl.replace(/[\[\]\(\)\s]/g, '');

export const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' },
});


apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});


apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    
    const errorMessage = error.response?.data?.message 
      || error.response?.data?.error 
      || error.message 
      || 'An unknown error occurred';

   
    const isAuthErrorOnRetry = error.response?.status === 401 && original._retry;

    if (!isAuthErrorOnRetry && error.response?.status !== 401) {
      toast.error(errorMessage, {
        description: `Status: ${error.response?.status || 'Network Error'}`,
        duration: 5000,
        closeButton: true,
      });
    }

  
    if (error.response?.status === 429) {
      toast.warning('Too many requests. Please wait before trying again.', {
        duration: 5000,
      });
      return Promise.reject(error);
    }

  
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      try {
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token available');

        const res = await axios.post(`${BASE_URL}/auth/refresh`, {
          refresh_token: refreshToken,
        });
        const { access_token, refresh_token } = res.data.data;
        const user = useAuthStore.getState().user!;
        useAuthStore.getState().setAuth(access_token, refresh_token, user);
        original.headers.Authorization = `Bearer ${access_token}`;
        return apiClient(original);
      } catch (refreshError) {
        toast.error('Session expired. Please log in again.');
        useAuthStore.getState().logout();
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);
