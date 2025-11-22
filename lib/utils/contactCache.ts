/**
 * Contact Cache Utility
 *
 * Manages browser-side caching of contact information (phone and WhatsApp)
 * for convenience when creating listings or wanted requests.
 *
 * Cache is only used when user's profile does NOT have contact information set.
 * Profile contact info always takes precedence over cache.
 */

interface CachedContact {
  phone: string
  whatsapp: string
}

const CACHE_KEY = 'contactInfoCache'

/**
 * Save contact information to localStorage
 *
 * @param phone - Phone number to cache
 * @param whatsapp - WhatsApp number to cache
 */
export function saveContactToCache(phone: string, whatsapp: string): void {
  if (typeof window === 'undefined') return // SSR safety

  try {
    const cache: CachedContact = {
      phone: phone || '',
      whatsapp: whatsapp || ''
    }
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch (error) {
    console.error('Failed to save contact to cache:', error)
  }
}

/**
 * Load contact information from localStorage
 *
 * @returns Cached contact info or null if not found
 */
export function loadContactFromCache(): CachedContact | null {
  if (typeof window === 'undefined') return null // SSR safety

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (!cached) return null

    const parsed = JSON.parse(cached) as CachedContact

    // Validate structure
    if (!parsed || typeof parsed.phone !== 'string') {
      return null
    }

    return parsed
  } catch (error) {
    console.error('Failed to load contact from cache:', error)
    return null
  }
}

/**
 * Clear contact information from localStorage
 * Called on logout or when user wants to clear cached data
 */
export function clearContactCache(): void {
  if (typeof window === 'undefined') return // SSR safety

  try {
    localStorage.removeItem(CACHE_KEY)
  } catch (error) {
    console.error('Failed to clear contact cache:', error)
  }
}

/**
 * Check if contact cache exists
 *
 * @returns true if cache exists, false otherwise
 */
export function hasContactCache(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const cached = localStorage.getItem(CACHE_KEY)
    return cached !== null
  } catch {
    return false
  }
}
