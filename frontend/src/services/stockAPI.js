import api from './api';

export const stockAPI = {
  // Stock
  getStock: async (params = {}) => {
    const response = await api.get('/stock/current', { params });
    return response.data;
  },
  
  getStockByWarehouse: async (warehouseId) => {
    const response = await api.get(\/stock/current?warehouseId=\\);
    return response.data;
  },
  
  // Categories
  getCategories: async () => {
    const response = await api.get('/products/categories');
    return response.data;
  },
  
  // Adjustments
  createAdjustment: async (data) => {
    const response = await api.post('/stock/adjustments', data);
    return response.data;
  }
};
