// src/components/Dashboard/ExpertAssessment.jsx
import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const ExpertAssessment = ({ initiativeId, onComplete }) => {
  const { user } = useAuth();
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [approvedDeliverables, setApprovedDeliverables] = useState([]);
  const [formData, setFormData] = useState({
    data_accuracy: '',
    effort_percentage: '',
    expert_comment: '',
    expert_rating: '',
    recommendations: ''
  });

  useEffect(() => {
    fetchAssessmentData();
  }, [initiativeId]);

  const fetchAssessmentData = async () => {
    try {
      setLoading(true);
      // Fetch the initiative data with approved deliverables
      const response = await mainApi.assessments.getInitiativeForExpert(initiativeId);
      setApprovedDeliverables(response.data.approved_deliverables || []);
      
      if (response.data.existing_assessment) {
        setAssessment(response.data.existing_assessment);
        setFormData({
          data_accuracy: response.data.existing_assessment.data_accuracy || '',
          effort_percentage: response.data.existing_assessment.effort_percentage || '',
          expert_comment: response.data.existing_assessment.expert_comment || '',
          expert_rating: response.data.existing_assessment.expert_rating || '',
          recommendations: response.data.existing_assessment.recommendations || ''
        });
      }
    } catch (error) {
      console.error('Error fetching assessment data:', error);
      toast.error('Failed to load assessment data');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.data_accuracy) {
      toast.error('Please select data accuracy');
      return;
    }
    if (!formData.effort_percentage) {
      toast.error('Please enter effort percentage');
      return;
    }
    if (!formData.expert_comment) {
      toast.error('Please enter your assessment comment');
      return;
    }
    if (!formData.expert_rating) {
      toast.error('Please select a rating');
      return;
    }

    setSaving(true);
    try {
      await mainApi.assessments.save(initiativeId, formData);
      toast.success('Assessment submitted successfully');
      if (onComplete) onComplete();
      fetchAssessmentData();
    } catch (error) {
      console.error('Error saving assessment:', error);
      toast.error('Failed to submit assessment');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  const isReadOnly = assessment && assessment.assessed_at;

  return (
    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-5 border border-purple-200">
      <div className="flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-purple-600" />
        <h3 className="text-base font-semibold text-purple-800">Expert Assessment</h3>
        {assessment && assessment.assessed_at && (
          <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full ml-auto">
            Assessed on {new Date(assessment.assessed_at).toLocaleDateString()}
          </span>
        )}
      </div>

      {/* Approved Deliverables Summary */}
      {approvedDeliverables.length > 0 && !isReadOnly && (
        <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
          <p className="text-xs font-medium text-gray-700 mb-2">Approved Deliverables for Assessment:</p>
          <div className="space-y-1">
            {approvedDeliverables.map((del, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm">
                <span className="text-gray-600">{del.name} (Q{del.quarter} {del.year})</span>
                <span className="text-green-600 font-medium">{del.achievement_percentage}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Data Accuracy */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data Accuracy *
          </label>
          <select
            value={formData.data_accuracy}
            onChange={(e) => setFormData({ ...formData, data_accuracy: e.target.value })}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm bg-white disabled:bg-gray-100"
            required
          >
            <option value="">Select data accuracy</option>
            <option value="available">✅ Data Available - Verified</option>
            <option value="not_available">❌ Data Not Available</option>
            <option value="inaccurate">⚠️ Data Not Accurate</option>
            <option value="not_verifiable">🔍 Data Not Verifiable</option>
          </select>
        </div>

        {/* Effort Percentage */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Efforts Towards Achieving Goals (%) *
          </label>
          <input
            type="number"
            value={formData.effort_percentage}
            onChange={(e) => setFormData({ ...formData, effort_percentage: e.target.value })}
            disabled={isReadOnly}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm disabled:bg-gray-100"
            placeholder="Enter percentage (0-100)"
            min="0"
            max="100"
            required
          />
        </div>

        {/* Expert Comment */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Expert Comment *
          </label>
          <textarea
            value={formData.expert_comment}
            onChange={(e) => setFormData({ ...formData, expert_comment: e.target.value })}
            disabled={isReadOnly}
            rows="4"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none disabled:bg-gray-100"
            placeholder="Provide your expert assessment, observations, and findings..."
            required
          />
        </div>

        {/* Expert Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Expert Rating *
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[1, 2, 3, 4, 5].map(rating => (
              <button
                key={rating}
                type="button"
                onClick={() => !isReadOnly && setFormData({ ...formData, expert_rating: rating })}
                disabled={isReadOnly}
                className={`py-2 rounded-lg text-center transition-all ${
                  formData.expert_rating === rating 
                    ? 'bg-purple-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                {rating}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>Poor</span>
            <span>Fair</span>
            <span>Good</span>
            <span>Very Good</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Recommendations */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recommendations (Optional)
          </label>
          <textarea
            value={formData.recommendations}
            onChange={(e) => setFormData({ ...formData, recommendations: e.target.value })}
            disabled={isReadOnly}
            rows="3"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm resize-none disabled:bg-gray-100"
            placeholder="Provide recommendations for improvement..."
          />
        </div>

        {!isReadOnly && (
          <div className="flex justify-end pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Submit Assessment
                </>
              )}
            </button>
          </div>
        )}
      </form>

      {/* Display existing assessment if available and read-only */}
      {isReadOnly && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Data Accuracy:</span>
              <span className="font-medium capitalize">
                {assessment?.data_accuracy?.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Effort:</span>
              <span className="font-medium">{assessment?.effort_percentage}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Expert Rating:</span>
              <span className="font-medium">{assessment?.expert_rating}/5</span>
            </div>
            <div className="mt-2 pt-2 border-t border-gray-200">
              <p className="text-gray-500 text-xs mb-1">Comment:</p>
              <p className="text-gray-700">{assessment?.expert_comment}</p>
            </div>
            {assessment?.recommendations && (
              <div className="mt-2 pt-2 border-t border-gray-200">
                <p className="text-gray-500 text-xs mb-1">Recommendations:</p>
                <p className="text-gray-700">{assessment?.recommendations}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ExpertAssessment;