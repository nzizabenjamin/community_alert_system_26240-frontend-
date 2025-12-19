import api from './api';

export const notificationService = {
  getAll: (page = 0, size = 10, sortBy = 'sentAt', sortDir = 'DESC') => {
    return api.get('/notifications', {
      params: { page, size, sortBy, sortDir }
    });
  },
  getById: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
  delete: (id) => api.delete(`/notifications/${id}`)
};