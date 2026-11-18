// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import TopNav from '../components/Layout/TopNav';
import QuickActionsBar from '../components/Layout/QuickActionsBar';
import Footer from '../components/Layout/Footer';
import DashboardHome from '../components/Dashboard/DashboardHome';
import ActivityList from '../components/Dashboard/ActivityList';
import ActivityForm from '../components/Dashboard/ActivityForm';
import ActivityDetail from '../components/Dashboard/ActivityDetail';
import DepartmentManagement from '../components/Management/DepartmentManagement';
import AgencyManagement from '../components/Management/AgencyManagement';
import IndicatorManagement from '../components/Management/IndicatorManagement';
import PriorityAreaManagement from '../components/Management/PriorityAreaManagement';
import DeliverableManagement from '../components/Management/DeliverableManagement';
import Reports from './Reports';
import Settings from './Settings';
import UserManagement from '../components/Admin/UserManagement';
import MyTasks from '../components/Dashboard/MyTasks';
import PendingApprovals from '../components/Dashboard/PendingApprovals';
import PendingAssessments from '../components/Dashboard/PendingAssessments';
import { useAuth } from '../hooks/useAuth';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [filterOpen, setFilterOpen] = useState(false);
  const { user, userRole } = useAuth();

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleExport = () => {
    console.log('Export triggered');
  };

  const handleFilter = () => {
    setFilterOpen(!filterOpen);
    console.log('Filter panel toggled');
  };

  // Role-based access checks
  const isAdmin = user?.is_superuser === true || userRole === 'super_admin';
  const canViewManagement = userRole === 'project_admin' || isAdmin;
  const canViewUserManagement = isAdmin;
  const canCreateActivity = userRole === 'project_admin' || isAdmin;
  const canViewMyTasks = userRole === 'delivery_officer';
  const canViewPendingApprovals = userRole === 'director';
  const canViewPendingAssessments = userRole === 'sector_expert';
  const canViewActivities = userRole === 'project_admin' || userRole === 'director' || isAdmin;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-green-50/30 to-emerald-50/40">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-green-200/30 to-emerald-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-cyan-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} />

      {/* Main content area */}
      <div className="flex-1 lg:pl-80 flex flex-col">
        {/* Top Navigation */}
        <TopNav toggleSidebar={toggleSidebar} sidebarOpen={sidebarOpen} />

        {/* Quick Actions Bar - Below TopNav */}
        <QuickActionsBar
          viewMode={viewMode}
          setViewMode={setViewMode}
          onFilter={handleFilter}
        />

        {/* Page Content */}
        <main className="flex-1 p-4 lg:p-6">
          <Routes>
            <Route path="/" element={<DashboardHome />} />
            
            {/* Activities - READ ONLY for Sector Expert */}
            {userRole === 'sector_expert' && (
              <>
                <Route path="/activities" element={<ActivityList />} />
                <Route path="/activities/:id" element={<ActivityDetail />} />
              </>
            )}
            
            {/* Activities - FULL ACCESS for Project Admin and Director */}
            {(userRole === 'project_admin' || userRole === 'director') && (
              <>
                <Route path="/activities" element={<ActivityList />} />
                <Route path="/activities/new" element={<ActivityForm />} />
                <Route path="/activities/:id" element={<ActivityDetail />} />
                <Route path="/activities/:id/edit" element={<ActivityForm />} />
              </>
            )}
            
            {/* Delivery Officer routes */}
            {userRole === 'delivery_officer' && (
              <>
                <Route path="/my-tasks" element={<MyTasks />} />
                <Route path="/activities/:id" element={<ActivityDetail />} />
              </>
            )}
            
            {/* Director routes */}
            {userRole === 'director' && (
              <Route path="/pending-approvals" element={<PendingApprovals />} />
            )}
            
            {/* Sector Expert routes */}
            {userRole === 'sector_expert' && (
              <Route path="/pending-assessments" element={<PendingAssessments />} />
            )}
            
            {/* Management - Project Admin only */}
            {userRole === 'project_admin' && (
              <>
                <Route path="/departments" element={<DepartmentManagement />} />
                <Route path="/agencies" element={<AgencyManagement />} />
                <Route path="/priority-areas" element={<PriorityAreaManagement />} />
                <Route path="/deliverables" element={<DeliverableManagement />} />
                <Route path="/indicators" element={<IndicatorManagement />} />
              </>
            )}
            
            {/* User Management - Admin only */}
            {(user?.is_superuser || userRole === 'super_admin') && (
              <Route path="/admin/users" element={<UserManagement />} />
            )}
            
            {/* Common routes for all */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
            
            {/* Redirect to dashboard on unknown routes */}
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