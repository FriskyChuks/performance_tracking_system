// src/components/Dashboard/PendingAssessments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList,
  Eye,
  CheckCircle,
  AlertCircle,
  Search,
  RefreshCw,
  Award,
  Target,
  Calendar,
  Building2,
  ChevronRight,
  TrendingUp,
  Clock,
  Star,
  FileText,
  MessageSquare
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Helper function to safely format numbers
const formatNumber = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) {
    return '0';
  }
  return parseFloat(value).toFixed(decimals);
};

const getSafePercentage = (value) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) {
    return 0;
  }
  return Math.min(parseFloat(value), 100);
};

const PendingAssessments = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isSectorExpert = userRole === 'sector_expert';
  
  const [assessments, setAssessments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterIndicator, setFilterIndicator] = useState('');
  const [expandedItem, setExpandedItem] = useState(null);

  useEffect(() => {
    if (isSectorExpert) {
      fetchPendingAssessments();
    }
  }, [isSectorExpert]);

  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      
      // Get all approved quarters that need assessment
      const pendingData = await mainApi.getPendingAssessments();
      console.log('Pending assessments data:', pendingData);
      
      // Ensure we have an array
      let pendingList = [];
      if (Array.isArray(pendingData)) {
        pendingList = pendingData;
      } else if (pendingData?.results) {
        pendingList = pendingData.results;
      } else if (pendingData && typeof pendingData === 'object') {
        pendingList = Object.values(pendingData).find(v => Array.isArray(v)) || [];
      }
      
      console.log('Processed pending list:', pendingList);
      
      // Group by activity
      const activityMap = new Map();
      
      pendingList.forEach(item => {
        const activityId = item.activity || item.activity_id;
        if (!activityMap.has(activityId)) {
          activityMap.set(activityId, {
            id: activityId,
            title: item.activity_title || `Activity ${activityId}`,
            activity_type: item.activity_type || 'project',
            department_name: item.department_name,
            agency_name: item.agency_name,
            indicators: []
          });
        }
        
        const activity = activityMap.get(activityId);
        activity.indicators.push({
          id: item.id,
          indicator_id: item.indicator,
          indicator_name: item.indicator_name || 'Unknown Indicator',
          deliverable_name: item.deliverable_name,
          quarter: item.quarter,
          year: item.year,
          target_value: item.target_value,
          actual_value: item.actual_value,
          cumulative_percentage: item.cumulative_percentage,
          unit: item.unit_of_measure || '',
          staff_comment: item.staff_comment,
          status: item.status
        });
      });
      
      const assessmentsArray = Array.from(activityMap.values());
      setAssessments(assessmentsArray);
      
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
      toast.error('Failed to load pending assessments');
      setAssessments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchPendingAssessments();
  };

  const getActivityTypeIcon = (type) => {
    return type === 'project' ? '📋' : '📊';
  };

  const getActivityTypeColor = (type) => {
    return type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700';
  };

  const getAchievementColor = (percentage) => {
    const safePercentage = getSafePercentage(percentage);
    if (safePercentage >= 90) return 'text-green-600';
    if (safePercentage >= 75) return 'text-emerald-600';
    if (safePercentage >= 60) return 'text-yellow-600';
    if (safePercentage >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const filteredAssessments = assessments.filter(activity => {
    const matchesSearch = 
      activity.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      activity.indicators?.some(i => 
        i.indicator_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        i.deliverable_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    
    const matchesIndicator = !filterIndicator || 
      activity.indicators?.some(i => 
        i.indicator_name?.toLowerCase().includes(filterIndicator.toLowerCase())
      );
    
    return matchesSearch && matchesIndicator;
  });

  // Calculate total pending count
  const totalPendingCount = assessments.reduce((sum, a) => sum + (a.indicators?.length || 0), 0);

  if (!isSectorExpert) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">This page is only accessible to Sector Experts.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pending assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Expert Assessments</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Review and assess approved quarterly progress reports
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={handleRefresh}
              className="p-2 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md">
              <ClipboardList className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by activity or indicator..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
          />
        </div>
        <input
          type="text"
          placeholder="Filter by indicator name..."
          value={filterIndicator}
          onChange={(e) => setFilterIndicator(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white w-full sm:w-64"
        />
      </div>

      {/* Summary Cards */}
      {assessments.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl p-3 border border-yellow-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Pending Assessments</p>
                <p className="text-2xl font-bold text-yellow-700">{totalPendingCount}</p>
              </div>
              <ClipboardList className="w-8 h-8 text-yellow-500 opacity-50" />
            </div>
          </div>
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-3 border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-gray-500">Activities to Review</p>
                <p className="text-2xl font-bold text-purple-700">{assessments.length}</p>
              </div>
              <Award className="w-8 h-8 text-purple-500 opacity-50" />
            </div>
          </div>
        </div>
      )}

      {/* Assessments List */}
      {filteredAssessments.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          {searchTerm || filterIndicator ? (
            <>
              <Search className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No matching results</h3>
              <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
            </>
          ) : (
            <>
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <h3 className="text-base font-medium text-gray-900 mb-1">No pending assessments</h3>
              <p className="text-sm text-gray-500">All approved quarters have been assessed.</p>
            </>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAssessments.map((activity) => (
            <div key={activity.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition">
              {/* Activity Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedItem(expandedItem === activity.id ? null : activity.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getActivityTypeColor(activity.activity_type)}`}>
                        {getActivityTypeIcon(activity.activity_type)} {activity.activity_type === 'project' ? 'Project' : 'Program'}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        {activity.indicators.length} pending {activity.indicators.length === 1 ? 'assessment' : 'assessments'}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{activity.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      {(activity.department_name || activity.agency_name) && (
                        <span className="flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          {activity.department_name || activity.agency_name}
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        {activity.indicators.length} indicators to assess
                      </span>
                    </div>
                  </div>
                  <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${expandedItem === activity.id ? 'rotate-90' : ''}`} />
                </div>
              </div>

              {/* Expanded Content - Indicators to assess */}
              {expandedItem === activity.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4 text-purple-600" />
                    Indicators Ready for Assessment
                  </h4>
                  <div className="space-y-3">
                    {activity.indicators.map((indicator, idx) => (
                      <div key={indicator.id} className="bg-white rounded-lg border border-gray-200 p-3 hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              <h5 className="font-medium text-gray-900 text-sm">{indicator.indicator_name}</h5>
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600">
                                Q{indicator.quarter} {indicator.year}
                              </span>
                              {indicator.deliverable_name && (
                                <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {indicator.deliverable_name}
                                </span>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                              <div className="bg-gray-50 p-2 rounded">
                                <span className="text-gray-500 text-xs">Target</span>
                                <p className="font-medium text-gray-900">
                                  {formatNumber(indicator.target_value)} {indicator.unit}
                                </p>
                              </div>
                              <div className="bg-green-50 p-2 rounded">
                                <span className="text-gray-500 text-xs">Actual Achieved</span>
                                <p className="font-medium text-green-700">
                                  {formatNumber(indicator.actual_value)} {indicator.unit}
                                </p>
                              </div>
                            </div>
                            
                            <div className="mb-2">
                              <div className="flex justify-between text-xs mb-1">
                                <span className="text-gray-500">Cumulative Achievement</span>
                                <span className={`font-medium ${getAchievementColor(indicator.cumulative_percentage)}`}>
                                  {formatNumber(indicator.cumulative_percentage)}%
                                </span>
                              </div>
                              <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 rounded-full transition-all"
                                  style={{ width: `${getSafePercentage(indicator.cumulative_percentage)}%` }}
                                />
                              </div>
                            </div>
                            
                            {indicator.staff_comment && (
                              <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded flex items-start gap-1">
                                <MessageSquare className="w-3 h-3 text-gray-400 mt-0.5 flex-shrink-0" />
                                <span><span className="font-medium">Staff Note:</span> {indicator.staff_comment}</span>
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => navigate(`/dashboard/activities/${activity.id}?assessment=${indicator.id}&quarter=${indicator.quarter}&year=${indicator.year}`)}
                            className="px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm flex items-center gap-1"
                          >
                            <Award className="w-4 h-4" />
                            Assess Now
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Progress indicator */}
                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500">Assessment Progress</span>
                      <span className="font-medium text-purple-600">
                        {activity.indicators.filter(i => i.assessed).length}/{activity.indicators.length} completed
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      
      {/* Assessment Guidelines */}
      {assessments.length > 0 && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl p-4 border border-blue-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-600" />
            Assessment Guidelines
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
            <div className="space-y-1">
              <p className="flex items-center gap-1">📊 <span className="font-medium">Data Accuracy:</span> Available, Not Available, Inaccurate, Not Verifiable</p>
              <p className="flex items-center gap-1">📈 <span className="font-medium">Effort Percentage:</span> Rate efforts towards achieving goals (0-100%)</p>
              <p className="flex items-center gap-1">⭐ <span className="font-medium">Expert Rating:</span> 1=Poor, 2=Fair, 3=Good, 4=Very Good, 5=Excellent</p>
            </div>
            <div className="space-y-1">
              <p className="flex items-center gap-1">💬 <span className="font-medium">Comment:</span> Provide detailed assessment observations</p>
              <p className="flex items-center gap-1">📝 <span className="font-medium">Recommendations:</span> Suggest improvements for future quarters</p>
              <p className="flex items-center gap-1">✅ <span className="font-medium">Note:</span> Assessments cannot be edited once submitted</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingAssessments;