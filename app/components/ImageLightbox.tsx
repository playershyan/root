'use client'

import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'

interface ImageLightboxProps {
  images: string[]
  isOpen: boolean
  currentIndex: number
  onClose: () => void
  onNavigate: (index: number) => void
}

export default function ImageLightbox({
  images,
  isOpen,
  currentIndex,
  onClose,
  onNavigate
}: ImageLightboxProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [mounted, setMounted] = useState(false)

  // Only render on client side
  useEffect(() => {
    setMounted(true)
  }, [])

  // Navigate to previous image
  const navigatePrevious = useCallback(() => {
    if (images.length > 0) {
      const newIndex = (currentIndex - 1 + images.length) % images.length
      onNavigate(newIndex)
    }
  }, [currentIndex, images.length, onNavigate])

  // Navigate to next image
  const navigateNext = useCallback(() => {
    if (images.length > 0) {
      const newIndex = (currentIndex + 1) % images.length
      onNavigate(newIndex)
    }
  }, [currentIndex, images.length, onNavigate])

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === 'ArrowLeft') navigatePrevious()
      if (e.key === 'ArrowRight') navigateNext()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, navigatePrevious, navigateNext, onClose])

  // Prevent body scroll when lightbox is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'auto'
    }

    return () => {
      document.body.style.overflow = 'auto'
    }
  }, [isOpen])

  // Touch gesture handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.touches[0].clientX)
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return

    const touchEnd = e.changedTouches[0].clientX
    const diff = touchStart - touchEnd

    // Swipe threshold of 50px
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        navigateNext()
      } else {
        navigatePrevious()
      }
    }

    setTouchStart(null)
  }

  // Handle backdrop click to close
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  if (!isOpen || !mounted) return null

  const lightboxContent = (
    <div
      className="fixed inset-0 z-[9999] bg-black/95 flex flex-col"
      onClick={handleBackdropClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Header Bar */}
      <div className="flex justify-between items-center p-4 text-white">
        <div className="text-sm md:text-base font-medium">
          {currentIndex + 1} / {images.length}
        </div>
        <button
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close lightbox"
        >
          <X className="w-5 h-5 md:w-6 md:h-6" />
        </button>
      </div>

      {/* Main Image Container */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-16 py-4 relative">
        {/* Previous Button - Hidden on mobile, visible on desktop */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigatePrevious()
            }}
            className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-6 h-6 text-white" />
          </button>
        )}

        {/* Image */}
        <div className="max-w-full max-h-full flex items-center justify-center">
          <img
            src={images[currentIndex]}
            alt={`Image ${currentIndex + 1}`}
            className="max-w-full max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-160px)] w-auto h-auto object-contain select-none"
            draggable={false}
            onError={(e) => {
              const target = e.target as HTMLImageElement
              target.src = '/api/placeholder/800/600'
            }}
          />
        </div>

        {/* Next Button - Hidden on mobile, visible on desktop */}
        {images.length > 1 && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigateNext()
            }}
            className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/30 p-3 rounded-full transition-all z-10"
            aria-label="Next image"
          >
            <ChevronRight className="w-6 h-6 text-white" />
          </button>
        )}
      </div>

      {/* Thumbnail Strip (Desktop) / Dot Indicators (Mobile) */}
      {images.length > 1 && (
        <>
          {/* Desktop Thumbnails */}
          <div className="hidden md:flex justify-center gap-2 pb-6 px-4 overflow-x-auto">
            {images.map((image, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(index)
                }}
                className={`flex-shrink-0 w-20 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  index === currentIndex
                    ? 'border-white ring-2 ring-white/50'
                    : 'border-white/30 hover:border-white/60'
                }`}
              >
                <img
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.src = '/api/placeholder/80/60'
                  }}
                />
              </button>
            ))}
          </div>

          {/* Mobile Dot Indicators */}
          <div className="flex md:hidden justify-center gap-2 pb-6 px-4">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={(e) => {
                  e.stopPropagation()
                  onNavigate(index)
                }}
                className={`w-2 h-2 rounded-full transition-all ${
                  index === currentIndex
                    ? 'bg-white w-6'
                    : 'bg-white/40 hover:bg-white/60'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        </>
      )}

      {/* Mobile Swipe Hint - Show briefly on first open */}
      <div className="md:hidden absolute bottom-20 left-1/2 -translate-x-1/2 text-white/60 text-xs animate-pulse pointer-events-none">
        Swipe to navigate
      </div>
    </div>
  )

  // Render in portal to avoid z-index conflicts
  return createPortal(lightboxContent, document.body)
}
