import axiosInstance from './axiosInstance'

export const reportService = {
  sales:     (params) => axiosInstance.get('/reports/sales',     { params }),
  purchases: (params) => axiosInstance.get('/reports/purchases', { params }),
  stock:     (params) => axiosInstance.get('/reports/stock',     { params }),

  exportSales: (params) =>
    axiosInstance.get('/export/sales',     { params, responseType: 'blob' }),

  exportPurchases: (params) =>
    axiosInstance.get('/export/purchases', { params, responseType: 'blob' }),

  exportStock: (params) =>
    axiosInstance.get('/export/stock',     { params, responseType: 'blob' }),
}
