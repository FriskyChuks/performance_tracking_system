// src/components/Layout/BottomNav.jsx
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Plus, 
  FileText, 
  Download, 
  Share2, 
  Printer,
  TrendingUp,
  Users,
  Target,
  Calendar,
  Clock,
  Sparkles
} from 'lucide-react';

const BottomNav = () => {
  const location = useLocation();
  
  // Different quick actions based on current page
  const getQuickActions = () => {
    const path = location.pathname;
    
    if (path === '/dashboard' || path === '/dashboard/') {
      return [
        { icon: Plus, label: 'Quick Project', action: () => window.location.href = '/dashboard/projects/new', color: 'from-primary-500 to-primary-600' },
        { icon: FileText, label: 'Generate Report', action: () => console.log('Generate report'), color: 'from-blue-500 to-blue-600' },
        { icon: Download, label: 'Export Data', action: () => console.log('Export data'), color: 'from-green-500 to-green-600' },
        { icon: Share2, label: 'Share Dashboard', action: () => console.log('Share dashboard'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/projects')) {
      return [
        { icon: Plus, label: 'New Project', action: () => window.location.href = '/dashboard/projects/new', color: 'from-primary-500 to-primary-600' },
        { icon: Download, label: 'Export Projects', action: () => console.log('Export projects'), color: 'from-green-500 to-green-600' },
        { icon: Printer, label: 'Print List', action: () => window.print(), color: 'from-gray-500 to-gray-600' },
        { icon: Share2, label: 'Share', action: () => console.log('Share'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/reports')) {
      return [
        { icon: Download, label: 'Download PDF', action: () => console.log('Download PDF'), color: 'from-red-500 to-red-600' },
        { icon: FileText, label: 'Export Excel', action: () => console.log('Export Excel'), color: 'from-green-500 to-green-600' },
        { icon: Printer, label: 'Print', action: () => window.print(), color: 'from-gray-500 to-gray-600' },
        { icon: Share2, label: 'Share Report', action: () => console.log('Share report'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/ministries') || path.includes('/priority-areas') || path.includes('/deliverables')) {
      return [
        { icon: Plus, label: 'Add New', action: () => console.log('Add new'), color: 'from-primary-500 to-primary-600' },
        { icon: Download, label: 'Export List', action: () => console.log('Export list'), color: 'from-green-500 to-green-600' },
        { icon: TrendingUp, label: 'Analytics', action: () => console.log('View analytics'), color: 'from-blue-500 to-blue-600' },
        { icon: Share2, label: 'Share', action: () => console.log('Share'), color: 'from-purple-500 to-purple-600' },
      ];
    }
    
    return [
      { icon: Sparkles, label: 'Quick Action', action: () => console.log('Quick action'), color: 'from-primary-500 to-primary-600' },
      { icon: Calendar, label: 'Schedule', action: () => console.log('Schedule'), color: 'from-blue-500 to-blue-600' },
      { icon: Target, label: 'Set Goal', action: () => console.log('Set goal'), color: 'from-green-500 to-green-600' },
      { icon: Users, label: 'Invite', action: () => console.log('Invite'), color: 'from-purple-500 to-purple-600' },
    ];
  };
  
  const quickActions = getQuickActions();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:left-80 transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 lg:px-6">
          {/* Left side - Status info */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
              <span>System Online</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: Just now</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>12 active users</span>
            </div>
          </div>
          
          {/* Right side - Quick Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-around lg:justify-end">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className="group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:shadow-lg transition-all duration-300"
                >
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <Icon className={`w-4 h-4 relative z-10 ${index === 0 ? 'text-primary-600' : 'text-gray-500'} group-hover:text-white transition-colors`} />
                  <span className={`text-[10px] font-medium relative z-10 ${index === 0 ? 'text-primary-600' : 'text-gray-500'} group-hover:text-white transition-colors hidden sm:inline`}>
                    {action.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BottomNav;