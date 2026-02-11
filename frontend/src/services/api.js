// ==================== TANISHA ENTERPRISE - FRONTEND API SERVICE ====================
// Axios instance + interceptors + token refresh + typed API helpers
// Production-safe: handles legacy localStorage keys and normalizes responses

import axios from 'axios';
import toast from 'react-hot-toast';
import { TokenManager } from './tokenManager';

// ==================== CONFIGURATION ====================

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==================== AXIOS INSTANCE ====================

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    if (!data?.success) throw new Error(data?.error || 'Token refresh failed');

    const newAccessToken = data?.data?.accessToken;
    if (!newAccessToken) throw new Error('No access token in refresh response');

    TokenManager.setAccessToken(newAccessToken);
    return newAccessToken;
  } catch (err) {
    TokenManager.clearTokens();
    throw err;
  }
};

// ==================== REQUEST INTERCEPTOR ====================

api.interceptors.request.use(
  (config) => {
    const token = TokenManager.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ==================== RESPONSE INTERCEPTOR ====================

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
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
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        processQueue(null, newToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        TokenManager.clearTokens();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// ==================== AUTH API ====================

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (data) => api.post('/auth/register', data),
  logout: (refreshToken) => api.post('/auth/logout', { refreshToken }),
  getCurrentUser: () => api.get('/auth/me'),
  verifyToken: (token) => api.post('/auth/verify-token', { token }),
  refreshToken: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
};

// ==================== USER API ====================

export const userAPI = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (data) => api.post('/users', data),
  update: (id, data) => api.put(`/users/${id}`, data),
  delete: (id) => api.delete(`/users/${id}`),
};

// ==================== PRODUCT API ====================

export const productAPI = {
  getAll: (params) => api.get('/products', { params }),
  getById: (id) => api.get(`/products/${id}`),
  create: (data) => api.post('/products', data),
  update: (id, data) => api.put(`/products/${id}`, data),
  delete: (id) => api.delete(`/products/${id}`),
  search: (query) => api.get('/products/search', { params: { q: query } }),
};

// ==================== CUSTOMER API ====================

export const customerAPI = {
  getAll: (params) => api.get('/customers', { params }),
  getById: (id) => api.get(`/customers/${id}`),
  create: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  delete: (id) => api.delete(`/customers/${id}`),
  search: (query) => api.get('/customers/search', { params: { q: query } }),
};

// ==================== SUPPLIER API ====================

export const supplierAPI = {
  getAll: (params) => api.get('/suppliers', { params }),
  getById: (id) => api.get(`/suppliers/${id}`),
  create: (data) => api.post('/suppliers', data),
  update: (id, data) => api.put(`/suppliers/${id}`, data),
  delete: (id) => api.delete(`/suppliers/${id}`),
};

// ==================== SALES API ====================

export const salesAPI = {
  getAll: (params) => api.get('/sales', { params }),
  getById: (id) => api.get(`/sales/${id}`),
  create: (data) => api.post('/sales', data),
  update: (id, data) => api.put(`/sales/${id}`, data),
  delete: (id) => api.delete(`/sales/${id}`),
  getInvoice: (id) => api.get(`/sales/${id}/invoice`),
};

// ==================== PURCHASE API ====================

export const purchaseAPI = {
  getAll: (params) => api.get('/purchases', { params }),
  getById: (id) => api.get(`/purchases/${id}`),
  create: (data) => api.post('/purchases', data),
  update: (id, data) => api.put(`/purchases/${id}`, data),
  delete: (id) => api.delete(`/purchases/${id}`),
};

// ==================== CATEGORY API ====================

export const categoryAPI = {
  getAll: (params) => api.get('/categories', { params }),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};

// ==================== BRANCH API ====================

export const branchAPI = {
  getAll: (params) => api.get('/branches', { params }),
  getById: (id) => api.get(`/branches/${id}`),
  create: (data) => api.post('/branches', data),
  update: (id, data) => api.put(`/branches/${id}`, data),
  delete: (id) => api.delete(`/branches/${id}`),
};

// ==================== PAYMENT API ====================

export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  delete: (id) => api.delete(`/payments/${id}`),
};

// ==================== STOCK API ====================

export const stockAPI = {
  getAll: (params) => api.get('/stock', { params }),
  getByProduct: (productId) => api.get(`/stock/product/${productId}`),
  adjust: (data) => api.post('/stock/adjust', data),
  transfer: (data) => api.post('/stock/transfer', data),
};

// ==================== REPORTS API ====================

export const reportAPI = {
  dashboard: () => api.get('/reports/dashboard'),
  sales: (params) => api.get('/reports/sales', { params }),
  purchases: (params) => api.get('/reports/purchases', { params }),
  inventory: (params) => api.get('/reports/inventory', { params }),
  profit: (params) => api.get('/reports/profit', { params }),
  customers: (params) => api.get('/reports/customers', { params }),
  suppliers: (params) => api.get('/reports/suppliers', { params }),
};

// ==================== DASHBOARD API ====================

export const dashboardAPI = {
  getSummary: () => api.get('/dashboard/summary'),
  getStats: () => api.get('/dashboard/stats'),
  getCharts: (period) => api.get('/dashboard/charts', { params: { period } }),
  getRecentActivity: () => api.get('/dashboard/recent-activity'),
};

// ==================== FILE UPLOAD API ====================

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

// ==================== UTILITIES ====================

export const handleAPIError = (error, customMessage) => {
  const message =
    error.response?.data?.error ||
    error.response?.data?.message ||
    customMessage ||
    'An error occurred';
  toast.error(message);
  console.error('API Error:', error);
  return Promise.reject(error);
};

export const handleAPISuccess = (message) => toast.success(message);

// ==================== COMPATIBILITY EXPORTS ====================

export const reportsAPI = {
  getSalesSummary: (params) => api.get('/reports/sales', { params }),
  getSalesByProduct: (params) => api.get('/reports/sales/by-product', { params }),
  getSalesByCustomer: (params) => api.get('/reports/sales/by-customer', { params }),
  getSalesByCategory: (params) => api.get('/reports/sales', { params: { ...params, groupBy: 'product' } }),
  getDailySales: (params) => api.get('/reports/sales/daily', { params }),
  getMonthlySales: (params) => api.get('/reports/sales/monthly', { params }),
  getYearlySales: (params) => api.get('/reports/sales', { params: { ...params, groupBy: 'daily' } }),
  getPurchaseSummary: (params) => api.get('/reports/purchase', { params }),
};

export const settingsAPI = {
  getCompanySettings: () => api.get('/settings/company'),
  updateCompanySettings: (data) => api.put('/settings/company', data),
  getUsers: (params) => api.get('/users', { params }),
  createUser: (data) => api.post('/users', data),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

export { TokenManager };

export default api;
