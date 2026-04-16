// src/context/AuthContext.jsx
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
        
        // Try to fetch role and permissions, but don't fail if endpoint doesn't exist
        try {
          const roleResponse = await accountsApi.getUserInfo();
          if (roleResponse && roleResponse.data) {
            setUserRole(roleResponse.data.role);
            setUserPermissions(roleResponse.data.permissions || {});
          }
        } catch (roleError) {
          console.warn('Could not fetch user role info:', roleError);
          // Fallback: determine role from groups
          if (userData && userData.groups && userData.groups.length > 0) {
            setUserRole(userData.groups[0].name);
          }
        }
        
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const data = await accountsApi.login(email, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      const userData = await accountsApi.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      // Try to fetch role and permissions, but don't fail if endpoint doesn't exist
      try {
        const roleResponse = await accountsApi.getUserInfo();
        if (roleResponse && roleResponse.data) {
          setUserRole(roleResponse.data.role);
          setUserPermissions(roleResponse.data.permissions || {});
        }
      } catch (roleError) {
        console.warn('Could not fetch user role info:', roleError);
        // Fallback: determine role from groups
        if (userData && userData.groups && userData.groups.length > 0) {
          setUserRole(userData.groups[0].name);
        }
      }
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.response?.data?.detail || 'Invalid credentials');
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
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.detail ||
                          'Registration failed';
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
  
  const fetchUserGroups = async () => {
  try {
    const response = await accountsApi.getCurrentUser();
    const userGroups = response.data.groups || [];
    const userRole = userGroups.length > 0 ? userGroups[0].name : null;
    return { userGroups, userRole };
  } catch (error) {
    console.error('Error fetching user groups:', error);
    return { userGroups: [], userRole: null };
  }
};

  const canAccessDashboard = user?.can_access_dashboard || user?.is_staff || user?.is_superuser || false;
  const isPublicOnly = user?.is_public_only || false;

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
    fetchUserGroups,
    isAuthenticated: !!user,
    canAccessDashboard,
    isPublicOnly,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};