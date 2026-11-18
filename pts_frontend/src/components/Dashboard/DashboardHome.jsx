// src/components/Dashboard/DashboardHome.jsx
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  TrendingUp, Target, CheckCircle2, Building2, Layers, Package,
  Eye, RefreshCw, Plus, Calendar, Landmark, Award, Activity,
  AlertTriangle, Gauge, Users,
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import reportsApi from '../../services/reportsApi';
import { useAuth } from '../../hooks/useAuth';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area,
  Legend, Line,
} from 'recharts';
import toast from 'react-hot-toast';

const COLORS = ['#10b981', '#0ea5e9', '#8b5cf6', '#f59e0b', '#ef4444', '#14b8a6'];

const fmt = (v, d = 1) => {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toFixed(d);
};

const STATUS_STYLES = {
  planning:   { label: 'Planning',   cls: 'bg-gray-100 text-gray-700' },
  ongoing:    { label: 'Ongoing',    cls: 'bg-blue-100 text-blue-700' },
  completed:  { label: 'Completed',  cls: 'bg-emerald-100 text-emerald-700' },
  on_hold:    { label: 'On Hold',    cls: 'bg-amber-100 text-amber-800' },
  cancelled:  { label: 'Cancelled',  cls: 'bg-red-100 text-red-700' },
};

