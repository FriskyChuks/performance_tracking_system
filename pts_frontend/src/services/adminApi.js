// src/services/adminApi.js
import api from './api';

export const adminApi = {
  // User Management
  getAllUsers: () => api.get('/accounts/admin/users/'),
  getPendingUsers: () => api.get('/accounts/admin/users/pending/'),
  getUserDetail: (userId) => api.get(`/accounts/admin/users/${userId}/`),
  upgradeUser: (userId, data) => api.put(`/accounts/admin/users/${userId}/upgrade/`, data),
  assignUserGroup: (data) => api.post('/accounts/admin/users/assign-group/', data),
  
  // Groups
  getGroups: () => api.get('/accounts/admin/groups/'),
  
  // User Status
  getCurrentUserStatus: () => api.get('/accounts/user/status/'),
  getCurrentUser: () => api.get('/accounts/me/'),
  
  // Bulk Operations
  bulkUpgradeUsers: (userIds, data) => api.post('/accounts/admin/users/bulk-upgrade/', { user_ids: userIds, ...data }),
  bulkDeleteUsers: (userIds) => api.post('/accounts/admin/users/bulk-delete/', { user_ids: userIds }),
};

export default adminApi;