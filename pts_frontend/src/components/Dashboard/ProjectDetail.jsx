// src/components/Dashboard/ProjectDetail.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  ArrowLeft, Edit, Trash2, Calendar, Target, TrendingUp,
  Building2, Layers, Package, FileText, BarChart3,
  AlertCircle, Download, Share2, CheckCircle, Clock, Award,
  Image as ImageIcon, ChevronLeft, ChevronRight, X, Star
} from 'lucide-react';
import { projects, deliverables, priorityAreas, ministries } from '../../services/api';
import { engagementApi } from '../../services/engagementApi';
import toast from 'react-hot-toast';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState([]);
  const [hierarchy, setHierarchy] = useState({ deliverable: null, priorityArea: null, ministry: null });
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  useEffect(() => { 
    fetchProjectDetails(); 
    fetchImages();
  }, [id]);

  const fetchImages = async () => {
    try {
      const response = await engagementApi.getProjectImages(id);
      setImages(response.data);
    } catch (error) {
      console.error('Error fetching images:', error);
    }
  };

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      const projectsRes = await projects.list();
      const projectData = projectsRes.data.find(p => p.id === parseInt(id));
      
      if (!projectData) {
        toast.error('Project not found');
        navigate('/dashboard/projects');
        return;
      }
      
      setProject(projectData);
      
      const deliverablesRes = await deliverables.list();
      const deliverable = deliverablesRes.data.find(d => d.id === projectData.deliverable);
      
      if (deliverable) {
        setHierarchy(prev => ({ ...prev, deliverable }));
        const priorityAreasRes = await priorityAreas.list();
        const priorityArea = priorityAreasRes.data.find(p => p.id === deliverable.priority_area);
        
        if (priorityArea) {
          setHierarchy(prev => ({ ...prev, priorityArea }));
          const ministriesRes = await ministries.list();
          const ministry = ministriesRes.data.find(m => m.id === priorityArea.ministry);
          if (ministry) setHierarchy(prev => ({ ...prev, ministry }));
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to load project');
    } finally { setLoading(false); }
  };

  const handleDelete = async () => {
    try {
      await projects.delete(id);
      toast.success('Project deleted');
      navigate('/dashboard/projects');
    } catch (error) { toast.error('Failed to delete'); }
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

  const performanceData = [
    { name: 'Baseline', value: parseFloat(project?.baseline_data) || 0 },
    { name: 'Target', value: parseFloat(project?.target_data) || 0 },
    { name: 'Actual', value: project?.actual_data || 0 }
  ];

  const ratingInfo = getRatingInfo(project?.performance_rating);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500 text-sm">Loading project...</p>
      </div>
    </div>
  );

  if (!project) return (
    <div className="text-center py-12">
      <AlertCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
      <h3 className="text-lg font-medium text-gray-900">Project not found</h3>
      <p className="text-gray-500 text-sm mt-2">The project doesn't exist.</p>
      <button onClick={() => navigate('/dashboard/projects')} className="inline-flex items-center gap-2 mt-4 px-4 py-2 bg-green-600 text-white rounded-lg text-sm shadow-sm hover:bg-green-700 transition">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <button onClick={() => navigate('/dashboard/projects')} className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 mb-3 text-sm transition group">
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition" />
          Back to Projects
        </button>
        
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
          <div className="flex-1">
            <div className="flex items-start gap-3">
              <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900 leading-tight">{project.outcome}</h1>
                <p className="text-xs text-gray-500 mt-1">{project.indicator}</p>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2 ml-11 sm:ml-0">
            <button onClick={() => navigate(`/dashboard/projects/${id}/edit`)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition flex items-center gap-1.5 text-sm">
              <Edit className="w-3.5 h-3.5" /> Edit
            </button>
            <button onClick={() => setShowDeleteModal(true)} className="px-3 py-1.5 border border-red-300 rounded-lg text-red-600 hover:bg-red-50 transition flex items-center gap-1.5 text-sm">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
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
                  Project Images ({images.length})
                </h3>
                {images.length > 4 && (
                  <button 
                    onClick={() => openGallery(0)}
                    className="text-xs text-green-600 hover:text-green-700 transition"
                  >
                    View All
                  </button>
                )}
              </div>
              
              {/* Primary Image */}
              {images.find(img => img.is_primary) && (
                <div 
                  className="relative rounded-lg overflow-hidden cursor-pointer mb-3 group"
                  onClick={() => openGallery(images.findIndex(img => img.is_primary))}
                >
                  <img 
                    src={images.find(img => img.is_primary).image_url || images.find(img => img.is_primary).image}
                    alt="Primary project image"
                    className="w-full h-64 object-cover group-hover:scale-105 transition duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-green-600 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Primary
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="bg-white/90 rounded-full p-2">
                      <ImageIcon className="w-5 h-5 text-gray-700" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Thumbnail Grid */}
              <div className="grid grid-cols-4 gap-2">
                {images.slice(0, 4).map((img, idx) => (
                  <div 
                    key={img.id}
                    className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                    onClick={() => openGallery(idx)}
                  >
                    <img 
                      src={img.image_url || img.image}
                      alt={img.caption || 'Project image'}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition"></div>
                    {!img.is_primary && images.find(i => i.is_primary)?.id !== img.id && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <div className="bg-white/90 rounded-full p-1.5">
                          <ImageIcon className="w-3 h-3 text-gray-700" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Hierarchy Breadcrumb */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Project Hierarchy</h3>
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                <Building2 className="w-3 h-3 text-green-600" />
                <span className="font-medium text-gray-700">{hierarchy.ministry?.title || 'Ministry'}</span>
              </div>
              <span className="text-gray-400 text-xs">→</span>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                <Layers className="w-3 h-3 text-green-600" />
                <span className="font-medium text-gray-700">{hierarchy.priorityArea?.title || 'Priority Area'}</span>
              </div>
              <span className="text-gray-400 text-xs">→</span>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                <Package className="w-3 h-3 text-green-600" />
                <span className="font-medium text-gray-700">{hierarchy.deliverable?.title || 'Deliverable'}</span>
              </div>
            </div>
          </div>

          {/* Performance Overview */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              Performance Overview
            </h3>
            
            <div className="grid grid-cols-3 gap-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Baseline</p>
                <p className="text-xl font-bold text-gray-900">{project.baseline_data || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Target</p>
                <p className="text-xl font-bold text-gray-900">{project.target_data || '—'}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">Actual</p>
                <p className="text-xl font-bold text-green-600">{project.actual_data || '—'}</p>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: 'none', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }} />
                <Bar dataKey="value" fill="#22c55e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Comments */}
          {project.performance_comment && (
            <div className="bg-white rounded-xl p-4 border border-gray-200">
              <h3 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                Comments
              </h3>
              <p className="text-sm text-gray-600 leading-relaxed">{project.performance_comment}</p>
            </div>
          )}
        </div>

        {/* Sidebar - Right Side */}
        <div className="space-y-4">
          {/* Rating Card */}
          <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-4 border border-gray-200 text-center">
            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl ${ratingInfo.bg} border ${ratingInfo.border}`}>
              <span className="text-2xl">{ratingInfo.icon}</span>
              <div className="text-left">
                <p className={`text-base font-bold ${ratingInfo.color}`}>{ratingInfo.label}</p>
                <p className="text-xs text-gray-500">Rating {project.performance_rating}/5</p>
              </div>
            </div>
          </div>

          {/* Timeline Card */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-3 flex items-center gap-1.5 uppercase tracking-wide">
              <Calendar className="w-3.5 h-3.5" />
              Timeline
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1.5">
                <span className="text-sm text-gray-600">Year</span>
                <span className="font-semibold text-gray-900 text-sm">{project.year}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                <span className="text-sm text-gray-600">Quarter</span>
                <span className="font-semibold text-gray-900 text-sm">Q{project.quarter}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-t border-gray-100">
                <span className="text-sm text-gray-600">Status</span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  <CheckCircle className="w-3 h-3" />
                  Active
                </span>
              </div>
            </div>
          </div>

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
                Share Project
              </button>
            </div>
          </div>

          {/* Achievement Progress */}
          <div className="bg-white rounded-xl p-4 border border-gray-200">
            <h3 className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wide">Achievement</h3>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600 mb-1">
                {project.actual_data && project.target_data 
                  ? Math.round((project.actual_data / project.target_data) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-gray-500">of target achieved</p>
              <div className="mt-2 w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all" 
                     style={{ width: project.actual_data && project.target_data 
                       ? `${Math.min(100, (project.actual_data / project.target_data) * 100)}%` 
                       : '0%' }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Delete Project</h3>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2">
                Delete <span className="font-semibold">"{project.outcome}"</span>?
              </p>
              <p className="text-xs text-gray-500 mb-5">This action cannot be undone.</p>
              <div className="flex justify-end gap-2">
                <button onClick={() => setShowDeleteModal(false)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm transition">
                  Cancel
                </button>
                <button onClick={handleDelete} className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm transition">
                  <Trash2 className="w-3.5 h-3.5" />
                  Delete Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Image Gallery Modal */}
      {showGallery && images.length > 0 && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center">
          <button 
            onClick={() => setShowGallery(false)}
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10"
          >
            <X className="w-8 h-8" />
          </button>
          
          <button 
            onClick={() => setSelectedImageIndex(prev => (prev - 1 + images.length) % images.length)}
            className="absolute left-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button 
            onClick={() => setSelectedImageIndex(prev => (prev + 1) % images.length)}
            className="absolute right-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2 hover:bg-black/70"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
          
          <div className="max-w-4xl max-h-[80vh] mx-4">
            <img 
              src={images[selectedImageIndex]?.image_url || images[selectedImageIndex]?.image}
              alt={images[selectedImageIndex]?.caption || 'Project image'}
              className="max-w-full max-h-[80vh] object-contain"
            />
            {images[selectedImageIndex]?.caption && (
              <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 text-white px-4 py-2 rounded-lg text-sm">
                {images[selectedImageIndex].caption}
              </div>
            )}
          </div>
          
          {/* Thumbnail strip */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 rounded-lg p-2">
              {images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-12 h-12 rounded overflow-hidden border-2 transition ${idx === selectedImageIndex ? 'border-green-500' : 'border-transparent'}`}
                >
                  <img 
                    src={img.image_url || img.image}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ProjectDetail;