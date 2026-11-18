// src/components/Layout/Sidebar.jsx - Fixed
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  FolderTree, 
  TrendingUp, 
  FileText, 
  Settings as SettingsIcon,
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
  Activity,
  Shield,
  Crown,
  Star,
  UserCog,
  Landmark,
  ClipboardList,
  CheckSquare,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import mainApi from '../../services/mainApi';

const Sidebar = ({ sidebarOpen, toggleSidebar }) => {
  const { user, userRole, logout } = useAuth();
  const location = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  
  const [stats, setStats] = useState({
    totalActivities: 0,
    totalDepartments: 0,
    totalAgencies: 0,
    totalPriorityAreas: 0,
    totalDeliverables: 0,
    totalIndicators: 0,
    pendingApprovals: 0,
    pendingAssessments: 0,
    myTasks: 0
  });
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.is_superuser === true || userRole === 'super_admin';

  // Build navigation
  const navigation = [];

  navigation.push({ name: 'Overview', href: '/dashboard', icon: LayoutDashboard, gradient: 'from-blue-500 to-indigo-500' });

  if (userRole === 'project_admin' || userRole === 'director' || isAdmin) {
    navigation.push({ name: 'Activities', href: '/dashboard/activities', icon: FolderTree, gradient: 'from-green-500 to-emerald-500' });
  }

  if (userRole === 'delivery_officer') {
    navigation.push({ name: 'My Tasks', href: '/dashboard/my-tasks', icon: CheckSquare, gradient: 'from-yellow-500 to-orange-500', badge: stats.myTasks });
  }

  if (userRole === 'director') {
    navigation.push({ name: 'Pending Approvals', href: '/dashboard/pending-approvals', icon: Clock, gradient: 'from-purple-500 to-pink-500', badge: stats.pendingApprovals });
  }

  if (userRole === 'sector_expert') {
    navigation.push({ name: 'Pending Assessments', href: '/dashboard/pending-assessments', icon: ClipboardList, gradient: 'from-indigo-500 to-purple-500', badge: stats.pendingAssessments });
  }

  if (userRole === 'project_admin' || isAdmin) {
    navigation.push({ name: 'Departments', href: '/dashboard/departments', icon: Building2, gradient: 'from-purple-500 to-violet-500' });
    navigation.push({ name: 'Agencies', href: '/dashboard/agencies', icon: Landmark, gradient: 'from-cyan-500 to-blue-500' });
    navigation.push({ name: 'Priority Areas', href: '/dashboard/priority-areas', icon: Target, gradient: 'from-orange-500 to-red-500' });
    navigation.push({ name: 'Deliverables', href: '/dashboard/deliverables', icon: Package, gradient: 'from-teal-500 to-cyan-500' });
    navigation.push({ name: 'Indicators', href: '/dashboard/indicators', icon: Activity, gradient: 'from-rose-500 to-pink-500' });
  }

  if (isAdmin) {
    navigation.push({ name: 'User Management', href: '/dashboard/admin/users', icon: UserCog, gradient: 'from-indigo-500 to-purple-500' });
  }

  navigation.push({ name: 'Reports', href: '/dashboard/reports', icon: BarChart3, gradient: 'from-rose-500 to-pink-500' });
  navigation.push({ name: 'Settings', href: '/dashboard/settings', icon: SettingsIcon, gradient: 'from-gray-600 to-gray-700' });

  useEffect(() => {
    fetchStats();
    fetchRoleSpecificCounts();
  }, [userRole]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Use public endpoints for counts (safe for all)
      const [departments, agencies, priorityAreas, deliverables, indicators] = await Promise.all([
        mainApi.getPublicDepartments().catch(() => []),
        mainApi.getPublicAgencies().catch(() => []),
        mainApi.getPublicPriorityAreas().catch(() => []),
        mainApi.getPublicDeliverables().catch(() => []),
        mainApi.getPublicIndicators().catch(() => [])
      ]);
      
      // Use public activities for all roles - NO 403 ERROR
      let activities = [];
      try {
        const response = await mainApi.getPublicActivities();
        activities = response?.results || response || [];
      } catch (error) {
        console.error('Error fetching activities for sidebar:', error);
        activities = [];
      }
      
      setStats(prev => ({
        ...prev,
        totalActivities: activities.length,
        totalDepartments: departments?.length || 0,
        totalAgencies: agencies?.length || 0,
        totalPriorityAreas: priorityAreas?.length || 0,
        totalDeliverables: deliverables?.length || 0,
        totalIndicators: indicators?.length || 0
      }));
      
    } catch (error) {
      console.error('Error fetching sidebar stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRoleSpecificCounts = async () => {
    try {
      if (userRole === 'delivery_officer') {
        const myTasks = await mainApi.getMyProgressList().catch(() => []);
        const tasksArray = Array.isArray(myTasks) ? myTasks : (myTasks?.results || []);
        setStats(prev => ({ ...prev, myTasks: tasksArray.filter(t => t.status === 'draft').length }));
      }
      
      if (userRole === 'director') {
        const pending = await mainApi.getPendingApprovals().catch(() => []);
        setStats(prev => ({ ...prev, pendingApprovals: pending?.length || 0 }));
      }
      
      if (userRole === 'sector_expert') {
        const pending = await mainApi.getPendingAssessments().catch(() => []);
        setStats(prev => ({ ...prev, pendingAssessments: pending?.length || 0 }));
      }
    } catch (error) {
      console.error('Error fetching role counts:', error);
    }
  };

  const getCurrentDate = () => new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const getCurrentTime = () => new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

  const getRoleDisplayName = () => {
    if (isAdmin) return 'Super Administrator';
    switch(userRole) {
      case 'project_admin': return 'Project Administrator';
      case 'delivery_officer': return 'Delivery Officer';
      case 'director': return 'Director';
      case 'sector_expert': return 'Sector Expert';
      default: return 'User';
    }
  };

  const getRoleColor = () => {
    if (isAdmin) return 'from-purple-500 to-pink-500';
    switch(userRole) {
      case 'project_admin': return 'from-blue-500 to-indigo-500';
      case 'delivery_officer': return 'from-green-500 to-emerald-500';
      case 'director': return 'from-purple-500 to-pink-500';
      case 'sector_expert': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  return (
    <div className={`fixed inset-y-0 left-0 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 transition duration-500 ease-out z-30 w-80 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 shadow-2xl flex flex-col`}>
      <div className="absolute inset-0 bg-gradient-to-b from-green-500/20 via-emerald-500/20 to-green-500/20 opacity-50"></div>
      
      <div className="relative z-10 flex flex-col h-full">
        <div className={`relative overflow-hidden bg-gradient-to-r ${getRoleColor()}`}>
          <div className="relative z-10 py-3.5 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 backdrop-blur-md p-2 rounded-xl shadow-xl">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-white font-bold text-xl tracking-tight">Env Dashboard</span>
                    {isAdmin && <Crown className="w-3.5 h-3.5 text-yellow-400 animate-bounce" />}
                  </div>
                  <p className="text-white/70 text-[11px] mt-0.5">Federal Ministry of Environment</p>
                </div>
              </div>
              <button onClick={toggleSidebar} className="lg:hidden text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10 transition">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

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

        <div className="p-4 border-b border-white/10">
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10 group-hover:text-green-400 transition" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50 focus:border-transparent transition group-hover:bg-white/20"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
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
                      ? `bg-gradient-to-r ${item.gradient} text-white shadow-lg shadow-green-500/25`
                      : 'text-gray-300 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => sidebarOpen && toggleSidebar()}
                >
                  <Icon className={`mr-3 h-4 w-4 transition-all duration-300 ${isActive ? 'text-white' : 'text-gray-400 group-hover:text-white group-hover:scale-110'}`} />
                  <span className="relative z-10">{item.name}</span>
                  {item.badge > 0 && (
                    <span className="absolute right-3 px-1.5 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5 backdrop-blur-sm">
          <div className="flex items-center gap-3 mb-3 group">
            <div className="relative">
              <div className={`bg-gradient-to-r ${getRoleColor()} rounded-full w-9 h-9 flex items-center justify-center shadow-xl group-hover:scale-110 transition duration-300`}>
                <span className="text-white font-semibold text-sm">
                  {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-slate-900 animate-pulse"></div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-[11px] text-gray-400 truncate">{user?.email}</p>
              <p className="text-[10px] text-green-400 mt-0.5">{getRoleDisplayName()}</p>
            </div>
            <Shield className="w-3.5 h-3.5 text-green-400 group-hover:rotate-12 transition" />
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 px-3 py-1.5 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:scale-110 transition" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;