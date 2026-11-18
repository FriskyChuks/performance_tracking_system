import React from 'react';
import { LayoutList, PanelLeft } from 'lucide-react';

const ViewModeToggle = ({ value, onChange }) => (
  <div className="inline-flex rounded-xl bg-gray-100 p-1">
    <button
      type="button"
      onClick={() => onChange('compact')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        value === 'compact'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <LayoutList className="w-3.5 h-3.5" />
      Compact
    </button>
    <button
      type="button"
      onClick={() => onChange('expanded')}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
        value === 'expanded'
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-500 hover:text-gray-700'
      }`}
    >
      <PanelLeft className="w-3.5 h-3.5" />
      Expanded
    </button>
  </div>
);

export default ViewModeToggle;