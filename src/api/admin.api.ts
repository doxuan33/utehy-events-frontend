import { apiClient } from './client';

export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),

  getPendingEvents: () =>
    apiClient.get('/admin/events/pending'),

  // [FIX] Đổi params từ { page, limit } → { semester } cho đúng với Backend
  getTrainingPointsReport: (params?: { semester?: string }) =>
    apiClient.get('/admin/reports/training-points', { params }),

  exportTrainingPoints: () =>
    apiClient.get('/admin/reports/training-points/export', {
      responseType: 'blob',
    }),

  getPagesReport: () =>
    apiClient.get('/admin/reports/pages'),

  getEventsReport: (year?: number) =>
    apiClient.get('/admin/reports/events', { params: { year } }),

  // [FIX] Đổi payload từ { name, description, icon } → { name, default_training_points, color_hex }
  // cho đúng với những gì adminController.createCategory destructure từ req.body
  createCategory: (data: {
    name: string;
    default_training_points?: number;
    color_hex?: string;
  }) =>
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