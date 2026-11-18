// src/components/Dashboard/ActivityDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import {
  ArrowLeft, Edit, Trash2, Calendar, Target, TrendingUp,
  Building2, Layers, Package, FileText, BarChart3,
  AlertCircle, Download, Share2, CheckCircle, Clock, Award,
  Image as ImageIcon, ChevronLeft, ChevronRight, X, Star,
  Landmark, MapPin, DollarSign, Send, Eye, Plus, XCircle,
  Activity, Flag, ThumbsDown, MessageSquare, Save,
  ChevronDown, ChevronUp, User, File, Upload, Paperclip,
  ExternalLink, Grid, List, ZoomIn, Heart, ThumbsUp, Printer,
  AlertTriangle,
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import engagementApi from '../../services/engagementApi';
import { useAuth } from '../../hooks/useAuth';
import ActivityMap from '../Common/ActivityMap';
import toast from 'react-hot-toast';
import RejectionModal from './MyTasks/RejectionModal';

// Helpers
const formatNumber = (value, decimals = 1) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) return '0';
  return parseFloat(value).toFixed(decimals);
};

const getSafePercentage = (value) => {
  if (value === undefined || value === null || isNaN(parseFloat(value))) return 0;
  return Math.min(parseFloat(value), 100);
};

const ActivityDetail = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole } = useAuth();

  // Query params for pre-selection
  const queryParams = new URLSearchParams(location.search);
  const preSelectedIndicator = queryParams.get('assessment');
  const preSelectedQuarter = queryParams.get('quarter');
  const preSelectedYear = queryParams.get('year');

  // State
  const [activity, setActivity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [indicatorsData, setIndicatorsData] = useState([]);
  const [updating, setUpdating] = useState(false);
  const [showAssessmentModal, setShowAssessmentModal] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState(null);
  const [actualValues, setActualValues] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedImage, setSelectedImage] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [expertReviews, setExpertReviews] = useState([]);

  // Rejection modal
  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  // Roles
  const isProjectAdmin = userRole === 'project_admin';
  const isDeliveryOfficer = userRole === 'delivery_officer';
  const isDirector = userRole === 'director';
  const isSectorExpert = userRole === 'sector_expert';
  const canEdit = isProjectAdmin;

  // Assessment form
  const [assessmentForm, setAssessmentForm] = useState({
    data_accuracy: '',
    effort_percentage: '',
    expert_comment: '',
    expert_rating: '',
    recommendations: '',
  });

  useEffect(() => {
    fetchAllData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (preSelectedIndicator && indicatorsData.length > 0) {
      const indicator = indicatorsData.find((i) => i.id === parseInt(preSelectedIndicator));
      if (indicator && preSelectedQuarter && preSelectedYear) {
        const quarter = indicator.quarters.find(
          (q) =>
            q.quarter === parseInt(preSelectedQuarter) &&
            q.year === parseInt(preSelectedYear)
        );
        if (quarter && quarter.status === 'approved' && !quarter.expert_rating && isSectorExpert) {
          setActiveTab('assessment');
          setSelectedQuarter(quarter);
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [indicatorsData, preSelectedIndicator]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const activityData = await mainApi.getPublicActivityDetail(id);
      setActivity(activityData);

      const imagesData = await engagementApi.getActivityImages(id);
      setImages(imagesData || []);

      if (activityData && activityData.indicators) {
        const indicatorsWithProgress = activityData.indicators.map((indicator) => {
          const quarters = [];
          for (let q = 1; q <= 4; q++) {
            const existingProgress = indicator.quarters?.find((p) => p.quarter === q) || {};
            const quarterlyTarget = indicator.target_value / 4;

            quarters.push({
              id: existingProgress.id || `${indicator.id}_q${q}`,
              quarter: q,
              year: existingProgress.year ?? new Date().getFullYear(),
              quarterly_target: quarterlyTarget,
              annual_target: indicator.target_value,
              actual_value: existingProgress.actual_value || null,
              status: existingProgress.status || 'draft',
              cumulative_percentage: existingProgress.cumulative_percentage || 0,
              staff_comment: existingProgress.staff_comment || '',
              expert_rating: existingProgress.expert_rating || null,
              expert_comment: existingProgress.expert_comment || '',
              expert_recommendations: existingProgress.expert_recommendations || '',
              data_accuracy: existingProgress.data_accuracy || '',
              effort_percentage: existingProgress.effort_percentage || '',
              // NEW — rejection history
              rejection_reason: existingProgress.rejection_reason || '',
              rejection_category: existingProgress.rejection_category || '',
              rejected_at: existingProgress.rejected_at || null,
              rejected_by_name: existingProgress.rejected_by_name || '',
              can_edit:
                existingProgress.status === 'draft' && isDeliveryOfficer,
              can_approve: existingProgress.status === 'submitted' && isDirector,
              can_assess:
                existingProgress.status === 'approved' &&
                !existingProgress.expert_rating &&
                isSectorExpert,
            });
          }

          const targetTotal = quarters.reduce((s, q) => s + (q.quarterly_target || 0), 0);
          const actualTotal = quarters.reduce((s, q) => s + (q.actual_value || 0), 0);
          const overallAchievement = targetTotal > 0 ? (actualTotal / targetTotal) * 100 : 0;

          return {
            id: indicator.id,
            name: indicator.name,
            unit: indicator.unit || '',
            annual_target: indicator.target_value,
            quarters,
            target_total: targetTotal,
            actual_total: actualTotal,
            overall_achievement: overallAchievement,
          };
        });

        setIndicatorsData(indicatorsWithProgress);

        indicatorsWithProgress.forEach((ind) => {
          ind.quarters.forEach((q) => {
            if ((q.status === 'draft' || q.status === 'rejected') && !actualValues[q.id]) {
              setActualValues((prev) => ({ ...prev, [q.id]: q.actual_value || '' }));
            }
          });
        });

        const reviews = [];
        indicatorsWithProgress.forEach((ind) => {
          ind.quarters.forEach((q) => {
            if (q.status === 'assessed' && q.expert_rating) {
              reviews.push({
                id: q.id,
                indicator_name: ind.name,
                quarter: q.quarter,
                year: q.year,
                rating: q.expert_rating,
                comment: q.expert_comment,
                recommendations: q.expert_recommendations,
                data_accuracy: q.data_accuracy,
                effort_percentage: q.effort_percentage,
              });
            }
          });
        });
        setExpertReviews(reviews);
      }
    } catch (error) {
      console.error('Error fetching activity data:', error);
      toast.error('Failed to load activity data');
    } finally {
      setLoading(false);
    }
  };

  // Delivery Officer
  const handleActualValueChange = (quarterId, value) => {
    setActualValues((prev) => ({ ...prev, [quarterId]: value }));
  };

  const handleUpdateActual = async (quarterId) => {
    const actualValue = actualValues[quarterId];
    if (!actualValue && actualValue !== 0) {
      toast.error('Please enter actual value');
      return;
    }
    setUpdating(true);
    try {
      await mainApi.updateQuarterlyProgress(quarterId, {
        actual_value: parseFloat(actualValue),
      });
      toast.success('Actual value updated');
      await fetchAllData();
    } catch (error) {
      toast.error('Failed to update');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitForReview = async (quarterId) => {
    setUpdating(true);
    try {
      await mainApi.updateQuarterlyProgress(quarterId, { status: 'submitted' });
      toast.success('Submitted for review');
      await fetchAllData();
    } catch (error) {
      toast.error('Failed to submit');
    } finally {
      setUpdating(false);
    }
  };

  // Director
  const handleApprove = async (quarter) => {
    setUpdating(true);
    try {
      await mainApi.approveProgress(quarter.id, 'approved');
      toast.success('Quarter approved');
      await fetchAllData();
    } catch (error) {
      toast.error('Failed to approve');
    } finally {
      setUpdating(false);
    }
  };

  const openReject = (quarter, indicator) => {
    setRejectTarget({
      id: quarter.id,
      activityTitle: activity?.title,
      indicatorName: indicator?.name,
      quarter: quarter.quarter,
      year: quarter.year,
    });
  };

  const handleConfirmReject = async ({ category, reason }) => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await mainApi.approveProgress(rejectTarget.id, 'rejected', {
        rejection_category: category,
        rejection_reason: reason || '',
      });
      toast.success('Quarter rejected. Officer can resubmit.');
      setRejectTarget(null);
      await fetchAllData();
    } catch (err) {
      const data = err?.response?.data;
      const msg =
        typeof data === 'string'
          ? data
          : data?.detail ||
            (data && Object.values(data).flat().join(' ')) ||
            'Failed to reject';
      toast.error(msg);
    } finally {
      setIsRejecting(false);
    }
  };

  // Sector Expert
  const openAssessmentModal = (quarter) => {
    setSelectedQuarter(quarter);
    setAssessmentForm({
      data_accuracy: '',
      effort_percentage: '',
      expert_comment: '',
      expert_rating: '',
      recommendations: '',
    });
    setShowAssessmentModal(true);
  };

  const handleSubmitAssessment = async () => {
    if (!assessmentForm.data_accuracy) {
      toast.error('Please select data accuracy');
      return;
    }
    if (!assessmentForm.effort_percentage) {
      toast.error('Please enter effort percentage');
      return;
    }
    if (!assessmentForm.expert_comment) {
      toast.error('Please enter your comment');
      return;
    }
    if (!assessmentForm.expert_rating) {
      toast.error('Please select a rating');
      return;
    }

    setUpdating(true);
    try {
      await mainApi.submitAssessment(selectedQuarter.id, {
        expert_rating: parseInt(assessmentForm.expert_rating),
        expert_comment: assessmentForm.expert_comment,
        expert_recommendations: assessmentForm.recommendations,
        data_accuracy: assessmentForm.data_accuracy,
        effort_percentage: parseInt(assessmentForm.effort_percentage),
        status: 'assessed',
      });
      toast.success('Assessment submitted');
      setShowAssessmentModal(false);
      await fetchAllData();
    } catch (error) {
      toast.error('Failed to submit assessment');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusBadge = (status) => {
    const config = {
      draft: { label: 'Pending Update', icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700' },
      rejected: { label: 'Rejected - Resubmit', icon: <XCircle className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700' },
      submitted: { label: 'Under Review', icon: <Send className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      approved: { label: 'Approved', icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700' },
      assessed: { label: 'Assessed', icon: <Award className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
    };
    const c = config[status] || config.draft;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${c.color}`}>
        {c.icon} {c.label}
      </span>
    );
  };

  const getRatingStars = (rating) => '⭐'.repeat(rating) + '☆'.repeat(5 - rating);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading activity...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-medium">Activity not found</h3>
          <button onClick={() => navigate(-1)} className="mt-4 text-green-600">
            Go Back
          </button>
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
            <h1 className="text-xl font-bold text-gray-900">{activity.title}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span
                className={`text-xs px-2 py-0.5 rounded-full ${
                  activity.activity_type === 'project'
                    ? 'bg-blue-100 text-blue-700'
                    : 'bg-purple-100 text-purple-700'
                }`}
              >
                {activity.activity_type === 'project' ? '📋 Project' : '📊 Program'}
              </span>
              {activity.code && (
                <span className="text-xs text-gray-400">Code: {activity.code}</span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {canEdit && (
              <button
                onClick={() => navigate(`/dashboard/activities/${id}/edit`)}
                className="p-2 text-gray-500 hover:text-green-600 rounded-lg transition"
                title="Edit Activity"
              >
                <Edit className="w-5 h-5" />
              </button>
            )}
            <button
              onClick={() => window.print()}
              className="p-2 text-gray-500 hover:text-gray-700 rounded-lg transition"
              title="Print"
            >
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200 scrollbar-thin">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'overview'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Eye className="w-4 h-4 inline mr-1" /> Overview
          </button>
          <button
            onClick={() => setActiveTab('progress')}
            className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'progress'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Target className="w-4 h-4 inline mr-1" /> Progress & Indicators
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'map'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <MapPin className="w-4 h-4 inline mr-1" /> Location Map
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'documents'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <ImageIcon className="w-4 h-4 inline mr-1" /> Media ({images.length})
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
              activeTab === 'reviews'
                ? 'text-green-600 border-b-2 border-green-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Award className="w-4 h-4 inline mr-1" /> Expert Reviews ({expertReviews.length})
          </button>
          {isSectorExpert && (
            <button
              onClick={() => setActiveTab('assessment')}
              className={`px-4 py-2.5 text-sm font-medium transition whitespace-nowrap ${
                activeTab === 'assessment'
                  ? 'text-green-600 border-b-2 border-green-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <Send className="w-4 h-4 inline mr-1" /> Pending Assessment
            </button>
          )}
        </div>

        {/* OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="p-4 space-y-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 text-sm">
                {activity.description || 'No description provided.'}
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <Calendar className="w-4 h-4" /> Timeline
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Start Date:</span>{' '}
                    {new Date(activity.start_date).toLocaleDateString()}
                  </p>
                  {activity.end_date && (
                    <p>
                      <span className="text-gray-500">End Date:</span>{' '}
                      {new Date(activity.end_date).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>

              {(activity.department_name || activity.agency_name) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <Building2 className="w-4 h-4" /> Responsible Entity
                  </h3>
                  <p className="text-sm">{activity.department_name || activity.agency_name}</p>
                </div>
              )}

              {(activity.latitude || activity.longitude || activity.location_address) && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <MapPin className="w-4 h-4" /> Location
                  </h3>
                  {activity.location_address && (
                    <p className="text-sm">{activity.location_address}</p>
                  )}
                </div>
              )}

              {activity.activity_type === 'project' && activity.funding_source && (
                <div className="bg-gray-50 rounded-lg p-3">
                  <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                    <DollarSign className="w-4 h-4" /> Funding
                  </h3>
                  <p className="text-sm">Source: {activity.funding_source?.replace('_', ' ')}</p>
                  {activity.budget && (
                    <p className="text-sm">Budget: ₦{parseFloat(activity.budget).toLocaleString()}</p>
                  )}
                </div>
              )}
            </div>

            {(activity.latitude || activity.longitude) && (
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-2 flex items-center gap-1">
                  <MapPin className="w-4 h-4" /> Location Map
                </h3>
                <ActivityMap
                  latitude={activity.latitude}
                  longitude={activity.longitude}
                  address={activity.location_address}
                  title={activity.title}
                />
              </div>
            )}
          </div>
        )}

        {/* PROGRESS */}
        {activeTab === 'progress' && (
          <div className="p-4">
            {indicatorsData.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No indicators configured for this activity
              </div>
            ) : (
              <div className="space-y-6">
                {indicatorsData.map((indicator) => (
                  <div
                    key={indicator.id}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div className="bg-gray-50 p-3 border-b border-gray-200">
                      <h3 className="font-semibold text-gray-900">{indicator.name}</h3>
                      <p className="text-xs text-gray-500">Unit: {indicator.unit}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500">
                          Annual Target: {formatNumber(indicator.annual_target)} {indicator.unit}
                        </span>
                        <span className="text-xs text-green-600">
                          Overall Achievement: {formatNumber(indicator.overall_achievement)}%
                        </span>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left py-2 px-3">Quarter</th>
                            <th className="text-left py-2 px-3">Quarterly Target</th>
                            <th className="text-left py-2 px-3">Actual</th>
                            <th className="text-left py-2 px-3">Cumulative %</th>
                            <th className="text-left py-2 px-3">Status</th>
                            <th className="text-left py-2 px-3">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {indicator.quarters.map((quarter) => (
                            <React.Fragment key={quarter.id}>
                              <tr className="border-t border-gray-100">
                                <td className="py-2 px-3 font-medium">
                                  Q{quarter.quarter} {quarter.year}
                                </td>
                                <td className="py-2 px-3">
                                  <div>
                                    {formatNumber(quarter.quarterly_target)} {indicator.unit}
                                  </div>
                                  <div className="text-xs text-gray-400">
                                    Annual: {formatNumber(quarter.annual_target)} {indicator.unit}
                                  </div>
                                </td>
                                <td className="py-2 px-3">
                                  {quarter.can_edit ? (
                                    <div className="flex items-center gap-1">
                                      <input
                                        type="number"
                                        value={
                                          actualValues[quarter.id] !== undefined
                                            ? actualValues[quarter.id]
                                            : quarter.actual_value || ''
                                        }
                                        onChange={(e) =>
                                          handleActualValueChange(quarter.id, e.target.value)
                                        }
                                        className="w-24 px-2 py-1 border rounded text-sm"
                                        placeholder="Enter actual"
                                        step="0.01"
                                      />
                                      {actualValues[quarter.id] !== undefined &&
                                        actualValues[quarter.id] !== quarter.actual_value && (
                                          <button
                                            onClick={() => handleUpdateActual(quarter.id)}
                                            disabled={updating}
                                            className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                          >
                                            <Save className="w-3 h-3" />
                                          </button>
                                        )}
                                    </div>
                                  ) : (
                                    <span
                                      className={
                                        quarter.actual_value
                                          ? 'font-medium text-green-600'
                                          : 'text-gray-400'
                                      }
                                    >
                                      {quarter.actual_value
                                        ? `${formatNumber(quarter.actual_value)} ${indicator.unit}`
                                        : 'Not entered'}
                                    </span>
                                  )}
                                </td>
                                <td className="py-2 px-3">
                                  <div className="flex items-center gap-1">
                                    <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-green-500 rounded-full"
                                        style={{
                                          width: `${getSafePercentage(
                                            quarter.cumulative_percentage
                                          )}%`,
                                        }}
                                      />
                                    </div>
                                    <span className="text-xs">
                                      {formatNumber(quarter.cumulative_percentage)}%
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-400">of annual target</div>
                                </td>
                                <td className="py-2 px-3">{getStatusBadge(quarter.status)}</td>
                                <td className="py-2 px-3">
                                  {quarter.can_edit && quarter.actual_value && (
                                    <button
                                      onClick={() => handleSubmitForReview(quarter.id)}
                                      className="px-2 py-1 bg-blue-600 text-white rounded text-xs flex items-center gap-1"
                                    >
                                      <Send className="w-3 h-3" /> Submit
                                    </button>
                                  )}
                                  {quarter.can_approve && (
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => openReject(quarter, indicator)}
                                        className="px-2 py-1 bg-red-600 text-white rounded text-xs"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => handleApprove(quarter)}
                                        className="px-2 py-1 bg-green-600 text-white rounded text-xs"
                                      >
                                        Approve
                                      </button>
                                    </div>
                                  )}
                                  {quarter.can_assess && (
                                    <button
                                      onClick={() => openAssessmentModal(quarter)}
                                      className="px-2 py-1 bg-purple-600 text-white rounded text-xs flex items-center gap-1"
                                    >
                                      <Award className="w-3 h-3" /> Assess
                                    </button>
                                  )}
                                  {quarter.expert_rating && (
                                    <span className="text-xs text-purple-600 flex items-center gap-1">
                                      {getRatingStars(quarter.expert_rating)} {quarter.expert_rating}/5
                                    </span>
                                  )}
                                </td>
                              </tr>
                              {quarter.rejection_reason &&
                                (quarter.status === 'draft' || quarter.status === 'rejected') && (
                                  <tr>
                                    <td colSpan={6} className="pb-2 px-3">
                                      <div className="text-[11px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-2 py-1.5 flex items-start gap-1.5">
                                        <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
                                        <div>
                                          <strong>
                                            Rejected
                                            {quarter.rejected_by_name
                                              ? ` by ${quarter.rejected_by_name}`
                                              : ''}
                                            :
                                          </strong>{' '}
                                          {quarter.rejection_category && (
                                            <span className="capitalize">
                                              {quarter.rejection_category.replace('_', ' ')} —{' '}
                                            </span>
                                          )}
                                          {quarter.rejection_reason}
                                        </div>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* MAP */}
        {activeTab === 'map' && (
          <div className="p-4 space-y-4">
            <div className="bg-white rounded-xl">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-green-600" />
                Project Location
              </h3>

              {activity.latitude && activity.longitude ? (
                <>
                  <ActivityMap
                    latitude={activity.latitude}
                    longitude={activity.longitude}
                    address={activity.location_address}
                    title={activity.title}
                  />
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Coordinates:</span> {activity.latitude},{' '}
                      {activity.longitude}
                    </p>
                    {activity.location_address && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">Address:</span> {activity.location_address}
                      </p>
                    )}
                    {activity.location_description && (
                      <p className="text-sm text-gray-600 mt-2 italic">
                        "{activity.location_description}"
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200">
                  <MapPin className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No location data available for this activity</p>
                  <p className="text-xs text-gray-400 mt-1">
                    The Delivery Officer will update the location soon
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* DOCUMENTS */}
        {activeTab === 'documents' && (
          <div className="p-4">
            {images.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No images uploaded for this activity</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group cursor-pointer"
                    onClick={() => {
                      setSelectedImage(img);
                      setShowImageModal(true);
                    }}
                  >
                    <img
                      src={img.image_url || img.image}
                      alt={img.caption || 'Activity image'}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 group-hover:border-green-500 transition"
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center transition">
                      <ZoomIn className="w-6 h-6 text-white" />
                    </div>
                    {img.is_primary && (
                      <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Primary
                      </div>
                    )}
                    {img.caption && (
                      <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate rounded-b-lg">
                        {img.caption}
                      </div>
                    )}
                    {img.quarter && (
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded-full">
                        Q{img.quarter} {img.year}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* REVIEWS */}
        {activeTab === 'reviews' && (
          <div className="p-4">
            {expertReviews.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No expert reviews have been submitted yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Reviews will appear here once sector experts assess the quarterly reports
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {expertReviews.map((review, idx) => (
                  <div
                    key={idx}
                    className="border border-purple-200 rounded-lg overflow-hidden bg-purple-50/30"
                  >
                    <div className="bg-purple-100 px-4 py-2 border-b border-purple-200 flex justify-between items-center flex-wrap gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 text-sm">
                          {review.indicator_name}
                        </h3>
                        <p className="text-xs text-gray-500">
                          Q{review.quarter} {review.year}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-purple-700">
                          {getRatingStars(review.rating)}
                        </span>
                        <span className="text-xs text-gray-500">({review.rating}/5)</span>
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Data Accuracy:</span>
                          <span className="font-medium capitalize">
                            {review.data_accuracy?.replace('_', ' ') || 'N/A'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">Effort:</span>
                          <span className="font-medium">{review.effort_percentage || 0}%</span>
                        </div>
                      </div>
                      {review.comment && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Expert Comment
                          </h4>
                          <p className="text-sm text-gray-700 bg-white p-2 rounded-lg">
                            {review.comment}
                          </p>
                        </div>
                      )}
                      {review.recommendations && (
                        <div>
                          <h4 className="text-xs font-semibold text-gray-500 uppercase mb-1">
                            Recommendations
                          </h4>
                          <p className="text-sm text-gray-600 bg-white p-2 rounded-lg">
                            {review.recommendations}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ASSESSMENT */}
        {activeTab === 'assessment' && isSectorExpert && (
          <div className="p-4">
            {indicatorsData
              .flatMap((i) => i.quarters)
              .filter((q) => q.can_assess).length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                <p>No pending assessments for this activity</p>
              </div>
            ) : (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3">
                  Pending Assessments
                </h3>
                {indicatorsData.map((indicator) =>
                  indicator.quarters
                    .filter((q) => q.can_assess)
                    .map((quarter) => (
                      <div
                        key={quarter.id}
                        className="border border-purple-200 rounded-lg p-4 bg-purple-50"
                      >
                        <div className="flex justify-between items-start flex-wrap gap-3">
                          <div>
                            <h3 className="font-semibold text-gray-900">{indicator.name}</h3>
                            <p className="text-sm text-gray-600">
                              Q{quarter.quarter} {quarter.year}
                            </p>
                            <div className="grid grid-cols-2 gap-3 mt-2 text-sm">
                              <div>
                                <span className="text-gray-500">Quarterly Target:</span>
                                <span className="ml-1 font-medium">
                                  {formatNumber(quarter.quarterly_target)} {indicator.unit}
                                </span>
                              </div>
                              <div>
                                <span className="text-gray-500">Actual Achieved:</span>
                                <span className="ml-1 font-medium text-green-600">
                                  {formatNumber(quarter.actual_value)} {indicator.unit}
                                </span>
                              </div>
                              <div className="col-span-2">
                                <span className="text-gray-500">Cumulative Achievement:</span>
                                <div className="flex items-center gap-2 mt-1">
                                  <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-green-500 rounded-full"
                                      style={{
                                        width: `${getSafePercentage(
                                          quarter.cumulative_percentage
                                        )}%`,
                                      }}
                                    />
                                  </div>
                                  <span className="text-sm font-medium">
                                    {formatNumber(quarter.cumulative_percentage)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <button
                            onClick={() => openAssessmentModal(quarter)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm flex items-center gap-2 transition shadow-sm"
                          >
                            <Award className="w-4 h-4" />
                            Assess
                          </button>
                        </div>
                      </div>
                    ))
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Image modal */}
      {showImageModal && selectedImage && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setShowImageModal(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition"
            >
              <X className="w-6 h-6" />
            </button>
            <img
              src={selectedImage.image_url || selectedImage.image}
              alt={selectedImage.caption || 'Activity image'}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
            />
            {selectedImage.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white p-2 text-center rounded-b-lg">
                {selectedImage.caption}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Assessment modal */}
      {showAssessmentModal && selectedQuarter && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setShowAssessmentModal(false)}
        >
          <div
            className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 sticky top-0">
              <h3 className="text-white font-bold">Expert Assessment</h3>
              <p className="text-purple-100 text-sm">
                Q{selectedQuarter.quarter} {selectedQuarter.year}
              </p>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Data Accuracy *</label>
                <select
                  value={assessmentForm.data_accuracy}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, data_accuracy: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Select</option>
                  <option value="available">✅ Data Available - Verified</option>
                  <option value="not_available">❌ Data Not Available</option>
                  <option value="inaccurate">⚠️ Data Not Accurate</option>
                  <option value="not_verifiable">🔍 Data Not Verifiable</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Effort Percentage *</label>
                <input
                  type="number"
                  value={assessmentForm.effort_percentage}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, effort_percentage: e.target.value })
                  }
                  className="w-full p-2 border rounded-lg"
                  placeholder="0-100"
                  min="0"
                  max="100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expert Rating *</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((r) => (
                    <button
                      key={r}
                      onClick={() => setAssessmentForm({ ...assessmentForm, expert_rating: r })}
                      className={`flex-1 py-2 rounded-lg transition ${
                        assessmentForm.expert_rating === r
                          ? 'bg-purple-600 text-white shadow-md'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {r}
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
              <div>
                <label className="block text-sm font-medium mb-1">Comment *</label>
                <textarea
                  value={assessmentForm.expert_comment}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, expert_comment: e.target.value })
                  }
                  rows="3"
                  className="w-full p-2 border rounded-lg resize-none"
                  placeholder="Your assessment..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Recommendations</label>
                <textarea
                  value={assessmentForm.recommendations}
                  onChange={(e) =>
                    setAssessmentForm({ ...assessmentForm, recommendations: e.target.value })
                  }
                  rows="2"
                  className="w-full p-2 border rounded-lg resize-none"
                  placeholder="Suggestions for improvement..."
                />
              </div>
              <div className="flex gap-2 pt-4 sticky bottom-0 bg-white pb-2">
                <button
                  onClick={() => setShowAssessmentModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmitAssessment}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition"
                >
                  Submit Assessment
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reusable rejection modal */}
      <RejectionModal
        open={!!rejectTarget}
        onClose={() => !isRejecting && setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        target={rejectTarget}
        submitting={isRejecting}
      />
    </div>
  );
};

export default ActivityDetail;