// src/services/engagementApi.js
import api, { publicClient } from './api';
import toast from 'react-hot-toast';

export const engagementApi = {
  // ==================== Public Initiatives (Projects) ====================
  getInitiatives: (params) => publicClient.get('/engagement/initiatives/', { params }),
  getInitiative: (id) => publicClient.get(`/engagement/initiatives/${id}/`),
  
  // ==================== Comments ====================
  // Anonymous comments
  getComments: (initiativeId) => publicClient.get(`/engagement/initiatives/${initiativeId}/comments/`),
  postComment: (initiativeId, data) => publicClient.post(`/engagement/initiatives/${initiativeId}/comments/`, data),
  
  // Authenticated comments
  postCommentAuthenticated: (initiativeId, data) => {
    const token = localStorage.getItem('access_token');
    return api.post(`/engagement/initiatives/${initiativeId}/comments/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // ==================== Reactions ====================
  reactToComment: (commentId, data) => publicClient.post(`/engagement/comments/${commentId}/react/`, data),
  reactToCommentAuthenticated: (commentId, data) => {
    const token = localStorage.getItem('access_token');
    return api.post(`/engagement/comments/${commentId}/react/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // ==================== Images ====================
  getInitiativeImages: (initiativeId) => publicClient.get(`/engagement/initiatives/${initiativeId}/images/`),
  
  uploadImage: (initiativeId, formData) => {
    const token = localStorage.getItem('access_token');
    return api.post(`/engagement/initiatives/${initiativeId}/images/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`
      },
    });
  },
  
  deleteImage: (imageId) => {
    const token = localStorage.getItem('access_token');
    return api.delete(`/engagement/images/${imageId}/`, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  setPrimaryImage: (imageId) => {
    const token = localStorage.getItem('access_token');
    return api.put(`/engagement/images/${imageId}/set-primary/`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // ==================== Rate Limit ====================
  getRateLimit: (sessionId) => publicClient.get(`/engagement/rate-limit/?session_id=${sessionId}`),
  
  // ==================== User Registration ====================
  registerPublicUser: (data) => publicClient.post('/engagement/register/', data),
};

export default engagementApi;