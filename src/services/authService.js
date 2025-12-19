import api from './api';

export const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Check if 2FA is required
      if (response.data.requiresOTP) {
        return {
          data: {
            requiresOTP: true,
            tempToken: response.data.tempToken,
            email: email,
            otp: response.data.otp // Backend may include OTP for development/testing
          }
        };
      }
      
      // Normal login - store token and user
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { data: response.data.user };
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  verifyOTP: async (tempToken, otpCode) => {
    try {
      const response = await api.post('/auth/verify-otp', { tempToken, otpCode });
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { data: response.data.user };
    } catch (error) {
      console.error('OTP verification error:', error);
      throw error;
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post('/auth/signup', userData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      return { data: response.data.user };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', { token, newPassword });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
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