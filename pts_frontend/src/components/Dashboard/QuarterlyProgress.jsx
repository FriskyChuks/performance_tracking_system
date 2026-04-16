// src/components/Dashboard/QuarterlyProgress.jsx
import React, { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Save, Send, Clock, CheckCircle, XCircle, Edit2, AlertCircle } from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const QuarterlyProgress = ({ initiativeId, initiativeTitle }) => {
  const { user } = useAuth();
  const userRole = user?.role;
  const isStaff = userRole === 'staff';
  const isDirector = userRole === 'director';
  
  const [deliverables, setDeliverables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedDeliverable, setExpandedDeliverable] = useState(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchQuarterlyData();
  }, [initiativeId]);

  const fetchQuarterlyData = async () => {
    try {
      setLoading(true);
      const response = await mainApi.quarterlyProgress.getByInitiative(initiativeId);
      const quarters = response.data || [];
      
      // Group by deliverable
      const deliverablesMap = new Map();
      quarters.forEach(quarter => {
        if (!deliverablesMap.has(quarter.deliverable_id)) {
          deliverablesMap.set(quarter.deliverable_id, {
            id: quarter.deliverable_id,
            name: quarter.deliverable_name,
            unit: quarter.unit_of_measure,
            quarters: []
          });
        }
        deliverablesMap.get(quarter.deliverable_id).quarters.push({
          id: quarter.id,
          quarter: quarter.quarter,
          year: quarter.year,
          target_value: quarter.target_value,
          actual_value: quarter.actual_value,
          status: quarter.status,
          achievement_percentage: quarter.achievement_percentage,
          staff_comment: quarter.staff_comment
        });
      });
      
      setDeliverables(Array.from(deliverablesMap.values()));
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
      await mainApi.quarterlyProgress.updateActual(quarterId, { actual_value: actualValue });
      toast.success('Actual value updated');
      fetchQuarterlyData();
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
      await mainApi.quarterlyProgress.submitForReview(quarterId);
      toast.success('Quarter submitted for review');
      fetchQuarterlyData();
    } catch (error) {
      console.error('Error submitting:', error);
      toast.error('Failed to submit');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      'draft': { label: 'Pending Update', icon: <Edit2 className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
      'submitted': { label: 'Under Review', icon: <Clock className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      'approved': { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      'rejected': { label: 'Rejected', icon: <XCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-700' }
    };
    const c = config[status] || config.draft;
    return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>{c.icon} {c.label}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (deliverables.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500 text-sm">No quarterly data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-gray-900">Quarterly Progress by Deliverable</h3>
      
      {deliverables.map((deliverable) => (
        <div key={deliverable.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          {/* Deliverable Header */}
          <div
            className="p-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
            onClick={() => setExpandedDeliverable(expandedDeliverable === deliverable.id ? null : deliverable.id)}
          >
            <div>
              <h4 className="font-medium text-gray-900">{deliverable.name}</h4>
              <p className="text-xs text-gray-500">Unit: {deliverable.unit}</p>
            </div>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDeliverable === deliverable.id ? 'rotate-180' : ''}`} />
          </div>
          
          {/* Quarterly Table */}
          {expandedDeliverable === deliverable.id && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Quarter</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Target</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Actual</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Achievement</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Status</th>
                    <th className="text-left py-2 px-3 text-xs font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {deliverable.quarters.map((quarter) => (
                    <tr key={quarter.id} className="hover:bg-gray-50">
                      <td className="py-2 px-3 text-sm font-medium text-gray-900">
                        Q{quarter.quarter} {quarter.year}
                      </td>
                      <td className="py-2 px-3 text-sm text-gray-600">
                        {quarter.target_value} {deliverable.unit}
                      </td>
                      <td className="py-2 px-3">
                        {isStaff && quarter.status === 'draft' ? (
                          <input
                            type="number"
                            defaultValue={quarter.actual_value || ''}
                            onBlur={(e) => handleUpdateActual(quarter.id, e.target.value)}
                            className="w-24 px-2 py-1 border border-gray-200 rounded text-sm"
                            placeholder="Enter actual"
                            step="0.01"
                          />
                        ) : (
                          <span className="text-sm text-gray-600">
                            {quarter.actual_value || '-'} {deliverable.unit}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {quarter.achievement_percentage ? (
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-green-500 rounded-full"
                                style={{ width: `${quarter.achievement_percentage}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600">{quarter.achievement_percentage}%</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="py-2 px-3">
                        {getStatusBadge(quarter.status)}
                      </td>
                      <td className="py-2 px-3">
                        {isStaff && quarter.status === 'draft' && quarter.actual_value && (
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