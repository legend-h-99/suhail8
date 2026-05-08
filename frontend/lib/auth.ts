import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from './api';

export interface CurrentUser {
  userId: string;
  tenantId: string;
  email: string;
  fullNameAr: string;
  roles: string[];
  permissions: string[];
  employeeId?: string | null;
  employee?: {
    id: string;
    employeeNumber: string;
    fullNameAr: string;
    jobTitleAr: string;
    department?: { id: string; nameAr: string; code: string } | null;
    assignments: { positionTitle: string; departmentName: string; isManagerial: boolean }[];
  } | null;
  traineeId?: string | null;
  trainerId?: string | null;
}

interface AuthState {
  user: CurrentUser | null;
  setUser: (u: CurrentUser | null) => void;
  hasPermission: (code: string) => boolean;
  hasRole: (code: string) => boolean;
  refreshUser: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuth = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      hasPermission: (code) => {
        const u = get().user;
        if (!u) return false;
        if (u.roles.includes('SUPER_ADMIN')) return true;
        return u.permissions.includes(code);
      },
      hasRole: (code) => get().user?.roles.includes(code) ?? false,
      refreshUser: async () => {
        const { data } = await api.get('/auth/me');
        set({ user: data });
      },
      logout: async () => {
        try {
          await api.post('/auth/logout');
        } catch {}
        localStorage.removeItem('accessToken');
        set({ user: null });
        window.location.href = '/login';
      },
    }),
    { name: 'cci-auth' },
  ),
);
