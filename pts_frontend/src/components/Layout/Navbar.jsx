// src/components/Layout/Navbar.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, TrendingUp, LogIn, User, ChevronDown, LogOut, Settings, LayoutDashboard, Globe, Shield, Bell, Sparkles, Award, Leaf, ExternalLink } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
    setUserMenuOpen(false);
    setIsOpen(false);
  };

  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name.charAt(0)}${user.last_name.charAt(0)}`.toUpperCase();
    }
    return user?.email?.charAt(0).toUpperCase() || 'U';
  };

  const getRoleDisplayName = () => {
    switch(userRole) {
      case 'project_admin': return 'Project Admin';
      case 'delivery_officer': return 'Delivery Officer';
      case 'director': return 'Director';
      case 'sector_expert': return 'Sector Expert';
      case 'public_user': return 'Public User';
      default: return user?.is_staff ? 'Staff' : 'User';
    }
  };

  const getRoleColor = () => {
    switch(userRole) {
      case 'project_admin': return 'from-blue-500 to-indigo-500';
      case 'delivery_officer': return 'from-green-500 to-emerald-500';
      case 'director': return 'from-purple-500 to-pink-500';
      case 'sector_expert': return 'from-orange-500 to-red-500';
      default: return 'from-gray-500 to-gray-600';
    }
  };

  const navLinks = [
    { name: 'Home', href: '/' },
    { name: 'Features', href: '/features' },
    { name: 'About', href: '/about' },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`sticky top-0 z-50 transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-xl shadow-xl' 
        : 'bg-white shadow-lg'
    }`}>
      {/* Animated gradient top border */}
      <div className="h-0.5 bg-gradient-to-r from-green-500 via-emerald-500 to-teal-500 animate-gradient-x"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                <div className="relative bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <Leaf className="w-5 h-5 text-white" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  EnvMonitor
                </span>
                <span className="text-[9px] text-gray-400 -mt-1">Federal Ministry of Environment</span>
              </div>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                to={link.href}
                className={`relative px-4 py-2 text-sm font-medium rounded-lg transition-all duration-300 ${
                  isActive(link.href)
                    ? 'text-green-600 bg-green-50'
                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                }`}
              >
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-green-500 rounded-full"></span>
                )}
                {link.name}
              </Link>
            ))}
            
            {/* CRDCU Link */}
            <a
              href="https://crdcu.gov.ng"
              target="_blank"
              rel="noopener noreferrer"
              className="relative group ml-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-300 flex items-center gap-1 text-gray-700 hover:text-green-600 hover:bg-gray-50"
            >
              <span>CRDCU</span>
              <ExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>

            <Link
              to="/public"
              className="relative group ml-2 px-4 py-2 rounded-lg text-sm font-medium overflow-hidden transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="absolute inset-0 border border-green-500 rounded-lg"></div>
              <span className="relative flex items-center gap-2 text-green-600 group-hover:text-white transition-colors">
                <Globe className="w-4 h-4" />
                Citizens Portal
              </span>
            </Link>
            
            {user ? (
              <div className="relative ml-2">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl hover:bg-gray-100 transition-all duration-300 group"
                >
                  <div className="relative">
                    <div className={`bg-gradient-to-r ${getRoleColor()} rounded-full w-9 h-9 flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                      <span className="text-white font-semibold text-sm">
                        {getInitials()}
                      </span>
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-gray-900">
                      {user?.first_name || user?.email?.split('@')[0]}
                    </p>
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 text-green-500" />
                      <p className="text-[10px] text-gray-500">{getRoleDisplayName()}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                      <div className={`p-4 bg-gradient-to-r ${getRoleColor()} text-white`}>
                        <div className="flex items-center gap-3">
                          <div className="bg-white/20 backdrop-blur rounded-full w-10 h-10 flex items-center justify-center">
                            <span className="font-bold text-lg">{getInitials()}</span>
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user?.first_name} {user?.last_name}</p>
                            <p className="text-xs text-white/80 truncate">{user?.email}</p>
                            <p className="text-[10px] text-white/70 mt-0.5 flex items-center gap-1">
                              <Shield className="w-2.5 h-2.5" />
                              {getRoleDisplayName()}
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="py-2">
                        {(userRole === 'project_admin' || userRole === 'delivery_officer' || userRole === 'director' || userRole === 'sector_expert') && (
                          <Link
                            to="/dashboard"
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition group"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <LayoutDashboard className="w-4 h-4 text-green-500 group-hover:scale-110 transition" />
                            Dashboard
                            <span className="ml-auto text-[10px] text-gray-400">Go</span>
                          </Link>
                        )}
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition group"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-green-500 group-hover:scale-110 transition" />
                          Settings
                        </Link>
                        <Link
                          to="/public"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition group"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Globe className="w-4 h-4 text-green-500 group-hover:scale-110 transition" />
                          Public Portal
                        </Link>
                        <a
                          href="https://crdcu.gov.ng"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 transition group"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <ExternalLink className="w-4 h-4 text-green-500 group-hover:scale-110 transition" />
                          CRDCU Portal
                        </a>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition group"
                        >
                          <LogOut className="w-4 h-4 group-hover:scale-110 transition" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 ml-2">
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition rounded-lg"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="relative group px-5 py-2 rounded-lg text-sm font-semibold overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500 to-emerald-500"></div>
                  <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  <span className="relative text-white">Get Started</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            {user && (
              <div className={`bg-gradient-to-r ${getRoleColor()} rounded-full w-8 h-8 flex items-center justify-center shadow-md`}>
                <span className="text-white font-semibold text-xs">
                  {getInitials()}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="relative w-10 h-10 rounded-lg flex items-center justify-center text-gray-700 hover:bg-gray-100 transition-all duration-300"
            >
              <span className={`absolute transition-all duration-300 ${isOpen ? 'opacity-0 rotate-90' : 'opacity-100 rotate-0'}`}>
                <Menu className="w-5 h-5" />
              </span>
              <span className={`absolute transition-all duration-300 ${isOpen ? 'opacity-100 rotate-0' : 'opacity-0 -rotate-90'}`}>
                <X className="w-5 h-5" />
              </span>
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100 animate-fade-in-up">
            <div className="flex flex-col space-y-2">
              {/* User info for mobile */}
              {user && (
                <div className="mb-3 p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className={`bg-gradient-to-r ${getRoleColor()} rounded-full w-12 h-12 flex items-center justify-center shadow-md`}>
                      <span className="text-white font-bold text-base">
                        {getInitials()}
                      </span>
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <Award className="w-3 h-3 text-green-500" />
                        <p className="text-[10px] text-green-600 font-medium">{getRoleDisplayName()}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {navLinks.map((link) => (
                <Link
                  key={link.name}
                  to={link.href}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition ${
                    isActive(link.href)
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-700 hover:text-green-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setIsOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              
              {/* CRDCU Link Mobile */}
              <a
                href="https://crdcu.gov.ng"
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <ExternalLink className="w-4 h-4" />
                CRDCU Portal
              </a>
              
              <Link
                to="/public"
                className="mx-4 my-1 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium text-center flex items-center justify-center gap-2"
                onClick={() => setIsOpen(false)}
              >
                <Globe className="w-4 h-4" />
                Citizens Portal
              </Link>
              
              {user ? (
                <>
                  {(userRole === 'project_admin' || userRole === 'delivery_officer' || userRole === 'director' || userRole === 'sector_expert') && (
                    <Link
                      to="/dashboard"
                      className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                      onClick={() => setIsOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Dashboard
                    </Link>
                  )}
                  <Link
                    to="/dashboard/settings"
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg flex items-center gap-2"
                    onClick={() => setIsOpen(false)}
                  >
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="mx-4 my-2 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2 mt-2">
                  <Link
                    to="/login"
                    className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-green-600 hover:bg-gray-50 rounded-lg"
                    onClick={() => setIsOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    to="/register"
                    className="mx-4 px-4 py-2.5 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg text-sm font-medium text-center"
                    onClick={() => setIsOpen(false)}
                  >
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;