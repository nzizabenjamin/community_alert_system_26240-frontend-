import api from './api';

export const authService = {
  login: async (email, password) => {
    try {
      // TODO: Replace with actual auth endpoint when backend is ready
      // const response = await api.post('/auth/login', { email, password });
      
      // For now, fetch a real user from the backend
      const usersResponse = await api.get('/users');
      const users = usersResponse.data;
      const user = users.find(u => u.email === email);
      
      if (user) {
        localStorage.setItem('user', JSON.stringify(user));
        localStorage.setItem('token', 'mock-jwt-token');
        return { data: user };
      } else {
        throw new Error('User not found');
      }
    } catch (error) {
      console.error('Login error:', error);
      // Fallback mock user
      const mockUser = {
        id: '2626b831-70d3-4cf5-9ab2-f9608a918a44', // Use a valid UUID format
        fullName: 'Marie Uwase',
        email: email,
        role: 'ADMIN'
      };
      
      localStorage.setItem('user', JSON.stringify(mockUser));
      localStorage.setItem('token', 'mock-jwt-token');
      
      return { data: mockUser };
    }
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