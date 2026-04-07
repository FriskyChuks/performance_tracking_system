// src/components/Auth/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children, requireAdmin = false }) => {
  const { isAuthenticated, loading, user, canAccessDashboard } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has dashboard access
  if (!canAccessDashboard) {
    // Redirect public users to the public portal
    return <Navigate to="/public" replace />;
  }

  // Check admin requirement if needed
  if (requireAdmin && !user?.is_staff && !user?.is_superuser) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;