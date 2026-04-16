// src/services/accountsApi.js
import api from './api';
import { publicClient } from './api';

export const accountsApi = {
  // ==================== Authentication ====================
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
    localStorage.removeItem('user_data');
  },
  
  getCurrentUser: async () => {
    try {
      const response = await api.get('/accounts/me/');
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  getUserInfo: async () => {
    try {
      const response = await api.get('/main/user/info/');
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      // Return a default structure instead of throwing
      return { role: 'public', permissions: {} };
    }
  },
  
  updateProfile: async (profileData) => {
    try {
      const response = await api.patch('/accounts/profile/', profileData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  changePassword: async (passwordData) => {
    try {
      const response = await api.post('/accounts/change-password/', passwordData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  // ==================== User Management (Admin) ====================
  getAllUsers: () => api.get('/accounts/admin/users/'),
  getPendingUsers: () => api.get('/accounts/admin/users/pending/'),
  getUserDetail: (userId) => api.get(`/accounts/admin/users/${userId}/`),
  upgradeUser: (userId, data) => api.put(`/accounts/admin/users/${userId}/upgrade/`, data),
  assignUserGroup: (data) => api.post('/accounts/admin/users/assign-group/', data),
  
  // Groups
  getGroups: () => api.get('/accounts/admin/groups/'),
  
  // User Status
  getCurrentUserStatus: () => api.get('/accounts/user/status/'),
  
  // ==================== Activities ====================
  getUserActivities: (limit = 50) => api.get(`/accounts/activities/?limit=${limit}`),
  getAllActivities: (limit = 100) => api.get(`/accounts/activities/all/?limit=${limit}`),
  logActivity: (data) => api.post('/accounts/activities/log/', data),
  
  // ==================== Bulk Operations ====================
  bulkUpgradeUsers: (userIds, data) => api.post('/accounts/admin/users/bulk-upgrade/', { user_ids: userIds, ...data }),
  bulkDeleteUsers: (userIds) => api.post('/accounts/admin/users/bulk-delete/', { user_ids: userIds }),
};

export default accountsApi;