import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'STUDENT' | 'PAGE_ADMIN' | 'SYSTEM_ADMIN';

export interface ManagedPage {
  page_id: string;
  is_owner: boolean;
  joined_at: string;
  page: {
    id: string;
    name: string;
    slug: string;
    avatar_url?: string;
    cover_url?: string;
    description?: string;
    is_verified: boolean;
  };
}

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  full_name: string;
  student_id?: string;
  avatar_url?: string;
  training_points?: number;
  class_name?: string;
  faculty?: string;
  phone?: string;
  bio?: string;
  managed_pages: ManagedPage[];
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  refreshToken: string | null;
  hydrated: boolean;
  setAuth: (token: string, refreshToken: string, user: AuthUser) => void;
  logout: () => void;
  updateUser: (userData: Partial<AuthUser>) => void;
  setHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      hydrated: false,
      setAuth: (token, refreshToken, user) => set({ token, refreshToken, user }),
      logout: () => set({ token: null, refreshToken: null, user: null }),
      updateUser: (userData) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...userData } : null,
        })),
      setHydrated: (state) => set({ hydrated: state }),
    }),
    {
      name: 'auth-storage',
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);
