// src/pages/LandingPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import LandingFooter from '../components/Landing/LandingFooter';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import Stats from '../components/Landing/Stats';
import CTA from '../components/Landing/CTA';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        <Stats />
        
        {/* Public Portal CTA Section */}
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Want to Track Projects in Your Community?
            </h2>
            <p className="text-lg text-primary-100 mb-8 max-w-2xl mx-auto">
              Join our public portal to monitor project progress, share feedback, 
              and help ensure accountability in your community.
            </p>
            <Link
              to="/public"
              className="inline-flex items-center gap-2 bg-white text-primary-600 px-6 py-3 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
            >
              Visit Public Portal →
            </Link>
          </div>
        </div>
        
        <CTA />
      </main>
      <LandingFooter />
    </div>
  );
};

export default LandingPage;