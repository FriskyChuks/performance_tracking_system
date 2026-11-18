// services/engagementApi.js
import api from './api';

const engagementApi = {
  // ==================== Public Endpoints ====================
  getActivityImages: async (activityId) => {
    try {
      const response = await api.get(`/engagement/public/activities/${activityId}/images/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity images:', error);
      return [];
    }
  },
  
  getActivityComments: async (activityId) => {
    try {
      const response = await api.get(`/engagement/public/activities/${activityId}/comments/`);
      console.log('API response for comments:', response);
      
      // Return the results array if it exists, otherwise return the data
      if (response.data && response.data.results) {
        return response.data.results;
      }
      return response.data || [];
    } catch (error) {
      console.error('Error fetching activity comments:', error);
      return [];
    }
  },
  
  postComment: async (activityId, data, sessionId = null) => {
    try {
      const headers = sessionId ? { 'HTTP_SESSION_ID': sessionId } : {};
      const response = await api.post(`/engagement/public/activities/${activityId}/comments/`, data, { headers });
      return response.data;
    } catch (error) {
      console.error('Error posting comment:', error);
      throw error;
    }
  },
  
  getCommentReplies: async (commentId) => {
    try {
      const response = await api.get(`/engagement/public/comments/${commentId}/replies/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching comment replies:', error);
      return [];
    }
  },
  
  getMapActivities: async () => {
    try {
      const response = await api.get('/engagement/public/map/activities/');
      return response.data;
    } catch (error) {
      console.error('Error fetching map activities:', error);
      return [];
    }
  },
  

  // ==================== Reactions ====================
  addReaction: async (commentId, reactionType, sessionId = null) => {
    try {
      // Always set up headers properly
      const headers = {};
      if (sessionId) {
        headers['HTTP_SESSION_ID'] = sessionId;
      }
      
      const response = await api.post('/engagement/reactions/', 
        { comment: commentId, reaction_type: reactionType },
        { headers }
      );
      console.log('Reaction added:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error adding reaction:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },

  removeReaction: async (commentId, sessionId = null) => {
    try {
      const headers = {};
      if (sessionId) {
        headers['HTTP_SESSION_ID'] = sessionId;
      }
      
      const response = await api.delete(`/engagement/reactions/comments/${commentId}/`, { headers });
      console.log('Reaction removed:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error removing reaction:', error);
      console.error('Response data:', error.response?.data);
      throw error;
    }
  },
  
  // ==================== Image Management (Authenticated) ====================
  uploadImage: async (formData) => {
    try {
      const response = await api.post('/engagement/images/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  },
  
  deleteImage: async (imageId) => {
    try {
      const response = await api.delete(`/engagement/images/${imageId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  },
  
  setPrimaryImage: async (imageId) => {
    try {
      const response = await api.patch(`/engagement/images/${imageId}/set-primary/`);
      return response.data;
    } catch (error) {
      console.error('Error setting primary image:', error);
      throw error;
    }
  },
  
  // ==================== Follow Functionality (Authenticated) ====================
  followActivity: async (activityId) => {
    try {
      const response = await api.post(`/engagement/follow/${activityId}/`);
      return response.data;
    } catch (error) {
      console.error('Error following activity:', error);
      throw error;
    }
  },
  
  unfollowActivity: async (activityId) => {
    try {
      const response = await api.delete(`/engagement/unfollow/${activityId}/`);
      return response.data;
    } catch (error) {
      console.error('Error unfollowing activity:', error);
      throw error;
    }
  },
  
  getFollowedActivities: async () => {
    try {
      const response = await api.get('/engagement/my-follows/');
      return response.data;
    } catch (error) {
      console.error('Error fetching followed activities:', error);
      return [];
    }
  },
  
  // ==================== Moderation (Staff Only) ====================
  verifyComment: async (commentId) => {
    try {
      const response = await api.patch(`/engagement/moderate/comments/${commentId}/`, { action: 'verify' });
      return response.data;
    } catch (error) {
      console.error('Error verifying comment:', error);
      throw error;
    }
  },
  
  deleteComment: async (commentId) => {
    try {
      const response = await api.patch(`/engagement/moderate/comments/${commentId}/`, { action: 'delete' });
      return response.data;
    } catch (error) {
      console.error('Error deleting comment:', error);
      throw error;
    }
  },
  
  // ==================== Activity Documents ====================
  getActivityDocuments: async (activityId) => {
    try {
      const response = await api.get(`/engagement/activities/${activityId}/documents/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity documents:', error);
      return [];
    }
  },
  
  uploadDocument: async (formData) => {
    try {
      const response = await api.post('/engagement/documents/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },
  
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/engagement/documents/${documentId}/`);
      return response.data;
    } catch (error) {
      console.error('Error deleting document:', error);
      throw error;
    }
  }
};

export default engagementApi;