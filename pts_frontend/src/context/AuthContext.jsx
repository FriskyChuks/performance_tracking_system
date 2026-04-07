// src/context/AuthContext.jsx
import React, { useState, useEffect, createContext } from 'react';
import { auth } from '../services/api';
import toast from 'react-hot-toast';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = localStorage.getItem('access_token');
    if (token) {
      try {
        const userData = await auth.getCurrentUser();
        setUser(userData);
        localStorage.setItem('user_data', JSON.stringify(userData));
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
      const data = await auth.login(email, password);
      localStorage.setItem('access_token', data.access);
      localStorage.setItem('refresh_token', data.refresh);
      
      // Fetch user data immediately after login
      const userData = await auth.getCurrentUser();
      setUser(userData);
      localStorage.setItem('user_data', JSON.stringify(userData));
      
      toast.success('Login successful!');
      return true;
    } catch (error) {
      console.error('Login error:', error);
      const errorMessage = error.response?.data?.detail || 'Invalid credentials';
      toast.error(errorMessage);
      return false;
    }
  };

  const register = async (userData) => {
    try {
      await auth.register(userData);
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
    auth.logout();
    setUser(null);
    localStorage.removeItem('user_data');
    sessionStorage.removeItem('user_data');
    toast.success('Logged out successfully');
  };

  const updateUser = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    localStorage.setItem('user_data', JSON.stringify(newUser));
  };

  // Determine if user can access dashboard
  const canAccessDashboard = user?.can_access_dashboard || user?.is_staff || user?.is_superuser || false;
  
  // Determine if user is public only
  const isPublicOnly = user?.is_public_only || false;

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user,
    canAccessDashboard,
    isPublicOnly,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};