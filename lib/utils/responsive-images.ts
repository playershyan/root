/**
 * Responsive image utilities
 * Generates srcset, sizes, and optimized URLs for responsive delivery
 */

import {
  IMAGE_BREAKPOINTS,
  DPR_MULTIPLIERS,
  FORMAT_PRIORITY,
  QUALITY_PRESETS,
  OPTIMIZATION_FLAGS,
  getResponsiveSizes,
} from '@/lib/config/images'

export interface ImageTransformOptions {
  width?: number
  height?: number
  quality?: string | number
  format?: 'avif' | 'webp' | 'auto' | 'jpg' | 'png'
  crop?: 'fill' | 'fit' | 'limit' | 'scale' | 'pad'
  gravity?: string
  dpr?: number
  stripMetadata?: boolean
  progressive?: boolean
  watermark?: boolean
}

export interface ResponsiveImageSet {
  srcset: string
  sizes: string
  src: string
  width?: number
  height?: number
}

export interface PictureSourceSet {
  format: string
  srcset: string
  type: string
}

/**
 * Extract public ID from Cloudinary URL
 */
export function extractPublicId(url: string): string | null {
  if (!url?.includes('cloudinary.com')) return null

  // Match pattern: /v{version}/{public_id}.{extension}
  const match = url.match(/\/v\d+\/(.+?)\.[^.]+$/)
  return match ? match[1] : null
}

/**
 * Build Cloudinary transformation URL
 */
export function buildCloudinaryUrl(
  publicId: string,
  options: ImageTransformOptions = {},
  cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dpvcd0zdw'
): string {
  const transformations: string[] = []

  // Dimensions
  if (options.width) transformations.push(`w_${options.width}`)
  if (options.height) transformations.push(`h_${options.height}`)
  if (options.crop) transformations.push(`c_${options.crop}`)
  else if (options.width || options.height) transformations.push('c_limit')

  // Quality
  const quality = options.quality || QUALITY_PRESETS.listing
  transformations.push(`q_${quality}`)

  // Format
  if (options.format && options.format !== 'auto') {
    transformations.push(`f_${options.format}`)
  } else {
    transformations.push('f_auto')
  }

  // DPR
  if (options.dpr) {
    transformations.push(`dpr_${options.dpr}`)
  } else {
    transformations.push('dpr_auto')
  }

  // Gravity (for cropping)
  if (options.gravity) {
    transformations.push(`g_${options.gravity}`)
  }

  // Optimization flags
  if (options.stripMetadata !== false) {
    transformations.push(OPTIMIZATION_FLAGS.stripMetadata)
  }

  if (options.progressive !== false) {
    transformations.push(OPTIMIZATION_FLAGS.progressive)
  }

  const transformString = transformations.join(',')
  return `https://res.cloudinary.com/${cloudName}/image/upload/${transformString}/${publicId}`
}

/**
 * Generate srcset for responsive images
 * Creates URLs for different widths and DPR combinations
 */
export function generateSrcset(
  publicId: string,
  baseOptions: ImageTransformOptions = {},
  widths: number[] = Object.values(IMAGE_BREAKPOINTS)
): string {
  const srcsetEntries: string[] = []

  widths.forEach(width => {
    DPR_MULTIPLIERS.forEach(dpr => {
      const actualWidth = width * dpr
      const url = buildCloudinaryUrl(publicId, {
        ...baseOptions,
        width: actualWidth,
        dpr: 1, // We handle DPR manually in width
      })
      srcsetEntries.push(`${url} ${actualWidth}w`)
    })
  })

  return srcsetEntries.join(', ')
}

/**
 * Generate responsive image set with srcset and sizes
 */
export function generateResponsiveImageSet(
  url: string,
  options: {
    baseTransform?: ImageTransformOptions
    widths?: number[]
    sizesConfig?: Parameters<typeof getResponsiveSizes>[0]
    fallbackWidth?: number
  } = {}
): ResponsiveImageSet | null {
  const publicId = extractPublicId(url)
  if (!publicId) return null

  const {
    baseTransform = {},
    widths = Object.values(IMAGE_BREAKPOINTS),
    sizesConfig,
    fallbackWidth = IMAGE_BREAKPOINTS.desktop,
  } = options

  const srcset = generateSrcset(publicId, baseTransform, widths)
  const sizes = getResponsiveSizes(sizesConfig)
  const src = buildCloudinaryUrl(publicId, {
    ...baseTransform,
    width: fallbackWidth,
  })

  return {
    srcset,
    sizes,
    src,
    width: baseTransform.width,
    height: baseTransform.height,
  }
}

/**
 * Generate picture element source sets for multiple formats
 * Creates sources for AVIF, WebP, and fallback
 */
