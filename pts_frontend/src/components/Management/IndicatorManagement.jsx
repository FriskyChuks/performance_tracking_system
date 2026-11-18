// src/components/Management/IndicatorManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, RefreshCw, Target, Package,
  Save, X, AlertCircle, ChevronDown, ChevronUp, Layers,
  LayoutList, LayoutGrid, Calendar, TrendingUp, AlertTriangle,
  CheckCircle2, Repeat, Hash, Percent, DollarSign, ToggleLeft,
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

const MEASUREMENT_TYPES = [
  { value: 'numeric',    label: 'Numeric',    icon: Hash,       hint: 'count, tons, sites' },
  { value: 'percentage', label: 'Percentage', icon: Percent,    hint: 'percent of total' },
  { value: 'currency',   label: 'Currency',   icon: DollarSign, hint: '₦, $' },
  { value: 'ratio',      label: 'Ratio',      icon: Target,     hint: 'e.g. 3:1' },
  { value: 'binary',     label: 'Yes / No',   icon: ToggleLeft, hint: 'achieved or not' },
];

const MEASUREMENT_META = Object.fromEntries(MEASUREMENT_TYPES.map((m) => [m.value, m]));

const fmt = (v, d = 1) => {
  const n = parseFloat(v);
  return isNaN(n) ? '—' : n.toLocaleString(undefined, { maximumFractionDigits: d });
};

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

const emptyForm = () => ({
  deliverable: '',
  name: '',
  description: '',
  measurement_type: 'numeric',
  unit: '',
  baseline_value: '',
  baseline_year: new Date().getFullYear(),
  target_value: '',
  target_year: new Date().getFullYear() + 1,
  q1_target: '',
  q2_target: '',
  q3_target: '',
  q4_target: '',
  target_boolean: true,
  is_cumulative: true,
  order: 0,
});

