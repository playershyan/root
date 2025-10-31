'use client'

import { useEffect } from 'react'
import { reportWebVitals } from '@/lib/analytics/webVitals'

/**
 * Web Vitals Reporter - Phase 4 Performance Optimization
 *
 * Automatically reports Core Web Vitals metrics to analytics
 * This component should be included in the root layout
 */
export default function WebVitalsReporter() {
  useEffect(() => {
    // Only load web-vitals library in the browser
    if (typeof window !== 'undefined') {
      import('web-vitals').then(({ onCLS, onFID, onFCP, onLCP, onTTFB, onINP }) => {
        onCLS(reportWebVitals)
        onFID(reportWebVitals)
        onFCP(reportWebVitals)
        onLCP(reportWebVitals)
        onTTFB(reportWebVitals)
        onINP(reportWebVitals)
      })
    }
  }, [])

  return null // This component doesn't render anything
}
