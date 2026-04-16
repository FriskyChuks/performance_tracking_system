// src/pages/Dashboard.jsx
import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Sidebar from '../components/Layout/Sidebar';
import TopNav from '../components/Layout/TopNav';
import QuickActionsBar from '../components/Layout/QuickActionsBar';
import Footer from '../components/Layout/Footer';
import DashboardHome from '../components/Dashboard/DashboardHome';
import InitiativeList from '../components/Dashboard/InitiativeList';
import InitiativeForm from '../components/Dashboard/InitiativeForm';
import InitiativeDetail from '../components/Dashboard/InitiativeDetail';
import DepartmentManagement from '../components/Management/DepartmentManagement';
import AgencyManagement from '../components/Management/AgencyManagement';
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
  const { user } = useAuth();
  const userRole = user?.role;

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const handleExport = () => {
    console.log('Export triggered');
  };

  const handleFilter = () => {
    setFilterOpen(!filterOpen);
    console.log('Filter panel toggled');
  };

  // Role-based access checks
  const canViewManagement = userRole === 'project_admin' || userRole === 'super_admin';
  const canViewReports = userRole !== 'sector_expert';
  const canViewInitiatives = true; // All authenticated users can view initiatives
  const canCreateInitiative = userRole === 'project_admin' || userRole === 'super_admin';
  const canViewMyTasks = userRole === 'staff' || userRole === 'super_admin';
  const canViewPendingApprovals = userRole === 'director' || userRole === 'super_admin';
  const canViewPendingAssessments = userRole === 'sector_expert' || userRole === 'super_admin';
  const isSuperAdmin = user?.is_superuser;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40">
      {/* Animated Background Pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-200/30 to-secondary-200/30 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200/30 to-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-200/20 to-teal-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sidebar Component */}
      <Sidebar sidebarOpen={sidebarOpen} toggleSidebar={toggleSidebar} isAdmin={isSuperAdmin} />

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
            {/* Overview - Everyone */}
            <Route path="/" element={<DashboardHome />} />
            
            {/* Initiatives - Everyone can view, but only some can create/edit */}
            {canViewInitiatives && (
              <>
                <Route path="/initiatives" element={<InitiativeList viewMode={viewMode} setViewMode={setViewMode} />} />
                <Route path="/initiatives/:id" element={<InitiativeDetail />} />
                {/* Create and Edit routes - only for Project Admin and Super Admin */}
                {canCreateInitiative && (
                  <>
                    <Route path="/initiatives/new" element={<InitiativeForm />} />
                    <Route path="/initiatives/:id/edit" element={<InitiativeForm />} />
                  </>
                )}
              </>
            )}
            
            {/* Management Routes - Only for Project Admin and Super Admin */}
            {canViewManagement && (
              <>
                <Route path="/departments" element={<DepartmentManagement />} />
                <Route path="/agencies" element={<AgencyManagement />} />
                <Route path="/priority-areas" element={<PriorityAreaManagement />} />
                <Route path="/deliverables" element={<DeliverableManagement />} />
              </>
            )}
            
            {/* Reports - Everyone except Sector Expert */}
            {canViewReports && (
              <Route path="/reports" element={<Reports />} />
            )}
            
            {/* Settings - Everyone */}
            <Route path="/settings" element={<Settings />} />
            
            {/* My Tasks - Only for Staff */}
            {canViewMyTasks && (
              <Route path="/my-tasks" element={<MyTasks />} />
            )}
            
            {/* Pending Approvals - Only for Director */}
            {canViewPendingApprovals && (
              <Route path="/pending-approvals" element={<PendingApprovals />} />
            )}
            
            {/* Pending Assessments - Only for Sector Expert */}
            {canViewPendingAssessments && (
              <Route path="/pending-assessments" element={<PendingAssessments />} />
            )}
            
            {/* Admin only routes - Super Admin only */}
            {isSuperAdmin && (
              <Route path="/admin/users" element={<UserManagement />} />
            )}
            
            {/* Catch all */}
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