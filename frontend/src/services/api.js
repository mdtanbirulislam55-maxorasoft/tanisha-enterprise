﻿// ==================== TANISHA ENTERPRISE - FRONTEND API SERVICE ====================
// Axios instance + interceptors + token refresh + typed API helpers
// Production-safe: handles legacy localStorage keys and normalizes responses

import axios from 'axios';
import toast from 'react-hot-toast';

// ==================== CONFIGURATION ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Canonical storage keys (preferred)
const REFRESH_TOKEN_KEY = 'tanisha_refresh_token';
const ACCESS_TOKEN_KEY = 'tanisha_access_token';
const USER_KEY = 'tanisha_user';

// Legacy keys still found in some older files
const LEGACY_ACCESS_KEYS = ['accessToken', 'token'];
const LEGACY_REFRESH_KEYS = ['refreshToken'];
const LEGACY_USER_KEYS = ['user'];

// ==================== AXIOS INSTANCE ====================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ==================== TOKEN + USER MANAGEMENT ====================

const readFirstExistingKey = (keys) => {
  for (const k of keys) {
    const v = localStorage.getItem(k);
    if (v) return { key: k, value: v };
  }
  return { key: null, value: null };
};

export const TokenManager = {
  getAccessToken: () => {
    const direct = localStorage.getItem(ACCESS_TOKEN_KEY);
    if (direct) return direct;

    const legacy = readFirstExistingKey(LEGACY_ACCESS_KEYS);
    if (legacy.value) {
      // migrate legacy -> canonical
      localStorage.setItem(ACCESS_TOKEN_KEY, legacy.value);
      return legacy.value;
    }
    return null;
  },

  setAccessToken: (token) => {
    if (token) {
      localStorage.setItem(ACCESS_TOKEN_KEY, token);
      // keep legacy keys in sync for older code paths (safe; remove later)
      localStorage.setItem('accessToken', token);
      localStorage.setItem('token', token);
    }
  },

  removeAccessToken: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    LEGACY_ACCESS_KEYS.forEach((k) => localStorage.removeItem(k));
  },

  getRefreshToken: () => {
    const direct = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (direct) return direct;

    const legacy = readFirstExistingKey(LEGACY_REFRESH_KEYS);
    if (legacy.value) {
      localStorage.setItem(REFRESH_TOKEN_KEY, legacy.value);
      return legacy.value;
    }
    return null;
  },

  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
      // keep legacy key in sync
      localStorage.setItem('refreshToken', token);
    }
  },

  removeRefreshToken: () => {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    LEGACY_REFRESH_KEYS.forEach((k) => localStorage.removeItem(k));
  },

  getUser: () => {
    const direct = localStorage.getItem(USER_KEY);
    if (direct) {
      try {
        return JSON.parse(direct);
      } catch {
        return null;
      }
    }

    const legacy = readFirstExistingKey(LEGACY_USER_KEYS);
    if (legacy.value) {
      localStorage.setItem(USER_KEY, legacy.value);
      try {
        return JSON.parse(legacy.value);
      } catch {
        return null;
      }
    }
    return null;
  },

  setUser: (user) => {
    if (user) {
      const val = JSON.stringify(user);
      localStorage.setItem(USER_KEY, val);
      localStorage.setItem('user', val); // legacy sync
    }
  },

  clearTokens: () => {
    TokenManager.removeAccessToken();
    TokenManager.removeRefreshToken();
    localStorage.removeItem(USER_KEY);
    LEGACY_USER_KEYS.forEach((k) => localStorage.removeItem(k));
  },
};

// ==================== REFRESH TOKEN LOGIC ====================

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const refreshAccessToken = async () => {
  try {
    const refreshToken = TokenManager.getRefreshToken();
    if (!refreshToken) throw new Error('No refresh token available');

    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      { refreshToken },
      { headers: { 'Content-Type': 'application/json' } }
    );

    const data = response?.data;
    const newAccessToken = data?.data?.accessToken;

    if (data?.success && newAccessToken) {
      TokenManager.setAccessToken(newAccessToken);
      return newAccessToken;
    }

    throw new Error('Token refresh failed');
  } catch (error) {
    TokenManager.clearTokens();
    window.location.href = '/login';
    throw error;
  }
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) config.headers.Authorization = `Bearer ${token}`;

    if (import.meta.env.DEV) {
      console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, config.data);
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
  (response) => {
    if (import.meta.env.DEV) {
      console.log('[API] Response:', response.data);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Network errors
    if (!error.response) {
      toast.error('Network error. Please check your connection.');
      return Promise.reject(error);
    }

    const { status } = error.response;

    // 401 - handle refresh flow (once)
    if (status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => failedQueue.push({ resolve, reject }))
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const newToken = await refreshAccessToken();
        processQueue(null, newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    const errorMessage =
      error.response?.data?.error ||
      error.response?.data?.message ||
      'An error occurred';

    // Silent toasts for these codes (handled in UI)
    const silentStatusCodes = [404, 409];

    if (!silentStatusCodes.includes(status)) {
      switch (status) {
        case 403:
          toast.error('Access denied');
          break;
        case 429:
          toast.error('Too many requests. Please try again later.');
          break;
        case 500:
          toast.error('Server error. Please try again.');
          break;
        case 503:
          toast.error('Service unavailable. Please try again later.');
          break;
        default:
          toast.error(errorMessage);
      }
    }

    if (import.meta.env.DEV) {
      console.error('[API] Error:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        message: errorMessage,
        data: error.response?.data,
      });
    }

    return Promise.reject(error);
  }
);

