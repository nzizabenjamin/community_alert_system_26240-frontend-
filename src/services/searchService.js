import api from './api';

export const searchService = {
  globalSearch: async (query) => {
    try {
      // Search across all entities
      const [issuesRes, usersRes, locationsRes, tagsRes, notificationsRes] = await Promise.allSettled([
        api.get('/issues/search', { params: { q: query } }),
        api.get('/users/search', { params: { q: query } }),
        api.get('/locations/search', { params: { q: query } }),
        api.get('/tags/search', { params: { q: query } }),
        api.get('/notifications/search', { params: { q: query } })
      ]);

      const results = {
        issues: issuesRes.status === 'fulfilled' ? (issuesRes.value.data?.content || issuesRes.value.data || []) : [],
        users: usersRes.status === 'fulfilled' ? (usersRes.value.data?.content || usersRes.value.data || []) : [],
        locations: locationsRes.status === 'fulfilled' ? (locationsRes.value.data?.content || locationsRes.value.data || []) : [],
        tags: tagsRes.status === 'fulfilled' ? (tagsRes.value.data?.content || tagsRes.value.data || []) : [],
        notifications: notificationsRes.status === 'fulfilled' ? (notificationsRes.value.data?.content || notificationsRes.value.data || []) : []
      };

      return { data: results };
    } catch (error) {
      console.error('Global search error:', error);
      // Fallback: return empty results
      return {
        data: {
          issues: [],
          users: [],
          locations: [],
          tags: [],
          notifications: []
        }
      };
    }
  }
};

