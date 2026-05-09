import { apiClient } from './client';

export const usersApi = {
  getMe: () =>
    apiClient.get('/users/me'),

  updateMe: (data: { 
    full_name?: string; 
    avatar_url?: string; 
    bio?: string;
    class_name?: string;
    faculty?: string;
    phone?: string;
  }) =>
    apiClient.patch('/users/me', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (current_password: string, new_password: string) =>
    apiClient.post('/users/me/change-password', { current_password, new_password }),

  getTrainingPoints: () =>
    apiClient.get('/users/me/training-points'),

  getById: (id: string) =>
    apiClient.get(`/users/${id}`),

  getAll: (params?: { page?: number; limit?: number; search?: string }) =>
    apiClient.get('/users', { params }),

  toggleActive: (id: string) =>
    apiClient.patch(`/users/${id}/toggle-active`),
};
