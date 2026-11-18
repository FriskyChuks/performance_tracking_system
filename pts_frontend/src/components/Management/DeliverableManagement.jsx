// src/components/Management/DeliverableManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, RefreshCw, Package, AlertCircle,
  Save, X, Target, LayoutGrid, LayoutList, ChevronDown,
} from 'lucide-react';
import mainApi from '../../services/mainApi';
import { useAuth } from '../../hooks/useAuth';
import toast from 'react-hot-toast';

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

const inputCls =
  'w-full px-3 py-2 rounded-xl border border-gray-200 text-sm bg-white ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400';

const emptyForm = () => ({
  name: '', code: '', description: '', federal_priority_area: '',
});

const DeliverableManagement = () => {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === 'project_admin' || user?.is_superuser || userRole === 'super_admin';

  const [items, setItems] = useState([]);
  const [priorityAreas, setPriorityAreas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grouped'); // 'grouped' | 'flat'

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [del, pa] = await Promise.all([
        mainApi.getPublicDeliverables(),
        mainApi.getPublicPriorityAreas(),
      ]);
      setItems(del || []);
      setPriorityAreas(pa || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load deliverables');
    } finally {
      setLoading(false);
    }
  };

  const paMap = useMemo(() => {
    const m = {};
    priorityAreas.forEach((p) => { m[p.id] = p; });
    return m;
  }, [priorityAreas]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((d) => {
      if (!term) return true;
      return (
        d.name?.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term) ||
        (d.federal_priority_area_name || '').toLowerCase().includes(term)
      );
    });
  }, [items, search]);

  const grouped = useMemo(() => {
    const groups = {};
    filtered.forEach((d) => {
      const key = d.federal_priority_area || 0;
      if (!groups[key]) {
        groups[key] = {
          paId: key,
          paName: paMap[key]?.name || d.federal_priority_area_name || 'Unassigned',
          deliverables: [],
        };
      }
      groups[key].deliverables.push(d);
    });
    return Object.values(groups).sort((a, b) => a.paName.localeCompare(b.paName));
  }, [filtered, paMap]);

  const kpi = useMemo(() => {
    const linked = items.filter((d) => d.federal_priority_area).length;
    return { total: items.length, linked, unlinked: items.length - linked };
  }, [items]);

  const openCreate = () => { setEditing(null); setForm(emptyForm()); setShowModal(true); };
  const openEdit = (d) => {
    setEditing(d);
    setForm({
      name: d.name || '',
      code: d.code || '',
      description: d.description || '',
      federal_priority_area: d.federal_priority_area ?? '',
    });
    setShowModal(true);
  };
  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm());
  };
  const setField = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Deliverable name is required');

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      federal_priority_area: form.federal_priority_area
        ? parseInt(form.federal_priority_area, 10)
        : null,
    };

    setSaving(true);
    try {
      if (editing) {
        await mainApi.updateDeliverable(editing.id, payload);
        toast.success('Deliverable updated');
      } else {
        await mainApi.createDeliverable(payload);
        toast.success('Deliverable created');
      }
      closeModal();
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to save deliverable'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mainApi.deleteDeliverable(deleteTarget.id);
      toast.success('Deliverable deleted');
      setDeleteTarget(null);
      await fetchAll();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to delete deliverable'));
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-2 rounded-xl shadow-sm">
              <Package className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Deliverables</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                Ministry deliverables, linked to Federal Priority Areas
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchAll}
              className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            {isAdmin && (
              <button
                onClick={openCreate}
                className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition min-h-[44px]"
              >
                <Plus className="w-4 h-4" /> New deliverable
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={Package} label="Total" value={kpi.total} tone="bg-teal-50 text-teal-700" />
        <Kpi icon={Target} label="Linked to PA" value={kpi.linked} tone="bg-emerald-50 text-emerald-700" />
        <Kpi icon={LayoutList} label="Unlinked" value={kpi.unlinked} tone="bg-amber-50 text-amber-700" />
      </div>

      {/* Search + view-mode toggle */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search deliverables…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setViewMode('grouped')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grouped' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grouped
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'flat' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> Flat
          </button>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={!!search} onCreate={isAdmin ? openCreate : null} />
      ) : viewMode === 'grouped' ? (
        <div className="space-y-3">
          {grouped.map((g) => (
            <DeliverableGroup key={g.paId} group={g} isAdmin={isAdmin} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <DeliverableCard
              key={d.id}
              deliverable={d}
              paName={paMap[d.federal_priority_area]?.name || d.federal_priority_area_name}
              isAdmin={isAdmin}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      {showModal && isAdmin && (
        <Modal onClose={closeModal}>
          <form onSubmit={submit}>
            <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Package className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">
                  {editing ? 'Edit deliverable' : 'New deliverable'}
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
            <div className="p-5 space-y-4">
              <Field label="Deliverable name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Effective implementation of control measures"
                  autoFocus
                />
              </Field>
              <Field label="Federal priority area" hint="optional">
                <select
                  value={form.federal_priority_area}
                  onChange={(e) => setField('federal_priority_area', e.target.value)}
                  className={inputCls}
                >
                  <option value="">Not linked</option>
                  {priorityAreas.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </Field>
              <Field label="Code" hint="optional">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. DEL-001"
                />
              </Field>
              <Field label="Description" hint="optional">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="What this deliverable covers…"
                />
              </Field>
            </div>
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex gap-2 rounded-b-2xl">
              <button
                type="button"
                onClick={closeModal}
                disabled={saving}
                className="flex-1 inline-flex items-center justify-center px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 transition min-h-[44px] disabled:opacity-50"
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
                    <Save className="w-4 h-4" /> {editing ? 'Update' : 'Create'}
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {deleteTarget && (
        <ConfirmDelete
          name={deleteTarget.name}
          deleting={deleting}
          onCancel={() => setDeleteTarget(null)}
          onConfirm={confirmDelete}
          warning="Indicators linked to this deliverable may also be affected."
        />
      )}
    </div>
  );
};

// ---------- sub-components ----------

const Kpi = ({ icon: Icon, label, value, tone }) => (
  <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-3 flex items-center gap-3">
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="text-lg font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

const DeliverableCard = ({ deliverable, paName, isAdmin, onEdit, onDelete }) => (
  <div className="group bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-all">
    <div className="relative px-4 py-3 bg-gradient-to-r from-teal-600 to-emerald-600">
      <div className="flex items-center justify-between">
        <div className="bg-white/20 backdrop-blur p-1.5 rounded-lg">
          <Package className="w-4 h-4 text-white" />
        </div>
        {isAdmin && (
          <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
            <button
              onClick={() => onEdit(deliverable)}
              className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition"
              title="Edit"
            >
              <Edit className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onDelete(deliverable)}
              className="p-1 rounded bg-white/20 hover:bg-red-500/80 text-white transition"
              title="Delete"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
    <div className="p-4">
      <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{deliverable.name}</h3>
      {deliverable.code && (
        <p className="text-[11px] text-gray-500 font-mono mt-1">{deliverable.code}</p>
      )}
      {paName && (
        <p className="text-[11px] text-teal-700 mt-1.5 font-medium truncate">
          <Target className="w-3 h-3 inline mr-1" />{paName}
        </p>
      )}
      {deliverable.description && (
        <p className="text-xs text-gray-600 mt-2 line-clamp-2">{deliverable.description}</p>
      )}
    </div>
  </div>
);

const DeliverableGroup = ({ group, isAdmin, onEdit, onDelete }) => {
  const [open, setOpen] = useState(true);
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="flex items-center gap-2 min-w-0">
          <Target className="w-4 h-4 text-teal-600 shrink-0" />
          <h3 className="text-sm font-semibold text-gray-900 truncate">{group.paName}</h3>
          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-semibold">
            {group.deliverables.length}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="border-t border-gray-100 divide-y divide-gray-100">
          {group.deliverables.map((d) => (
            <div key={d.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50/60 transition">
              <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                <Package className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h4 className="text-sm font-semibold text-gray-900">{d.name}</h4>
                  {d.code && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-600 font-mono">
                      {d.code}
                    </span>
                  )}
                </div>
                {d.description && (
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{d.description}</p>
                )}
              </div>
              {isAdmin && (
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => onEdit(d)}
                    className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(d)}
                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const EmptyState = ({ hasSearch, onCreate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
    <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <h3 className="text-base font-medium text-gray-900 mb-1">
      {hasSearch ? 'No deliverables match your search' : 'No deliverables yet'}
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      {hasSearch ? 'Try a different search term.' : 'Add the first deliverable to get started.'}
    </p>
    {!hasSearch && onCreate && (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> New deliverable
      </button>
    )}
  </div>
);

const Modal = ({ children, onClose }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
    onClick={(e) => e.target === e.currentTarget && onClose()}
  >
    <div
      className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
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

const ConfirmDelete = ({ name, deleting, onCancel, onConfirm, warning }) => (
  <div
    className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    onClick={(e) => e.target === e.currentTarget && !deleting && onCancel()}
  >
    <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl">
      <div className="flex items-start gap-3">
        <div className="bg-red-100 text-red-600 p-2 rounded-xl shrink-0">
          <Trash2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">Delete this deliverable?</h3>
          <p className="text-sm text-gray-600 mt-1">
            <span className="font-medium">"{name}"</span> will be permanently removed.
          </p>
          {warning && <p className="text-xs text-amber-700 mt-2">{warning}</p>}
        </div>
      </div>
      <div className="mt-4 flex gap-2 justify-end">
        <button
          onClick={onCancel}
          disabled={deleting}
          className="px-4 py-2 rounded-xl bg-gray-100 text-gray-700 text-sm font-medium hover:bg-gray-200 min-h-[44px] disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={deleting}
          className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 min-h-[44px] disabled:opacity-50 inline-flex items-center gap-2"
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
  </div>
);

export default DeliverableManagement;