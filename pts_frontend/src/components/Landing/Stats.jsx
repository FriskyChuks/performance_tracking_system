// src/components/Landing/Stats.jsx - Simplified version
import React from 'react';
import { TrendingUp, Users, CheckCircle, Award } from 'lucide-react';

const Stats = () => {
  const stats = [
    {
      icon: TrendingUp,
      value: '156%',
      label: 'Average ROI Increase',
    },
    {
      icon: Users,
      value: '5,000+',
      label: 'Active Users',
    },
    {
      icon: CheckCircle,
      value: '95%',
      label: 'Target Achievement Rate',
    },
    {
      icon: Award,
      value: '250+',
      label: 'Awards Recognized',
    },
  ];
  
  return (
    <div className="bg-gradient-to-br from-primary-900 to-primary-800 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={index} className="text-center text-white">
                <div className="bg-white/10 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-10 h-10 text-white" />
                </div>
                <div className="text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-lg text-primary-100">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stats;