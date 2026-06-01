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

create: (data: {
    page_id: string;
    title: string;
    description: string;
    category_id?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    start_time: string;
    end_time?: string;
    registration_deadline?: string;
    max_slots?: number;
    training_points?: number;
    requires_approval?: boolean;
    is_global?: boolean;
    registration_type?: 'NORMAL' | 'MANDATORY' | 'CHECKIN_ONLY';
    banner_url?: string;
    is_penalty_active?: boolean;
    penalty_points?: number;
  }) => apiClient.post('/events', data),

  update: (id: string, data: {
    title?: string;
    description?: string;
    category_id?: number;
    location?: string;
    latitude?: number;
    longitude?: number;
    start_time?: string;
    end_time?: string;
    registration_deadline?: string;
    max_slots?: number;
    training_points?: number;
    requires_approval?: boolean;
    is_global?: boolean;
    registration_type?: 'NORMAL' | 'MANDATORY' | 'CHECKIN_ONLY';
    banner_url?: string;
    is_penalty_active?: boolean;
    penalty_points?: number;
  }) => apiClient.patch(`/events/${id}`, data),

  approve: (id: string) =>
    apiClient.patch(`/events/${id}/approve`),

  reject: (id: string, reason: string) =>
    apiClient.patch(`/events/${id}/reject`, { reason }),

delete: (id: string, page_id: string) =>
     apiClient.delete(`/events/${id}`, { data: { page_id } }),

  importMandatoryStudents: (eventId: string | number, studentIds: string[]) =>
     apiClient.post(`/events/${eventId}/import-mandatory`, { studentIds }),

  closeEvent: (id: string, page_id: string) =>
    apiClient.post(`/events/${id}/close`, { page_id }),
};
