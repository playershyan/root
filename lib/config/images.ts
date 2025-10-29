/**
 * Centralized image optimization configuration
 * Single source of truth for all image-related parameters
 */

/**
 * Responsive breakpoints for image delivery
 * Aligned with Tailwind CSS breakpoints for consistency
 */
export const IMAGE_BREAKPOINTS = {
  mobile: 640,
  tablet: 1024,
  desktop: 1536,
  wide: 1920,
} as const

/**
 * Device pixel ratio multipliers
 */
export const DPR_MULTIPLIERS = [1, 2] as const

/**
 * Image quality presets mapped to Cloudinary quality values
 * Context-aware quality optimization
 */
export const QUALITY_PRESETS = {
  // Thumbnails in listing grids - prioritize speed
  thumbnail: 'auto:eco',
  // Main listing images - balance quality/size
  listing: 'auto:good',
  // Gallery/lightbox full-size - prioritize quality
  gallery: 'auto:best',
  // Low quality placeholder
  placeholder: 'auto:low',
  // Custom numeric quality (1-100)
  custom: (value: number) => Math.max(1, Math.min(100, value)),
} as const

/**
 * Format preferences in order of priority
 * AVIF: Best compression (30% smaller than WebP)
 * WebP: Good compression, wide browser support
 * Auto: Fallback for older browsers
 */
export const FORMAT_PRIORITY = ['avif', 'webp', 'auto'] as const

/**
 * Image dimensions for different use cases
 * Based on actual viewport sizes and aspect ratios
 */
export const IMAGE_DIMENSIONS = {
  thumbnail: {
    width: 400,
    height: 300,
    aspectRatio: 4 / 3,
  },
  card: {
    width: 800,
    height: 600,
    aspectRatio: 4 / 3,
  },
  hero: {
    width: 1600,
    height: 900,
    aspectRatio: 16 / 9,
  },
  gallery: {
    width: 1920,
    height: 1440,
    aspectRatio: 4 / 3,
  },
  fullscreen: {
    width: 2560,
    height: 1920,
    aspectRatio: 4 / 3,
  },
} as const

/**
 * Cloudinary transformation flags for optimization
 */
export const OPTIMIZATION_FLAGS = {
  // Strip all metadata (EXIF, IPTC, XMP)
  stripMetadata: 'fl_strip_profile,fl_force_strip',
  // Progressive JPEG loading
  progressive: 'fl_progressive',
  // Preserve transparency
  preserveTransparency: 'fl_preserve_transparency',
  // Lossy format for animations (GIF → video)
  lossyFormat: 'fl_lossy',
  // Attachment (force download)
  attachment: 'fl_attachment',
} as const

/**
 * Upload constraints
 */
export const UPLOAD_CONSTRAINTS = {
  // Maximum file size before client-side compression (bytes)
  maxFileSizeBeforeCompression: 3 * 1024 * 1024, // 3MB
  // Target file size after compression (bytes)
  targetCompressedSize: 2 * 1024 * 1024, // 2MB
  // Maximum dimensions before resize
  maxDimensions: {
    width: 2560,
    height: 2560,
  },
  // Target dimensions for compression
  targetDimensions: {
    width: 1920,
    height: 1440,
  },
  // Compression quality for client-side processing
  compressionQuality: 0.85,
  // Allowed MIME types
  allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/tiff'],
  // Maximum files per upload
  maxFiles: 20,
} as const

/**
 * Watermark configuration
 */
export const WATERMARK_CONFIG = {
  text: 'VERA.lk',
  fontFamily: 'Arial',
  fontSize: 60,
  fontWeight: 'bold',
  gravity: 'south_east',
  x: 30,
  y: 30,
  opacity: 60,
  color: 'white',
} as const

/**
 * Cache configuration
 */
export const CACHE_CONFIG = {
  // Browser cache TTL for immutable Cloudinary URLs (1 year)
  browserCacheTTL: 31536000,
  // Memory cache for capability detection results
  capabilityCacheDuration: 3600000, // 1 hour
} as const

/**
 * Performance monitoring configuration
 */
export const MONITORING_CONFIG = {
  // Sample rate for performance logging (0-1)
  sampleRate: 0.1, // 10% of requests
  // Enable detailed performance logging
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  // Thresholds for alerts
  thresholds: {
    // LCP threshold (ms)
    lcpThreshold: 2500,
    // Image load time threshold (ms)
    imageLoadThreshold: 1000,
    // File size threshold (bytes)
    fileSizeThreshold: 500 * 1024, // 500KB
  },
} as const

/**
 * Feature flags
 */
export const FEATURE_FLAGS = {
  // Enable AVIF format
  enableAVIF: true,
  // Enable WebP format
  enableWebP: true,
  // Enable client-side compression
  enableClientCompression: true,
  // Enable responsive images
  enableResponsiveImages: true,
  // Enable lazy loading
  enableLazyLoading: true,
  // Enable blur placeholders
  enableBlurPlaceholders: true,
  // Enable performance monitoring
  enablePerformanceMonitoring: true,
  // Enable watermarks (can be overridden per-image)
  enableWatermarks: process.env.CLOUDINARY_WATERMARK_ENABLED !== 'false',
} as const

/**
 * Cloudinary folder structure
 */
export const CLOUDINARY_FOLDERS = {
  listings: 'vera-lk/listings',
  profiles: 'vera-lk/profiles',
  business: 'vera-lk/business',
  temp: 'vera-lk/temp',
} as const

/**
 * Get responsive sizes attribute for img/picture elements
 * Generates sizes string based on breakpoints
 */
export function getResponsiveSizes(options?: {
  mobile?: string
  tablet?: string
  desktop?: string
  default?: string
}): string {
  const {
    mobile = '100vw',
    tablet = '50vw',
    desktop = '33vw',
    default: defaultSize = '33vw',
  } = options || {}

  return [
    `(max-width: ${IMAGE_BREAKPOINTS.mobile}px) ${mobile}`,
    `(max-width: ${IMAGE_BREAKPOINTS.tablet}px) ${tablet}`,
    `(max-width: ${IMAGE_BREAKPOINTS.desktop}px) ${desktop}`,
    defaultSize,
  ].join(', ')
}

/**
 * Calculate optimal width for given viewport
 */
export function getOptimalWidth(
  viewportWidth: number,
  containerWidthPercent: number = 100
): number {
  const containerWidth = (viewportWidth * containerWidthPercent) / 100

  // Find next breakpoint above container width
  const breakpointValues = Object.values(IMAGE_BREAKPOINTS)
  const nextBreakpoint = breakpointValues.find(bp => bp >= containerWidth)

  return nextBreakpoint || IMAGE_BREAKPOINTS.wide
}

/**
 * Get quality preset by use case
 */
export function getQualityForUseCase(useCase: keyof typeof QUALITY_PRESETS): string {
  return QUALITY_PRESETS[useCase]
}

/**
 * Check if file needs compression
 */
export function needsCompression(fileSize: number): boolean {
  return FEATURE_FLAGS.enableClientCompression &&
         fileSize > UPLOAD_CONSTRAINTS.maxFileSizeBeforeCompression
}

/**
 * Check if dimensions need resizing
 */
export function needsResize(width: number, height: number): boolean {
  return (
    width > UPLOAD_CONSTRAINTS.maxDimensions.width ||
    height > UPLOAD_CONSTRAINTS.maxDimensions.height
  )
}
