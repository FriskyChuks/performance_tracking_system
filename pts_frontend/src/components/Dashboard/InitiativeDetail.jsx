// src/components/Dashboard/InitiativeDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, Target, TrendingUp,
  Building2, Layers, Package, FileText, BarChart3,
  AlertCircle, Download, Share2, CheckCircle, Clock, Award,
  Image as ImageIcon, ChevronLeft, ChevronRight, X, Star,
  Landmark, Briefcase, MapPin, DollarSign, Globe,
  ChevronDown, ChevronUp, Send, Eye, Plus,XCircle
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { engagementApi } from '../../services/engagementApi';
import accountsApi from '../../services/accountsApi';
import { useAuth } from '../../hooks/useAuth';
import ExpertAssessment from './ExpertAssessment';
import toast from 'react-hot-toast';

const InitiativeDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;
  const isSuperAdmin = user?.is_superuser;
  
  // Role-based permissions - FIXED for sector expert
  const isStaff = userRole === 'staff' || isSuperAdmin;
  const isDirector = userRole === 'director' || isSuperAdmin;
  const isSectorExpert = userRole === 'sector_expert' || isSuperAdmin;
  const canEdit = (userRole === 'project_admin' || isSuperAdmin || isStaff) && !isSectorExpert;
  const canDelete = userRole === 'project_admin' || isSuperAdmin;
  
  const [initiative, setInitiative] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [assessment, setAssessment] = useState(null);
  const [deliverablesData, setDeliverablesData] = useState([]);
  const [expandedDeliverable, setExpandedDeliverable] = useState(null);
  const [updating, setUpdating] = useState(false);
  const [hierarchy, setHierarchy] = useState({ 
    department: null, 
    agency: null, 
    priorityArea: null, 
    deliverables: [] 
  });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Destructure mainApi for easier access
  const { initiatives, departments, agencies, priorityAreas, deliverables, quarterlyProgress } = mainApi;

  useEffect(() => { 
    fetchInitiativeDetails(); 
    fetchImages();
    fetchAssessment();
    fetchDeliverablesWithQuarters();
  }, [id]);

  const fetchImages = async () => {
    try {
      const response = await engagementApi.getInitiativeImages(id);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchAssessment = async () => {
    try {
      const response = await mainApi.assessments.getByInitiative(id);
      if (response.data) {
        setAssessment(response.data);
      }
    } catch (error) {
      console.error('Error fetching assessment:', error);
    }
  };

  const fetchDeliverablesWithQuarters = async () => {
    try {
      const response = await quarterlyProgress.getByInitiative(id);
      const quarters = response.data || [];
      
      const deliverablesMap = new Map();
      quarters.forEach(quarter => {
        if (!deliverablesMap.has(quarter.deliverable_id)) {
          deliverablesMap.set(quarter.deliverable_id, {
            id: quarter.deliverable_id,
            name: quarter.deliverable_name,
            unit: quarter.unit_of_measure,
            target_total: 0,
            actual_total: 0,
            quarters: []
          });
        }
        const deliverable = deliverablesMap.get(quarter.deliverable_id);
        deliverable.quarters.push({
          id: quarter.id,
          quarter: quarter.quarter,
          year: quarter.year,
          target_value: quarter.target_value,
          actual_value: quarter.actual_value,
          status: quarter.status,
          achievement_percentage: quarter.achievement_percentage,
          staff_comment: quarter.staff_comment
        });
        deliverable.target_total += parseFloat(quarter.target_value) || 0;
        deliverable.actual_total += parseFloat(quarter.actual_value) || 0;
      });
      
      const deliverablesArray = Array.from(deliverablesMap.values()).map(d => ({
        ...d,
        overall_achievement: d.target_total > 0 ? (d.actual_total / d.target_total) * 100 : 0
      }));
      
      setDeliverablesData(deliverablesArray);
    } catch (error) {
      console.error('Error fetching deliverables with quarters:', error);
    }
  };

  const fetchInitiativeDetails = async () => {
    try {
      setLoading(true);
      const initiativesRes = await initiatives.list();
      const initiativeData = initiativesRes.data.find(i => i.id === parseInt(id));
      
      if (!initiativeData) {
        toast.error('Initiative not found');
        navigate('/dashboard/initiatives');
        return;
      }
      
      setInitiative(initiativeData);
      
      if (initiativeData.department) {
        const deptRes = await departments.list();
        const department = deptRes.data.find(d => d.id === initiativeData.department);
        if (department) setHierarchy(prev => ({ ...prev, department }));
      }
      
      if (initiativeData.agency) {
        const agencyRes = await agencies.list();
        const agency = agencyRes.data.find(a => a.id === initiativeData.agency);
        if (agency) setHierarchy(prev => ({ ...prev, agency }));
      }
      
      if (initiativeData.priority_area) {
        const paRes = await priorityAreas.list();
        const priorityArea = paRes.data.find(p => p.id === initiativeData.priority_area);
        if (priorityArea) setHierarchy(prev => ({ ...prev, priorityArea }));
      }
      
      if (initiativeData.deliverables && initiativeData.deliverables.length > 0) {
        const delRes = await deliverables.list();
        const deliverablesList = delRes.data.filter(d => initiativeData.deliverables.includes(d.id));
        setHierarchy(prev => ({ ...prev, deliverables: deliverablesList }));
      }
    } catch (error) {
      console.error('Error fetching initiative:', error);
      toast.error('Failed to load initiative');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    if (!canDelete) {
      toast.error('You do not have permission to delete this initiative');
      return;
    }
    try {
      await initiatives.delete(id);
      await accountsApi.logActivity({ 
        action: 'initiative_deleted', 
        description: `Deleted initiative: ${initiative?.title}` 
      });
      toast.success('Initiative deleted');
      navigate('/dashboard/initiatives');
    } catch (error) { 
      toast.error('Failed to delete initiative'); 
    }
  };

  const handleUpdateActual = async (quarterId, actualValue) => {
    if (!actualValue && actualValue !== 0) {
      toast.error('Please enter actual value');
      return;
    }
    
    setUpdating(true);
    try {
      await quarterlyProgress.updateActual(quarterId, { actual_value: actualValue });
      toast.success('Actual value updated');
      fetchDeliverablesWithQuarters();
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
      await quarterlyProgress.submitForReview(quarterId);
      toast.success('Quarter submitted for review');
      fetchDeliverablesWithQuarters();
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
        await quarterlyProgress.approve(quarterId);
        toast.success('Quarter approved');
      } else {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await quarterlyProgress.reject(quarterId, { reason });
          toast.success('Quarter rejected');
        }
      }
      fetchDeliverablesWithQuarters();
    } catch (error) {
      console.error(`Error ${action}ing quarter:`, error);
      toast.error(`Failed to ${action} quarter`);
    } finally {
      setUpdating(false);
    }
  };

  const openGallery = (index) => {
    setSelectedImageIndex(index);
    setShowGallery(true);
  };

  const getRatingInfo = (rating) => {
    const ratings = {
      5: { label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100', icon: '🏆', border: 'border-green-500' },
      4: { label: 'Very Good', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: '⭐', border: 'border-emerald-500' },
      3: { label: 'Good', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '👍', border: 'border-yellow-500' },
      2: { label: 'Fair', color: 'text-orange-700', bg: 'bg-orange-100', icon: '⚠️', border: 'border-orange-500' },
      1: { label: 'Poor', color: 'text-red-700', bg: 'bg-red-100', icon: '🔴', border: 'border-red-500' }
    };
    return ratings[rating] || { label: 'Not Rated', color: 'text-gray-700', bg: 'bg-gray-100', icon: '📊', border: 'border-gray-500' };
  };

  const getStatusInfo = (status) => {
    const statuses = {
      'planning': { label: 'Planning', color: 'bg-gray-100 text-gray-700', icon: '📝' },
      'ongoing': { label: 'Ongoing', color: 'bg-blue-100 text-blue-700', icon: '🔄' },
      'completed': { label: 'Completed', color: 'bg-green-100 text-green-700', icon: '✅' },
      'on_hold': { label: 'On Hold', color: 'bg-yellow-100 text-yellow-700', icon: '⏸️' },
      'cancelled': { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: '❌' }
    };
    return statuses[status] || statuses.planning;
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

  const getFundingSourceInfo = (source) => {
    const sources = {
      'world_bank': { label: 'World Bank', icon: '🌍' },
      'eu': { label: 'European Union', icon: '🇪🇺' },
      'un': { label: 'United Nations', icon: '🇺🇳' },
      'afdb': { label: 'African Development Bank', icon: '🏦' },
      'internal': { label: 'Internal/FGN', icon: '🇳🇬' },
      'private': { label: 'Private Sector', icon: '💼' },
      'other': { label: 'Other', icon: '📦' }
    };
    return sources[source] || { label: source, icon: '📋' };
  };

  const statusInfo = getStatusInfo(initiative?.status);
  const ratingInfo = getRatingInfo(initiative?.performance_rating);
  const totalTarget = deliverablesData.reduce((sum, d) => sum + d.target_total, 0);
  const totalActual = deliverablesData.reduce((sum, d) => sum + d.actual_total, 0);
  const overallProgress = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading initiative...</p>
      </div>
    </div>
  );

  if (!initiative) return (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Initiative not found</h3>
      <p className="text-gray-500 text-sm mt-2">The initiative doesn't exist.</p>
      <button onClick={() => navigate('/dashboard/initiatives')} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm shadow-sm hover:bg-green-700 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Initiatives
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <button onClick={() => navigate('/dashboard/initiatives')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-3 text-sm transition group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          Back to Initiatives
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md flex-shrink-0">
                {initiative.initiative_type === 'project' ? (
                  <Briefcase className="w-5 h-5 text-white" />
                ) : (
                  <Target className="w-5 h-5 text-white" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${initiative.initiative_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'}`}>
                    {initiative.initiative_type === 'project' ? '📋 Project' : '📊 Program'}
                  </span>
                  {initiative.code && (
                    <span className="text-xs text-gray-400">Code: {initiative.code}</span>
                  )}
                </div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{initiative.title}</h1>
                <p className="text-xs text-gray-500 mt-1">{initiative.description}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 ml-11 sm:ml-0">
            {canEdit && (
              <button onClick={() => navigate(`/dashboard/initiatives/${id}/edit`)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm">
                <Edit className="w-3.5 h-3.5" /> Edit
              </button>
            )}
            {canDelete && (
              <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1.5 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 text-sm">
                <Trash2 className="w-3.5 h-3.5" /> Delete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-gray-900">Overall Initiative Progress</h3>
          <span className="text-sm font-bold text-green-600">{overallProgress.toFixed(1)}%</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(overallProgress, 100)}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Based on {deliverablesData.length} deliverable{deliverablesData.length !== 1 ? 's' : ''} across 4 quarters
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main Content - Left Side */}
        <div className="lg:col-span-2 space-y-4">
          {/* Image Gallery Section */}
          {images.length > 0 && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-green-600" />
                  Initiative Images ({images.length})
                </h3>
                {images.length > 4 && (
                  <button onClick={() => openGallery(0)} className="text-xs text-green-600 hover:text-green-700 transition">
                    View All
                  </button>
                )}
              </div>
              
              {images.find(img => img.is_primary) && (
                <div className="relative rounded-lg overflow-hidden cursor-pointer mb-3 group" onClick={() => openGallery(images.findIndex(img => img.is_primary))}>
                  <img src={images.find(img => img.is_primary).image_url || images.find(img => img.is_primary).image} alt="Primary initiative image" className="w-full h-64 object-cover group-hover:scale-105 transition duration-300" />
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Primary
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 rounded-full p-2"><ImageIcon className="w-5 h-5 text-gray-700" /></div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, idx) => (
                  <div key={img.id} className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group" onClick={() => openGallery(idx)}>
                    <img src={img.image_url || img.image} alt={img.caption || 'Initiative image'} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
                    {!img.is_primary && images.find(i => i.is_primary)?.id !== img.id && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-1.5"><ImageIcon className="w-3 h-3 text-gray-700" /></div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchy Breadcrumb */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Initiative Hierarchy</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              {hierarchy.department && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                  <Building2 className="w-3 h-3 text-green-600" />
                  <span className="font-medium text-gray-700">{hierarchy.department.name}</span>
                </div>
              )}
              {hierarchy.agency && (
                <>
                  <span className="text-gray-400 text-xs">→</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                    <Landmark className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-gray-700">{hierarchy.agency.name}</span>
                  </div>
                </>
              )}
              {hierarchy.priorityArea && (
                <>
                  <span className="text-gray-400 text-xs">→</span>
                  <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                    <Target className="w-3 h-3 text-green-600" />
                    <span className="font-medium text-gray-700">{hierarchy.priorityArea.name}</span>
                  </div>
                </>
              )}
            </div>
            
            {hierarchy.deliverables.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-100">
                <p className="text-xs text-gray-500 mb-2">Associated Deliverables:</p>
                <div className="flex flex-wrap gap-1.5">
                  {hierarchy.deliverables.map(d => (
                    <span key={d.id} className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 text-green-700 rounded-full text-xs">
                      <CheckCircle className="w-2.5 h-2.5" />
                      {d.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Deliverables & Quarterly Progress Section */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <Package className="w-4 h-4 text-green-600" />
              Deliverables & Quarterly Progress
            </h3>
            
            {deliverablesData.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-gray-500 text-sm">No deliverables configured for this initiative</p>
              </div>
            ) : (
              <div className="space-y-4">
                {deliverablesData.map((deliverable) => (
                  <div key={deliverable.id} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div
                      className="p-3 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:bg-gray-100 transition flex items-center justify-between"
                      onClick={() => setExpandedDeliverable(expandedDeliverable === deliverable.id ? null : deliverable.id)}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-semibold text-gray-900">{deliverable.name}</h4>
                          <span className="text-xs text-gray-500">Unit: {deliverable.unit}</span>
                        </div>
                        <div className="flex items-center gap-4 mt-1">
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Target:</span>
                            <span className="text-xs font-medium text-gray-700">{deliverable.target_total} {deliverable.unit}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Actual:</span>
                            <span className="text-xs font-medium text-green-600">{deliverable.actual_total} {deliverable.unit}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-gray-500">Achievement:</span>
                            <span className="text-xs font-medium text-blue-600">{deliverable.overall_achievement.toFixed(1)}%</span>
                          </div>
                        </div>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${expandedDeliverable === deliverable.id ? 'rotate-180' : ''}`} />
                    </div>

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
                                        onClick={() => handleApproveReject(quarter.id, 'reject')}
                                        className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs"
                                      >
                                        Reject
                                      </button>
                                      <button
                                        onClick={() => handleApproveReject(quarter.id, 'approve')}
                                        className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs"
                                      >
                                        Approve
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
            )}
          </div>

          {initiative.performance_comment && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Performance Comments
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{initiative.performance_comment}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4">
          {/* Status & Rating Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-200 text-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg ${statusInfo.color}`}>
                <span className="text-lg">{statusInfo.icon}</span>
                <span className="text-sm font-medium">{statusInfo.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Current Status</p>
            </div>
            
            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 border border-gray-200 text-center">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${ratingInfo.bg} border ${ratingInfo.border}`}>
                <span className="text-lg">{ratingInfo.icon}</span>
                <span className="text-sm font-bold">{ratingInfo.label}</span>
              </div>
              <p className="text-xs text-gray-500 mt-2">Rating {initiative.performance_rating}/5</p>
            </div>
          </div>

          {/* Expert Assessment Section - Only for Sector Expert */}
          {isSectorExpert && (
            <ExpertAssessment 
              initiativeId={initiative.id}
              onComplete={() => {
                fetchAssessment();
                fetchDeliverablesWithQuarters();
              }}
            />
          )}

          {/* Show Existing Assessment for non-experts */}
          {assessment && !isSectorExpert && (
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                Expert Assessment
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Data Accuracy:</span>
                  <span className="font-medium capitalize">{assessment.data_accuracy?.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Effort:</span>
                  <span className="font-medium">{assessment.effort_percentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expert Rating:</span>
                  <span className="font-medium">{assessment.expert_rating}/5</span>
                </div>
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <p className="text-gray-500 text-xs mb-1">Comment:</p>
                  <p className="text-gray-700 text-sm">{assessment.expert_comment}</p>
                </div>
                {assessment.recommendations && (
                  <div className="mt-2 pt-2 border-t border-gray-200">
                    <p className="text-gray-500 text-xs mb-1">Recommendations:</p>
                    <p className="text-gray-700 text-sm">{assessment.recommendations}</p>
                  </div>
                )}
                <div className="mt-2 text-xs text-gray-400">
                  Assessed on {new Date(assessment.assessed_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          )}

          {/* Timeline Card */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Start Date</span>
                <span className="font-semibold text-gray-900 text-sm">{new Date(initiative.start_date).toLocaleDateString()}</span>
              </div>
              {initiative.end_date && (
                <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                  <span className="text-sm text-gray-600">End Date</span>
                  <span className="font-semibold text-gray-900 text-sm">{new Date(initiative.end_date).toLocaleDateString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                <span className="text-sm text-gray-600">Duration</span>
                <span className="font-semibold text-gray-900 text-sm">
                  {Math.ceil((new Date(initiative.end_date || new Date()) - new Date(initiative.start_date)) / (1000 * 60 * 60 * 24))} days
                </span>
              </div>
            </div>
          </div>

          {/* Project Specific Details */}
          {initiative.initiative_type === 'project' && initiative.funding_source && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
                <DollarSign className="w-3.5 h-3.5" />
                Funding
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between items-center py-1.5">
                  <span className="text-sm text-gray-600">Source</span>
                  <span className="font-semibold text-gray-900 text-sm">
                    {getFundingSourceInfo(initiative.funding_source).icon} {getFundingSourceInfo(initiative.funding_source).label}
                  </span>
                </div>
                {initiative.budget && (
                  <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                    <span className="text-sm text-gray-600">Budget</span>
                    <span className="font-semibold text-gray-900 text-sm">₦{initiative.budget.toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Program Specific Details */}
          {initiative.initiative_type === 'program' && initiative.program_goal && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Program Goal</h3>
              <p className="text-sm text-gray-600 leading-relaxed">{initiative.program_goal}</p>
            </div>
          )}

          {/* Location Card */}
          {(initiative.latitude || initiative.longitude || initiative.location_address) && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5" />
                Location
              </h3>
              {initiative.location_address && (
                <p className="text-sm text-gray-600 mb-2">{initiative.location_address}</p>
              )}
              {(initiative.latitude || initiative.longitude) && (
                <p className="text-xs text-gray-500">
                  Coordinates: {initiative.latitude}, {initiative.longitude}
                </p>
              )}
              {initiative.location_description && (
                <p className="text-xs text-gray-500 mt-2">{initiative.location_description}</p>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Quick Actions</h3>
            <div className="space-y-1">
              <button className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2">
                <Download className="w-3.5 h-3.5 text-green-600" />
                Export Report
              </button>
              <button className="w-full px-3 py-1.5 text-left text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition flex items-center gap-2">
                <Share2 className="w-3.5 h-3.5 text-green-600" />
                Share Initiative
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {canDelete && showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg"><AlertCircle className="w-4 h-4 text-white" /></div>
                <h3 className="text-base font-bold text-white">Delete Initiative</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2">Delete <span className="font-semibold">"{initiative.title}"</span>?</p>
              <p className="text-xs text-gray-500 mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm">Cancel</button>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm">
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <button onClick={() => setShowGallery(false)} className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"><X className="w-8 h-8" /></button>
          <button onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)} className="absolute left-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2 hover:bg-black/70"><ChevronLeft className="w-6 h-6" /></button>
          <button onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)} className="absolute right-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2 hover:bg-black/70"><ChevronRight className="w-6 h-6" /></button>
          
          <div className="max-w-4xl max-h-[80vh] mx-4">
            <img src={images[selectedImageIndex]?.image_url || images[selectedImageIndex]?.image} alt={images[selectedImageIndex]?.caption || 'Initiative image'} className="max-w-full max-h-[80vh] object-contain" />
            {images[selectedImageIndex]?.caption && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">{images[selectedImageIndex].caption}</div>
            )}
          </div>
          
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
              {images.map((img, idx) => (
                <button key={img.id} onClick={() => setSelectedImageIndex(idx)} className={`w-12 h-12 rounded overflow-hidden border-2 transition ${idx === selectedImageIndex ? 'border-green-500' : 'border-transparent'}`}>
                  <img src={img.image_url || img.image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default InitiativeDetail;