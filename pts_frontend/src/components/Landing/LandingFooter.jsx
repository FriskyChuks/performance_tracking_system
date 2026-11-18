// src/components/Landing/LandingFooter.jsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Leaf, 
  Mail, 
  Phone, 
  MapPin, 
  Send,
  Heart,
  Bell
} from 'lucide-react';

const LandingFooter = () => {
  const currentYear = new Date().getFullYear();
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (email) {
      setSubscribed(true);
      setTimeout(() => setSubscribed(false), 3000);
      setEmail('');
    }
  };

  // Custom Social Media Icons
  const TwitterIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 0021.5-12.113c0-.212-.005-.423-.015-.633A9.936 9.936 0 0024 4.59z"/>
    </svg>
  );

  const FacebookIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );

  const LinkedInIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451c.979 0 1.771-.773 1.771-1.729V1.729C24 .774 23.204 0 22.225 0z" />
    </svg>
  );

  const InstagramIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  );

  const YoutubeIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  );

  return (
    <footer className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 border-t border-gray-800 w-full">
      {/* Main Footer Content */}
      <div className="px-6 py-10 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
          {/* Company Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-2 rounded-xl">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="font-bold text-lg bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">
                  EnvMonitor
                </span>
                <p className="text-[10px] text-gray-500">Federal Ministry of Environment</p>
              </div>
            </div>
            <p className="text-gray-400 text-sm leading-relaxed">
              Environmental Performance Tracking System - Empowering environmental stewardship through real-time monitoring, data-driven insights, and transparent governance.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a href="#" className="text-gray-500 hover:text-green-400 transition transform hover:scale-110">
                <TwitterIcon />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-400 transition transform hover:scale-110">
                <FacebookIcon />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-400 transition transform hover:scale-110">
                <LinkedInIcon />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-400 transition transform hover:scale-110">
                <InstagramIcon />
              </a>
              <a href="#" className="text-gray-500 hover:text-green-400 transition transform hover:scale-110">
                <YoutubeIcon />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Quick Links</h3>
            <ul className="space-y-2">
              <li><Link to="/" className="text-gray-400 hover:text-green-400 transition text-sm">Home</Link></li>
              <li><Link to="/features" className="text-gray-400 hover:text-green-400 transition text-sm">Features</Link></li>
              <li><Link to="/about" className="text-gray-400 hover:text-green-400 transition text-sm">About Us</Link></li>
              <li><Link to="/contact" className="text-gray-400 hover:text-green-400 transition text-sm">Contact</Link></li>
              <li><Link to="/public" className="text-gray-400 hover:text-green-400 transition text-sm">Public Portal</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2">
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition text-sm">Environmental Reports</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition text-sm">Performance Dashboard</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition text-sm">Support Center</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition text-sm">Privacy Policy</a></li>
              <li><a href="#" className="text-gray-400 hover:text-green-400 transition text-sm">Terms of Service</a></li>
            </ul>
          </div>

          {/* Contact Info - Nigerian Address */}
          <div>
            <h3 className="font-semibold text-white text-sm uppercase tracking-wider mb-4">Contact Us</h3>
            <ul className="space-y-3 text-gray-400 text-sm">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                <span className="text-xs leading-relaxed">
                  Federal Ministry of Environment<br />
                  Block A, Ministry of Environment Headquarters<br />
                  Mabushi, Abuja, FCT<br />
                  Nigeria
                </span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-green-400" />
                <span>+234 9 123 4567</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-green-400" />
                <span>info@environment.gov.ng</span>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-4 h-4 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>support@envmonitor.gov.ng</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Environmental Stats Banner */}
      <div className="border-t border-gray-800 bg-gray-900/50">
        <div className="px-6 py-4 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-wrap justify-center gap-6 text-xs text-gray-400">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span>Active Environmental Monitoring</span>
              </div>
              <div className="flex items-center gap-2">
                <Leaf className="w-3 h-3 text-green-500" />
                <span>Sustainable Development Goals</span>
              </div>
              <div className="flex items-center gap-2">
                <svg className="w-3 h-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Nationwide Coverage</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Newsletter Section */}
      <div className="border-t border-gray-800">
        <div className="px-6 py-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="text-center sm:text-left">
                <h4 className="text-white text-sm font-semibold mb-1 flex items-center gap-2 justify-center sm:justify-start">
                  <Bell className="w-4 h-4 text-green-400" />
                  Environmental Updates
                </h4>
                <p className="text-gray-400 text-xs">Get the latest environmental news and project updates</p>
              </div>
              <form onSubmit={handleSubscribe} className="flex w-full sm:w-auto gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter your email address"
                  className="flex-1 sm:w-72 px-4 py-2 bg-white/10 border border-gray-700 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  required
                />
                <button 
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg text-sm font-medium hover:shadow-lg transition flex items-center gap-2"
                >
                  {subscribed ? (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Subscribed!
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Subscribe
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-gray-800 bg-black/20">
        <div className="px-6 py-4 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-gray-500 max-w-7xl mx-auto">
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span>&copy; {currentYear} Federal Ministry of Environment, Nigeria. All rights reserved.</span>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:flex items-center gap-1">
                <Heart className="w-3 h-3 text-red-500" />
                <span>Green Initiative</span>
              </span>
            </div>
            <div className="flex items-center gap-4 flex-wrap justify-center">
              <Link to="/terms" className="hover:text-green-400 transition">Terms</Link>
              <span>•</span>
              <Link to="/privacy" className="hover:text-green-400 transition">Privacy</Link>
              <span>•</span>
              <Link to="/cookies" className="hover:text-green-400 transition">Cookies</Link>
              <span>•</span>
              <Link to="/accessibility" className="hover:text-green-400 transition">Accessibility</Link>
              <div className="flex items-center gap-1 ml-2">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-gray-600">SSL Secure</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default LandingFooter;