// src/components/Dashboard/PendingApprovals.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock, CheckCircle, XCircle, Eye, Search, RefreshCw, Award,
  Target, Building2, MessageSquare, ThumbsDown, ChevronDown,
  AlertTriangle, TrendingUp,
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import RejectionModal from './MyTasks/RejectionModal';
import { card, cardPad, inputBase, btn, badgeBase, sectionLabel } from './MyTasks/tokens';

const fmt = (v, d = 1) => {
  const n = parseFloat(v);
  return isNaN(n) ? '0' : n.toFixed(d);
};
const pct = (v) => Math.min(Math.max(parseFloat(v) || 0, 0), 100);

const extractApiError = (err, fallback = 'Something went wrong') => {
  const data = err?.response?.data;
  if (!data) return err?.message || fallback;
  if (typeof data === 'string') return data;
  if (data.detail) return data.detail;
  const parts = [];
  Object.entries(data).forEach(([f, v]) => {
    if (Array.isArray(v)) parts.push(`${f}: ${v.join(' ')}`);
    else if (typeof v === 'string') parts.push(`${f}: ${v}`);
  });
  return parts.length ? parts.join(' | ') : fallback;
};

const STATUS_META = {
  submitted: { label: 'Pending Review', cls: 'bg-amber-100 text-amber-800', ring: 'border-amber-200' },
  approved:  { label: 'Approved',       cls: 'bg-emerald-100 text-emerald-700', ring: 'border-emerald-200' },
  rejected:  { label: 'Rejected',       cls: 'bg-red-100 text-red-700',         ring: 'border-red-200' },
  assessed:  { label: 'Assessed',       cls: 'bg-purple-100 text-purple-700',   ring: 'border-purple-200' },
};

