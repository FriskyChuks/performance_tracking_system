// src/components/Dashboard/MyTasks/RejectionModal.jsx
import React, { useEffect, useRef, useState } from 'react';
import { X, ThumbsDown, MessageSquare } from 'lucide-react';
import { btn, inputBase } from './tokens';

const REJECTION_CATEGORIES = [
  { value: 'incomplete_data',    label: 'Incomplete Data',    icon: '📊', description: 'Missing required information or fields', color: 'bg-orange-100 text-orange-800 border-orange-300' },
  { value: 'inaccurate_data',    label: 'Inaccurate Data',    icon: '⚠️', description: 'Data does not match verified sources',    color: 'bg-red-100 text-red-800 border-red-300' },
  { value: 'needs_clarification',label: 'Needs Clarification',icon: '❓', description: 'Additional explanation required',         color: 'bg-blue-100 text-blue-800 border-blue-300' },
  { value: 'deadline_missed',    label: 'Deadline Missed',    icon: '⏰', description: 'Submitted after the deadline',            color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  { value: 'quality_issues',     label: 'Quality Issues',     icon: '🔍', description: 'Poor quality or unverifiable data',       color: 'bg-purple-100 text-purple-800 border-purple-300' },
  { value: 'other',              label: 'Other',              icon: '📝', description: 'Specify reason below',                    color: 'bg-gray-100 text-gray-800 border-gray-300' },
];

const RejectionModal = ({
  open,
  onClose,
  onConfirm,            // ({ category, reason }) => Promise<void> | void
  target,               // { activityTitle?, indicatorName?, quarter, year }
  submitting = false,
  initialCategory = '',
  initialReason = '',
}) => {
  const [category, setCategory] = useState(initialCategory);
  const [reason, setReason] = useState(initialReason);
  const textareaRef = useRef(null);

  // Reset on open
  useEffect(() => {
    if (open) {
      setCategory(initialCategory);
      setReason(initialReason);
    }
  }, [open, initialCategory, initialReason]);

  // Auto-focus textarea when "other" is picked
  useEffect(() => {
    if (open && category === 'other' && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [category, open]);

  if (!open) return null;

  const requiresReason = category === 'other';
  const reasonInvalid = requiresReason && !reason.trim();
  const canSubmit = !!category && !reasonInvalid && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    await onConfirm({ category, reason: reason.trim() });
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget && !submitting) onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={handleBackdrop}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-gradient-to-r from-red-600 to-rose-600 px-5 py-4 rounded-t-2xl">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="bg-white/20 p-2 rounded-lg shrink-0">
                <ThumbsDown className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base font-bold text-white">Reject Quarterly Report</h3>
                {target && (
                  <p className="text-red-100 text-xs mt-0.5 truncate">
                    {target.activityTitle}
                    {target.indicatorName ? ` · ${target.indicatorName}` : ''}
                    {target.quarter ? ` · Q${target.quarter} ${target.year ?? ''}` : ''}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="p-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-lg transition disabled:opacity-50"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          {/* Category selection */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-2">
              Rejection Category <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {REJECTION_CATEGORIES.map((cat) => {
                const active = category === cat.value;
                return (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    aria-pressed={active}
                    className={`text-left p-2.5 rounded-xl border-2 transition min-h-[56px] ${
                      active
                        ? `${cat.color} shadow-sm`
                        : 'bg-white border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg shrink-0">{cat.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{cat.label}</p>
                        <p className="text-[11px] text-gray-500 truncate">{cat.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="block text-sm font-semibold text-gray-800 mb-1">
              Detailed Reason{' '}
              {requiresReason ? (
                <span className="text-red-500">*</span>
              ) : (
                <span className="text-gray-400 font-normal">(optional)</span>
              )}
            </label>
            <textarea
              ref={textareaRef}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className={`${inputBase} resize-none ${
                requiresReason && !reason.trim() ? 'border-red-300 focus:border-red-400 focus:ring-red-200' : ''
              }`}
              placeholder={
                requiresReason
                  ? 'A detailed reason is required for "Other"…'
                  : 'Explain what needs to be fixed (optional)…'
              }
            />
            {requiresReason && !reason.trim() && (
              <p className="text-xs text-red-600 mt-1">
                Required when category is "Other".
              </p>
            )}
          </div>

          {/* Preview */}
          {category && (
            <div className="bg-amber-50 rounded-lg p-3 border border-amber-200">
              <div className="flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div className="text-xs text-amber-800">
                  <p className="font-semibold mb-0.5">The Delivery Officer will see:</p>
                  <p>
                    Category:{' '}
                    <span className="font-medium">
                      {REJECTION_CATEGORIES.find((c) => c.value === category)?.label}
                    </span>
                    {reason.trim() && (
                      <>
                        {' · '}
                        Reason: <span className="italic">"{reason.trim().slice(0, 120)}{reason.trim().length > 120 ? '…' : ''}"</span>
                      </>
                    )}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-5 py-3 flex gap-2">
          <button type="button" onClick={onClose} disabled={submitting} className={`${btn.subtle} flex-1`}>
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`${btn.primary} flex-1 !bg-red-600 hover:!bg-red-700`}
          >
            {submitting ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Processing…
              </>
            ) : (
              <>Confirm rejection</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RejectionModal;