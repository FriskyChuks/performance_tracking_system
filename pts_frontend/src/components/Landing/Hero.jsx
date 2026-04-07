// src/components/Landing/Hero.jsx
import React from 'react';
import { ArrowRight, TrendingUp, Target, Award } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <div className="relative bg-gradient-to-br from-primary-50 via-white to-secondary-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow"></div>
        <div className="absolute bottom-20 right-10 w-72 h-72 bg-secondary-200 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-pulse-slow animation-delay-2000"></div>
      </div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32">
        <div className="text-center">
          <div className="animate-fade-in">
            <h1 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent mb-6">
              Federal Ministry of Environment
            </h1>
            <h2 className="text-5xl md:text-7xl font-extrabold bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-600 bg-clip-text text-transparent mb-6">
              Performance Tracking System
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Transform your organization's performance with real-time tracking, 
              insightful analytics, and data-driven decision making
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
            <Link
              to="/register"
              className="btn-primary text-lg px-8 py-3 inline-flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              to="/login"
              className="btn-outline text-lg px-8 py-3 inline-flex items-center gap-2"
            >
              Sign In
            </Link>
          </div>
          
          {/* Stats preview */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="card p-6 text-center transform hover:scale-105 transition-all">
              <TrendingUp className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-gray-600">Uptime Guarantee</div>
            </div>
            <div className="card p-6 text-center transform hover:scale-105 transition-all">
              <Target className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">50+</div>
              <div className="text-gray-600">Active Ministries</div>
            </div>
            <div className="card p-6 text-center transform hover:scale-105 transition-all">
              <Award className="w-12 h-12 text-primary-600 mx-auto mb-3" />
              <div className="text-3xl font-bold text-gray-900">1000+</div>
              <div className="text-gray-600">Projects Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;