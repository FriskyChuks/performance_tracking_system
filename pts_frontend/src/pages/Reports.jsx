// src/pages/Reports.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  TrendingUp, Target, Building2, Landmark, AlertTriangle,
  Activity, Award, RefreshCw, FileSpreadsheet, BarChart3,
  Table as TableIcon, Filter, ChevronDown, Calendar, Layers,
} from 'lucide-react';
import reportsApi from '../services/reportsApi';
import mainApi from '../services/mainApi';
import toast from 'react-hot-toast';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Legend, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area,
  RadialBarChart, RadialBar, PolarAngleAxis,
} from 'recharts';

const COLORS = ['#10b981', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316', '#6366f1'];

const fmt = (v, d = 1) => {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toFixed(d);
};

const FLAG_LABEL = {
  behind_schedule: 'Behind schedule',
  stale_drafts: 'Stale drafts',
  pending_reviews: 'Pending reviews',
  no_actuals: 'No actuals',
  no_approved_data: 'No approved data',
};

const TABS = [
  { id: 'summary',      label: 'Summary',         icon: TrendingUp },
  { id: 'priority',     label: 'Priority Areas',  icon: Target },
  { id: 'deliverables', label: 'Deliverables',    icon: Layers },
  { id: 'departments',  label: 'Departments',     icon: Building2 },
  { id: 'agencies',     label: 'Agencies',        icon: Landmark },
  { id: 'risk',         label: 'At Risk',         icon: AlertTriangle },
  { id: 'assessments',  label: 'Assessments',     icon: Award },
];

const Reports = () => {
  const currentYear = new Date().getFullYear();
  const [activeTab, setActiveTab] = useState('summary');
  const [viewMode, setViewMode] = useState('chart');
  const [year, setYear] = useState(currentYear);
  const [showFilters, setShowFilters] = useState(false);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);

  const [priorityAreasList, setPriorityAreasList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [agenciesList, setAgenciesList] = useState([]);
  const [selectedPriorityArea, setSelectedPriorityArea] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedAgency, setSelectedAgency] = useState('');
  const [exporting, setExporting] = useState(false);

  // Load dropdown data once
  useEffect(() => {
    (async () => {
      try {
        const [pa, dept, ag] = await Promise.all([
          mainApi.getPublicPriorityAreas(),
          mainApi.getPublicDepartments(),
          mainApi.getPublicAgencies(),
        ]);
        setPriorityAreasList(pa || []);
        setDepartmentsList(dept || []);
        setAgenciesList(ag || []);
      } catch (err) {
        console.error('Dropdown load failed:', err);
      }
    })();
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        let result = null;
        switch (activeTab) {
          case 'summary':
            result = await reportsApi.getSummary(year);
            break;
          case 'priority':
            result = await reportsApi.getPriorityAreas(year);
            break;
          case 'deliverables':
            result = await reportsApi.getDeliverables(year, selectedPriorityArea);
            break;
          case 'departments':
            result = await reportsApi.getDepartments(year, selectedDepartment);
            break;
          case 'agencies':
            result = await reportsApi.getAgencies(year, selectedAgency);
            break;
          case 'risk':
            result = await reportsApi.getAtRiskActivities(year);
            break;
          case 'assessments':
            result = await reportsApi.getAssessments(year);
            break;
          default:
            result = null;
        }
        if (!cancelled) setData(result);
      } catch (err) {
        if (cancelled) return;
        const msg =
          err?.response?.data?.detail ||
          (err?.response?.status === 401
            ? 'Your session expired — please sign in again.'
            : err?.message || 'Failed to load report.');
        setError(msg);
        toast.error(msg);
        setData(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, year, selectedPriorityArea, selectedDepartment, selectedAgency]);

  const resetFilters = () => {
    setYear(currentYear);
    setSelectedPriorityArea('');
    setSelectedDepartment('');
    setSelectedAgency('');
  };

  const handleExport = () => {
    if (!data) {
      toast.error('Nothing to export');
      return;
    }
    setExporting(true);
    try {
      const rowsForExport = (() => {
        if (activeTab === 'summary') {
          return data.priority_areas?.map((p) => ({
            priority_area: p.name,
            annual_target: p.annual_target,
            annual_actual: p.annual_actual,
            achievement_pct: p.achievement_pct,
            deliverables: p.deliverables_count,
            indicators: p.indicators_count,
          })) || [];
        }
        return data.rows || [];
      })();
      if (!rowsForExport.length) {
        toast.error('No rows to export');
        return;
      }
      const headers = Object.keys(rowsForExport[0]);
      reportsApi.downloadCSV(headers, rowsForExport, `${activeTab}_${year}`);
      toast.success('Exported');
    } catch (err) {
      console.error(err);
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const kpis = useMemo(() => {
    if (activeTab === 'summary' && data?.overall) {
      const o = data.overall;
      return [
        { label: 'Achievement', value: `${fmt(o.achievement_pct)}%`, tone: 'from-emerald-50 to-emerald-100 border-emerald-200 text-emerald-700' },
        { label: 'Projected year-end', value: `${fmt(o.projected_year_end_pct)}%`, tone: 'from-sky-50 to-sky-100 border-sky-200 text-sky-700' },
        { label: 'Activities', value: o.activities_count, tone: 'from-indigo-50 to-indigo-100 border-indigo-200 text-indigo-700' },
        { label: 'Indicators', value: o.indicators_count, tone: 'from-amber-50 to-amber-100 border-amber-200 text-amber-700' },
      ];
    }
    return [];
  }, [activeTab, data]);

  // ============================================================
  // Tab renderers
  // ============================================================

  const renderSummary = () => {
    if (!data?.overall) return <EmptyState label="No summary data" />;
    const o = data.overall;
    const trend = data.quarterly_trend || [];
    const paRows = (data.priority_areas || []).filter((r) => r.annual_target > 0);

    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {kpis.map((k) => (
            <div key={k.label} className={`bg-gradient-to-br ${k.tone} rounded-xl p-3 border text-center`}>
              <p className={`text-2xl font-bold ${k.tone.split(' ').pop()}`}>{k.value}</p>
              <p className="text-xs text-gray-600 mt-0.5">{k.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card title="Achievement vs. time elapsed" className="lg:col-span-1">
            <ResponsiveContainer width="100%" height={220}>
              <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ name: 'ach', value: Math.min(o.achievement_pct, 100) }]} startAngle={90} endAngle={-270}>
                <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                <RadialBar dataKey="value" cornerRadius={20} fill="#10b981" background={{ fill: '#e5e7eb' }} />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="-mt-24 text-center">
              <p className="text-3xl font-bold text-emerald-700">{fmt(o.achievement_pct)}%</p>
              <p className="text-xs text-gray-500">Elapsed: {fmt(data.elapsed_pct)}%</p>
            </div>
          </Card>

          <Card title="Quarterly trend" className="lg:col-span-2">
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend}>
                <defs>
                  <linearGradient id="gActual" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actual" name="Actual" stroke="#10b981" fill="url(#gActual)" strokeWidth={2} />
                <Line type="monotone" dataKey="target" name="Target" stroke="#94a3b8" strokeWidth={2} dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>
        </div>

        <Card title="Priority area performance">
          {paRows.length === 0 ? (
            <EmptyState label="No priority-area data for this year" compact />
          ) : (
            <ResponsiveContainer width="100%" height={Math.max(260, paRows.length * 44)}>
              <BarChart data={paRows} layout="vertical" margin={{ left: 200, right: 24 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
                <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 10 }} interval={0} />
                <Tooltip formatter={(v) => `${fmt(v)}%`} />
                <Bar dataKey="achievement_pct" name="Achievement %" radius={[0, 4, 4, 0]}>
                  {paRows.map((row, i) => (
                    <Cell key={i} fill={row.achievement_pct >= data.elapsed_pct ? '#10b981' : '#f97316'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>
    );
  };

  const renderRowReport = (title, chartLabel, color) => {
    const rows = data?.rows || [];
    if (!rows.length) return <EmptyState label={`No ${title.toLowerCase()} data`} />;

    if (viewMode === 'chart') {
      const chartData = [...rows]
        .sort((a, b) => b.achievement_pct - a.achievement_pct)
        .map((r) => ({ name: r.name, achievement: r.achievement_pct, flags: r.flags || [] }));

      return (
        <Card title={title}>
          <ResponsiveContainer width="100%" height={Math.max(300, chartData.length * 42)}>
            <BarChart data={chartData} layout="vertical" margin={{ left: 200, right: 24 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" width={200} tick={{ fontSize: 10 }} interval={0} />
              <Tooltip formatter={(v) => `${fmt(v)}%`} />
              <Bar dataKey="achievement" name={chartLabel} radius={[0, 4, 4, 0]}>
                {chartData.map((row, i) => (
                  <Cell key={i} fill={row.achievement >= (data.elapsed_pct ?? 0) ? color : '#f97316'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="border-b">
              <th className="text-left py-3 px-3 text-xs font-semibold text-gray-600">Name</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Activities</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Indicators</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Achievement</th>
              <th className="text-center py-3 px-3 text-xs font-semibold text-gray-600">Flags</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="py-2 px-3 font-medium text-gray-900">{r.name}</td>
                <td className="py-2 px-3 text-center">{r.activities_count ?? '—'}</td>
                <td className="py-2 px-3 text-center">{r.indicators_count ?? '—'}</td>
                <td className="py-2 px-3 text-center font-semibold text-emerald-700">{fmt(r.achievement_pct)}%</td>
                <td className="py-2 px-3 text-center">
                  {(r.flags || []).map((f) => (
                    <span key={f} className="inline-block mr-1 px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[10px] font-semibold">
                      {FLAG_LABEL[f] || f}
                    </span>
                  ))}
                  {(!r.flags || r.flags.length === 0) && <span className="text-emerald-600 text-xs">On track</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderAtRisk = () => {
    const rows = data?.rows || [];
    if (!rows.length) {
      return (
        <div className="text-center py-16">
          <Award className="w-14 h-14 text-emerald-400 mx-auto mb-3" />
          <p className="text-base font-semibold text-gray-900">Nothing at risk</p>
          <p className="text-sm text-gray-500">All activities are tracking on schedule for {year}.</p>
        </div>
      );
    }
    return (
      <div className="space-y-3">
        {rows.map((r) => (
          <div key={r.id} className="rounded-xl border border-amber-200 bg-amber-50/40 p-4">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium capitalize">{r.activity_type}</span>
                  {r.flags.map((f) => (
                    <span key={f} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">
                      {FLAG_LABEL[f] || f}
                    </span>
                  ))}
                </div>
                <h4 className="font-semibold text-gray-900 text-sm">{r.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  {r.department_name || r.agency_name || 'Unassigned'}
                </p>
              </div>
              <div className="text-right shrink-0">
                <p className="text-lg font-bold text-amber-700">{fmt(r.achievement_pct)}%</p>
                <p className="text-[11px] text-gray-500">achievement</p>
              </div>
            </div>
            <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-gray-600">
              {Object.entries(r.status_counts || {}).map(([s, c]) => (
                <div key={s} className="flex justify-between bg-white rounded px-2 py-1 border border-gray-100">
                  <span className="capitalize">{s}</span>
                  <span className="font-semibold">{c}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderAssessments = () => {
    if (!data) return <EmptyState label="No assessment data" />;
    const acc = data.accuracy_breakdown || {};
    const ratings = data.rating_breakdown || {};
    const accData = Object.entries(acc).map(([k, v]) => ({ name: k, value: v }));
    const ratingData = Object.entries(ratings).map(([k, v]) => ({ rating: k, count: v }));

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card title="Data accuracy">
            {accData.length === 0 ? (
              <EmptyState label="No assessments yet" compact />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={accData} dataKey="value" nameKey="name" outerRadius={90} label>
                    {accData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card title="Expert ratings distribution">
            {ratingData.length === 0 ? (
              <EmptyState label="No ratings yet" compact />
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={ratingData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="rating" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </div>

        <Card title={`Flagged submissions (${data.totals?.flagged_count || 0})`}>
          {(data.flagged || []).length === 0 ? (
            <EmptyState label="No flagged submissions" compact />
          ) : (
            <div className="space-y-2">
              {data.flagged.map((f) => (
                <div key={f.id} className="rounded-lg border border-red-200 bg-red-50/50 p-3">
                  <p className="text-sm font-semibold text-gray-900">{f.activity_title}</p>
                  <p className="text-xs text-gray-600">{f.indicator_name} · Q{f.quarter}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {f.data_accuracy && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-red-300 text-red-700 font-semibold">
                        {f.data_accuracy.replace('_', ' ')}
                      </span>
                    )}
                    {f.effort_percentage != null && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white border border-amber-300 text-amber-700 font-semibold">
                        Effort {f.effort_percentage}%
                      </span>
                    )}
                  </div>
                  {f.expert_comment && (
                    <p className="text-xs text-gray-600 mt-1.5 italic">"{f.expert_comment}"</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    );
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600" />
        </div>
      );
    }
    if (error) {
      return (
        <div className="text-center py-16">
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900 mb-1">Couldn't load report</h3>
          <p className="text-sm text-gray-500 mb-4 max-w-md mx-auto">{error}</p>
        </div>
      );
    }
    switch (activeTab) {
      case 'summary':       return renderSummary();
      case 'priority':      return renderRowReport('Priority area performance', 'Achievement %', '#0ea5e9');
      case 'deliverables':  return renderRowReport('Deliverable performance', 'Achievement %', '#10b981');
      case 'departments':   return renderRowReport('Department performance', 'Achievement %', '#8b5cf6');
      case 'agencies':      return renderRowReport('Agency performance', 'Achievement %', '#f59e0b');
      case 'risk':          return renderAtRisk();
      case 'assessments':   return renderAssessments();
      default:              return null;
    }
  };

  const canToggleView = ['priority', 'deliverables', 'departments', 'agencies'].includes(activeTab);

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Reports & Analytics</h1>
            <p className="text-xs text-gray-500 mt-0.5">Performance reports for {year}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {canToggleView && (
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode('chart')} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'chart' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <BarChart3 className="w-4 h-4" /> Chart
                </button>
                <button onClick={() => setViewMode('table')} className={`px-3 py-1.5 text-sm flex items-center gap-1 ${viewMode === 'table' ? 'bg-emerald-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>
                  <TableIcon className="w-4 h-4" /> Table
                </button>
              </div>
            )}
            <button onClick={() => setShowFilters((v) => !v)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Filters
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
            <button onClick={resetFilters} className="px-3 py-1.5 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm flex items-center gap-1">
              <RefreshCw className="w-3.5 h-3.5" /> Reset
            </button>
            <button onClick={handleExport} disabled={exporting || loading} className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm flex items-center gap-1 disabled:opacity-50">
              <FileSpreadsheet className="w-3.5 h-3.5" /> {exporting ? 'Exporting…' : 'Export'}
            </button>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-gray-200 flex flex-wrap gap-2">
            <label className="flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value, 10))} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map((y) => (
                  <option key={y} value={y}>{y}</option>
                ))}
              </select>
            </label>
            {activeTab === 'deliverables' && (
              <select value={selectedPriorityArea} onChange={(e) => setSelectedPriorityArea(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Priority Areas</option>
                {priorityAreasList.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            )}
            {activeTab === 'departments' && (
              <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Departments</option>
                {departmentsList.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            )}
            {activeTab === 'agencies' && (
              <select value={selectedAgency} onChange={(e) => setSelectedAgency(e.target.value)} className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm bg-white">
                <option value="">All Agencies</option>
                {agenciesList.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            )}
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex overflow-x-auto border-b border-gray-200">
          {TABS.map((t) => {
            const Icon = t.icon;
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-all whitespace-nowrap ${active ? 'bg-emerald-600 text-white' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            );
          })}
        </div>

        <div className="p-4">{renderContent()}</div>
      </div>
    </div>
  );
};

// ---------- tiny presentational helpers ----------

const Card = ({ title, children, className = '' }) => (
  <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-4 ${className}`}>
    <h3 className="text-sm font-semibold text-gray-900 mb-3">{title}</h3>
    {children}
  </div>
);

const EmptyState = ({ label, compact }) => (
  <div className={`text-center ${compact ? 'py-6' : 'py-12'}`}>
    <Activity className="w-10 h-10 text-gray-300 mx-auto mb-2" />
    <p className="text-sm text-gray-500">{label}</p>
  </div>
);

export default Reports;