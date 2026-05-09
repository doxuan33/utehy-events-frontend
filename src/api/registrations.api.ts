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

  getEventRegistrations: (eventId: string, pageId: string, params?: GetRegistrationsParams) =>
    apiClient.get(`/registrations/events/${eventId}`, { params: { page_id: pageId, ...params } }),

  updateStatus: (registrationId: string, pageId: string, status: 'APPROVED' | 'ABSENT' | 'REJECTED') =>
    apiClient.patch(`/registrations/${registrationId}/status`, { status }, { params: { page_id: pageId } }),
};
