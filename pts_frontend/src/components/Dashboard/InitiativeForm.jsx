// src/components/Dashboard/InitiativeForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Save, 
  ArrowLeft, 
  Calendar, 
  Target, 
  TrendingUp, 
  Building2, 
  FileText, 
  BarChart3, 
  AlertCircle,
  Clock,
  Image as ImageIcon,
  Landmark,
  Briefcase,
  MapPin,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  X
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import accountsApi from '../../services/accountsApi';
import { engagementApi } from '../../services/engagementApi';
import ImageUpload from './ImageUpload';
import LocationPicker from './LocationPicker';
import toast from 'react-hot-toast';
import { useAuth } from '../../hooks/useAuth';

const InitiativeForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userRole = user?.role;
  const isSuperAdmin = user?.is_superuser;
  
  const isProjectAdmin = userRole === 'project_admin' || isSuperAdmin;
  const isStaff = userRole === 'staff' || isSuperAdmin;
  const isDirector = userRole === 'director';
  const isSectorExpert = userRole === 'sector_expert';
  
  const canCreateNew = isProjectAdmin;
  const isReadOnly = isDirector || isSectorExpert || (!canCreateNew && !id);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [images, setImages] = useState([]);
  
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [deliverablesList, setDeliverablesList] = useState([]);
  
  // Deliverables with their own target values
  const [selectedDeliverables, setSelectedDeliverables] = useState([]);
  
  const [formData, setFormData] = useState({
    initiative_type: 'project',
    title: '',
    description: '',
    code: '',
    department: '',
    agency: '',
    priority_area: '',
    funding_source: '',
    budget: '',
    program_goal: '',
    status: 'planning',
    latitude: '',
    longitude: '',
    location_address: '',
    location_description: '',
    start_date: '',
    end_date: '',
    performance_comment: ''
  });
  
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [selectedPriorityArea, setSelectedPriorityArea] = useState('');
  const [loadingDeliverables, setLoadingDeliverables] = useState(false);
  const [assignmentType, setAssignmentType] = useState('department');
  const [expandedSections, setExpandedSections] = useState({
    basic: true,
    classification: true,
    details: true,
    priority: true,
    deliverables: true,
    location: true,
    timeline: true,
    images: true,
    assessment: true
  });

  useEffect(() => { 
    fetchInitialData(); 
  }, []);
  
  useEffect(() => {
    if (selectedPriorityArea) {
      fetchDeliverables();
    } else {
      setDeliverablesList([]);
      setSelectedDeliverables([]);
    }
  }, [selectedPriorityArea]);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const [deptRes, agencyRes, priorityRes] = await Promise.all([
        mainApi.departments.list(),
        mainApi.agencies.list(),
        mainApi.priorityAreas.list()
      ]);
      setDepartmentsList(deptRes.data);
      setAgenciesList(agencyRes.data);
      setPriorityAreasList(priorityRes.data);
      
      if (id) {
        await fetchInitiativeData();
        await fetchImages();
        await fetchDeliverablesWithTargets();
      } else {
        setInitialLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load data');
      setInitialLoading(false);
    }
  };

  const fetchImages = async () => {
    if (!id) return;
    try {
      const response = await engagementApi.getInitiativeImages(id);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchDeliverablesWithTargets = async () => {
    if (!id) return;
    try {
      const response = await mainApi.quarterlyProgress.getByInitiative(id);
      const quarters = response.data || [];
      
      console.log('Fetched quarters:', quarters);
      
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
          achievement_percentage: quarter.achievement_percentage
        });
      });
      
      const deliverables = Array.from(deliverablesMap.values());
      console.log('Processed deliverables:', deliverables);
      setSelectedDeliverables(deliverables);
    } catch (error) {
      console.error('Error fetching deliverables with targets:', error);
    }
  };

  const fetchInitiativeData = async () => {
    try {
      const initiativesRes = await mainApi.initiatives.list();
      const initiative = initiativesRes.data.find(i => i.id === parseInt(id));
      
      if (initiative) {
        setFormData({
          initiative_type: initiative.initiative_type || 'project',
          title: initiative.title || '',
          description: initiative.description || '',
          code: initiative.code || '',
          department: initiative.department || '',
          agency: initiative.agency || '',
          priority_area: initiative.priority_area || '',
          funding_source: initiative.funding_source || '',
          budget: initiative.budget || '',
          program_goal: initiative.program_goal || '',
          status: initiative.status || 'planning',
          latitude: initiative.latitude || '',
          longitude: initiative.longitude || '',
          location_address: initiative.location_address || '',
          location_description: initiative.location_description || '',
          start_date: initiative.start_date || '',
          end_date: initiative.end_date || '',
          performance_comment: initiative.performance_comment || ''
        });
        
        if (initiative.department) {
          setAssignmentType('department');
          setSelectedDepartment(initiative.department);
        }
        if (initiative.agency) {
          setAssignmentType('agency');
          setSelectedAgency(initiative.agency);
        }
        if (initiative.priority_area) {
          setSelectedPriorityArea(initiative.priority_area);
        }
      }
      setInitialLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load initiative');
      setInitialLoading(false);
    }
  };

  const fetchDeliverables = async () => {
    if (!selectedPriorityArea) return;
    
    setLoadingDeliverables(true);
    try {
      const response = await mainApi.deliverables.list({ priority_area: selectedPriorityArea });
      setDeliverablesList(response.data);
    } catch (error) { 
      console.error('Error fetching deliverables:', error);
      toast.error('Failed to load deliverables');
    } finally {
      setLoadingDeliverables(false);
    }
  };

  const handleAddDeliverable = () => {
    setSelectedDeliverables(prev => [...prev, {
      id: null,
      name: '',
      unit: '',
      target_value: '',
      quarters: [
        { quarter: 1, year: new Date().getFullYear(), target_value: '', actual_value: null, status: 'draft' },
        { quarter: 2, year: new Date().getFullYear(), target_value: '', actual_value: null, status: 'draft' },
        { quarter: 3, year: new Date().getFullYear(), target_value: '', actual_value: null, status: 'draft' },
        { quarter: 4, year: new Date().getFullYear(), target_value: '', actual_value: null, status: 'draft' }
      ]
    }]);
  };

  const handleRemoveDeliverable = (index) => {
    setSelectedDeliverables(prev => prev.filter((_, i) => i !== index));
  };

  const handleDeliverableSelect = (index, deliverableId) => {
    const selectedDel = deliverablesList.find(d => d.id === parseInt(deliverableId));
    if (selectedDel) {
      const newDeliverables = [...selectedDeliverables];
      newDeliverables[index] = {
        id: selectedDel.id,
        name: selectedDel.name,
        unit: selectedDel.unit,
        target_value: selectedDel.target_value,
        quarters: [
          { quarter: 1, year: new Date().getFullYear(), target_value: selectedDel.target_value, actual_value: null, status: 'draft' },
          { quarter: 2, year: new Date().getFullYear(), target_value: selectedDel.target_value, actual_value: null, status: 'draft' },
          { quarter: 3, year: new Date().getFullYear(), target_value: selectedDel.target_value, actual_value: null, status: 'draft' },
          { quarter: 4, year: new Date().getFullYear(), target_value: selectedDel.target_value, actual_value: null, status: 'draft' }
        ]
      };
      setSelectedDeliverables(newDeliverables);
    }
  };

  const handleDeliverableTargetChange = (index, quarterIdx, field, value) => {
    const newDeliverables = [...selectedDeliverables];
    newDeliverables[index].quarters[quarterIdx][field] = value;
    setSelectedDeliverables(newDeliverables);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePriorityAreaChange = (e) => {
    const value = e.target.value;
    setFormData(prev => ({ ...prev, priority_area: value }));
    setSelectedPriorityArea(value);
    setSelectedDeliverables([]);
  };

  const handleAssignmentTypeChange = (type) => {
    setAssignmentType(type);
    if (type === 'department') {
      setFormData(prev => ({ ...prev, agency: '' }));
    } else {
      setFormData(prev => ({ ...prev, department: '' }));
    }
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
  };

  const handleLocationChange = (lat, lng) => {
    setFormData(prev => ({
      ...prev,
      latitude: lat,
      longitude: lng
    }));
  };

  const handleAddressChange = (address) => {
    setFormData(prev => ({
      ...prev,
      location_address: address
    }));
  };

  // Update the handleSubmit function in InitiativeForm.jsx
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
    if (selectedDeliverables.length === 0) {
      toast.error('Please add at least one deliverable');
      return;
    }
    
    // Validate deliverables
    for (const del of selectedDeliverables) {
      if (!del.id) {
        toast.error('Please select a deliverable');
        return;
      }
      for (const quarter of del.quarters) {
        if (!quarter.target_value) {
          toast.error(`Please set target value for ${del.name} Q${quarter.quarter}`);
          return;
        }
      }
    }
    
    setLoading(true);
    try {
      // Prepare submit data
      const submitData = {
        initiative_type: formData.initiative_type,
        title: formData.title,
        description: formData.description || '',
        code: formData.code || null,
        department: formData.department ? parseInt(formData.department) : null,
        agency: formData.agency ? parseInt(formData.agency) : null,
        priority_area: formData.priority_area ? parseInt(formData.priority_area) : null,
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
        performance_comment: formData.performance_comment || ''
      };
      
      console.log('Submitting initiative data:', submitData);
      
      let response;
      if (id) {
        // Update existing initiative
        response = await mainApi.initiatives.update(id, submitData);
        await accountsApi.logActivity({ 
          action: 'initiative_updated', 
          description: `Updated initiative: ${formData.title}` 
        });
        
        // Update quarterly targets
        for (const del of selectedDeliverables) {
          for (const quarter of del.quarters) {
            const quarterData = {
              deliverable_id: del.id,
              quarter: quarter.quarter,
              year: quarter.year,
              target_value: parseFloat(quarter.target_value),
              unit_of_measure: del.unit
            };
            console.log('Updating quarter data:', quarterData);
            // Use upsert for existing initiative
            await mainApi.quarterlyProgress.upsert(id, quarterData);
          }
        }
        
        toast.success('Initiative updated successfully');
      } else {
        // Create new initiative
        response = await mainApi.initiatives.create(submitData);
        await accountsApi.logActivity({ 
          action: 'initiative_created', 
          description: `Created initiative: ${formData.title}` 
        });
        
        const newInitiativeId = response.data.id;
        
        // Create quarterly targets for new initiative
        for (const del of selectedDeliverables) {
          for (const quarter of del.quarters) {
            const quarterData = {
              deliverable_id: del.id,
              quarter: quarter.quarter,
              year: quarter.year,
              target_value: parseFloat(quarter.target_value),
              unit_of_measure: del.unit
            };
            console.log('Creating quarter data:', quarterData);
            await mainApi.quarterlyProgress.create(newInitiativeId, quarterData);
          }
        }
        
        toast.success('Initiative created successfully');
        
        if (images.length > 0) {
          navigate(`/dashboard/initiatives/${newInitiativeId}/edit`);
          return;
        }
      }
      navigate('/dashboard/initiatives');
    } catch (error) {
      console.error('Error saving initiative:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || 
                      error.response?.data?.error || 
                      JSON.stringify(error.response?.data) ||
                      'Failed to save initiative';
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const SectionHeader = ({ title, icon: Icon, section, isRequired = false }) => (
    <div className="flex items-center justify-between w-full py-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-green-600" />
        <h2 className="text-sm font-semibold text-gray-900">
          {title}
          {isRequired && <span className="text-red-500 ml-1">*</span>}
        </h2>
      </div>
      <button
        type="button"
        onClick={() => toggleSection(section)}
        className="group"
      >
        {expandedSections[section] ? (
          <ChevronUp className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
        )}
      </button>
    </div>
  );

  const initiativeTypes = [
    { value: 'project', label: 'Project', icon: '📋', description: 'Sponsored or packaged project' },
    { value: 'program', label: 'Program', icon: '📊', description: 'Ongoing initiative program' }
  ];

  const statusOptions = [
    { value: 'planning', label: 'Planning', icon: '📝' },
    { value: 'ongoing', label: 'Ongoing', icon: '🔄' },
    { value: 'completed', label: 'Completed', icon: '✅' },
    { value: 'on_hold', label: 'On Hold', icon: '⏸️' },
    { value: 'cancelled', label: 'Cancelled', icon: '❌' }
  ];

  const fundingSources = [
    { value: 'world_bank', label: 'World Bank', icon: '🌍' },
    { value: 'eu', label: 'European Union', icon: '🇪🇺' },
    { value: 'un', label: 'United Nations', icon: '🇺🇳' },
    { value: 'afdb', label: 'African Development Bank', icon: '🏦' },
    { value: 'internal', label: 'Internal/FGN', icon: '🇳🇬' },
    { value: 'private', label: 'Private Sector', icon: '💼' },
    { value: 'other', label: 'Other', icon: '📦' }
  ];

  if (initialLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  return (
    <div className="w-full px-3 sm:px-4 py-3 sm:py-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 shadow-sm mb-4">
        <button 
          onClick={() => navigate('/dashboard/initiatives')} 
          className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-2 text-sm transition group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          Back
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              {id ? 'Edit Initiative' : 'New Initiative'}
            </h1>
            <p className="text-xs text-gray-500 mt-0.5 hidden sm:block">
              {id ? 'Update initiative details' : 'Create a new project or program'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        {/* Initiative Type Selection */}
        <div className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <label className="block text-xs font-medium text-gray-700 mb-2">Initiative Type *</label>
          <div className="grid grid-cols-2 gap-2">
            {initiativeTypes.map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFormData({ ...formData, initiative_type: type.value })}
                disabled={isReadOnly}
                className={`py-2 px-2 rounded-lg text-center transition-all text-sm ${
                  formData.initiative_type === type.value 
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

        {/* Basic Information Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Basic Information" icon={FileText} section="basic" isRequired />
          </div>
          {expandedSections.basic && (
            <div className="p-3 sm:p-4 pt-0 space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  value={formData.title} 
                  onChange={handleChange} 
                  required 
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" 
                  placeholder="Project title"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Code</label>
                <input 
                  type="text" 
                  name="code" 
                  value={formData.code} 
                  onChange={handleChange} 
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" 
                  placeholder="e.g., NEWMAP-001"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  value={formData.description} 
                  onChange={handleChange} 
                  rows="3" 
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none disabled:bg-gray-50" 
                  placeholder="Description..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Classification Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Classification" icon={Building2} section="classification" />
          </div>
          {expandedSections.classification && (
            <div className="p-3 sm:p-4 pt-0">
              <div className="flex gap-2 mb-3">
                <button
                  type="button"
                  onClick={() => handleAssignmentTypeChange('department')}
                  disabled={isReadOnly}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    assignmentType === 'department' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  <Building2 className="w-4 h-4 inline mr-1" />
                  Department
                </button>
                <button
                  type="button"
                  onClick={() => handleAssignmentTypeChange('agency')}
                  disabled={isReadOnly}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    assignmentType === 'agency' 
                      ? 'bg-green-600 text-white' 
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  } disabled:opacity-50`}
                >
                  <Landmark className="w-4 h-4 inline mr-1" />
                  Agency
                </button>
              </div>
              
              {assignmentType === 'department' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Department</label>
                  <select 
                    value={formData.department} 
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })} 
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              )}
              
              {assignmentType === 'agency' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Select Agency</label>
                  <select 
                    value={formData.agency} 
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })} 
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
                  >
                    <option value="">Select Agency</option>
                    {agenciesList.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Project/Program Details */}
        {(formData.initiative_type === 'project' || formData.initiative_type === 'program') && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 pt-3">
              <SectionHeader 
                title={formData.initiative_type === 'project' ? 'Project Details' : 'Program Details'} 
                icon={formData.initiative_type === 'project' ? DollarSign : Target} 
                section="details" 
              />
            </div>
            {expandedSections.details && (
              <div className="p-3 sm:p-4 pt-0 space-y-3">
                {formData.initiative_type === 'project' ? (
                  <>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Funding Source</label>
                      <select 
                        name="funding_source" 
                        value={formData.funding_source} 
                        onChange={handleChange} 
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
                      >
                        <option value="">Select Funding Source</option>
                        {fundingSources.map(fs => <option key={fs.value} value={fs.value}>{fs.icon} {fs.label}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Budget (₦)</label>
                      <input 
                        type="number" 
                        name="budget" 
                        value={formData.budget} 
                        onChange={handleChange} 
                        disabled={isReadOnly}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50" 
                        placeholder="0.00"
                      />
                    </div>
                  </>
                ) : (
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Program Goal</label>
                    <textarea 
                      name="program_goal" 
                      value={formData.program_goal} 
                      onChange={handleChange} 
                      rows="3" 
                      disabled={isReadOnly}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none disabled:bg-gray-50" 
                      placeholder="Overall goal of the program..."
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Priority Area */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Priority Area" icon={Target} section="priority" isRequired />
          </div>
          {expandedSections.priority && (
            <div className="p-3 sm:p-4 pt-0">
              <select 
                value={formData.priority_area} 
                onChange={handlePriorityAreaChange} 
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
                required
              >
                <option value="">Select Priority Area</option>
                {priorityAreasList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>

        {/* Deliverables Section with Quarterly Targets */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <div className="flex items-center justify-between">
              <SectionHeader title="Deliverables & Quarterly Targets" icon={Target} section="deliverables" isRequired />
              {!isReadOnly && (
                <button
                  type="button"
                  onClick={handleAddDeliverable}
                  className="p-1 text-green-600 hover:bg-green-50 rounded-lg transition"
                >
                  <Plus className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          {expandedSections.deliverables && (
            <div className="p-3 sm:p-4 pt-0">
              {selectedDeliverables.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <p className="text-gray-500 text-sm">No deliverables added yet</p>
                  {!isReadOnly && (
                    <button
                      type="button"
                      onClick={handleAddDeliverable}
                      className="mt-2 text-green-600 hover:text-green-700 text-sm flex items-center gap-1 mx-auto"
                    >
                      <Plus className="w-4 h-4" />
                      Add Deliverable
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-6">
                  {selectedDeliverables.map((deliverable, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex-1">
                          {deliverable.id ? (
                            <div>
                              <h4 className="font-medium text-gray-900">{deliverable.name}</h4>
                              <p className="text-xs text-gray-500">Unit: {deliverable.unit}</p>
                            </div>
                          ) : (
                            <select
                              value=""
                              onChange={(e) => handleDeliverableSelect(idx, e.target.value)}
                              disabled={isReadOnly}
                              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white"
                              required
                            >
                              <option value="">Select Deliverable</option>
                              {deliverablesList.map(d => (
                                <option key={d.id} value={d.id}>{d.name} (Target: {d.target_value} {d.unit})</option>
                              ))}
                            </select>
                          )}
                        </div>
                        {!isReadOnly && (
                          <button
                            type="button"
                            onClick={() => handleRemoveDeliverable(idx)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition ml-2"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                      
                      {/* Quarterly Targets Table */}
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-100">
                              <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Quarter</th>
                              <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Target Value</th>
                              <th className="text-left py-2 px-2 text-xs font-medium text-gray-700">Unit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {deliverable.quarters.map((quarter, qIdx) => (
                              <tr key={qIdx} className="border-b border-gray-200">
                                <td className="py-2 px-2 text-sm font-medium text-gray-900">
                                  Q{quarter.quarter} {quarter.year}
                                </td>
                                <td className="py-2 px-2">
                                  <input
                                    type="number"
                                    value={quarter.target_value}
                                    onChange={(e) => handleDeliverableTargetChange(idx, qIdx, 'target_value', e.target.value)}
                                    disabled={isReadOnly || !deliverable.id}
                                    step="0.01"
                                    className="w-32 px-2 py-1 border border-gray-200 rounded text-sm disabled:bg-gray-100"
                                    placeholder="Target"
                                    required
                                  />
                                </td>
                                <td className="py-2 px-2 text-sm text-gray-600">
                                  {deliverable.unit || '-'}
                                </td>
                              </tr>
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
        </div>

        {/* Location Section */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Project Location" icon={MapPin} section="location" />
          </div>
          {expandedSections.location && (
            <div className="p-3 sm:p-4 pt-0">
              <LocationPicker 
                latitude={formData.latitude}
                longitude={formData.longitude}
                address={formData.location_address}
                onLocationChange={handleLocationChange}
                onAddressChange={handleAddressChange}
                disabled={isReadOnly}
              />
              <div className="mt-3">
                <label className="block text-xs font-medium text-gray-700 mb-1">Additional Directions</label>
                <textarea
                  name="location_description"
                  value={formData.location_description}
                  onChange={handleChange}
                  rows="2"
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none disabled:bg-gray-50"
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
                  <input 
                    type="date" 
                    name="start_date" 
                    value={formData.start_date} 
                    onChange={handleChange} 
                    required 
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
                  <input 
                    type="date" 
                    name="end_date" 
                    value={formData.end_date} 
                    onChange={handleChange} 
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm disabled:bg-gray-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select 
                    name="status" 
                    value={formData.status} 
                    onChange={handleChange} 
                    disabled={isReadOnly}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-50"
                  >
                    {statusOptions.map(s => (
                      <option key={s.value} value={s.value}>{s.icon} {s.label}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Images Section */}
        {!isReadOnly && (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-3 sm:px-4 pt-3">
              <SectionHeader title="Initiative Images" icon={ImageIcon} section="images" />
            </div>
            {expandedSections.images && (
              <div className="p-3 sm:p-4 pt-0">
                <ImageUpload 
                  projectId={id} 
                  images={images} 
                  onImagesChange={handleImagesChange}
                  disabled={isReadOnly}
                />
                <p className="text-xs text-gray-400 mt-2">Up to 4 images, max 5MB each</p>
              </div>
            )}
          </div>
        )}

        {/* Performance Comments */}
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-3 sm:px-4 pt-3">
            <SectionHeader title="Performance Comments" icon={FileText} section="assessment" />
          </div>
          {expandedSections.assessment && (
            <div className="p-3 sm:p-4 pt-0">
              <textarea 
                name="performance_comment" 
                value={formData.performance_comment} 
                onChange={handleChange} 
                rows="4" 
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none disabled:bg-gray-50" 
                placeholder="Add any additional comments about initiative performance..."
              />
            </div>
          )}
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2 pb-4">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard/initiatives')} 
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          {!isReadOnly && (canCreateNew || (isStaff && id)) && (
            <button 
              type="submit" 
              disabled={loading} 
              className="px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{id ? 'Update' : 'Create'}</span>
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

export default InitiativeForm;