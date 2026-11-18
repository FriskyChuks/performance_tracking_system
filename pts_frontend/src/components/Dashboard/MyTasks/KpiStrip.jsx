import React from 'react';
import { Layers, AlertCircle, Clock, CheckCircle2, Award } from 'lucide-react';
import { card, cardPad } from './tokens';

const Kpi = ({ icon: Icon, label, value, tone }) => (
  <div className={`${card} ${cardPad} flex items-center gap-3 min-w-0`}>
    <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${tone}`}>
      <Icon className="w-4 h-4" />
    </div>
    <div className="min-w-0">
      <p className="text-[11px] text-gray-500 truncate">{label}</p>
      <p className="text-lg sm:text-xl font-bold text-gray-900 leading-tight">{value}</p>
    </div>
  </div>
);

const KpiStrip = ({ activities }) => {
  const totals = activities.reduce(
    (acc, a) => {
      acc.pending   += a.progressSummary.draft + a.progressSummary.rejected;
      acc.submitted += a.progressSummary.submitted;
      acc.approved  += a.progressSummary.approved;
      acc.assessed  += a.progressSummary.assessed;
      return acc;
    },
    { pending: 0, submitted: 0, approved: 0, assessed: 0 }
  );

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <Kpi icon={Layers}       label="Activities"    value={activities.length}      tone="bg-teal-50 text-teal-700" />
      <Kpi icon={AlertCircle}  label="Pending"       value={totals.pending}         tone="bg-amber-50 text-amber-700" />
      <Kpi icon={Clock}        label="Under review"  value={totals.submitted}       tone="bg-blue-50 text-blue-700" />
      <Kpi icon={CheckCircle2} label="Approved"      value={totals.approved}        tone="bg-emerald-50 text-emerald-700" />
      <Kpi icon={Award}        label="Assessed"      value={totals.assessed}        tone="bg-purple-50 text-purple-700" />
    </div>
  );
};

export default KpiStrip;