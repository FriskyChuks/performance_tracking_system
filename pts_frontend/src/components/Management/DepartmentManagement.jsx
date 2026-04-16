// src/components/Management/DepartmentManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Building2, Search } from 'lucide-react';
import mainApi from '../../services/mainApi';
import accountsApi from '../../services/accountsApi';
import toast from 'react-hot-toast';

const DepartmentManagement = () => {
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const response = await mainApi.departments.list();
      setDepartmentsList(response.data);
    } catch (error) {
      console.error('Error fetching departments:', error);
      toast.error('Failed to fetch departments');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (department = null) => {
    if (department) {
      setEditingDepartment(department);
      setFormData({
        name: department.name,
        description: department.description || '',
        code: department.code || ''
      });
    } else {
      setEditingDepartment(null);
      setFormData({ name: '', description: '', code: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingDepartment(null);
    setFormData({ name: '', description: '', code: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Department name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingDepartment) {
        await mainApi.departments.update(editingDepartment.id, formData);
        await accountsApi.logActivity({ 
          action: 'update', 
          description: `Updated department: ${formData.name}` 
        });
        toast.success('Department updated successfully');
      } else {
        await mainApi.departments.create(formData);
        await accountsApi.logActivity({ 
          action: 'create', 
          description: `Created department: ${formData.name}` 
        });
        toast.success('Department created successfully');
      }
      fetchDepartments();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving department:', error);
      toast.error(error.response?.data?.name?.[0] || 'Failed to save department');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated agencies and initiatives.`)) {
      try {
        await mainApi.departments.delete(id);
        await accountsApi.logActivity({ 
          action: 'delete', 
          description: `Deleted department: ${name}` 
        });
        toast.success('Department deleted successfully');
        fetchDepartments();
      } catch (error) {
        console.error('Error deleting department:', error);
        toast.error('Failed to delete department');
      }
    }
  };

  const filteredDepartments = departmentsList.filter(dept =>
    dept.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (dept.code && dept.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
          <p className="text-gray-600 mt-1">Manage Federal Ministry of Environment departments</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Department
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search departments by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredDepartments.map((department) => (
          <div key={department.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 p-3 rounded-xl shadow-md">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(department)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(department.id, department.name)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{department.name}</h3>
            {department.code && (
              <p className="text-xs text-gray-500 mb-2">Code: {department.code}</p>
            )}
            {department.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{department.description}</p>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Created: {new Date(department.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No departments found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Department Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., Forestry Department"
                  autoFocus
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Code (Optional)
                </label>
                <input
                  type="text"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., FOR/001"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm resize-none"
                  placeholder="Department description..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-4 py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg flex items-center gap-2 hover:shadow-md transition disabled:opacity-50"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? 'Saving...' : editingDepartment ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DepartmentManagement;