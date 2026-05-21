import { apiClient } from './client';

export interface GetNotificationsParams {
  page?: number;
  limit?: number;
  is_read?: boolean;
}

export const notificationsApi = {
  getStreamUrl: () =>
    `${apiClient.defaults.baseURL}/notifications/stream`,
    
  getAll: (params?: GetNotificationsParams) =>
    apiClient.get('/notifications', { params }),
    
  getUnreadCount: () =>
    apiClient.get('/notifications/unread-count'),

  markAsRead: (id: string) =>
    apiClient.post(`/notifications/${id}/mark-read`),

  markAllAsRead: () =>
    apiClient.post('/notifications/mark-all-read'),
    
  deleteNotification: (id: string) =>
    apiClient.delete(`/notifications/${id}`),
    
  deleteAllRead: () =>
    apiClient.delete('/notifications/read'),
};
