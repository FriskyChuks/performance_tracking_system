// src/components/Layout/BottomNav.jsx
import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
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
  Sparkles,
  CheckCircle,
  Award,
  Bell,
  MessageSquare,
  Eye,
  Globe,
  BarChart3,
  Activity
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const BottomNav = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const [systemStatus, setSystemStatus] = useState('online');
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeUsers, setActiveUsers] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Simulate real-time updates
  useEffect(() => {
    // Update last updated timestamp every 30 seconds
    const interval = setInterval(() => {
      setLastUpdated(new Date());
    }, 30000);
    
    // Simulate active users count
    const userInterval = setInterval(() => {
      setActiveUsers(Math.floor(Math.random() * 20) + 5);
    }, 60000);
    
    return () => {
      clearInterval(interval);
      clearInterval(userInterval);
    };
  }, []);

  const handleExport = async (type, data) => {
    try {
      toast.loading(`Exporting ${type}...`, { id: 'export' });
      
      // Simulate export delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Create sample export data
      const exportData = {
        timestamp: new Date().toISOString(),
        user: user?.email,
        type: type,
        data: data || { message: 'Sample export data' }
      };
      
      // Create JSON file for download
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}_export_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast.success(`${type} exported successfully!`, { id: 'export' });
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed. Please try again.', { id: 'export' });
    }
  };

  const handleGenerateReport = async () => {
    setIsGenerating(true);
    toast.loading('Generating report...', { id: 'report' });
    
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.success('Report generated successfully!', { id: 'report' });
      navigate('/dashboard/reports');
    } catch (error) {
      console.error('Report generation error:', error);
      toast.error('Failed to generate report', { id: 'report' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async (content) => {
    const shareData = {
      title: 'Environmental Monitoring Dashboard',
      text: content || 'Check out this performance dashboard',
      url: window.location.href,
    };
    
    if (navigator.share) {
      try {
        await navigator.share(shareData);
        toast.success('Shared successfully!');
      } catch (error) {
        console.error('Share error:', error);
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copied to clipboard!');
      }
    } else {
      // Fallback for browsers that don't support Web Share API
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  };

  const handlePrint = () => {
    window.print();
    toast.success('Print dialog opened');
  };

  const handleQuickAction = (action) => {
    switch(action) {
      case 'new_activity':
        navigate('/dashboard/activities/new');
        toast.success('Creating new activity...');
        break;
      case 'my_tasks':
        if (userRole === 'delivery_officer') {
          navigate('/dashboard/my-tasks');
        } else {
          toast.error('Only Delivery Officers can access tasks');
        }
        break;
      case 'approvals':
        if (userRole === 'director') {
          navigate('/dashboard/pending-approvals');
        } else {
          toast.error('Only Directors can access approvals');
        }
        break;
      case 'assessments':
        if (userRole === 'sector_expert') {
          navigate('/dashboard/pending-assessments');
        } else {
          toast.error('Only Sector Experts can access assessments');
        }
        break;
      default:
        toast.info('Action triggered');
    }
  };

  // Get quick actions based on current page and user role
  const getQuickActions = () => {
    const path = location.pathname;
    const roleSpecificActions = [];
    
    // Role-specific primary actions
    if (userRole === 'project_admin') {
      roleSpecificActions.push({
        icon: Plus,
        label: 'New Activity',
        action: () => handleQuickAction('new_activity'),
        color: 'from-green-500 to-emerald-500',
        primary: true
      });
    } else if (userRole === 'delivery_officer') {
      roleSpecificActions.push({
        icon: CheckCircle,
        label: 'My Tasks',
        action: () => handleQuickAction('my_tasks'),
        color: 'from-yellow-500 to-orange-500',
        primary: true
      });
    } else if (userRole === 'director') {
      roleSpecificActions.push({
        icon: Award,
        label: 'Approvals',
        action: () => handleQuickAction('approvals'),
        color: 'from-purple-500 to-pink-500',
        primary: true
      });
    } else if (userRole === 'sector_expert') {
      roleSpecificActions.push({
        icon: Eye,
        label: 'Assessments',
        action: () => handleQuickAction('assessments'),
        color: 'from-indigo-500 to-purple-500',
        primary: true
      });
    }
    
    // Page-specific actions
    if (path === '/dashboard' || path === '/dashboard/') {
      return [
        ...roleSpecificActions,
        { icon: FileText, label: 'Generate Report', action: handleGenerateReport, color: 'from-blue-500 to-blue-600', disabled: isGenerating },
        { icon: Download, label: 'Export Data', action: () => handleExport('dashboard_data'), color: 'from-green-500 to-green-600' },
        { icon: Share2, label: 'Share Dashboard', action: () => handleShare('Dashboard overview'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/activities')) {
      return [
        ...roleSpecificActions,
        { icon: Download, label: 'Export List', action: () => handleExport('activities_list'), color: 'from-green-500 to-green-600' },
        { icon: Printer, label: 'Print List', action: handlePrint, color: 'from-gray-500 to-gray-600' },
        { icon: Share2, label: 'Share', action: () => handleShare('Activities list'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/reports')) {
      return [
        { icon: Download, label: 'Download PDF', action: () => handleExport('report_pdf'), color: 'from-red-500 to-red-600' },
        { icon: FileText, label: 'Export Excel', action: () => handleExport('report_excel'), color: 'from-green-500 to-green-600' },
        { icon: Printer, label: 'Print', action: handlePrint, color: 'from-gray-500 to-gray-600' },
        { icon: Share2, label: 'Share Report', action: () => handleShare('Performance report'), color: 'from-purple-500 to-purple-600' },
      ];
    } else if (path.includes('/my-tasks')) {
      return [
        { icon: CheckCircle, label: 'Mark Complete', action: () => toast.success('Task marked as complete'), color: 'from-green-500 to-emerald-500', primary: true },
        { icon: Clock, label: 'Request Extension', action: () => toast.info('Extension request sent'), color: 'from-yellow-500 to-orange-500' },
        { icon: FileText, label: 'Add Note', action: () => toast.info('Add note feature coming soon'), color: 'from-blue-500 to-blue-600' },
      ];
    } else if (path.includes('/pending-approvals')) {
      return [
        { icon: CheckCircle, label: 'Bulk Approve', action: () => toast.success('Bulk approval initiated'), color: 'from-green-500 to-emerald-500', primary: true },
        { icon: FileText, label: 'Review Details', action: () => toast.info('Review details panel opened'), color: 'from-blue-500 to-blue-600' },
        { icon: Download, label: 'Export List', action: () => handleExport('pending_approvals'), color: 'from-gray-500 to-gray-600' },
      ];
    } else if (path.includes('/pending-assessments')) {
      return [
        { icon: Eye, label: 'Start Assessment', action: () => toast.info('Assessment form opened'), color: 'from-purple-500 to-indigo-500', primary: true },
        { icon: FileText, label: 'Assessment Guide', action: () => toast.info('Opening assessment guide...'), color: 'from-blue-500 to-blue-600' },
        { icon: Download, label: 'Export Data', action: () => handleExport('assessments'), color: 'from-green-500 to-green-600' },
      ];
    }
    
    // Default actions
    return [
      ...roleSpecificActions,
      { icon: BarChart3, label: 'Analytics', action: () => navigate('/dashboard/reports'), color: 'from-blue-500 to-blue-600' },
      { icon: Calendar, label: 'Schedule', action: () => toast.info('Scheduler coming soon'), color: 'from-cyan-500 to-blue-600' },
      { icon: Globe, label: 'Public Portal', action: () => window.open('/public', '_blank'), color: 'from-teal-500 to-green-600' },
    ];
  };
  
  const quickActions = getQuickActions();

  // Don't show bottom nav on public pages
  if (location.pathname === '/' || location.pathname === '/login' || location.pathname === '/register' || location.pathname === '/public') {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-20 lg:left-72 transition-all duration-300">
      <div className="bg-white/95 backdrop-blur-xl border-t border-gray-200/50 shadow-lg">
        <div className="flex items-center justify-between px-4 py-2 lg:px-6">
          {/* Left side - Status info */}
          <div className="hidden lg:flex items-center gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemStatus === 'online' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <span>System {systemStatus === 'online' ? 'Online' : 'Offline'}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>{activeUsers} active users</span>
            </div>
            {userRole && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span className="capitalize">{userRole.replace('_', ' ')}</span>
              </div>
            )}
          </div>
          
          {/* Right side - Quick Actions */}
          <div className="flex items-center gap-2 w-full lg:w-auto justify-around lg:justify-end">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              const isPrimary = action.primary;
              
              return (
                <button
                  key={index}
                  onClick={action.action}
                  disabled={action.disabled}
                  className="group relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg hover:shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className={`absolute inset-0 rounded-lg bg-gradient-to-r ${action.color} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <Icon className={`w-4 h-4 relative z-10 ${isPrimary ? 'text-green-600' : 'text-gray-500'} group-hover:text-white transition-colors ${action.disabled ? 'animate-pulse' : ''}`} />
                  <span className={`text-[10px] font-medium relative z-10 ${isPrimary ? 'text-green-600' : 'text-gray-500'} group-hover:text-white transition-colors hidden sm:inline`}>
                    {action.label}
                  </span>
                  {isPrimary && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                  )}
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