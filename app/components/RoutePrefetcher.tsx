'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Route Prefetcher - Phase 4 Performance Optimization
 *
 * Prefetches critical routes on idle to improve perceived performance
 * Uses requestIdleCallback for non-blocking prefetching
 */

// Critical routes to prefetch
const CRITICAL_ROUTES = [
  '/listings',
  '/wanted',
  '/post',
  '/profile',
] as const

export default function RoutePrefetcher() {
  const router = useRouter()

  useEffect(() => {
    // Check if requestIdleCallback is supported
    const requestIdleCallback =
      (window as any).requestIdleCallback ||
      ((cb: IdleRequestCallback) => setTimeout(cb, 1))

    // Prefetch critical routes when browser is idle
    const prefetchRoutes = () => {
      CRITICAL_ROUTES.forEach((route) => {
        router.prefetch(route)
      })
    }

    // Wait until browser is idle to prefetch
    const idleCallbackId = requestIdleCallback(prefetchRoutes, {
      timeout: 2000, // Fallback timeout
    })

    return () => {
      // Clean up on unmount
      if ((window as any).cancelIdleCallback) {
        (window as any).cancelIdleCallback(idleCallbackId)
      }
    }
  }, [router])

  return null // This component doesn't render anything
}
