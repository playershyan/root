/**
 * Image performance monitoring utilities
 * Track image load times, formats, sizes, and Core Web Vitals impact
 */

'use client'

import { MONITORING_CONFIG, FEATURE_FLAGS } from '@/lib/config/images'
import { logger } from '@/lib/utils/logger'

export interface ImagePerformanceMetric {
  url: string
  format: string
  size: number
  width: number
  height: number
  loadTime: number
  timestamp: number
  wasLCP: boolean // Was this the Largest Contentful Paint
  renderTime: number
  decodeTime: number
}

export interface ImagePerformanceReport {
  totalImages: number
  totalBytes: number
  averageLoadTime: number
  formatDistribution: Record<string, number>
  slowestImages: ImagePerformanceMetric[]
  largestImages: ImagePerformanceMetric[]
  lcpImage?: ImagePerformanceMetric
}

// In-memory metrics storage
const metricsStorage: ImagePerformanceMetric[] = []
let lcpObserver: PerformanceObserver | null = null

/**
 * Check if performance monitoring is enabled and should sample this request
 */
function shouldMonitor(): boolean {
  if (!FEATURE_FLAGS.enablePerformanceMonitoring) return false
  if (typeof window === 'undefined') return false

  // Sample based on configured rate
  return Math.random() < MONITORING_CONFIG.sampleRate
}

/**
 * Detect image format from URL
 */
function detectFormatFromUrl(url: string): string {
  // Check URL parameters for format
  if (url.includes('f_avif')) return 'avif'
  if (url.includes('f_webp')) return 'webp'
  if (url.includes('.avif')) return 'avif'
  if (url.includes('.webp')) return 'webp'
  if (url.includes('.jpg') || url.includes('.jpeg')) return 'jpeg'
  if (url.includes('.png')) return 'png'
  return 'unknown'
}

/**
 * Measure image load performance
 */
export async function measureImageLoad(
  img: HTMLImageElement,
  url: string
): Promise<ImagePerformanceMetric | null> {
  if (!shouldMonitor()) return null

  try {
    const startTime = performance.now()

    // Wait for image to load if not already loaded
    if (!img.complete) {
      await new Promise((resolve, reject) => {
        img.onload = resolve
        img.onerror = reject
      })
    }

    const loadTime = performance.now() - startTime

    // Decode image (async operation that can block rendering)
    const decodeStart = performance.now()
    await img.decode()
    const decodeTime = performance.now() - decodeStart

    // Get image dimensions
    const width = img.naturalWidth || img.width
    const height = img.naturalHeight || img.height

    // Estimate file size from Resource Timing API
    let size = 0
    if (performance.getEntriesByName) {
      const resources = performance.getEntriesByName(url, 'resource') as PerformanceResourceTiming[]
      if (resources.length > 0) {
        size = resources[0].transferSize || resources[0].encodedBodySize || 0
      }
    }

    const metric: ImagePerformanceMetric = {
      url,
      format: detectFormatFromUrl(url),
      size,
      width,
      height,
      loadTime,
      renderTime: loadTime - decodeTime,
      decodeTime,
      timestamp: Date.now(),
      wasLCP: false, // Will be updated by LCP observer
    }

    // Store metric
    metricsStorage.push(metric)

    // Thresholds checked but not logged in development

    return metric
  } catch (error) {
    return null
  }
}

/**
 * Initialize LCP (Largest Contentful Paint) observer
 */
export function initLCPObserver(): void {
  if (typeof window === 'undefined') return
  if (!FEATURE_FLAGS.enablePerformanceMonitoring) return
  if (lcpObserver) return // Already initialized

  try {
    lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries()
      const lastEntry = entries[entries.length - 1] as any

      if (lastEntry && lastEntry.element) {
        const element = lastEntry.element as HTMLImageElement
        const url = element.currentSrc || element.src

        // Mark this image as LCP in metrics
        const metric = metricsStorage.find((m) => m.url === url)
        if (metric) {
          metric.wasLCP = true
        }

        // LCP threshold check (monitoring only)
      }
    })

    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true })
  } catch (error) {
    // LCP observer initialization failed, monitoring not available
  }
}

/**
 * Get performance report for all monitored images
 */
