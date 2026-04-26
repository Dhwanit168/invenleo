import axiosInstance from './axiosInstance'

export const auditService = {
  getLogs: (params) => axiosInstance.get('/audit', { params }),
  getActions: () => axiosInstance.get('/audit/actions'),
}
