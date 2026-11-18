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
  BarChart3,
  Droplets,
  Trees,
  Wind,
  Recycle
} from 'lucide-react';
import { Link } from 'react-router-dom';

const getIconForIndicator = (indicatorName, deliverableName) => {
  const name = (indicatorName || deliverableName || '').toLowerCase();
  
  if (name.includes('forest') || name.includes('tree') || name.includes('reforest')) return Trees;
  if (name.includes('water') || name.includes('river') || name.includes('flood')) return Droplets;
  if (name.includes('air') || name.includes('emission') || name.includes('quality')) return Wind;
  if (name.includes('waste') || name.includes('recycle')) return Recycle;
  if (name.includes('economy') || name.includes('business')) return DollarSign;
  if (name.includes('agriculture') || name.includes('food') || name.includes('farm')) return Leaf;
  if (name.includes('infrastructure') || name.includes('irrigation')) return Building2;
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
  if (area.includes('energy')) return 'from-amber-500 to-orange-500';
  if (area.includes('natural')) return 'from-emerald-500 to-teal-500';
  
  return 'from-teal-500 to-cyan-500';
};

const formatPriorityArea = (priorityAreaName) => {
  if (!priorityAreaName) return 'Priority Area';
  if (priorityAreaName.length > 40) {
    return priorityAreaName.substring(0, 37) + '...';
  }
  return priorityAreaName;
};

const formatTargetValue = (targetValue, unit) => {
  if (!targetValue) return 'Not set';
  
  const numValue = parseFloat(targetValue);
  if (isNaN(numValue)) {
    return `${targetValue} ${unit || ''}`;
  }
  
  if (unit === '%') return `${numValue}%`;
  if (unit === 'hectares') return `${numValue.toLocaleString()} hectares`;
  if (unit === 'tons') return `${numValue.toLocaleString()} tons`;
  if (unit === 'sites') return `${numValue.toLocaleString()} sites`;
  if (unit === 'km') return `${numValue.toLocaleString()} km`;
  return `${numValue.toLocaleString()} ${unit || 'units'}`;
};

const Features = ({ deliverables, indicators, stats }) => {
  // Use indicators if available, otherwise fallback to deliverables
  const displayItems = indicators?.slice(0, 6) || deliverables?.slice(0, 6) || [];

  return (
    <div className="py-24 bg-gradient-to-b from-white to-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-50 text-green-600 text-sm mb-4">
            <Target className="w-4 h-4" />
            <span>Key Performance Indicators</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
            Environmental Performance Metrics
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Tracking progress against critical environmental sustainability goals
          </p>
        </div>
        
        {displayItems.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No performance indicators available at the moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {displayItems.map((item, index) => {
              const Icon = getIconForIndicator(item.name, item.deliverable_name);
              const gradient = getGradientForDeliverable(item.priority_area_name);
              const shortPriorityArea = formatPriorityArea(item.priority_area_name);
              const targetDisplay = formatTargetValue(item.target_value, item.unit);
              
              return (
                <div
                  key={item.id}
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
                    <h3 className="text-xl font-bold text-gray-900 mb-2 line-clamp-2">{item.name}</h3>
                    
                    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-50 rounded-lg mb-3">
                      <Target className="w-3 h-3 text-green-600" />
                      <span className="text-xs font-medium text-green-700">
                        Target: {targetDisplay}
                      </span>
                    </div>
                    
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-4 leading-relaxed line-clamp-2">
                        {item.description}
                      </p>
                    )}
                    
                    {item.deliverable_name && (
                      <div className="mt-4 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <span className="font-medium">Deliverable:</span>
                          <span className="text-gray-600">{item.deliverable_name}</span>
                        </div>
                      </div>
                    )}
                    
                    <Link
                      to="/public"
                      className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium flex items-center gap-1 group/link"
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
              <span>{stats?.totalIndicators || 0} Active Indicators</span>
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
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-xl font-semibold hover:shadow-xl transition-all transform hover:scale-105"
          >
            <Award className="w-5 h-5" />
            View All Indicators
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Features;