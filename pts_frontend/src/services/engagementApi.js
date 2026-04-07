// src/services/engagementApi.js
import api from './api';

export const engagementApi = {
  // Image Management
  uploadImage: (projectId, formData) => {
    return api.post(`/engagement/projects/${projectId}/images/upload/`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  deleteImage: (imageId) => {
    return api.delete(`/engagement/images/${imageId}/`);
  },
  
  setPrimaryImage: (imageId) => {
    return api.put(`/engagement/images/${imageId}/set-primary/`);
  },
  
  getProjectImages: (projectId) => {
    return api.get(`/engagement/projects/${projectId}/images/`);
  },
};

export default engagementApi;