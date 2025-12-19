import api from './api';

export const dashboardService = {
  getStats: () => api.get('/dashboard/stats'),
  getRecentIssues: (limit = 5) => api.get(`/dashboard/recent-issues?limit=${limit}`),
  getIssuesByCategory: () => api.get('/dashboard/issues-by-category'),
  getIssuesByLocation: () => api.get('/dashboard/issues-by-location')
};