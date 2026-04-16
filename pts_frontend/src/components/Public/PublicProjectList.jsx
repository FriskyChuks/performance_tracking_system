// src/components/Public/PublicProjectList.jsx
import React, { useState, useEffect, useCallback } from 'react';
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
  RefreshCw
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { engagementApi } from '../../services/engagementApi';
import toast from 'react-hot-toast';

const PublicProjectList = () => {
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
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

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchFiltersData();
    fetchStats();
  }, []);

  useEffect(() => {
    fetchInitiatives();
  }, [filters, debouncedSearch]);

  const fetchFiltersData = async () => {
    try {
      const [deptRes, agencyRes] = await Promise.all([
        mainApi.public.getDepartments(),
        mainApi.public.getAgencies()
      ]);
      setDepartmentsList(deptRes.data || []);
      setAgenciesList(agencyRes.data || []);
    } catch (error) {
      console.error('Error fetching filter data:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await mainApi.public.getDashboardStats();
      const data = response.data;
      setStats({
        total: data.total_initiatives || 0,
        ongoing: data.ongoing_count || 0,
        completed: data.completed_count || 0,
        planning: data.planning_count || 0
      });
      
      // Extract years from initiatives for filter
      if (data.years) {
        setAvailableYears(data.years);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchInitiatives = async () => {
    try {
      setLoading(true);
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (filters.department) params.department = filters.department;
      if (filters.agency) params.agency = filters.agency;
      if (filters.status) params.status = filters.status;
      if (filters.year) params.year = filters.year;
      
      const response = await mainApi.public.getInitiatives(params);
      let initiativesData = response.data || [];

      console.log('Fetched initiatives:', initiativesData);
      
      // Fetch additional data for each initiative (images and comment counts)
      const initiativesWithDetails = await Promise.all(
        initiativesData.map(async (initiative) => {
          try {
            const [imagesRes, commentsRes] = await Promise.all([
              engagementApi.getInitiativeImages(initiative.id).catch(() => ({ data: [] })),
              engagementApi.getComments(initiative.id).catch(() => ({ data: [] }))
            ]);
            
            return {
              ...initiative,
              images: imagesRes.data || [],
              comment_count: commentsRes.data?.length || 0,
              // Calculate achievement percentage if target and actual exist
              achievement_percentage: initiative.target_value && initiative.actual_value 
                ? Math.round((initiative.actual_value / initiative.target_value) * 100)
                : 0
            };
          } catch (error) {
            console.error(`Error fetching details for initiative ${initiative.id}:`, error);
            return { ...initiative, images: [], comment_count: 0, achievement_percentage: 0 };
          }
        })
      );
      
      setInitiatives(initiativesWithDetails);
    } catch (error) {
      console.error('Error fetching initiatives:', error);
      toast.error('Failed to load initiatives');
    } finally {
      setLoading(false);
    }
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

  const getPerformanceColor = (rating) => {
    if (rating >= 4) return 'from-emerald-500 to-green-600';
    if (rating >= 3) return 'from-amber-500 to-yellow-600';
    if (rating >= 2) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-rose-600';
  };

  const getPerformanceLabel = (rating) => {
    if (rating >= 4) return 'Excellent';
    if (rating >= 3) return 'Good';
    if (rating >= 2) return 'Fair';
    return 'Needs Attention';
  };

  const getStatusConfig = (status) => {
    const configs = {
      'planning': { label: 'Planning', color: 'bg-gray-100 text-gray-700', icon: '📋' },
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

  const InitiativeCard = ({ initiative }) => {
    const primaryImage = initiative.images?.find(img => img.is_primary) || initiative.images?.[0];
    const imageUrl = primaryImage ? (primaryImage.image_url || primaryImage.image) : null;
    const statusConfig = getStatusConfig(initiative.status);
    const hasLocation = initiative.latitude && initiative.longitude;

    return (
      <Link
        to={`/public/projects/${initiative.id}`}
        className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 block"
      >
        {/* Image Section */}
        <div className="relative h-52 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={initiative.title}
              className="w-full h-full object-cover group-hover:scale-110 transition duration-700"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = `https://placehold.co/600x400/22c55e/white?text=${encodeURIComponent(initiative.title?.charAt(0) || 'P')}`;
              }}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-primary-100 to-primary-50">
              <TrendingUp className="w-12 h-12 text-primary-400 mb-2" />
              <span className="text-sm text-gray-500">No image available</span>
            </div>
          )}
          
          {/* Overlay Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
          
          {/* Performance Badge */}
          <div className="absolute top-3 right-3">
            <div className={`px-2.5 py-1 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${getPerformanceColor(initiative.performance_rating)} shadow-lg backdrop-blur-sm`}>
              {getPerformanceLabel(initiative.performance_rating)}
            </div>
          </div>
          
          {/* Status Badge */}
          <div className="absolute bottom-3 left-3">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium ${statusConfig.color} shadow-lg backdrop-blur-sm bg-white/90`}>
              <span>{statusConfig.icon}</span>
              {statusConfig.label}
            </span>
          </div>
          
          {/* Achievement Badge */}
          {initiative.achievement_percentage > 0 && (
            <div className="absolute bottom-3 right-3">
              <div className="px-2 py-1 rounded-xl text-xs font-bold text-white bg-black/50 backdrop-blur-sm">
                {initiative.achievement_percentage}% achieved
              </div>
            </div>
          )}
        </div>
        
        {/* Content Section */}
        <div className="p-5">
          {/* Title */}
          <h3 className="font-bold text-lg text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition duration-300">
            {initiative.title}
          </h3>
          
          {/* Description */}
          <p className="text-sm text-gray-500 mb-3 line-clamp-2">
            {initiative.description || 'No description available'}
          </p>
          
          {/* Meta Information */}
          <div className="space-y-2 mb-4">
            {initiative.department_name && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
                  <Building2 className="w-3 h-3 text-blue-600" />
                </div>
                <span className="truncate">{initiative.department_name}</span>
              </div>
            )}
            {initiative.agency_name && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <Landmark className="w-3 h-3 text-purple-600" />
                </div>
                <span className="truncate">{initiative.agency_name}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
                <Calendar className="w-3 h-3 text-green-600" />
              </div>
              <span>Started: {new Date(initiative.start_date).toLocaleDateString()}</span>
            </div>
            {hasLocation && (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center">
                  <MapPin className="w-3 h-3 text-amber-600" />
                </div>
                <span>Location available</span>
              </div>
            )}
          </div>
          
          {/* Progress Bar */}
          {initiative.target_value && initiative.actual_value && (
            <div className="mb-4">
              <div className="flex justify-between text-xs text-gray-600 mb-1">
                <span>Progress</span>
                <span className="font-medium text-green-600">{initiative.achievement_percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(initiative.achievement_percentage, 100)}%` }}
                />
              </div>
            </div>
          )}
          
          {/* Engagement Stats */}
          <div className="flex items-center justify-between pt-3 border-t border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <MessageCircle className="w-3.5 h-3.5" />
                <span>{initiative.comment_count || 0}</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500">
                <Eye className="w-3.5 h-3.5" />
                <span>Details</span>
              </div>
            </div>
            <div className="text-primary-600 group-hover:translate-x-1 transition-transform duration-300">
              <span className="text-sm font-medium">View →</span>
            </div>
          </div>
        </div>
      </Link>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-600 text-white py-16 overflow-hidden">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm text-white text-sm mb-6">
            <Star className="w-4 h-4" />
            <span>Federal Ministry of Environment</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-4">
            Environmental Projects
          </h1>
          <p className="text-lg md:text-xl text-primary-100 max-w-2xl mx-auto">
            Track ongoing projects, share your feedback, and help ensure accountability in environmental management
          </p>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Total: <span className="font-semibold text-gray-900">{stats.total}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Completed: <span className="font-semibold text-gray-900">{stats.completed}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Ongoing: <span className="font-semibold text-gray-900">{stats.ongoing}</span></span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-gray-500 rounded-full"></div>
                <span className="text-gray-600">Planning: <span className="font-semibold text-gray-900">{stats.planning}</span></span>
              </div>
            </div>
            <button
              onClick={fetchInitiatives}
              className="p-1.5 text-gray-400 hover:text-primary-600 transition rounded-lg"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="sticky top-12 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-col lg:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search projects by name, description, or code..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm bg-white"
              />
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition ${
                  showFilters || getActiveFilterCount() > 0
                    ? 'bg-primary-600 text-white shadow-md'
                    : 'border border-gray-200 text-gray-600 hover:bg-gray-50 bg-white'
                }`}
              >
                <Filter className="w-4 h-4" />
                Filters
                {getActiveFilterCount() > 0 && (
                  <span className="ml-1 bg-white text-primary-600 rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {getActiveFilterCount()}
                  </span>
                )}
              </button>
              
              <div className="flex border border-gray-200 rounded-xl overflow-hidden bg-white">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition ${viewMode === 'grid' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </div>
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition ${viewMode === 'list' ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  <div className="w-4 h-4 flex items-center justify-center">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Advanced Filters Panel */}
          {showFilters && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl border border-gray-200 animate-fade-in-up">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <select
                  value={filters.department}
                  onChange={(e) => setFilters({ ...filters, department: e.target.value, agency: '' })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Departments</option>
                  {departmentsList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
                
                <select
                  value={filters.agency}
                  onChange={(e) => setFilters({ ...filters, agency: e.target.value, department: '' })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
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
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Status</option>
                  <option value="planning">Planning</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                
                <select
                  value={filters.year}
                  onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                  className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Years</option>
                  {availableYears.map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>
              
              {getActiveFilterCount() > 0 && (
                <div className="mt-3 pt-3 border-t border-gray-200 flex flex-wrap gap-2">
                  {Object.entries(filters).map(([key, value]) => {
                    if (!value) return null;
                    const labels = {
                      department: 'Department',
                      agency: 'Agency',
                      status: 'Status',
                      year: 'Year'
                    };
                    const displayValue = key === 'department' 
                      ? departmentsList.find(d => d.id === parseInt(value))?.name || value
                      : key === 'agency'
                      ? agenciesList.find(a => a.id === parseInt(value))?.name || value
                      : value;
                    return (
                      <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 text-primary-700 rounded-lg text-xs">
                        {labels[key]}: {displayValue}
                        <button
                          onClick={() => setFilters({ ...filters, [key]: '' })}
                          className="ml-1 hover:text-primary-900"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    );
                  })}
                  <button
                    onClick={resetFilters}
                    className="text-xs text-gray-500 hover:text-gray-700 underline"
                  >
                    Clear all
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Projects Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {initiatives.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <TrendingUp className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No projects found</h3>
            <p className="text-gray-500 mb-4">Try adjusting your search or filters</p>
            <button
              onClick={resetFilters}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              <RefreshCw className="w-4 h-4" />
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {initiatives.map((initiative) => (
              <InitiativeCard key={initiative.id} initiative={initiative} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Project</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Department/Agency</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Progress</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Comments</th>
                    <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {initiatives.map((initiative) => {
                    const statusConfig = getStatusConfig(initiative.status);
                    return (
                      <tr key={initiative.id} className="hover:bg-gray-50 transition cursor-pointer" onClick={() => window.location.href = `/public/projects/${initiative.id}`}>
                        <td className="py-3 px-4">
                          <div className="font-medium text-gray-900 text-sm">{initiative.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{initiative.description}</div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {initiative.department_name || initiative.agency_name || '-'}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                            {statusConfig.icon} {statusConfig.label}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {initiative.achievement_percentage > 0 ? (
                            <div className="flex items-center gap-2">
                              <div className="w-20 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full"
                                  style={{ width: `${initiative.achievement_percentage}%` }}
                                />
                              </div>
                              <span className="text-xs text-gray-600">{initiative.achievement_percentage}%</span>
                            </div>
                          ) : (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MessageCircle className="w-3.5 h-3.5" />
                            <span>{initiative.comment_count || 0}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-1">
                            View Details →
                          </button>
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