/**
 * Buying Guide Cache Management
 * Handles storage and retrieval of pre-generated buying guides
 */

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface BuyingGuide {
  make: string
  model: string
  year?: number
  generation?: string
  compact: string
  detailed: string
  created_at: string
  expires_at: string
}

/**
 * Retrieve buying guide from cache
 * Checks multiple cache keys in priority order
 */
export async function getCachedGuide(cacheKeys: string[]): Promise<BuyingGuide | null> {
  try {
    // Query database for any matching cache key
    const { data, error } = await supabase
      .from('buying_guides_cache')
      .select('*')
      .in('cache_key', cacheKeys)
      .gt('expires_at', new Date().toISOString())
      .order('specificity', { ascending: false }) // Prefer more specific guides
      .limit(1)
      .single()

    if (error || !data) {
      return null
    }

    return {
      make: data.make,
      model: data.model,
      year: data.year,
      generation: data.generation,
      compact: data.compact_html,
      detailed: data.detailed_html,
      created_at: data.created_at,
      expires_at: data.expires_at
    }
  } catch (error) {
    console.error('Error retrieving cached guide:', error)
    return null
  }
}

/**
 * Store buying guide in cache
 * Used by backend generation processes
 */
export async function setCachedGuide(
  cacheKey: string,
  guide: Omit<BuyingGuide, 'created_at' | 'expires_at'>,
  specificity: number = 0
): Promise<boolean> {
  try {
    const now = new Date()
    const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days

    const { error } = await supabase
      .from('buying_guides_cache')
      .upsert({
        cache_key: cacheKey,
        make: guide.make,
        model: guide.model,
        year: guide.year,
        generation: guide.generation,
        compact_html: guide.compact,
        detailed_html: guide.detailed,
        specificity,
        created_at: now.toISOString(),
        expires_at: expiresAt.toISOString()
      }, {
        onConflict: 'cache_key'
      })

    if (error) {
      console.error('Error caching guide:', error)
      return false
    }

    return true
  } catch (error) {
    console.error('Error storing cached guide:', error)
    return false
  }
}

/**
 * Clean expired guides from cache
 * Should be run periodically via cron
 */
export async function cleanExpiredGuides(): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('buying_guides_cache')
      .delete()
      .lt('expires_at', new Date().toISOString())
      .select('id')

    if (error) {
      console.error('Error cleaning expired guides:', error)
      return 0
    }

    return data?.length || 0
  } catch (error) {
    console.error('Error during cache cleanup:', error)
    return 0
  }
}

/**
 * Get all cached guides (for admin/monitoring)
 */
export async function getAllCachedGuides(): Promise<BuyingGuide[]> {
  try {
    const { data, error } = await supabase
      .from('buying_guides_cache')
      .select('*')
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })

    if (error || !data) {
      return []
    }

    return data.map(row => ({
      make: row.make,
      model: row.model,
      year: row.year,
      generation: row.generation,
      compact: row.compact_html,
      detailed: row.detailed_html,
      created_at: row.created_at,
      expires_at: row.expires_at
    }))
  } catch (error) {
    console.error('Error retrieving all guides:', error)
    return []
  }
}
