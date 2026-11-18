// src/components/Dashboard/QuarterlyProgress.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Send, Clock, CheckCircle, XCircle, Edit2, AlertCircle, Award } from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const QuarterlyProgress = ({ activityId, activityTitle, onProgressUpdate }) => {
  const { userRole } = useAuth();
  const isDeliveryOfficer = userRole === 'delivery_officer';
  const isDirector = userRole === 'director';
  const isSectorExpert = userRole === 'sector_expert';
  
  const [indicators, setIndicators] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedIndicator, setExpandedIndicator] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchQuarterlyData();
  }, [activityId]);

  const fetchQuarterlyData = async () => {
    try {
      setLoading(true);
      const progressData = await mainApi.getMyProgressList();
      const activityProgress = (progressData || []).filter(p => p.activity === parseInt(activityId));
      
      // Group by indicator
      const indicatorsMap = new Map();
      activityProgress.forEach(progress => {
        if (!indicatorsMap.has(progress.indicator)) {
          indicatorsMap.set(progress.indicator, {
            id: progress.indicator,
            name: progress.indicator_name,
            unit: progress.indicator?.unit || '',
            quarters: []
          });
        }
        indicatorsMap.get(progress.indicator).quarters.push({
          id: progress.id,
          quarter: progress.quarter,
          year: progress.year,
          target_value: progress.target_value,
          actual_value: progress.actual_value,
          status: progress.status,
          achievement_percentage: progress.achievement_percentage,
          cumulative_percentage: progress.cumulative_percentage,
          staff_comment: progress.staff_comment,
          expert_rating: progress.expert_rating,
          expert_comment: progress.expert_comment,
          data_accuracy: progress.data_accuracy,
          effort_percentage: progress.effort_percentage
        });
      });
      
      // Sort quarters by year and quarter
      const indicatorsArray = Array.from(indicatorsMap.values());
      indicatorsArray.forEach(indicator => {
        indicator.quarters.sort((a, b) => {
          if (a.year !== b.year) return a.year - b.year;
          return a.quarter - b.quarter;
        });
      });
      
      setIndicators(indicatorsArray);
      
      // Auto-expand first indicator if any
      if (indicatorsArray.length > 0 && !expandedIndicator) {
        setExpandedIndicator(indicatorsArray[0].id);
      }
    } catch (error) {
      console.error('Error fetching quarterly data:', error);
      toast.error('Failed to load quarterly progress');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateActual = async (quarterId, actualValue) => {
    if (!actualValue && actualValue !== 0) {
      toast.error('Please enter actual value');
      return;
    }
    
    setUpdating(true);
    try {
      await mainApi.updateQuarterlyProgress(quarterId, { actual_value: parseFloat(actualValue) });
      toast.success('Actual value updated');
      await fetchQuarterlyData();
      if (onProgressUpdate) onProgressUpdate();
    } catch (error) {
      console.error('Error updating actual:', error);
      toast.error('Failed to update actual value');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForReview = async (quarterId) => {
    setUpdating(true);
    try {
      await mainApi.updateQuarterlyProgress(quarterId, { status: 'submitted' });
      toast.success('Quarter submitted for review');
      await fetchQuarterlyData();
      if (onProgressUpdate) onProgressUpdate();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit');
    } finally {
      setUpdating(false);
    }
  };

  const handleApproveReject = async (quarterId, action) => {
    setUpdating(true);
    try {
      if (action === 'approve') {
        await mainApi.approveProgress(quarterId, 'approved');
        toast.success('Quarter approved');
      } else {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await mainApi.approveProgress(quarterId, 'rejected');
          toast.success('Quarter rejected');
        }
      }
      await fetchQuarterlyData();
      if (onProgressUpdate) onProgressUpdate();
    } catch (error) {
      console.error(`Error ${action}ing quarter:`, error);
      toast.error(`Failed to ${action} quarter`);
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'draft': { label: 'Pending Update', icon: <Edit2 className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
      'submitted': { label: 'Under Review', icon: <Clock className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      'approved': { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Rejected', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-700' },
      'assessed': { label: 'Expert Assessed', icon: <Award className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' }
    };
    const c = config[status] || config.draft;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.icon} {c.label}</span>;
  };

  const getRatingDisplay = (rating) => {
    if (!rating) return null;
    const stars = '⭐'.repeat(rating);
    return <span className="text-xs flex items-center gap-0.5">{stars} ({rating}/5)</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (indicators.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-500 text-sm">No quarterly data available for this activity</p>
        <p className="text-xs text-gray-400 mt-1">Configure indicators and quarterly targets first</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Quarterly Progress by Indicator</h3>
        {activityTitle && (
          <span className="text-xs text-gray-500">{activityTitle}</span>
        )}
      </div>
      
      {indicators.map((indicator) => (
        <div key={indicator.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Indicator Header */}
          <div
            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
            onClick={() => setExpandedIndicator(expandedIndicator === indicator.id ? null : indicator.id)}
          >
            <div>
              <h4 className="font-medium text-gray-900">{indicator.name}</h4>
              <p className="text-xs text-gray-500">Unit: {indicator.unit}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedIndicator === indicator.id ? 'rotate-180' : ''}`} />
          </div>
          
          {/* Quarterly Table */}
          {expandedIndicator === indicator.id && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Quarter</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Target</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Actual</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Cumulative %</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Expert Rating</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {indicator.quarters.map((quarter) => (
                    <tr key={quarter.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-medium text-gray-900">
                        Q{quarter.quarter} {quarter.year}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600">
                        {quarter.target_value} {indicator.unit}
                      </td>
                      <td className="py-2 px-3">
                        {isDeliveryOfficer && quarter.status === 'draft' ? (
                          <input
                            type="number"
                            defaultValue={quarter.actual_value || ''}
                            onBlur={(e) => handleUpdateActual(quarter.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-sm focus:ring-1 focus:ring-green-500"
                            placeholder="Enter actual"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">
                            {quarter.actual_value || '-'} {indicator.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {quarter.cumulative_percentage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${Math.min(quarter.cumulative_percentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{quarter.cumulative_percentage.toFixed(1)}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(quarter.status)}
                      </td>
                      <td className="py-2 px-3">
                        {quarter.expert_rating ? (
                          getRatingDisplay(quarter.expert_rating)
                        ) : (
                          <span className="text-xs text-gray-400">Not assessed</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {isDeliveryOfficer && quarter.status === 'draft' && quarter.actual_value && (
                          <button
                            onClick={() => handleSubmitForReview(quarter.id)}
                            disabled={updating}
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs flex items-center gap-1"
                          >
                            <Send className="w-3 h-3" />
                            Submit
                          </button>
                        )}
                        {isDirector && quarter.status === 'submitted' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleApproveReject(quarter.id, 'approve')}
                              className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleApproveReject(quarter.id, 'reject')}
                              className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                            >
                              Reject
                            </button>
                          </div>
                        )}
                        {isSectorExpert && quarter.status === 'approved' && !quarter.expert_rating && (
                          <button
                            onClick={() => {
                              // Navigate to assessment or open modal
                              toast.info('Please use the Assessment tab to provide expert review');
                            }}
                            className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-xs flex items-center gap-1"
                          >
                            <Award className="w-3 h-3" />
                            Assess
                          </button>
                        )}
                        {quarter.status === 'assessed' && quarter.expert_comment && (
                          <div className="relative group">
                            <button
                              className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs flex items-center gap-1 cursor-help"
                              title={quarter.expert_comment}
                            >
                              <AlertCircle className="w-3 h-3" />
                              View Comment
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default QuarterlyProgress;