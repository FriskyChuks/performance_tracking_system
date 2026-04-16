// src/components/RoleBased/RoleGuard.jsx
import React from 'react';
import { useAuth } from '../../hooks/useAuth';

export const RoleGuard = ({ children, allowedRoles, fallback = null }) => {
  const { userRole } = useAuth();
  
  if (!allowedRoles.includes(userRole)) {
    return fallback;
  }
  
  return children;
};

export const PermissionGuard = ({ children, requiredPermission, fallback = null }) => {
  const { userPermissions } = useAuth();
  
  if (!userPermissions[requiredPermission]) {
    return fallback;
  }
  
  return children;
};