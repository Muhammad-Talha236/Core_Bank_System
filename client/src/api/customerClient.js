import axios from 'axios';

const customerApi = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

customerApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('customerToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

customerApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('customerToken');
      localStorage.removeItem('customerProfile');
      if (window.location.pathname !== '/customer/login') {
        window.location.href = '/customer/login';
      }
    }
    return Promise.reject(error);
  }
);

export default customerApi;