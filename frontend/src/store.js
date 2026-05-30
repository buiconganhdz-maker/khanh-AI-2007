import { create } from 'zustand';
import { authAPI, camerasAPI, alertsAPI, detectionsAPI } from './api';

export const useAuthStore = create((set, get) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  token: localStorage.getItem('accessToken') || null,
  loading: false,

  login: async (credentials) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.login(credentials);

      // Store tokens
      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({ user: data.user, token: data.accessToken, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      const resp = error.response?.data;
      return {
        success: false,
        error: resp?.error || 'Login failed',
        requiresVerification: resp?.requiresVerification,
        userId: resp?.userId,
        email: resp?.email,
        lockedUntil: resp?.lockedUntil
      };
    }
  },

  register: async (data) => {
    set({ loading: true });
    try {
      const { data: resp } = await authAPI.register(data);
      set({ loading: false });
      return {
        success: true,
        userId: resp.userId,
        email: resp.email,
        requiresVerification: resp.requiresVerification
      };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  },

  verifyOTP: async (userId, code) => {
    set({ loading: true });
    try {
      const { data } = await authAPI.verifyOTP({ userId, code });

      localStorage.setItem('accessToken', data.accessToken);
      localStorage.setItem('refreshToken', data.refreshToken);
      localStorage.setItem('user', JSON.stringify(data.user));

      set({ user: data.user, token: data.accessToken, loading: false });
      return { success: true };
    } catch (error) {
      set({ loading: false });
      return {
        success: false,
        error: error.response?.data?.error || 'Verification failed'
      };
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
    } catch (e) {} // Best effort
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null, token: null });
  },

  uploadAvatar: async (file) => {
    try {
      const { data } = await authAPI.uploadAvatar(file);
      const user = get().user;
      if (user) {
        const updatedUser = { ...user, avatar: data.avatar };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        set({ user: updatedUser });
      }
      return { success: true, avatar: data.avatar };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Avatar upload failed'
      };
    }
  },

  isAuthenticated: () => !!get().token,
}));

export const useCameraStore = create((set, get) => ({
  cameras: [],
  loading: false,

  fetchCameras: async () => {
    set({ loading: true });
    try {
      const { data } = await camerasAPI.list();
      set({ cameras: data.cameras, loading: false });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch cameras error:', error);
    }
  },

  updateCameraStatus: (cameraId, status) => {
    set((state) => ({
      cameras: state.cameras.map((c) =>
        c._id === cameraId ? { ...c, status } : c
      ),
    }));
  },
}));

export const useAlertStore = create((set, get) => ({
  alerts: [],
  recentAlerts: [],
  stats: null,
  unreadCount: 0,
  loading: false,

  fetchAlerts: async (params = {}) => {
    set({ loading: true });
    try {
      const { data } = await alertsAPI.list({ limit: 50, ...params });
      set({
        alerts: data.alerts,
        loading: false,
      });
    } catch (error) {
      set({ loading: false });
      console.error('Fetch alerts error:', error);
    }
  },

  fetchStats: async (days = 7) => {
    try {
      const { data } = await alertsAPI.stats(days);
      set({ stats: data.stats });
    } catch (error) {
      console.error('Fetch stats error:', error);
    }
  },

  addRealtimeAlert: (alert) => {
    set((state) => ({
      recentAlerts: [alert, ...state.recentAlerts].slice(0, 20),
      unreadCount: state.unreadCount + 1,
    }));
  },

  clearUnread: () => set({ unreadCount: 0 }),

  acknowledgeAlert: async (id) => {
    try {
      await alertsAPI.acknowledge(id);
      set((state) => ({
        alerts: state.alerts.map((a) =>
          a._id === id ? { ...a, acknowledged: true } : a
        ),
        recentAlerts: state.recentAlerts.map((a) =>
          a._id === id ? { ...a, acknowledged: true } : a
        ),
      }));
    } catch (error) {
      console.error('Acknowledge error:', error);
    }
  },
}));

export const useUIStore = create((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}));
