// src/components/Layout/QuickActionsBar.jsx
import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Plus, Download, Share2, Filter, Printer, Mail, Grid3x3, List,
  TrendingUp, Target, FileText, Activity, Eye, CheckCircle, Award,
  Zap, RefreshCw,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import mainApi from '../../services/mainApi';
import reportsApi from '../../services/reportsApi';
import toast from 'react-hot-toast';

// ---------- CSV helper (self-contained, no page coupling) ----------
const downloadCSV = (rows, headers, filename) => {
  if (!rows?.length) {
    toast.error('Nothing to export');
    return;
  }
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const lines = [headers.map(esc).join(',')];
  rows.forEach((r) => lines.push(headers.map((h) => esc(r[h])).join(',')));
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  toast.success('Exported');
};

// ---------- Export dispatcher by route ----------
const exportCurrentPage = async (path) => {
  try {
    if (path.startsWith('/dashboard/reports')) {
      const year = new Date().getFullYear();
      const data = await reportsApi.getSummary(year);
      const rows = (data?.priority_areas || []).map((p) => ({
        priority_area: p.name,
        annual_target: p.annual_target,
        annual_actual: p.annual_actual,
        achievement_pct: p.achievement_pct,
        deliverables: p.deliverables_count,
        indicators: p.indicators_count,
      }));
      downloadCSV(rows, ['priority_area', 'annual_target', 'annual_actual', 'achievement_pct', 'deliverables', 'indicators'], `reports_summary_${year}`);
      return;
    }

    if (path.startsWith('/dashboard/activities')) {
      const data = await mainApi.getPublicActivities();
      const rows = (data?.results || data || []).map((a) => ({
        title: a.title,
        code: a.code || '',
        type: a.activity_type,
        status: a.status,
        department: a.department_name || '',
        agency: a.agency_name || '',
        start_date: a.start_date,
        end_date: a.end_date || '',
        performance: a.overall_performance ?? '',
      }));
      downloadCSV(rows, ['title', 'code', 'type', 'status', 'department', 'agency', 'start_date', 'end_date', 'performance'], 'activities');
      return;
    }

    if (path.startsWith('/dashboard/indicators')) {
      const data = await mainApi.getPublicIndicators();
      const rows = (data || []).map((i) => ({
        name: i.name,
        measurement_type: i.measurement_type,
        unit: i.unit || '',
        baseline_value: i.baseline_value ?? '',
        baseline_year: i.baseline_year ?? '',
        target_value: i.target_value,
        target_year: i.target_year,
        is_cumulative: i.is_cumulative,
      }));
      downloadCSV(rows, ['name', 'measurement_type', 'unit', 'baseline_value', 'baseline_year', 'target_value', 'target_year', 'is_cumulative'], 'indicators');
      return;
    }

    if (path.startsWith('/dashboard/departments')) {
      const data = await mainApi.getPublicDepartments();
      const rows = (data || []).map((d) => ({ name: d.name, code: d.code || '', description: d.description || '' }));
      downloadCSV(rows, ['name', 'code', 'description'], 'departments');
      return;
    }

    if (path.startsWith('/dashboard/agencies')) {
      const data = await mainApi.getPublicAgencies();
      const rows = (data || []).map((a) => ({ name: a.name, code: a.code || '', website: a.website || '', description: a.description || '' }));
      downloadCSV(rows, ['name', 'code', 'website', 'description'], 'agencies');
      return;
    }

    if (path.startsWith('/dashboard/priority-areas')) {
      const data = await mainApi.getPublicPriorityAreas();
      const rows = (data || []).map((p) => ({
        name: p.name,
        code: p.code || '',
        primary_for_ministry: p.is_primary_for_ministry ? 'Yes' : 'No',
        order: p.order ?? '',
        description: p.description || '',
      }));
      downloadCSV(rows, ['name', 'code', 'primary_for_ministry', 'order', 'description'], 'priority_areas');
      return;
    }

    if (path.startsWith('/dashboard/deliverables')) {
      const data = await mainApi.getPublicDeliverables();
      const rows = (data || []).map((d) => ({
        name: d.name,
        code: d.code || '',
        priority_area: d.federal_priority_area_name || '',
        description: d.description || '',
      }));
      downloadCSV(rows, ['name', 'code', 'priority_area', 'description'], 'deliverables');
      return;
    }

    if (path.startsWith('/dashboard/pending-approvals')) {
      const data = await mainApi.getPendingApprovals();
      const rows = (data?.results || data || []).map((s) => ({
        activity: s.activity_title || '',
        indicator: s.indicator_name || '',
        quarter: `${s.quarter} ${s.year}`,
        status: s.status,
        quarterly_target: s.quarterly_target,
        actual_value: s.actual_value ?? '',
        cumulative_pct: s.cumulative_percentage ?? '',
      }));
      downloadCSV(rows, ['activity', 'indicator', 'quarter', 'status', 'quarterly_target', 'actual_value', 'cumulative_pct'], 'pending_approvals');
      return;
    }

    if (path.startsWith('/dashboard/pending-assessments')) {
      const data = await mainApi.getPendingAssessments();
      const rows = (data?.results || data || []).map((s) => ({
        activity: s.activity_title || '',
        indicator: s.indicator_name || '',
        quarter: `${s.quarter} ${s.year}`,
        status: s.status,
      }));
      downloadCSV(rows, ['activity', 'indicator', 'quarter', 'status'], 'pending_assessments');
      return;
    }

    if (path.startsWith('/dashboard/my-tasks')) {
      const data = await mainApi.getMyProgressList();
      const rows = (data?.results || data || []).map((p) => ({
        activity: p.activity_title || '',
        indicator: p.indicator_name || '',
        quarter: `${p.quarter} ${p.year}`,
        status: p.status,
        target: p.quarterly_target ?? '',
        actual: p.actual_value ?? '',
        cumulative_pct: p.cumulative_percentage ?? '',
      }));
      downloadCSV(rows, ['activity', 'indicator', 'quarter', 'status', 'target', 'actual', 'cumulative_pct'], 'my_tasks');
      return;
    }

    toast.error('Export not available for this page yet');
  } catch (err) {
    console.error('Export failed:', err);
    toast.error(err?.response?.data?.detail || 'Export failed');
  }
};

