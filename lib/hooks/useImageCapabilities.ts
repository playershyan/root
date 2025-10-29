/**
 * Browser image capability detection hook
 * Detects support for modern image formats (AVIF, WebP)
 * Results are cached for performance
 */

'use client'

import { useState, useEffect } from 'react'
import { CACHE_CONFIG } from '@/lib/config/images'

export interface ImageCapabilities {
  avif: boolean
  webp: boolean
  loading: boolean
}

// Cache results in memory
let cachedCapabilities: ImageCapabilities | null = null
let cacheTimestamp: number = 0

/**
 * Check if cache is valid
 */
function isCacheValid(): boolean {
  if (!cachedCapabilities) return false
  const now = Date.now()
  return now - cacheTimestamp < CACHE_CONFIG.capabilityCacheDuration
}

/**
 * Check if browser supports AVIF format
 */
async function checkAVIFSupport(): Promise<boolean> {
  // Check if browser has native Image API
  if (typeof window === 'undefined' || !window.Image) return false

  return new Promise((resolve) => {
    const img = new Image()

    // Timeout after 100ms
    const timeout = setTimeout(() => {
      resolve(false)
    }, 100)

    img.onload = () => {
      clearTimeout(timeout)
      resolve(img.width > 0 && img.height > 0)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(false)
    }

    // Minimal AVIF data URL (1x1 pixel)
    img.src = 'data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A='
  })
}

/**
 * Check if browser supports WebP format
 */
async function checkWebPSupport(): Promise<boolean> {
  if (typeof window === 'undefined' || !window.Image) return false

  return new Promise((resolve) => {
    const img = new Image()

    const timeout = setTimeout(() => {
      resolve(false)
    }, 100)

    img.onload = () => {
      clearTimeout(timeout)
      resolve(img.width > 0 && img.height > 0)
    }

    img.onerror = () => {
      clearTimeout(timeout)
      resolve(false)
    }

    // Minimal WebP data URL (1x1 pixel)
    img.src = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='
  })
}

/**
 * Detect image format capabilities
 */
async function detectCapabilities(): Promise<ImageCapabilities> {
  // Return cached result if valid
  if (isCacheValid() && cachedCapabilities) {
    return cachedCapabilities
  }

  // Run checks in parallel for speed
  const [avif, webp] = await Promise.all([
    checkAVIFSupport(),
    checkWebPSupport(),
  ])

  const capabilities: ImageCapabilities = {
    avif,
    webp,
    loading: false,
  }

  // Cache results
  cachedCapabilities = capabilities
  cacheTimestamp = Date.now()

  return capabilities
}

/**
 * Hook to detect browser image format support
 *
 * Usage:
 * ```tsx
 * const { avif, webp, loading } = useImageCapabilities()
 *
 * if (loading) return <Loader />
 *
 * const format = avif ? 'avif' : webp ? 'webp' : 'auto'
 * ```
 */
export function useImageCapabilities(): ImageCapabilities {
  const [capabilities, setCapabilities] = useState<ImageCapabilities>({
    avif: false,
    webp: false,
    loading: true,
  })

  useEffect(() => {
    // Check cache first
    if (isCacheValid() && cachedCapabilities) {
      setCapabilities(cachedCapabilities)
      return
    }

    // Otherwise detect
    let mounted = true

    detectCapabilities().then((detected) => {
      if (mounted) {
        setCapabilities(detected)
      }
    })

    return () => {
      mounted = false
    }
  }, [])

  return capabilities
}

/**
 * Get preferred image format based on capabilities
 * Returns the best format the browser supports
 */
export function getPreferredFormat(capabilities: ImageCapabilities): 'avif' | 'webp' | 'auto' {
  if (capabilities.avif) return 'avif'
  if (capabilities.webp) return 'webp'
  return 'auto'
}

/**
 * Synchronous format detection (uses cache only)
 * Returns null if capabilities not yet detected
 */
export function getCachedFormat(): 'avif' | 'webp' | 'auto' | null {
  if (!isCacheValid() || !cachedCapabilities) return null
  return getPreferredFormat(cachedCapabilities)
}

/**
 * Pre-detect capabilities on page load
 * Call this in your app initialization
 */
export function preDetectImageCapabilities(): void {
  if (typeof window === 'undefined') return
  if (isCacheValid()) return

  detectCapabilities().catch(() => {
    // Silent fail - will fallback to auto
  })
}
