// src/components/Management/MinistryManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Building2, TrendingUp, Users, Search, AlertCircle } from 'lucide-react';
import { ministries } from '../../services/api';
import toast from 'react-hot-toast';

const MinistryManagement = () => {
  const [ministriesList, setMinistriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [ministryToDelete, setMinistryToDelete] = useState(null);
  const [editingMinistry, setEditingMinistry] = useState(null);
  const [formData, setFormData] = useState({ title: '' });
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    try {
      setLoading(true);
      const response = await ministries.list();
      setMinistriesList(response.data);
    } catch (error) {
      console.error('Error fetching ministries:', error);
      toast.error('Failed to fetch ministries');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (ministry = null) => {
    if (ministry) {
      setEditingMinistry(ministry);
      setFormData({ title: ministry.title });
    } else {
      setEditingMinistry(null);
      setFormData({ title: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingMinistry(null);
    setFormData({ title: '' });
  };

  const handleDeleteClick = (ministry) => {
    setMinistryToDelete(ministry);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!ministryToDelete) return;
    
    setSubmitting(true);
    try {
      await ministries.delete(ministryToDelete.id);
      toast.success('Ministry deleted successfully');
      fetchMinistries();
      setShowDeleteModal(false);
      setMinistryToDelete(null);
    } catch (error) {
      console.error('Error deleting ministry:', error);
      toast.error('Failed to delete ministry');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Ministry title is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingMinistry) {
        await ministries.update(editingMinistry.id, formData);
        toast.success('Ministry updated successfully');
      } else {
        await ministries.create(formData);
        toast.success('Ministry created successfully');
      }
      fetchMinistries();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving ministry:', error);
      toast.error(error.response?.data?.title?.[0] || 'Failed to save ministry');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredMinistries = ministriesList.filter(ministry =>
    ministry.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalPriorityAreas = () => {
    return ministriesList.reduce((sum, m) => sum + (m.priority_areas_count || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading ministries...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Compact Header Section */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="p-4 sm:p-5">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-primary-500 to-secondary-500 p-2 rounded-lg shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Ministries</h2>
                <p className="text-xs text-gray-500 hidden sm:block">Manage government departments</p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {/* Compact Search */}
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm transition"
                />
              </div>
              
              <button
                onClick={() => handleOpenModal()}
                className="px-4 py-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2 text-sm whitespace-nowrap"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Add</span>
              </button>
            </div>
          </div>

          {/* Compact Stats - Single line on mobile */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <Building2 className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">{ministriesList.length}</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Total</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">{getTotalPriorityAreas()}</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Areas</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <TrendingUp className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">Active</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">System</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ministries Grid */}
      {filteredMinistries.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Building2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No ministries found</h3>
          <p className="text-sm text-gray-500 mb-3">
            {searchTerm ? 'Try adjusting your search' : 'Create your first ministry'}
          </p>
          {!searchTerm && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Ministry
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredMinistries.map((ministry) => (
            <div
              key={ministry.id}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-primary-200"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-4 py-3 relative">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                    <Building2 className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(ministry)}
                      className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(ministry)}
                      className="p-1 rounded bg-white/20 hover:bg-red-500/80 text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-1">{ministry.title}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Users className="w-3 h-3" />
                  <span>{ministry.priority_areas_count || 0} areas</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal - Compact */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-slide-up">
            <div className="bg-gradient-to-r from-primary-500 to-secondary-500 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    {editingMinistry ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {editingMinistry ? 'Edit Ministry' : 'New Ministry'}
                  </h3>
                </div>
                <button onClick={handleCloseModal} className="text-white/80 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="e.g., Ministry of Health"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {editingMinistry ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal - Compact */}
      {showDeleteModal && ministryToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-slide-up">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Delete Ministry</h3>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-gray-700 mb-1">
                Delete <span className="font-semibold text-gray-900">"{ministryToDelete.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 mb-5">
                This will also delete all associated priority areas.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MinistryManagement;