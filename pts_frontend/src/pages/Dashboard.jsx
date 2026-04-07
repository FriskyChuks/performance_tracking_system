// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import TopNav from '../components/Layout/TopNav';
import QuickActionsBar from '../components/Layout/QuickActionsBar';
import Footer from '../components/Layout/Footer';
import DashboardHome from '../components/Dashboard/DashboardHome';
import ProjectList from '../components/Dashboard/ProjectList';
import ProjectForm from '../components/Dashboard/ProjectForm';
import ProjectDetail from '../components/Dashboard/ProjectDetail';
import MinistryManagement from '../components/Management/MinistryManagement';
import PriorityAreaManagement from '../components/Management/PriorityAreaManagement';
import DeliverableManagement from '../components/Management/DeliverableManagement';
import Reports from './Reports';
import Settings from './Settings';
import UserManagement from '../components/Admin/UserManagement';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const { user } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleExport = () => {
    console.log('Export triggered');
    // Implement export logic
  };

  const handleFilter = () => {
    setFilterOpen(!filterOpen);
    console.log('Filter panel toggled');
  };

  // Check if user has admin access
  const isAdmin = user?.is_superuser || user?.is_staff;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-200/30 to-secondary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} isAdmin={isAdmin} />

      {/* Main content area */}
      <div className="flex-1 lg:pl-80 flex flex-col">
        {/* Top Navigation */}
        <TopNav toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Quick Actions Bar - Below TopNav */}
        <QuickActionsBar 
          viewMode={viewMode}
          setViewMode={setViewMode}
          onExport={handleExport}
          onFilter={handleFilter}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            <Route path="/projects" element={<ProjectList viewMode={viewMode} setViewMode={setViewMode} />} />
            <Route path="/projects/new" element={<ProjectForm />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/projects/:id/edit" element={<ProjectForm />} />
            <Route path="/ministries" element={<MinistryManagement />} />
            <Route path="/priority-areas" element={<PriorityAreaManagement />} />
            <Route path="/deliverables" element={<DeliverableManagement />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            {/* Admin only routes */}
            {isAdmin && (
              <Route path="/admin/users" element={<UserManagement />} />
            )}
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
};

export default Dashboard;