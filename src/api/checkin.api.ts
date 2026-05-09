import { apiClient } from './client';

export interface ScanQrParams {
  token: string;
  latitude?: number;
  longitude?: number;
}

export interface ManualCheckinParams {
  event_id: string;
  student_id: string;
}

export interface ScanGpsParams {
  event_id: string;
  token: string;
  lat: number;
  lng: number;
}

export interface GpsCheckinResponse {
  success: boolean;
  message: string;
  distance?: string;
  points_earned?: number;
  total_points?: number;
  student_name?: string;
  event_title?: string;
}

export const checkinApi = {
  // Student
  scanQr: (data: ScanQrParams) =>
    apiClient.post('/checkin/scan', data),

  scanGps: (data: ScanGpsParams) =>
    apiClient.post<GpsCheckinResponse>('/checkin/scan-gps', data),

  getEventQrToken: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/qr-token`),

  // Page Admin
  startCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/start`),

  endCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/end`),

  manualCheckin: (data: ManualCheckinParams) =>
    apiClient.post('/checkin/manual', data),

  getCurrentToken: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/token`),

  getHistory: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/history`),

  // SSE Stream URL
  getStreamUrl: (eventId: string, token: string) => 
    `${apiClient.defaults.baseURL}/checkin/events/${eventId}/stream?token=${token}`,
};
