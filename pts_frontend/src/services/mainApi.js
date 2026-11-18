// services/mainApi.js
import api from './api';

// Helper function to get user role
const getUserRole = () => {
  const userData = localStorage.getItem('user_data');
  if (userData) {
    try {
      const parsed = JSON.parse(userData);
      return parsed.role;
    } catch (e) {}
  }
  return null;
};

const mainApi = {
  // ==================== Public Endpoints ====================
  getPublicPriorityAreas: async () => {
    try {
      const response = await api.get('/main/public/priority-areas/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicDepartments: async () => {
    try {
      const response = await api.get('/main/public/departments/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicAgencies: async () => {
    try {
      const response = await api.get('/main/public/agencies/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicDeliverables: async () => {
    try {
      const response = await api.get('/main/public/deliverables/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicIndicators: async (deliverableId = null) => {
    try {
      const params = deliverableId ? { deliverable: deliverableId } : {};
      const response = await api.get('/main/public/indicators/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicActivities: async (filters = {}) => {
    try {
      const response = await api.get('/main/public/activities/', { params: filters });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getPublicActivityDetail: async (activityId) => {
    try {
      const response = await api.get(`/main/public/activities/${activityId}/`);
      return response.data;
    } catch (error) {
      return null;
    }
  },
  
  // ==================== Safe Activity Methods ====================
  getActivities: async (params = {}) => {
    const userRole = getUserRole();
    
    // Return empty array for Sector Expert to prevent 403
    if (userRole === 'sector_expert') {
      console.log('Sector Expert: Returning empty activities array');
      return [];
    }
    
    try {
      const response = await api.get('/main/activities/', { params });
      return response.data;
    } catch (error) {
      if (error.response?.status === 403) {
        return [];
      }
      throw error;
    }
  },
  
  getMyActivities: async (params = {}) => {
    try {
      const response = await api.get('/main/delivery/activities/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getActivityDetail: async (id) => {
    try {
      // Use public endpoint for all users - safe and no 403
      const response = await api.get(`/main/public/activities/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Error fetching activity detail:', error);
      return null;
    }
  },
    
  createActivity: async (data) => {
    const response = await api.post('/main/activities/', data);
    return response.data;
  },
  
  updateActivity: async (id, data) => {
    const response = await api.patch(`/main/activities/${id}/`, data);
    return response.data;
  },
  
  deleteActivity: async (id) => {
    const response = await api.delete(`/main/activities/${id}/`);
    return response.data;
  },
  
  // ==================== Delivery Officer ====================
  getMyProgressList: async () => {
    try {
      const response = await api.get('/main/delivery/progress/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  updateQuarterlyProgress: async (id, data) => {
    const response = await api.patch(`/main/delivery/progress/${id}/`, data);
    return response.data;
  },

  // Delivery Officer: Update activity location
  updateActivityLocation: async (id, data) => {
    const response = await api.patch(`/main/delivery/activities/${id}/update/`, data);
    return response.data;
  },
  
  // ==================== Director ====================
  getPendingApprovals: async () => {
    try {
      const response = await api.get('/main/director/pending/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  approveProgress: async (id, status, additionalData = {}) => {
    const response = await api.patch(`/main/director/approve/${id}/`, { status, ...additionalData });
    return response.data;
  },
  
  // ==================== Sector Expert ====================
  getPendingAssessments: async () => {
    try {
      const response = await api.get('/main/expert/pending/');
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  submitAssessment: async (id, data) => {
    const response = await api.patch(`/main/expert/assess/${id}/`, data);
    return response.data;
  },
  
  // ==================== Reports ====================
  getIndicatorPerformance: async (params = {}) => {
    try {
      const response = await api.get('/main/reports/indicator-summaries/', { params });
      return response.data;
    } catch (error) {
      return { top_indicators: [], summary: {} };
    }
  },
  
  getDeliverableReports: async (params = {}) => {
    try {
      const response = await api.get('/main/reports/deliverable-reports/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  getFederalReports: async (params = {}) => {
    try {
      const response = await api.get('/main/reports/federal-reports/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },
  
  // ==================== Dashboard ====================
  getDashboardStats: async () => {
    try {
      const response = await api.get('/main/dashboard/stats/');
      return response.data;
    } catch (error) {
      return { overall: {}, quarterly_trend: [], priority_areas: [] };
    }
  },
  
  // ==================== Management ====================
  getDepartments: async () => {
    const response = await api.get('/main/public/departments/');
    return response.data;
  },
  
  getAgencies: async () => {
    const response = await api.get('/main/public/agencies/');
    return response.data;
  },
  
  getDeliverables: async () => {
    const response = await api.get('/main/public/deliverables/');
    return response.data;
  },
  
  // ==================== Indicator Management ====================
  getIndicators: async (params = {}) => {
    try {
      const response = await api.get('/main/indicators/', { params });
      return response.data;
    } catch (error) {
      return [];
    }
  },

  createIndicator: async (data) => {
    const response = await api.post('/main/indicators/', data);
    return response.data;
  },

  updateIndicator: async (id, data) => {
    const response = await api.patch(`/main/indicators/${id}/`, data);
    return response.data;
  },

    deleteIndicator: async (id) => {
    const response = await api.delete(`/main/indicators/${id}/`);
    return response.data;
  },

  // Department CRUD (Project Admin)
  createDepartment: async (data) => {
    const response = await api.post('/main/departments/', data);
    return response.data;
  },
  updateDepartment: async (id, data) => {
    const response = await api.patch(`/main/departments/${id}/`, data);
    return response.data;
  },
  deleteDepartment: async (id) => {
    const response = await api.delete(`/main/departments/${id}/`);
    return response.data;
  },

  // Agency CRUD (Project Admin)
  createAgency: async (data) => {
    const response = await api.post('/main/agencies/', data);
    return response.data;
  },
  updateAgency: async (id, data) => {
    const response = await api.patch(`/main/agencies/${id}/`, data);
    return response.data;
  },
  deleteAgency: async (id) => {
    const response = await api.delete(`/main/agencies/${id}/`);
    return response.data;
  },

  // Priority Area CRUD (Project Admin)
  createPriorityArea: async (data) => {
    const response = await api.post('/main/priority-areas/', data);
    return response.data;
  },
  updatePriorityArea: async (id, data) => {
    const response = await api.patch(`/main/priority-areas/${id}/`, data);
    return response.data;
  },
  deletePriorityArea: async (id) => {
    const response = await api.delete(`/main/priority-areas/${id}/`);
    return response.data;
  },

  // Deliverable CRUD (Project Admin)
  createDeliverable: async (data) => {
    const response = await api.post('/main/deliverables/', data);
    return response.data;
  },
  updateDeliverable: async (id, data) => {
    const response = await api.patch(`/main/deliverables/${id}/`, data);
    return response.data;
  },
  deleteDeliverable: async (id) => {
    const response = await api.delete(`/main/deliverables/${id}/`);
    return response.data;
  },

};

export default mainApi;