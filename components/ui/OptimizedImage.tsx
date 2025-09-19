import Image from 'next/image'
import { useState } from 'react'
import { CloudinaryService } from '@/lib/cloudinary'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  fill?: boolean
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onError?: () => void
  watermark?: boolean // New prop to control watermark
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  className = '',
  fill = false,
  priority = false,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 75,
  placeholder = 'empty',
  blurDataURL,
  onError,
  watermark = true // Default to true for automatic watermarking
}: OptimizedImageProps) {
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(true)

  // Generate blur placeholder
  const generateBlurDataURL = (w: number, h: number) => {
    const svg = `
      <svg width="${w}" height="${h}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f3f4f6;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e5e7eb;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#grad)" />
      </svg>
    `
    return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`
  }

  // Enhanced CDN optimization with watermark support
  const optimizeCDNUrl = (url: string, width?: number, quality?: number, watermark?: boolean) => {
    if (!url) return url

    // Check if it's a Supabase storage URL
    if (url.includes('supabase.co/storage/v1/object/public/')) {
      // Supabase Storage doesn't support URL-based transformations
      // Return the original URL as-is
      return url
    }

    // For Cloudinary URLs - extract public ID and use CloudinaryService
    if (url.includes('cloudinary.com')) {
      // Try to extract public ID from URL
      const match = url.match(/\/v\d+\/(.+?)\.[^.]+$/)
      if (match && match[1]) {
        const publicId = match[1]

        // Use CloudinaryService to generate optimized URL with watermark
        return CloudinaryService.getOptimizedUrl(publicId, {
          width,
          quality: quality ? quality.toString() : 'auto:good',
          format: 'auto',
          watermark
        })
      }

      // Fallback: manual transformation injection
      const transformations = []
      if (width) transformations.push(`w_${width}`)
      if (quality) transformations.push(`q_${quality}`)
      transformations.push('f_auto') // Auto format selection
      transformations.push('dpr_auto') // Auto device pixel ratio

      // Add watermark transformation if requested
      if (watermark) {
        transformations.push('l_text:Arial_60_bold:VERA.lk,g_south_east,x_30,y_30,o_60,co_white')
      }

      return url.replace('/image/upload/', `/image/upload/${transformations.join(',')}/`)
    }

    return url
  }

  const optimizedSrc = optimizeCDNUrl(src, width, quality, watermark)
  const defaultBlurDataURL = blurDataURL || (width && height ? generateBlurDataURL(width, height) : undefined)

  const handleError = () => {
    setError(true)
    setLoading(false)
    onError?.()
  }

  const handleLoad = () => {
    setLoading(false)
  }

  if (error) {
    return (
      <div 
        className={`bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center ${className}`}
        style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '100%' }}
      >
        <div className="text-center">
          <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <p className="text-xs text-gray-500">Image unavailable</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {loading && (
        <div className={`absolute inset-0 animate-pulse bg-gray-200 ${className}`} />
      )}
      <Image
        src={optimizedSrc}
        alt={alt}
        width={width}
        height={height}
        fill={fill}
        priority={priority}
        sizes={sizes}
        quality={quality}
        placeholder={defaultBlurDataURL ? 'blur' : placeholder}
        blurDataURL={defaultBlurDataURL}
        className={`${className} ${loading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        onError={handleError}
        onLoad={handleLoad}
        loading={priority ? 'eager' : 'lazy'}
      />
    </div>
  )
}