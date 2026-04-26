import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  withCredentials: true,   // ← this tells browser to send cookies automatically
});

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && !error.config.url.includes('/auth/me')) {

      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
