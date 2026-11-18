// src/components/Management/PriorityAreaManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, RefreshCw, Target, AlertCircle,
  Save, X, Star, Layers, Filter, Shield,
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
  name: '', code: '', description: '',
  is_primary_for_ministry: false, order: 0,
});

const PriorityAreaManagement = () => {
  const { userRole, user } = useAuth();
  const isAdmin = userRole === 'project_admin' || user?.is_superuser || userRole === 'super_admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterPrimary, setFilterPrimary] = useState('all');

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchItems(); }, []);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const data = await mainApi.getPublicPriorityAreas();
      setItems((data || []).slice().sort((a, b) => (a.order ?? 0) - (b.order ?? 0)));
    } catch (err) {
      console.error(err);
      toast.error('Failed to load priority areas');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchSearch =
        !term ||
        p.name?.toLowerCase().includes(term) ||
        p.code?.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term);
      const matchFilter =
        filterPrimary === 'all' ||
        (filterPrimary === 'primary' && p.is_primary_for_ministry) ||
        (filterPrimary === 'secondary' && !p.is_primary_for_ministry);
      return matchSearch && matchFilter;
    });
  }, [items, search, filterPrimary]);

  const kpi = useMemo(() => {
    const primary = items.filter((p) => p.is_primary_for_ministry).length;
    return { total: items.length, primary, secondary: items.length - primary };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyForm(), order: items.length });
    setShowModal(true);
  };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name || '',
      code: p.code || '',
      description: p.description || '',
      is_primary_for_ministry: !!p.is_primary_for_ministry,
      order: p.order ?? 0,
    });
    setShowModal(true);
  };
  const closeModal = () => {
    if (saving) return;
    setShowModal(false);
    setEditing(null);
    setForm(emptyForm());
  };
  const setField = (k, v) => setForm((prev) => ({ ...prev, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Priority area name is required');

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
      is_primary_for_ministry: !!form.is_primary_for_ministry,
      order: parseInt(form.order, 10) || 0,
    };

    setSaving(true);
    try {
      if (editing) {
        await mainApi.updatePriorityArea(editing.id, payload);
        toast.success('Priority area updated');
      } else {
        await mainApi.createPriorityArea(payload);
        toast.success('Priority area created');
      }
      closeModal();
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to save priority area'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mainApi.deletePriorityArea(deleteTarget.id);
      toast.success('Priority area deleted');
      setDeleteTarget(null);
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to delete priority area'));
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
      {!isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <Shield className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-900">View-only</p>
            <p className="text-xs text-amber-800 mt-0.5">
              You can browse priority areas but only Project Administrators can edit them.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-teal-600 to-emerald-600 p-2 rounded-xl shadow-sm">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">Federal Priority Areas</h1>
              <p className="text-xs text-gray-500 mt-0.5">
                The 8 FG priority areas, and which 3 the Ministry tracks directly
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchItems}
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
                <Plus className="w-4 h-4" /> New priority area
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={Target} label="Total" value={kpi.total} tone="bg-teal-50 text-teal-700" />
        <Kpi icon={Star} label="Ministry focus" value={kpi.primary} tone="bg-amber-50 text-amber-700" />
        <Kpi icon={Layers} label="Secondary" value={kpi.secondary} tone="bg-gray-100 text-gray-700" />
      </div>

      {/* Search + filter */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search priority areas…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="relative sm:w-56">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <select
            value={filterPrimary}
            onChange={(e) => setFilterPrimary(e.target.value)}
            className={`${inputCls} pl-9 cursor-pointer`}
          >
            <option value="all">All priority areas</option>
            <option value="primary">Ministry focus only</option>
            <option value="secondary">Secondary only</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <EmptyState hasSearch={!!search || filterPrimary !== 'all'} onCreate={isAdmin ? openCreate : null} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((p) => (
            <PriorityAreaCard
              key={p.id}
              area={p}
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
                <Target className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">
                  {editing ? 'Edit priority area' : 'New priority area'}
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
              <Field label="Name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Boost Agriculture to Achieve Food Security"
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Code" hint="optional">
                  <input
                    type="text"
                    value={form.code}
                    onChange={(e) => setField('code', e.target.value)}
                    className={inputCls}
                    placeholder="e.g. PA-01"
                  />
                </Field>
                <Field label="Order" hint="lower = first">
                  <input
                    type="number"
                    value={form.order}
                    onChange={(e) => setField('order', e.target.value)}
                    className={inputCls}
                  />
                </Field>
              </div>
              <Field label="Description" hint="optional">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="What this priority area covers…"
                />
              </Field>
              <Field label="Ministry focus">
                <label className="flex items-start gap-2 p-3 rounded-xl border border-gray-200 cursor-pointer hover:bg-gray-50 transition">
                  <input
                    type="checkbox"
                    checked={form.is_primary_for_ministry}
                    onChange={(e) => setField('is_primary_for_ministry', e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-teal-600"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      This is a primary focus area for the Ministry
                    </p>
                    <p className="text-xs text-gray-500">
                      The Ministry tracks 3 of the 8 federal priority areas directly.
                    </p>
                  </div>
                </label>
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
          warning="Deliverables and indicators linked to this priority area may also be affected."
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

const PriorityAreaCard = ({ area, isAdmin, onEdit, onDelete }) => {
  const isPrimary = !!area.is_primary_for_ministry;
  return (
    <div
      className={`group bg-white rounded-2xl border overflow-hidden hover:shadow-md transition-all ${
        isPrimary ? 'border-teal-200' : 'border-gray-200'
      }`}
    >
      {/* Colored header */}
      <div
        className={`relative px-4 py-3 ${
          isPrimary
            ? 'bg-gradient-to-r from-teal-600 to-emerald-600'
            : 'bg-gradient-to-r from-slate-600 to-slate-700'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="bg-white/20 backdrop-blur p-1.5 rounded-lg">
            <Target className="w-4 h-4 text-white" />
          </div>
          {isAdmin && (
            <div className="flex gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
              <button
                onClick={() => onEdit(area)}
                className="p-1 rounded bg-white/20 hover:bg-white/30 text-white transition"
                title="Edit"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onDelete(area)}
                className="p-1 rounded bg-white/20 hover:bg-red-500/80 text-white transition"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
        {isPrimary && (
          <div className="absolute bottom-2 right-3">
            <Star className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
          </div>
        )}
      </div>

      {/* Body */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 line-clamp-2">{area.name}</h3>
        {area.code && (
          <p className="text-[11px] text-gray-500 font-mono mt-1">{area.code}</p>
        )}
        {area.description && (
          <p className="text-xs text-gray-600 mt-2 line-clamp-2">{area.description}</p>
        )}
        <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400">Order #{area.order ?? 0}</span>
          {isPrimary ? (
            <span className="text-[10px] font-semibold bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">
              Ministry focus
            </span>
          ) : (
            <span className="text-[10px] text-gray-400">Secondary</span>
          )}
        </div>
      </div>
    </div>
  );
};

const EmptyState = ({ hasSearch, onCreate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
    <Target className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <h3 className="text-base font-medium text-gray-900 mb-1">
      {hasSearch ? 'No priority areas match' : 'No priority areas yet'}
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      {hasSearch ? 'Try clearing filters or a different search term.' : 'Add the 8 federal priority areas to get started.'}
    </p>
    {!hasSearch && onCreate && (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> New priority area
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
          <h3 className="text-base font-bold text-gray-900">Delete this priority area?</h3>
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

export default PriorityAreaManagement;