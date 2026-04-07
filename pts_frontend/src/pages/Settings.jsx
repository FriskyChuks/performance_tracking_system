// src/pages/Settings.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Bell, Shield, Activity, Save, Edit2, Eye, EyeOff, LogOut, Phone, Building, Briefcase, Key, ShieldCheck, ChevronRight, RefreshCw } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { auth, activities } from '../services/api';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Settings = () => {
  const { user, logout, updateUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '', department: '', position: '' });
  const [passwordForm, setPasswordForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState({});
  
  const [notifications, setNotifications] = useState({
    email_notifications: true, project_updates: true, performance_alerts: true,
    weekly_summary: false, monthly_report: true, mention_alerts: true
  });
  
  const [activityLog, setActivityLog] = useState([]);
  const [activityLoading, setActivityLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfileForm({
        first_name: user.first_name || '', last_name: user.last_name || '', email: user.email || '',
        phone: user.phone || '', department: user.department || '', position: user.position || ''
      });
    }
    fetchActivities();
  }, [user]);

  const fetchActivities = async () => {
    setActivityLoading(true);
    try {
      const response = await activities.getUserActivities(20);
      setActivityLog(response.data);
    } catch (error) { console.error('Error:', error); setActivityLog([]); }
    finally { setActivityLoading(false); }
  };

  const getActionIcon = (action) => {
    const icons = { 'login': '🔐', 'logout': '🚪', 'create': '➕', 'update': '✏️', 'delete': '🗑️', 'view': '👁️', 'export': '📥', 'change_password': '🔒', 'update_profile': '👤' };
    return icons[action] || '📌';
  };

  const getActionColor = (action) => {
    const colors = {
      'login': 'bg-green-100 text-green-600', 'logout': 'bg-gray-100 text-gray-600',
      'create': 'bg-blue-100 text-blue-600', 'update': 'bg-yellow-100 text-yellow-600',
      'delete': 'bg-red-100 text-red-600', 'change_password': 'bg-orange-100 text-orange-600',
      'update_profile': 'bg-cyan-100 text-cyan-600'
    };
    return colors[action] || 'bg-gray-100 text-gray-600';
  };

  const formatActivityTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / 60000);
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return format(date, 'MMM d');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await auth.updateProfile(profileForm);
      toast.success('Profile updated');
      setEditMode(false);
      if (updateUser) updateUser(response.data);
      await activities.logActivity('update_profile', 'Updated profile');
      fetchActivities();
    } catch (error) { toast.error(error.response?.data?.message || 'Update failed'); }
    finally { setLoading(false); }
  };

  const validatePassword = () => {
    const errors = {};
    if (!passwordForm.current_password) errors.current_password = 'Current password required';
    if (!passwordForm.new_password) errors.new_password = 'New password required';
    else if (passwordForm.new_password.length < 6) errors.new_password = 'Minimum 6 characters';
    if (passwordForm.new_password !== passwordForm.confirm_password) errors.confirm_password = 'Passwords do not match';
    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (!validatePassword()) return;
    setLoading(true);
    try {
      await auth.changePassword(passwordForm);
      toast.success('Password changed');
      setPasswordForm({ current_password: '', new_password: '', confirm_password: '' });
      setPasswordErrors({});
      await activities.logActivity('change_password', 'Changed password');
      fetchActivities();
    } catch (error) { toast.error(error.response?.data?.message || 'Change failed'); }
    finally { setLoading(false); }
  };

  const handleNotificationUpdate = async (key, value) => {
    setNotifications(prev => ({ ...prev, [key]: value }));
    toast.success(`${key.replace(/_/g, ' ')} updated`);
    await activities.logActivity('update_profile', `Updated notification: ${key}`);
  };

  const handleLogout = async () => {
    await activities.logActivity('logout', 'Logged out');
    logout();
    navigate('/login');
  };

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'activity', label: 'Activity', icon: Activity }
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-xs text-gray-500 mt-0.5">Manage your account preferences</p>
          </div>
          {activeTab === 'activity' && (
            <button onClick={fetchActivities} className="p-1.5 text-green-600 hover:bg-green-50 rounded-lg transition">
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {tabs.map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center justify-between p-3 transition-all ${isActive ? 'bg-green-50 border-l-4 border-green-600' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                    <span className={`text-sm font-medium ${isActive ? 'text-green-700' : 'text-gray-700'}`}>{tab.label}</span>
                  </div>
                  <ChevronRight className={`w-3.5 h-3.5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                </button>
              );
            })}
            <div className="border-t border-gray-200">
              <button onClick={handleLogout} className="w-full flex items-center gap-2 p-3 text-red-600 hover:bg-red-50 transition text-sm font-medium">
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Profile Information</h2>
                </div>
                {!editMode ? (
                  <button onClick={() => setEditMode(true)} className="flex items-center gap-1 text-green-600 hover:bg-green-50 px-2 py-1 rounded-lg text-xs transition">
                    <Edit2 className="w-3 h-3" /> Edit
                  </button>
                ) : (
                  <button onClick={() => { setEditMode(false); setProfileForm({ first_name: user?.first_name || '', last_name: user?.last_name || '', email: user?.email || '', phone: user?.phone || '', department: user?.department || '', position: user?.position || '' }); }} className="text-xs text-gray-500 hover:bg-gray-100 px-2 py-1 rounded-lg">
                    Cancel
                  </button>
                )}
              </div>
              
              <form onSubmit={handleProfileUpdate} className="p-4 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" value={profileForm.first_name} onChange={(e) => setProfileForm({ ...profileForm, first_name: e.target.value })} disabled={!editMode} className={`w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm ${!editMode ? 'bg-gray-50 text-gray-500' : 'bg-white focus:ring-2 focus:ring-green-500'}`} placeholder="First name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" value={profileForm.last_name} onChange={(e) => setProfileForm({ ...profileForm, last_name: e.target.value })} disabled={!editMode} className={`w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm ${!editMode ? 'bg-gray-50 text-gray-500' : 'bg-white focus:ring-2 focus:ring-green-500'}`} placeholder="Last name" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="email" value={profileForm.email} disabled className="w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-500 text-sm cursor-not-allowed" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="tel" value={profileForm.phone} onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} disabled={!editMode} className={`w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm ${!editMode ? 'bg-gray-50 text-gray-500' : 'bg-white focus:ring-2 focus:ring-green-500'}`} placeholder="Phone" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                    <div className="relative">
                      <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" value={profileForm.department} onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} disabled={!editMode} className={`w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm ${!editMode ? 'bg-gray-50 text-gray-500' : 'bg-white focus:ring-2 focus:ring-green-500'}`} placeholder="Department" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Position</label>
                    <div className="relative">
                      <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type="text" value={profileForm.position} onChange={(e) => setProfileForm({ ...profileForm, position: e.target.value })} disabled={!editMode} className={`w-full pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm ${!editMode ? 'bg-gray-50 text-gray-500' : 'bg-white focus:ring-2 focus:ring-green-500'}`} placeholder="Position" />
                    </div>
                  </div>
                </div>
                
                {editMode && (
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm">
                      {loading ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>Saving...</> : <><Save className="w-3.5 h-3.5" />Save</>}
                    </button>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-green-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Change Password</h2>
                  </div>
                </div>
                
                <form onSubmit={handlePasswordChange} className="p-4 space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Current Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type={showCurrentPassword ? 'text' : 'password'} value={passwordForm.current_password} onChange={(e) => setPasswordForm({ ...passwordForm, current_password: e.target.value })} className={`w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm ${passwordErrors.current_password ? 'border-red-500' : 'focus:ring-2 focus:ring-green-500'}`} placeholder="Current password" />
                      <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">{showCurrentPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    </div>
                    {passwordErrors.current_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.current_password}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">New Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type={showNewPassword ? 'text' : 'password'} value={passwordForm.new_password} onChange={(e) => setPasswordForm({ ...passwordForm, new_password: e.target.value })} className={`w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm ${passwordErrors.new_password ? 'border-red-500' : 'focus:ring-2 focus:ring-green-500'}`} placeholder="New password" />
                      <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">{showNewPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    </div>
                    {passwordErrors.new_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.new_password}</p>}
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                      <input type={showConfirmPassword ? 'text' : 'password'} value={passwordForm.confirm_password} onChange={(e) => setPasswordForm({ ...passwordForm, confirm_password: e.target.value })} className={`w-full pl-9 pr-8 py-1.5 border border-gray-200 rounded-lg text-sm ${passwordErrors.confirm_password ? 'border-red-500' : 'focus:ring-2 focus:ring-green-500'}`} placeholder="Confirm password" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400">{showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}</button>
                    </div>
                    {passwordErrors.confirm_password && <p className="text-xs text-red-500 mt-1">{passwordErrors.confirm_password}</p>}
                  </div>
                  
                  <div className="flex justify-end pt-2">
                    <button type="submit" disabled={loading} className="px-4 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg flex items-center gap-1.5 text-sm shadow-sm">
                      {loading ? <><div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>Updating...</> : <><Key className="w-3.5 h-3.5" />Update</>}
                    </button>
                  </div>
                </form>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-green-600" />
                    <h2 className="text-sm font-semibold text-gray-900">Two-Factor Authentication</h2>
                  </div>
                </div>
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-1.5 rounded-lg"><Shield className="w-4 h-4 text-gray-600" /></div>
                    <div><p className="text-sm font-medium text-gray-900">2FA Protection</p><p className="text-xs text-gray-500">Add extra security layer</p></div>
                  </div>
                  <button className="px-3 py-1 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-xs transition">Setup</button>
                </div>
              </div>
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Preferences</h2>
                </div>
              </div>
              
              <div className="p-4 space-y-3">
                {[
                  { key: 'email_notifications', label: 'Email Notifications', icon: Mail, desc: 'Receive email updates' },
                  { key: 'project_updates', label: 'Project Updates', icon: Bell, desc: 'Project change alerts' },
                  { key: 'performance_alerts', label: 'Performance Alerts', icon: Activity, desc: 'Milestone notifications' },
                  { key: 'weekly_summary', label: 'Weekly Summary', icon: Activity, desc: 'Weekly performance digest' },
                  { key: 'monthly_report', label: 'Monthly Report', icon: Activity, desc: 'Monthly performance report' }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.key} className="flex items-center justify-between py-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-gray-100 p-1.5 rounded-lg"><Icon className="w-3.5 h-3.5 text-gray-600" /></div>
                        <div><p className="text-sm font-medium text-gray-900">{item.label}</p><p className="text-xs text-gray-500">{item.desc}</p></div>
                      </div>
                      <button onClick={() => handleNotificationUpdate(item.key, !notifications[item.key])} className={`relative inline-flex h-5 w-9 items-center rounded-full transition ${notifications[item.key] ? 'bg-green-600' : 'bg-gray-300'}`}>
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition ${notifications[item.key] ? 'translate-x-5' : 'translate-x-0.5'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Activity Tab */}
          {activeTab === 'activity' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <h2 className="text-sm font-semibold text-gray-900">Recent Activity</h2>
                </div>
              </div>
              
              {activityLoading ? (
                <div className="flex justify-center py-8"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-600"></div></div>
              ) : activityLog.length === 0 ? (
                <div className="text-center py-8"><Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" /><p className="text-gray-500 text-sm">No activity yet</p></div>
              ) : (
                <div className="divide-y divide-gray-100">
                  {activityLog.map((activity) => (
                    <div key={activity.id} className="p-3 hover:bg-gray-50 transition">
                      <div className="flex items-start gap-2">
                        <div className={`p-1.5 rounded-lg ${getActionColor(activity.action)}`}>
                          <span className="text-sm">{getActionIcon(activity.action)}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between flex-wrap gap-1">
                            <p className="text-sm font-medium text-gray-900">{activity.description}</p>
                            <span className="text-xs text-gray-400 whitespace-nowrap">{formatActivityTime(activity.created_at)}</span>
                          </div>
                          {activity.ip_address && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-gray-400">IP: {activity.ip_address}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;