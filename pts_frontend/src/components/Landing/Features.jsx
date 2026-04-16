// src/components/Landing/Features.jsx
import React from 'react';
import { 
  Target,
  Award,
  TrendingUp,
  Leaf,
  Building2,
  Landmark,
  DollarSign,
  Factory,
  BarChart3
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getIconForDeliverable = (priorityAreaName, deliverableName) => {
  if (!priorityAreaName && !deliverableName) return Target;
  
  const name = (deliverableName || '').toLowerCase();
  const area = (priorityAreaName || '').toLowerCase();
  
  if (name.includes('economy') || name.includes('business') || name.includes('rank') || area.includes('economy')) return DollarSign;
  if (name.includes('agriculture') || name.includes('food') || name.includes('farm') || area.includes('agriculture')) return Leaf;
  if (name.includes('infrastructure') || name.includes('irrigation') || area.includes('infrastructure')) return Building2;
  if (name.includes('industry') || name.includes('manufacturing')) return Factory;
  if (name.includes('growth') || name.includes('development')) return TrendingUp;
  
  return Target;
};

const getGradientForDeliverable = (priorityAreaName) => {
  if (!priorityAreaName) return 'from-teal-500 to-cyan-500';
  
  const area = priorityAreaName.toLowerCase();
  
  if (area.includes('economy')) return 'from-blue-500 to-indigo-500';
  if (area.includes('agriculture')) return 'from-green-500 to-emerald-500';
  if (area.includes('infrastructure')) return 'from-orange-500 to-red-500';
  if (area.includes('governance')) return 'from-purple-500 to-pink-500';
  if (area.includes('education')) return 'from-yellow-500 to-amber-500';
  if (area.includes('health')) return 'from-red-500 to-rose-500';
  
  return 'from-teal-500 to-cyan-500';
};

const formatPriorityArea = (priorityAreaName) => {
  if (!priorityAreaName) return 'Priority Area';
  if (priorityAreaName.length > 40) {
    return priorityAreaName.substring(0, 37) + '...';
  }
  return priorityAreaName;
};

const formatTargetValue = (value, unit) => {
  if (!value || value === 'N/A') return 'Not set';
  
  const numValue = parseFloat(value);
  if (isNaN(numValue)) {
    if (unit === 'rank') return `#${value} in global ranking`;
    return `${value} ${unit}`;
  }
  
  if (unit === '%') return `${numValue}%`;
  if (unit === 'rank') return `#${numValue} in global ranking`;
  if (unit === 'businesses') return `${numValue.toLocaleString()} businesses`;
  if (unit === 'beneficiaries') return `${numValue.toLocaleString()} beneficiaries`;
  if (unit === 'unit') return `${numValue.toLocaleString()} units`;
  return `${numValue.toLocaleString()} ${unit}`;
};

const Features = ({ deliverables, stats }) => {
  const displayDeliverables = deliverables?.slice(0, 6) || [];

  return (
    <div className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm mb-4">
            <Target className="w-4 h-4" />
            <span>Strategic Deliverables</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Key Performance Deliverables
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Track progress against critical national development priorities
          </p>
        </div>
        
        {displayDeliverables.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No deliverables available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayDeliverables.map((deliverable, index) => {
              const Icon = getIconForDeliverable(deliverable.priority_area_name, deliverable.name);
              const gradient = getGradientForDeliverable(deliverable.priority_area_name);
              const shortPriorityArea = formatPriorityArea(deliverable.priority_area_name);
              
              return (
                <div
                  key={deliverable.id}
                  className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 animate-fade-in-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className={`bg-gradient-to-r ${gradient} p-5 relative overflow-hidden`}>
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-all duration-500"></div>
                    <div className="flex items-center justify-between relative z-10">
                      <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                        <Icon className="w-8 h-8 text-white" />
                      </div>
                      <div className="bg-white/20 backdrop-blur-sm rounded-lg px-2 py-1 text-xs text-white font-medium">
                        {shortPriorityArea}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{deliverable.name}</h3>
                    
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-primary-50 rounded-lg mb-3">
                      <Target className="w-3 h-3 text-primary-600" />
                      <span className="text-xs font-medium text-primary-700">
                        Target: {formatTargetValue(deliverable.target_value, deliverable.unit)}
                      </span>
                    </div>
                    
                    <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                      This deliverable is part of the <span className="font-medium text-gray-900">{deliverable.priority_area_name || 'priority'}</span> initiative.
                    </p>
                    
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                        <span>Status</span>
                        <span className={deliverable.is_achieved ? 'text-green-600' : 'text-yellow-600'}>
                          {deliverable.is_achieved ? 'Achieved ✓' : 'In Progress'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            deliverable.is_achieved ? 'bg-green-500 w-full' : 'bg-yellow-500 w-1/2'
                          }`}
                        />
                      </div>
                    </div>
                    
                    <Link
                      to="/public"
                      className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1 group/link"
                    >
                      Track progress 
                      <span className="group-hover/link:translate-x-1 transition-transform">→</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        
        {/* Bottom CTA with Real Stats */}
        <div className="text-center mt-16">
          <div className="inline-flex flex-wrap items-center justify-center gap-4 mb-6 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span>{stats?.totalDeliverables || 0} Active Deliverables</span>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5" />
              <span>{stats?.totalDepartments || 0} Departments</span>
            </div>
            <div className="flex items-center gap-2">
              <Landmark className="w-3.5 h-3.5" />
              <span>{stats?.totalAgencies || 0} Agencies</span>
            </div>
          </div>
          <Link
            to="/public"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Award className="w-5 h-5" />
            View All Deliverables
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Features;