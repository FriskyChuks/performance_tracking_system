import React from 'react';
import { Send, Lock, AlertTriangle } from 'lucide-react';
import { badgeBase, statusStyles, quarterTone, inputBase, btn } from './tokens';

const formatNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

const QuarterCard = ({
  quarter, target, unit, isEditing, draftValue, isSaving, canEdit,
  onStartEdit, onCancelEdit, onDraftChange, onSave,
}) => {
  const tone = quarterTone(quarter.status);
  const badge = statusStyles[quarter.status] || statusStyles.draft;
  const pct = Math.min(Math.max(parseFloat(quarter.cumulative_percentage) || 0, 0), 100);

  const showRejectionBanner =
    !!quarter.rejection_reason &&
    (quarter.status === 'draft' || quarter.status === 'rejected');

  return (
    <div className={`relative rounded-2xl border p-3 flex flex-col gap-2 transition ${tone} ${isEditing ? 'ring-2 ring-teal-400/60' : ''}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-gray-800">
          Q{quarter.quarter}
          <span className="ml-1 text-gray-400 font-normal">{quarter.year}</span>
        </span>
        <span className={`${badgeBase} ${badge.cls}`}>{badge.label}</span>
      </div>

      {showRejectionBanner && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-2 py-1.5">
          <div className="flex items-start gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-600 mt-0.5 shrink-0" />
            <div className="text-[11px] text-red-800 leading-snug">
              <p className="font-semibold">
                Rejected
                {quarter.rejected_by_name ? ` by ${quarter.rejected_by_name}` : ''}
                {quarter.rejection_category && (
                  <> · <span className="capitalize">{quarter.rejection_category.replace('_', ' ')}</span></>
                )}
              </p>
              {quarter.rejection_reason && (
                <p className="mt-0.5 italic">"{quarter.rejection_reason}"</p>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Target <span className="font-semibold text-gray-800">{formatNum(target)}</span> {unit}
      </div>

      {isEditing ? (
        <div className="space-y-2">
          <input
            type="number"
            inputMode="decimal"
            step="0.01"
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            className={inputBase}
            placeholder="Enter actual"
            autoFocus
          />
          <div className="flex gap-2">
            <button type="button" onClick={onSave} disabled={isSaving} className={`${btn.primary} flex-1`}>
              {isSaving ? (
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              ) : (
                <><Send className="w-4 h-4" /> Save &amp; Submit</>
              )}
            </button>
            <button type="button" onClick={onCancelEdit} className={btn.subtle}>Cancel</button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold text-gray-900">{formatNum(quarter.actual_value)}</span>
            <span className="text-xs text-gray-500">{unit}</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${
                quarter.status === 'approved' || quarter.status === 'assessed' ? 'bg-emerald-500'
                : quarter.status === 'submitted' ? 'bg-blue-500'
                : 'bg-teal-500'
              }`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <div className="text-[11px] text-gray-500">{pct.toFixed(1)}% of target</div>

          {canEdit ? (
            <button
              type="button"
              onClick={onStartEdit}
              className="mt-1 text-xs font-semibold text-teal-700 hover:text-teal-800"
            >
              {quarter.actual_value == null ? 'Add actual' : 'Update actual'}
            </button>
          ) : (
            <div className="mt-1 inline-flex items-center gap-1 text-[11px] text-gray-400">
              <Lock className="w-3 h-3" /> Locked
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default QuarterCard;