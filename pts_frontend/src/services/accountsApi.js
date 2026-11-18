// services/accountsApi.js
import api from './api';

const accountsApi = {
  // Authentication
  login: async (email, password) => {
    const response = await api.post('/auth/login/', { email, password });
    return response.data;
  },
  
  logout: () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user_data');
  },
  
  register: async (userData) => {
    const response = await api.post('/auth/register/', userData);
    return response.data;
  },
  
  getCurrentUser: async () => {
    const response = await api.get('/auth/profile/');
    return response.data;
  },
  
  updateProfile: async (userData) => {
    const response = await api.patch('/auth/profile/', userData);
    return response.data;
  },
  
  changePassword: async (oldPassword, newPassword, confirmPassword) => {
    const response = await api.post('/auth/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
      confirm_password: confirmPassword,
    });
    return response.data;
  },
  
  // User Management (Admin only)
  getAllUsers: async () => {
    const response = await api.get('/auth/users/');
    return response.data;
  },
  
  // IMPORTANT: Use the /update/ endpoint, NOT /role/
  updateUserRole: async (userId, updateData) => {
    // Change this line to use /update/ instead of /role/
    const response = await api.patch(`/auth/users/${userId}/update/`, updateData);
    return response.data;
  },
  
  // Activity Logs (Admin only)
  getActivityLogs: async (params = {}) => {
    const response = await api.get('/auth/activity-logs/', { params });
    return response.data;
  },
};

export default accountsApi;