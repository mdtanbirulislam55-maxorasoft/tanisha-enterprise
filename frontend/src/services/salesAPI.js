import api from './api';

export const salesAPI = {
  // Sales
  getSalesList: async (params = {}) => {
    const response = await api.get('/sales/list', { params });
    return response.data;
  },
  
  getSaleById: async (id) => {
    const response = await api.get(\/sales/\\);
    return response.data;
  },
  
  createSale: async (data) => {
    const response = await api.post('/sales/create', data);
    return response.data;
  },
  
  // Customers
  getCustomers: async (params = {}) => {
    const response = await api.get('/customers', { params });
    return response.data;
  },
  
  getCustomerById: async (id) => {
    const response = await api.get(\/customers/\\);
    return response.data;
  },
  
  // Dashboard
  getSalesSummary: async (params = {}) => {
    const response = await api.get('/reports/sales/summary', { params });
    return response.data;
  }
};
