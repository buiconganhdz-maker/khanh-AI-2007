import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
const AI_URL = import.meta.env.VITE_AI_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true // Send cookies with every request
});

// ─── CSRF helper ──────────────────────────────────────
function getCsrfToken() {
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

// ─── Token management ─────────────────────────────────
let isRefreshing = false;
let refreshSubscribers = [];

function onRefreshed(newToken) {
  refreshSubscribers.forEach(cb => cb(newToken));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb) {
  refreshSubscribers.push(cb);
}

// Request interceptor — attach access token + CSRF token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach CSRF token for state-changing requests
  const csrf = getCsrfToken();
  if (csrf) {
    config.headers['X-CSRF-Token'] = csrf;
  }

  return config;
});

// Response interceptor — auto-refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 with TOKEN_EXPIRED and not already retrying
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes('/auth/login') &&
      !originalRequest.url.includes('/auth/refresh') &&
      !originalRequest.url.includes('/auth/register')
    ) {
      originalRequest._retry = true;

      if (!isRefreshing) {
        isRefreshing = true;

        try {
          const refreshToken = localStorage.getItem('refreshToken');
          const { data } = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken
          }, { withCredentials: true });

          // Store new tokens
          localStorage.setItem('accessToken', data.accessToken);
          if (data.refreshToken) {
            localStorage.setItem('refreshToken', data.refreshToken);
          }

          isRefreshing = false;
          onRefreshed(data.accessToken);

          // Retry original request
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          isRefreshing = false;
          refreshSubscribers = [];

          // Refresh failed — clear everything and redirect to login
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      } else {
        // Queue requests while refreshing
        return new Promise((resolve) => {
          addRefreshSubscriber((newToken) => {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }
    }

    return Promise.reject(error);
  }
);

// ─── Auth ─────────────────────────────────────────────
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  verifyOTP: (data) => api.post('/auth/verify-otp', data),
  resendOTP: (data) => api.post('/auth/resend-otp', data),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
  logoutAll: () => api.post('/auth/logout-all'),
  getMe: () => api.get('/auth/me'),
  changePassword: (data) => api.put('/auth/change-password', data),
  getSessions: () => api.get('/auth/sessions'),
  revokeSession: (id) => api.delete(`/auth/sessions/${id}`),
  getLoginHistory: (params) => api.get('/auth/login-history', { params }),
  getCsrf: () => api.get('/auth/csrf'),
  uploadAvatar: (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    return api.put('/auth/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
  },
};

// ─── Cameras ──────────────────────────────────────────
export const camerasAPI = {
  list: () => api.get('/cameras'),
  get: (id) => api.get(`/cameras/${id}`),
  create: (data) => api.post('/cameras', data),
  update: (id, data) => api.put(`/cameras/${id}`, data),
  delete: (id) => api.delete(`/cameras/${id}`),
  setZones: (id, zones) => api.post(`/cameras/${id}/zones`, { zones }),
};

// ─── Alerts ───────────────────────────────────────────
export const alertsAPI = {
  list: (params) => api.get('/alerts', { params }),
  acknowledge: (id) => api.put(`/alerts/${id}/acknowledge`),
  stats: (days = 7) => api.get('/alerts/stats', { params: { days } }),
};

// ─── Detections ───────────────────────────────────────
export const detectionsAPI = {
  list: (params) => api.get('/detections', { params }),
  stats: (days = 7) => api.get('/detections/stats', { params: { days } }),
};

// ─── AI Service ───────────────────────────────────────
export const aiAPI = {
  health: () => axios.get(`${AI_URL}/health`),
  startCamera: (cameraId, source = '0', name = 'Camera') =>
    axios.post(`${AI_URL}/start-camera/${cameraId}?source=${encodeURIComponent(source)}&name=${encodeURIComponent(name)}`),
  stopCamera: (cameraId) => axios.post(`${AI_URL}/stop-camera/${cameraId}`),
  status: () => axios.get(`${AI_URL}/status`),
  getStreamUrl: (cameraId) => `${AI_URL}/stream/${cameraId}`,
  getSnapshotUrl: (cameraId) => `${AI_URL}/snapshot/${cameraId}`,
};

export default api;

