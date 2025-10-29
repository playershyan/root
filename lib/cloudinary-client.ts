/**
 * Client-safe Cloudinary utilities for browser-side URL generation
 * This file contains no Node.js dependencies and can be safely imported in client components
 *
 * DEPRECATED: Use @/lib/utils/responsive-images instead for new code
 * This file maintained for backward compatibility only
 */

import {
  extractPublicId,
  getOptimizedUrl,
  getThumbnailUrl as getOptimizedThumbnailUrl,
  getMobileUrl as getOptimizedMobileUrl,
  getGalleryUrl as getOptimizedGalleryUrl,
  buildCloudinaryUrl as buildOptimizedUrl,
  type ImageTransformOptions,
} from '@/lib/utils/responsive-images'

/**
 * Extract public ID from Cloudinary URL
 * @deprecated Use extractPublicId from @/lib/utils/responsive-images
 */
export function extractPublicIdFromUrl(url: string): string | null {
  return extractPublicId(url)
}

/**
 * Build Cloudinary transformation URL (client-safe)
 * @deprecated Use buildCloudinaryUrl from @/lib/utils/responsive-images
 */
export function buildCloudinaryUrl(
  publicId: string,
  transformations: string[],
  cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpvcd0zdw'
): string {
  const transformString = transformations.join(',')
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`
}

/**
 * Get watermark transformation string
 */
export function getWatermarkTransform(): string {
  return 'l_text:Arial_60_bold:VERA.lk,g_south_east,x_30,y_30,o_60,co_white'
}

/**
 * Generate optimized Cloudinary URL with optional watermark
 * Now uses enhanced responsive-images utilities with metadata stripping
 */
export function getOptimizedCloudinaryUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | 'auto:low' | number
    watermark?: boolean
  } = {}
): string {
  // If not a Cloudinary URL, return as-is
  if (!url || !url.includes('cloudinary.com')) {
    return url
  }

  // Map quality string to preset or use as-is
  let qualityValue: 'thumbnail' | 'listing' | 'gallery' | number = 'listing'
  if (typeof options.quality === 'number') {
    qualityValue = options.quality
  } else if (options.quality) {
    // Map old quality strings to new presets
    const qualityMap: Record<string, 'thumbnail' | 'listing' | 'gallery'> = {
      'auto:low': 'thumbnail',
      'auto:eco': 'thumbnail',
      'auto:good': 'listing',
      'auto:best': 'gallery',
      'auto': 'listing',
    }
    qualityValue = qualityMap[options.quality] || 'listing'
  }

  return getOptimizedUrl(url, {
    width: options.width,
    height: options.height,
    quality: qualityValue,
    watermark: options.watermark !== false,
  })
}

/**
 * Generate thumbnail URL with watermark
 * Now uses optimized configuration with proper quality presets
 */
export function getThumbnailUrl(url: string, size: number = 400, watermark: boolean = true): string {
  return getOptimizedThumbnailUrl(url, size, { watermark, quality: 'thumbnail' })
}

/**
 * Generate mobile-optimized URL with watermark
 * Now uses responsive breakpoint configuration
 */
export function getMobileUrl(url: string, watermark: boolean = true): string {
  return getOptimizedMobileUrl(url, { watermark, quality: 'listing' })
}

/**
 * Generate gallery URL with watermark
 * Now uses optimized gallery configuration
 */
export function getGalleryUrl(url: string, watermark: boolean = true): string {
  return getOptimizedGalleryUrl(url, { watermark, quality: 'gallery' })
}