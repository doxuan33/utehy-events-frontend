import { apiClient } from './client';

export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),

  getPendingEvents: () =>
    apiClient.get('/admin/events/pending'),

  getTrainingPointsReport: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/reports/training-points', { params }),

  exportTrainingPoints: () =>
    apiClient.get('/admin/reports/training-points/export', {
      responseType: 'blob',
    }),

  getPagesReport: () =>
    apiClient.get('/admin/reports/pages'),

  getEventsReport: (year?: number) =>
    apiClient.get('/admin/reports/events', { params: { year } }),

  createCategory: (data: { name: string; description?: string; icon?: string }) =>
    apiClient.post('/admin/categories', data),

  updateCategory: (id: string, data: any) =>
    apiClient.patch(`/admin/categories/${id}`, data),

  deleteCategory: (id: string) =>
    apiClient.delete(`/admin/categories/${id}`),

  getBadges: () =>
    apiClient.get('/admin/badges'),

  createBadge: (data: any) =>
    apiClient.post('/admin/badges', data),

};
