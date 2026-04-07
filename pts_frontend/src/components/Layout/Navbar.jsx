// src/components/Layout/Navbar.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, TrendingUp, LogIn, User, ChevronDown, LogOut, Settings, LayoutDashboard } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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

  return (
    <nav className="bg-white shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2 group">
              <TrendingUp className="w-8 h-8 text-primary-600 group-hover:scale-110 transition-transform" />
              <span className="font-bold text-xl bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent">
                FME | PTS
              </span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-8">
            <Link to="/" className="text-gray-700 hover:text-primary-600 transition">
              Home
            </Link>
            <Link to="/features" className="text-gray-700 hover:text-primary-600 transition">
              Features
            </Link>
            <Link to="/about" className="text-gray-700 hover:text-primary-600 transition">
              About
            </Link>
            <Link
              to="/public"
              className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:shadow-md transition-all"
            >
              Citizens Engagement Portal
            </Link>
            
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
                >
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                    <span className="text-white font-semibold text-sm">
                      {getInitials()}
                    </span>
                  </div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user?.first_name || user?.email?.split('@')[0]}
                    </p>
                    <p className="text-xs text-gray-500">
                      {user?.is_staff || user?.is_superuser ? 'Staff' : user?.is_public_only ? 'Public User' : 'User'}
                    </p>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 z-50 overflow-hidden animate-fade-in-up">
                      <div className="p-3 bg-gradient-to-r from-primary-500 to-secondary-600 text-white">
                        <p className="text-sm font-medium">Signed in as</p>
                        <p className="text-xs text-white/80 truncate">{user?.email}</p>
                      </div>
                      <div className="py-2">
                        {user.is_staff || user.is_superuser ? (
                          <Link
                          to="/dashboard"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <LayoutDashboard className="w-4 h-4 text-primary-500" />
                          Dashboard
                        </Link>
                        ) : null
                        }
                        <Link
                          to="/dashboard/settings"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <Settings className="w-4 h-4 text-primary-500" />
                          Settings
                        </Link>
                        <Link
                          to="/public"
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition"
                          onClick={() => setUserMenuOpen(false)}
                        >
                          <TrendingUp className="w-4 h-4 text-primary-500" />
                          Public Portal
                        </Link>
                        <div className="border-t border-gray-100 my-1"></div>
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                        >
                          <LogOut className="w-4 h-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-gray-700 hover:text-primary-600 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white font-semibold py-2 px-4 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            {user && (
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-8 h-8 flex items-center justify-center shadow-md">
                <span className="text-white font-semibold text-sm">
                  {getInitials()}
                </span>
              </div>
            )}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-gray-700 hover:text-primary-600"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isOpen && (
          <div className="md:hidden py-4 border-t animate-fade-in-up">
            <div className="flex flex-col space-y-3">
              {/* User info for mobile */}
              {user && (
                <div className="px-4 py-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-lg mb-2">
                  <div className="flex items-center gap-3">
                    <div className="bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full w-10 h-10 flex items-center justify-center">
                      <span className="text-white font-semibold text-sm">
                        {getInitials()}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">
                        {user?.first_name} {user?.last_name}
                      </p>
                      <p className="text-xs text-gray-500">{user?.email}</p>
                      <p className="text-xs text-primary-600 mt-0.5">
                        {user?.is_staff || user?.is_superuser ? 'Staff Account' : user?.is_public_only ? 'Public User' : 'Registered User'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              <Link to="/" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                Home
              </Link>
              <Link to="/features" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                Features
              </Link>
              <Link to="/about" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                About
              </Link>
              <Link
                to="/public"
                className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-2 px-4 rounded-lg mx-4 text-center"
                onClick={() => setIsOpen(false)}
              >
                Community Portal
              </Link>
              
              {user ? (
                <>
                  user.is_staff || user.is_superuser ? (
                    <Link to="/dashboard" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                    Dashboard
                  </Link>
                  ) : null

                  <Link to="/dashboard/settings" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                    Settings
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg mx-4 text-left transition"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="text-gray-700 hover:text-primary-600 py-2 px-4" onClick={() => setIsOpen(false)}>
                    Login
                  </Link>
                  <Link to="/register" className="bg-gradient-to-r from-primary-500 to-secondary-500 text-white text-center py-2 px-4 rounded-lg mx-4" onClick={() => setIsOpen(false)}>
                    Sign Up
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;