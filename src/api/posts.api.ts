import { apiClient } from './client';

export interface GetNewsfeedParams {
  cursor?: string;
  limit?: number;
  page_id?: string;
}

export interface GetFeedParams {
  cursor?: string;
  limit?: number;
}

export interface GetCommentsParams {
  cursor?: string;
  limit?: number;
  parent_id?: string;
}

export const postsApi = {
  getNewsfeed: (params?: GetNewsfeedParams) =>
    apiClient.get('/posts/newsfeed', { params }),

  getFeed: (params?: GetFeedParams) =>
    apiClient.get('/posts/newsfeed', { params }),

  getById: (id: string) =>
    apiClient.get(`/posts/${id}`),

  create: (data: { page_id: string; content: string; event_id?: string; image_urls?: string[] }) =>
    apiClient.post('/posts', data),

  update: (id: string, data: { content?: string; image_urls?: string[] }) =>
    apiClient.patch(`/posts/${id}`, data),

  delete: (id: string) =>
    apiClient.delete(`/posts/${id}`),

  toggleLike: (id: string) =>
    apiClient.post(`/posts/${id}/like`),

  getComments: (id: string, params?: GetCommentsParams) =>
    apiClient.get(`/posts/${id}/comments`, { params }),

  addComment: (id: string, data: { content: string; parent_id?: string }) =>
    apiClient.post(`/posts/${id}/comments`, data),

  deleteComment: (postId: string, commentId: string) =>
    apiClient.delete(`/posts/${postId}/comments/${commentId}`),
};
