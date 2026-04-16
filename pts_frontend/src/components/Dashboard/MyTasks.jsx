// src/components/Dashboard/MyTasks.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Calendar, 
  Building2, 
  Target,
  Clock,
  CheckCircle,
  XCircle,
  Send,
  Eye,
  Edit,
  AlertCircle,
  Search,
  Filter,
  RefreshCw,
  Save
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const MyTasks = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedTask, setExpandedTask] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [actualValues, setActualValues] = useState({});
  const [submitting, setSubmitting] = useState({});

  useEffect(() => {
    fetchMyTasks();
  }, []);

  const fetchMyTasks = async () => {
    try {
      setLoading(true);
      const response = await mainApi.initiatives.list();
      let allInitiatives = response.data.results || response.data;
      
      // Filter initiatives based on staff's assigned department or agency
      let filteredInitiatives = [];
      
      if (user?.assigned_agency) {
        const targetAgencyId = typeof user.assigned_agency === 'object' 
          ? user.assigned_agency.id 
          : parseInt(user.assigned_agency);
        
        filteredInitiatives = allInitiatives.filter(i => {
          const initiativeAgencyId = i.agency ? parseInt(i.agency) : null;
          return initiativeAgencyId === targetAgencyId;
        });
      } else if (user?.assigned_department) {
        const targetDeptId = typeof user.assigned_department === 'object' 
          ? user.assigned_department.id 
          : parseInt(user.assigned_department);
        
        filteredInitiatives = allInitiatives.filter(i => {
          const initiativeDeptId = i.department ? parseInt(i.department) : null;
          return initiativeDeptId === targetDeptId;
        });
      }
      
      // Enrich with quarterly progress data
      const tasksWithProgress = await Promise.all(
        filteredInitiatives.map(async (initiative) => {
          try {
            const quartersRes = await mainApi.quarterlyProgress.getByInitiative(initiative.id);
            const quarters = quartersRes.data || [];
            
            const totalQuarters = quarters.length;
            const submittedQuarters = quarters.filter(q => q.status === 'submitted').length;
            const approvedQuarters = quarters.filter(q => q.status === 'approved').length;
            const draftQuarters = quarters.filter(q => q.status === 'draft').length;
            
            const now = new Date();
            const currentQuarter = Math.floor(now.getMonth() / 3) + 1;
            const currentYear = now.getFullYear();
            const currentQuarterData = quarters.find(q => q.quarter === currentQuarter && q.year === currentYear);
            
            // Initialize actual values state
            quarters.forEach(q => {
              if (!actualValues[q.id]) {
                setActualValues(prev => ({ ...prev, [q.id]: q.actual_value || '' }));
              }
            });
            
            return {
              ...initiative,
              quarters,
              progressSummary: {
                total: totalQuarters,
                draft: draftQuarters,
                submitted: submittedQuarters,
                approved: approvedQuarters,
                completionRate: totalQuarters > 0 ? Math.round((approvedQuarters / totalQuarters) * 100) : 0
              },
              currentQuarter: currentQuarterData,
              needsAttention: draftQuarters > 0 && currentQuarterData?.status === 'draft'
            };
          } catch (error) {
            console.error(`Error fetching quarters for initiative ${initiative.id}:`, error);
            return { 
              ...initiative, 
              quarters: [], 
              progressSummary: { total: 0, draft: 0, submitted: 0, approved: 0, completionRate: 0 } 
            };
          }
        })
      );
      
      setTasks(tasksWithProgress);
    } catch (error) {
      console.error('Error fetching tasks:', error);
      toast.error('Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleActualValueChange = (quarterId, value) => {
    setActualValues(prev => ({ ...prev, [quarterId]: value }));
  };

  const handleUpdateActual = async (quarterId) => {
    const actualValue = actualValues[quarterId];
    
    if (!actualValue) {
      toast.error('Please enter actual value');
      return;
    }
    
    setSubmitting(prev => ({ ...prev, [quarterId]: true }));
    try {
      await mainApi.quarterlyProgress.updateActual(quarterId, { actual_value: parseFloat(actualValue) });
      toast.success('Actual value updated successfully');
      fetchMyTasks();
    } catch (error) {
      console.error('Error updating actual:', error);
      toast.error(error.response?.data?.error || 'Failed to update actual value');
    } finally {
      setSubmitting(prev => ({ ...prev, [quarterId]: false }));
    }
  };

  const handleSubmitForReview = async (quarterId) => {
    setSubmitting(prev => ({ ...prev, [quarterId]: true }));
    try {
      await mainApi.quarterlyProgress.submitForReview(quarterId);
      toast.success('Quarter submitted for review successfully');
      fetchMyTasks();
    } catch (error) {
      console.error('Error submitting for review:', error);
      toast.error(error.response?.data?.error || 'Failed to submit for review');
    } finally {
      setSubmitting(prev => ({ ...prev, [quarterId]: false }));
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'draft': { label: 'Pending Update', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
      'submitted': { label: 'Under Review', icon: <Send className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      'approved': { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Rejected', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-700' }
    };
    const c = config[status] || config.draft;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.icon} {c.label}</span>;
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'pending' && task.progressSummary.draft > 0) ||
      (filterStatus === 'in_progress' && task.progressSummary.submitted > 0) ||
      (filterStatus === 'completed' && task.progressSummary.approved === task.progressSummary.total);
    return matchesSearch && matchesFilter;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading your tasks...</p>
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
            <h1 className="text-xl font-bold text-gray-900">My Tasks</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Initiatives assigned to {user?.assigned_department?.name || user?.assigned_agency?.name || 'you'}
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchMyTasks}
              className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-gradient-to-br from-teal-600 to-teal-700 p-2 rounded-lg shadow-md">
              <CheckCircle className="w-5 h-5 text-white" />
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
            placeholder="Search tasks by title..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
        >
          <option value="all">All Tasks</option>
          <option value="pending">Pending Update</option>
          <option value="in_progress">Under Review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Tasks List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <CheckCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No tasks assigned</h3>
          <p className="text-sm text-gray-500">You don't have any initiatives to work on at the moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTasks.map((task) => (
            <div
              key={task.id}
              className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all"
            >
              {/* Task Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                onClick={() => setExpandedTask(expandedTask === task.id ? null : task.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        task.initiative_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {task.initiative_type === 'project' ? '📋 Project' : '📊 Program'}
                      </span>
                      {task.needsAttention && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                          <AlertCircle className="w-3 h-3" />
                          Needs Update
                        </span>
                      )}
                    </div>
                    <h3 className="text-base font-semibold text-gray-900">{task.title}</h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Started: {new Date(task.start_date).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        Progress: {task.progressSummary.completionRate}%
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {task.progressSummary.approved}/{task.progressSummary.total} Quarters
                    </div>
                    <div className="w-24 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-teal-500 rounded-full transition-all"
                        style={{ width: `${task.progressSummary.completionRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Content - Quarterly Progress */}
              {expandedTask === task.id && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="text-sm font-semibold text-gray-900 mb-3">Quarterly Progress</h4>
                  {task.quarters.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      No quarterly data available
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {task.quarters.map((quarter) => (
                        <div key={quarter.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">
                                Q{quarter.quarter} {quarter.year}
                              </span>
                              {getStatusBadge(quarter.status)}
                            </div>
                            <span className="text-sm text-gray-500">
                              Target: {quarter.target_value} {quarter.unit_of_measure}
                            </span>
                          </div>
                          
                          {/* Actual Value Input - Only for draft status */}
                          {quarter.status === 'draft' && (
                            <div className="space-y-2 mt-2">
                              <div className="flex items-center gap-2">
                                <input
                                  type="number"
                                  value={actualValues[quarter.id] !== undefined ? actualValues[quarter.id] : quarter.actual_value || ''}
                                  onChange={(e) => handleActualValueChange(quarter.id, e.target.value)}
                                  className="flex-1 px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                                  placeholder="Enter actual value"
                                  step="0.01"
                                />
                                <button
                                  onClick={() => handleUpdateActual(quarter.id)}
                                  disabled={submitting[quarter.id]}
                                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                                >
                                  {submitting[quarter.id] ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  ) : (
                                    <Save className="w-3.5 h-3.5" />
                                  )}
                                  Save
                                </button>
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={() => handleSubmitForReview(quarter.id)}
                                  disabled={submitting[quarter.id] || !actualValues[quarter.id]}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                                >
                                  {submitting[quarter.id] ? (
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                                  ) : (
                                    <Send className="w-3.5 h-3.5" />
                                  )}
                                  Submit for Review
                                </button>
                              </div>
                            </div>
                          )}
                          
                          {/* Display actual value for non-draft status */}
                          {quarter.status !== 'draft' && quarter.actual_value && (
                            <div className="mt-2 text-sm">
                              <span className="text-gray-500">Actual: </span>
                              <span className="font-medium text-gray-900">
                                {quarter.actual_value} {quarter.unit_of_measure}
                              </span>
                              <span className="ml-2 text-green-600">
                                ({quarter.achievement_percentage}% achieved)
                              </span>
                            </div>
                          )}
                          
                          {/* Staff Comment */}
                          {quarter.staff_comment && (
                            <div className="mt-2 text-xs text-gray-500 bg-gray-50 p-2 rounded">
                              <span className="font-medium">Note:</span> {quarter.staff_comment}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* View Details Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => navigate(`/dashboard/initiatives/${task.id}`)}
                      className="px-3 py-1.5 text-teal-600 hover:bg-teal-50 rounded-lg text-sm flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      View Full Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyTasks;