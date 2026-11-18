import React, { useState } from 'react';
import { ChevronDown, Target } from 'lucide-react';
import QuarterCard from './QuarterCard';
import { sectionLabel } from './tokens';

const formatNum = (v) => {
  const n = parseFloat(v);
  return isNaN(n) ? '0' : n.toLocaleString(undefined, { maximumFractionDigits: 1 });
};

const IndicatorBlock = ({
  indicator,
  activityId,
  editingQuarterKey, // `${activityId}_${indicator.id}_${quarter}`
  draftValue,
  savingQuarterId,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
}) => {
  const [open, setOpen] = useState(true);
  const unit = indicator.unit || '';
  const annual = parseFloat(indicator.annual_target) || 0;
  const achievement = Math.min(Math.max(parseFloat(indicator.overall_achievement) || 0, 0), 100);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left hover:bg-gray-50 transition"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <Target className="w-4 h-4 text-teal-600 shrink-0" />
            <h4 className="text-sm font-semibold text-gray-900 truncate">
              {indicator.name}
            </h4>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[11px] text-gray-500">
            <span>
              Annual target{' '}
              <span className="font-semibold text-gray-800">
                {formatNum(annual)} {unit}
              </span>
            </span>
            <span>
              Achievement{' '}
              <span className="font-semibold text-teal-700">{achievement.toFixed(1)}%</span>
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-gray-400 transition-transform shrink-0 ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="px-3 sm:px-4 pb-4">
          <p className={`${sectionLabel} mb-2`}>Quarterly progress</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {indicator.quarters.map((q) => {
              const key = `${activityId}_${indicator.id}_${q.quarter}`;
              const isEditing = editingQuarterKey === key;
              const canEdit = q.can_edit && q.id !== null;
              return (
                <QuarterCard
                  key={q.id ?? `q${q.quarter}`}
                  quarter={q}
                  target={q.quarterly_target}
                  unit={unit}
                  isEditing={isEditing}
                  draftValue={isEditing ? draftValue : ''}
                  isSaving={savingQuarterId === q.id}
                  canEdit={canEdit}
                  onStartEdit={() => onStartEdit(activityId, indicator.id, q.quarter, q.actual_value)}
                  onCancelEdit={onCancelEdit}
                  onDraftChange={onDraftChange}
                  onSave={() => onSave(activityId, indicator.id, q.quarter, q.id)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default IndicatorBlock;