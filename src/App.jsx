import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Layout } from './components/layout';
import { TestPage } from './pages/TestPage';
import { Dashboard } from './pages/Dashboard';
import { Issues } from './pages/Issues';
import { IssueDetail } from './pages/IssueDetail';
import { Users } from './pages/Users';
import { Locations } from './pages/Locations';
import { Tags } from './pages/Tags';
import { Notifications } from './pages/Notifications';
import { Login } from './pages/auth/Login';
import { SignUp } from './pages/auth/SignUp';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { ResetPassword } from './pages/auth/ResetPassword';
import { ROUTES } from './utils/constants';

// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace />;
  }

  if (adminOnly && user?.role !== 'ADMIN') {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.SIGNUP} element={<SignUp />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          
          {/* Protected Routes */}
          <Route
            path={ROUTES.DASHBOARD}
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.ISSUES}
            element={
              <ProtectedRoute>
                <Issues />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={`${ROUTES.ISSUES}/:id`}
            element={
              <ProtectedRoute>
                <IssueDetail />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.USERS}
            element={
              <ProtectedRoute adminOnly>
                <Users />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.LOCATIONS}
            element={
              <ProtectedRoute>
                <Locations />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.TAGS}
            element={
              <ProtectedRoute>
                <Tags />
              </ProtectedRoute>
            }
          />
          
          <Route
            path={ROUTES.NOTIFICATIONS}
            element={
              <ProtectedRoute>
                <Notifications />
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/test"
            element={
              <ProtectedRoute>
                <TestPage />
              </ProtectedRoute>
            }
          />
          
          <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;