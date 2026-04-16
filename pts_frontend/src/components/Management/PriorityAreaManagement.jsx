// src/components/Management/PriorityAreaManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Target, Building2, Landmark, Layers, Search, Filter, AlertCircle } from 'lucide-react';
import mainApi from '../../services/mainApi';
import accountsApi from '../../services/accountsApi';
import toast from 'react-hot-toast';

const PriorityAreaManagement = () => {
  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [areaToDelete, setAreaToDelete] = useState(null);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({ name: '', department: '', agency: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterAgency, setFilterAgency] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [entityType, setEntityType] = useState('department'); // 'department' or 'agency'

  // Destructure API methods
  const { priorityAreas, departments, agencies } = mainApi;

  useEffect(() => {
    fetchData();
  }, [filterDepartment, filterAgency]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [priorityAreasRes, departmentsRes, agenciesRes] = await Promise.all([
        priorityAreas.list(),
        departments.list(),
        agencies.list()
      ]);
      
      let filteredAreas = priorityAreasRes.data;
      
      // Filter by department
      if (filterDepartment) {
        // Since priority areas are not directly linked to department, 
        // we need to filter through initiatives or keep as is
        // For now, we'll just store the filter value
      }
      
      // Filter by agency
      if (filterAgency) {
        // Similar filtering logic
      }
      
      setPriorityAreasList(filteredAreas);
      setDepartmentsList(departmentsRes.data);
      setAgenciesList(agenciesRes.data);
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
      setFormData({ 
        name: item.name, 
        department: item.department || '', 
        agency: item.agency || '' 
      });
    } else {
      setEditingItem(null);
      setFormData({ name: '', department: '', agency: '' });
    }
    setShowModal(true);
  };

  const handleDeleteClick = (item) => {
    setAreaToDelete(item);
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!areaToDelete) return;
    
    setSubmitting(true);
    try {
      await priorityAreas.delete(areaToDelete.id);
      await accountsApi.logActivity({ 
        action: 'delete', 
        description: `Deleted priority area: ${areaToDelete.name}` 
      });
      toast.success('Priority area deleted successfully');
      fetchData();
      setShowDeleteModal(false);
      setAreaToDelete(null);
    } catch (error) {
      console.error('Error deleting priority area:', error);
      toast.error('Failed to delete priority area');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Priority area name is required');
      return;
    }

    setSubmitting(true);
    try {
      const submitData = {
        name: formData.name,
        department: formData.department || null,
        agency: formData.agency || null
      };
      
      if (editingItem) {
        await priorityAreas.update(editingItem.id, submitData);
        await accountsApi.logActivity({ 
          action: 'update', 
          description: `Updated priority area: ${formData.name}` 
        });
        toast.success('Priority area updated successfully');
      } else {
        await priorityAreas.create(submitData);
        await accountsApi.logActivity({ 
          action: 'create', 
          description: `Created priority area: ${formData.name}` 
        });
        toast.success('Priority area created successfully');
      }
      fetchData();
      setShowModal(false);
      setEditingItem(null);
      setFormData({ name: '', department: '', agency: '' });
    } catch (error) {
      console.error('Error saving priority area:', error);
      toast.error(error.response?.data?.name?.[0] || 'Failed to save priority area');
    } finally {
      setSubmitting(false);
    }
  };

  const getEntityName = (area) => {
    // Since priority areas may not have direct department/agency links,
    // we'll show department name from the initiative context or N/A
    return 'FME';
  };

  const filteredAreas = priorityAreasList.filter(area =>
    area.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTotalDeliverables = () => {
    return priorityAreasList.reduce((sum, a) => sum + (a.deliverables_count || 0), 0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading priority areas...</p>
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
              <div className="bg-gradient-to-br from-orange-500 to-red-500 p-2 rounded-lg shadow-md">
                <Target className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Priority Areas</h2>
                <p className="text-xs text-gray-500 hidden sm:block">Manage environmental priority areas</p>
              </div>
            </div>
            
            <button
              onClick={() => handleOpenModal()}
              className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium shadow-md hover:shadow-lg transition-all hover:scale-105 flex items-center gap-2 text-sm whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Area</span>
            </button>
          </div>

          {/* Compact Stats - Single line on mobile */}
          <div className="grid grid-cols-3 gap-2 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg">
              <Target className="w-4 h-4 text-blue-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">{priorityAreasList.length}</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Areas</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg">
              <Layers className="w-4 h-4 text-green-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">{getTotalDeliverables()}</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Deliverables</span>
              </div>
            </div>
            <div className="flex items-center justify-center gap-2 px-2 py-1.5 bg-gradient-to-br from-purple-50 to-violet-50 rounded-lg">
              <Building2 className="w-4 h-4 text-purple-600" />
              <div>
                <span className="text-sm font-bold text-gray-800">FME</span>
                <span className="text-xs text-gray-500 ml-1 hidden sm:inline">Ministry</span>
              </div>
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
            placeholder="Search priority areas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm transition"
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative flex-1 sm:w-48">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={entityType}
              onChange={(e) => setEntityType(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm appearance-none cursor-pointer"
            >
              <option value="department">By Department</option>
              <option value="agency">By Agency</option>
            </select>
          </div>
          
          <div className="relative flex-1 sm:w-48">
            <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={entityType === 'department' ? filterDepartment : filterAgency}
              onChange={(e) => {
                if (entityType === 'department') {
                  setFilterDepartment(e.target.value);
                } else {
                  setFilterAgency(e.target.value);
                }
              }}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:bg-white text-sm appearance-none cursor-pointer"
            >
              <option value="">All {entityType === 'department' ? 'Departments' : 'Agencies'}</option>
              {entityType === 'department' 
                ? departmentsList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))
                : agenciesList.map(agency => (
                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                  ))
              }
            </select>
          </div>
        </div>
      </div>

      {/* Priority Areas Grid */}
      {filteredAreas.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3">
            <Target className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-base font-medium text-gray-900 mb-1">No priority areas found</h3>
          <p className="text-sm text-gray-500 mb-3">
            {searchTerm || filterDepartment || filterAgency ? 'Try adjusting your filters' : 'Create your first priority area'}
          </p>
          {!searchTerm && !filterDepartment && !filterAgency && (
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1.5 rounded-lg text-sm font-medium shadow-md hover:shadow-lg transition"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Priority Area
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredAreas.map((area) => (
            <div
              key={area.id}
              className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-all hover:border-orange-200"
            >
              {/* Card Header */}
              <div className="bg-gradient-to-r from-orange-500 to-red-500 px-4 py-3 relative">
                <div className="flex items-center justify-between">
                  <div className="bg-white/20 backdrop-blur-sm p-1.5 rounded-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(area)}
                      className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleDeleteClick(area)}
                      className="p-1 rounded bg-white/20 hover:bg-red-500/80 text-white transition"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Card Body */}
              <div className="p-3">
                <h3 className="text-sm font-semibold text-gray-900 mb-2 line-clamp-2">{area.name}</h3>
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <Building2 className="w-3 h-3" />
                  <span className="truncate">Federal Ministry of Environment</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Layers className="w-3 h-3" />
                  <span>{area.deliverables_count || 0} deliverables</span>
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
            <div className="bg-gradient-to-r from-orange-500 to-red-500 px-5 py-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 p-1.5 rounded-lg">
                    {editingItem ? <Edit className="w-4 h-4 text-white" /> : <Plus className="w-4 h-4 text-white" />}
                  </div>
                  <h3 className="text-base font-bold text-white">
                    {editingItem ? 'Edit Priority Area' : 'New Priority Area'}
                  </h3>
                </div>
                <button onClick={() => setShowModal(false)} className="text-white/80 hover:text-white transition">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Priority Area Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  placeholder="e.g., Air Quality Management"
                  autoFocus
                />
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Department (Optional)
                </label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value, agency: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Department</option>
                  {departmentsList.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Agency (Optional)
                </label>
                <select
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value, department: '' })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm bg-white"
                >
                  <option value="">Select Agency</option>
                  {agenciesList.map(agency => (
                    <option key={agency.id} value={agency.id}>{agency.name}</option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">Leave both empty for ministry-wide priority</p>
              </div>
              
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-1.5 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-1.5 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg text-sm font-medium transition flex items-center gap-2 shadow-sm"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
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

      {/* Delete Confirmation Modal - Compact */}
      {showDeleteModal && areaToDelete && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-xl animate-slide-up">
            <div className="bg-gradient-to-r from-red-500 to-red-600 px-5 py-3">
              <div className="flex items-center gap-2">
                <div className="bg-white/20 p-1.5 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-white" />
                </div>
                <h3 className="text-base font-bold text-white">Delete Priority Area</h3>
              </div>
            </div>
            
            <div className="p-5">
              <p className="text-sm text-gray-700 mb-1">
                Delete <span className="font-semibold text-gray-900">"{areaToDelete.name}"</span>?
              </p>
              <p className="text-xs text-gray-500 mb-5">
                This will also delete all associated deliverables.
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

export default PriorityAreaManagement;