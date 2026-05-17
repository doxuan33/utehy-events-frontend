import { apiClient } from './client';

// ── INTERFACES ───────────────────────────────────────────────

export interface GetRegistrationsParams {
  page?: number;
  limit?: number;
  status?: 'REGISTERED' | 'APPROVED' | 'ATTENDED' | 'ABSENT' | 'CANCELLED' | 'REJECTED';
  search?: string;
}

// ── API ENDPOINTS ────────────────────────────────────────────

export const registrationsApi = {
  // ==========================================
  // DÀNH CHO SINH VIÊN (Student)
  // ==========================================
  
  register: (eventId: string) =>
    apiClient.post('/registrations', { event_id: eventId }),

  cancel: (eventId: string) =>
    apiClient.delete(`/registrations/${eventId}`),

  getMyRegistrations: (params?: GetRegistrationsParams) =>
    apiClient.get('/registrations/me', { params }),

  // ==========================================
  // DÀNH CHO QUẢN TRỊ TRANG (Page Admin)
  // ==========================================

  // Lấy danh sách sinh viên đăng ký sự kiện (Kèm bắt lỗi pageId rỗng)
  getEventRegistrations: (eventId: string, pageId: string = "1", params?: GetRegistrationsParams) => {
    // Đảm bảo pageId luôn có giá trị hợp lệ
    const finalPageId = pageId.trim() !== '' ? pageId : "1";
    
    return apiClient.get(`/registrations/events/${eventId}`, {
      params: { 
        page_id: finalPageId, 
        limit: 10, // Giới hạn mặc định
        ...params 
      }
    });
  },

  // Duyệt/Từ chối đơn đăng ký (đối với sự kiện requires_approval = true)
  updateStatus: (registrationId: string, pageId: string, status: 'APPROVED' | 'ABSENT' | 'REJECTED') =>
    apiClient.patch(
      `/registrations/${registrationId}/status`, 
      { status }, 
      { params: { page_id: pageId } }
    ),
};