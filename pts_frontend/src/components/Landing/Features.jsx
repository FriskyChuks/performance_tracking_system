// src/components/Landing/Features.jsx
import React from 'react';
import { 
  LineChart, 
  Users, 
  Bell, 
  Shield, 
  RefreshCw, 
  BarChart3 
} from 'lucide-react';

const features = [
  {
    icon: LineChart,
    title: 'Real-time Analytics',
    description: 'Track performance metrics in real-time with beautiful, interactive charts and dashboards.'
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Collaborate seamlessly with team members and stakeholders across different ministries.'
  },
  {
    icon: Bell,
    title: 'Smart Alerts',
    description: 'Get instant notifications when targets are met or when attention is needed.'
  },
  {
    icon: Shield,
    title: 'Secure Data',
    description: 'Enterprise-grade security to protect your sensitive performance data.'
  },
  {
    icon: RefreshCw,
    title: 'Automated Reports',
    description: 'Generate comprehensive reports automatically and share them with stakeholders.'
  },
  {
    icon: BarChart3,
    title: 'Custom KPIs',
    description: 'Define and track custom KPIs that matter most to your organization.'
  }
];

const Features = () => {
  return (
    <div className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Powerful Features for Modern Organizations
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Everything you need to track, analyze, and improve organizational performance
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="card p-8 hover:shadow-2xl transition-all transform hover:-translate-y-1 animate-fade-in"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="bg-gradient-to-r from-primary-100 to-secondary-100 rounded-lg w-14 h-14 flex items-center justify-center mb-5">
                  <Icon className="w-7 h-7 text-primary-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Features;