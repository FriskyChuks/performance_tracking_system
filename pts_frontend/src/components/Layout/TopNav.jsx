// src/components/Layout/TopNav.jsx
import React, { useState } from 'react';
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
  Globe
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const TopNav = ({ toggleSidebar, sidebarOpen }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  // Mock data - replace with API calls
  const notifications = [
    { id: 1, title: 'Project Deadline', message: 'Health project due in 3 days', time: '2h ago', read: false, icon: '⏰' },
    { id: 2, title: 'Report Ready', message: 'Q4 report generated', time: '5h ago', read: false, icon: '📊' },
  ];
  
  const messages = [
    { id: 1, sender: 'Dr. Sarah Johnson', avatar: 'SJ', message: 'Can you review the updates?', time: '10:30 AM', unread: true, role: 'Director' },
  ];

  const unreadNotifications = notifications.filter(n => !n.read).length;
  const unreadMessages = messages.filter(m => m.unread).length;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const navigationTitles = {
    '/dashboard': 'Overview',
    '/dashboard/projects': 'Projects',
    '/dashboard/ministries': 'Ministries',
    '/dashboard/priority-areas': 'Priority Areas',
    '/dashboard/deliverables': 'Deliverables',
    '/dashboard/reports': 'Reports',
    '/dashboard/settings': 'Settings',
  };

  const currentTitle = navigationTitles[location.pathname] || 'Dashboard';

  return (
    <div className="sticky top-0 z-20">
      {/* Main Navbar */}
      <div className="bg-gradient-to-r from-white via-white/95 to-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-xl">
        <div className="flex items-center justify-between px-4 py-3 lg:px-6">
          {/* Left section */}
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="lg:hidden p-2 rounded-xl text-gray-600 hover:text-white hover:bg-gradient-to-r hover:from-primary-500 hover:to-secondary-500 transition-all duration-300"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden lg:block">
              <div className="flex items-center gap-3">
                <div className="w-1 h-8 bg-gradient-to-b from-primary-500 via-secondary-500 to-accent-500 rounded-full animate-pulse"></div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-800 via-primary-600 to-secondary-600 bg-clip-text text-transparent animate-gradient">
                    {currentTitle}
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-primary-500 animate-pulse" />
                    {getGreeting()}, {user?.first_name || 'User'}
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <span className="text-primary-600">Ready to perform</span>
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
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all flex items-center gap-2"
              >
                <Globe className="w-4 h-4" />
                Citizens Engagement Portal
              </Link>
              <button className="group relative px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 text-xs font-medium hover:from-blue-500 hover:to-indigo-500 hover:text-white transition-all duration-300 shadow-sm hover:shadow-md">
                <span className="relative z-10">New Project</span>
              </button>
            </div>

            {/* Mobile Quick Action - Community Portal Icon */}
            <div className="md:hidden">
              <Link
                to="/public"
                className="relative p-2.5 rounded-xl bg-gradient-to-r from-primary-500 to-secondary-500 text-white hover:shadow-lg transition-all duration-300 group-hover:scale-105 flex items-center justify-center"
              >
                <Globe className="w-5 h-5" />
              </Link>
            </div>

            {/* Help Button */}
            <div className="relative group">
              <button className="relative p-2.5 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 text-gray-600 hover:from-primary-500 hover:to-secondary-500 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105">
                <HelpCircle className="w-5 h-5" />
              </button>
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-primary-500 rounded-full animate-pulse"></span>
            </div>

            {/* Messages Dropdown */}
            <div className="relative group">
              <button
                onClick={() => {
                  setNotificationsOpen(false);
                  setUserMenuOpen(false);
                  setMessagesOpen(!messagesOpen);
                }}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-100 text-blue-600 hover:from-blue-500 hover:to-indigo-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
              >
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-red-500 to-pink-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg animate-bounce ring-2 ring-white">
                    {unreadMessages}
                  </span>
                )}
              </button>

              {messagesOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setMessagesOpen(false)} />
                  <div className="absolute right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold">Messages</h3>
                        <button className="text-xs text-white/80 hover:text-white">View All</button>
                      </div>
                      <p className="text-xs text-white/70 mt-1">You have {unreadMessages} unread messages</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {messages.map((msg) => (
                        <div key={msg.id} className={`p-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 ${!msg.unread ? 'opacity-75' : 'bg-gradient-to-r from-blue-50/30 to-transparent'}`}>
                          <div className="flex gap-3">
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                                {msg.avatar}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{msg.sender}</p>
                                <p className="text-xs text-gray-400">{msg.time}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">{msg.role}</p>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">{msg.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50">
                      <button className="w-full text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                        Go to Message Center →
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Notifications Dropdown */}
            <div className="relative group">
              <button
                onClick={() => {
                  setMessagesOpen(false);
                  setUserMenuOpen(false);
                  setNotificationsOpen(!notificationsOpen);
                }}
                className="relative p-2.5 rounded-xl bg-gradient-to-br from-amber-50 to-orange-100 text-amber-600 hover:from-amber-500 hover:to-orange-600 hover:text-white transition-all duration-300 shadow-md hover:shadow-lg group-hover:scale-105"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] rounded-full flex items-center justify-center shadow-lg animate-pulse ring-2 ring-white">
                    {unreadNotifications}
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
                        <button className="text-xs text-white/80 hover:text-white">Mark all read</button>
                      </div>
                      <p className="text-xs text-white/70 mt-1">Stay updated with latest activities</p>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.map((notification) => (
                        <div key={notification.id} className={`p-3 hover:bg-gray-50 transition cursor-pointer border-b border-gray-100 ${!notification.read ? 'bg-gradient-to-r from-amber-50/30 to-transparent' : ''}`}>
                          <div className="flex gap-3">
                            <div className="text-2xl">{notification.icon}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                                <p className="text-xs text-gray-400">{notification.time}</p>
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{notification.message}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 bg-gray-50">
                      <button className="w-full text-center text-sm text-amber-600 hover:text-amber-700 font-medium">
                        View All Notifications →
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
                className="flex items-center gap-3 p-1.5 pr-3 rounded-xl bg-gradient-to-r from-gray-50 to-gray-100 hover:from-primary-500 hover:to-secondary-500 transition-all duration-300 shadow-md hover:shadow-lg group"
              >
                <div className="relative">
                  <div className="bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500 rounded-full w-9 h-9 flex items-center justify-center shadow-lg">
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
                  <p className="text-xs text-gray-500 group-hover:text-white/80 transition">Administrator</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 group-hover:text-white group-hover:rotate-180 transition-all duration-300 hidden lg:block" />
              </button>

              {userMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                  <div className="absolute right-0 mt-3 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                    <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white">
                      <p className="text-sm font-medium">Signed in as</p>
                      <p className="text-xs text-white/80 truncate">{user?.email}</p>
                    </div>
                    <div className="py-2">
                      <Link to="/dashboard/settings" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <User className="w-4 h-4 text-primary-500" />
                        Profile Settings
                      </Link>
                      <Link to="/dashboard/reports" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-primary-50 hover:to-secondary-50 transition" onClick={() => setUserMenuOpen(false)}>
                        <BarChart3 className="w-4 h-4 text-primary-500" />
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
      <div className="h-0.5 bg-gradient-to-r from-primary-500 via-secondary-500 to-accent-500"></div>
    </div>
  );
};

export default TopNav;