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
};
