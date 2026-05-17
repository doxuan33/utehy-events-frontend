import { apiClient } from './client';

// ── INTERFACES ───────────────────────────────────────────────

export interface UpdateProfilePayload {
  full_name?: string;
  class_name?: string;
  faculty?: string;
  phone?: string;
  avatar_url?: string;
}

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';
}

export interface ImportStudentPayload {
  student_id: string;
  full_name: string;
  class_name?: string;
  faculty?: string;
  email?: string;
  phone?: string;
}

// ── API ENDPOINTS ────────────────────────────────────────────

export const usersApi = {
  // ==========================================
  // THÔNG TIN CÁ NHÂN CỦA USER ĐANG ĐĂNG NHẬP
  // ==========================================
  getMe: () =>
    apiClient.get('/users/me'),

  updateMe: (data: UpdateProfilePayload) =>
    apiClient.patch('/users/me', data),

  uploadAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  changePassword: (data: ChangePasswordPayload) =>
    apiClient.post('/users/me/change-password', data),

  getTrainingPoints: () =>
    apiClient.get('/users/me/training-points'),

  getSchedule: () =>
    apiClient.get('/users/me/schedule'),

  // ==========================================
  // XEM HỒ SƠ NGƯỜI KHÁC (Tất cả user)
  // ==========================================
  getById: (id: string) =>
    apiClient.get(`/users/${id}`),

  // ==========================================
  // QUẢN LÝ NGƯỜI DÙNG (SYSTEM_ADMIN)
  // ==========================================
  getAll: (params?: GetUsersParams) =>
    apiClient.get('/users', { params }),

  toggleActive: (id: string) =>
    apiClient.patch(`/users/${id}/toggle-active`),

  importStudents: (students: ImportStudentPayload[]) =>
    apiClient.post('/users/import-students', { students }),
};