const QuickActionsBar = ({ viewMode, setViewMode, onFilter }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole } = useAuth();
  const [busy, setBusy] = useState(false);

  const roleAction = (() => {
    switch (userRole) {
      case 'project_admin':
        return { icon: Plus, label: 'New activity', onClick: () => navigate('/dashboard/activities/new') };
      case 'delivery_officer':
        return { icon: Eye, label: 'My tasks', onClick: () => navigate('/dashboard/my-tasks') };
      case 'director':
        return { icon: CheckCircle, label: 'Approvals', onClick: () => navigate('/dashboard/pending-approvals') };
      case 'sector_expert':
        return { icon: Award, label: 'Assessments', onClick: () => navigate('/dashboard/pending-assessments') };
      default:
        return null;
    }
  })();

  const runExport = async () => {
    setBusy(true);
    try {
      await exportCurrentPage(location.pathname);
    } finally {
      setBusy(false);
    }
  };

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: document.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied');
      }
    } catch (err) {
      if (err?.name !== 'AbortError') toast.error('Could not share');
    }
  };

  const emailReport = () => {
    const subject = encodeURIComponent(`Performance report — ${new Date().toLocaleDateString()}`);
    const body = encodeURIComponent(`Please find the report link below:\n\n${window.location.href}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
  };

  // ---------- Per-page config ----------
  const config = (() => {
    const path = location.pathname;

    const withRole = (actions) => (roleAction ? [roleAction, ...actions] : actions);

    if (path === '/dashboard' || path === '/dashboard/') {
      return {
        title: 'Dashboard',
        icon: TrendingUp,
        actions: withRole([
          { icon: FileText, label: 'Reports', onClick: () => navigate('/dashboard/reports') },
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Share2, label: 'Share', onClick: share },
        ]),
        filters: [],
      };
    }

    if (path.startsWith('/dashboard/activities')) {
      return {
        title: 'Activities',
        icon: Activity,
        actions: withRole([
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Printer, label: 'Print', onClick: () => window.print() },
          { icon: Share2, label: 'Share', onClick: share },
        ]),
        filters: [
          { icon: Grid3x3, label: 'Grid', active: viewMode === 'grid', onClick: () => setViewMode?.('grid') },
          { icon: List, label: 'List', active: viewMode === 'list', onClick: () => setViewMode?.('list') },
          ...(onFilter ? [{ icon: Filter, label: 'Filter', active: false, onClick: onFilter }] : []),
        ],
      };
    }

    if (path.startsWith('/dashboard/reports')) {
      return {
        title: 'Reports',
        icon: TrendingUp,
        actions: [
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Mail, label: 'Email', onClick: emailReport },
          { icon: Printer, label: 'Print', onClick: () => window.print() },
        ],
        filters: [],
      };
    }

    if (
      path.startsWith('/dashboard/departments') ||
      path.startsWith('/dashboard/agencies') ||
      path.startsWith('/dashboard/priority-areas') ||
      path.startsWith('/dashboard/deliverables') ||
      path.startsWith('/dashboard/indicators')
    ) {
      return {
        title: 'Hierarchy',
        icon: Target,
        actions: [
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Share2, label: 'Share', onClick: share },
        ],
        filters: [],
      };
    }

    if (path.startsWith('/dashboard/my-tasks')) {
      return {
        title: 'My tasks',
        icon: Eye,
        actions: [
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Share2, label: 'Share', onClick: share },
        ],
        filters: [],
      };
    }

    if (path.startsWith('/dashboard/pending-approvals')) {
      return {
        title: 'Pending approvals',
        icon: CheckCircle,
        actions: [
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Share2, label: 'Share', onClick: share },
        ],
        filters: [],
      };
    }

    if (path.startsWith('/dashboard/pending-assessments')) {
      return {
        title: 'Pending assessments',
        icon: Award,
        actions: [
          { icon: Download, label: 'Export', onClick: runExport },
          { icon: Share2, label: 'Share', onClick: share },
        ],
        filters: [],
      };
    }

    return {
      title: 'Quick actions',
      icon: Zap,
      actions: [
        ...(roleAction ? [roleAction] : []),
        { icon: Download, label: 'Export', onClick: runExport },
        { icon: Share2, label: 'Share', onClick: share },
      ],
      filters: [],
    };
  })();

  if (
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register' ||
    location.pathname === '/public'
  ) {
    return null;
  }

  const titleIcon = config.icon;

  return (
    <div className="sticky top-[73px] z-10 bg-white/90 backdrop-blur-xl border-b border-gray-200/50 shadow-sm">
      <div className="px-4 py-2 lg:px-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {/* Left — title + actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="hidden lg:flex items-center gap-2 text-sm font-medium text-gray-700">
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-emerald-50 to-green-50">
                <titleIcon className="w-4 h-4 text-emerald-700" />
              </div>
              <span>{config.title}</span>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              {config.actions.map((action, idx) => {
                const Icon = action.icon;
                const isPrimary = idx === 0 && roleAction && action === roleAction;
                const isLoading = busy && action.onClick === runExport;
                return (
                  <button
                    key={`${action.label}-${idx}`}
                    onClick={action.onClick}
                    disabled={isLoading}
                    className="group relative flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-300 hover:shadow-md disabled:opacity-60 min-h-[36px]"
                  >
                    <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {isLoading ? (
                      <RefreshCw className="w-3.5 h-3.5 relative z-10 animate-spin text-emerald-600 group-hover:text-white" />
                    ) : (
                      <Icon
                        className={`w-3.5 h-3.5 relative z-10 ${
                          isPrimary ? 'text-emerald-600' : 'text-gray-500'
                        } group-hover:text-white transition-colors`}
                      />
                    )}
                    <span
                      className={`relative z-10 ${
                        isPrimary ? 'text-emerald-600' : 'text-gray-600'
                      } group-hover:text-white transition-colors hidden sm:inline`}
                    >
                      {isLoading ? 'Exporting…' : action.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right — filters */}
          {config.filters.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="h-4 w-px bg-gray-200 hidden lg:block" />
              <div className="flex items-center gap-1">
                {config.filters.map((f, idx) => {
                  const Icon = f.icon;
                  return (
                    <button
                      key={`${f.label}-${idx}`}
                      onClick={f.onClick}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                        f.active
                          ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">{f.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
      <div className="h-0.5 bg-gradient-to-r from-emerald-500/50 via-green-500/50 to-transparent" />
    </div>
  );
};

export default QuickActionsBar;