import axiosInstance from './axiosInstance'

export const supplierService = {
  getAll: (params) => axiosInstance.get('/suppliers', { params }),
  getById: (id) => axiosInstance.get(`/suppliers/${id}`),
  create: (data) => axiosInstance.post('/suppliers', data),
  update: (id, data) => axiosInstance.put(`/suppliers/${id}`, data),
  delete: (id) => axiosInstance.delete(`/suppliers/${id}`),
}
