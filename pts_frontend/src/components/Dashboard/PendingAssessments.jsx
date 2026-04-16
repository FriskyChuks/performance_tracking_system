// src/components/Dashboard/PendingAssessments.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ClipboardList,
  Eye,
  CheckCircle,
  AlertCircle,
  Search
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import toast from 'react-hot-toast';

const PendingAssessments = () => {
  const navigate = useNavigate();
  const [initiatives, setInitiatives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchPendingAssessments();
  }, []);

  const fetchPendingAssessments = async () => {
    try {
      setLoading(true);
      const response = await mainApi.expertDashboard();
      setInitiatives(response.data);
    } catch (error) {
      console.error('Error fetching pending assessments:', error);
      toast.error('Failed to load pending assessments');
    } finally {
      setLoading(false);
    }
  };

  const filteredInitiatives = initiatives.filter(i =>
    i.title?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pending assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Pending Assessments</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Completed initiatives awaiting your expert assessment
            </p>
          </div>
          <div className="bg-gradient-to-br from-indigo-600 to-purple-600 p-2 rounded-lg shadow-md">
            <ClipboardList className="w-5 h-5 text-white" />
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search initiatives..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Assessments List */}
      {filteredInitiatives.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No pending assessments</h3>
          <p className="text-sm text-gray-500">All completed initiatives have been assessed.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredInitiatives.map((initiative) => (
            <div key={initiative.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                    initiative.initiative_type === 'project' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {initiative.initiative_type === 'project' ? '📋 Project' : '📊 Program'}
                  </span>
                </div>
                <span className="text-xs text-gray-400">
                  Completed
                </span>
              </div>
              
              <h3 className="text-base font-semibold text-gray-900 mb-2">{initiative.title}</h3>
              <p className="text-sm text-gray-600 mb-3 line-clamp-2">{initiative.description}</p>
              
              <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  <span className="font-medium">Department:</span> {initiative.department_name || initiative.agency_name || 'N/A'}
                </div>
                <button
                  onClick={() => navigate(`/dashboard/initiatives/${initiative.id}`)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm flex items-center gap-1 transition"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Assess
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingAssessments;