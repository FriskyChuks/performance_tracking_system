// src/components/Public/PublicProjectList.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  TrendingUp, 
  MapPin, 
  Calendar, 
  MessageCircle, 
  Eye,
  Search,
  Filter,
  ChevronDown,
  Target,
  Building2,
  Star,
  Clock
} from 'lucide-react';
import { publicApi } from '../../services/publicApi';
import toast from 'react-hot-toast';

const PublicProjectList = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    year: '',
    ministry: '',
    status: ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [filters, searchTerm]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = {
        search: searchTerm,
        ...filters
      };
      const response = await publicApi.getProjects(params);
      setProjects(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching projects:', error);
      toast.error('Failed to load projects');
      setLoading(false);
    }
  };

  const getPerformanceColor = (rating) => {
    if (rating >= 4) return 'from-green-500 to-green-600';
    if (rating >= 3) return 'from-yellow-500 to-yellow-600';
    if (rating >= 2) return 'from-orange-500 to-orange-600';
    return 'from-red-500 to-red-600';
  };

  const getPerformanceLabel = (rating) => {
    if (rating >= 4) return 'On Track';
    if (rating >= 3) return 'Progressing';
    if (rating >= 2) return 'At Risk';
    return 'Delayed';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-50 text-primary-600 text-sm mb-4">
          <Star className="w-4 h-4" />
          <span>Citizens Engagement Portal</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent mb-4">
          Track Projects in Your Community
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Browse ongoing projects, share your feedback, and help ensure accountability in your community
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white rounded-2xl shadow-lg p-4 mb-8">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search projects by name, ministry, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-50 transition"
          >
            <Filter className="w-4 h-4" />
            Filters
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-100 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-in-up">
            <select
              value={filters.year}
              onChange={(e) => setFilters({ ...filters, year: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Years</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
            <input
              type="text"
              placeholder="Ministry name"
              value={filters.ministry}
              onChange={(e) => setFilters({ ...filters, ministry: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
            >
              <option value="">All Status</option>
              <option value="on-track">On Track</option>
              <option value="at-risk">At Risk</option>
              <option value="delayed">Delayed</option>
            </select>
          </div>
        )}
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl">
          <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/public/projects/${project.id}`}
              className="group bg-white rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Project Image Carousel Preview */}
              <div className="relative h-48 overflow-hidden bg-gradient-to-br from-gray-100 to-gray-200">
                {project.images && project.images.length > 0 ? (
                  <img
                    src={project.images[0].image}
                    alt={project.outcome}
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <TrendingUp className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <div className={`px-2 py-1 rounded-lg text-xs font-medium text-white bg-gradient-to-r ${getPerformanceColor(project.performance_rating)} shadow-lg`}>
                    {getPerformanceLabel(project.performance_rating)}
                  </div>
                </div>
              </div>

              {/* Project Info */}
              <div className="p-5">
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary-600 transition">
                  {project.outcome}
                </h3>
                <p className="text-sm text-gray-500 mb-3 line-clamp-2">{project.indicator}</p>
                
                {/* Meta Info */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Building2 className="w-3.5 h-3.5" />
                    <span>{project.ministry_name || 'Ministry'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{project.year} • Q{project.quarter}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Target className="w-3.5 h-3.5" />
                    <span>Target: {project.target_data || 'N/A'} | Actual: {project.actual_data || 'N/A'}</span>
                  </div>
                </div>

                {/* Engagement Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>{project.comment_count || 0} comments</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500">
                      <Eye className="w-3.5 h-3.5" />
                      <span>View details</span>
                    </div>
                  </div>
                  <div className="text-primary-600 group-hover:translate-x-1 transition-transform">
                    →
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default PublicProjectList;