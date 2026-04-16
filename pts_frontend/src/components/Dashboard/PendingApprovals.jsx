// src/components/Dashboard/PendingApprovals.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Send,
  AlertCircle,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [quarters, setQuarters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      console.log('Fetching pending approvals...');
      const response = await mainApi.quarterlyProgress.getPendingApprovals();
      console.log('Pending approvals response:', response.data);
      
      // Ensure we have an array
      const approvalsData = Array.isArray(response.data) ? response.data : 
                           (response.data.results || response.data?.quarters || []);
      setQuarters(approvalsData);
    } catch (error) {
      console.error('Error fetching pending approvals:', error);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (quarterId, action) => {
    setProcessing(true);
    try {
      if (action === 'approve') {
        await mainApi.quarterlyProgress.approve(quarterId);
        toast.success('Quarter approved successfully');
      } else {
        const reason = prompt('Please provide a reason for rejection:');
        if (reason) {
          await mainApi.quarterlyProgress.reject(quarterId, { reason });
          toast.success('Quarter rejected successfully');
        } else {
          setProcessing(false);
          return;
        }
      }
      // Refresh the list
      await fetchPendingApprovals();
    } catch (error) {
      console.error(`Error ${action}ing quarter:`, error);
      toast.error(`Failed to ${action} quarter. Please try again.`);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewInitiative = (initiativeId) => {
    console.log('Navigating to initiative:', initiativeId);
    if (initiativeId) {
      navigate(`/dashboard/initiatives/${initiativeId}`);
    } else {
      toast.error('Invalid initiative ID');
    }
  };

  const filteredQuarters = quarters.filter(q =>
    q.initiative_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.deliverable_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading pending approvals...</p>
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
            <h1 className="text-xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Quarterly reports awaiting your review
            </p>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={fetchPendingApprovals}
              className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <div className="bg-gradient-to-br from-yellow-600 to-orange-600 p-2 rounded-lg shadow-md">
              <Clock className="w-5 h-5 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
        <input
          type="text"
          placeholder="Search by initiative or deliverable..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-transparent text-sm"
        />
      </div>

      {/* Approvals List */}
      {filteredQuarters.length === 0 ? (
        <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No pending approvals</h3>
          <p className="text-sm text-gray-500">All quarterly reports have been reviewed.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuarters.map((quarter) => (
            <div key={quarter.id} className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm hover:shadow-md transition">
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <span className="text-sm font-semibold text-gray-900">
                      {quarter.initiative_title || 'Unknown Initiative'}
                    </span>
                    <span className="text-xs text-gray-500">
                      Q{quarter.quarter} {quarter.year}
                    </span>
                    {quarter.initiative_code && (
                      <span className="text-xs text-gray-400">Code: {quarter.initiative_code}</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Deliverable: {quarter.deliverable_name || 'Unknown Deliverable'}
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Target:</span>
                      <span className="ml-1 font-medium">{quarter.target_value} {quarter.unit_of_measure}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Actual:</span>
                      <span className="ml-1 font-medium text-green-600">{quarter.actual_value} {quarter.unit_of_measure}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500">Achievement:</span>
                      <span className="ml-1 font-medium">{quarter.achievement_percentage}%</span>
                    </div>
                  </div>
                  {quarter.staff_comment && (
                    <div className="mt-2 text-sm text-gray-500 bg-gray-50 p-2 rounded">
                      <span className="font-medium">Staff Note:</span> {quarter.staff_comment}
                    </div>
                  )}
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewInitiative(quarter.initiative_id)}
                    className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition text-sm flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </button>
                  <button
                    onClick={() => handleApproval(quarter.id, 'reject')}
                    disabled={processing}
                    className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleApproval(quarter.id, 'approve')}
                    disabled={processing}
                    className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Approve
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PendingApprovals;