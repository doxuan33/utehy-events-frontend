import { apiClient } from './client';

export interface GetRegistrationsParams {
  page?: number;
  limit?: number;
  status?: 'REGISTERED' | 'APPROVED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED' | 'REJECTED';
  search?: string;
}

export const registrationsApi = {
  register: (eventId: string) =>
    apiClient.post('/registrations', { event_id: eventId }),

  cancel: (eventId: string) =>
    apiClient.delete(`/registrations/${eventId}`),

  getMyRegistrations: (params?: GetRegistrationsParams) =>
    apiClient.get('/registrations/me', { params }),

  // ĐÃ SỬA: Bắt lỗi chuỗi rỗng và thêm giá trị mặc định an toàn
  getEventRegistrations: (eventId: string, pageId: string = "1", params?: GetRegistrationsParams) => {
    // Đảm bảo pageId luôn có giá trị hợp lệ, nếu trống thì dùng "1"
    const finalPageId = pageId.trim() !== '' ? pageId : "1";
    
    return apiClient.get(`/registrations/events/${eventId}`, {
      params: { 
        page_id: finalPageId, 
        limit: 10, // Giới hạn mặc định nếu không truyền
        ...params 
      }
    });
  },

  updateStatus: (registrationId: string, pageId: string, status: 'APPROVED' | 'ABSENT' | 'REJECTED') =>
    apiClient.patch(`/registrations/${registrationId}/status`, { status }, { params: { page_id: pageId } }),
};