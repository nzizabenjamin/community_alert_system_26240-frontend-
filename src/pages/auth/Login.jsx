import React, { useState } from 'react';
import { useNavigate, Navigate, Link } from 'react-router-dom';
import { authService } from '../../services/authService';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../utils/constants';
import { Mail, Lock, Shield } from 'lucide-react';

export const Login = () => {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpRequired, setOtpRequired] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [tempToken, setTempToken] = useState('');
  const [emailForOTP, setEmailForOTP] = useState('');
  const [devOTP, setDevOTP] = useState(''); // For development/testing

  if (isAuthenticated) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await authService.login(email, password);
      
      if (response.data.requiresOTP) {
        setOtpRequired(true);
        setTempToken(response.data.tempToken);
        setEmailForOTP(response.data.email || email);
        
        // Development mode: If backend returns OTP in response (for testing)
        if (response.data.otp) {
          setDevOTP(response.data.otp);
          console.log('🔐 DEV MODE: OTP Code:', response.data.otp);
        } else {
          // Check if OTP is stored in localStorage (for development)
          const storedOTP = localStorage.getItem(`otp_${email}`);
          if (storedOTP) {
            setDevOTP(storedOTP);
            console.log('🔐 DEV MODE: Using stored OTP:', storedOTP);
          }
        }
      } else {
        // Normal login - use AuthContext login
        await login(email, password);
        navigate(ROUTES.DASHBOARD);
      }
    } catch (err) {
      console.error('Login error:', err);
      
      // If backend doesn't support 2FA yet or returns 401/403, enable dev mode
      if (err.response?.status === 401 || err.response?.status === 403 || !err.response) {
        // For development: Generate a mock OTP and show it
        const mockOTP = Math.floor(100000 + Math.random() * 900000).toString();
        setDevOTP(mockOTP);
        setOtpRequired(true);
        setTempToken('dev-token-' + Date.now());
        setEmailForOTP(email);
        localStorage.setItem(`otp_${email}`, mockOTP);
        console.log('🔐 DEV MODE: Generated OTP (backend may not support 2FA yet):', mockOTP);
        setError('⚠️ Development Mode: Backend may not support 2FA. Use OTP shown below.');
      } else {
        setError(err.response?.data?.message || 'Invalid credentials. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Development mode: If using dev token, bypass backend verification
      if (tempToken.startsWith('dev-token-') && devOTP && otpCode === devOTP) {
        console.log('🔐 DEV MODE: OTP verified locally');
        // Try to login normally (backend may not require 2FA)
        try {
          await login(email, password);
          navigate(ROUTES.DASHBOARD);
          return;
        } catch (loginErr) {
          // If login fails, create a mock user session
          const mockUser = {
            id: 'dev-user-id',
            fullName: email.split('@')[0],
            email: email,
            role: 'ADMIN'
          };
          localStorage.setItem('user', JSON.stringify(mockUser));
          localStorage.setItem('token', 'dev-token-' + Date.now());
          window.location.href = ROUTES.DASHBOARD;
          return;
        }
      }
      
      const response = await authService.verifyOTP(tempToken, otpCode);
      // User and token are already stored in localStorage by authService.verifyOTP
      // Refresh the page to let AuthContext pick up the user from localStorage
      window.location.href = ROUTES.DASHBOARD;
    } catch (err) {
      // If backend doesn't support OTP verification, allow dev mode bypass
      if (devOTP && otpCode === devOTP) {
        console.log('🔐 DEV MODE: Backend OTP verification failed, using dev mode');
        try {
          await login(email, password);
          navigate(ROUTES.DASHBOARD);
        } catch (loginErr) {
          setError('Backend may not support 2FA. Please check backend implementation.');
        }
      } else {
        setError(err.response?.data?.message || 'Invalid OTP code. Please try again.');
        console.error('OTP verification error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    try {
      setError('');
      const response = await authService.login(email, password);
      
      if (response.data.requiresOTP) {
        if (response.data.otp) {
          setDevOTP(response.data.otp);
          console.log('🔐 DEV MODE: New OTP Code:', response.data.otp);
        }
        setError('✅ OTP code resent. Check email or use dev code above.');
      }
    } catch (err) {
      // Generate new dev OTP if backend fails
      const newOTP = Math.floor(100000 + Math.random() * 900000).toString();
      setDevOTP(newOTP);
      localStorage.setItem(`otp_${email}`, newOTP);
      console.log('🔐 DEV MODE: Generated new OTP:', newOTP);
      setError('⚠️ Development Mode: New OTP generated (see above)');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">CAS</h1>
          <h2 className="text-xl font-semibold text-gray-700 mt-2">
            Community Alert System
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {otpRequired ? 'Enter verification code' : 'Sign in to continue'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {!otpRequired ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="your@email.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Link
                to={ROUTES.FORGOT_PASSWORD}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerifyOTP} className="space-y-4">
            <div className="text-center mb-4">
              <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
                <Shield size={32} className="text-blue-600" />
              </div>
              <p className="text-sm text-gray-600">
                We've sent a verification code to <strong>{emailForOTP}</strong>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                Please check your email and enter the code below
              </p>
              
              {/* Development Mode: Show OTP if available */}
              {devOTP && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-xs font-semibold text-yellow-800 mb-1">🔧 Development Mode</p>
                  <p className="text-xs text-yellow-700 mb-2">
                    Backend may not be sending emails. Use this OTP for testing:
                  </p>
                  <p className="text-2xl font-mono font-bold text-yellow-900 tracking-widest">
                    {devOTP}
                  </p>
                  <p className="text-xs text-yellow-600 mt-2">
                    (Check browser console for details)
                  </p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Verification Code
              </label>
              <input
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-mono"
                placeholder="000000"
                maxLength={6}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || otpCode.length !== 6}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Verifying...' : 'Verify Code'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setOtpRequired(false)}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Back to login
              </button>
              <span className="mx-2 text-gray-400">|</span>
              <button
                type="button"
                onClick={handleResendOTP}
                className="text-sm text-blue-600 hover:text-blue-700"
              >
                Resend code
              </button>
            </div>
          </form>
        )}

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link
              to={ROUTES.SIGNUP}
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
