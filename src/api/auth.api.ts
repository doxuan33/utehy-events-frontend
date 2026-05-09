import { apiClient } from './client';

export const authApi = {
  login: (identifier: string, password: string) =>
    apiClient.post('/auth/login', { identifier, password }),

  register: (data: any) =>
    apiClient.post('/auth/register', data),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),

  me: () =>
    apiClient.get('/auth/me'),
};
