// src/services/reportsApi.js
import api from './api';

const reportsApi = {
  getSummary: async (year) => {
    const { data } = await api.get('/reports/summary/', { params: { year } });
    return data;
  },
  getPriorityAreas: async (year) => {
    const { data } = await api.get('/reports/priority-areas/', { params: { year } });
    return data;
  },
  getDeliverables: async (year, priorityAreaId) => {
    const { data } = await api.get('/reports/deliverables/', {
      params: { year, priority_area: priorityAreaId || undefined },
    });
    return data;
  },
  getDepartments: async (year, departmentId) => {
    const { data } = await api.get('/reports/departments/', {
      params: { year, department: departmentId || undefined },
    });
    return data;
  },
  getAgencies: async (year, agencyId) => {
    const { data } = await api.get('/reports/agencies/', {
      params: { year, agency: agencyId || undefined },
    });
    return data;
  },
  getAtRiskActivities: async (year) => {
    const { data } = await api.get('/reports/at-risk-activities/', { params: { year } });
    return data;
  },
  getQuarterlyTrend: async (year) => {
    const { data } = await api.get('/reports/quarterly-trend/', { params: { year } });
    return data;
  },
  getAssessments: async (year) => {
    const { data } = await api.get('/reports/assessments/', { params: { year } });
    return data;
  },

  // CSV export — takes the shape we already use
  downloadCSV: (headers, rows, filename) => {
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [headers.map(esc).join(',')];
    rows.forEach((r) => lines.push(headers.map((h) => esc(r[h])).join(',')));
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  },
};

export default reportsApi;