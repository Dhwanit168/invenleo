import axiosInstance from './axiosInstance'

export const dashboardService = {
  getStats: () => axiosInstance.get('/dashboard'),
}
