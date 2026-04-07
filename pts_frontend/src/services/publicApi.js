// src/services/publicApi.js
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

const apiClient = axios.create({
  baseURL: `${API_URL}/engagement`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token for authenticated requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.url.includes('/auth/')) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.message === 'Network Error') {
      toast.error('Network error. Please check your connection.');
    } else {
      const message = error.response?.data?.error || 
                      error.response?.data?.message || 
                      error.message || 
                      'An error occurred';
      if (error.response?.status !== 429) { // Don't show toast for rate limit
        toast.error(message);
      }
    }
    return Promise.reject(error);
  }
);

// Export the API methods
export const publicApi = {
  // Projects
  getProjects: (params) => apiClient.get('/projects/', { params }),
  getProject: (id) => apiClient.get(`/projects/${id}/`),
  
  // Comments - Anonymous
  getComments: (projectId) => apiClient.get(`/projects/${projectId}/comments/`),
  postComment: (projectId, data) => apiClient.post(`/projects/${projectId}/comments/`, data),
  
  // Comments - Authenticated (with JWT)
  postCommentAuthenticated: (projectId, data) => {
    const token = localStorage.getItem('access_token');
    return apiClient.post(`/projects/${projectId}/comments/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // Reactions - Anonymous
  reactToComment: (commentId, data) => apiClient.post(`/comments/${commentId}/react/`, data),
  
  // Reactions - Authenticated
  reactToCommentAuthenticated: (commentId, data) => {
    const token = localStorage.getItem('access_token');
    return apiClient.post(`/comments/${commentId}/react/`, data, {
      headers: { Authorization: `Bearer ${token}` }
    });
  },
  
  // Rate limit check
  getRateLimit: (sessionId) => apiClient.get(`/rate-limit/?session_id=${sessionId}`),
  
  // User
  registerPublicUser: (data) => apiClient.post('/register/', data),
};

export default apiClient;