// services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle token refresh and permission errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Handle 403 Forbidden - Permission denied
    if (error.response?.status === 403) {
      console.warn('Permission denied for endpoint:', originalRequest?.url);
      
      // Check if this is a Delivery Officer trying to access admin endpoints
      const userData = localStorage.getItem('user_data');
      let userRole = null;
      if (userData) {
        try {
          const parsed = JSON.parse(userData);
          userRole = parsed.role;
        } catch (e) {}
      }
      
      // For Delivery Officers, return empty data instead of throwing error
      if (userRole === 'delivery_officer') {
        // Return empty response to prevent app crash
        return Promise.resolve({ 
          data: [],
          status: 200,
          statusText: 'OK',
          headers: {},
          config: originalRequest
        });
      }
      
      // For other roles, reject normally
      return Promise.reject(error);
    }
    
    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/token/refresh/`, {
            refresh: refreshToken,
          });
          
          localStorage.setItem('access_token', response.data.access);
          originalRequest.headers.Authorization = `Bearer ${response.data.access}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, redirect to login
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user_data');
          window.location.href = '/login';
          return Promise.reject(refreshError);
        }
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;