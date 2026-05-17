import { apiClient } from './client';

// ── INTERFACES ───────────────────────────────────────────────

export interface ScanQrParams {
  token: string;
  latitude?: number;
  longitude?: number;
}

export interface ScanGpsParams {
  event_id: string; // Tùy chọn (dựa theo backend của bạn chỉ cần token, lat, lng là đủ query ra event)
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

export interface ManualCheckinParams {
  event_id: string;
  student_id: string;
}

// Bổ sung interface cho Import điểm danh
export interface ImportCheckinParams {
  studentIds: string[];
}

// ── API ENDPOINTS ────────────────────────────────────────────

export const checkinApi = {
  // ==========================================
  // SINH VIÊN ĐIỂM DANH
  // ==========================================
  scanQr: (data: ScanQrParams) =>
    apiClient.post('/checkin/scan', data),

  scanGps: (data: ScanGpsParams) =>
    apiClient.post<GpsCheckinResponse>('/checkin/scan-gps', data),

  // ==========================================
  // HIỂN THỊ MÀN HÌNH (PUBLIC / NO ADMIN REQUIRED)
  // ==========================================
  getEventQrToken: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/qr-token`),

  // ==========================================
  // QUẢN LÝ BUỔI ĐIỂM DANH (PAGE_ADMIN)
  // ==========================================
  startCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/start`),

  endCheckin: (eventId: string) =>
    apiClient.post(`/checkin/events/${eventId}/end`),

  getCurrentToken: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/token`),

  // ==========================================
  // ĐIỂM DANH THỦ CÔNG & BÙ (PAGE_ADMIN)
  // ==========================================
  manualCheckin: (data: ManualCheckinParams) =>
    apiClient.post('/checkin/manual', data),

  // 🚀 ĐÃ BỔ SUNG API NÀY 
  importCheckin: (eventId: string, data: ImportCheckinParams) =>
    apiClient.post(`/checkin/events/${eventId}/import-checkin`, data),

  // ==========================================
  // XEM LỊCH SỬ ĐIỂM DANH (PAGE_ADMIN)
  // ==========================================
  getHistory: (eventId: string) =>
    apiClient.get(`/checkin/events/${eventId}/history`),

  // ==========================================
  // SSE STREAM URL (TRÌNH CHIẾU MÀN HÌNH LỚN)
  // ==========================================
  getStreamUrl: (eventId: string, token: string) => 
    `${apiClient.defaults.baseURL}/checkin/events/${eventId}/stream?token=${token}`,
};