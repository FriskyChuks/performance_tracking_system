// src/components/Management/AgencyManagement.jsx
import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save, Landmark, Search, ExternalLink } from 'lucide-react';
import mainApi from '../../services/mainApi';
import accountsApi from '../../services/accountsApi';
import toast from 'react-hot-toast';

const AgencyManagement = () => {
  const [agenciesList, setAgenciesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAgency, setEditingAgency] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    code: '',
    website: ''
  });
  const [submitting, setSubmitting] = useState(false);

  // Destructure API methods
  const { agencies, departments } = mainApi;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [agenciesRes, departmentsRes] = await Promise.all([
        agencies.list(),
        departments.list()
      ]);
      setAgenciesList(agenciesRes.data);
      setDepartmentsList(departmentsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to fetch agencies');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (agency = null) => {
    if (agency) {
      setEditingAgency(agency);
      setFormData({
        name: agency.name,
        description: agency.description || '',
        code: agency.code || '',
        website: agency.website || ''
      });
    } else {
      setEditingAgency(null);
      setFormData({ name: '', description: '', code: '', website: '' });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingAgency(null);
    setFormData({ name: '', description: '', code: '', website: '' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Agency name is required');
      return;
    }

    setSubmitting(true);
    try {
      if (editingAgency) {
        await agencies.update(editingAgency.id, formData);
        await accountsApi.logActivity({ 
          action: 'update', 
          description: `Updated agency: ${formData.name}` 
        });
        toast.success('Agency updated successfully');
      } else {
        await agencies.create(formData);
        await accountsApi.logActivity({ 
          action: 'create', 
          description: `Created agency: ${formData.name}` 
        });
        toast.success('Agency created successfully');
      }
      fetchData();
      handleCloseModal();
    } catch (error) {
      console.error('Error saving agency:', error);
      toast.error(error.response?.data?.name?.[0] || 'Failed to save agency');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This will also delete all associated initiatives.`)) {
      try {
        await agencies.delete(id);
        await accountsApi.logActivity({ 
          action: 'delete', 
          description: `Deleted agency: ${name}` 
        });
        toast.success('Agency deleted successfully');
        fetchData();
      } catch (error) {
        console.error('Error deleting agency:', error);
        toast.error('Failed to delete agency');
      }
    }
  };

  const filteredAgencies = agenciesList.filter(agency =>
    agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (agency.code && agency.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading agencies...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Agencies</h2>
          <p className="text-gray-600 mt-1">Manage agencies under the Federal Ministry of Environment</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Agency
        </button>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search agencies by name or code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAgencies.map((agency) => (
          <div key={agency.id} className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="bg-gradient-to-br from-cyan-500 to-blue-500 p-3 rounded-xl shadow-md">
                <Landmark className="w-6 h-6 text-white" />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenModal(agency)}
                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(agency.id, agency.name)}
                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{agency.name}</h3>
            {agency.code && (
              <p className="text-xs text-gray-500 mb-2">Code: {agency.code}</p>
            )}
            {agency.description && (
              <p className="text-sm text-gray-600 mt-2 line-clamp-2">{agency.description}</p>
            )}
            {agency.website && (
              <a
                href={agency.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 mt-2"
              >
                <ExternalLink className="w-3 h-3" />
                Visit Website
              </a>
            )}
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-400">Created: {new Date(agency.created_at).toLocaleDateString()}</p>
            </div>
          </div>
        ))}
      </div>

      {filteredAgencies.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <Landmark className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No agencies found</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-gray-900">
                {editingAgency ? 'Edit Agency' : 'Add New Agency'}
              </h3>
              <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Agency Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  placeholder="e.g., National Oil Spill Detection and Response Agency (NOSDRA)"
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
                  placeholder="e.g., NOSDRA"
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Website (Optional)
                </label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none text-sm"
                  placeholder="https://example.gov.ng"
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
                  placeholder="Agency description..."
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
                  {submitting ? 'Saving...' : editingAgency ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgencyManagement;