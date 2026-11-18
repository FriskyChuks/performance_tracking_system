// src/components/Layout/TopNav.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bell,
  MessageSquare,
  Search,
  User,
  ChevronDown,
  HelpCircle,
  Sparkles,
  BarChart3,
  LogOut,
  Menu,
  X,
  TrendingUp,
  Globe,
  Target,
  Award,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import mainApi from '../../services/mainApi';
import toast from 'react-hot-toast';

const TopNav = ({ toggleSidebar, sidebarOpen }) => {
  const { user, userRole, logout } = useAuth();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // Messages - commented out for now
  // const messages = [];

  useEffect(() => {
    fetchNotifications();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoadingNotifications(true);
      
      // Fetch pending tasks based on user role
      const notificationsList = [];
      
      // Add current date for time display
      const now = new Date();
      
      // 1. Check for pending updates (Delivery Officer)
      if (userRole === 'delivery_officer') {
        try {
          const progressData = await mainApi.getMyProgressList();
          const pendingUpdates = (progressData || []).filter(p => p.status === 'draft');
          
          if (pendingUpdates.length > 0) {
            notificationsList.push({
              id: 'pending_updates',
              title: 'Pending Updates',
              message: `You have ${pendingUpdates.length} quarter${pendingUpdates.length > 1 ? 's' : ''} waiting for actual values`,
              time: 'just now',
              read: false,
              icon: '📝',
              type: 'task',
              link: '/dashboard/my-tasks'
            });
          }
        } catch (error) {
          console.error('Error fetching pending updates:', error);
        }
      }
      
      // 2. Check for pending approvals (Director)
      if (userRole === 'director') {
        try {
          const pendingApprovals = await mainApi.getPendingApprovals();
          const pendingCount = pendingApprovals?.length || 0;
          
          if (pendingCount > 0) {
            notificationsList.push({
              id: 'pending_approvals',
              title: 'Pending Approvals',
              message: `${pendingCount} quarter${pendingCount > 1 ? 's' : ''} awaiting your review`,
              time: 'just now',
              read: false,
              icon: '⏰',
              type: 'approval',
              link: '/dashboard/pending-approvals'
            });
          }
        } catch (error) {
          console.error('Error fetching pending approvals:', error);
        }
      }
      
      // 3. Check for pending assessments (Sector Expert)
      if (userRole === 'sector_expert') {
        try {
          const pendingAssessments = await mainApi.getPendingAssessments();
          const pendingCount = pendingAssessments?.length || 0;
          
          if (pendingCount > 0) {
            notificationsList.push({
              id: 'pending_assessments',
              title: 'Pending Assessments',
              message: `${pendingCount} quarter${pendingCount > 1 ? 's' : ''} ready for expert review`,
              time: 'just now',
              read: false,
              icon: '🏆',
              type: 'assessment',
              link: '/dashboard/pending-assessments'
            });
          }
        } catch (error) {
          console.error('Error fetching pending assessments:', error);
        }
      }
      
      // 4. Check for activities that need attention (all roles)
      try {
        // For delivery officer, check their assigned activities
        let activities = [];
        if (userRole === 'delivery_officer') {
          const response = await mainApi.getMyActivities();
          activities = response?.results || response || [];
        } else {
          const response = await mainApi.getActivities();
          activities = response?.results || response || [];
        }
        
        // Check for activities with end date approaching
        const today = new Date();
        const upcomingDeadlines = activities.filter(activity => {
          if (!activity.end_date) return false;
          const endDate = new Date(activity.end_date);
          const daysUntilEnd = Math.ceil((endDate - today) / (1000 * 60 * 60 * 24));
          return daysUntilEnd <= 30 && daysUntilEnd > 0 && activity.status !== 'completed';
        });
        
        if (upcomingDeadlines.length > 0) {
          notificationsList.push({
            id: 'upcoming_deadlines',
            title: 'Upcoming Deadlines',
            message: `${upcomingDeadlines.length} activit${upcomingDeadlines.length > 1 ? 'ies' : 'y'} ending within 30 days`,
            time: 'just now',
            read: false,
            icon: '⏰',
            type: 'deadline',
            link: '/dashboard/activities'
          });
        }
      } catch (error) {
        console.error('Error fetching deadlines:', error);
      }
      
      // 5. Check for recently completed assessments (Sector Expert)
      if (userRole === 'sector_expert') {
        try {
          const allProgress = await mainApi.getMyProgressList();
          const recentlyAssessed = (allProgress || []).filter(p => 
            p.status === 'assessed' && 
            p.expert_assessed_at && 
            new Date(p.expert_assessed_at) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
          );
          
          if (recentlyAssessed.length > 0) {
            notificationsList.push({
              id: 'recent_assessments',
              title: 'Recent Assessments',
              message: `You assessed ${recentlyAssessed.length} quarter${recentlyAssessed.length > 1 ? 's' : ''} this week`,
              time: 'just now',
              read: true,
              icon: '✅',
              type: 'assessment',
              link: '/dashboard/reports'
            });
          }
        } catch (error) {
          console.error('Error fetching recent assessments:', error);
        }
      }
      
      // 6. Add welcome notification if no notifications
      if (notificationsList.length === 0) {
        notificationsList.push({
          id: 'welcome',
          title: 'Welcome Back!',
          message: 'No pending tasks at the moment. Stay tuned for updates.',
          time: 'just now',
          read: false,
          icon: '👋',
          type: 'info',
          link: null
        });
      }
      
      // Sort notifications: unread first, then by time
      notificationsList.sort((a, b) => (a.read === b.read) ? 0 : a.read ? 1 : -1);
      
      setNotifications(notificationsList);
      
    } catch (error) {
      console.error('Error fetching notifications:', error);
      // Fallback notification
      setNotifications([{
        id: 'error',
        title: 'Unable to load notifications',
        message: 'Please refresh the page',
        time: 'just now',
        read: false,
        icon: '⚠️',
        type: 'error',
        link: null
      }]);
    } finally {
      setLoadingNotifications(false);
    }
  };

  const markAsRead = async (notificationId) => {
    setNotifications(prev => 
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    toast.success('All notifications marked as read');
  };

  const handleNotificationClick = (notification) => {
    markAsRead(notification.id);
    if (notification.link) {
      window.location.href = notification.link;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const getRoleDisplayName = () => {
    const roles = {
      project_admin: 'Project Admin',
      delivery_officer: 'Delivery Officer',
      director: 'Director',
      sector_expert: 'Sector Expert',
      public_user: 'Public User'
    };
    return roles[userRole] || 'Staff';
  };

  const getRoleIcon = () => {
    const icons = {
      project_admin: '📋',
      delivery_officer: '📦',
      director: '👔',
      sector_expert: '🏆',
      public_user: '👤'
    };
    return icons[userRole] || '👤';
  };

  const navigationTitles = {
    '/dashboard': 'Overview',
    '/dashboard/activities': 'Activities',
    '/dashboard/activities/new': 'New Activity',
    '/dashboard/my-tasks': 'My Tasks',
    '/dashboard/pending-approvals': 'Pending Approvals',
    '/dashboard/pending-assessments': 'Pending Assessments',
    '/dashboard/reports': 'Reports',
    '/dashboard/settings': 'Settings',
  };

  const currentTitle = navigationTitles[location.pathname] || 'Dashboard';

  const getPendingTasksBadge = () => {
    if (userRole === 'delivery_officer') {
      return <span className="ml-2 px-1.5 py-0.5 bg-yellow-500 text-white text-[10px] rounded-full">Pending</span>;
    }
    if (userRole === 'director') {
      return <span className="ml-2 px-1.5 py-0.5 bg-blue-500 text-white text-[10px] rounded-full">Awaiting</span>;
    }
    if (userRole === 'sector_expert') {
      return <span className="ml-2 px-1.5 py-0.5 bg-purple-500 text-white text-[10px] rounded-full">Review</span>;
    }
    return null;
  };

  return (
    <div className="sticky top-0 z-20">
      {/* Main Navbar */}
      <div className="bg-gradient-to-r from-white via-white/95 to-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-green-500 hover:to-emerald-500 transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-green-500 via-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-green-600 to-emerald-600 bg-clip-text text-transparent animate-gradient">
                      {currentTitle}
                    </h1>
                    {getPendingTasksBadge()}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-green-500 animate-pulse" />
                    {getGreeting()}, {user?.first_name || user?.email?.split('@')[0] || 'User'}
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-green-600 font-medium">{getRoleDisplayName()}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right section */}
          <div className="flex items-center gap-2">
            {/* Quick Action Buttons - Desktop */}
            <div className="hidden md:flex items-center gap-2 mr-2 pr-2 border-r border-gray-200">
              <Link
                to="/public"
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Citizens Engagement Portal
              </Link>
              
              {/* Role-specific quick actions */}
              {userRole === 'project_admin' && (
                <Link
                  to="/dashboard/activities/new"
                  className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    New Activity
                  </span>
                </Link>
              )}
              
              {userRole === 'delivery_officer' && (
                <Link
                  to="/dashboard/my-tasks"
                  className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 text-yellow-700 text-xs font-medium hover:from-yellow-500 hover:to-orange-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    My Tasks
                  </span>
                </Link>
              )}
              
              {userRole === 'director' && (
                <Link
                  to="/dashboard/pending-approvals"
                  className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 text-purple-700 text-xs font-medium hover:from-purple-500 hover:to-pink-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" />
                    Approvals
                  </span>
                </Link>
              )}
              
              {userRole === 'sector_expert' && (
                <Link
                  to="/dashboard/pending-assessments"
                  className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 text-xs font-medium hover:from-indigo-500 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  <span className="relative z-10 flex items-center gap-1">
                    <Award className="w-3 h-3" />
                    Assessments
                  </span>
                </Link>
              )}
            </div>

            {/* Mobile Quick Action */}
            <div className="md:hidden">
              <Link
                to="/public"
                className="relative p-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:shadow-lg transition-all duration-300 flex items-center justify-center"
              >
                <Globe className="w-5 h-5" />
              </Link>
            </div>

            {/* Help Button */}
            <div className="relative group">
              <button className="relative p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 hover:from-green-500 hover:to-emerald-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105">
                <HelpCircle className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Dropdown - Commented out for now */}
            {/* <div className="relative group">
              <button className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-500 hover:to-indigo-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105">
                <MessageSquare className="w-5 h-5" />
              </button>
            </div> */}

            {/* Notifications Dropdown */}
            <div className="relative">
              <button
                onClick={() => {
                  setMessagesOpen(false);
                  setUserMenuOpen(false);
                  setNotificationsOpen(!notificationsOpen);
                }}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600 hover:from-amber-500 hover:to-orange-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg animate-pulse ring-2 ring-white">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notificationsOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-4 bg-gradient-to-r from-amber-500 to-orange-600 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Notifications</h3>
                        {unreadCount > 0 && (
                          <button 
                            onClick={markAllAsRead}
                            className="text-xs text-white/80 hover:text-white"
                          >
                            Mark all read
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-white/70 mt-1">
                        {loadingNotifications ? 'Loading...' : `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {loadingNotifications && notifications.length === 0 ? (
                        <div className="p-4 text-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-500 mx-auto"></div>
                          <p className="text-xs text-gray-500 mt-2">Loading...</p>
                        </div>
                      ) : (
                        notifications.map((notification) => (
                          <div 
                            key={notification.id} 
                            onClick={() => handleNotificationClick(notification)}
                            className={`p-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 ${!notification.read ? 'bg-gradient-to-r from-amber-50/30 to-transparent' : ''}`}
                          >
                            <div className="flex gap-3">
                              <div className="text-2xl">{notification.icon}</div>
                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                  <p className="text-xs text-gray-400">{notification.time}</p>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                                <span className={`inline-block mt-1 text-[10px] px-1.5 py-0.5 rounded-full ${
                                  notification.type === 'deadline' ? 'bg-red-100 text-red-600' :
                                  notification.type === 'approval' ? 'bg-blue-100 text-blue-600' :
                                  notification.type === 'assessment' ? 'bg-purple-100 text-purple-600' :
                                  notification.type === 'task' ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-gray-100 text-gray-500'
                                }`}>
                                  {notification.type === 'deadline' ? 'Deadline' : 
                                   notification.type === 'approval' ? 'Approval' : 
                                   notification.type === 'assessment' ? 'Assessment' : 
                                   notification.type === 'task' ? 'Task' : 'Info'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="p-3 bg-gray-50">
                      <button 
                        onClick={() => setNotificationsOpen(false)}
                        className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* User Menu */}
            <div className="relative ml-2">
              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  setMessagesOpen(false);
                  setUserMenuOpen(!userMenuOpen);
                }}
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-green-500 hover:to-emerald-500 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <div className="relative">
                  <div className="bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
                    <span className="text-white font-semibold text-sm">
                      {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                    </span>
                  </div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white animate-pulse"></div>
                </div>
                <div className="hidden lg:block text-left">
                  <p className="text-sm font-semibold text-gray-800 group-hover:text-white transition">
                    {user?.first_name} {user?.last_name}
                  </p>
                  <p className="text-xs text-gray-500 group-hover:text-white/80 transition flex items-center gap-1">
                    <span>{getRoleIcon()}</span>
                    {getRoleDisplayName()}
                  </p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:rotate-180 transition-all duration-300 hidden lg:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white">
                      <p className="text-sm font-medium">Signed in as</p>
                      <p className="text-xs text-white/80 truncate">{user?.email}</p>
                      <div className="mt-1 inline-block px-1.5 py-0.5 bg-white/20 rounded-full text-xs">
                        {getRoleDisplayName()}
                      </div>
                    </div>
                    <div className="py-2">
                      <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4 text-green-500" />
                        Profile Settings
                      </Link>
                      <Link to="/dashboard/reports" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <BarChart3 className="w-4 h-4 text-green-500" />
                        My Reports
                      </Link>
                      <div className="border-t border-gray-100 my-1"></div>
                      <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition">
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative bottom border gradient */}
      <div className="h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500"></div>
    </div>
  );
};

export default TopNav;