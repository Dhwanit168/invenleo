import axiosInstance from './axiosInstance'

export const authService = {
  login: (data) => axiosInstance.post('/auth/login', data),
  register: (data) => axiosInstance.post('/auth/register', data),
  logout: () => axiosInstance.post('/auth/logout'),
  getMe: () => axiosInstance.get('/auth/me'),
  updateProfile: (data) => axiosInstance.patch('/auth/profile', data),
  forgotPassword: (data) => axiosInstance.post('/auth/forgot-password', data),
  resetPassword: (token, data) => axiosInstance.post(`/auth/reset-password/${token}`, data),

getUsers: (params) => axiosInstance.get('/auth/users', { params }),
  createUser: (data) => axiosInstance.post('/auth/users', data),
  updateUserRole: (id, data) => axiosInstance.patch(`/auth/users/${id}/role`, data),
}
