import axiosInstance from './axiosInstance'

export const reorderService = {
  checkStock: () => axiosInstance.post('/reorder/check'),

  getSuggestions: (params) => axiosInstance.get('/reorder/suggestions', { params }),

  getPendingCount: () => axiosInstance.get('/reorder/suggestions/count'),

  approve: (id, quantity, notes) =>
    axiosInstance.patch(`/reorder/suggestions/${id}/approve`, { quantity, notes }),

  cancel: (id, notes) =>
    axiosInstance.patch(`/reorder/suggestions/${id}/cancel`, { notes }),
}
