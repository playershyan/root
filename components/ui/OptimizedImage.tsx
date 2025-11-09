'use client'

import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { getOptimizedUrl, generateBlurDataURL, getLQIPUrl } from '@/lib/utils/responsive-images'
import { getResponsiveSizes } from '@/lib/config/images'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  quality?: 'thumbnail' | 'listing' | 'gallery' | number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onError?: () => void
  onLoad?: () => void
  watermark?: boolean
}

/**
 * OptimizedImage component using Next.js Image with Cloudinary optimizations
 *
 * Features:
 * - Automatic format selection (AVIF/WebP/fallback)
 * - Metadata stripping for reduced file size
 * - Progressive loading
 * - Quality presets (thumbnail/listing/gallery)
 * - Optional watermarking
 * - Blur placeholder support
 *
 * For more advanced responsive features with explicit format sources,
 * use ResponsiveImage component instead.
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  priority = false,
  sizes,
  quality = 'listing',
  placeholder = 'empty',
  blurDataURL,
  onError,
  onLoad,
  watermark = true,
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)
  const [shouldLoad, setShouldLoad] = useState(priority)
  const containerRef = useRef<HTMLDivElement>(null)

  // Enhanced CDN optimization with new utilities
  const optimizeCDNUrl = (
    url: string,
    width?: number,
    quality?: 'thumbnail' | 'listing' | 'gallery' | number,
    watermark?: boolean
  ) => {
    if (!url) return url

    // For Cloudinary URLs - use enhanced optimization utilities
    if (url.includes('cloudinary.com')) {
      return getOptimizedUrl(url, {
        width,
        quality,
        watermark,
        format: 'auto', // Let Cloudinary choose best format
      })
    }

    // Supabase storage URLs (backward compatibility)
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      return url
    }

    return url
  }

  const optimizedSrc = optimizeCDNUrl(src, width, quality, watermark)

  // Generate or use provided blur placeholder
  const defaultBlurDataURL =
    blurDataURL ||
    (width && height ? generateBlurDataURL(width, height) : undefined)

  // Generate responsive sizes if not provided
  const responsiveSizes =
    sizes ||
    getResponsiveSizes({
      mobile: '100vw',
      tablet: '50vw',
      desktop: '33vw',
      default: '33vw',
    })

  const handleError = () => {
    setError(true)
    setLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setLoading(false)
    onLoad?.()
  }

  useEffect(() => {
    if (priority) {
      setShouldLoad(true)
      return
    }

    if (typeof IntersectionObserver === 'undefined') {
      setShouldLoad(true)
      return
    }

    const node = containerRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            setShouldLoad(true)
            observer.disconnect()
          }
        })
      },
      { rootMargin: '200px 0px' }
    )

    observer.observe(node)

    return () => {
      observer.disconnect()
    }
  }, [priority])

  if (error) {
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

  return (
    <div ref={containerRef} className="relative">
      {(!shouldLoad || loading) && (
        <div
          className={`absolute inset-0 animate-pulse bg-gray-200 ${className}`}
        />
      )}
      {shouldLoad && (
        <Image
          src={optimizedSrc}
          alt={alt}
          width={width}
          height={height}
          fill={fill}
          priority={priority}
          sizes={responsiveSizes}
          quality={typeof quality === 'number' ? quality : 75}
          placeholder={defaultBlurDataURL ? 'blur' : placeholder}
          blurDataURL={defaultBlurDataURL}
          className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
          onError={handleError}
          onLoad={handleLoad}
          loading={priority ? 'eager' : 'lazy'}
        />
      )}
    </div>
  )
}