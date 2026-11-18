// context/AuthContext.jsx
import React, { useState, useEffect, createContext } from 'react';
import accountsApi from '../services/accountsApi';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await accountsApi.getCurrentUser();
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
        
        // Set role from user data
        if (userData && userData.role) {
          console.log('User role from API:', userData.role); // Debug log
          setUserRole(userData.role);
        } else {
          console.log('No role found in user data:', userData);
        }
        
        // Set permissions based on role
        setUserPermissions(getPermissionsForRole(userData.role));
        
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  };

  // Helper to get permissions based on role
  const getPermissionsForRole = (role) => {
    const permissions = {
      project_admin: {
        canCreateActivity: true,
        canEditActivity: true,
        canDeleteActivity: true,
        canViewAllReports: true,
        canManageUsers: true,  // Changed to true for project_admin
      },
      delivery_officer: {
        canUpdateProgress: true,
        canUploadImages: true,
        canViewAssignedActivities: true,
        canSubmitForApproval: true,
      },
      director: {
        canApproveProgress: true,
        canViewAllReports: true,
        canRejectProgress: true,
      },
      sector_expert: {
        canAssessProgress: true,
        canViewAssessments: true,
        canProvideRatings: true,
      },
      public_user: {
        canViewPublic: true,
        canComment: true,
        canFollow: true,
      },
    };
    return permissions[role] || permissions.public_user;
  };

  const login = async (email, password) => {
    try {
      const data = await accountsApi.login(email, password);
      console.log('Login response:', data); // Debug log
      
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      const userData = data.user;
      console.log('User data from login:', userData); // Debug log
      console.log('User role:', userData?.role); // Debug log
      
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      if (userData && userData.role) {
        setUserRole(userData.role);
        setUserPermissions(getPermissionsForRole(userData.role));
      }
      
      toast.success(`Welcome back, ${userData.first_name || userData.email}!`);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.error || 'Invalid credentials');
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await accountsApi.register(userData);
      toast.success('Registration successful! Please login.');
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      const errorMessage = error.response?.data?.error || 'Registration failed';
      toast.error(errorMessage);
      return false;
    }
  };

  const logout = () => {
    accountsApi.logout();
    setUser(null);
    setUserRole(null);
    setUserPermissions({});
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  const refreshUser = async () => {
    try {
      const userData = await accountsApi.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      return userData;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return null;
    }
  };

  // FIXED: This should return a boolean directly, not a function
  const canAccessDashboard = userRole && userRole !== 'public_user';

  const isPublicOnly = userRole === 'public_user' || !userRole;

  const value = {
    user,
    userRole,
    userPermissions,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshUser,
    isAuthenticated: !!user,
    canAccessDashboard,
    isPublicOnly,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};