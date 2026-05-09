import { apiClient } from './client';

export const adminApi = {
  getDashboard: () =>
    apiClient.get('/admin/dashboard'),

  getPendingEvents: () =>
    apiClient.get('/admin/events/pending'),

  getTrainingPointsReport: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/admin/reports/training-points', { params }),

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

  // ── Quản lý thành viên CLB ────────────────────────────
  getMembers: (pageId: string) =>
    apiClient.get(`/pages/${pageId}/members`),

  joinPage: (pageId: string, data?: { message?: string }) =>
    apiClient.post(`/pages/${pageId}/join`, data),

  getJoinRequests: (pageId: string) =>
    apiClient.get(`/pages/${pageId}/join-requests`),

  approveJoinRequest: (pageId: string, userId: string) =>
    apiClient.patch(`/pages/${pageId}/join-requests/${userId}/approve`),

  rejectJoinRequest: (pageId: string, userId: string) =>
    apiClient.patch(`/pages/${pageId}/join-requests/${userId}/reject`),

  updateMemberRole: (pageId: string, userId: string, role: 'CHUNHIEM' | 'PHOCHUNHIEM' | 'THANHVIEN') =>
    apiClient.patch(`/pages/${pageId}/members/${userId}/role`, { role }),

  kickMember: (pageId: string, userId: string) =>
    apiClient.delete(`/pages/${pageId}/members/${userId}/kick`),
};
