// src/components/Layout/QuickActionsBar.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { 
  Plus, 
  Download, 
  Share2, 
  Filter, 
  Calendar,
  TrendingUp,
  Users,
  Target,
  FileText,
  Printer,
  Mail,
  Settings,
  Grid3x3,
  List,
  BarChart3,
  PieChart,
  Clock,
  Zap
} from 'lucide-react';

const QuickActionsBar = ({ viewMode, setViewMode, onExport, onFilter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Different quick actions based on current page
  const getPageConfig = () => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/dashboard/') {
      return {
        title: 'Dashboard Controls',
        icon: <TrendingUp className="w-4 h-4" />,
        actions: [
          { icon: Plus, label: 'Quick Project', onClick: () => navigate('/dashboard/projects/new'), color: 'from-primary-500 to-primary-600', gradient: 'primary' },
          { icon: FileText, label: 'Generate Report', onClick: () => navigate('/dashboard/reports'), color: 'from-blue-500 to-blue-600', gradient: 'blue' },
          { icon: Download, label: 'Export Dashboard', onClick: onExport, color: 'from-green-500 to-green-600', gradient: 'green' },
          { icon: Share2, label: 'Share', onClick: () => console.log('Share'), color: 'from-purple-500 to-purple-600', gradient: 'purple' },
        ],
        filters: [
          { icon: Calendar, label: 'This Week', active: true },
          { icon: Calendar, label: 'This Month', active: false },
          { icon: Calendar, label: 'This Quarter', active: false },
        ]
      };
    } 
    else if (path.includes('/projects')) {
      return {
        title: 'Project Management',
        icon: <Target className="w-4 h-4" />,
        actions: [
          { icon: Plus, label: 'New Project', onClick: () => navigate('/dashboard/projects/new'), color: 'from-primary-500 to-primary-600', gradient: 'primary' },
          { icon: Download, label: 'Export', onClick: onExport, color: 'from-green-500 to-green-600', gradient: 'green' },
          { icon: Printer, label: 'Print', onClick: () => window.print(), color: 'from-gray-500 to-gray-600', gradient: 'gray' },
          { icon: Share2, label: 'Share', onClick: () => console.log('Share'), color: 'from-purple-500 to-purple-600', gradient: 'purple' },
        ],
        filters: [
          { icon: Grid3x3, label: 'Grid View', active: viewMode === 'grid', onClick: () => setViewMode('grid') },
          { icon: List, label: 'List View', active: viewMode === 'list', onClick: () => setViewMode('list') },
          { icon: Filter, label: 'Filter', active: false, onClick: onFilter },
        ]
      };
    } 
    else if (path.includes('/reports')) {
      return {
        title: 'Report Actions',
        icon: <BarChart3 className="w-4 h-4" />,
        actions: [
          { icon: Download, label: 'Download PDF', onClick: onExport, color: 'from-red-500 to-red-600', gradient: 'red' },
          { icon: FileText, label: 'Export Excel', onClick: onExport, color: 'from-green-500 to-green-600', gradient: 'green' },
          { icon: Mail, label: 'Email Report', onClick: () => console.log('Email'), color: 'from-blue-500 to-blue-600', gradient: 'blue' },
          { icon: Printer, label: 'Print', onClick: () => window.print(), color: 'from-gray-500 to-gray-600', gradient: 'gray' },
        ],
        filters: [
          { icon: PieChart, label: 'Summary', active: true },
          { icon: BarChart3, label: 'Detailed', active: false },
          { icon: TrendingUp, label: 'Trends', active: false },
        ]
      };
    }
    else if (path.includes('/ministries') || path.includes('/priority-areas') || path.includes('/deliverables')) {
      return {
        title: 'Hierarchy Management',
        icon: <Users className="w-4 h-4" />,
        actions: [
          { icon: Plus, label: 'Add New', onClick: () => console.log('Add new'), color: 'from-primary-500 to-primary-600', gradient: 'primary' },
          { icon: Download, label: 'Export List', onClick: onExport, color: 'from-green-500 to-green-600', gradient: 'green' },
          { icon: TrendingUp, label: 'Analytics', onClick: () => console.log('Analytics'), color: 'from-blue-500 to-blue-600', gradient: 'blue' },
          { icon: Share2, label: 'Share', onClick: () => console.log('Share'), color: 'from-purple-500 to-purple-600', gradient: 'purple' },
        ],
        filters: [
          { icon: Target, label: 'Active', active: true },
          { icon: Clock, label: 'Pending', active: false },
          { icon: Zap, label: 'Completed', active: false },
        ]
      };
    }
    
    return {
      title: 'Quick Actions',
      icon: <Zap className="w-4 h-4" />,
      actions: [
        { icon: Plus, label: 'Create', onClick: () => console.log('Create'), color: 'from-primary-500 to-primary-600', gradient: 'primary' },
        { icon: Settings, label: 'Settings', onClick: () => navigate('/dashboard/settings'), color: 'from-gray-500 to-gray-600', gradient: 'gray' },
        { icon: Share2, label: 'Share', onClick: () => console.log('Share'), color: 'from-purple-500 to-purple-600', gradient: 'purple' },
      ],
      filters: []
    };
  };

  const config = getPageConfig();

  return (
    <div className="sticky top-[73px] z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="px-4 py-2 lg:px-6">
        {/* Main Quick Actions Row */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left side - Title */}
          <div className="flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary-50 to-secondary-50">
                {config.icon}
              </div>
              <span>{config.title}</span>
            </div>
            
            {/* Action Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {config.actions.map((action, idx) => {
                const Icon = action.icon;
                const gradientColors = {
                  primary: 'from-primary-500 to-primary-600',
                  blue: 'from-blue-500 to-blue-600',
                  green: 'from-green-500 to-green-600',
                  purple: 'from-purple-500 to-purple-600',
                  red: 'from-red-500 to-red-600',
                  gray: 'from-gray-500 to-gray-600',
                };
                const gradient = gradientColors[action.gradient] || gradientColors.primary;
                
                return (
                  <button
                    key={idx}
                    onClick={action.onClick}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-md"
                  >
                    <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${gradient} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                    <Icon className={`w-3.5 h-3.5 relative z-10 ${idx === 0 ? 'text-primary-600' : 'text-gray-500'} group-hover:text-white transition-colors`} />
                    <span className={`relative z-10 ${idx === 0 ? 'text-primary-600' : 'text-gray-600'} group-hover:text-white transition-colors hidden sm:inline`}>
                      {action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right side - Filters */}
          {config.filters.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-gray-200 hidden lg:block"></div>
              <div className="flex items-center gap-1">
                {config.filters.map((filter, idx) => {
                  const Icon = filter.icon;
                  return (
                    <button
                      key={idx}
                      onClick={filter.onClick}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                        filter.active
                          ? 'bg-gradient-to-r from-primary-500 to-secondary-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{filter.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Animated bottom border */}
      <div className="h-0.5 bg-gradient-to-r from-primary-500/50 via-secondary-500/50 to-transparent"></div>
    </div>
  );
};

export default QuickActionsBar;