const StatusBadge = ({ status }) => {
  const c = STATUS_STYLES[status] || STATUS_STYLES.planning;
  return <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${c.cls}`}>{c.label}</span>;
};

const Card = ({ title, action, children, className = '' }) => (
  <div className={`bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4 ${className}`}>
    {(title || action) && (
      <div className="flex items-center justify-between mb-3">
        {title && <h3 className="text-sm font-semibold text-gray-900">{title}</h3>}
        {action}
      </div>
    )}
    {children}
  </div>
);

const EmptyChart = ({ label = 'No data for this year' }) => (
  <div className="flex flex-col items-center justify-center text-center py-10">
    <AlertTriangle className="w-8 h-8 text-amber-300 mb-2" />
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

const KpiTile = ({ icon: Icon, label, value, suffix, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-3 min-w-0">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">
        {value}
        {suffix && <span className="text-xs text-gray-500 ml-0.5">{suffix}</span>}
      </p>
    </div>
  </div>
);

const DashboardHome = () => {
  const navigate = useNavigate();
  const { user, userRole } = useAuth();
  const isProjectAdmin   = userRole === 'project_admin';
  const isDeliveryOfficer = userRole === 'delivery_officer';
  const isSectorExpert   = userRole === 'sector_expert';
  const isDirector       = userRole === 'director';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState([new Date().getFullYear()]);

  const [summary, setSummary] = useState(null);   // reportsApi.getSummary() output
  const [recentActivities, setRecentActivities] = useState([]);
  const [counts, setCounts] = useState({
    departments: 0, agencies: 0, priorityAreas: 0, deliverables: 0, indicators: 0,
  });

  // Static counts (independent of year, fetch once)
  useEffect(() => {
    (async () => {
      try {
        const [departments, agencies, priorityAreas, deliverables, indicators] = await Promise.all([
          mainApi.getPublicDepartments(),
          mainApi.getPublicAgencies(),
          mainApi.getPublicPriorityAreas(),
          mainApi.getPublicDeliverables(),
          mainApi.getPublicIndicators(),
        ]);
        setCounts({
          departments: departments?.length || 0,
          agencies: agencies?.length || 0,
          priorityAreas: priorityAreas?.length || 0,
          deliverables: deliverables?.length || 0,
          indicators: indicators?.length || 0,
        });
      } catch (err) {
        console.error('Error fetching counts:', err);
      }
    })();
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [summaryRes, activitiesRes] = await Promise.all([
        reportsApi.getSummary(selectedYear),
        mainApi.getPublicActivities({ ordering: '-created_at' }),
      ]);

      setSummary(summaryRes);

      const allActivities = activitiesRes?.results || activitiesRes || [];
      setRecentActivities(allActivities.slice(0, 6));

      // Compute available years from activities + current year
      const years = new Set(
        allActivities
          .map((a) => (a.start_date ? new Date(a.start_date).getFullYear() : null))
          .filter(Boolean)
      );
      years.add(new Date().getFullYear());
      years.add(selectedYear);
      setAvailableYears([...years].sort((a, b) => b - a));
    } catch (err) {
      console.error('Dashboard fetch failed:', err);
      const msg =
        err?.response?.data?.detail ||
        (err?.response?.status === 401
          ? 'Session expired — please sign in again.'
          : err?.message || 'Failed to load dashboard');
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Derived chart datasets from the real summary shape
  const quarterlySeries = useMemo(() => {
    const src = summary?.quarterly_trend || [];
    return src.map((q) => ({
      quarter: q.quarter,
      actual: parseFloat(q.actual) || 0,
      target: parseFloat(q.target) || 0,
      achievement: parseFloat(q.achievement_pct) || 0,
    }));
  }, [summary]);

  const priorityChart = useMemo(() => {
    const src = (summary?.priority_areas || []).filter((p) => p.annual_target > 0);
    return src.map((p) => ({
      name: p.name.length > 26 ? p.name.slice(0, 23) + '…' : p.name,
      achievement: parseFloat(p.achievement_pct) || 0,
    }));
  }, [summary]);

  const activityMix = useMemo(() => {
    const projects = recentActivities.filter((a) => a.activity_type === 'project').length;
    const programs = recentActivities.filter((a) => a.activity_type === 'program').length;
    // fall back to all visible activities counts if needed
    const src = summary?.overall || {};
    return [
      { name: 'Projects', value: projects || 0 },
      { name: 'Programs', value: programs || 0 },
    ];
  }, [recentActivities, summary]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-24 rounded-2xl bg-gradient-to-r from-emerald-600 to-green-700 animate-pulse" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-20 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse" />
          <div className="h-64 bg-white rounded-2xl border border-gray-200 animate-pulse" />
        </div>
      </div>
    );
  }

  const overall = summary?.overall || {};
  const elapsed = summary?.elapsed_pct ?? 0;
  const achievement = parseFloat(overall.achievement_pct) || 0;
  const projected = parseFloat(overall.projected_year_end_pct) || 0;
  const statusCounts = overall.status_counts || {};

  const kpis = [
    { label: 'Departments',  value: counts.departments,  icon: Building2,  tone: 'bg-blue-50 text-blue-700' },
    { label: 'Agencies',     value: counts.agencies,     icon: Landmark,   tone: 'bg-cyan-50 text-cyan-700' },
    { label: 'Priority Areas', value: counts.priorityAreas, icon: Layers,  tone: 'bg-purple-50 text-purple-700' },
    { label: 'Deliverables', value: counts.deliverables, icon: Package,    tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Indicators',   value: counts.indicators,   icon: Target,     tone: 'bg-indigo-50 text-indigo-700' },
    { label: 'Activities',   value: summary?.overall?.activities_count ?? recentActivities.length, icon: TrendingUp, tone: 'bg-orange-50 text-orange-700' },
    { label: 'Achievement',  value: fmt(achievement), suffix: '%', icon: Gauge, tone: 'bg-emerald-50 text-emerald-700' },
    { label: 'Projected',    value: fmt(projected),   suffix: '%', icon: CheckCircle2, tone: 'bg-teal-50 text-teal-700' },
  ];

  return (
    <div className="space-y-4">
      {/* Welcome banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 p-5 text-white shadow-lg">
        <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg sm:text-xl font-bold truncate">
              Welcome back, {user?.first_name || 'User'} 👋
            </h2>
            <p className="text-emerald-100 text-xs sm:text-sm mt-0.5">
              Federal Ministry of Environment · Performance Dashboard
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[11px]">
              {userRole && (
                <span className="bg-white/20 backdrop-blur px-2 py-0.5 rounded-full capitalize">
                  {userRole.replace('_', ' ')}
                </span>
              )}
              <span className="bg-white/15 backdrop-blur px-2 py-0.5 rounded-full">
                Year {selectedYear}
              </span>
              {elapsed > 0 && (
                <span className="bg-white/15 backdrop-blur px-2 py-0.5 rounded-full">
                  {fmt(elapsed)}% of year elapsed
                </span>
              )}
            </div>
          </div>
          <button
            onClick={fetchDashboardData}
            className="bg-white/20 hover:bg-white/30 p-2 rounded-xl transition shrink-0"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="font-semibold text-amber-900">Couldn't load all dashboard data</p>
            <p className="text-amber-800 mt-0.5">{error}</p>
          </div>
        </div>
      )}

      {/* KPI grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {kpis.map((k) => (
          <KpiTile key={k.label} {...k} />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card
          title="Quarterly performance"
          className="lg:col-span-2"
          action={
            availableYears.length > 0 && (
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
                className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
              >
                {availableYears.map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            )
          }
        >
          {quarterlySeries.some((q) => q.actual > 0 || q.target > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={quarterlySeries}>
                <defs>
                  <linearGradient id="gActualDash" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" strokeWidth={2} fill="url(#gActualDash)" />
                <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No quarterly progress for this year yet" />
          )}
        </Card>

        <Card title="Activity mix (recent)">
          {activityMix.some((a) => a.value > 0) ? (
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={activityMix}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  innerRadius={45}
                  dataKey="value"
                  nameKey="name"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {activityMix.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No recent activities to summarize" />
          )}
        </Card>
      </div>

      {/* Priority areas + status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card title="Priority area achievement" className="lg:col-span-2">
          {priorityChart.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(220, priorityChart.length * 40)}>
              <BarChart data={priorityChart} layout="vertical" margin={{ left: 160, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={160} tick={{ fontSize: 10 }} interval={0} />
                <Tooltip formatter={(v) => `${fmt(v)}%`} />
                <Bar dataKey="achievement" radius={[0, 4, 4, 0]}>
                  {priorityChart.map((row, i) => (
                    <Cell key={i} fill={row.achievement >= elapsed ? '#10b981' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyChart label="No priority-area progress for this year" />
          )}
        </Card>

        <Card title="Quarter status mix">
          {Object.keys(statusCounts).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(statusCounts).map(([status, count]) => {
                const meta = STATUS_STYLES[status] || STATUS_STYLES.planning;
                return (
                  <div key={status} className="flex items-center justify-between text-sm">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${meta.cls}`}>
                      {meta.label}
                    </span>
                    <span className="font-bold text-gray-900">{count}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyChart label="No status data for this year" />
          )}
        </Card>
      </div>

      {/* Recent activities */}
      <Card
        title="Recent activities"
        action={
          <Link
            to={isSectorExpert ? '/dashboard/pending-assessments' : '/dashboard/activities'}
            className="text-emerald-700 hover:text-emerald-800 text-xs font-semibold flex items-center gap-1"
          >
            View all <Eye className="w-3.5 h-3.5" />
          </Link>
        }
      >
        {recentActivities.length === 0 ? (
          <EmptyChart label="No activities yet" />
        ) : (
          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-[11px] text-gray-500 border-b border-gray-100">
                  <th className="text-left py-2 px-2">Title</th>
                  <th className="text-left py-2 px-2 hidden md:table-cell">Type</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Performance</th>
                </tr>
              </thead>
              <tbody>
                {recentActivities.map((a) => {
                  const perf = parseFloat(a.overall_performance) || 0;
                  return (
                    <tr
                      key={a.id}
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition"
                      onClick={() => navigate(`/dashboard/activities/${a.id}`)}
                    >
                      <td className="py-2.5 px-2 text-xs text-gray-900 max-w-xs truncate">{a.title}</td>
                      <td className="py-2.5 px-2 text-xs capitalize text-gray-600 hidden md:table-cell">
                        {a.activity_type}
                      </td>
                      <td className="py-2.5 px-2">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="py-2.5 px-2">
                        {perf > 0 ? (
                          <div className="flex items-center gap-2 min-w-[110px]">
                            <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  perf >= 80 ? 'bg-emerald-500' : perf >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${Math.min(perf, 100)}%` }}
                              />
                            </div>
                            <span className="text-[11px] font-semibold text-gray-700 w-10 text-right">
                              {fmt(perf, 0)}%
                            </span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {isProjectAdmin && (
          <QuickAction
            to="/dashboard/activities/new"
            icon={Plus}
            title="New activity"
            tone="from-emerald-500 to-green-600"
          />
        )}
        {isDeliveryOfficer && (
          <QuickAction
            to="/dashboard/my-tasks"
            icon={Activity}
            title="My tasks"
            tone="from-blue-500 to-indigo-600"
          />
        )}
        {isSectorExpert && (
          <QuickAction
            to="/dashboard/pending-assessments"
            icon={Award}
            title="Assessments"
            tone="from-purple-500 to-fuchsia-600"
          />
        )}
        {isDirector && (
          <QuickAction
            to="/dashboard/pending-approvals"
            icon={CheckCircle2}
            title="Approvals"
            tone="from-amber-500 to-orange-600"
          />
        )}
        <QuickAction
          to="/dashboard/reports"
          icon={TrendingUp}
          title="Reports"
          tone="from-sky-500 to-cyan-600"
        />
      </div>
    </div>
  );
};

const QuickAction = ({ to, icon: Icon, title, tone }) => (
  <Link
    to={to}
    className="group relative overflow-hidden rounded-2xl bg-white border border-gray-200/80 shadow-sm hover:shadow-md transition p-3 flex items-center gap-3"
  >
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${tone} text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition`}>
      <Icon className="w-5 h-5" />
    </div>
    <p className="font-semibold text-gray-900 text-xs sm:text-sm">{title}</p>
  </Link>
);

export default DashboardHome;