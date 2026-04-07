// src/components/Public/PublicLayout.jsx
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { 
  TrendingUp, 
  Menu, 
  X, 
  Search, 
  User, 
  MessageCircle,
  Home,
  Info,
  Mail,
  ChevronDown,
  Heart,
  Globe,
  Shield,
  LogOut,
  Settings,
  BarChart3,
  Bell,
  MessageSquare,
  LayoutDashboard
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import LandingFooter from '../Landing/LandingFooter';
import toast from 'react-hot-toast';

const PublicLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();
  const { user, logout, isAuthenticated, canAccessDashboard } = useAuth();

  // Mock notifications for public portal
  const notifications = [
    { id: 1, title: 'New Comment', message: 'Someone replied to your comment', time: '2h ago', read: false, icon: '💬' },
    { id: 2, title: 'Project Update', message: 'Health project status updated', time: '5h ago', read: false, icon: '📢' },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;

  const navigation = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Projects', href: '/public/projects', icon: TrendingUp },
    { name: 'About', href: '/about', icon: Info },
    { name: 'Contact', href: '/contact', icon: Mail },
  ];

  const isActive = (path) => location.pathname === path;

  const handleLogout = async () => {
    await logout();
    toast.success('Logged out successfully');
    window.location.href = '/';
  };

  // Check if user has dashboard access (staff or superuser)
  const hasDashboardAccess = user?.is_staff || user?.is_superuser || canAccessDashboard;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/20 to-indigo-50/30 flex flex-col">
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-primary-200/20 to-secondary-200/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-blue-200/20 to-purple-200/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-emerald-200/10 to-teal-200/10 rounded-full blur-3xl"></div>
      </div>

      {/* Premium Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-lg">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo Section */}
            <div className="flex items-center gap-2">
              <Link to="/" className="flex items-center gap-2 group">
                <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-1.5 rounded-xl shadow-lg group-hover:scale-105 transition-transform">
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <div>
                  <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                    PTS
                  </span>
                  <span className="text-xs text-gray-400 ml-1 hidden sm:inline">Public Portal</span>
                </div>
              </Link>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center gap-1">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`relative px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 group ${
                      isActive(item.href)
                        ? 'text-primary-600 bg-primary-50'
                        : 'text-gray-600 hover:text-primary-600 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {item.name}
                    </div>
                    {isActive(item.href) && (
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full"></div>
                    )}
                  </Link>
                );
              })}
            </div>

            {/* Right Section - Conditional based on auth */}
            <div className="flex items-center gap-3">
              {isAuthenticated && user ? (
                <>
                  {/* Search Button */}
                  <button className="p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition">
                    <Search className="w-5 h-5" />
                  </button>

                  {/* Notifications Dropdown */}
                  <div className="relative">
                    <button
                      onClick={() => setNotificationsOpen(!notificationsOpen)}
                      className="relative p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition"
                    >
                      <Bell className="w-5 h-5" />
                      {unreadNotifications > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center animate-pulse">
                          {unreadNotifications}
                        </span>
                      )}
                    </button>

                    {notificationsOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setNotificationsOpen(false)} />
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white">
                            <h3 className="font-semibold text-sm">Notifications</h3>
                            <p className="text-xs text-white/80 mt-0.5">Stay updated with latest activities</p>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            {notifications.map((notif) => (
                              <div key={notif.id} className="p-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100">
                                <div className="flex gap-3">
                                  <div className="text-xl">{notif.icon}</div>
                                  <div>
                                    <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                    <p className="text-xs text-gray-500">{notif.message}</p>
                                    <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* User Menu */}
                  <div className="relative">
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 transition"
                    >
                      <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                        <span className="text-white font-semibold text-sm">
                          {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                        </span>
                      </div>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.first_name} {user?.last_name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {hasDashboardAccess ? 'Staff User' : 'Public User'}
                        </p>
                      </div>
                      <ChevronDown className="w-4 h-4 text-gray-400 hidden lg:block" />
                    </button>

                    {userMenuOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden">
                          <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white">
                            <p className="text-sm font-medium">Signed in as</p>
                            <p className="text-xs text-white/80 truncate">{user?.email}</p>
                          </div>
                          <div className="py-2">
                            {/* Dashboard Link - Only for staff/superuser */}
                            {hasDashboardAccess && (
                              <Link
                                to="/dashboard"
                                className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                                onClick={() => setUserMenuOpen(false)}
                              >
                                <LayoutDashboard className="w-4 h-4 text-primary-500" />
                                Dashboard
                              </Link>
                            )}
                            <Link
                              to="/public/profile"
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <User className="w-4 h-4 text-primary-500" />
                              My Profile
                            </Link>
                            <Link
                              to="/public/my-comments"
                              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition"
                              onClick={() => setUserMenuOpen(false)}
                            >
                              <MessageCircle className="w-4 h-4 text-primary-500" />
                              My Comments
                            </Link>
                            <div className="border-t border-gray-100 my-1"></div>
                            <button
                              onClick={handleLogout}
                              className="w-full flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                            >
                              <LogOut className="w-4 h-4" />
                              Sign Out
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Public user - show login/register buttons */}
                  <Link
                    to="/login"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition text-sm font-medium"
                  >
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-sm font-medium hover:shadow-lg transition-all hover:scale-105"
                  >
                    <User className="w-4 h-4" />
                    Join Discussion
                  </Link>
                </>
              )}
              
              {/* Mobile Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-gray-500 hover:text-primary-600 hover:bg-primary-50 transition"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-gray-100 py-2 animate-fade-in-up">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center gap-3 px-4 py-3 text-sm transition ${
                    isActive(item.href)
                      ? 'text-primary-600 bg-primary-50'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </Link>
              );
            })}
            
            {/* Mobile Auth Links */}
            {!isAuthenticated ? (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <Link
                    to="/login"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Sign In
                  </Link>
                  <Link
                    to="/register"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-primary-600 hover:bg-primary-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    Join Discussion
                  </Link>
                </div>
              </>
            ) : (
              <>
                <div className="border-t border-gray-100 mt-2 pt-2">
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-8 h-8 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {user?.first_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{user?.first_name} {user?.last_name}</p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-primary-600 mt-0.5">
                        {hasDashboardAccess ? 'Staff Account' : 'Public User'}
                      </p>
                    </div>
                  </div>
                  
                  {/* Dashboard Link in Mobile Menu */}
                  {hasDashboardAccess && (
                    <Link
                      to="/dashboard"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4 text-primary-500" />
                      Dashboard
                    </Link>
                  )}
                  
                  <Link
                    to="/public/profile"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <User className="w-4 h-4" />
                    My Profile
                  </Link>
                  <Link
                    to="/public/my-comments"
                    className="flex items-center gap-3 px-4 py-3 text-sm text-gray-600 hover:bg-gray-50 transition"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <MessageCircle className="w-4 h-4" />
                    My Comments
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </nav>

      {/* Main Content - This is where the child routes render */}
      <main className="flex-1 relative z-10">
        <Outlet />
      </main>

      {/* Reusing the LandingFooter */}
      <LandingFooter />
    </div>
  );
};

export default PublicLayout;