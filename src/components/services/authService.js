import api from './api';

export const authService = {
  login: async (email, password) => {
    // TODO: Replace with actual auth endpoint when backend is ready
    // const response = await api.post('/auth/login', { email, password });
    
    // Temporary mock for development
    const mockUser = {
      id: '123',
      fullName: 'John Doe',
      email: email,
      role: 'ADMIN',
      locationId: 'loc-123'
    };
    
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'mock-jwt-token');
    
    return { data: mockUser };
  },

  logout: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  }
};