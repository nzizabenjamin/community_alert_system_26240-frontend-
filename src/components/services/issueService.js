import api from './api';

export const issueService = {
  getAll: (page = 0, size = 10, sort = 'dateReported', direction = 'DESC') => {
    return api.get('/issues', {
      params: { page, size, sort, direction }
    });
  },

  getById: (id) => {
    return api.get(`/issues/${id}`);
  },

  create: (issueData) => {
    return api.post('/issues', issueData);
  },

  update: (id, issueData) => {
    return api.put(`/issues/${id}`, issueData);
  },

  updateStatus: (id, status) => {
    return api.put(`/issues/${id}/status`, null, {
      params: { status }
    });
  },

  delete: (id) => {
    return api.delete(`/issues/${id}`);
  },

  addTag: (issueId, tagId) => {
    return api.post(`/issues/${issueId}/tags/${tagId}`);
  },

  removeTag: (issueId, tagId) => {
    return api.delete(`/issues/${issueId}/tags/${tagId}`);
  },

  getIssueTags: (issueId) => {
    return api.get(`/issues/${issueId}/tags`);
  }
};