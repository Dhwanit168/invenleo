import axiosInstance from './axiosInstance'

export const saleService = {
  getAll: (params) => axiosInstance.get('/sales', { params }),
  getById: (id) => axiosInstance.get(`/sales/${id}`),
  create: (data) => axiosInstance.post('/sales', data),
}
