// src/components/Management/DepartmentManagement.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Edit, Trash2, Search, RefreshCw, Building2, AlertCircle,
  Save, X, LayoutGrid, LayoutList, Users,
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

const emptyForm = () => ({ name: '', code: '', description: '' });

const DepartmentManagement = () => {
  const { userRole, user } = useAuth();
  const canManage = userRole === 'project_admin' || user?.is_superuser || userRole === 'super_admin';

  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState('grid');

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
      const data = await mainApi.getPublicDepartments();
      setItems(data || []);
    } catch (err) {
      console.error(err);
      toast.error('Failed to load departments');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter(
      (d) =>
        d.name?.toLowerCase().includes(term) ||
        d.code?.toLowerCase().includes(term) ||
        d.description?.toLowerCase().includes(term)
    );
  }, [items, search]);

  const kpi = useMemo(() => {
    const withCode = items.filter((d) => d.code).length;
    const withDesc = items.filter((d) => d.description).length;
    return { total: items.length, withCode, withDesc };
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm());
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({
      name: dept.name || '',
      code: dept.code || '',
      description: dept.description || '',
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
    if (!form.name.trim()) return toast.error('Department name is required');

    const payload = {
      name: form.name.trim(),
      code: form.code.trim(),
      description: form.description.trim(),
    };

    setSaving(true);
    try {
      if (editing) {
        await mainApi.updateDepartment(editing.id, payload);
        toast.success('Department updated');
      } else {
        await mainApi.createDepartment(payload);
        toast.success('Department created');
      }
      closeModal();
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to save department'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await mainApi.deleteDepartment(deleteTarget.id);
      toast.success('Department deleted');
      setDeleteTarget(null);
      await fetchItems();
    } catch (err) {
      console.error(err);
      toast.error(extractApiError(err, 'Failed to delete department'));
    } finally {
      setDeleting(false);
    }
  };

  if (!canManage) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
        <AlertCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-base font-medium text-gray-900 mb-1">Access Restricted</h3>
        <p className="text-sm text-gray-500">Only Project Administrators can manage departments.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-sm p-4">
        <div className="flex items-start sm:items-center justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">Departments</h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Federal Ministry of Environment departments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchItems}
              className="p-2.5 text-gray-500 hover:text-teal-600 hover:bg-teal-50 rounded-xl transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold shadow-sm transition min-h-[44px]"
            >
              <Plus className="w-4 h-4" /> New department
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Kpi icon={Building2} label="Departments" value={kpi.total} tone="bg-teal-50 text-teal-700" />
        <Kpi icon={Users} label="With code" value={kpi.withCode} tone="bg-blue-50 text-blue-700" />
        <Kpi icon={LayoutList} label="With description" value={kpi.withDesc} tone="bg-purple-50 text-purple-700" />
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search departments…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`${inputCls} pl-9`}
          />
        </div>
        <div className="inline-flex rounded-xl bg-gray-100 p-1 self-start">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" /> Grid
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'
            }`}
          >
            <LayoutList className="w-3.5 h-3.5" /> List
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600" />
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState hasSearch={!!search} onCreate={openCreate} />
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((d) => (
            <DepartmentCard key={d.id} dept={d} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
          {filtered.map((d) => (
            <DepartmentRow key={d.id} dept={d} onEdit={openEdit} onDelete={setDeleteTarget} />
          ))}
        </div>
      )}

      {showModal && (
        <Modal onClose={closeModal}>
          <form onSubmit={submit}>
            <div className="sticky top-0 z-10 bg-gradient-to-r from-teal-600 to-emerald-600 px-5 py-4 rounded-t-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-white" />
                <h2 className="text-base font-bold text-white">
                  {editing ? 'Edit department' : 'New department'}
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
              <Field label="Department name" required>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setField('name', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. Forestry"
                  autoFocus
                />
              </Field>
              <Field label="Code" hint="optional, unique">
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value)}
                  className={inputCls}
                  placeholder="e.g. FOR-001"
                />
              </Field>
              <Field label="Description" hint="optional">
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) => setField('description', e.target.value)}
                  className={`${inputCls} resize-none`}
                  placeholder="What this department is responsible for…"
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
          warning="Any activities assigned to this department may also be affected."
        />
      )}
    </div>
  );
};

// ---------- shared sub-components (copied per file to keep each self-contained) ----------
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

const EmptyState = ({ hasSearch, onCreate }) => (
  <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
    <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
    <h3 className="text-base font-medium text-gray-900 mb-1">
      {hasSearch ? 'No departments match your search' : 'No departments yet'}
    </h3>
    <p className="text-sm text-gray-500 mb-4">
      {hasSearch ? 'Try a different search term.' : 'Create the first department to get started.'}
    </p>
    {!hasSearch && (
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-sm font-semibold min-h-[44px]"
      >
        <Plus className="w-4 h-4" /> New department
      </button>
    )}
  </div>
);

const DepartmentCard = ({ dept, onEdit, onDelete }) => (
  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 hover:shadow-md transition group">
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
        <Building2 className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-semibold text-gray-900 truncate">{dept.name}</h3>
        {dept.code && (
          <p className="text-[11px] text-gray-500 font-mono mt-0.5">{dept.code}</p>
        )}
        {dept.description && (
          <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">{dept.description}</p>
        )}
      </div>
      <div className="flex items-center gap-1 shrink-0 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition">
        <button
          onClick={() => onEdit(dept)}
          className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
          title="Edit"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={() => onDelete(dept)}
          className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
          title="Delete"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  </div>
);

const DepartmentRow = ({ dept, onEdit, onDelete }) => (
  <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50/60 transition">
    <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
      <Building2 className="w-4 h-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-semibold text-gray-900 truncate">{dept.name}</p>
      <p className="text-[11px] text-gray-500">
        {dept.code ? <span className="font-mono">{dept.code}</span> : 'No code'}
        {dept.description && <> · {dept.description.slice(0, 80)}{dept.description.length > 80 ? '…' : ''}</>}
      </p>
    </div>
    <div className="flex items-center gap-1">
      <button
        onClick={() => onEdit(dept)}
        className="p-1.5 text-gray-500 hover:text-teal-700 hover:bg-teal-50 rounded-lg"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => onDelete(dept)}
        className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
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
          <h3 className="text-base font-bold text-gray-900">Delete this item?</h3>
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

export default DepartmentManagement;