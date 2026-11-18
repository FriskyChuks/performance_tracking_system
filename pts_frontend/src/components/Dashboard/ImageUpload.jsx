// src/components/Dashboard/ImageUpload.jsx
import React, { useState, useRef } from 'react';
import {
  Upload,
  X,
  Image as ImageIcon,
  Star,
  Trash2,
  AlertCircle,
  Calendar,
  Save,
} from 'lucide-react';
import engagementApi from '../../services/engagementApi';
import toast from 'react-hot-toast';

const ImageUpload = ({ activityId, images, onImagesChange, disabled = false }) => {
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [selectedQuarter, setSelectedQuarter] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [pendingImages, setPendingImages] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef(null);

  const QUARTERS = [
    { value: 1, label: 'Q1 (Jan - Mar)' },
    { value: 2, label: 'Q2 (Apr - Jun)' },
    { value: 3, label: 'Q3 (Jul - Sep)' },
    { value: 4, label: 'Q4 (Oct - Dec)' },
  ];

  const YEARS = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - 2 + i
  );

  const totalCount = images.length + pendingImages.length;
  const canAddMore = totalCount < 4;
  const canSave = pendingImages.length > 0 && !!selectedQuarter && !isSaving;

  // ---------- drag & drop ----------
  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setDragActive(true);
    else if (e.type === 'dragleave') setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    handleFiles(Array.from(e.dataTransfer.files));
  };

  const handleFileSelect = (e) => {
    handleFiles(Array.from(e.target.files));
    e.target.value = ''; // allow re-selecting the same file
  };

  const handleFiles = (files) => {
    if (disabled) {
      toast.error('You do not have permission to upload images');
      return;
    }

    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) {
      toast.error('Please select image files only');
      return;
    }

    const oversized = imageFiles.filter((f) => f.size > 5 * 1024 * 1024);
    if (oversized.length > 0) {
      toast.error(
        `${oversized.length} file(s) exceed the 5MB limit: ${oversized
          .map((f) => f.name)
          .join(', ')}`
      );
      return;
    }

    if (totalCount + imageFiles.length > 4) {
      toast.error(
        `Maximum 4 images allowed. You can add ${4 - totalCount} more.`
      );
      return;
    }

    const newPending = imageFiles.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      caption: '',
      is_primary: false,
    }));

    setPendingImages((prev) => [...prev, ...newPending]);
    toast.success(`${imageFiles.length} image(s) queued. Select a quarter and click Save.`);
  };

  const removePendingImage = (index) => {
    const removed = pendingImages[index];
    if (removed?.preview) URL.revokeObjectURL(removed.preview);
    setPendingImages((prev) => prev.filter((_, i) => i !== index));
  };

  const updatePendingImageCaption = (index, caption) => {
    setPendingImages((prev) =>
      prev.map((img, i) => (i === index ? { ...img, caption } : img))
    );
  };

  const handleSaveAll = async () => {
    if (!selectedQuarter) {
      toast.error('Select a quarter before saving');
      return;
    }
    if (pendingImages.length === 0) {
      toast.error('No images to save');
      return;
    }

    setIsSaving(true);
    const failedNames = [];
    let successCount = 0;

    for (const pendingImage of pendingImages) {
      const formData = new FormData();
      formData.append('image', pendingImage.file);
      formData.append('project_activity', activityId);
      formData.append('quarter', String(selectedQuarter));
      formData.append('year', String(selectedYear));
      if (pendingImage.caption) formData.append('caption', pendingImage.caption);
      if (pendingImage.is_primary) formData.append('is_primary', 'true');

      try {
        await engagementApi.uploadImage(formData);
        successCount++;
        URL.revokeObjectURL(pendingImage.preview);
      } catch (err) {
        console.error('Upload error for', pendingImage.file.name, err);
        failedNames.push(pendingImage.file.name);
      }
    }

    if (successCount > 0) {
      toast.success(
        `${successCount} image(s) uploaded for Q${selectedQuarter} ${selectedYear}`
      );
      try {
        const fresh = await engagementApi.getActivityImages(activityId);
        onImagesChange(fresh || []);
      } catch (err) {
        console.error('Refresh images error:', err);
      }
      // Reset queue + quarter so the next batch starts clean
      setPendingImages([]);
      setSelectedQuarter('');
    }

    if (failedNames.length > 0) {
      toast.error(
        `${failedNames.length} image(s) failed: ${failedNames.join(', ')}`
      );
    }

    setIsSaving(false);
  };

  const handleDeleteImage = async (imageId) => {
    if (disabled) {
      toast.error('You do not have permission to delete images');
      return;
    }
    if (!window.confirm('Are you sure you want to delete this image?')) return;

    try {
      await engagementApi.deleteImage(imageId);
      onImagesChange(images.filter((img) => img.id !== imageId));
      toast.success('Image deleted');
    } catch (err) {
      console.error('Delete image error:', err);
      toast.error('Failed to delete image');
    }
  };

  const handleSetPrimary = async (imageId) => {
    try {
      await engagementApi.setPrimaryImage(imageId);
      onImagesChange(
        images.map((img) => ({ ...img, is_primary: img.id === imageId }))
      );
      toast.success('Primary image updated');
    } catch (err) {
      console.error('Set primary error:', err);
      const detail =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        'Failed to set primary image';
      toast.error(detail);
    }
  };

  return (
    <div className="space-y-4">
      {/* ---- Quarter / Year selection ---- */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <Calendar className="w-4 h-4 text-gray-500" />
        <span className="text-sm text-gray-600">Upload for:</span>
        <select
          value={selectedQuarter}
          onChange={(e) => setSelectedQuarter(e.target.value)}
          disabled={isSaving}
          className={`px-2 py-1 border rounded-lg text-sm bg-white ${
            pendingImages.length > 0 && !selectedQuarter
              ? 'border-amber-400 ring-2 ring-amber-100'
              : 'border-gray-300'
          }`}
        >
          <option value="">Select Quarter</option>
          {QUARTERS.map((q) => (
            <option key={q.value} value={q.value}>
              {q.label}
            </option>
          ))}
        </select>
        <select
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
          disabled={isSaving}
          className="px-2 py-1 border border-gray-300 rounded-lg text-sm bg-white"
        >
          {YEARS.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
        {selectedQuarter && (
          <span className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Uploading to Q{selectedQuarter} {selectedYear}
          </span>
        )}
      </div>

      {/* ---- Upload area ---- */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-6 text-center transition-all ${
          dragActive
            ? 'border-green-500 bg-green-50'
            : 'border-gray-300 hover:border-green-400 hover:bg-gray-50'
        } ${!canAddMore ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={uploading || !canAddMore || disabled}
        />

        <div className="flex flex-col items-center gap-2">
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600" />
              <p className="text-sm text-gray-500">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-gray-400" />
              <p className="text-sm text-gray-600">
                Drag &amp; drop images here or click to browse
              </p>
              <p className="text-xs text-gray-400">
                JPG, PNG, WEBP · Max 5MB each · Max 4 total
              </p>
              {!canAddMore && (
                <p className="text-xs text-amber-600 font-medium">
                  Maximum 4 images reached. Delete one to add another.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* ---- Pending previews ---- */}
      {pendingImages.length > 0 && (
        <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
          <h4 className="text-sm font-medium text-blue-800 mb-2">
            Pending Uploads ({pendingImages.length}) — click Save below to upload
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {pendingImages.map((img, idx) => (
              <div key={idx} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100 border-2 border-blue-300">
                  <img
                    src={img.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute top-2 left-2 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  Pending
                </div>
                <button
                  type="button"
                  onClick={() => removePendingImage(idx)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
                <input
                  type="text"
                  placeholder="Caption (optional)"
                  value={img.caption}
                  onChange={(e) => updatePendingImageCaption(idx, e.target.value)}
                  className="mt-1 w-full px-2 py-1 text-xs border border-gray-200 rounded"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Saved images ---- */}
      {images.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-gray-700 mb-3">
            Saved Images ({images.length}/4)
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {images.map((image) => (
              <div key={image.id} className="relative group">
                <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
                  <img
                    src={image.image_url || image.image}
                    alt={image.caption || 'Project image'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {image.quarter && (
                  <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                    Q{image.quarter} {image.year}
                  </div>
                )}

                {!disabled && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    {!image.is_primary && images.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleSetPrimary(image.id)}
                        className="p-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-white transition"
                        title="Set as primary"
                      >
                        <Star className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(image.id)}
                      className="p-1.5 bg-red-500/80 hover:bg-red-600 rounded-lg text-white transition"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {image.is_primary && (
                  <div className="absolute bottom-2 left-2 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> Primary
                  </div>
                )}
                {image.caption && (
                  <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs p-1 truncate rounded-b-lg">
                    {image.caption}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ---- Save bar (always rendered when there are pending files) ---- */}
      {pendingImages.length > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 border-t border-gray-100">
          <div className="text-xs">
            {!selectedQuarter ? (
              <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1 rounded-lg">
                <AlertCircle className="w-3 h-3" />
                Select a quarter above to enable saving.
              </span>
            ) : (
              <span className="text-gray-500">
                Ready to upload {pendingImages.length} image
                {pendingImages.length > 1 ? 's' : ''} to Q{selectedQuarter}{' '}
                {selectedYear}.
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={!canSave || disabled}
            title={
              disabled
                ? 'You do not have permission to upload images'
                : !selectedQuarter
                ? 'Select a quarter first'
                : ''
            }
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm flex items-center justify-center gap-2 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save {pendingImages.length} Image
                {pendingImages.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;