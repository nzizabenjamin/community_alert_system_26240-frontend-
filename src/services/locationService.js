import api from './api';

export const locationService = {
  // Get all locations
  getAll: () => {
    return api.get('/locations');
  },

  // Get location by ID
  getById: (id) => {
    return api.get(`/locations/${id}`);
  },

  // Create location
  create: (locationData) => {
    return api.post('/locations', locationData);
  },

  // Update location
  update: (id, locationData) => {
    return api.put(`/locations/${id}`, locationData);
  },

  // Delete location
  delete: (id) => {
    return api.delete(`/locations/${id}`);
  }
};