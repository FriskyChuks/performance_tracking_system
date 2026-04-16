// src/components/Landing/Stats.jsx
import React from 'react';
import { TrendingUp, Building2, Landmark, Target, Award, CheckCircle, Users } from 'lucide-react';

const Stats = ({ statsData }) => {
  const stats = [
    {
      icon: TrendingUp,
      value: statsData?.total_initiatives?.toLocaleString() || '0',
      label: 'Total Initiatives',
      suffix: '',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      icon: Building2,
      value: statsData?.total_departments?.toLocaleString() || '0',
      label: 'Departments',
      suffix: '',
      color: 'from-green-500 to-emerald-500'
    },
    {
      icon: Landmark,
      value: statsData?.total_agencies?.toLocaleString() || '0',
      label: 'Agencies',
      suffix: '',
      color: 'from-purple-500 to-pink-500'
    },
    {
      icon: Target,
      value: statsData?.total_deliverables?.toLocaleString() || '0',
      label: 'Deliverables',
      suffix: '',
      color: 'from-orange-500 to-red-500'
    },
    {
      icon: Award,
      value: statsData?.avg_performance_rating?.toFixed(1) || '0',
      label: 'Avg Performance Rating',
      suffix: '/5',
      color: 'from-yellow-500 to-amber-500'
    },
    {
      icon: CheckCircle,
      value: statsData?.completion_rate?.toFixed(1) || '0',
      label: 'Completion Rate',
      suffix: '%',
      color: 'from-teal-500 to-cyan-500'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/20 text-primary-300 text-sm mb-4">
            <Users className="w-4 h-4" />
            <span>Impact Dashboard</span>
          </div>
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Our Impact in Numbers
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto">
            Real-time metrics showing our commitment to environmental stewardship
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div
                key={index}
                className="group relative bg-white/5 backdrop-blur-sm rounded-2xl p-6 text-center border border-white/10 hover:bg-white/10 transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.color} opacity-0 group-hover:opacity-5 rounded-2xl transition-opacity duration-500`}></div>
                <div className="relative z-10">
                  <div className="inline-flex p-3 bg-white/10 rounded-xl mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-6 h-6 text-primary-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">
                    {stat.value}
                    {stat.suffix && <span className="text-lg text-gray-400 ml-0.5">{stat.suffix}</span>}
                  </div>
                  <div className="text-sm text-gray-400">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Stats;