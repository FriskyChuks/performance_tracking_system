// src/components/Layout/Sidebar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderTree, 
  TrendingUp, 
  FileText, 
  Settings as SettingsIcon,
  ChevronRight,
  X,
  LogOut,
  Building2,
  Target,
  Package,
  Search,
  Calendar,
  Clock,
  Award,
  Zap,
  Users,
  Activity,
  Shield,
  Crown,
  Star,
  Bell,
  MessageSquare,
  HelpCircle,
  UserCog,
  Briefcase,
  Landmark,
  ClipboardList,
  CheckSquare,
  BarChart,
  Eye
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import mainApi from '../../services/mainApi';

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const { user, logout, userRole } = useAuth();
  // console.log('User info in Sidebar:', user);
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  // Real data states
  const [stats, setStats] = useState({
    totalInitiatives: 0,
    totalDepartments: 0,
    totalAgencies: 0,
    totalPriorityAreas: 0,
    totalDeliverables: 0,
    completionRate: 0,
    avgRating: 0,
    pendingApprovals: 0,
    pendingAssessments: 0
  });
  const [loading, setLoading] = useState(true);

  // Destructure API methods
  const { initiatives, departments, agencies, priorityAreas, deliverables } = mainApi;

  // Check if user is admin (superuser)
  const isAdmin = user?.is_superuser;

  // Build navigation based on user role
  const getNavigation = () => {
    // Base navigation for all authenticated users
    const baseNav = [
      { name: 'Overview', href: '/dashboard', icon: LayoutDashboard, gradient: 'from-blue-500 to-indigo-500', roles: ['super_admin', 'director', 'staff', 'project_admin', 'sector_expert'] },
    ];
    
    // Initiatives - visible to all except sector expert (they only assess)
    if (userRole !== 'sector_expert') {
      baseNav.push({ 
        name: 'Initiatives', 
        href: '/dashboard/initiatives', 
        icon: FolderTree, 
        gradient: 'from-green-500 to-emerald-500',
        roles: ['super_admin', 'director', 'staff', 'project_admin']
      });
    }
    
    // Management section - only for Project Admin and Super Admin
    if (user?.role === 'project_admin' || user?.role === 'super_admin') {
      baseNav.push(
        { name: 'Departments', href: '/dashboard/departments', icon: Building2, gradient: 'from-purple-500 to-violet-500', roles: ['project_admin', 'super_admin'] },
        { name: 'Agencies', href: '/dashboard/agencies', icon: Landmark, gradient: 'from-cyan-500 to-blue-500', roles: ['project_admin', 'super_admin'] },
        { name: 'Priority Areas', href: '/dashboard/priority-areas', icon: Target, gradient: 'from-orange-500 to-red-500', roles: ['project_admin', 'super_admin'] },
        { name: 'Deliverables', href: '/dashboard/deliverables', icon: Package, gradient: 'from-teal-500 to-cyan-500', roles: ['project_admin', 'super_admin'] }
      );
    }
    
    // Reports - visible to all except sector expert
    if (user?.role !== 'sector_expert') {
      baseNav.push({ 
        name: 'Reports', 
        href: '/dashboard/reports', 
        icon: FileText, 
        gradient: 'from-rose-500 to-pink-500',
        roles: ['super_admin', 'director', 'staff', 'project_admin']
      });
    }
    
    // Pending Approvals - only for Director
    if (user?.role === 'director' || user?.role === 'super_admin') {
      baseNav.push({ 
        name: 'Pending Approvals', 
        href: '/dashboard/pending-approvals', 
        icon: Clock, 
        gradient: 'from-yellow-500 to-orange-500',
        roles: ['director', 'super_admin'],
        badge: stats.pendingApprovals
      });
    }
    
    // Pending Assessments - only for Sector Expert
    if (user?.role === 'sector_expert' || user?.role === 'super_admin') {
      baseNav.push({ 
        name: 'Pending Assessments', 
        href: '/dashboard/pending-assessments', 
        icon: ClipboardList, 
        gradient: 'from-indigo-500 to-purple-500',
        roles: ['sector_expert', 'super_admin'],
        badge: stats.pendingAssessments
      });
    }
    
    // My Tasks - for Staff (initiatives they are working on)
    if (user?.role === 'staff' || user?.role === 'super_admin') {
      baseNav.push({ 
        name: 'My Tasks', 
        href: '/dashboard/my-tasks', 
        icon: CheckSquare, 
        gradient: 'from-teal-500 to-cyan-500',
        roles: ['staff', 'super_admin']
      });
    }
    
    // Add User Management for admin users
    if (isAdmin) {
      baseNav.push({ 
        name: 'User Management', 
        href: '/dashboard/admin/users', 
        icon: UserCog, 
        gradient: 'from-indigo-500 to-purple-500' 
      });
    }
    
    // Add Settings at the end for everyone
    baseNav.push({ 
      name: 'Settings', 
      href: '/dashboard/settings', 
      icon: SettingsIcon, 
      gradient: 'from-gray-600 to-gray-700' 
    });
    
    return baseNav;
  };

  const navigation = getNavigation();

  useEffect(() => {
    fetchStats();
    fetchRoleSpecificCounts();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel using the new API endpoints
      const [initiativesRes, departmentsRes, agenciesRes, priorityAreasRes, deliverablesRes] = await Promise.all([
        initiatives.list(),
        departments.list(),
        agencies.list(),
        priorityAreas.list(),
        deliverables.list()
      ]);
      
      const allInitiatives = initiativesRes.data.results || initiativesRes.data;
      const totalInitiatives = allInitiatives.length;
      const totalDepartments = departmentsRes.data.length;
      const totalAgencies = agenciesRes.data.length;
      const totalPriorityAreas = priorityAreasRes.data.length;
      const totalDeliverables = deliverablesRes.data.length;
      
      // Calculate average rating
      const ratedInitiatives = allInitiatives.filter(i => i.performance_rating);
      const avgRating = ratedInitiatives.length > 0 
        ? (ratedInitiatives.reduce((sum, i) => sum + i.performance_rating, 0) / ratedInitiatives.length).toFixed(1)
        : 0;
      
      // Calculate completion rate
      const completedInitiatives = allInitiatives.filter(i => 
        i.actual_value && i.target_value && parseFloat(i.actual_value) >= parseFloat(i.target_value)
      );
      const completionRate = totalInitiatives > 0 
        ? ((completedInitiatives.length / totalInitiatives) * 100).toFixed(0)
        : 0;
      
      setStats(prev => ({
        ...prev,
        totalInitiatives,
        totalDepartments,
        totalAgencies,
        totalPriorityAreas,
        totalDeliverables,
        completionRate,
        avgRating
      }));
      
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleSpecificCounts = async () => {
    try {
      // Fetch pending approvals count (for Director)
      if (userRole === 'director' || userRole === 'super_admin') {
        // This would call an API endpoint to get pending approvals count
        // const response = await mainApi.quarterlyProgress.getPendingApprovalsCount();
        // setStats(prev => ({ ...prev, pendingApprovals: response.data.count }));
      }
      
      // Fetch pending assessments count (for Sector Expert)
      if (userRole === 'sector_expert' || userRole === 'super_admin') {
        // const response = await mainApi.assessments.getPendingAssessmentsCount();
        // setStats(prev => ({ ...prev, pendingAssessments: response.data.count }));
      }
    } catch (error) {
      console.error('Error fetching role counts:', error);
    }
  };

  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getCurrentTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const quickInsights = [
    { 
      icon: Award, 
      label: 'Initiatives', 
      value: stats.totalInitiatives, 
      gradient: 'from-green-500 to-emerald-500', 
      bg: 'from-green-500/10 to-emerald-500/10',
      suffix: '',
      roles: ['super_admin', 'director', 'staff', 'project_admin']
    },
    { 
      icon: Building2, 
      label: 'Departments', 
      value: stats.totalDepartments, 
      gradient: 'from-blue-500 to-indigo-500', 
      bg: 'from-blue-500/10 to-indigo-500/10',
      suffix: '',
      roles: ['super_admin', 'project_admin']
    },
    { 
      icon: Landmark, 
      label: 'Agencies', 
      value: stats.totalAgencies, 
      gradient: 'from-cyan-500 to-teal-500', 
      bg: 'from-cyan-500/10 to-teal-500/10',
      suffix: '',
      roles: ['super_admin', 'project_admin']
    },
    { 
      icon: Target, 
      label: 'Priority Areas', 
      value: stats.totalPriorityAreas || 0, 
      gradient: 'from-orange-500 to-red-500', 
      bg: 'from-orange-500/10 to-red-500/10',
      suffix: '',
      roles: ['super_admin', 'project_admin']
    },
    { 
      icon: Package, 
      label: 'Deliverables', 
      value: stats.totalDeliverables || 0, 
      gradient: 'from-teal-500 to-cyan-500', 
      bg: 'from-teal-500/10 to-cyan-500/10',
      suffix: '',
      roles: ['super_admin', 'project_admin']
    },
    { 
      icon: Zap, 
      label: 'Completion', 
      value: stats.completionRate, 
      gradient: 'from-purple-500 to-violet-500', 
      bg: 'from-purple-500/10 to-violet-500/10',
      suffix: '%',
      roles: ['super_admin', 'director', 'staff', 'project_admin']
    },
    { 
      icon: Activity, 
      label: 'Avg Rating', 
      value: stats.avgRating, 
      gradient: 'from-rose-500 to-pink-500', 
      bg: 'from-rose-500/10 to-pink-500/10',
      suffix: '/5',
      roles: ['super_admin', 'director', 'staff', 'project_admin']
    }
  ];

  // Filter quick insights based on user role
  const visibleQuickInsights = quickInsights.filter(insight => 
    insight.roles.includes(userRole) || insight.roles.includes('super_admin')
  );

  // Get user role display name
  const getRoleDisplayName = () => {
    switch(userRole) {
      case 'super_admin': return 'Super Administrator';
      case 'director': return 'Director';
      case 'staff': return 'Field Staff';
      case 'project_admin': return 'Project Administrator';
      case 'sector_expert': return 'Sector Expert';
      default: return 'User';
    }
  };

  return (
    <>
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-20 lg:hidden" onClick={toggleSidebar} />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-500 ease-out z-30 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl flex flex-col`}>
        {/* Animated gradient border */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary-500/20 via-secondary-500/20 to-primary-500/20 opacity-50"></div>
        
        {/* Animated background particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-secondary-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        </div>
        
        <div className="relative z-10 flex flex-col h-full">
          {/* Premium Sidebar Header */}
          <div className="relative overflow-hidden bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -mr-20 -mt-20 animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 animate-pulse delay-700"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-white/5 to-transparent rounded-full blur-2xl"></div>
            
            <div className="relative z-10 py-3.5 px-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl shadow-xl">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-xl tracking-tight">FME | PTS</span>
                      <Crown className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />
                    </div>
                    <p className="text-white/70 text-[11px] mt-0.5">Federal Ministry of Environment</p>
                  </div>
                </div>
                <button
                  onClick={toggleSidebar}
                  className="lg:hidden text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition transform hover:scale-110"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Actions Bar Section */}
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-800/30 backdrop-blur-sm border-b border-white/10">
            <div className="py-4 px-4">
              <div className="flex items-center justify-between text-white/80 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
                  <Calendar className="w-3 h-3" />
                  <span className="text-[11px]">{getCurrentDate()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3 h-3" />
                  <span className="text-[11px]">{getCurrentTime()}</span>
                  <div className="w-1 h-1 bg-green-400 rounded-full"></div>
                  <span className="text-[10px] text-green-400">Live</span>
                </div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-4 border-b border-white/10">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 rounded-xl blur opacity-0 group-hover:opacity-100 transition duration-300"></div>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 group-hover:text-primary-400 transition" />
              <input
                type="text"
                placeholder="Search initiatives, departments..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-transparent transition group-hover:bg-white/20"
              />
            </div>
          </div>

          {/* Navigation Menu */}
          <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
            <div className="px-4 mb-3">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                <Star className="w-3 h-3" />
                MAIN MENU
              </p>
            </div>
            <nav className="px-3 space-y-1">
              {navigation.map((item) => {
                const isActive = location.pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`group relative flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-300 ${
                      isActive
                        ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-primary-500/25`
                        : 'text-gray-300 hover:bg-white/10 hover:text-white'
                    }`}
                    onClick={() => sidebarOpen && toggleSidebar()}
                  >
                    {isActive && (
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition"></div>
                    )}
                    <Icon className={`mr-3 h-4 w-4 transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white group-hover:scale-110'}`} />
                    <span className="relative z-10">{item.name}</span>
                    {item.badge > 0 && (
                      <span className="absolute right-3 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                        {item.badge}
                      </span>
                    )}
                    {isActive && (
                      <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full animate-pulse"></div>
                    )}
                  </Link>
                );
              })}
            </nav>

            {/* Quick Insights Stats - Filtered by role */}
            <div className="mt-6 px-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap className="w-3 h-3" />
                QUICK INSIGHTS
              </p>
              {loading ? (
                <div className="grid grid-cols-2 gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="bg-white/5 backdrop-blur-sm rounded-xl p-2 border border-white/10 animate-pulse">
                      <div className="w-3.5 h-3.5 bg-gray-600 rounded mb-1"></div>
                      <div className="w-8 h-4 bg-gray-600 rounded mb-1"></div>
                      <div className="w-10 h-2 bg-gray-600 rounded"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {visibleQuickInsights.map((stat, idx) => {
                    const Icon = stat.icon;
                    return (
                      <div key={idx} className={`bg-gradient-to-br ${stat.bg} backdrop-blur-sm rounded-xl p-2 border border-white/10 hover:scale-105 transition-all duration-300 group cursor-pointer`}>
                        <Icon className={`w-3.5 h-3.5 bg-gradient-to-r ${stat.gradient} bg-clip-text text-transparent mb-1 group-hover:scale-110 transition`} />
                        <p className="text-base font-bold text-white">
                          {stat.value}
                          {stat.suffix && <span className="text-xs text-gray-400 ml-0.5">{stat.suffix}</span>}
                        </p>
                        <p className="text-[10px] text-gray-400">{stat.label}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* User Profile Section */}
          <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-3 group">
              <div className="relative">
                <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full w-9 h-9 flex items-center justify-center shadow-xl group-hover:scale-110 transition duration-300">
                  <span className="text-white font-semibold text-sm">
                    {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                  </span>
                </div>
                <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate group-hover:text-primary-300 transition">
                  {user?.first_name} {user?.last_name}
                </p>
                <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
                <p className="text-[10px] text-primary-400 mt-0.5">{getRoleDisplayName()}</p>
              </div>
              <Shield className="w-3.5 h-3.5 text-primary-400 group-hover:rotate-12 transition" />
            </div>
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition group overflow-hidden relative"
            >
              <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/10 transition"></div>
              <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition relative z-10" />
              <span className="relative z-10 text-xs">Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;