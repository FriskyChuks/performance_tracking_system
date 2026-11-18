// src/components/Dashboard/MyTasks/ActivityCard.jsx
import React, { useState } from 'react';
import {
  ChevronDown,
  Calendar,
  TrendingUp,
  AlertCircle,
  Eye,
  MapPin,
  Image as ImageIcon,
  Target,
} from 'lucide-react';
import IndicatorBlock from './IndicatorBlock';
import LocationPicker from '../LocationPicker';
import ImageUpload from '../ImageUpload';
import { badgeBase, card, sectionLabel, btn, inputBase } from './tokens';

const Ring = ({ value }) => {
  const pct = Math.min(Math.max(value, 0), 100);
  const r = 16;
  const c = 2 * Math.PI * r;
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" className="shrink-0">
      <circle cx="20" cy="20" r={r} fill="none" stroke="#E5E7EB" strokeWidth="4" />
      <circle
        cx="20"
        cy="20"
        r={r}
        fill="none"
        stroke="#0d9488"
        strokeWidth="4"
        strokeDasharray={c}
        strokeDashoffset={c - (c * pct) / 100}
        strokeLinecap="round"
        transform="rotate(-90 20 20)"
      />
      <text
        x="20"
        y="23"
        textAnchor="middle"
        fontSize="9"
        fontWeight="700"
        fill="#0f172a"
      >
        {Math.round(pct)}%
      </text>
    </svg>
  );
};

const TabButton = ({ active, onClick, icon: Icon, children }) => (
  <button
    type="button"
    onClick={onClick}
    className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition min-h-[40px] ${
      active
        ? 'bg-white text-teal-700 shadow-sm'
        : 'text-gray-500 hover:text-gray-700'
    }`}
  >
    <Icon className="w-3.5 h-3.5" />
    {children}
  </button>
);

const ActivityCard = ({
  activity,
  viewMode,             // 'compact' | 'expanded'
  isOpen,
  onToggleOpen,
  // indicator editing props passed through
  editingQuarterKey,
  draftValue,
  savingQuarterId,
  onStartEdit,
  onCancelEdit,
  onDraftChange,
  onSave,
  // location
  locationForm,
  onLocationFieldChange, // ({ latitude?, longitude?, address?, description? }) => void
  onSaveLocation,
  savingLocation,
  // images
  images,
  onImagesChange,
  // navigation
  onViewDetails,
}) => {
  const [tab, setTab] = useState('progress');
  const typeBadge =
    activity.activity_type === 'project'
      ? { label: '📋 Project', cls: 'bg-blue-100 text-blue-700' }
      : { label: '📊 Program', cls: 'bg-purple-100 text-purple-700' };

  const activeTabs = viewMode === 'compact' ? ['progress'] : ['progress', 'location', 'images'];

  return (
    <div className={`${card} overflow-hidden`}>
      {/* Header */}
      <button
        type="button"
        onClick={onToggleOpen}
        className="w-full flex items-start gap-3 p-4 sm:p-5 text-left hover:bg-gray-50 transition"
      >
        <Ring value={activity.progressSummary.completionRate} />
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 mb-1">
            <span className={`${badgeBase} ${typeBadge.cls}`}>{typeBadge.label}</span>
            {activity.needsAttention && (
              <span className={`${badgeBase} bg-red-100 text-red-700`}>
                <AlertCircle className="w-3 h-3" /> Needs attention
              </span>
            )}
          </div>
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug line-clamp-2">
            {activity.title}
          </h3>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {new Date(activity.start_date).toLocaleDateString()}
            </span>
            <span className="flex items-center gap-1">
              <Target className="w-3 h-3" />
              {activity.indicators?.length || 0} indicator
              {activity.indicators?.length === 1 ? '' : 's'}
            </span>
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {activity.progressSummary.approved}/{activity.progressSummary.total} quarters done
            </span>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 text-gray-400 shrink-0 transition-transform mt-1 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Expanded body */}
      {isOpen && (
        <div className="border-t border-gray-100">
          {/* Tabs (only in expanded mode) */}
          {viewMode === 'expanded' && (
            <div className="px-3 sm:px-4 pt-3">
              <div className="inline-flex rounded-xl bg-gray-100 p-1">
                <TabButton active={tab === 'progress'} onClick={() => setTab('progress')} icon={Target}>
                  Progress
                </TabButton>
                <TabButton active={tab === 'location'} onClick={() => setTab('location')} icon={MapPin}>
                  Location
                </TabButton>
                <TabButton active={tab === 'images'} onClick={() => setTab('images')} icon={ImageIcon}>
                  Images
                </TabButton>
              </div>
            </div>
          )}

          <div className="p-3 sm:p-4 space-y-3">
            {(viewMode === 'compact' || tab === 'progress') && (
              <>
                {activity.indicators?.length === 0 ? (
                  <div className="text-center py-10 rounded-2xl border border-dashed border-gray-200">
                    <Target className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No indicators configured</p>
                  </div>
                ) : (
                  activity.indicators.map((ind) => (
                    <IndicatorBlock
                      key={ind.id}
                      indicator={ind}
                      activityId={activity.id}
                      editingQuarterKey={editingQuarterKey}
                      draftValue={draftValue}
                      savingQuarterId={savingQuarterId}
                      onStartEdit={onStartEdit}
                      onCancelEdit={onCancelEdit}
                      onDraftChange={onDraftChange}
                      onSave={onSave}
                    />
                  ))
                )}
              </>
            )}

            {viewMode === 'expanded' && tab === 'location' && (
              <div className="space-y-3">
                <p className={sectionLabel}>Project location</p>
                <LocationPicker
                  latitude={locationForm.latitude}
                  longitude={locationForm.longitude}
                  address={locationForm.address}
                  onLocationChange={(lat, lng) =>
                    onLocationFieldChange({ latitude: lat, longitude: lng })
                  }
                  onAddressChange={(address) => onLocationFieldChange({ address })}
                  disabled={false}
                />
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Additional directions
                  </label>
                  <textarea
                    rows="2"
                    value={locationForm.description || ''}
                    onChange={(e) => onLocationFieldChange({ description: e.target.value })}
                    className={`${inputBase} resize-none`}
                    placeholder="Landmarks, access notes…"
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={onSaveLocation}
                    disabled={savingLocation}
                    className={btn.primary}
                  >
                    {savingLocation ? (
                      <>
                        <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                        Saving…
                      </>
                    ) : (
                      <>Save location</>
                    )}
                  </button>
                </div>
              </div>
            )}

            {viewMode === 'expanded' && tab === 'images' && (
              <div className="space-y-3">
                <p className={sectionLabel}>Project images</p>
                <ImageUpload
                  activityId={activity.id}
                  images={images || []}
                  onImagesChange={onImagesChange}
                  disabled={false}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-3 sm:px-4 py-3 border-t border-gray-100 bg-gray-50/60">
            <span className="text-[11px] text-gray-500">
              {activeTabs.length} section{activeTabs.length === 1 ? '' : 's'} · {viewMode}
            </span>
            <button
              type="button"
              onClick={onViewDetails}
              className={btn.ghost}
            >
              <Eye className="w-4 h-4" /> Full details
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActivityCard;