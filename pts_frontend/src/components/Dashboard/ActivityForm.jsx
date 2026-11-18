// src/components/Dashboard/ActivityForm.jsx (Refactored - Correct Flow)

import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, ArrowLeft, Calendar, Target, TrendingUp, Building2, 
  FileText, Landmark, MapPin, DollarSign, ChevronDown, ChevronUp,
  Plus, Trash2, X, Lock, CheckCircle, AlertCircle, Eye
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import ImageUpload from './ImageUpload';
import LocationPicker from './LocationPicker';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const ActivityForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isProjectAdmin = userRole === 'project_admin';
  const isDeliveryOfficer = userRole === 'delivery_officer';
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [images, setImages] = useState([]);
  
  // Form data
  const [formData, setFormData] = useState({
    activity_type: 'project',
    title: '',
    description: '',
    code: '',
    department: '',
    agency: '',
    funding_source: '',
    budget: '',
    program_goal: '',
    status: 'planning',
    start_date: '',
    end_date: '',
    latitude: '',
    longitude: '',
    location_address: '',
    location_description: ''
  });
  
  // Available data for dropdowns
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [deliverablesList, setDeliverablesList] = useState([]);
  const [availableIndicators, setAvailableIndicators] = useState([]);
  
  // Selected indicators for this activity
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    classification: true,
    details: true,
    indicators: true,
    location: true,
    timeline: true,
    images: true
  });
  
  const [selectedPriorityArea, setSelectedPriorityArea] = useState('');
  const [selectedDeliverable, setSelectedDeliverable] = useState('');
  const [assignmentType, setAssignmentType] = useState('department');

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    if (selectedPriorityArea) {
      fetchDeliverablesAndIndicators();
    }
  }, [selectedPriorityArea]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      
      const [departments, agencies, priorityAreas] = await Promise.all([
        mainApi.getPublicDepartments(),
        mainApi.getPublicAgencies(),
        mainApi.getPublicPriorityAreas()
      ]);
      
      setDepartmentsList(departments || []);
      setAgenciesList(agencies || []);
      setPriorityAreasList(priorityAreas || []);
      
      if (id) {
        await fetchActivityData();
        await fetchImages();
        await fetchExistingIndicators();
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
    } finally {
      setInitialLoading(false);
    }
  };

  const fetchActivityData = async () => {
    try {
      const activity = await mainApi.getActivityDetail(id);
      if (activity) {
        setFormData({
          activity_type: activity.activity_type || 'project',
          title: activity.title || '',
          description: activity.description || '',
          code: activity.code || '',
          department: activity.department || '',
          agency: activity.agency || '',
          funding_source: activity.funding_source || '',
          budget: activity.budget || '',
          program_goal: activity.program_goal || '',
          status: activity.status || 'planning',
          start_date: activity.start_date || '',
          end_date: activity.end_date || '',
          latitude: activity.latitude || '',
          longitude: activity.longitude || '',
          location_address: activity.location_address || '',
          location_description: activity.location_description || ''
        });
        
        if (activity.department) setAssignmentType('department');
        if (activity.agency) setAssignmentType('agency');
      }
    } catch (error) {
      console.error('Error fetching activity:', error);
      toast.error('Failed to load activity');
    }
  };

  const fetchImages = async () => {
    if (!id) return;
    try {
      const response = await engagementApi.getActivityImages(id);
      setImages(response || []);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchExistingIndicators = async () => {
    if (!id) return;
    try {
      // Get the activity details which includes associated indicators
      const activity = await mainApi.getActivityDetail(id);
      if (activity && activity.indicators) {
        // Fetch full indicator details
        const allIndicators = await mainApi.getPublicIndicators();
        const existingIndicators = allIndicators.filter(i => 
          activity.indicators.some(ai => ai.id === i.id)
        );
        setSelectedIndicators(existingIndicators);
      }
    } catch (error) {
      console.error('Error fetching existing indicators:', error);
    }
  };

  const fetchDeliverablesAndIndicators = async () => {
    if (!selectedPriorityArea) return;
    
    try {
      // Get deliverables for this priority area
      const allDeliverables = await mainApi.getPublicDeliverables();
      const filteredDeliverables = allDeliverables.filter(
        d => d.federal_priority_area === parseInt(selectedPriorityArea)
      );
      setDeliverablesList(filteredDeliverables);
      
      // Get all indicators
      const allIndicators = await mainApi.getPublicIndicators();
      setAvailableIndicators(allIndicators || []);
    } catch (error) {
      console.error('Error fetching deliverables/indicators:', error);
      toast.error('Failed to load indicators');
    }
  };

  const handleAddIndicator = (indicatorId) => {
    const indicator = availableIndicators.find(i => i.id === parseInt(indicatorId));
    if (!indicator) return;
    
    // Check if already added
    if (selectedIndicators.some(i => i.id === indicator.id)) {
      toast.error('Indicator already added');
      return;
    }
    
    setSelectedIndicators([...selectedIndicators, indicator]);
    setSelectedDeliverable('');
  };

  const handleRemoveIndicator = (indicatorId) => {
    setSelectedIndicators(selectedIndicators.filter(i => i.id !== indicatorId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title?.trim()) {
      toast.error('Please enter the title');
      return;
    }
    if (!formData.start_date) {
      toast.error('Please select start date');
      return;
    }
    if (selectedIndicators.length === 0) {
      toast.error('Please select at least one indicator for this activity');
      return;
    }
    
    setLoading(true);
    try {
      const submitData = {
        activity_type: formData.activity_type,
        title: formData.title,
        description: formData.description || '',
        code: formData.code || null,
        department: formData.department ? parseInt(formData.department) : null,
        agency: formData.agency ? parseInt(formData.agency) : null,
        funding_source: formData.funding_source || null,
        budget: formData.budget ? parseFloat(formData.budget) : null,
        program_goal: formData.program_goal || '',
        status: formData.status,
        latitude: formData.latitude ? parseFloat(formData.latitude) : null,
        longitude: formData.longitude ? parseFloat(formData.longitude) : null,
        location_address: formData.location_address || '',
        location_description: formData.location_description || '',
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        indicators: selectedIndicators.map(i => i.id)  // Send indicator IDs
      };
      
      let response;
      if (id) {
        await mainApi.updateActivity(id, submitData);
        toast.success('Activity updated successfully');
      } else {
        response = await mainApi.createActivity(submitData);
        const newActivityId = response.id;
        toast.success('Activity created successfully');
        navigate(`/dashboard/activities/${newActivityId}`);
        return;
      }
      navigate('/dashboard/activities');
    } catch (error) {
      console.error('Error:', error);
      toast.error(error.response?.data?.message || 'Failed to save activity');
    } finally {
      setLoading(false);
    }
  };

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const SectionHeader = ({ title, icon: Icon, section, isRequired = false, isLocked = false }) => (
    <div className="flex items-center justify-between w-full py-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </h2>
        {isLocked && (
          <span className="inline-flex items-center gap-1 ml-2 px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-md text-[10px]">
            <Lock className="w-2.5 h-2.5" />
            Read Only
          </span>
        )}
      </div>
      <button type="button" onClick={() => toggleSection(section)}>
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
    </div>
  );

  if (initialLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm mb-4">
        <button onClick={() => navigate('/dashboard/activities')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-2 text-sm">
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {id ? 'Edit Activity' : 'New Activity'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {id ? 'Update activity details and associated indicators' : 'Create a new project or program and link to indicators'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Activity Type */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">Activity Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { value: 'project', label: 'Project', icon: '📋' },
              { value: 'program', label: 'Program', icon: '📊' }
            ].map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, activity_type: type.value })}
                disabled={!isProjectAdmin || !!id}
                className={`py-2 px-2 rounded-lg text-center transition-all text-sm ${
                  formData.activity_type === type.value 
                    ? 'bg-green-600 text-white shadow-sm' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:opacity-50`}
              >
                <div className="text-lg">{type.icon}</div>
                <div className="text-xs font-medium">{type.label}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Basic Information */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Basic Information" icon={FileText} section="basic" isRequired />
          </div>
          {expandedSections.basic && (
            <div className="p-3 sm:p-4 pt-0 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input type="text" name="title" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Activity title" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                <input type="text" name="code" value={formData.code} onChange={(e) => setFormData({ ...formData, code: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="e.g., NEWMAP-001" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Description..." />
              </div>
            </div>
          )}
        </div>

        {/* Classification */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Classification" icon={Building2} section="classification" />
          </div>
          {expandedSections.classification && (
            <div className="p-3 sm:p-4 pt-0">
              <div className="flex gap-2 mb-3">
                <button type="button" onClick={() => setAssignmentType('department')} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${assignmentType === 'department' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Building2 className="w-4 h-4 inline mr-1" /> Department
                </button>
                <button type="button" onClick={() => setAssignmentType('agency')} className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${assignmentType === 'agency' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  <Landmark className="w-4 h-4 inline mr-1" /> Agency
                </button>
              </div>
              
              {assignmentType === 'department' && (
                <select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value, agency: '' })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select Department</option>
                  {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              )}
              {assignmentType === 'agency' && (
                <select value={formData.agency} onChange={(e) => setFormData({ ...formData, agency: e.target.value, department: '' })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                  <option value="">Select Agency</option>
                  {agenciesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              )}
            </div>
          )}
        </div>

        {/* Project/Program Details */}
        {(formData.activity_type === 'project' || formData.activity_type === 'program') && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 pt-3">
              <SectionHeader title={formData.activity_type === 'project' ? 'Project Details' : 'Program Details'} icon={formData.activity_type === 'project' ? DollarSign : Target} section="details" />
            </div>
            {expandedSections.details && (
              <div className="p-3 sm:p-4 pt-0 space-y-3">
                {formData.activity_type === 'project' ? (
                  <>
                    <select name="funding_source" value={formData.funding_source} onChange={(e) => setFormData({ ...formData, funding_source: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                      <option value="">Select Funding Source</option>
                      <option value="world_bank">🌍 World Bank</option>
                      <option value="eu">🇪🇺 European Union</option>
                      <option value="un">🇺🇳 United Nations</option>
                      <option value="afdb">🏦 African Development Bank</option>
                      <option value="internal">🇳🇬 Internal/FGN</option>
                      <option value="private">💼 Private Sector</option>
                      <option value="other">📦 Other</option>
                    </select>
                    <input type="number" name="budget" value={formData.budget} onChange={(e) => setFormData({ ...formData, budget: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" placeholder="Budget (₦)" />
                  </>
                ) : (
                  <textarea name="program_goal" value={formData.program_goal} onChange={(e) => setFormData({ ...formData, program_goal: e.target.value })} rows="3" className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none" placeholder="Overall goal of the program..." />
                )}
              </div>
            )}
          </div>
        )}

        {/* Indicators Selection - CRITICAL PART */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Select Indicators" icon={Target} section="indicators" isRequired />
            </div>
          </div>
          {expandedSections.indicators && (
            <div className="p-3 sm:p-4 pt-0">
              {/* Priority Area Filter */}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">Filter by Priority Area</label>
                <select 
                  value={selectedPriorityArea} 
                  onChange={(e) => setSelectedPriorityArea(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                >
                  <option value="">All Priority Areas</option>
                  {priorityAreasList.map(pa => (
                    <option key={pa.id} value={pa.id}>{pa.name}</option>
                  ))}
                </select>
              </div>
              
              {/* Add Indicator Dropdown */}
              {selectedPriorityArea && (
                <div className="mb-4">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Add Indicator</label>
                  <div className="flex gap-2">
                    <select 
                      value={selectedDeliverable} 
                      onChange={(e) => handleAddIndicator(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                    >
                      <option value="">Select an indicator to add...</option>
                      {availableIndicators
                        .filter(i => !selectedIndicators.some(si => si.id === i.id))
                        .filter(i => i.deliverable && deliverablesList.some(d => d.id === i.deliverable))
                        .map(i => (
                          <option key={i.id} value={i.id}>
                            {i.name} - Target: {i.target_value} {i.unit} ({i.measurement_type})
                          </option>
                        ))}
                    </select>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    Each indicator already has a defined target. You'll track quarterly progress against this target.
                  </p>
                </div>
              )}
              
              {/* Selected Indicators List */}
              {selectedIndicators.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Target className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">No indicators selected</p>
                  <p className="text-xs text-gray-400 mt-1">Select a priority area and add indicators that this activity will contribute to</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-xs font-medium text-gray-700">Selected Indicators ({selectedIndicators.length})</p>
                  {selectedIndicators.map((indicator) => (
                    <div key={indicator.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h4 className="font-medium text-gray-900 text-sm">{indicator.name}</h4>
                            <span className="text-xs px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700">
                              {indicator.measurement_type}
                            </span>
                            {indicator.is_cumulative && (
                              <span className="text-xs px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                Cumulative
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500">
                            Deliverable: {indicator.deliverable_name}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs">
                            <span className="text-gray-500">Target:</span>
                            <span className="font-semibold text-green-600">
                              {indicator.target_value} {indicator.unit}
                              {indicator.target_year && ` by ${indicator.target_year}`}
                            </span>
                            {indicator.baseline_value && (
                              <>
                                <span className="text-gray-500">Baseline:</span>
                                <span className="text-gray-600">{indicator.baseline_value} {indicator.unit}</span>
                              </>
                            )}
                          </div>
                          {indicator.description && (
                            <p className="text-xs text-gray-400 mt-1">{indicator.description}</p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveIndicator(indicator.id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              <div className="mt-3 p-2 bg-blue-50 rounded-lg">
                <p className="text-xs text-blue-700 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  <strong>Note:</strong> Quarterly targets will be auto-calculated based on the indicator's target. Delivery Officers will only need to enter actual values each quarter.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Activity Location" icon={MapPin} section="location" />
          </div>
          {expandedSections.location && (
            <div className="p-3 sm:p-4 pt-0">
              <LocationPicker 
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.location_address}
                onLocationChange={(lat, lng) => setFormData({ ...formData, latitude: lat, longitude: lng })}
                onAddressChange={(addr) => setFormData({ ...formData, location_address: addr })}
                disabled={false}
              />
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Additional Directions</label>
                <textarea
                  name="location_description"
                  value={formData.location_description}
                  onChange={(e) => setFormData({ ...formData, location_description: e.target.value })}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none"
                  placeholder="Landmarks, directions, etc."
                />
              </div>
            </div>
          )}
        </div>

        {/* Timeline & Status */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Timeline & Status" icon={Calendar} section="timeline" isRequired />
          </div>
          {expandedSections.timeline && (
            <div className="p-3 sm:p-4 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Start Date *</label>
                  <input type="date" name="start_date" value={formData.start_date} onChange={(e) => setFormData({ ...formData, start_date: e.target.value })} required className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input type="date" name="end_date" value={formData.end_date} onChange={(e) => setFormData({ ...formData, end_date: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select name="status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white">
                    <option value="planning">📝 Planning</option>
                    <option value="ongoing">🔄 Ongoing</option>
                    <option value="completed">✅ Completed</option>
                    <option value="on_hold">⏸️ On Hold</option>
                    <option value="cancelled">❌ Cancelled</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Activity Images" icon={FileText} section="images" />
          </div>
          {expandedSections.images && (
            <div className="p-3 sm:p-4 pt-0">
              <ImageUpload activityId={id} images={images} onImagesChange={setImages} disabled={false} />
              <p className="text-xs text-gray-400 mt-2">Up to 4 images, max 5MB each</p>
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-4">
          <button type="button" onClick={() => navigate('/dashboard/activities')} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium">Cancel</button>
          <button type="submit" disabled={loading} className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50">
            {loading ? <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div><span>Saving...</span></> : <><Save className="w-4 h-4" /><span>{id ? 'Update' : 'Create'} Activity</span></>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ActivityForm;