// ==================== API METHODS ====================

// Authentication
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  verifyToken: (token) => api.post('/auth/verify-token', { token }),
  getCurrentUser: () => api.get('/auth/me'),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token, password) => api.post('/auth/reset-password', { token, password }),
  changePassword: (oldPassword, newPassword) => api.post('/auth/change-password', { oldPassword, newPassword }),
};

// Users
export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// Customers
export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  getBalance: (id) => api.get(`/customers/${id}/balance`),
};

// Suppliers
export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// Products
export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  getLowStock: () => api.get('/products/low-stock'),
  updateStock: (id, data) => api.patch(`/products/${id}/stock`, data),
};

// Categories
export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// Sales
export const saleAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  print: (id) => api.get(`/sales/${id}/print`),
  updateStatus: (id, status) => api.patch(`/sales/${id}/status`, { status }),
};

export const salesAPI = {
  getSalesList: async (params = {}) => (await api.get('/sales/list', { params })).data,
  getSaleById: async (id) => (await api.get(`/sales/${id}`)).data,
  createSale: async (data) => (await api.post('/sales/create', data)).data,
  addPayment: async (saleId, data) => (await api.post(`/sales/${saleId}/payment`, data)).data,
  getTodaySummary: async () => (await api.get('/sales/dashboard/today')).data,
  getCustomers: async (params = {}) => (await api.get('/sales/customers/list', { params })).data,
  createCustomer: async (data) => (await api.post('/sales/customers/create', data)).data,
  getProductsForSale: async (params = {}) => (await api.get('/sales/products/list', { params })).data,
};

// Purchases
export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

// Payments
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// Stock
export const stockAPI = {
  getAll: (params) => api.get('/stock', { params }),
  getByProduct: (productId) => api.get(`/stock/product/${productId}`),
  adjust: (data) => api.post('/stock/adjust', data),
  transfer: (data) => api.post('/stock/transfer', data),
};

// Reports
export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (params) => api.get('/reports/sales', { params }),
  purchases: (params) => api.get('/reports/purchases', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  profit: (params) => api.get('/reports/profit', { params }),
  customers: (params) => api.get('/reports/customers', { params }),
  suppliers: (params) => api.get('/reports/suppliers', { params }),
};

// Dashboard
export const dashboardAPI = {
  getStats: () => api.get('/dashboard/stats'),
  getCharts: (period) => api.get('/dashboard/charts', { params: { period } }),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// File Upload
export const fileAPI = {
  upload: (file, onUploadProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress,
    });
  },
};

// Utilities
export const handleAPIError = (error, customMessage) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    customMessage ||
    'An error occurred';

  toast.error(message);
  console.error('API Error:', error);
};

export const handleAPISuccess = (message) => toast.success(message);

// ✅ Compatibility exports (some pages import reportsAPI/settingsAPI)

export const reportsAPI = {
  getSalesSummary: (params) => api.get('/reports/sales', { params }),
  getSalesByProduct: (params) => api.get('/reports/sales/by-product', { params }),
  getSalesByCustomer: (params) => api.get('/reports/sales/by-customer', { params }),
  getSalesByCategory: (params) => api.get('/reports/sales', { params: { ...params, groupBy: 'product' } }), // fallback
  getDailySales: (params) => api.get('/reports/sales/daily', { params }),
  getMonthlySales: (params) => api.get('/reports/sales/monthly', { params }),
  getYearlySales: (params) => api.get('/reports/sales', { params: { ...params, groupBy: 'daily' } }), // fallback
  getPurchaseSummary: (params) => api.get('/reports/purchase', { params }),
};

export const settingsAPI = {
  // Company settings
  getCompanySettings: () => api.get('/settings/company'),
  updateCompanySettings: (data) => api.put('/settings/company', data),

  // Users (Settings page expects these names)
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export default api;
