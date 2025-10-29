'use client'

/**
 * Enhanced responsive image component using <picture> element
 * Provides explicit format negotiation (AVIF → WebP → fallback)
 * and responsive sizing with srcset
 */

import { useState, useEffect } from 'react'
import {
  generatePictureSourceSets,
  generateResponsiveImageSet,
  generateBlurDataURL,
  getLQIPUrl,
  extractPublicId,
} from '@/lib/utils/responsive-images'
import { getResponsiveSizes, IMAGE_BREAKPOINTS } from '@/lib/config/images'

export interface ResponsiveImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: 'thumbnail' | 'listing' | 'gallery' | number
  watermark?: boolean
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down'
  onLoad?: () => void
  onError?: () => void
  // Responsive configuration
  sizes?: {
    mobile?: string
    tablet?: string
    desktop?: string
    default?: string
  }
  // Breakpoint widths for srcset generation
  breakpoints?: number[]
}

export default function ResponsiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality = 'listing',
  watermark = true,
  objectFit = 'cover',
  onLoad,
  onError,
  sizes,
  breakpoints = Object.values(IMAGE_BREAKPOINTS),
}: ResponsiveImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [showLQIP, setShowLQIP] = useState(!priority)

  // Generate picture sources for AVIF, WebP, and fallback
  const publicId = extractPublicId(src)
  const pictureSources = publicId
    ? generatePictureSourceSets(src, {
        baseTransform: {
          quality,
          watermark,
        },
        widths: breakpoints,
        formats: ['avif', 'webp', 'auto'],
      })
    : null

  // Generate responsive image set for fallback img element
  const responsiveSet = publicId
    ? generateResponsiveImageSet(src, {
        baseTransform: { quality, watermark },
        widths: breakpoints,
        sizesConfig: sizes,
      })
    : null

  // Generate LQIP for blur effect
  const lqipUrl = publicId && !priority ? getLQIPUrl(src) : null

  const handleLoad = () => {
    setImageLoaded(true)
    setShowLQIP(false)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    setShowLQIP(false)
    onError?.()
  }

  useEffect(() => {
    if (priority) {
      setShowLQIP(false)
    }
  }, [priority])

  // Error state
  if (imageError) {
    return (
      <div
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
        style={{
          width: width ? `${width}px` : '100%',
          height: height ? `${height}px` : '100%',
        }}
      >
        <div className="text-center">
          <svg
            className="w-8 h-8 text-gray-400 mx-auto mb-2"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      </div>
    )
  }

  // For non-Cloudinary URLs, use simple img element
  if (!publicId || !pictureSources || !responsiveSet) {
    return (
      <img
        src={src}
        alt={alt}
        className={className}
        style={{ objectFit }}
        onLoad={handleLoad}
        onError={handleError}
        loading={priority ? 'eager' : 'lazy'}
      />
    )
  }

  return (
    <div className="relative" style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}>
      {/* LQIP (Low Quality Image Placeholder) */}
      {showLQIP && lqipUrl && (
        <img
          src={lqipUrl}
          alt=""
          className={`absolute inset-0 w-full h-full blur-sm ${className}`}
          style={{ objectFit }}
          aria-hidden="true"
        />
      )}

      {/* Loading skeleton */}
      {!imageLoaded && (
        <div className="absolute inset-0 animate-pulse bg-gray-200" />
      )}

      {/* Main picture element with format sources */}
      <picture>
        {/* AVIF source (best compression) */}
        {pictureSources[0] && (
          <source
            type={pictureSources[0].type}
            srcSet={pictureSources[0].srcset}
            sizes={responsiveSet.sizes}
          />
        )}

        {/* WebP source (good compression, wider support) */}
        {pictureSources[1] && (
          <source
            type={pictureSources[1].type}
            srcSet={pictureSources[1].srcset}
            sizes={responsiveSet.sizes}
          />
        )}

        {/* Fallback img element (JPEG/PNG) */}
        <img
          src={responsiveSet.src}
          srcSet={responsiveSet.srcset}
          sizes={responsiveSet.sizes}
          alt={alt}
          width={width}
          height={height}
          className={`${className} ${imageLoaded ? 'opacity-100' : 'opacity-0'} transition-opacity duration-300`}
          style={{ objectFit }}
          onLoad={handleLoad}
          onError={handleError}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
        />
      </picture>
    </div>
  )
}