const PendingApprovals = () => {
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const isDirector = userRole === 'director';

  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [processing, setProcessing] = useState(false);

  const [rejectTarget, setRejectTarget] = useState(null);
  const [isRejecting, setIsRejecting] = useState(false);

  useEffect(() => {
    if (isDirector) fetchPending();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirector]);

  const fetchPending = async () => {
    setLoading(true);
    try {
      const data = await mainApi.getPendingApprovals();
      const arr = Array.isArray(data) ? data : data?.results || [];
      setSubmissions(arr);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load pending approvals');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (submission) => {
    setProcessing(true);
    try {
      await mainApi.approveProgress(submission.id, 'approved');
      toast.success(`Q${submission.quarter} ${submission.year} approved`);
      await fetchPending();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to approve'));
    } finally {
      setProcessing(false);
    }
  };

  const openReject = (submission) => {
    setRejectTarget({
      id: submission.id,
      activityTitle: submission.activity_title || submission.initiative_title,
      indicatorName: submission.indicator_name,
      quarter: submission.quarter,
      year: submission.year,
    });
  };

  const handleConfirmReject = async ({ category, reason }) => {
    if (!rejectTarget) return;
    setIsRejecting(true);
    try {
      await mainApi.approveProgress(rejectTarget.id, 'rejected', {
        rejection_category: category,
        rejection_reason: reason || '',
      });
      toast.success('Rejected. Delivery Officer can revise and resubmit.');
      setRejectTarget(null);
      await fetchPending();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to reject'));
    } finally {
      setIsRejecting(false);
    }
  };

  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return submissions.filter((s) => {
      const hay = [
        s.activity_title, s.indicator_name, s.department_name, s.agency_name,
      ].join(' ').toLowerCase();
      const matchesSearch = !term || hay.includes(term);
      const matchesFilter = filterType === 'all' || s.status === filterType;
      return matchesSearch && matchesFilter;
    });
  }, [submissions, searchTerm, filterType]);

  const totals = useMemo(
    () => ({
      total: submissions.length,
      pending: submissions.filter((s) => s.status === 'submitted').length,
      approved: submissions.filter((s) => s.status === 'approved').length,
      rejected: submissions.filter((s) => s.status === 'rejected').length,
    }),
    [submissions]
  );

  if (!isDirector) {
    return (
      <div className={`${card} ${cardPad} text-center`}>
        <AlertTriangle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">This page is only accessible to Directors.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className={`${card} ${cardPad}`}>
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Quarterly progress reports awaiting your review
            </p>
          </div>
          <button
            onClick={fetchPending}
            className="p-2.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded-xl transition"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI strip */}
      {totals.total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Total', value: totals.total, Icon: TrendingUp, cls: 'bg-gray-50 text-gray-700' },
            { label: 'Pending', value: totals.pending, Icon: Clock, cls: 'bg-amber-50 text-amber-700' },
            { label: 'Approved', value: totals.approved, Icon: CheckCircle, cls: 'bg-emerald-50 text-emerald-700' },
            { label: 'Rejected', value: totals.rejected, Icon: XCircle, cls: 'bg-red-50 text-red-700' },
          ].map(({ label, value, Icon, cls }) => (
            <div key={label} className={`${card} ${cardPad} flex items-center gap-3`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${cls}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Search/filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search by activity, indicator, department…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={`${inputBase} pl-9`}
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className={`${inputBase} sm:w-52`}
        >
          <option value="all">All submissions</option>
          <option value="submitted">Pending review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="assessed">Assessed</option>
        </select>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className={`${card} ${cardPad} text-center`}>
          <CheckCircle className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-medium text-gray-900 mb-1">Nothing to review</h3>
          <p className="text-sm text-gray-500">
            {searchTerm ? 'No matching submissions.' : 'All quarterly reports have been reviewed.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((s) => {
            const quarterlyTarget = parseFloat(s.quarterly_target) || 0;
            const actual = parseFloat(s.actual_value) || 0;
            const achievement = quarterlyTarget > 0 ? (actual / quarterlyTarget) * 100 : 0;
            const meta = STATUS_META[s.status] || STATUS_META.submitted;
            const isOpen = expandedId === s.id;

            return (
              <div key={s.id} className={`${card} overflow-hidden border ${meta.ring}`}>
                <button
                  type="button"
                  onClick={() => setExpandedId(isOpen ? null : s.id)}
                  className="w-full text-left p-4 sm:p-5 hover:bg-gray-50 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className={`${badgeBase} ${meta.cls}`}>{meta.label}</span>
                        <span className="text-[11px] text-gray-500">
                          Q{s.quarter} {s.year}
                        </span>
                        {s.activity_code && (
                          <span className="text-[11px] text-gray-400 font-mono">#{s.activity_code}</span>
                        )}
                        {s.status === 'submitted' && (
                          <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                            ⚡ Action required
                          </span>
                        )}
                      </div>
                      <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
                        {s.activity_title || 'Unknown activity'}
                      </h3>
                      <p className="text-xs text-gray-600 mt-0.5 flex items-center gap-1 truncate">
                        <Target className="w-3 h-3 text-gray-400" />
                        {s.indicator_name || '—'}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                        <span className="text-gray-500">
                          Target{' '}
                          <span className="font-semibold text-blue-700">
                            {fmt(quarterlyTarget)} {s.unit_of_measure || ''}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Actual{' '}
                          <span className="font-semibold text-emerald-700">
                            {fmt(actual)} {s.unit_of_measure || ''}
                          </span>
                        </span>
                        <span className="text-gray-500">
                          Achievement{' '}
                          <span className="font-semibold text-gray-900">
                            {fmt(achievement)}%
                          </span>
                        </span>
                        {(s.department_name || s.agency_name) && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <Building2 className="w-3 h-3" />
                            {s.department_name || s.agency_name}
                          </span>
                        )}
                      </div>
                      <div className="mt-2 w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-emerald-500"
                          style={{ width: `${pct(achievement)}%` }}
                        />
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-gray-100 bg-gray-50/60 p-4 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-1.5 text-sm">
                        <p className={sectionLabel}>Quarter details</p>
                        <div className="flex justify-between"><span className="text-gray-500">Period</span><span className="font-medium">Q{s.quarter} {s.year}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Quarterly target</span><span className="font-medium">{fmt(s.quarterly_target)} {s.unit_of_measure}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Annual target</span><span className="font-medium">{fmt(s.annual_target)} {s.unit_of_measure}</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Actual</span><span className="font-medium text-emerald-700">{fmt(s.actual_value)} {s.unit_of_measure}</span></div>
                      </div>
                      <div className="bg-white rounded-xl border border-gray-200 p-3 space-y-2">
                        <p className={sectionLabel}>Gap analysis</p>
                        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500" style={{ width: `${pct(achievement)}%` }} />
                        </div>
                        <p className={`text-xs font-medium ${achievement >= 100 ? 'text-emerald-700' : 'text-red-600'}`}>
                          {achievement >= 100
                            ? `✓ Exceeded by ${fmt(achievement - 100)}%`
                            : `⚠ Shortfall of ${fmt(100 - achievement)}%`}
                        </p>
                      </div>
                    </div>

                    {s.staff_comment && (
                      <div className="bg-white rounded-xl border border-gray-200 p-3">
                        <p className={`${sectionLabel} mb-1`}>Staff comment</p>
                        <p className="text-sm text-gray-700 flex items-start gap-1.5">
                          <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                          {s.staff_comment}
                        </p>
                      </div>
                    )}

                    <div className="flex flex-wrap justify-end gap-2 pt-1">
                      <button
                        onClick={() => {
                          const activityId = s.activity_id || s.activity;
                          if (activityId) navigate(`/dashboard/activities/${activityId}`);
                          else toast.error('Missing activity id');
                        }}
                        className={btn.subtle}
                      >
                        <Eye className="w-4 h-4" /> View full activity
                      </button>
                      {s.status === 'submitted' && (
                        <>
                          <button
                            onClick={() => openReject(s)}
                            disabled={processing}
                            className={`${btn.subtle} !text-red-700 hover:!bg-red-50`}
                          >
                            <ThumbsDown className="w-4 h-4" /> Reject
                          </button>
                          <button
                            onClick={() => handleApprove(s)}
                            disabled={processing}
                            className={`${btn.primary} !bg-emerald-600 hover:!bg-emerald-700`}
                          >
                            <CheckCircle className="w-4 h-4" /> Approve
                          </button>
                        </>
                      )}
                      {s.status === 'assessed' && (
                        <span className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-purple-100 text-purple-700 text-sm font-semibold">
                          <Award className="w-4 h-4" /> Assessed
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <RejectionModal
        open={!!rejectTarget}
        onClose={() => !isRejecting && setRejectTarget(null)}
        onConfirm={handleConfirmReject}
        target={rejectTarget}
        submitting={isRejecting}
      />
    </div>
  );
};

export default PendingApprovals;