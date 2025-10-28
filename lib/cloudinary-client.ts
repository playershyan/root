/**
 * Client-safe Cloudinary utilities for browser-side URL generation
 * This file contains no Node.js dependencies and can be safely imported in client components
 */

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicIdFromUrl(url: string): string | null {
  if (!url.includes('cloudinary.com')) return null

  const match = url.match(/\/v\d+\/(.+?)\.[^.]+$/)
  return match ? match[1] : null
}

/**
 * Build Cloudinary transformation URL (client-safe)
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

  // Extract public ID
  const publicId = extractPublicIdFromUrl(url)
  if (!publicId) return url

  // Build transformations
  const transformations: string[] = []

  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  transformations.push('c_limit') // Don't upscale
  transformations.push(`q_${options.quality || 'auto:good'}`)
  transformations.push('f_auto') // Auto format
  transformations.push('dpr_auto') // Auto device pixel ratio

  // Add watermark if requested (default true)
  if (options.watermark !== false) {
    transformations.push(getWatermarkTransform())
  }

  return buildCloudinaryUrl(publicId, transformations)
}

/**
 * Generate thumbnail URL with watermark
 */
export function getThumbnailUrl(url: string, size: number = 400, watermark: boolean = true): string {
  return getOptimizedCloudinaryUrl(url, {
    width: size,
    height: Math.round(size * 0.75), // 4:3 aspect ratio
    quality: 80,
    watermark
  })
}

/**
 * Generate mobile-optimized URL with watermark
 */
export function getMobileUrl(url: string, watermark: boolean = true): string {
  return getOptimizedCloudinaryUrl(url, {
    width: 800,
    height: 600,
    quality: 70,
    watermark
  })
}

/**
 * Generate gallery URL with watermark
 */
export function getGalleryUrl(url: string, watermark: boolean = true): string {
  return getOptimizedCloudinaryUrl(url, {
    width: 1600,
    height: 1200,
    quality: 90,
    watermark
  })
}