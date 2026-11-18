// src/components/Public/ImageGallery.jsx
import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';

const ImageGallery = ({ images, initialIndex = 0, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [touchStart, setTouchStart] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        prevImage();
      } else if (e.key === 'ArrowRight') {
        nextImage();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [currentIndex]);

  const nextImage = () => {
    setCurrentIndex((prev) => (prev + 1) % images.length);
    setIsZoomed(false);
  };

  const prevImage = () => {
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
    setIsZoomed(false);
  };

  const handleTouchStart = (e) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchEnd = (e) => {
    if (!touchStart) return;
    const touchEnd = e.changedTouches[0].clientX;
    const diff = touchStart - touchEnd;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextImage();
      } else {
        prevImage();
      }
    }
    setTouchStart(null);
  };

  const toggleZoom = () => {
    setIsZoomed(!isZoomed);
  };

  if (!images || images.length === 0) {
    return null;
  }

  const currentImage = images[currentIndex];
  const imageUrl = currentImage?.image_url || currentImage?.image;

  return (
    <div 
      className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition z-10 bg-black/50 rounded-full p-2 hover:bg-black/70"
        aria-label="Close gallery"
      >
        <X className="w-6 h-6" />
      </button>
      
      {/* Zoom Button */}
      <button
        onClick={toggleZoom}
        className="absolute top-4 left-4 text-white hover:text-gray-300 transition z-10 bg-black/50 rounded-full p-2 hover:bg-black/70"
        aria-label={isZoomed ? 'Zoom out' : 'Zoom in'}
      >
        {isZoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
      </button>
      
      {/* Navigation Buttons */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            className="absolute left-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70 hover:scale-110 transition-all duration-200"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-3 hover:bg-black/70 hover:scale-110 transition-all duration-200"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </>
      )}
      
      {/* Main Image */}
      <div className="max-w-5xl max-h-[85vh] mx-4">
        <img
          src={imageUrl}
          alt={currentImage?.caption || 'Project image'}
          className={`max-w-full max-h-[85vh] object-contain transition-transform duration-300 ${
            isZoomed ? 'scale-150 cursor-zoom-out' : 'cursor-zoom-in'
          }`}
          onClick={toggleZoom}
        />
      </div>
      
      {/* Caption */}
      {currentImage?.caption && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 bg-black/70 backdrop-blur-md text-white px-4 py-2 rounded-lg text-sm max-w-md text-center">
          {currentImage.caption}
        </div>
      )}
      
      {/* Image Counter */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs">
        {currentIndex + 1} / {images.length}
      </div>
      
      {/* Thumbnail Strip */}
      {images.length > 1 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 backdrop-blur-md rounded-lg p-2">
          {images.map((img, idx) => {
            const thumbUrl = img.image_url || img.image;
            return (
              <button
                key={img.id || idx}
                onClick={() => {
                  setCurrentIndex(idx);
                  setIsZoomed(false);
                }}
                className={`w-12 h-12 rounded overflow-hidden border-2 transition-all duration-200 ${
                  idx === currentIndex 
                    ? 'border-green-500 scale-110 shadow-lg' 
                    : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                }`}
                aria-label={`Go to image ${idx + 1}`}
              >
                <img
                  src={thumbUrl}
                  alt=""
                  className="w-full h-full object-cover"
                />
              </button>
            );
          })}
        </div>
      )}
      
      {/* Download Button (optional - only if image URL is accessible) */}
      {imageUrl && (
        <a
          href={imageUrl}
          download
          className="absolute bottom-4 right-4 text-white hover:text-gray-300 transition bg-black/50 rounded-full p-2 hover:bg-black/70"
          aria-label="Download image"
          onClick={(e) => e.stopPropagation()}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
        </a>
      )}
    </div>
  );
};

export default ImageGallery;