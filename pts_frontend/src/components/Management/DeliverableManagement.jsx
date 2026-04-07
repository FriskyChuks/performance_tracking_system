// src/components/Management/DeliverableManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Package, Target, TrendingUp, AlertCircle, Search } from 'lucide-react';
import { deliverables, priorityAreas, ministries } from '../../services/api';
import toast from 'react-hot-toast';

const DeliverableManagement = () => {
  const [deliverablesList, setDeliverablesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [ministriesList, setMinistriesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ title: '', priority_area: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filters, setFilters] = useState({ ministry: '', priority_area: '' });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [filters.ministry, filters.priority_area]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [deliverablesRes, priorityAreasRes, ministriesRes] = await Promise.all([
        deliverables.list(filters.priority_area ? { priority_area: filters.priority_area } : {}),
        priorityAreas.list(filters.ministry ? { ministry: filters.ministry } : {}),
        ministries.list()
      ]);
      setDeliverablesList(deliverablesRes.data);
      setPriorityAreasList(priorityAreasRes.data);
      setMinistriesList(ministriesRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({ title: item.title, priority_area: item.priority_area });
    } else {
      setEditingItem(null);
      setFormData({ title: '', priority_area: filters.priority_area || '' });
    }
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setItemToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!itemToDelete) return;
    
    setSubmitting(true);
    try {
      await deliverables.delete(itemToDelete.id);
      toast.success('Deliverable deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setItemToDelete(null);
    } catch (error) {
      console.error('Error deleting deliverable:', error);
      toast.error('Failed to delete deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      toast.error('Deliverable title is required');
      return;
    }
    if (!formData.priority_area) {
      toast.error('Please select a priority area');
      return;
    }

    setSubmitting(true);
    try {
      if (editingItem) {
        await deliverables.update(editingItem.id, formData);
        toast.success('Deliverable updated successfully');
      } else {
        await deliverables.create(formData);
        toast.success('Deliverable created successfully');
      }
      fetchData();
      setShowModal(false);
      setEditingItem(null);
      setFormData({ title: '', priority_area: '' });
    } catch (error) {
      console.error('Error saving deliverable:', error);
      toast.error(error.response?.data?.title?.[0] || 'Failed to save deliverable');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityAreaTitle = (priorityAreaId) => {
    const area = priorityAreasList.find(a => a.id === priorityAreaId);
    return area ? area.title : 'Unknown';
  };

  const filteredDeliverables = deliverablesList.filter(deliverable =>
    deliverable.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalProjects = () => {
    return deliverablesList.reduce((sum, d) => sum + (d.projects_count || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
        <p className="text-gray-500">Loading deliverables...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Section */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-green-600 to-green-700 p-2 rounded-lg shadow-md">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Deliverables</h2>
              <p className="text-xs text-gray-500 hidden sm:block">Manage deliverables under priority areas</p>
            </div>
          </div>
          
          <button
            onClick={() => handleOpenModal()}
            className="px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium shadow-sm transition-all duration-200 flex items-center gap-1.5 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add</span>
          </button>
        </div>

        {/* Compact Stats Cards */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Package className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{deliverablesList.length}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <TrendingUp className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{getTotalProjects()}</p>
              <p className="text-xs text-gray-500">Projects</p>
            </div>
          </div>
          <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
            <Target className="w-4 h-4 text-green-600" />
            <div>
              <p className="text-lg font-bold text-gray-900 leading-tight">{priorityAreasList.length}</p>
              <p className="text-xs text-gray-500">Areas</p>
            </div>
          </div>
        </div>
      </div>

      {/* Compact Filters Row */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 pl-9 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
          />
        </div>
        
        <select
          value={filters.ministry}
          onChange={(e) => setFilters({ ministry: e.target.value, priority_area: '' })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
        >
          <option value="">All Ministries</option>
          {ministriesList.map(ministry => (
            <option key={ministry.id} value={ministry.id}>{ministry.title}</option>
          ))}
        </select>
        
        <select
          value={filters.priority_area}
          onChange={(e) => setFilters({ ...filters, priority_area: e.target.value })}
          className="px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white disabled:opacity-50"
          disabled={!filters.ministry}
        >
          <option value="">All Areas</option>
          {priorityAreasList.map(area => (
            <option key={area.id} value={area.id}>{area.title}</option>
          ))}
        </select>
      </div>

      {/* Deliverables Grid */}
      {filteredDeliverables.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Package className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No deliverables found</h3>
          <p className="text-sm text-gray-500 mb-3">
            {searchTerm || filters.ministry || filters.priority_area ? 'Try adjusting your filters' : 'Get started by creating your first deliverable'}
          </p>
          {!searchTerm && !filters.ministry && !filters.priority_area && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-1.5 bg-green-600 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-green-700 transition"
            >
              <Plus className="w-4 h-4" />
              Add Deliverable
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDeliverables.map((deliverable) => (
            <div
              key={deliverable.id}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-200"
            >
              <div className="bg-gradient-to-r from-green-600 to-green-700 px-4 py-3">
                <div className="flex items-center justify-between">
                  <Package className="w-5 h-5 text-white" />
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(deliverable)}
                      className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition text-xs"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(deliverable)}
                      className="p-1 rounded bg-white/20 hover:bg-red-500 text-white transition text-xs"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
              
              <div className="p-4">
                <h3 className="text-base font-bold text-gray-900 mb-1 line-clamp-2">{deliverable.title}</h3>
                <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-2">
                  <Target className="w-3 h-3" />
                  <span>{getPriorityAreaTitle(deliverable.priority_area)}</span>
                </div>
                <div className="flex items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>{deliverable.projects_count || 0} projects</span>
                  </div>
                </div>
                
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="text-gray-500">Progress</span>
                    <span className="text-gray-700 font-medium">30%</span>
                  </div>
                  <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-green-600 to-green-500 rounded-full" style={{ width: '30%' }}></div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-green-600 to-green-700 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    {editingItem ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Deliverable' : 'Create Deliverable'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority Area *
                </label>
                <select
                  value={formData.priority_area}
                  onChange={(e) => setFormData({ ...formData, priority_area: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm bg-white"
                  required
                >
                  <option value="">Select Priority Area</option>
                  {priorityAreasList.map(area => (
                    <option key={area.id} value={area.id}>{area.title}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Deliverable Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Hospital Construction"
                  autoFocus
                />
              </div>
              
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 text-sm shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      {editingItem ? 'Update' : 'Create'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl">
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Delete Deliverable</h3>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-gray-700 text-sm mb-2">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{itemToDelete.title}"</span>?
              </p>
              <p className="text-xs text-gray-500 mb-5">
                This action cannot be undone. Associated projects will also be deleted.
              </p>
              
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={submitting}
                  className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition flex items-center gap-1.5 text-sm shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3.5 w-3.5 border-b-2 border-white"></div>
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

export default DeliverableManagement;