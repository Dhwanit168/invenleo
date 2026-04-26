import axiosInstance from './axiosInstance'

export const purchaseService = {
  getAll: (params) => axiosInstance.get('/purchases', { params }),
  getById: (id) => axiosInstance.get(`/purchases/${id}`),
  create: (data) => axiosInstance.post('/purchases', data),
  updateStatus: (id, status) => axiosInstance.patch(`/purchases/${id}/status`, { status }),
}
