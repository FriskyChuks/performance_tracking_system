// src/App.jsx
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import IdleTimer from './components/Common/IdleTimer';
import LandingPage from './pages/LandingPage';
import Dashboard from './pages/Dashboard';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import PrivateRoute from './components/Auth/PrivateRoute';

// Public Engagement Components
import PublicLayout from './components/Public/PublicLayout';
import PublicProjectList from './components/Public/PublicProjectList';
import PublicProjectDetail from './components/Public/PublicProjectDetail';

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <>
      {/* Global Idle Timer - Works for all authenticated routes */}
      <IdleTimer idleTime={15 * 60 * 1000} countdownTime={60 * 1000} />
      
      <Routes>
        {/* Main Landing Route */}
        <Route path="/" element={<LandingPage />} />
        
        {/* Public Engagement Portal Routes */}
        <Route path="/public" element={<PublicLayout />}>
          <Route index element={<PublicProjectList />} />
          <Route path="projects" element={<PublicProjectList />} />
          <Route path="projects/:id" element={<PublicProjectDetail />} />
        </Route>
        
        {/* Auth Routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Dashboard Routes - All dashboard users */}
        <Route
          path="/dashboard/*"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        
        {/* Role-specific route examples (commented for reference) */}
        {/* 
        // Project Admin only routes
        <Route
          path="/dashboard/admin/*"
          element={
            <PrivateRoute requiredRole="project_admin">
              <UserManagement />
            </PrivateRoute>
          }
        />
        
        // Delivery Officer only routes
        <Route
          path="/dashboard/my-tasks"
          element={
            <PrivateRoute requiredRole="delivery_officer">
              <MyTasks />
            </PrivateRoute>
          }
        />
        
        // Director only routes
        <Route
          path="/dashboard/pending-approvals"
          element={
            <PrivateRoute requiredRole="director">
              <PendingApprovals />
            </PrivateRoute>
          }
        />
        
        // Sector Expert only routes
        <Route
          path="/dashboard/pending-assessments"
          element={
            <PrivateRoute requiredRole="sector_expert">
              <PendingAssessments />
            </PrivateRoute>
          }
        />
        
        // Routes accessible by multiple roles
        <Route
          path="/dashboard/reports"
          element={
            <PrivateRoute allowedRoles={['project_admin', 'director', 'sector_expert']}>
              <Reports />
            </PrivateRoute>
          }
        />
        */}
        
        {/* 404 Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              theme: {
                primary: 'green',
                secondary: 'black',
              },
            },
          }}
        />
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;