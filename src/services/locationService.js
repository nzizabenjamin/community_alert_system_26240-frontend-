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
  },

  // Rwanda Locations hierarchy methods
  getProvinces: () => api.get('/locations/provinces'),
  
  getDistricts: (provinceCode) => {
    const params = provinceCode ? { provinceCode } : {};
    return api.get('/locations/districts', { params });
  },
  
  getSectors: (districtCode) => {
    const params = districtCode ? { districtCode } : {};
    return api.get('/locations/sectors', { params });
  },
  
  getCells: (sectorCode) => {
    const params = sectorCode ? { sectorCode } : {};
    return api.get('/locations/cells', { params });
  },
  
  getVillages: (cellCode) => {
    const params = cellCode ? { cellCode } : {};
    return api.get('/locations/villages', { params });
  },
  
  getLocationByVillageCode: (villageCode) => 
    api.get(`/locations/village/${villageCode}`),
  
  searchRwandaLocations: (query, level = 'all') => 
    api.get('/locations/rwanda/search', { params: { q: query, level } }),
  
  getLocationStats: () => api.get('/locations/stats')
};