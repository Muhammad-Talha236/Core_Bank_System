import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Attach the staff JWT (if present) to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('staffToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// If the server says the session is invalid/expired, clear it and
// send the user back to the login screen instead of showing a broken page
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('staffToken');
      localStorage.removeItem('staffProfile');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;