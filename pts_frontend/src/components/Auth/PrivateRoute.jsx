// src/components/Auth/PrivateRoute.jsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const PrivateRoute = ({ children, requiredRole = null, allowedRoles = [] }) => {
  const { isAuthenticated, loading, userRole, canAccessDashboard } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
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

  // Check for specific role requirement
  if (requiredRole && userRole !== requiredRole) {
    return <Navigate to="/dashboard" replace />;
  }

  // Check for allowed roles (if provided)
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PrivateRoute;