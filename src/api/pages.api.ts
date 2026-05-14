import { apiClient } from './client';

export interface CreatePageParams {
  name: string;
  slug: string;
  description?: string;
  avatar_url?: string;
  cover_url?: string;
}

export interface UpdatePageParams extends Partial<CreatePageParams> {
  is_verified?: boolean;
}

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

export interface PageWithMembers extends Omit<Page, 'avatar_url' | 'cover_url' | 'description'> {
  members: PageMember[];
  description?: string | null;
  avatar_url?: string | null;
  cover_url?: string | null;
  is_following?: boolean;
  _count?: {
    followers: number;
    events: number;
  };
  slogan?: string;
  category?: string;
  email?: string;
  phone?: string;
  facebook_url?: string;
  tiktok_url?: string;
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

export interface Page {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  avatar_url: string | null;
  cover_url: string | null;
  is_following?: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

export const pagesApi = {
   getAll: (params?: { search?: string; page?: number; limit?: number }) =>
     apiClient.get<{ data: Page[] }>('/pages', { params }),

   getById: (id: string) =>
     apiClient.get<{ data: Page }>(`/pages/${id}`),

   getFollowing: () =>
     apiClient.get('/pages/following'),

   getBySlug: (slug: string) =>
     apiClient.get<{ data: PageWithMembers }>(`/pages/${slug}`),

  create: (data: CreatePageParams) =>
    apiClient.post('/pages', data),

  update: (id: string, data: UpdatePageParams) =>
    apiClient.patch(`/pages/${id}`, data),

  // Upload ảnh lên Cloudinary thông qua endpoint /upload, trả về URL
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    return apiClient.post<{ data: { url: string } }>('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // deprecated - sẽ bị xóa, giữ để tương thích cũ (nên dùng uploadImage rồi update)
  uploadAvatar: async (id: string, file: File) => {
    const res = await pagesApi.uploadImage(file);
    const avatarUrl = res.data.data.url;
    return pagesApi.update(id, { avatar_url: avatarUrl });
  },

  uploadCover: async (id: string, file: File) => {
    const res = await pagesApi.uploadImage(file);
    const coverUrl = res.data.data.url;
    return pagesApi.update(id, { cover_url: coverUrl });
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

  joinPage: (id: string, data?: { message?: string }) => {
    return apiClient.post(`/pages/${id}/join`, data);
  },

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
