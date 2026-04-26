import axiosInstance from './axiosInstance';

export const forecastService = {
  getOverview:    () => axiosInstance.get('/forecast/overview'),
  getProducts:    () => axiosInstance.get('/forecast/products'),
  getCategories:  () => axiosInstance.get('/forecast/categories'),
};
