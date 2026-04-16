// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// Create main axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Create public client for unauthenticated requests
export const publicClient = axios.create({
  baseURL: API_URL,
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

// Add session ID to public client for anonymous tracking
publicClient.interceptors.request.use((config) => {
  const sessionId = localStorage.getItem('public_session_id');
  if (sessionId) {
    config.headers['X-Session-ID'] = sessionId;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle token refresh on 401
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        const refreshToken = localStorage.getItem('refresh_token');
        if (!refreshToken) {
          throw new Error('No refresh token');
        }
        
        const response = await axios.post(`${API_URL}/accounts/auth/jwt/refresh/`, {
          refresh: refreshToken,
        });
        
        localStorage.setItem('access_token', response.data.access);
        api.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Don't show toast for 401 errors on login page
    if (error.response?.status === 401 && window.location.pathname === '/login') {
      return Promise.reject(error);
    }

    // Show error toast for other errors
    const message = error.response?.data?.message || 
                   error.response?.data?.error || 
                   error.response?.data?.detail ||
                   error.message || 
                   'An error occurred';
    
    if (!error.config._toastShown) {
      error.config._toastShown = true;
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Public client response interceptor
publicClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || 
                   error.response?.data?.message || 
                   error.message || 
                   'An error occurred';
    if (error.response?.status !== 429) {
      toast.error(message);
    }
    return Promise.reject(error);
  }
);

export default api;