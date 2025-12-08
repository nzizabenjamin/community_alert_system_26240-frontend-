import api from './api';

export const tagService = {
  // Get all tags
  getAll: () => {
    return api.get('/tags');
  },

  // Get tag by ID
  getById: (id) => {
    return api.get(`/tags/${id}`);
  },

  // Create tag
  create: (tagData) => {
    return api.post('/tags', tagData);
  },

  // Update tag
  update: (id, tagData) => {
    return api.put(`/tags/${id}`, tagData);
  },

  // Delete tag
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