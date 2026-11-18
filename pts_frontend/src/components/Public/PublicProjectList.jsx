// src/components/Public/PublicProjectList.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  MessageCircle, 
  Eye,
  Search,
  Filter,
  Target,
  Building2,
  Landmark,
  Star,
  Clock,
  MapPin,
  ThumbsUp,
  ChevronDown,
  ChevronUp,
  X,
  RefreshCw,
  Activity,
  Image as ImageIcon
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import engagementApi from '../../services/engagementApi';
import toast from 'react-hot-toast';

const PublicProjectList = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    agency: '',
    status: '',
    year: ''
  });
  const [showFilters, setShowFilters] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    ongoing: 0,
    completed: 0,
    planning: 0
  });
  const [viewMode, setViewMode] = useState('grid');
  const [error, setError] = useState(null);
  
  const debounceTimerRef = useRef(null);

  // Debounced search
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      fetchActivities();
    }, 300);
    
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm, filters.department, filters.agency, filters.status, filters.year]);

  // Initial data fetch
  useEffect(() => {
    fetchFiltersData();
    fetchStats();
    fetchActivities();
  }, []);

  const fetchFiltersData = async () => {
    try {
      const [departments, agencies] = await Promise.all([
        mainApi.getPublicDepartments(),
        mainApi.getPublicAgencies()
      ]);
      setDepartmentsList(departments || []);
      setAgenciesList(agencies || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const activitiesData = await mainApi.getPublicActivities();
      console.log('Public activities for stats:', activitiesData);
      
      let allActivities = [];
      if (Array.isArray(activitiesData)) {
        allActivities = activitiesData;
      } else if (activitiesData && activitiesData.results) {
        allActivities = activitiesData.results;
      } else if (activitiesData && typeof activitiesData === 'object') {
        allActivities = Object.values(activitiesData).find(v => Array.isArray(v)) || [];
      }
      
      setStats({
        total: allActivities.length,
        ongoing: allActivities.filter(a => a.status === 'ongoing').length,
        completed: allActivities.filter(a => a.status === 'completed').length,
        planning: allActivities.filter(a => a.status === 'planning').length
      });
      
      const years = [...new Set(allActivities.map(a => new Date(a.start_date).getFullYear()))].sort((a, b) => b - a);
      setAvailableYears(years);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchActivities = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build params object
      const params = {};
      if (searchTerm && searchTerm.trim()) {
        params.search = searchTerm.trim();
      }
      if (filters.department) {
        params.department = filters.department;
      }
      if (filters.agency) {
        params.agency = filters.agency;
      }
      if (filters.status) {
        params.status = filters.status;
      }
      
      console.log('Fetching public activities with params:', params);
      
      let activitiesData = await mainApi.getPublicActivities(params);
      console.log('Public activities response:', activitiesData);
      
      // Handle different response formats
      let allActivities = [];
      if (Array.isArray(activitiesData)) {
        allActivities = activitiesData;
      } else if (activitiesData && activitiesData.results) {
        allActivities = activitiesData.results;
      } else if (activitiesData && typeof activitiesData === 'object') {
        // Try to find the array in the object
        allActivities = Object.values(activitiesData).find(v => Array.isArray(v)) || [];
      }
      
      console.log('Processed activities:', allActivities.length);
      
      // Filter by year client-side if needed
      if (filters.year) {
        allActivities = allActivities.filter(a => 
          new Date(a.start_date).getFullYear() === parseInt(filters.year)
        );
      }
      
      // Fetch images and comments for each activity
      const activitiesWithDetails = await Promise.all(
        allActivities.map(async (activity) => {
          try {
            const [images, comments] = await Promise.all([
              engagementApi.getActivityImages(activity.id).catch(() => []),
              engagementApi.getActivityComments(activity.id).catch(() => [])
            ]);
            
            return {
              ...activity,
              images: images || [],
              comment_count: comments?.length || 0,
              has_location: !!(activity.latitude && activity.longitude),
              performance: activity.overall_performance || 0
            };
          } catch (error) {
            console.error(`Error fetching details for activity ${activity.id}:`, error);
            return { 
              ...activity, 
              images: [], 
              comment_count: 0, 
              has_location: !!(activity.latitude && activity.longitude),
              performance: activity.overall_performance || 0
            };
          }
        })
      );
      
      setActivities(activitiesWithDetails);
      
      // Update stats after filtering
      setStats({
        total: activitiesWithDetails.length,
        ongoing: activitiesWithDetails.filter(a => a.status === 'ongoing').length,
        completed: activitiesWithDetails.filter(a => a.status === 'completed').length,
        planning: activitiesWithDetails.filter(a => a.status === 'planning').length
      });
      
    } catch (error) {
      console.error('Error fetching activities:', error);
      setError(error.message || 'Failed to load activities');
      toast.error('Failed to load activities');
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchActivities();
    toast.success('Refreshing projects...');
  };

  const resetFilters = () => {
    setFilters({
      department: '',
      agency: '',
      status: '',
      year: ''
    });
    setSearchTerm('');
  };

  const getStatusConfig = (status) => {
    const configs = {
      'planning': { label: 'Planning', color: 'bg-gray-100 text-gray-700', icon: '📝' },
      'ongoing': { label: 'Ongoing', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', icon: '✅' },
      'on_hold': { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '❌' }
    };
    return configs[status] || configs.planning;
  };

  const getActiveFilterCount = () => {
    return Object.values(filters).filter(v => v && v !== '').length;
  };

  const ActivityCard = ({ activity }) => {
    const primaryImage = activity.images?.find(img => img.is_primary) || activity.images?.[0];
    const imageUrl = primaryImage ? (primaryImage.image_url || primaryImage.image) : null;
    const statusConfig = getStatusConfig(activity.status);
    const hasLocation = activity.has_location || (activity.latitude && activity.longitude);
    const performance = activity.performance || 0;

    return (
      <Link
        to={`/public/projects/${activity.id}`}
        className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 block"
      >
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={activity.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/600x400/22c55e/white?text=${encodeURIComponent(activity.title?.charAt(0) || 'P')}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-green-100 to-green-50">
              <Activity className="w-12 h-12 text-green-400 mb-2" />
              <span className="text-sm text-gray-500">No image available</span>
            </div>
          )}
          
          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium ${statusConfig.color} shadow-lg backdrop-blur-sm bg-white/90`}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
          
          {/* Location Badge */}
          {hasLocation && (
            <div className="absolute top-3 right-3">
              <div className="px-2 py-1 rounded-xl text-xs font-medium bg-amber-500 text-white shadow-lg backdrop-blur-sm">
                <MapPin className="w-3 h-3 inline mr-1" />
                Map Available
              </div>
            </div>
          )}
          
          {/* Performance Ring */}
          {performance > 0 && (
            <div className="absolute top-3 left-3">
              <div className="px-2 py-1 rounded-xl text-xs font-medium bg-black/50 text-white backdrop-blur-sm">
                {Math.round(performance)}% Complete
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-5">
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-green-600 transition duration-300">
            {activity.title}
          </h3>
          
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {activity.description || 'No description available'}
          </p>
          
          {/* Meta Information */}
          <div className="space-y-2 mb-4">
            {(activity.department_name || activity.agency_name) && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-blue-600" />
                </div>
                <span className="truncate">{activity.department_name || activity.agency_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-green-600" />
              </div>
              <span>Started: {new Date(activity.start_date).toLocaleDateString()}</span>
            </div>
          </div>
          
          {/* Progress Bar */}
          {performance > 0 && (
            <div className="mb-3">
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(performance, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{activity.comment_count || 0}</span>
              </div>
              {activity.images?.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>{activity.images.length}</span>
                </div>
              )}
              {hasLocation && (
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>📍</span>
                </div>
              )}
            </div>
            <div className="text-green-600 group-hover:translate-x-1 transition-transform duration-300">
              <span className="text-sm font-medium">View →</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  if (error && activities.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Unable to load projects</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <button
            onClick={fetchActivities}
            className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-green-600 via-green-500 to-emerald-600 text-white py-8 overflow-hidden">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-white/10 to-white/5 rounded-full blur-2xl -mr-24 -mt-24"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-white/10 to-white/5 rounded-full blur-2xl -ml-24 -mb-24"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 backdrop-blur-md text-white text-[11px] mb-3 shadow-lg animate-fade-in-up border border-white/30">
            <Star className="w-2.5 h-2.5 animate-pulse" />
            <span className="font-medium">Federal Ministry of Environment</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold mb-2 bg-gradient-to-r from-white via-white to-white/80 bg-clip-text text-transparent animate-fade-in-up">
            Environmental Projects
          </h1>
          
          <p className="text-xs sm:text-sm md:text-base text-white/90 max-w-2xl mx-auto leading-relaxed px-2">
            Track projects, share feedback, and ensure environmental accountability
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8 py-1 sm:py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 grid grid-cols-2 sm:grid-cols-4 gap-1 sm:gap-2">
              <div className="bg-gradient-to-r from-blue-500/10 to-blue-600/5 rounded-md p-1 sm:p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium">Total</span>
                  <span className="text-xs sm:text-sm font-bold text-blue-700">{stats.total}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-green-500/10 to-green-600/5 rounded-md p-1 sm:p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium">Completed</span>
                  <span className="text-xs sm:text-sm font-bold text-green-700">{stats.completed}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-indigo-500/10 to-indigo-600/5 rounded-md p-1 sm:p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium">Ongoing</span>
                  <span className="text-xs sm:text-sm font-bold text-indigo-700">{stats.ongoing}</span>
                </div>
              </div>
              <div className="bg-gradient-to-r from-gray-500/10 to-gray-600/5 rounded-md p-1 sm:p-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-600 font-medium">Planning</span>
                  <span className="text-xs sm:text-sm font-bold text-gray-700">{stats.planning}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center justify-center bg-gray-50 hover:bg-green-500 text-gray-500 hover:text-white p-1.5 rounded-lg transition-all duration-300"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-12 z-10 bg-white/95 backdrop-blur-md border-b border-gray-100 shadow-lg">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-3">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition ${
                  showFilters || getActiveFilterCount() > 0
                    ? 'bg-green-500 text-white'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Filter className="w-3.5 h-3.5" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="bg-red-500 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              
              <div className="flex border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                  </svg>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-green-500 text-white' : 'bg-white text-gray-600'}`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Filters Panel */}
          {showFilters && (
            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-200">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, agency: '' })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Departments</option>
                  {departmentsList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                
                <select
                  value={filters.agency}
                  onChange={(e) => setFilters({ ...filters, agency: e.target.value, department: '' })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                  disabled={!filters.department}
                >
                  <option value="">All Agencies</option>
                  {agenciesList.map(agency => (
                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                  ))}
                </select>
                
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
                
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="px-2 py-1.5 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {getActiveFilterCount() > 0 && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <button onClick={resetFilters} className="text-xs text-red-500 hover:text-red-600">
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {activities.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500">
              {searchTerm ? `No projects matching "${searchTerm}"` : 'Try adjusting your filters'}
            </p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activities.map((activity) => (
              <ActivityCard key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Entity</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Progress</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {activities.map((activity) => {
                    const statusConfig = getStatusConfig(activity.status);
                    const performance = activity.performance || 0;
                    
                    return (
                      <tr key={activity.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => window.location.href = `/public/projects/${activity.id}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900">{activity.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{activity.description}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {activity.department_name || activity.agency_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {performance > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-green-500 rounded-full" style={{ width: `${Math.min(performance, 100)}%` }} />
                              </div>
                              <span className="text-xs text-gray-600">{Math.round(performance)}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-green-600 text-sm font-medium">View →</button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PublicProjectList;