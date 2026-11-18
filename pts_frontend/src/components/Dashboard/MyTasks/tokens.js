// Shared class strings so the look stays consistent and easy to tweak.
export const card =
  'bg-white rounded-2xl border border-gray-200/80 shadow-sm hover:shadow-md transition-shadow';

export const cardPad = 'p-4 sm:p-5';

export const sectionLabel =
  'text-[11px] font-semibold uppercase tracking-wider text-gray-500';

export const badgeBase =
  'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold';

export const statusStyles = {
  draft:     { label: 'Pending Update',     cls: 'bg-amber-100 text-amber-800' },
  rejected:  { label: 'Rejected',           cls: 'bg-red-100 text-red-700' },
  submitted: { label: 'Under Review',       cls: 'bg-blue-100 text-blue-700' },
  approved:  { label: 'Approved',           cls: 'bg-emerald-100 text-emerald-700' },
  assessed:  { label: 'Assessed',           cls: 'bg-purple-100 text-purple-700' },
};

export const quarterTone = (status) => {
  switch (status) {
    case 'submitted': return 'border-blue-300 bg-blue-50/60';
    case 'approved':  return 'border-emerald-300 bg-emerald-50/60';
    case 'assessed':  return 'border-purple-300 bg-purple-50/60';
    case 'rejected':  return 'border-red-300 bg-red-50/60';
    default:          return 'border-gray-200 bg-white';
  }
};

export const inputBase =
  'w-full px-3 py-2 rounded-xl border border-gray-200 bg-white text-sm ' +
  'focus:outline-none focus:ring-2 focus:ring-teal-500/40 focus:border-teal-400';

export const btn = {
  primary:
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-teal-600 ' +
    'text-white text-sm font-semibold hover:bg-teal-700 active:scale-[.98] transition ' +
    'disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]',
  subtle:
    'inline-flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-gray-100 ' +
    'text-gray-700 text-sm font-medium hover:bg-gray-200 transition min-h-[44px]',
  ghost:
    'inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl text-teal-700 ' +
    'text-sm font-medium hover:bg-teal-50 transition min-h-[44px]',
};