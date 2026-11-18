// src/components/Admin/UserManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  UserCheck, 
  Shield,
  Building2,
  Landmark,
  X,
  Check,
  AlertCircle,
  RefreshCw,
  Crown,
  Edit,
  Award,
  Clock,
  ChevronRight
} from 'lucide-react';
import accountsApi from '../../services/accountsApi';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

// Modal component
const Modal = ({ title, icon, gradient, onClose, children }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
    <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto p-5 animate-fade-in-up shadow-2xl">
      <div className="flex justify-between items-center mb-4 sticky top-0 bg-white">
        <div className="flex items-center gap-2">
          <div className={`bg-gradient-to-r ${gradient} p-1.5 rounded-lg`}>
            {icon}
          </div>
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <X className="w-5 h-5" />
        </button>
      </div>
      {children}
    </div>
  </div>
);

const UserManagement = () => {
  const { userRole } = useAuth();
  const [users, setUsers] = useState([]);
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [assignmentType, setAssignmentType] = useState('department');
  const [upgradeForm, setUpgradeForm] = useState({
    role: '',
    department_id: '',
    agency_id: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(null);

  const isAdmin = userRole === 'project_admin';

  useEffect(() => {
    if (isAdmin) {
      fetchData();
      fetchDepartments();
      fetchAgencies();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await accountsApi.getAllUsers();
      const allUsers = response?.results || response || [];
      setUsers(allUsers);
      
      const pending = allUsers.filter(u => u.role === 'public_user' || !u.role || u.role === null);
      setPendingUsers(pending);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
      setUsers([]);
      setPendingUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const departments = await mainApi.getPublicDepartments();
      setDepartmentsList(departments || []);
    } catch (error) {
      console.error('Error fetching departments:', error);
    }
  };

  const fetchAgencies = async () => {
    try {
      const agencies = await mainApi.getPublicAgencies();
      setAgenciesList(agencies || []);
    } catch (error) {
      console.error('Error fetching agencies:', error);
    }
  };

  const handleUpgradeUser = async () => {
    if (!upgradeForm.role) {
      toast.error('Please select a role');
      return;
    }

    setSubmitting(true);
    try {
      const updatePayload = {
        role: upgradeForm.role,
        can_access_dashboard: true,
        is_public_only: false
      };
      
      if (upgradeForm.role !== 'sector_expert') {
        if (assignmentType === 'department' && upgradeForm.department_id) {
          updatePayload.assigned_department = parseInt(upgradeForm.department_id);
          updatePayload.assigned_agency = null;
        } else if (assignmentType === 'agency' && upgradeForm.agency_id) {
          updatePayload.assigned_agency = parseInt(upgradeForm.agency_id);
          updatePayload.assigned_department = null;
        }
      } else {
        updatePayload.assigned_department = null;
        updatePayload.assigned_agency = null;
      }
      
      await accountsApi.updateUserRole(selectedUser.id, updatePayload);
      
      const roleNames = {
        project_admin: 'Project Admin',
        delivery_officer: 'Delivery Officer',
        director: 'Director',
        sector_expert: 'Sector Expert'
      };
      
      toast.success(`${selectedUser.full_name || selectedUser.email} has been upgraded to ${roleNames[upgradeForm.role]}`);
      
      setShowUpgradeModal(false);
      setSelectedUser(null);
      setUpgradeForm({ role: '', department_id: '', agency_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error upgrading user:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to upgrade user');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateRole = async () => {
    if (!upgradeForm.role) {
      toast.error('Please select a role');
      return;
    }

    setSubmitting(true);
    try {
      const updatePayload = {
        role: upgradeForm.role
      };
      
      if (upgradeForm.role !== 'sector_expert') {
        if (assignmentType === 'department' && upgradeForm.department_id) {
          updatePayload.assigned_department = parseInt(upgradeForm.department_id);
          updatePayload.assigned_agency = null;
        } else if (assignmentType === 'agency' && upgradeForm.agency_id) {
          updatePayload.assigned_agency = parseInt(upgradeForm.agency_id);
          updatePayload.assigned_department = null;
        }
      } else {
        updatePayload.assigned_department = null;
        updatePayload.assigned_agency = null;
      }
      
      if (upgradeForm.role !== 'public_user') {
        updatePayload.can_access_dashboard = true;
        updatePayload.is_public_only = false;
      }
      
      await accountsApi.updateUserRole(selectedUser.id, updatePayload);
      
      const roleNames = {
        project_admin: 'Project Admin',
        delivery_officer: 'Delivery Officer',
        director: 'Director',
        sector_expert: 'Sector Expert'
      };
      
      toast.success(`${selectedUser.full_name || selectedUser.email}'s role updated to ${roleNames[upgradeForm.role]}`);
      
      setShowRoleModal(false);
      setSelectedUser(null);
      setUpgradeForm({ role: '', department_id: '', agency_id: '' });
      fetchData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error(error.response?.data?.error || error.response?.data?.message || 'Failed to update role');
    } finally {
      setSubmitting(false);
    }
  };

  const getRoleConfig = (role) => {
    const configs = {
      project_admin: { 
        label: 'Project Admin', 
        icon: Shield,
        badgeClass: 'bg-gradient-to-r from-blue-500 to-blue-600',
      },
      delivery_officer: { 
        label: 'Delivery Officer', 
        icon: UserCheck,
        badgeClass: 'bg-gradient-to-r from-green-500 to-green-600',
      },
      director: { 
        label: 'Director', 
        icon: Crown,
        badgeClass: 'bg-gradient-to-r from-purple-500 to-purple-600',
      },
      sector_expert: { 
        label: 'Sector Expert', 
        icon: Award,
        badgeClass: 'bg-gradient-to-r from-orange-500 to-orange-600',
      },
      public_user: { 
        label: 'Public User', 
        icon: Users,
        badgeClass: 'bg-gradient-to-r from-gray-500 to-gray-600',
      }
    };
    return configs[role] || configs.public_user;
  };

  const getAssignedEntityDisplay = (user) => {
    if (user.assigned_department) {
      const dept = departmentsList.find(d => d.id === user.assigned_department);
      return (
        <div className="flex items-center gap-1">
          <Building2 className="w-3 h-3 text-blue-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">{dept?.name || 'Unknown Department'}</span>
        </div>
      );
    } else if (user.assigned_agency) {
      const agency = agenciesList.find(a => a.id === user.assigned_agency);
      return (
        <div className="flex items-center gap-1">
          <Landmark className="w-3 h-3 text-purple-500 flex-shrink-0" />
          <span className="text-sm text-gray-600 truncate">{agency?.name || 'Unknown Agency'}</span>
        </div>
      );
    }
    return <span className="text-sm text-gray-400">—</span>;
  };

  const filteredUsers = users.filter(user => 
    user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const roleOptions = [
    { value: 'project_admin', label: 'Project Admin', icon: Shield, description: 'Can create and manage activities' },
    { value: 'delivery_officer', label: 'Delivery Officer', icon: UserCheck, description: 'Can update progress and upload images' },
    { value: 'director', label: 'Director', icon: Crown, description: 'Can approve quarterly submissions' },
    { value: 'sector_expert', label: 'Sector Expert', icon: Award, description: 'Can assess and rate performance' }
  ];

  const renderDesktopRows = () => {
    if (loading) {
      return (
        <tr>
          <td colSpan="6" className="py-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
          </td>
        </tr>
      );
    }
    
    if (filteredUsers.length === 0) {
      return (
        <tr>
          <td colSpan="6" className="py-8 text-center text-gray-500">
            No users found
          </td>
        </tr>
      );
    }
    
    return filteredUsers.map((user) => {
      const roleConfig = getRoleConfig(user.role);
      const RoleIcon = roleConfig.icon;
      const isPublicUser = user.role === 'public_user' || !user.role;
      
      return (
        <tr key={user.id} className="hover:bg-gray-50 transition">
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-xs">
                {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-gray-900 text-sm">{user.full_name || 'N/A'}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            </div>
          </td>
          <td className="py-3 px-4">
            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium text-white ${roleConfig.badgeClass}`}>
              <RoleIcon className="w-3 h-3" />
              {roleConfig.label}
            </span>
          </td>
          <td className="py-3 px-4">
            {getAssignedEntityDisplay(user)}
          </td>
          <td className="py-3 px-4">
            {user.is_active !== false ? (
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
            {isPublicUser ? (
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setUpgradeForm({ role: '', department_id: '', agency_id: '' });
                  setAssignmentType('department');
                  setShowUpgradeModal(true);
                }}
                className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition flex items-center gap-1"
              >
                <UserCheck className="w-3 h-3" />
                Upgrade
              </button>
            ) : (
              <button
                onClick={() => {
                  setSelectedUser(user);
                  setUpgradeForm({
                    role: user.role || '',
                    department_id: user.assigned_department || '',
                    agency_id: user.assigned_agency || ''
                  });
                  setAssignmentType(user.assigned_agency ? 'agency' : 'department');
                  setShowRoleModal(true);
                }}
                className="px-3 py-1 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs rounded-lg transition flex items-center gap-1"
              >
                <Edit className="w-3 h-3" />
                Edit Role
              </button>
            )}
          </td>
        </tr>
      );
    });
  };

  const renderMobileCards = () => {
    if (loading) {
      return (
        <div className="py-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
        </div>
      );
    }
    
    if (filteredUsers.length === 0) {
      return (
        <div className="py-8 text-center text-gray-500">
          No users found
        </div>
      );
    }
    
    return filteredUsers.map((user) => {
      const roleConfig = getRoleConfig(user.role);
      const RoleIcon = roleConfig.icon;
      const isPublicUser = user.role === 'public_user' || !user.role;
      const isExpanded = showMobileMenu === user.id;
      
      return (
        <div key={user.id} className="p-3 hover:bg-gray-50 transition border-b border-gray-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {user.full_name?.charAt(0).toUpperCase() || user.email.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 text-sm truncate">{user.full_name || 'N/A'}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white ${roleConfig.badgeClass}`}>
                    <RoleIcon className="w-3 h-3" />
                    {roleConfig.label}
                  </span>
                  {user.is_active !== false ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-100 text-green-600">
                      <Check className="w-3 h-3" />
                      Active
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-600">
                      <X className="w-3 h-3" />
                      Inactive
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={() => setShowMobileMenu(isExpanded ? null : user.id)}
              className="p-1 text-gray-400 hover:text-gray-600"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
          
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Department/Agency:</span>
                <span className="text-gray-900">{getAssignedEntityDisplay(user)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Joined:</span>
                <span className="text-gray-900">{new Date(user.date_joined).toLocaleDateString()}</span>
              </div>
              <div className="pt-2">
                {isPublicUser ? (
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setUpgradeForm({ role: '', department_id: '', agency_id: '' });
                      setAssignmentType('department');
                      setShowUpgradeModal(true);
                    }}
                    className="w-full px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    Upgrade User
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedUser(user);
                      setUpgradeForm({
                        role: user.role || '',
                        department_id: user.assigned_department || '',
                        agency_id: user.assigned_agency || ''
                      });
                      setAssignmentType(user.assigned_agency ? 'agency' : 'department');
                      setShowRoleModal(true);
                    }}
                    className="w-full px-3 py-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 text-xs rounded-lg transition flex items-center justify-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    Edit Role
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      );
    });
  };

  if (!isAdmin) {
    return (
      <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
        <Shield className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">This page is only accessible to Project Administrators.</p>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 py-4 sm:py-6 max-w-full">
      {/* Header */}
      <div className="mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
              User Management
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">Manage users, assign roles, and control dashboard access</p>
          </div>
          <button
            onClick={fetchData}
            className="self-start sm:self-auto p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 mb-5">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-blue-600 font-medium">Total Users</p>
              <p className="text-lg sm:text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
            <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-green-600 font-medium">Active Users</p>
              <p className="text-lg sm:text-2xl font-bold text-green-700">
                {users.filter(u => u.is_active !== false).length}
              </p>
            </div>
            <UserCheck className="w-6 h-6 sm:w-8 sm:h-8 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-yellow-600 font-medium">Pending Upgrade</p>
              <p className="text-lg sm:text-2xl font-bold text-yellow-700">{pendingUsers.length}</p>
            </div>
            <Clock className="w-6 h-6 sm:w-8 sm:h-8 text-yellow-500 opacity-50" />
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg sm:rounded-xl p-2 sm:p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] sm:text-xs text-purple-600 font-medium">Staff Accounts</p>
              <p className="text-lg sm:text-2xl font-bold text-purple-700">
                {users.filter(u => u.role && u.role !== 'public_user').length}
              </p>
            </div>
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-purple-500 opacity-50" />
          </div>
        </div>
      </div>

      {/* Pending Upgrades Section */}
      {pendingUsers.length > 0 && (
        <div className="mb-5 bg-amber-50 rounded-lg sm:rounded-xl border border-amber-200 overflow-hidden">
          <div className="px-3 sm:px-4 py-2 sm:py-3 bg-amber-100 border-b border-amber-200">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-700" />
              <h2 className="font-semibold text-amber-800 text-sm sm:text-base">Pending Upgrades ({pendingUsers.length})</h2>
            </div>
            <p className="text-xs text-amber-600 mt-0.5 hidden sm:block">Public users waiting for role assignment</p>
          </div>
          <div className="divide-y divide-amber-100">
            {pendingUsers.slice(0, 5).map((user) => (
              <div key={user.id} className="px-3 sm:px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-amber-100/50 transition">
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 text-sm sm:text-base truncate">{user.full_name || 'Unnamed User'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{user.email}</p>
                  <p className="text-[10px] sm:text-xs text-amber-600 mt-0.5">Registered: {new Date(user.date_joined).toLocaleDateString()}</p>
                </div>
                <button
                  onClick={() => {
                    setSelectedUser(user);
                    setUpgradeForm({ role: '', department_id: '', agency_id: '' });
                    setAssignmentType('department');
                    setShowUpgradeModal(true);
                  }}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs sm:text-sm rounded-lg transition flex items-center justify-center gap-1 self-start sm:self-auto"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Upgrade
                </button>
              </div>
            ))}
          </div>
          {pendingUsers.length > 5 && (
            <div className="px-3 sm:px-4 py-2 bg-amber-100/50 text-center text-xs sm:text-sm text-amber-700">
              +{pendingUsers.length - 5} more pending users
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="mb-5">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      {/* Users Table - Desktop */}
      <div className="hidden md:block bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">User</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Role</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Department/Agency</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Status</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Joined</th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {renderDesktopRows()}
            </tbody>
          </table>
        </div>
      </div>

      {/* Users Cards - Mobile */}
      <div className="md:hidden bg-white rounded-xl shadow-md overflow-hidden">
        {renderMobileCards()}
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedUser && (
        <Modal
          title="Upgrade User"
          icon={<UserCheck className="w-4 h-4 text-white" />}
          gradient="from-green-500 to-emerald-500"
          onClose={() => setShowUpgradeModal(false)}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 text-sm">{selectedUser.full_name || 'Unnamed User'}</p>
            <p className="text-xs text-gray-500 break-all">{selectedUser.email}</p>
            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Registered: {new Date(selectedUser.date_joined).toLocaleDateString()}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Select Role *</label>
              <div className="space-y-2">
                {roleOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = upgradeForm.role === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        isSelected ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => setUpgradeForm({ ...upgradeForm, role: e.target.value })}
                        className="mt-0.5 text-green-600 focus:ring-green-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {upgradeForm.role && upgradeForm.role !== 'sector_expert' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('department')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        assignmentType === 'department' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      Department
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentType('agency')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        assignmentType === 'agency' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5 inline mr-1" />
                      Agency
                    </button>
                  </div>
                </div>
                
                {assignmentType === 'department' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Department</label>
                    <select
                      value={upgradeForm.department_id}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, department_id: e.target.value, agency_id: '' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="">No department assigned</option>
                      {departmentsList.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Agency</label>
                    <select
                      value={upgradeForm.agency_id}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, agency_id: e.target.value, department_id: '' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                    >
                      <option value="">No agency assigned</option>
                      {agenciesList.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-700 flex items-start gap-2">
              <Shield className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Upgraded users will gain dashboard access based on their assigned role permissions.</span>
            </div>
            
            <button
              onClick={handleUpgradeUser}
              disabled={submitting || !upgradeForm.role}
              className="w-full py-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Upgrading...' : 'Upgrade User'}
            </button>
          </div>
        </Modal>
      )}

      {/* Edit Role Modal */}
      {showRoleModal && selectedUser && (
        <Modal
          title="Edit User Role"
          icon={<Edit className="w-4 h-4 text-white" />}
          gradient="from-purple-600 to-pink-600"
          onClose={() => setShowRoleModal(false)}
        >
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <p className="font-medium text-gray-900 text-sm">{selectedUser.full_name || 'Unnamed User'}</p>
            <p className="text-xs text-gray-500 break-all">{selectedUser.email}</p>
            <p className="text-xs text-purple-600 mt-1 flex items-center gap-1">
              <Shield className="w-3 h-3" />
              Current: {getRoleConfig(selectedUser.role).label}
            </p>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">New Role *</label>
              <div className="space-y-2">
                {roleOptions.map(option => {
                  const Icon = option.icon;
                  const isSelected = upgradeForm.role === option.value;
                  return (
                    <label
                      key={option.value}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition ${
                        isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="role"
                        value={option.value}
                        checked={isSelected}
                        onChange={(e) => setUpgradeForm({ ...upgradeForm, role: e.target.value })}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Icon className="w-4 h-4 text-gray-500" />
                          <span className="font-medium text-gray-900 text-sm">{option.label}</span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{option.description}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            
            {upgradeForm.role && upgradeForm.role !== 'sector_expert' && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assignment Type</label>
                  <div className="flex gap-2 mb-2">
                    <button
                      type="button"
                      onClick={() => setAssignmentType('department')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        assignmentType === 'department' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5 inline mr-1" />
                      Department
                    </button>
                    <button
                      type="button"
                      onClick={() => setAssignmentType('agency')}
                      className={`flex-1 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        assignmentType === 'agency' ? 'bg-purple-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <Landmark className="w-3.5 h-3.5 inline mr-1" />
                      Agency
                    </button>
                  </div>
                </div>
                
                {assignmentType === 'department' ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Department</label>
                    <select
                      value={upgradeForm.department_id}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, department_id: e.target.value, agency_id: '' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">No department assigned</option>
                      {departmentsList.map(dept => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Assign Agency</label>
                    <select
                      value={upgradeForm.agency_id}
                      onChange={(e) => setUpgradeForm({ ...upgradeForm, agency_id: e.target.value, department_id: '' })}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                    >
                      <option value="">No agency assigned</option>
                      {agenciesList.map(agency => (
                        <option key={agency.id} value={agency.id}>{agency.name}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}
            
            <div className="bg-amber-50 rounded-lg p-3 text-xs text-amber-700 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>Changing a user's role will update their dashboard permissions immediately.</span>
            </div>
            
            <button
              onClick={handleUpdateRole}
              disabled={submitting || !upgradeForm.role}
              className="w-full py-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg font-medium text-sm transition disabled:opacity-50"
            >
              {submitting ? 'Updating...' : 'Update Role'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default UserManagement;