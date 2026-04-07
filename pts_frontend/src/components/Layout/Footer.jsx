// src/components/Layout/Footer.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Footer = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const currentYear = new Date().getFullYear();

  return (
    <>
      {/* Collapsible Footer Section - Shows when expanded (positioned above fixed bar) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 lg:left-80 z-20 transition-all duration-500 ease-in-out ${
          isExpanded ? 'translate-y-[-48px]' : 'translate-y-full'
        }`}
      >
        <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-t border-gray-800 shadow-xl">
          <div className="px-6 py-4 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 max-w-7xl mx-auto">
              {/* Company Info */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="bg-gradient-to-r from-primary-500 to-secondary-500 p-1.5 rounded-lg">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                  <span className="font-bold text-sm bg-gradient-to-r from-primary-400 to-secondary-400 bg-clip-text text-transparent">
                    PTS Enterprise
                  </span>
                </div>
                <p className="text-gray-400 text-xs leading-relaxed">
                  Performance Tracking System - Empowering organizations to achieve excellence.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a href="#" className="text-gray-500 hover:text-primary-400 transition transform hover:scale-110">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-primary-400 transition transform hover:scale-110">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-2-2 2 2 0 00-2 2v7h-4v-7a6 6 0 016-6zM2 9h4v12H2z" />
                      <circle cx="4" cy="4" r="2" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-primary-400 transition transform hover:scale-110">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </a>
                  <a href="#" className="text-gray-500 hover:text-primary-400 transition transform hover:scale-110">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                  </a>
                </div>
              </div>

              {/* Quick Links */}
              <div>
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Quick Links</h3>
                <ul className="space-y-1.5">
                  <li><Link to="/dashboard" className="text-gray-400 hover:text-primary-400 transition text-xs">Dashboard</Link></li>
                  <li><Link to="/dashboard/projects" className="text-gray-400 hover:text-primary-400 transition text-xs">Projects</Link></li>
                  <li><Link to="/dashboard/reports" className="text-gray-400 hover:text-primary-400 transition text-xs">Reports</Link></li>
                  <li><Link to="/dashboard/settings" className="text-gray-400 hover:text-primary-400 transition text-xs">Settings</Link></li>
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Resources</h3>
                <ul className="space-y-1.5">
                  <li><a href="#" className="text-gray-400 hover:text-primary-400 transition text-xs">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-primary-400 transition text-xs">API Reference</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-primary-400 transition text-xs">Support Center</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-primary-400 transition text-xs">Privacy Policy</a></li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h3 className="font-semibold text-white text-xs uppercase tracking-wider mb-2">Contact</h3>
                <ul className="space-y-1.5 text-gray-400 text-xs">
                  <li className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>support@pts.com</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 text-primary-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>+1 (555) 123-4567</span>
                  </li>
                  <li className="flex items-start gap-1.5">
                    <svg className="w-3 h-3 text-primary-400 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="text-xs">123 Performance St, Suite 100</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Fixed Bottom Bar - Always visible */}
      <div className="fixed bottom-0 left-0 right-0 lg:left-80 z-30 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 border-t border-gray-700 shadow-lg">
        <div className="px-4 py-2.5 lg:px-6">
          <div className="flex items-center justify-between text-xs">
            {/* Left side - Copyright */}
            <div className="flex items-center gap-2 text-gray-400">
              <span>&copy; {currentYear} PTS Enterprise</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <svg className="w-3 h-3 text-red-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                </svg>
                Excellence
              </span>
            </div>

            {/* Center - Status */}
            <div className="hidden md:flex items-center gap-3 text-gray-500">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span>System Online</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Real-time Sync</span>
              </div>
              <div className="flex items-center gap-1">
                <svg className="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>SSL Secured</span>
              </div>
            </div>

            {/* Right side - Toggle & Links */}
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-2">
                <Link to="/terms" className="text-gray-500 hover:text-primary-400 transition">Terms</Link>
                <span className="text-gray-600">•</span>
                <Link to="/privacy" className="text-gray-500 hover:text-primary-400 transition">Privacy</Link>
              </div>
              
              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="group relative flex items-center gap-1 px-2 py-1 rounded-lg text-gray-400 hover:text-primary-400 hover:bg-white/5 transition-all duration-300"
              >
                <span className="text-[10px] font-medium">
                  {isExpanded ? 'Less info' : 'More info'}
                </span>
                <svg 
                  className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom padding to prevent content from hiding under fixed footer */}
      <div className="h-12"></div>
    </>
  );
};

export default Footer;