const IndicatorManagement = () => {
  const { userRole } = useAuth();
  const isProjectAdmin = userRole === 'project_admin';

  const [indicators, setIndicators] = useState([]);
  const [deliverablesList, setDeliverablesList] = useState([]);
  const [priorityAreasList, setPriorityAreasList] = useState([]);

  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupByDeliverable, setGroupByDeliverable] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [editingIndicator, setEditingIndicator] = useState(null);
  const [formData, setFormData] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [inds, dels, pas] = await Promise.all([
        mainApi.getPublicIndicators(),
        mainApi.getPublicDeliverables(),
        mainApi.getPublicPriorityAreas(),
      ]);
      setIndicators(inds || []);
      setDeliverablesList(dels || []);
      setPriorityAreasList(pas || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load indicators');
    } finally {
      setLoading(false);
    }
  };

  // Lookups
  const deliverableMap = useMemo(() => {
    const m = {};
    deliverablesList.forEach((d) => { m[d.id] = d; });
    return m;
  }, [deliverablesList]);

  const priorityAreaMap = useMemo(() => {
    const m = {};
    priorityAreasList.forEach((p) => { m[p.id] = p; });
    return m;
  }, [priorityAreasList]);

  const deliverableName = (id) => deliverableMap[id]?.name || 'Unknown deliverable';
  const deliverablePriorityArea = (id) => {
    const d = deliverableMap[id];
    if (!d) return null;
    return priorityAreaMap[d.federal_priority_area] || null;
  };

  // Filtering + grouping
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return indicators.filter((ind) => {
      if (!term) return true;
      return (
        ind.name?.toLowerCase().includes(term) ||
        deliverableName(ind.deliverable).toLowerCase().includes(term)
      );
    });
  }, [indicators, searchTerm, deliverableMap]);

  const grouped = useMemo(() => {
    if (!groupByDeliverable) return null;
    const groups = {};
    filtered.forEach((ind) => {
      const key = ind.deliverable;
      if (!groups[key]) {
        groups[key] = {
          deliverableId: key,
          deliverableName: deliverableName(key),
          priorityArea: deliverablePriorityArea(key),
          indicators: [],
        };
      }
      groups[key].indicators.push(ind);
    });
    return Object.values(groups).sort((a, b) =>
      a.deliverableName.localeCompare(b.deliverableName)
    );
  }, [filtered, groupByDeliverable, deliverableMap, priorityAreaMap]);

  // KPI counts
  const kpi = useMemo(() => {
    const total = indicators.length;
    const cumulative = indicators.filter((i) => i.is_cumulative).length;
    const coveredDeliverables = new Set(indicators.map((i) => i.deliverable)).size;
    const binary = indicators.filter((i) => i.measurement_type === 'binary').length;
    return { total, cumulative, periodic: total - cumulative, coveredDeliverables, binary };
  }, [indicators]);

  // ------------------ MODAL ------------------
  const openCreate = () => {
    setEditingIndicator(null);
    setFormData(emptyForm());
    setShowAdvanced(false);
    setShowModal(true);
  };

  const openEdit = (indicator) => {
    setEditingIndicator(indicator);
    setFormData({
      deliverable: indicator.deliverable,
      name: indicator.name,
      description: indicator.description || '',
      measurement_type: indicator.measurement_type || 'numeric',
      unit: indicator.unit || '',
      baseline_value: indicator.baseline_value ?? '',
      baseline_year: indicator.baseline_year ?? new Date().getFullYear(),
      target_value: indicator.target_value ?? '',
      target_year: indicator.target_year ?? new Date().getFullYear() + 1,
      q1_target: indicator.q1_target ?? '',
      q2_target: indicator.q2_target ?? '',
      q3_target: indicator.q3_target ?? '',
      q4_target: indicator.q4_target ?? '',
      target_boolean: indicator.target_boolean ?? true,
      is_cumulative: indicator.is_cumulative ?? true,
      order: indicator.order ?? 0,
    });
    setShowAdvanced(false);
    setShowModal(true);
  };

  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditingIndicator(null);
    setFormData(emptyForm());
  };

  const setField = (field, value) => setFormData((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.deliverable) return toast.error('Please select a deliverable');
    if (!formData.name.trim()) return toast.error('Please enter the indicator name');
    if (formData.target_value === '' || isNaN(parseFloat(formData.target_value))) {
      return toast.error('Please enter a valid target value');
    }
    if (parseFloat(formData.target_value) <= 0) {
      return toast.error('Target must be greater than zero');
    }

    // Build payload — send nulls for empty optional numerics
    const toNum = (v) => (v === '' || v === null || v === undefined ? null : parseFloat(v));
    const payload = {
      deliverable: formData.deliverable,
      name: formData.name.trim(),
      description: formData.description || '',
      measurement_type: formData.measurement_type,
      unit: formData.unit || '',
      baseline_value: toNum(formData.baseline_value),
      baseline_year: formData.baseline_year ? parseInt(formData.baseline_year, 10) : null,
      target_value: parseFloat(formData.target_value),
      target_year: parseInt(formData.target_year, 10),
      target_boolean: formData.measurement_type === 'binary' ? !!formData.target_boolean : true,
      is_cumulative: !!formData.is_cumulative,
      order: parseInt(formData.order, 10) || 0,
      q1_target: toNum(formData.q1_target),
      q2_target: toNum(formData.q2_target),
      q3_target: toNum(formData.q3_target),
      q4_target: toNum(formData.q4_target),
    };

    setSaving(true);
    try {
      if (editingIndicator) {
        await mainApi.updateIndicator(editingIndicator.id, payload);
        toast.success('Indicator updated');
      } else {
        await mainApi.createIndicator(payload);
        toast.success('Indicator created');
      }
      closeModal();
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to save indicator'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mainApi.deleteIndicator(deleteTarget.id);
      toast.success('Indicator deleted');
      setDeleteTarget(null);
      await fetchAll();
    } catch (err) {
      toast.error(extractApiError(err, 'Failed to delete indicator'));
    } finally {
      setDeleting(false);
    }
  };

  // Quarterly split preview
  const quarterlyPreview = useMemo(() => {
    const target = parseFloat(formData.target_value);
    if (isNaN(target) || target <= 0) return null;
    const overrides = ['q1_target', 'q2_target', 'q3_target', 'q4_target'].map((k) =>
      formData[k] === '' ? null : parseFloat(formData[k])
    );
    const auto = target / 4;
    const quarters = overrides.map((v) => (v === null || isNaN(v) ? auto : v));
    const sum = quarters.reduce((s, v) => s + v, 0);
    const diff = sum - target;
    return { quarters, sum, target, diff };
  }, [formData.target_value, formData.q1_target, formData.q2_target, formData.q3_target, formData.q4_target]);

  // ------------------ ACCESS GATE ------------------
  if (!isProjectAdmin) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">Only Project Administrators can manage indicators.</p>
      </div>
    );
  }

  // ------------------ RENDER ------------------
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Indicator Management</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Performance indicators linked to deliverables
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> New indicator
            </button>
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Kpi icon={Target}       label="Total indicators" value={kpi.total}               tone="bg-teal-50 text-teal-700" />
        <Kpi icon={Repeat}       label="Cumulative"       value={kpi.cumulative}          tone="bg-blue-50 text-blue-700" />
        <Kpi icon={Layers}       label="Deliverables"     value={kpi.coveredDeliverables} tone="bg-purple-50 text-purple-700" />
        <Kpi icon={ToggleLeft}   label="Yes / No"         value={kpi.binary}              tone="bg-amber-50 text-amber-700" />
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search indicators or deliverables…"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400"
          />
        </div>
        <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            type="button"
            onClick={() => setGroupByDeliverable(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              groupByDeliverable ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grouped
          </button>
          <button
            type="button"
            onClick={() => setGroupByDeliverable(false)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              !groupByDeliverable ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Flat
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={!!searchTerm} onCreate={openCreate} />
      ) : groupByDeliverable ? (
        <div className="space-y-4">
          {grouped.map((group) => (
            <DeliverableGroup
              key={group.deliverableId}
              group={group}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((ind) => (
            <IndicatorCard
              key={ind.id}
              indicator={ind}
              deliverableName={deliverableName(ind.deliverable)}
              priorityArea={deliverablePriorityArea(ind.deliverable)}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {/* Create / Edit modal */}
      {showModal && (
        <Modal onClose={closeModal}>
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2 min-w-0">
                <Target className="w-5 h-5 text-white shrink-0" />
                <h2 className="text-base font-bold text-white truncate">
                  {editingIndicator ? 'Edit indicator' : 'New indicator'}
                </h2>
              </div>
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-5">
              <Section label="Basics">
                <Field label="Deliverable" required>
                  <select
                    value={formData.deliverable}
                    onChange={(e) => setField('deliverable', parseInt(e.target.value, 10) || '')}
                    className={inputCls}
                  >
                    <option value="">Select deliverable…</option>
                    {deliverablesList.map((d) => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                  {formData.deliverable && (
                    <p className="mt-1 text-[11px] text-gray-500">
                      Priority area:{' '}
                      <span className="font-medium text-gray-700">
                        {deliverablePriorityArea(formData.deliverable)?.name || '—'}
                      </span>
                    </p>
                  )}
                </Field>

                <Field label="Indicator name" required>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setField('name', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. Number of erosion sites restored"
                  />
                </Field>

                <Field label="Description" hint="optional">
                  <textarea
                    rows={2}
                    value={formData.description}
                    onChange={(e) => setField('description', e.target.value)}
                    className={`${inputCls} resize-none`}
                    placeholder="What this indicator measures…"
                  />
                </Field>
              </Section>

              <Section label="Measurement">
                <Field label="Type">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {MEASUREMENT_TYPES.map((m) => {
                      const Icon = m.icon;
                      const active = formData.measurement_type === m.value;
                      return (
                        <button
                          key={m.value}
                          type="button"
                          onClick={() => setField('measurement_type', m.value)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-left transition ${
                            active
                              ? 'border-teal-500 bg-teal-50 text-teal-800'
                              : 'border-gray-200 bg-white hover:border-gray-300'
                          }`}
                        >
                          <Icon className="w-4 h-4 shrink-0" />
                          <div className="min-w-0">
                            <p className="text-xs font-semibold truncate">{m.label}</p>
                            <p className="text-[10px] text-gray-500 truncate">{m.hint}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <Field label="Unit" hint="optional">
                  <input
                    type="text"
                    value={formData.unit}
                    onChange={(e) => setField('unit', e.target.value)}
                    className={inputCls}
                    placeholder="sites, hectares, %, ₦…"
                  />
                </Field>

                {formData.measurement_type === 'binary' && (
                  <Field label="Target state">
                    <div className="flex gap-2">
                      <BinaryToggle
                        active={formData.target_boolean === true}
                        onClick={() => setField('target_boolean', true)}
                        label="Yes / Achieved"
                      />
                      <BinaryToggle
                        active={formData.target_boolean === false}
                        onClick={() => setField('target_boolean', false)}
                        label="No / Not achieved"
                      />
                    </div>
                  </Field>
                )}
              </Section>

              <Section label="Baseline & target">
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Baseline value" hint="optional">
                    <input
                      type="number"
                      step="any"
                      value={formData.baseline_value}
                      onChange={(e) => setField('baseline_value', e.target.value)}
                      className={inputCls}
                      placeholder="Starting point"
                    />
                  </Field>
                  <Field label="Baseline year" hint="optional">
                    <input
                      type="number"
                      value={formData.baseline_year}
                      onChange={(e) => setField('baseline_year', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Target value" required>
                    <input
                      type="number"
                      step="any"
                      value={formData.target_value}
                      onChange={(e) => setField('target_value', e.target.value)}
                      className={inputCls}
                      placeholder="e.g. 500"
                    />
                  </Field>
                  <Field label="Target year" required>
                    <input
                      type="number"
                      value={formData.target_year}
                      onChange={(e) => setField('target_year', e.target.value)}
                      className={inputCls}
                    />
                  </Field>
                </div>
              </Section>

              <Section
                label="Quarterly target overrides"
                hint="Leave blank to auto-split evenly across Q1–Q4"
              >
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[1, 2, 3, 4].map((q) => (
                    <Field key={q} label={`Q${q}`}>
                      <input
                        type="number"
                        step="any"
                        value={formData[`q${q}_target`]}
                        onChange={(e) => setField(`q${q}_target`, e.target.value)}
                        className={inputCls}
                        placeholder="auto"
                      />
                    </Field>
                  ))}
                </div>
                {quarterlyPreview && (
                  <div
                    className={`mt-2 text-xs rounded-lg px-3 py-2 border ${
                      Math.abs(quarterlyPreview.diff) < 0.01
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                        : 'bg-amber-50 border-amber-200 text-amber-800'
                    }`}
                  >
                    Q1–Q4 total:{' '}
                    <span className="font-semibold">{fmt(quarterlyPreview.sum)}</span>{' '}
                    / target{' '}
                    <span className="font-semibold">{fmt(quarterlyPreview.target)}</span>
                    {Math.abs(quarterlyPreview.diff) < 0.01 ? (
                      <> · <CheckCircle2 className="w-3 h-3 inline" /> matches target</>
                    ) : (
                      <> · difference {fmt(quarterlyPreview.diff)}</>
                    )}
                  </div>
                )}
              </Section>

              {/* Advanced */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowAdvanced((v) => !v)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 hover:text-gray-900"
                >
                  {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  Advanced
                </button>
                {showAdvanced && (
                  <div className="mt-3 space-y-3">
                    <Field label="Cumulative indicator">
                      <label className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                        <input
                          type="checkbox"
                          checked={formData.is_cumulative}
                          onChange={(e) => setField('is_cumulative', e.target.checked)}
                          className="mt-0.5 w-4 h-4 accent-teal-600"
                        />
                        <div>
                          <p className="text-sm font-medium text-gray-800">
                            Progress accumulates quarter over quarter
                          </p>
                          <p className="text-xs text-gray-500">
                            Example: total sites restored to date. If off, each quarter stands alone.
                          </p>
                        </div>
                      </label>
                    </Field>
                    <Field label="Display order" hint="lower = first">
                      <input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setField('order', e.target.value)}
                        className={`${inputCls} max-w-[120px]`}
                      />
                    </Field>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex gap-2 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 text-white text-sm font-semibold hover:bg-teal-700 transition min-h-[44px] disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Saving…
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    {editingIndicator ? 'Update' : 'Create'} indicator
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteTarget && (
        <Modal onClose={() => !deleting && setDeleteTarget(null)} width="max-w-md">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <div className="bg-red-100 text-red-600 p-2 rounded-xl shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-gray-900">Delete indicator?</h3>
                <p className="text-sm text-gray-600 mt-1">
                  <span className="font-medium">"{deleteTarget.name}"</span> will be
                  permanently removed. Any quarterly progress tied to it will also be
                  deleted. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="mt-4 flex gap-2 justify-end">
              <button
                onClick={() => setDeleteTarget(null)}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition min-h-[44px] disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition min-h-[44px] disabled:opacity-50 inline-flex items-center gap-2"
              >
                {deleting ? (
                  <>
                    <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                    Deleting…
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" /> Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

// ------------------ SUB-COMPONENTS ------------------

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400';

const Kpi = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-3 min-w-0">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

const EmptyState = ({ hasSearch, onCreate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <h3 className="text-base font-medium text-gray-900 mb-1">
      {hasSearch ? 'No indicators match your search' : 'No indicators yet'}
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      {hasSearch
        ? 'Try a different search term.'
        : 'Create your first indicator to start tracking performance.'}
    </p>
    {!hasSearch && (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> New indicator
      </button>
    )}
  </div>
);

const DeliverableGroup = ({ group, onEdit, onDelete }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Package className="w-4 h-4 text-teal-600 shrink-0" />
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {group.deliverableName}
            </h3>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
              {group.indicators.length} indicator{group.indicators.length === 1 ? '' : 's'}
            </span>
          </div>
          {group.priorityArea && (
            <p className="text-[11px] text-gray-500 mt-0.5">
              Priority area: {group.priorityArea.name}
            </p>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {group.indicators.map((ind) => (
            <IndicatorCard
              key={ind.id}
              indicator={ind}
              deliverableName={group.deliverableName}
              priorityArea={group.priorityArea}
              onEdit={onEdit}
              onDelete={onDelete}
              embedded
            />
          ))}
        </div>
      )}
    </div>
  );
};

const IndicatorCard = ({ indicator, deliverableName, priorityArea, onEdit, onDelete, embedded }) => {
  const meta = MEASUREMENT_META[indicator.measurement_type] || MEASUREMENT_META.numeric;
  const Icon = meta.icon;
  const targetNum = parseFloat(indicator.target_value) || 0;
  const overrides = [
    indicator.q1_target, indicator.q2_target, indicator.q3_target, indicator.q4_target,
  ].some((v) => v !== null && v !== undefined && v !== '');
  const unit = indicator.unit || '';

  return (
    <div className={`${embedded ? 'px-4 py-3' : 'bg-white rounded-2xl border border-gray-200 shadow-sm p-4'} hover:bg-gray-50/60 transition`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <h4 className="text-sm font-semibold text-gray-900 leading-snug">{indicator.name}</h4>
            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
              {meta.label}
            </span>
            {indicator.is_cumulative ? (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-700 font-semibold">Cumulative</span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">Periodic</span>
            )}
            {overrides && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">Custom Q split</span>
            )}
          </div>

          {!embedded && (
            <p className="text-[11px] text-gray-500 mb-1.5">
              {deliverableName}
              {priorityArea && <> · {priorityArea.name}</>}
            </p>
          )}

          <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px]">
            <span className="text-gray-500">
              Target{' '}
              <span className="font-semibold text-emerald-700">
                {fmt(targetNum)} {unit}
              </span>
              {indicator.target_year && (
                <span className="text-gray-400"> · {indicator.target_year}</span>
              )}
            </span>
            {indicator.baseline_value != null && (
              <span className="text-gray-500">
                Baseline{' '}
                <span className="font-semibold text-gray-700">
                  {fmt(indicator.baseline_value)} {unit}
                </span>
                {indicator.baseline_year && (
                  <span className="text-gray-400"> · {indicator.baseline_year}</span>
                )}
              </span>
            )}
            <span className="text-gray-500">
              Quarterly{' '}
              <span className="font-semibold text-gray-700">
                {overrides
                  ? [indicator.q1_target, indicator.q2_target, indicator.q3_target, indicator.q4_target]
                      .map((v) => (v != null && v !== '' ? fmt(v) : 'auto'))
                      .join(' / ')
                  : `auto-split (${fmt(targetNum / 4)} ${unit})`}
              </span>
            </span>
          </div>

          {indicator.description && (
            <p className="mt-1.5 text-xs text-gray-500 leading-snug line-clamp-2">
              {indicator.description}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={() => onEdit(indicator)}
            className="p-2 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(indicator)}
            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

const Modal = ({ children, onClose, width = 'max-w-2xl' }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className={`bg-white w-full ${width} sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  </div>
);

const Section = ({ label, hint, children }) => (
  <div className="space-y-3">
    <div className="flex items-baseline justify-between">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
        {label}
      </p>
      {hint && <p className="text-[11px] text-gray-400">{hint}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, hint, required, children }) => (
  <div>
    <label className="block text-xs font-medium text-gray-700 mb-1">
      {label}
      {required && <span className="text-red-500 ml-0.5">*</span>}
      {hint && <span className="text-gray-400 font-normal ml-1">({hint})</span>}
    </label>
    {children}
  </div>
);

const BinaryToggle = ({ active, onClick, label }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex-1 px-3 py-2 rounded-xl border text-sm font-medium transition min-h-[44px] ${
      active
        ? 'border-teal-500 bg-teal-50 text-teal-800'
        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
    }`}
  >
    {label}
  </button>
);

export default IndicatorManagement;