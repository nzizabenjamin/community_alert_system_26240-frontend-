import api from './api';

export const tagService = {
  // Get all tags (role-based: ADMIN sees all, RESIDENT sees only active)
  getAll: (page = 0, size = 10, sortBy = 'name', sortDir = 'ASC') => {
    return api.get('/tags', {
      params: { page, size, sortBy, sortDir }
    });
  },

  // Get active tags only (for residents to select when creating issues)
  getActive: () => {
    return api.get('/tags/active');
  },

  // Get tag by ID
  getById: (id) => {
    return api.get(`/tags/${id}`);
  },

  // Create tag (ADMIN only)
  create: (tagData) => {
    return api.post('/tags', tagData);
  },

  // Update tag (ADMIN only)
  update: (id, tagData) => {
    return api.put(`/tags/${id}`, tagData);
  },

  // Activate tag (ADMIN only)
  activate: (id) => {
    return api.put(`/tags/${id}/activate`);
  },

  // Deactivate tag (ADMIN only - soft delete)
  deactivate: (id) => {
    return api.put(`/tags/${id}/deactivate`);
  },

  // Delete tag permanently (ADMIN only - removes from all issues)
  delete: (id) => {
    return api.delete(`/tags/${id}`);
  },

  // Search tags by name
  searchByName: (name) => {
    return api.get('/tags/search', {
      params: { name }
    });
  },

  // Get used tags
  getUsedTags: () => {
    return api.get('/tags/used');
  },

  // Get unused tags
  getUnusedTags: () => {
    return api.get('/tags/unused');
  }
};