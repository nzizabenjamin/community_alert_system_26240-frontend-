import api from './api';

export const issueService = {
  // Get all issues with pagination
  getAll: (page = 0, size = 10, sort = 'dateReported', direction = 'DESC') => {
    return api.get('/issues', {
      params: { 
        page, 
        size, 
        sort, 
        direction
      }
    });
  },

  // Get issue by ID
  getById: (id) => {
    return api.get(`/issues/${id}`);
  },

  // Create new issue
  create: (issueData) => {
    return api.post('/issues', issueData);
  },

  // Update issue
  update: (id, issueData) => {
    return api.put(`/issues/${id}`, issueData);
  },

  // Update issue status
  updateStatus: (id, status) => {
    return api.put(`/issues/${id}/status`, null, {
      params: { status }
    });
  },

  // Delete issue
  delete: (id) => {
    return api.delete(`/issues/${id}`);
  },

  // Add tag to issue
  addTag: (issueId, tagId) => {
    return api.post(`/issues/${issueId}/tags/${tagId}`);
  },

  // Remove tag from issue
  removeTag: (issueId, tagId) => {
    return api.delete(`/issues/${issueId}/tags/${tagId}`);
  },

  // Get issue tags
  getIssueTags: (issueId) => {
    return api.get(`/issues/${issueId}/tags`);
  }
};