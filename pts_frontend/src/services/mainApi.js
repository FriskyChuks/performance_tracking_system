// src/services/mainApi.js
import api from './api';
import { publicClient } from './api';

export const mainApi = {
  // ==================== Departments ====================
  departments: {
    list: (params) => api.get('/main/departments/', { params }),
    create: (data) => api.post('/main/departments/', data),
    update: (id, data) => api.put(`/main/departments/${id}/`, data),
    delete: (id) => api.delete(`/main/departments/${id}/`),
  },
  
  // ==================== Agencies ====================
  agencies: {
    list: (params) => api.get('/main/agencies/', { params }),
    create: (data) => api.post('/main/agencies/', data),
    update: (id, data) => api.put(`/main/agencies/${id}/`, data),
    delete: (id) => api.delete(`/main/agencies/${id}/`),
  },
  
  // ==================== Priority Areas ====================
  priorityAreas: {
    list: (params) => api.get('/main/priority-areas/', { params }),
    create: (data) => api.post('/main/priority-areas/', data),
    update: (id, data) => api.put(`/main/priority-areas/${id}/`, data),
    delete: (id) => api.delete(`/main/priority-areas/${id}/`),
  },
  
  // ==================== Deliverables ====================
  deliverables: {
    list: (params) => api.get('/main/deliverables/', { params }),
    create: (data) => api.post('/main/deliverables/', data),
    update: (id, data) => api.put(`/main/deliverables/${id}/`, data),
    delete: (id) => api.delete(`/main/deliverables/${id}/`),
  },
  
  // ==================== Initiatives ====================
  initiatives: {
    list: (params) => api.get('/main/initiatives/', { params }),
    create: (data) => api.post('/main/initiatives/', data),
    update: (id, data) => api.put(`/main/initiatives/${id}/`, data),
    delete: (id) => api.delete(`/main/initiatives/${id}/`),
    summary: (params) => api.get('/main/initiatives/summary/', { params }),
    recordProgress: (id, data) => api.post(`/main/initiatives/${id}/record-progress/`, data),
    dashboardStats: () => api.get('/main/dashboard/stats/'),
  },
  
  // ==================== Quarterly Progress ====================
  quarterlyProgress: {
    getByInitiative: (initiativeId, year) => 
      api.get(`/main/initiatives/${initiativeId}/quarters/`, { params: { year } }),
    getByQuarter: (initiativeId, year, quarter) => 
      api.get(`/main/initiatives/${initiativeId}/quarters/${year}/${quarter}/`),
    create: (initiativeId, data) => 
      api.post(`/main/initiatives/${initiativeId}/quarters/create/`, data),
    upsert: (initiativeId, data) => 
      api.post(`/main/initiatives/${initiativeId}/quarters/upsert/`, data),
    updateActual: (quarterId, data) => 
      api.patch(`/main/quarterly/${quarterId}/update-actual/`, data),
    submitForReview: (quarterId) => 
      api.post(`/main/quarterly/${quarterId}/submit/`),
    approve: (quarterId) => 
      api.post(`/main/quarterly/${quarterId}/approve/`),
    reject: (quarterId, reason) => 
      api.post(`/main/quarterly/${quarterId}/reject/`, { reason }),
    getStaffQuarters: () => 
      api.get('/main/quarterly/staff/'),
    getPendingApprovals: () => 
      api.get('/main/quarterly/pending-approval/'),
  },

  // ==================== Expert Assessment ====================
  assessments: {
    getByInitiative: (initiativeId) => 
      api.get(`/main/initiatives/${initiativeId}/assessment/`),
    save: (initiativeId, data) => 
      api.post(`/main/initiatives/${initiativeId}/assessment/save/`, data),
    getPendingAssessments: () => 
      api.get('/main/dashboard/expert/'),
    getInitiativeForExpert: (initiativeId) => 
      api.get(`/main/initiatives/${initiativeId}/expert-assessment/`),
  },

  // ==================== Quarterly Summaries ====================
  summaries: {
    getByInitiative: (initiativeId) => 
      api.get(`/main/initiatives/${initiativeId}/summaries/`),
    getByYear: (initiativeId, year) => 
      api.get(`/main/initiatives/${initiativeId}/summaries/${year}/`),
  },

  // ==================== Role-Based Dashboards ====================
  staffDashboard: () => 
    api.get('/main/dashboard/staff/'),
  directorDashboard: () => 
    api.get('/main/dashboard/director/'),
  expertDashboard: () => 
    api.get('/main/dashboard/expert/'),
  
  // ==================== Role-Based Actions ====================
  staff: {
    updateInitiative: (id, data) => api.patch(`/main/staff/initiatives/${id}/update/`, data),
  },
  director: {
    approveInitiative: (id, action) => api.patch(`/main/director/initiatives/${id}/approve/`, { action }),
  },
  
  // ==================== Public Endpoints (Landing Page) ====================
  public: {
    // Initiatives
    getInitiatives: (params) => publicClient.get('/main/public/initiatives/', { params }),
    getInitiative: (id) => publicClient.get(`/main/public/initiatives/${id}/`),
    
    // Departments
    getDepartments: () => publicClient.get('/main/public/departments/'),
    
    // Agencies
    getAgencies: () => publicClient.get('/main/public/agencies/'),
    
    // Priority Areas
    getPriorityAreas: () => publicClient.get('/main/public/priority-areas/'),
    
    // Deliverables
    getDeliverables: () => publicClient.get('/main/public/deliverables/'),
    
    // Dashboard Stats
    getDashboardStats: () => publicClient.get('/main/public/dashboard-stats/'),
  },
};

export default mainApi;