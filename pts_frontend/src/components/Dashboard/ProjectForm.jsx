// src/components/Dashboard/ProjectForm.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { activities } from '../../services/api';
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
  TrendingDown,
  Clock,
  Award,
  Image as ImageIcon
} from 'lucide-react';
import { projects, deliverables, priorityAreas, ministries } from '../../services/api';
import { engagementApi } from '../../services/engagementApi';
import ImageUpload from './ImageUpload';
import toast from 'react-hot-toast';

const ProjectForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [duplicateError, setDuplicateError] = useState(false);
  const [images, setImages] = useState([]);
  
  const [ministriesList, setMinistriesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [deliverablesList, setDeliverablesList] = useState([]);
  
  const [formData, setFormData] = useState({
    deliverable: '',
    outcome: '',
    indicator: '',
    year: new Date().getFullYear(),
    quarter: 1,
    baseline_data: '',
    target_data: '',
    actual_data: '',
    performance_rating: '',
    performance_comment: '',
    performance_historics: 0,
    target_historics: 0,
    performance_type: 'actual'
  });
  
  const [selectedMinistry, setSelectedMinistry] = useState('');
  const [selectedPriorityArea, setSelectedPriorityArea] = useState('');

  useEffect(() => { 
    fetchInitialData(); 
  }, []);
  
  useEffect(() => {
    if (selectedMinistry) fetchPriorityAreas();
    else { setPriorityAreasList([]); setSelectedPriorityArea(''); setDeliverablesList([]); }
  }, [selectedMinistry]);
  
  useEffect(() => {
    if (selectedPriorityArea) fetchDeliverables();
    else setDeliverablesList([]);
  }, [selectedPriorityArea]);

  const fetchInitialData = async () => {
    try {
      setInitialLoading(true);
      const ministriesRes = await ministries.list();
      setMinistriesList(ministriesRes.data);
      if (id) {
        await fetchProjectData();
        await fetchImages();
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
      const response = await engagementApi.getProjectImages(id);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchProjectData = async () => {
    try {
      const projectsRes = await projects.list();
      const project = projectsRes.data.find(p => p.id === parseInt(id));
      
      if (project) {
        setFormData({
          deliverable: project.deliverable || '',
          outcome: project.outcome || '',
          indicator: project.indicator || '',
          year: project.year || new Date().getFullYear(),
          quarter: project.quarter || 1,
          baseline_data: project.baseline_data || '',
          target_data: project.target_data || '',
          actual_data: project.actual_data || '',
          performance_rating: project.performance_rating || '',
          performance_comment: project.performance_comment || '',
          performance_historics: project.performance_historics || 0,
          target_historics: project.target_historics || 0,
          performance_type: project.performance_type || 'actual'
        });
        
        const deliverablesRes = await deliverables.list();
        const deliverable = deliverablesRes.data.find(d => d.id === project.deliverable);
        
        if (deliverable) {
          setSelectedPriorityArea(deliverable.priority_area);
          const priorityAreasRes = await priorityAreas.list();
          const priorityArea = priorityAreasRes.data.find(p => p.id === deliverable.priority_area);
          if (priorityArea) setSelectedMinistry(priorityArea.ministry);
        }
      }
      setInitialLoading(false);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load project');
      setInitialLoading(false);
    }
  };

  const fetchPriorityAreas = async () => {
    if (!selectedMinistry) return;
    try {
      const response = await priorityAreas.list({ ministry: selectedMinistry });
      setPriorityAreasList(response.data);
    } catch (error) { console.error('Error:', error); }
  };

  const fetchDeliverables = async () => {
    if (!selectedPriorityArea) return;
    try {
      const response = await deliverables.list({ priority_area: selectedPriorityArea });
      setDeliverablesList(response.data);
    } catch (error) { console.error('Error:', error); }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (duplicateError) setDuplicateError(false);
  };

  const handleDeliverableChange = (e) => {
    setFormData({ ...formData, deliverable: parseInt(e.target.value) });
    if (duplicateError) setDuplicateError(false);
  };

  const handleImagesChange = (newImages) => {
    setImages(newImages);
  };

  const checkForDuplicates = async () => {
    try {
      const projectsRes = await projects.list();
      const existingProject = projectsRes.data.find(p => 
        p.deliverable === formData.deliverable && 
        p.year === parseInt(formData.year) && 
        p.quarter === parseInt(formData.quarter) &&
        (!id || p.id !== parseInt(id))
      );
      
      if (existingProject) {
        setDuplicateError(true);
        toast.error(`A project already exists for this deliverable in ${formData.year} Q${formData.quarter}`);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      return false;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.deliverable) {
      toast.error('Please select a deliverable');
      return;
    }
    if (!formData.outcome?.trim()) {
      toast.error('Please enter the outcome');
      return;
    }
    if (!formData.indicator?.trim()) {
      toast.error('Please enter the indicator');
      return;
    }
    
    const isDuplicate = await checkForDuplicates();
    if (isDuplicate) return;
    
    setLoading(true);
    try {
      const submitData = {
        deliverable: parseInt(formData.deliverable),
        outcome: formData.outcome,
        indicator: formData.indicator,
        year: parseInt(formData.year),
        quarter: parseInt(formData.quarter),
        baseline_data: formData.baseline_data || null,
        target_data: formData.target_data || null,
        actual_data: formData.actual_data ? parseInt(formData.actual_data) : null,
        performance_rating: formData.performance_rating ? parseInt(formData.performance_rating) : null,
        performance_comment: formData.performance_comment || '',
        performance_historics: parseFloat(formData.performance_historics) || 0,
        target_historics: parseFloat(formData.target_historics) || 0,
        performance_type: formData.performance_type
      };
      
      let response;
      if (id) {
        response = await projects.update(id, submitData);
        await activities.logActivity('update', `Updated project: ${formData.outcome}`);
        toast.success('Project updated successfully');
      } else {
        response = await projects.create(submitData);
        await activities.logActivity('create', `Created project: ${formData.outcome}`);
        toast.success('Project created successfully');
        
        // If this is a new project and we have images, redirect to edit page to add images
        if (images.length > 0) {
          navigate(`/dashboard/projects/${response.data.id}/edit`);
          return;
        }
      }
      navigate('/dashboard/projects');
    } catch (error) {
      console.error('Error response:', error.response?.data);
      
      if (error.response?.data?.non_field_errors?.includes('The fields deliverable, year, quarter must make a unique set')) {
        setDuplicateError(true);
        toast.error('A project already exists for this deliverable, year, and quarter combination');
      } else {
        const errorMsg = error.response?.data?.message || error.response?.data?.error || 'Failed to save project';
        toast.error(errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const quarters = [
    { value: 1, label: 'Q1', icon: '🌱', description: 'Jan - Mar' },
    { value: 2, label: 'Q2', icon: '☀️', description: 'Apr - Jun' },
    { value: 3, label: 'Q3', icon: '🍂', description: 'Jul - Sep' },
    { value: 4, label: 'Q4', icon: '❄️', description: 'Oct - Dec' }
  ];

  const performanceRatings = [
    { value: 5, label: 'Excellent', color: 'text-green-700', bg: 'bg-green-100', icon: '🏆' },
    { value: 4, label: 'Very Good', color: 'text-emerald-700', bg: 'bg-emerald-100', icon: '⭐' },
    { value: 3, label: 'Good', color: 'text-yellow-700', bg: 'bg-yellow-100', icon: '👍' },
    { value: 2, label: 'Fair', color: 'text-orange-700', bg: 'bg-orange-100', icon: '⚠️' },
    { value: 1, label: 'Poor', color: 'text-red-700', bg: 'bg-red-100', icon: '🔴' }
  ];

  const performanceTypes = [
    { value: 'actual', label: 'Actual', icon: '📊', description: 'Current actual performance' },
    { value: 'target', label: 'Target', icon: '🎯', description: 'Target performance goal' },
    { value: 'baseline', label: 'Baseline', icon: '📈', description: 'Baseline measurement' }
  ];

  if (initialLoading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading...</p>
      </div>
    </div>
  );

  const selectedDeliverable = deliverablesList.find(d => d.id === parseInt(formData.deliverable));
  const selectedDeliverableTitle = selectedDeliverable?.title || '';

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <button onClick={() => navigate('/dashboard/projects')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-3 text-sm transition group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          Back to Projects
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{id ? 'Edit Project' : 'New Project'}</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              {id ? 'Update project details and track progress' : 'Create a new project to start tracking performance'}
            </p>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Duplicate Warning Banner */}
      {duplicateError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-2 text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <div className="flex-1 text-sm">
            <strong>Duplicate Project Detected!</strong> A project already exists for 
            <strong> {selectedDeliverableTitle || 'this deliverable'}</strong> in 
            <strong> {formData.year} Q{formData.quarter}</strong>. Please change the year, quarter, or select a different deliverable.
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Hierarchy Selection */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-green-600" />
            Project Hierarchy
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select 
              value={selectedMinistry} 
              onChange={(e) => setSelectedMinistry(e.target.value)} 
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
              required
            >
              <option value="">Select Ministry</option>
              {ministriesList.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
            </select>
            
            <select 
              value={selectedPriorityArea} 
              onChange={(e) => setSelectedPriorityArea(e.target.value)} 
              className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white disabled:opacity-50" 
              disabled={!selectedMinistry} 
              required
            >
              <option value="">Select Priority Area</option>
              {priorityAreasList.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
            </select>
            
            <select 
              value={formData.deliverable} 
              onChange={handleDeliverableChange} 
              className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white disabled:opacity-50 ${duplicateError ? 'border-red-500' : 'border-gray-200'}`}
              disabled={!selectedPriorityArea} 
              required
            >
              <option value="">Select Deliverable</option>
              {deliverablesList.map(d => <option key={d.id} value={d.id}>{d.title}</option>)}
            </select>
          </div>
        </div>

        {/* Project Details */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-green-600" />
            Project Details
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Outcome / Goal *</label>
              <input 
                type="text" 
                name="outcome" 
                value={formData.outcome} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="e.g., Improve healthcare access in rural areas"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Success Indicator / KPI *</label>
              <input 
                type="text" 
                name="indicator" 
                value={formData.indicator} 
                onChange={handleChange} 
                required 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="e.g., Number of new healthcare facilities built"
              />
            </div>
          </div>
        </div>

        {/* Timeline & Performance Type */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-green-600" />
            Timeline & Settings
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Year *</label>
              <select 
                name="year" 
                value={formData.year} 
                onChange={handleChange} 
                className={`px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white ${duplicateError ? 'border-red-500' : 'border-gray-200'}`}
              >
                {Array.from({ length: 10 }, (_, i) => new Date().getFullYear() + i - 5).map(y => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Quarter *</label>
              <div className="grid grid-cols-4 gap-2">
                {quarters.map(q => (
                  <button 
                    key={q.value} 
                    type="button" 
                    onClick={() => setFormData({ ...formData, quarter: q.value })} 
                    className={`py-2 rounded-lg text-center transition-all ${formData.quarter === q.value ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} ${duplicateError ? 'ring-2 ring-red-500' : ''}`}
                    title={q.description}
                  >
                    <div className="text-base">{q.icon}</div>
                    <div className="text-xs font-medium">{q.label}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          <div className="mt-4">
            <label className="block text-xs font-medium text-gray-700 mb-2">Performance Type</label>
            <div className="grid grid-cols-3 gap-2">
              {performanceTypes.map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, performance_type: type.value })}
                  className={`py-2 px-3 rounded-lg text-center transition-all ${formData.performance_type === type.value ? 'bg-green-600 text-white shadow-sm' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  <div className="text-base">{type.icon}</div>
                  <div className="text-xs font-medium">{type.label}</div>
                  <div className="text-[10px] opacity-75 hidden sm:block">{type.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Target className="w-4 h-4 text-green-600" />
            Performance Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Baseline Data</label>
              <input 
                type="text" 
                name="baseline_data" 
                value={formData.baseline_data} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="Starting point"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Data</label>
              <input 
                type="text" 
                name="target_data" 
                value={formData.target_data} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="Goal to achieve"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Actual Data</label>
              <input 
                type="number" 
                name="actual_data" 
                value={formData.actual_data} 
                onChange={handleChange} 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="Achieved value"
              />
            </div>
          </div>
        </div>

        {/* Historical Data */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4 text-green-600" />
            Historical Tracking
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Performance Historical Value</label>
              <input 
                type="number" 
                name="performance_historics" 
                value={formData.performance_historics} 
                onChange={handleChange} 
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="Historical performance"
              />
              <p className="text-xs text-gray-400 mt-1">Cumulative performance score over time</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Historical Value</label>
              <input 
                type="number" 
                name="target_historics" 
                value={formData.target_historics} 
                onChange={handleChange} 
                step="0.01"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm" 
                placeholder="Historical target"
              />
              <p className="text-xs text-gray-400 mt-1">Cumulative target score over time</p>
            </div>
          </div>
        </div>

        {/* Project Images - New Section */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-green-600" />
            Project Images
          </h2>
          <ImageUpload 
            projectId={id} 
            images={images} 
            onImagesChange={handleImagesChange}
          />
          <p className="text-xs text-gray-400 mt-3">
            Upload up to 4 images to showcase project progress. First image becomes the primary/cover image.
            Supported formats: JPG, PNG, WEBP. Max 5MB per image.
          </p>
        </div>

        {/* Performance Rating */}
        <div className="bg-white rounded-xl p-4 border border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-600" />
            Performance Assessment
          </h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-2">Performance Rating</label>
              <div className="grid grid-cols-5 gap-2">
                {performanceRatings.map(rating => (
                  <button 
                    key={rating.value} 
                    type="button" 
                    onClick={() => setFormData({ ...formData, performance_rating: rating.value })} 
                    className={`py-2 rounded-lg text-center transition-all ${formData.performance_rating == rating.value ? `${rating.bg} border border-green-500 shadow-sm` : 'bg-gray-50 border border-gray-200 hover:border-gray-300'}`}
                  >
                    <div className="text-lg">{rating.icon}</div>
                    <div className={`text-xs font-medium ${rating.color}`}>{rating.label}</div>
                  </button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Performance Comments</label>
              <textarea 
                name="performance_comment" 
                value={formData.performance_comment} 
                onChange={handleChange} 
                rows="3" 
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm resize-none" 
                placeholder="Add detailed comments about project performance, challenges, successes, etc..."
              />
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <button 
            type="button" 
            onClick={() => navigate('/dashboard/projects')} 
            className="px-5 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={loading} 
            className="px-5 py-2 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white rounded-lg flex items-center gap-2 text-sm font-medium shadow-sm transition-all disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>{id ? 'Update Project' : 'Create Project'}</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProjectForm;