/**
 * Web Vitals Monitoring - Phase 4 Performance Optimization
 *
 * Tracks Core Web Vitals and sends to analytics
 * - LCP (Largest Contentful Paint): Loading performance
 * - FID (First Input Delay): Interactivity
 * - CLS (Cumulative Layout Shift): Visual stability
 * - FCP (First Contentful Paint): Initial render
 * - TTFB (Time to First Byte): Server responsiveness
 * - INP (Interaction to Next Paint): Responsiveness
 */

import type { Metric } from 'web-vitals'

interface WebVitalsMetric {
  id: string
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  navigationType: string
}

// Web Vitals thresholds
const THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
}

function getRating(metric: Metric): 'good' | 'needs-improvement' | 'poor' {
  const threshold = THRESHOLDS[metric.name as keyof typeof THRESHOLDS]
  if (!threshold) return 'good'

  if (metric.value <= threshold.good) return 'good'
  if (metric.value <= threshold.poor) return 'needs-improvement'
  return 'poor'
}

/**
 * Send metrics to analytics endpoint
 */
function sendToAnalytics(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === 'development') {
    console.log('[Web Vitals]', {
      name: metric.name,
      value: Math.round(metric.value),
      rating: metric.rating,
      navigationType: metric.navigationType,
    })
  }

  // Send to analytics in production
  if (process.env.NODE_ENV === 'production') {
    // Option 1: Google Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      ;(window as any).gtag('event', metric.name, {
        event_category: 'Web Vitals',
        value: Math.round(metric.value),
        event_label: metric.id,
        non_interaction: true,
      })
    }

    // Option 2: Custom analytics endpoint
    const body = JSON.stringify(metric)
    const url = '/api/analytics/web-vitals'

    // Use `navigator.sendBeacon()` if available, falling back to `fetch()`
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, body)
    } else {
      fetch(url, {
        body,
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
      }).catch((error) => {
        console.error('Failed to send Web Vitals:', error)
      })
    }
  }
}

/**
 * Report Web Vitals metrics
 * Usage: Import and call in app layout
 */
export function reportWebVitals(metric: Metric) {
  const webVitalsMetric: WebVitalsMetric = {
    id: metric.id,
    name: metric.name,
    value: metric.value,
    rating: getRating(metric),
    delta: metric.delta,
    navigationType: metric.navigationType,
  }

  sendToAnalytics(webVitalsMetric)
}

/**
 * Get performance summary
 * Useful for debugging and monitoring dashboard
 */
export function getPerformanceSummary() {
  if (typeof window === 'undefined') return null

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  const paint = performance.getEntriesByType('paint')

  return {
    // Navigation timing
    dns: navigation?.domainLookupEnd - navigation?.domainLookupStart,
    tcp: navigation?.connectEnd - navigation?.connectStart,
    ttfb: navigation?.responseStart - navigation?.requestStart,
    download: navigation?.responseEnd - navigation?.responseStart,
    domInteractive: navigation?.domInteractive,
    domComplete: navigation?.domComplete,
    loadComplete: navigation?.loadEventEnd,

    // Paint timing
    fcp: paint?.find((entry) => entry.name === 'first-contentful-paint')?.startTime,

    // Resource timing
    resources: performance.getEntriesByType('resource').length,
  }
}
