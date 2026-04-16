// src/services/reportsApi.js
import api from './api';

export const reportsApi = {
  // Get report data
  getReportData: (reportType, params) => 
    api.get(`/reports/${reportType}/`, { params }),
  
  // Export report - Fix the URL pattern and response handling
  exportReport: (reportType, format, params) => {
    // Create a new abort controller for this request
    const controller = new AbortController();
    
    // Use axios directly with proper blob response type
    return api.get(`/reports/export/${reportType}/`, { 
      params: { ...params, format },
      responseType: 'blob',
      signal: controller.signal
    });
  },
};

export default reportsApi;