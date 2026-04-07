// src/services/api.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const api = axios.create({
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
        // Refresh failed, redirect to login
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
    
    // Only show toast if not already showing
    if (!error.config._toastShown) {
      error.config._toastShown = true;
      toast.error(message);
    }
    
    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: async (email, password) => {
    try {
      const response = await api.post('/accounts/auth/jwt/create/', { email, password });
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData) => {
    try {
      const response = await api.post('/accounts/register/', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/accounts/me/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Update user profile
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/accounts/profile/', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // Change password
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/accounts/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};

// ACTIVITIES API
export const activities = {
  getUserActivities: (limit = 50) => api.get(`/accounts/activities/?limit=${limit}`),
  getAllActivities: (limit = 100) => api.get(`/accounts/activities/all/?limit=${limit}`),
  logActivity: async (action, description) => {
    try {
      const response = await api.post('/accounts/activities/log/', {
        action,
        description
      });
      return response.data;
    } catch (error) {
      console.error('Error logging activity:', error);
      return { success: false };
    }
  }
};

// Main app endpoints
export const ministries = {
  list: (params) => api.get('/main/ministries/', { params }),
  create: (data) => api.post('/main/ministries/', data),
  update: (id, data) => api.put(`/main/ministries/${id}/`, data),
  delete: (id) => api.delete(`/main/ministries/${id}/`),
};

export const priorityAreas = {
  list: (params) => api.get('/main/priority-areas/', { params }),
  create: (data) => api.post('/main/priority-areas/', data),
  update: (id, data) => api.put(`/main/priority-areas/${id}/`, data),
  delete: (id) => api.delete(`/main/priority-areas/${id}/`),
};

export const deliverables = {
  list: (params) => api.get('/main/deliverables/', { params }),
  create: (data) => api.post('/main/deliverables/', data),
  update: (id, data) => api.put(`/main/deliverables/${id}/`, data),
  delete: (id) => api.delete(`/main/deliverables/${id}/`),
};

export const projects = {
  list: (params) => api.get('/main/projects/', { params }),
  create: (data) => api.post('/main/projects/', data),
  update: (id, data) => api.put(`/main/projects/${id}/`, data),
  delete: (id) => api.delete(`/main/projects/${id}/`),
  summary: (params) => api.get('/main/projects/summary/', { params }),
  dashboardStats: () => api.get('/main/dashboard/stats/'),
  export: (params) => api.get('/main/projects/export/', { params, responseType: 'blob' }),
};

export default api;