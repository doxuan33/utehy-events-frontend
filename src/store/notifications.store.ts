import { create } from 'zustand';
import { notificationsApi } from '@/api/notifications.api';
import { useAuthStore } from './auth.store';

export interface Notification {
  id: string;
  user_id: string;
  type: 'EVENT_APPROVED' | 'EVENT_NEW' | 'EVENT_REMINDER' | 'CHECKIN_SUCCESS' | 'REGISTRATION_OPEN' | 'SYSTEM';
  title: string;
  body: string;
  data: any;
  is_read: boolean;
  created_at: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  eventSource: EventSource | null;
  isLoading: boolean;
  
  fetchNotifications: (params?: any) => Promise<void>;
  fetchUnreadCount: () => Promise<void>;
  connectRealtime: () => void;
  disconnectRealtime: () => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  addNotification: (notification: Notification) => void;
}

export const useNotificationsStore = create<NotificationsState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  eventSource: null,
  isLoading: false,

  fetchNotifications: async (params) => {
    set({ isLoading: true });
    try {
      const res = await notificationsApi.getAll(params);
      set({ 
        notifications: res.data.data.data,
        unreadCount: res.data.data.meta.unread_count
      });
    } catch (err) {
      console.error('Failed to fetch notifications', err);
    } finally {
      set({ isLoading: false });
    }
  },

  fetchUnreadCount: async () => {
    try {
      const res = await notificationsApi.getUnreadCount();
      set({ unreadCount: res.data.data.unread_count });
    } catch (err) {
      console.error('Failed to fetch unread count', err);
    }
  },

  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 50),
      unreadCount: state.unreadCount + 1
    }));
  },

  connectRealtime: () => {
    const { eventSource } = get();
    if (eventSource) return;

    const token = useAuthStore.getState().token;
    const url = new URL(notificationsApi.getStreamUrl());
    if (token) {
      url.searchParams.append('access_token', token);
    }

    const es = new EventSource(url.toString());

     es.onopen = () => {
       // Connection established successfully
       // Reset retry delay on successful connection if we had one
       (window as any)._sseRetryDelay = 5000;
     };

    es.onmessage = (event) => {
      const data = JSON.parse(event.data);
      
      if (data.type === 'UNREAD_COUNT') {
        set({ unreadCount: data.unread_count });
      } else if (data.type === 'CONNECTED') {
        // Handled by onopen usually, but some backends send this
      } else if (data.id) {
        // This is a new notification
        get().addNotification(data);
      }
    };

     es.onerror = (err) => {
       console.error('SSE Error:', err);
       es.close();
       set({ eventSource: null });

       // Exponential backoff for retry
       const currentDelay = (window as any)._sseRetryDelay || 5000;
       const nextDelay = Math.min(currentDelay * 2, 60000); // Max 1 minute
       (window as any)._sseRetryDelay = nextDelay;

       setTimeout(() => get().connectRealtime(), nextDelay);
     };

    set({ eventSource: es });
  },

  disconnectRealtime: () => {
    const { eventSource } = get();
    if (eventSource) {
      eventSource.close();
      set({ eventSource: null });
    }
  },

  markAsRead: async (id) => {
    try {
      await notificationsApi.markAsRead(id);
      set((state) => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, is_read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1)
      }));
    } catch (err) {
      console.error('Failed to mark as read', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await notificationsApi.markAllAsRead();
      set((state) => ({
        notifications: state.notifications.map(n => ({ ...n, is_read: true })),
        unreadCount: 0
      }));
    } catch (err) {
      console.error('Failed to mark all as read', err);
    }
  }
}));
