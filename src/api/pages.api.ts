import { apiClient } from './client';

export interface CreatePageParams {
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
}

export interface UpdatePageParams extends Partial<CreatePageParams> {}

export interface AddMemberParams {
  user_id: string;
  is_owner?: boolean;
}

export interface PageMember {
  id: string;
  page_id: string;
  user_id: string;
  is_owner: boolean;
  joined_at: string;
  user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';
    is_active: boolean;
    profile: {
      full_name: string;
      student_id?: string;
      avatar_url?: string;
      class_name?: string;
    };
  };
}

export interface PageWithMembers {
  id: string;
  name: string;
  slug: string;
  members: PageMember[];
}

export interface PageJoinRequest {
  id: string;
  page_id: string;
  user_id: string;
  message: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  created_at: string;
  user: {
    id: string;
    email: string;
    role: 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';
    is_active: boolean;
    profile: {
      full_name: string;
      student_id?: string;
      avatar_url?: string;
      class_name?: string;
    };
  };
}

export const pagesApi = {
  getAll: (params?: { search?: string; page?: number; limit?: number }) =>
    apiClient.get('/pages', { params }),

  getFollowing: () =>
    apiClient.get('/pages/following'),

  getBySlug: (slug: string) =>
    apiClient.get<{ data: PageWithMembers }>(`/pages/${slug}`),

  create: (data: CreatePageParams) =>
    apiClient.post('/pages', data),

  update: (id: string, data: UpdatePageParams) =>
    apiClient.patch(`/pages/${id}`, data),

  uploadAvatar: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return apiClient.patch(`/pages/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadCover: (id: string, file: File) => {
    const formData = new FormData();
    formData.append('cover', file);
    return apiClient.patch(`/pages/${id}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  follow: (id: string) =>
    apiClient.post(`/pages/${id}/follow`),

  unfollow: (id: string) =>
    apiClient.delete(`/pages/${id}/follow`),

  addMember: (id: string, data: AddMemberParams) =>
    apiClient.post(`/pages/${id}/members`, data),

  removeMember: (id: string, userId: string) =>
    apiClient.delete(`/pages/${id}/members/${userId}`),

  getMembers: (id: string) =>
    apiClient.get<{ data: PageMember[] }>(`/pages/${id}/members`),

  getJoinRequests: (id: string) =>
    apiClient.get<{ data: PageJoinRequest[] }>(`/pages/${id}/join-requests`),

  approveJoinRequest: (id: string, userId: string) =>
    apiClient.patch(`/pages/${id}/join-requests/${userId}/approve`),

  rejectJoinRequest: (id: string, userId: string) =>
    apiClient.patch(`/pages/${id}/join-requests/${userId}/reject`),

  kickMember: (id: string, userId: string) =>
    apiClient.delete(`/pages/${id}/members/${userId}/kick`),

  updateMemberRole: (id: string, userId: string, role: 'CHUNHIEM' | 'PHOCHUNHIEM' | 'THANHVIEN') =>
    apiClient.patch(`/pages/${id}/members/${userId}/role`, { role }),
};
