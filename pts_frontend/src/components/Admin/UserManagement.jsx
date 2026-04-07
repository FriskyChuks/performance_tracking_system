// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  UserCheck, 
  UserX,
  Shield,
  Building2,
  Mail,
  Calendar,
  ChevronRight,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Crown,
  Star,
  MoreVertical,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { adminApi } from '../../services/adminApi';
import { ministries } from '../../services/api';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [groups, setGroups] = useState([]);
  const [ministriesList, setMinistriesList] = useState([]);
  const [upgradeForm, setUpgradeForm] = useState({
    group_id: '',
    ministry_id: ''
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
    fetchGroups();
    fetchMinistries();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [allUsersRes, pendingUsersRes] = await Promise.all([
        adminApi.getAllUsers(),
        adminApi.getPendingUsers()
      ]);
      setUsers(allUsersRes.data);
      setPendingUsers(pendingUsersRes.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    try {
      const response = await adminApi.getGroups();
      setGroups(response.data);
    } catch (error) {
      console.error('Error fetching groups:', error);
    }
  };

  const fetchMinistries = async () => {
    try {
      const response = await ministries.list();
      setMinistriesList(response.data);
    } catch (error) {
      console.error('Error fetching ministries:', error);
    }
  };

  const handleUpgradeUser = async () => {
    if (!upgradeForm.group_id) {
      toast.error('Please select a role');
      return;
    }

    setSubmitting(true);
    try {
      await adminApi.upgradeUser(selectedUser.id, {
        group_id: upgradeForm.group_id,
        ministry_id: upgradeForm.ministry_id
      });
      
      const selectedGroup = groups.find(g => g.id === parseInt(upgradeForm.group_id));
      toast.success(`${selectedUser.full_name} has been upgraded to ${selectedGroup?.name || 'Dashboard User'}`);
      
      setShowUpgradeModal(false);
      setSelectedUser(null);
      setUpgradeForm({ group_id: '', ministry_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error(error.response?.data?.error || 'Failed to upgrade user');
    } finally {
      setSubmitting(false);
    }
  };

  const getUserTypeConfig = (user) => {
    const userType = user.user_type || 'public';
    const configs = {
      super_admin: { 
        label: 'Super Admin', 
        color: 'bg-red-500', 
        icon: Crown,
        badgeClass: 'bg-gradient-to-r from-red-500 to-red-600'
      },
      staff: { 
        label: 'Staff', 
        color: 'bg-green-500', 
        icon: Shield,
        badgeClass: 'bg-gradient-to-r from-green-500 to-green-600'
      },
      dashboard_user: { 
        label: 'Dashboard User', 
        color: 'bg-blue-500', 
        icon: Users,
        badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600'
      },
      pending: { 
        label: 'Pending', 
        color: 'bg-yellow-500', 
        icon: AlertCircle,
        badgeClass: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
      },
      public: { 
        label: 'Public User', 
        color: 'bg-gray-500', 
        icon: Users,
        badgeClass: 'bg-gradient-to-r from-gray-500 to-gray-600'
      }
    };
    return configs[userType] || configs.public;
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Users className="w-6 h-6 text-primary-600" />
          User Management
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage users, assign roles, and upgrade public users</p>
      </div>

      {/* Pending Upgrades Section */}
      {pendingUsers.length > 0 && (
        <div className="mb-8 bg-amber-50 rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-4 py-3 bg-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <h2 className="font-semibold text-amber-800">Pending Upgrades ({pendingUsers.length})</h2>
            </div>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="px-4 py-3 flex items-center justify-between hover:bg-amber-100/50 transition">
                <div>
                  <p className="font-medium text-gray-900">{user.full_name || 'Unnamed User'}</p>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setShowUpgradeModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-sm rounded-lg transition flex items-center gap-1"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              </div>
            ))}
          </div>
          {pendingUsers.length > 5 && (
            <div className="px-4 py-2 bg-amber-100/50 text-center text-sm text-amber-700">
              +{pendingUsers.length - 5} more pending users
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Group</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Ministry</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-gray-500">
                    No users found
                   </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const userType = getUserTypeConfig(user);
                  const UserIcon = userType.icon;
                  return (
                    <tr key={user.id} className="hover:bg-gray-50 transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-xs">
                            {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">{user.full_name || 'N/A'}</p>
                            <p className="text-xs text-gray-500">{user.email}</p>
                          </div>
                        </div>
                       </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${userType.badgeClass}`}>
                          <UserIcon className="w-3 h-3" />
                          {userType.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.group || '-'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {user.ministry_name || '-'}
                      </td>
                      <td className="py-3 px-4">
                        {user.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-green-100 text-green-600">
                            <Check className="w-3 h-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-red-100 text-red-600">
                            <X className="w-3 h-3" />
                            Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-600">
                        {new Date(user.date_joined).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-4">
                        {(user.user_type === 'public' || user.user_type === 'pending') && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUpgradeForm({
                                group_id: user.group_id || '',
                                ministry_id: user.ministry_id || ''
                              });
                              setShowUpgradeModal(true);
                            }}
                            className="px-3 py-1 bg-primary-600 hover:bg-primary-700 text-white text-xs rounded-lg transition flex items-center gap-1"
                          >
                            <UserCheck className="w-3 h-3" />
                            Upgrade
                          </button>
                        )}
                        {user.user_type === 'staff' && !user.group && (
                          <button
                            onClick={() => {
                              setSelectedUser(user);
                              setUpgradeForm({
                                group_id: user.group_id || '',
                                ministry_id: user.ministry_id || ''
                              });
                              setShowUpgradeModal(true);
                            }}
                            className="px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs rounded-lg transition"
                          >
                            Assign Role
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUser && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-5 animate-fade-in-up">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">Upgrade User</h3>
              <button onClick={() => setShowUpgradeModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{selectedUser.full_name || 'Unnamed User'}</p>
              <p className="text-sm text-gray-500">{selectedUser.email}</p>
              {selectedUser.user_type === 'pending' && (
                <p className="text-xs text-amber-600 mt-1">This user is pending approval</p>
              )}
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Role *
                </label>
                <select
                  value={upgradeForm.group_id}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, group_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                  required
                >
                  <option value="">Select a role</option>
                  {groups.map(group => (
                    <option key={group.id} value={group.id}>{group.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Assign Ministry (Optional)
                </label>
                <select
                  value={upgradeForm.ministry_id}
                  onChange={(e) => setUpgradeForm({ ...upgradeForm, ministry_id: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                >
                  <option value="">No ministry assigned</option>
                  {ministriesList.map(ministry => (
                    <option key={ministry.id} value={ministry.id}>{ministry.title}</option>
                  ))}
                </select>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
                <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Upgraded users will gain dashboard access based on their assigned role permissions.</span>
              </div>
              
              <button
                onClick={handleUpgradeUser}
                disabled={submitting || !upgradeForm.group_id}
                className="w-full py-2 bg-gradient-to-r from-primary-500 to-secondary-500 text-white rounded-lg font-medium text-sm hover:shadow-md transition disabled:opacity-50"
              >
                {submitting ? 'Upgrading...' : 'Upgrade User'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;