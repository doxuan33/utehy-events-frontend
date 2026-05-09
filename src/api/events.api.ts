import { apiClient } from './client';

export interface GetEventsParams {
  page?: number;
  limit?: number;
  category_id?: number;
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ONGOING' | 'CLOSED';
  search?: string;
  page_id?: string;
}

export const eventsApi = {
  getAll: (params?: GetEventsParams) =>
    apiClient.get('/events', { params }),

  getRecommended: () =>
    apiClient.get('/events/recommended'),

  getById: (id: string) =>
    apiClient.get(`/events/${id}`),

  getCategories: () =>
    apiClient.get('/events/categories'),

  createCategory: (data: { name: string; description?: string; default_points?: number }) =>
    apiClient.post('/admin/categories', data),

  updateCategory: (id: number, data: { name?: string; description?: string; default_points?: number }) =>
    apiClient.patch(`/admin/categories/${id}`, data),

  deleteCategory: (id: number) =>
    apiClient.delete(`/admin/categories/${id}`),

  getPending: () =>
    apiClient.get('/events/pending'),

  create: (data: any) =>
    apiClient.post('/events', data),

  update: (id: string, data: any) =>
    apiClient.patch(`/events/${id}`, data),

  approve: (id: string) =>
    apiClient.patch(`/events/${id}/approve`),

  reject: (id: string, reason: string) =>
    apiClient.patch(`/events/${id}/reject`, { reason }),

  delete: (id: string, page_id: string) =>
    apiClient.delete(`/events/${id}`, { data: { page_id } }),
};
