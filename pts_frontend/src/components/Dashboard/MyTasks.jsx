import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, Search, RefreshCw, CheckCircle2, Building2, Briefcase } from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

import KpiStrip from './MyTasks/KpiStrip';
import ViewModeToggle from './MyTasks/ViewModeToggle';
import ActivityCard from './MyTasks/ActivityCard';
import { card, cardPad, inputBase, btn } from './MyTasks/tokens';

const VIEW_MODE_KEY = 'mytasks_view_mode';

// Extract a readable message from a DRF error response
const extractApiError = (err, fallback = 'Something went wrong') => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const parts = [];
  Object.entries(data).forEach(([field, value]) => {
    if (Array.isArray(value)) parts.push(`${field}: ${value.join(' ')}`);
    else if (typeof value === 'string') parts.push(`${field}: ${value}`);
  });
  return parts.length ? parts.join(' | ') : fallback;
};

const MyTasks = () => {
  const { user, userRole } = useAuth();
  const navigate = useNavigate();
  const isDeliveryOfficer = userRole === 'delivery_officer';

  // ------- data -------
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ------- filters/view -------
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [viewMode, setViewMode] = useState(
    () => localStorage.getItem(VIEW_MODE_KEY) || 'compact'
  );

  // ------- expanded activity (single at a time) -------
  const [expandedActivityId, setExpandedActivityId] = useState(null);

  // ------- quarter editing (single at a time, no data loss on switch) -------
  const [editingQuarterKey, setEditingQuarterKey] = useState(null); // `${activityId}_${indicatorId}_${quarter}`
  const [draftValue, setDraftValue] = useState('');
  const [savingQuarterId, setSavingQuarterId] = useState(null);

  // ------- location -------
  const [locationForm, setLocationForm] = useState({
    latitude: '',
    longitude: '',
    address: '',
    description: '',
  });
  const [savingLocation, setSavingLocation] = useState(false);

  // ------- images -------
  const [activityImages, setActivityImages] = useState({});

  const assignedDepartment = user?.assigned_department;
  const assignedAgency = user?.assigned_agency;
  const assignedEntityName =
    assignedDepartment?.name || assignedAgency?.name || 'your department/agency';

  // Persist view mode
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useEffect(() => {
    if (isDeliveryOfficer) fetchMyTasks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDeliveryOfficer]);

  // When a new activity expands, hydrate its location form
  useEffect(() => {
    if (!expandedActivityId) return;
    const activity = activities.find((a) => a.id === expandedActivityId);
    if (activity) {
      setLocationForm({
        latitude: activity.latitude || '',
        longitude: activity.longitude || '',
        address: activity.location_address || '',
        description: activity.location_description || '',
      });
    }
  }, [expandedActivityId, activities]);

  // ------- fetch (real API, server is source of truth) -------
  const fetchMyTasks = async () => {
    setLoading(true);
    setError(null);

    try {
      const [activitiesResponse, progressResponse] = await Promise.all([
        mainApi.getMyActivities(),
        mainApi.getMyProgressList(),
      ]);

      const assignedActivities = activitiesResponse?.results || activitiesResponse || [];
      const allProgress = progressResponse?.results || progressResponse || [];

      if (assignedActivities.length === 0) {
        setActivities([]);
        return;
      }

      const enriched = await Promise.all(
        assignedActivities.map(async (activity) => {
          const fullActivity = await mainApi.getPublicActivityDetail(activity.id);
          const activityIndicators = fullActivity?.indicators || activity.indicators || [];

          if (mainApi.getActivityImages) {
            try {
              const imgs = await mainApi.getActivityImages(activity.id);
              setActivityImages((prev) => ({ ...prev, [activity.id]: imgs || [] }));
            } catch (err) {
              console.error('Error fetching images:', err);
            }
          }

          const activityProgress = allProgress.filter((p) => p.activity === activity.id);

          const indicatorsWithProgress = activityIndicators.map((indicator) => {
            const annualTarget = parseFloat(indicator.target_value) || 0;
            const quarterlyTarget = annualTarget / 4;

            const rows = activityProgress
              .filter((p) => p.indicator === indicator.id)
              .sort((a, b) => a.year - b.year || a.quarter - b.quarter);

            const currentYear = new Date().getFullYear();
            const yearRows = rows.filter((r) => r.year === currentYear);
            const effective = yearRows.length > 0 ? yearRows : rows;

            const quarters = [1, 2, 3, 4].map((q) => {
              const row = effective.find((r) => r.quarter === q);
              return {
                id: row?.id ?? null,
                quarter: q,
                year: row?.year ?? currentYear,
                quarterly_target: quarterlyTarget,
                annual_target: annualTarget,
                actual_value: row?.actual_value ?? null,
                status: row?.status ?? 'draft',
                cumulative_percentage: row?.cumulative_percentage ?? 0,
                staff_comment: row?.staff_comment || '',
                expert_rating: row?.expert_rating ?? null,
                // NEW:
                rejection_reason: row?.rejection_reason || '',
                rejection_category: row?.rejection_category || '',
                rejected_by_name: row?.rejected_by_name || '',
                rejected_at: row?.rejected_at || null,
                can_edit: row?.status === 'draft',
              };
            });

            const actualTotal = quarters.reduce(
              (s, q) => s + (parseFloat(q.actual_value) || 0),
              0
            );
            const overallAchievement = annualTarget > 0 ? (actualTotal / annualTarget) * 100 : 0;

            return {
              id: indicator.id,
              name: indicator.name,
              unit: indicator.unit || '',
              annual_target: annualTarget,
              quarterly_target: quarterlyTarget,
              quarters,
              actual_total: actualTotal,
              overall_achievement: overallAchievement,
            };
          });

          const allQ = indicatorsWithProgress.flatMap((i) => i.quarters);
          const total = allQ.length;
          const draft = allQ.filter((q) => q.status === 'draft').length;
          const rejected = allQ.filter((q) => q.status === 'rejected').length;
          const submitted = allQ.filter((q) => q.status === 'submitted').length;
          const approved = allQ.filter((q) => q.status === 'approved').length;
          const assessed = allQ.filter((q) => q.status === 'assessed').length;

          const currentQuarter = Math.floor(new Date().getMonth() / 3) + 1;
          const cur = allQ.find((q) => q.quarter === currentQuarter);
          const needsAttention = cur?.status === 'draft' || cur?.status === 'rejected';

          return {
            ...activity,
            indicators: indicatorsWithProgress,
            progressSummary: {
              total,
              draft,
              rejected,
              submitted,
              approved,
              assessed,
              completionRate: total > 0 ? Math.round((approved / total) * 100) : 0,
            },
            needsAttention,
          };
        })
      );

      setActivities(enriched);
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setError(err.message || 'Failed to load your tasks');
      toast.error('Failed to load your tasks. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ------- quarter editing actions -------
  const handleStartEdit = (activityId, indicatorId, quarter, currentValue) => {
    const key = `${activityId}_${indicatorId}_${quarter}`;
    setEditingQuarterKey(key);
    setDraftValue(currentValue == null ? '' : String(currentValue));
  };

  const handleCancelEdit = () => {
    setEditingQuarterKey(null);
    setDraftValue('');
  };

  const handleSave = async (activityId, indicatorId, quarter, quarterId) => {
    if (draftValue === '' || draftValue == null) {
      toast.error('Please enter an actual value');
      return;
    }
    const parsed = parseFloat(draftValue);
    if (isNaN(parsed) || parsed < 0) {
      toast.error('Actual value must be a non-negative number');
      return;
    }
    if (!quarterId) {
      toast.error('Progress record not found — try refreshing');
      return;
    }

    setSavingQuarterId(quarterId);
    try {
      await mainApi.updateQuarterlyProgress(quarterId, { actual_value: parsed });
      toast.success('Saved and submitted for review');
      setEditingQuarterKey(null);
      setDraftValue('');
      await fetchMyTasks();
    } catch (err) {
      console.error('Error saving actual:', err);
      toast.error(extractApiError(err, 'Failed to save actual value'));
    } finally {
      setSavingQuarterId(null);
    }
  };

  // ------- location -------
  const handleLocationFieldChange = (partial) => {
    setLocationForm((prev) => ({ ...prev, ...partial }));
  };

  const handleSaveLocation = async (activityId) => {
    setSavingLocation(true);
    try {
      await mainApi.updateActivityLocation(activityId, {
        latitude: locationForm.latitude || null,
        longitude: locationForm.longitude || null,
        location_address: locationForm.address || '',
        location_description: locationForm.description || '',
      });
      toast.success('Location saved successfully');
      await fetchMyTasks();
    } catch (err) {
      console.error('Error saving location:', err);
      toast.error(extractApiError(err, 'Failed to save location'));
    } finally {
      setSavingLocation(false);
    }
  };

  // ------- filtering -------
  const filteredActivities = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return activities.filter((activity) => {
      const matchesSearch = !term || activity.title?.toLowerCase().includes(term);
      const s = activity.progressSummary;
      const matchesFilter =
        filterStatus === 'all' ||
        (filterStatus === 'pending' && (s.draft > 0 || s.rejected > 0)) ||
        (filterStatus === 'in_progress' && s.submitted > 0) ||
        (filterStatus === 'completed' && s.approved + s.assessed === s.total && s.total > 0);
      return matchesSearch && matchesFilter;
    });
  }, [activities, searchTerm, filterStatus]);

  // ------- access gate -------
  if (!isDeliveryOfficer) {
    return (
      <div className={`${card} ${cardPad} text-center`}>
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">
          This page is only accessible to Delivery Officers.
        </p>
      </div>
    );
  }

  // ------- loading / error / empty -------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto mb-4" />
          <p className="text-gray-500">Loading your tasks…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`${card} ${cardPad} text-center`}>
        <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Error loading tasks</h3>
        <p className="text-sm text-gray-500 mb-4">{error}</p>
        <button onClick={fetchMyTasks} className={btn.primary}>
          Try again
        </button>
      </div>
    );
  }

  const header = (
    <div className={`${card} ${cardPad}`}>
      <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
        <div className="min-w-0">
          <h1 className="text-lg sm:text-xl font-bold text-gray-900">My Tasks</h1>
          <p className="text-xs text-gray-500 mt-0.5 truncate">
            Activities assigned to {assignedEntityName}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <ViewModeToggle value={viewMode} onChange={setViewMode} />
          <button
            onClick={fetchMyTasks}
            className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2 text-[11px] text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
        {assignedDepartment ? (
          <Building2 className="w-3.5 h-3.5" />
        ) : (
          <Briefcase className="w-3.5 h-3.5" />
        )}
        <span>
          Assigned to <span className="font-semibold text-gray-800">{assignedEntityName}</span>
        </span>
        <span className="ml-auto text-emerald-700 font-semibold">
          {activities.length} activit{activities.length === 1 ? 'y' : 'ies'}
        </span>
      </div>
    </div>
  );

  if (activities.length === 0) {
    return (
      <div className="space-y-4">
        {header}
        <div className={`${card} ${cardPad} text-center`}>
          <CheckCircle2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">No tasks assigned</h3>
          <p className="text-sm text-gray-500">
            You don't have any activities assigned to {assignedEntityName} at the moment.
          </p>
        </div>
      </div>
    );
  }

  // ------- main render -------
  return (
    <div className="space-y-4">
      {header}

      <KpiStrip activities={activities} />

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search tasks by title…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBase} pl-9`}
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className={`${inputBase} sm:w-52`}
        >
          <option value="all">All tasks</option>
          <option value="pending">Pending update</option>
          <option value="in_progress">Under review</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {/* Task cards */}
      <div className="space-y-3">
        {filteredActivities.length === 0 ? (
          <div className={`${card} ${cardPad} text-center`}>
            <Search className="w-10 h-10 text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-500">No tasks match your filters.</p>
          </div>
        ) : (
          filteredActivities.map((activity) => (
            <ActivityCard
              key={activity.id}
              activity={activity}
              viewMode={viewMode}
              isOpen={expandedActivityId === activity.id}
              onToggleOpen={() =>
                setExpandedActivityId(
                  expandedActivityId === activity.id ? null : activity.id
                )
              }
              editingQuarterKey={editingQuarterKey}
              draftValue={draftValue}
              savingQuarterId={savingQuarterId}
              onStartEdit={handleStartEdit}
              onCancelEdit={handleCancelEdit}
              onDraftChange={setDraftValue}
              onSave={handleSave}
              locationForm={locationForm}
              onLocationFieldChange={handleLocationFieldChange}
              onSaveLocation={() => handleSaveLocation(activity.id)}
              savingLocation={savingLocation}
              images={activityImages[activity.id] || []}
              onImagesChange={(imgs) =>
                setActivityImages((prev) => ({ ...prev, [activity.id]: imgs }))
              }
              onViewDetails={() => navigate(`/dashboard/activities/${activity.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
};

export default MyTasks;