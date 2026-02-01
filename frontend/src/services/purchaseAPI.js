import api from './api';

export const purchaseAPI = {
  // Purchases
  getPurchasesList: async (params = {}) => {
    const response = await api.get('/purchases', { params });
    return response.data;
  },
  
  getPurchaseById: async (id) => {
    const response = await api.get(\/purchases/\\);
    return response.data;
  },
  
  createPurchase: async (data) => {
    const response = await api.post('/purchases', data);
    return response.data;
  },
  
  // Suppliers
  getSuppliers: async (params = {}) => {
    const response = await api.get('/purchases/suppliers', { params });
    return response.data;
  },
  
  // Warehouses
  getWarehouses: async () => {
    const response = await api.get('/stock/current');
    return response.data;
  }
};
