// src/pages/LandingPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Layout/Navbar';
import LandingFooter from '../components/Landing/LandingFooter';
import Hero from '../components/Landing/Hero';
import Features from '../components/Landing/Features';
import Stats from '../components/Landing/Stats';
import CTA from '../components/Landing/CTA';
import mainApi from '../services/mainApi';
import toast from 'react-hot-toast';

const LandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [deliverablesData, setDeliverablesData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [agenciesData, setAgenciesData] = useState([]);
  const [priorityAreasData, setPriorityAreasData] = useState([]);
  const [initiativesData, setInitiativesData] = useState([]);

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      setLoading(true);
      
      const [
        statsRes,
        deliverablesRes,
        departmentsRes,
        agenciesRes,
        priorityAreasRes,
        initiativesRes
      ] = await Promise.all([
        mainApi.public.getDashboardStats(),
        mainApi.public.getDeliverables(),
        mainApi.public.getDepartments(),
        mainApi.public.getAgencies(),
        mainApi.public.getPriorityAreas(),
        mainApi.public.getInitiatives()
      ]);
      
      setStatsData(statsRes.data);
      setDeliverablesData(deliverablesRes.data);
      setDepartmentsData(departmentsRes.data);
      setAgenciesData(agenciesRes.data);
      setPriorityAreasData(priorityAreasRes.data);
      setInitiativesData(initiativesRes.data);
      
    } catch (error) {
      console.error('Error fetching landing data:', error);
      toast.error('Failed to load landing page data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-500">Loading...</p>
          </div>
        </div>
        <LandingFooter />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero stats={statsData} />
        <Features 
          deliverables={deliverablesData}
          stats={{
            totalDeliverables: statsData?.total_deliverables || 0,
            totalDepartments: statsData?.total_departments || 0,
            totalAgencies: statsData?.total_agencies || 0,
          }}
        />
        <Stats statsData={statsData} />
        
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