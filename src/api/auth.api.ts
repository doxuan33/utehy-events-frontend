import { apiClient } from './client';

export const authApi = {
  login: (identifier: string, password: string) =>
    apiClient.post('/auth/login', { identifier, password }),

  register: (data: any) => // Lời khuyên: Nên thay 'any' bằng một Interface (ví dụ: RegisterPayload)
    apiClient.post('/auth/register', data),

  // Bổ sung API refresh token bị thiếu
  refresh: (refresh_token: string) =>
    apiClient.post('/auth/refresh', { refresh_token }),

  logout: (refresh_token: string) =>
    apiClient.post('/auth/logout', { refresh_token }),

  me: () =>
    apiClient.get('/auth/me'),
};