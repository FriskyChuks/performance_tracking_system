// src/components/Dashboard/ExpertAssessment.jsx
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  AlertCircle, 
  CheckCircle, 
  XCircle,
  ChevronDown,
  ChevronUp,
  Award,
  Target,
  Calendar,
  Building2,
  FileText,
  ThumbsUp,
  ThumbsDown,
  Star,
  Send
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ExpertAssessment = ({ activityId, onComplete }) => {
  const { user } = useAuth();
  const [approvedQuarters, setApprovedQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expandedQuarter, setExpandedQuarter] = useState(null);
  const [assessments, setAssessments] = useState({});

  useEffect(() => {
    fetchApprovedQuarters();
  }, [activityId]);

  const fetchApprovedQuarters = async () => {
    try {
      setLoading(true);
      // Get all progress data for this activity
      const progressData = await mainApi.getMyProgressList();
      const activityProgress = (progressData || []).filter(p => p.activity === parseInt(activityId));
      
      // Filter only approved quarters that haven't been assessed yet
      const approved = activityProgress.filter(q => q.status === 'approved' && !q.expert_assessed);
      
      // Sort by year and quarter
      approved.sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return a.quarter - b.quarter;
      });
      
      setApprovedQuarters(approved);
      
      // Initialize assessments object
      const initialAssessments = {};
      approved.forEach(quarter => {
        initialAssessments[quarter.id] = {
          data_accuracy: '',
          effort_percentage: '',
          expert_comment: '',
          expert_rating: '',
          recommendations: ''
        };
      });
      setAssessments(initialAssessments);
      
      // Auto-expand the first quarter if any
      if (approved.length > 0) {
        setExpandedQuarter(approved[0].id);
      }
    } catch (error) {
      console.error('Error fetching approved quarters:', error);
      toast.error('Failed to load approved quarters');
    } finally {
      setLoading(false);
    }
  };

  const handleAssessmentChange = (quarterId, field, value) => {
    setAssessments(prev => ({
      ...prev,
      [quarterId]: {
        ...prev[quarterId],
        [field]: value
      }
    }));
  };

  const handleSubmitAssessment = async (quarterId) => {
    const assessment = assessments[quarterId];
    
    if (!assessment.data_accuracy) {
      toast.error('Please select data accuracy');
      return;
    }
    if (!assessment.effort_percentage) {
      toast.error('Please enter effort percentage');
      return;
    }
    if (!assessment.expert_comment) {
      toast.error('Please enter your assessment comment');
      return;
    }
    if (!assessment.expert_rating) {
      toast.error('Please select a rating');
      return;
    }

    setSaving(true);
    try {
      await mainApi.submitAssessment(quarterId, {
        expert_rating: parseInt(assessment.expert_rating),
        expert_comment: assessment.expert_comment,
        expert_recommendations: assessment.recommendations,
        data_accuracy: assessment.data_accuracy,
        effort_percentage: parseInt(assessment.effort_percentage),
        status: 'assessed'
      });
      
      toast.success('Assessment submitted successfully');
      
      // Remove the assessed quarter from the list
      setApprovedQuarters(prev => prev.filter(q => q.id !== quarterId));
      
      // Remove from assessments state
      setAssessments(prev => {
        const newAssessments = { ...prev };
        delete newAssessments[quarterId];
        return newAssessments;
      });
      
      // Expand next quarter if available
      const remainingQuarters = approvedQuarters.filter(q => q.id !== quarterId);
      if (remainingQuarters.length > 0) {
        setExpandedQuarter(remainingQuarters[0].id);
      }
      
      if (onComplete) onComplete();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSaving(false);
    }
  };

  const getDataAccuracyIcon = (value) => {
    const icons = {
      'available': '✅',
      'not_available': '❌',
      'inaccurate': '⚠️',
      'not_verifiable': '🔍'
    };
    return icons[value] || '📋';
  };

  const getDataAccuracyLabel = (value) => {
    const labels = {
      'available': 'Data Available - Verified',
      'not_available': 'Data Not Available',
      'inaccurate': 'Data Not Accurate',
      'not_verifiable': 'Data Not Verifiable'
    };
    return labels[value] || '';
  };

  const getRatingLabel = (rating) => {
    const labels = {
      1: 'Poor',
      2: 'Fair',
      3: 'Good',
      4: 'Very Good',
      5: 'Excellent'
    };
    return labels[rating] || '';
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (approvedQuarters.length === 0) {
    return (
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 text-center border border-green-200">
        <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">No Pending Assessments</h3>
        <p className="text-sm text-gray-500">
          All approved quarters have been assessed. Great work!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2 rounded-lg">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold">Expert Assessment</h2>
            <p className="text-purple-100 text-xs">
              {approvedQuarters.length} quarter(s) awaiting your assessment
            </p>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="bg-white rounded-xl p-3 border border-gray-200">
        <div className="flex items-center justify-between text-sm mb-2">
          <span className="text-gray-600">Assessment Progress</span>
          <span className="font-medium text-purple-600">
            {approvedQuarters.filter(q => assessments[q.id]?.expert_rating).length} / {approvedQuarters.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-purple-600 rounded-full h-2 transition-all duration-300"
            style={{ width: `${(approvedQuarters.filter(q => assessments[q.id]?.expert_rating).length / approvedQuarters.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Assessment Cards */}
      {approvedQuarters.map((quarter, index) => {
        const assessment = assessments[quarter.id];
        const isExpanded = expandedQuarter === quarter.id;
        const isCompleted = assessment?.expert_rating;
        
        return (
          <div 
            key={quarter.id} 
            className={`bg-white rounded-xl border transition-all ${
              isCompleted 
                ? 'border-green-200 bg-green-50/30' 
                : isExpanded 
                  ? 'border-purple-300 shadow-md' 
                  : 'border-gray-200 hover:border-purple-200'
            }`}
          >
            {/* Card Header */}
            <div 
              className="p-4 cursor-pointer hover:bg-gray-50 transition rounded-xl"
              onClick={() => setExpandedQuarter(isExpanded ? null : quarter.id)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {quarter.indicator_name}
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                      Q{quarter.quarter} {quarter.year}
                    </span>
                    {isCompleted && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Assessed
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm mb-2">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <span className="ml-1 font-medium">{quarter.target_value} {quarter.unit_of_measure}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Actual:</span>
                      <span className="ml-1 font-medium text-green-600">{quarter.actual_value} {quarter.unit_of_measure}</span>
                    </div>
                    <div className="col-span-2">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Cumulative Achievement:</span>
                        <span className="font-medium text-blue-600">{quarter.cumulative_percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${quarter.cumulative_percentage}%` }}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {quarter.staff_comment && (
                    <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded mt-2">
                      <span className="font-medium">Staff Note:</span> {quarter.staff_comment}
                    </div>
                  )}
                </div>
                
                <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ml-2 flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
              </div>
            </div>
            
            {/* Expanded Assessment Form */}
            {isExpanded && !isCompleted && (
              <div className="border-t border-gray-100 p-4 bg-gray-50 rounded-b-xl">
                <div className="space-y-4">
                  {/* Data Accuracy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Data Accuracy <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      {['available', 'not_available', 'inaccurate', 'not_verifiable'].map(option => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => handleAssessmentChange(quarter.id, 'data_accuracy', option)}
                          className={`px-3 py-2 rounded-lg text-sm text-left transition-all flex items-center gap-2 ${
                            assessment.data_accuracy === option
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <span className="text-lg">{getDataAccuracyIcon(option)}</span>
                          <span>{getDataAccuracyLabel(option)}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Effort Percentage */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Efforts Towards Achieving Goals (%) <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        value={assessment.effort_percentage || 0}
                        onChange={(e) => handleAssessmentChange(quarter.id, 'effort_percentage', e.target.value)}
                        className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                        min="0"
                        max="100"
                        step="5"
                      />
                      <input
                        type="number"
                        value={assessment.effort_percentage || ''}
                        onChange={(e) => handleAssessmentChange(quarter.id, 'effort_percentage', e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-200 rounded-lg text-sm text-center"
                        min="0"
                        max="100"
                        placeholder="%"
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-500 mt-1">
                      <span>0%</span>
                      <span>25%</span>
                      <span>50%</span>
                      <span>75%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {/* Expert Comment */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expert Comment <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={assessment.expert_comment || ''}
                      onChange={(e) => handleAssessmentChange(quarter.id, 'expert_comment', e.target.value)}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                      placeholder="Provide your expert assessment, observations, and findings..."
                    />
                  </div>
                  
                  {/* Expert Rating */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Expert Rating <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {[1, 2, 3, 4, 5].map(rating => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleAssessmentChange(quarter.id, 'expert_rating', rating)}
                          className={`py-2 rounded-lg text-center transition-all ${
                            parseInt(assessment.expert_rating) === rating
                              ? 'bg-purple-600 text-white shadow-sm'
                              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex flex-col items-center gap-0.5">
                            <span className="text-sm font-bold">{rating}</span>
                            <span className="text-[10px]">{getRatingLabel(rating)}</span>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                  
                  {/* Recommendations */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Recommendations
                    </label>
                    <textarea
                      value={assessment.recommendations || ''}
                      onChange={(e) => handleAssessmentChange(quarter.id, 'recommendations', e.target.value)}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none"
                      placeholder="Provide recommendations for improvement..."
                    />
                  </div>
                  
                  {/* Action Buttons */}
                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      onClick={() => setExpandedQuarter(null)}
                      className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => handleSubmitAssessment(quarter.id)}
                      disabled={saving}
                      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50"
                    >
                      {saving ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          Submitting...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Submit Assessment
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Completed Assessment Summary */}
            {isCompleted && assessment.expert_rating && (
              <div className="border-t border-green-100 p-4 bg-green-50/50 rounded-b-xl">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-gray-500 text-xs">Data Accuracy:</span>
                    <p className="font-medium text-gray-900 flex items-center gap-1">
                      <span>{getDataAccuracyIcon(assessment.data_accuracy)}</span>
                      {getDataAccuracyLabel(assessment.data_accuracy)}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Effort:</span>
                    <p className="font-medium text-gray-900">{assessment.effort_percentage}%</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Rating:</span>
                    <p className="font-medium text-purple-600">
                      {assessment.expert_rating}/5 - {getRatingLabel(assessment.expert_rating)}
                    </p>
                  </div>
                </div>
                {assessment.expert_comment && (
                  <div className="mt-2 pt-2 border-t border-green-100">
                    <span className="text-gray-500 text-xs">Comment:</span>
                    <p className="text-sm text-gray-700 mt-0.5">{assessment.expert_comment}</p>
                  </div>
                )}
                {assessment.recommendations && (
                  <div className="mt-2">
                    <span className="text-gray-500 text-xs">Recommendations:</span>
                    <p className="text-sm text-gray-700 mt-0.5">{assessment.recommendations}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
      
      {/* Completion Message */}
      {approvedQuarters.filter(q => assessments[q.id]?.expert_rating).length === approvedQuarters.length && approvedQuarters.length > 0 && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 text-center">
          <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
          <p className="text-sm font-medium text-green-700">All assessments completed!</p>
          <p className="text-xs text-green-600 mt-1">Great work, expert! All quarters have been assessed.</p>
        </div>
      )}
    </div>
  );
};

export default ExpertAssessment;