import axiosInstance from './axiosInstance'

export const variantService = {
  getAll: (params) => axiosInstance.get('/variants', { params }),
  getByProduct: (productId) => axiosInstance.get('/variants', { params: { productId, limit: 200 } }),
  create: (data) => axiosInstance.post('/variants', data),
  update: (id, data) => axiosInstance.put(`/variants/${id}`, data),
  delete: (id) => axiosInstance.delete(`/variants/${id}`),
  adjustStock: (id, data) => axiosInstance.patch(`/variants/${id}/stock`, data),
}