export function generatePictureSourceSets(
  url: string,
  options: {
    baseTransform?: ImageTransformOptions
    widths?: number[]
    formats?: Array<'avif' | 'webp' | 'auto'>
  } = {}
): PictureSourceSet[] | null {
  const publicId = extractPublicId(url)
  if (!publicId) return null

  const {
    baseTransform = {},
    widths = Object.values(IMAGE_BREAKPOINTS),
    formats = ['avif', 'webp', 'auto'],
  } = options

  const sourceSets: PictureSourceSet[] = []

  formats.forEach(format => {
    const srcset = generateSrcset(
      publicId,
      { ...baseTransform, format },
      widths
    )

    let mimeType: string
    switch (format) {
      case 'avif':
        mimeType = 'image/avif'
        break
      case 'webp':
        mimeType = 'image/webp'
        break
      default:
        mimeType = 'image/jpeg'
    }

    sourceSets.push({
      format,
      srcset,
      type: mimeType,
    })
  })

  return sourceSets
}

/**
 * Build optimized Cloudinary URL with watermark support
 * Simplified interface for common use cases
 */
export function getOptimizedUrl(
  url: string,
  options: {
    width?: number
    height?: number
    quality?: keyof typeof QUALITY_PRESETS | number
    format?: 'avif' | 'webp' | 'auto'
    watermark?: boolean
  } = {}
): string {
  if (!url?.includes('cloudinary.com')) return url

  const publicId = extractPublicId(url)
  if (!publicId) return url

  // Resolve quality preset
  let qualityValue: string | number
  if (typeof options.quality === 'string' && options.quality in QUALITY_PRESETS) {
    qualityValue = QUALITY_PRESETS[options.quality as keyof typeof QUALITY_PRESETS]
  } else if (typeof options.quality === 'number') {
    qualityValue = options.quality
  } else {
    qualityValue = QUALITY_PRESETS.listing
  }

  const transformOptions: ImageTransformOptions = {
    width: options.width,
    height: options.height,
    quality: qualityValue,
    format: options.format || 'auto',
    stripMetadata: true,
    progressive: true,
  }

  let baseUrl = buildCloudinaryUrl(publicId, transformOptions)

  // Add watermark if requested
  if (options.watermark) {
    const watermarkTransform = 'l_text:Arial_60_bold:VERA.lk,g_south_east,x_30,y_30,o_60,co_white'
    // Insert watermark before the public_id
    baseUrl = baseUrl.replace(/\/upload\//, `/upload/${watermarkTransform}/`)
  }

  return baseUrl
}

/**
 * Generate thumbnail URL
 */
export function getThumbnailUrl(
  url: string,
  size: number = 400,
  options: { watermark?: boolean; quality?: keyof typeof QUALITY_PRESETS } = {}
): string {
  return getOptimizedUrl(url, {
    width: size,
    height: Math.round(size * 0.75),
    quality: options.quality || 'thumbnail',
    format: 'auto',
    watermark: options.watermark,
  })
}

/**
 * Generate mobile-optimized URL
 */
export function getMobileUrl(
  url: string,
  options: { watermark?: boolean; quality?: keyof typeof QUALITY_PRESETS } = {}
): string {
  return getOptimizedUrl(url, {
    width: IMAGE_BREAKPOINTS.mobile,
    quality: options.quality || 'listing',
    format: 'auto',
    watermark: options.watermark,
  })
}

/**
 * Generate desktop-optimized URL
 */
export function getDesktopUrl(
  url: string,
  options: { watermark?: boolean; quality?: keyof typeof QUALITY_PRESETS } = {}
): string {
  return getOptimizedUrl(url, {
    width: IMAGE_BREAKPOINTS.desktop,
    quality: options.quality || 'listing',
    format: 'auto',
    watermark: options.watermark,
  })
}

/**
 * Generate gallery/lightbox URL
 */
export function getGalleryUrl(
  url: string,
  options: { watermark?: boolean; quality?: keyof typeof QUALITY_PRESETS } = {}
): string {
  return getOptimizedUrl(url, {
    width: IMAGE_BREAKPOINTS.wide,
    quality: options.quality || 'gallery',
    format: 'auto',
    watermark: options.watermark,
  })
}

/**
 * Generate blur placeholder data URL
 */
export function generateBlurDataURL(width: number = 40, height: number = 30): string {
  const svg = `
    <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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

/**
 * Get low-quality image placeholder (LQIP) from Cloudinary
 */
export function getLQIPUrl(url: string, width: number = 40): string {
  return getOptimizedUrl(url, {
    width,
    quality: 'placeholder',
    format: 'auto',
    watermark: false,
  })
}