export function getPerformanceReport(): ImagePerformanceReport {
  const totalImages = metricsStorage.length
  const totalBytes = metricsStorage.reduce((sum, m) => sum + m.size, 0)
  const averageLoadTime =
    totalImages > 0
      ? metricsStorage.reduce((sum, m) => sum + m.loadTime, 0) / totalImages
      : 0

  // Format distribution
  const formatDistribution: Record<string, number> = {}
  metricsStorage.forEach((m) => {
    formatDistribution[m.format] = (formatDistribution[m.format] || 0) + 1
  })

  // Slowest images (top 10)
  const slowestImages = [...metricsStorage]
    .sort((a, b) => b.loadTime - a.loadTime)
    .slice(0, 10)

  // Largest images (top 10)
  const largestImages = [...metricsStorage]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10)

  // LCP image
  const lcpImage = metricsStorage.find((m) => m.wasLCP)

  return {
    totalImages,
    totalBytes,
    averageLoadTime,
    formatDistribution,
    slowestImages,
    largestImages,
    lcpImage,
  }
}

/**
 * Clear metrics storage
 */
export function clearMetrics(): void {
  metricsStorage.length = 0
}

/**
 * Export metrics to JSON for analysis
 */
export function exportMetrics(): string {
  const report = getPerformanceReport()
  return JSON.stringify(
    {
      report,
      metrics: metricsStorage,
      timestamp: new Date().toISOString(),
    },
    null,
    2
  )
}

/**
 * Log performance summary to console
 * Note: Uses native console.group for structured reporting in development
 */
export function logPerformanceSummary(): void {
  // Only run in development when detailed logging is enabled
  if (!MONITORING_CONFIG.enableDetailedLogging) return
  if (process.env.NODE_ENV === 'production') return

  const report = getPerformanceReport()

  // Keep console.group/console.groupEnd for development-only detailed performance reporting
  // This is an intentional exception for structured debugging output
  console.group('📊 Image Performance Summary')
  console.log(`Total Images: ${report.totalImages}`)
  console.log(`Total Bytes: ${(report.totalBytes / (1024 * 1024)).toFixed(2)}MB`)
  console.log(`Average Load Time: ${report.averageLoadTime.toFixed(2)}ms`)
  console.log(`Format Distribution:`, report.formatDistribution)

  if (report.lcpImage) {
    console.log(`LCP Image: ${report.lcpImage.url.substring(0, 80)}`)
    console.log(`  - Format: ${report.lcpImage.format}`)
    console.log(`  - Size: ${(report.lcpImage.size / 1024).toFixed(2)}KB`)
    console.log(`  - Load Time: ${report.lcpImage.loadTime.toFixed(2)}ms`)
  }

  if (report.slowestImages.length > 0) {
    console.group('Slowest Images')
    report.slowestImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img.url.substring(0, 60)} - ${img.loadTime.toFixed(2)}ms`)
    })
    console.groupEnd()
  }

  if (report.largestImages.length > 0) {
    console.group('Largest Images')
    report.largestImages.forEach((img, i) => {
      console.log(`${i + 1}. ${img.url.substring(0, 60)} - ${(img.size / 1024).toFixed(2)}KB`)
    })
    console.groupEnd()
  }

  console.groupEnd()
}

/**
 * Hook to auto-measure image performance
 */
export function useImagePerformanceTracking(
  imgRef: React.RefObject<HTMLImageElement>,
  url: string
): void {
  if (typeof window === 'undefined') return

  const img = imgRef.current
  if (!img || !url) return

  measureImageLoad(img, url).catch((error) => {
    if (MONITORING_CONFIG.enableDetailedLogging) {
      logger.error('Failed to track image performance', error)
    }
  })
}

/**
 * Initialize performance monitoring
 * Call this once in your app initialization
 */
export function initImagePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return
  if (!FEATURE_FLAGS.enablePerformanceMonitoring) return

  // Initialize LCP observer
  initLCPObserver()

  // Log summary on page unload
  if (MONITORING_CONFIG.enableDetailedLogging) {
    window.addEventListener('beforeunload', () => {
      logPerformanceSummary()
    })
  }

  if (MONITORING_CONFIG.enableDetailedLogging) {
    logger.debug('Image performance monitoring initialized')
  }
}
