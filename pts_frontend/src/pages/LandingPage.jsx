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
import { useAuth } from '../hooks/useAuth';

const LandingPage = () => {
  const [loading, setLoading] = useState(true);
  const [statsData, setStatsData] = useState(null);
  const [deliverablesData, setDeliverablesData] = useState([]);
  const [departmentsData, setDepartmentsData] = useState([]);
  const [agenciesData, setAgenciesData] = useState([]);
  const [priorityAreasData, setPriorityAreasData] = useState([]);
  const [activitiesData, setActivitiesData] = useState([]);
  const [indicatorsData, setIndicatorsData] = useState([]);
  const { user, userRole } = useAuth();

  useEffect(() => {
    fetchLandingData();
  }, []);

  const fetchLandingData = async () => {
    try {
      setLoading(true);
      
      const [
        priorityAreas,
        departments,
        agencies,
        deliverables,
        indicators,
        activities
      ] = await Promise.all([
        mainApi.getPublicPriorityAreas(),
        mainApi.getPublicDepartments(),
        mainApi.getPublicAgencies(),
        mainApi.getPublicDeliverables(),
        mainApi.getPublicIndicators(),
        mainApi.getPublicActivities()
      ]);
      
      setPriorityAreasData(priorityAreas || []);
      setDepartmentsData(departments || []);
      setAgenciesData(agencies || []);
      setDeliverablesData(deliverables || []);
      setIndicatorsData(indicators || []);
      setActivitiesData(activities || []);
      
      // Calculate stats
      const totalIndicators = indicators?.length || 0;
      const totalDeliverables = deliverables?.length || 0;
      const totalDepartments = departments?.length || 0;
      const totalAgencies = agencies?.length || 0;
      const totalPriorityAreas = priorityAreas?.length || 0;
      const totalActivities = activities?.length || 0;
      
      // Calculate average performance (simplified - would come from API in production)
      const avgPerformance = 4.2; // Placeholder
      const completionRate = 78; // Placeholder
      
      setStatsData({
        total_priority_areas: totalPriorityAreas,
        total_deliverables: totalDeliverables,
        total_indicators: totalIndicators,
        total_departments: totalDepartments,
        total_agencies: totalAgencies,
        total_activities: totalActivities,
        avg_performance_rating: avgPerformance,
        completion_rate: completionRate
      });
      
    } catch (error) {
      console.error('Error fetching landing data:', error);
      toast.error('Failed to load landing page data');
      // Set fallback stats
      setStatsData({
        total_priority_areas: 8,
        total_deliverables: 0,
        total_indicators: 0,
        total_departments: 0,
        total_agencies: 0,
        total_activities: 0,
        avg_performance_rating: 0,
        completion_rate: 0
      });
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
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
        <Hero stats={statsData} user={user} />
        <Features 
          deliverables={deliverablesData}
          indicators={indicatorsData}
          stats={{
            totalDeliverables: statsData?.total_deliverables || 0,
            totalDepartments: statsData?.total_departments || 0,
            totalAgencies: statsData?.total_agencies || 0,
            totalIndicators: statsData?.total_indicators || 0
          }}
        />
        <Stats statsData={statsData} />
        
        {/* Public Portal CTA Section */}
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Want to Track Projects in Your Community?
            </h2>
            <p className="text-lg text-green-100 mb-8 max-w-2xl mx-auto">
              Join our public portal to monitor project progress, share feedback, 
              and help ensure accountability in your community.
            </p>
            <Link
              to="/public"
              className="inline-flex items-center gap-2 bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:shadow-xl transform hover:scale-105 transition-all"
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