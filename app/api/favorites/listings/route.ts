import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// GET favorited listings with full details for profile page
export async function GET(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('favorites.listings.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/favorites/listings')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/favorites/listings', durationMs)
    performanceMonitor.incrementCounter(`favorites.listings.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/favorites/listings', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/favorites/listings', new Error(reason), logContext)
    }

    return response
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const authStart = performance.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'favorites-listings'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    
    if (authError || !user) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    // Get user's favorited listings with full details
    const favoritesStart = performance.now()
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        listing_id,
        created_at,
        listings (
          id,
          title,
          price,
          location,
          make,
          model,
          year,
          mileage,
          fuel_type,
          transmission,
          image_url,
          image_urls,
          created_at,
          views,
          is_featured,
          is_sold
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
    const favoritesDuration = performance.now() - favoritesStart
    logger.db.query('favorites.fetch_listings', {
      durationMs: Math.round(favoritesDuration),
      userId: user.id
    })
    performanceMonitor.trackDatabaseQuery('favorites.fetch_listings', favoritesDuration)

    if (error) {
      logger.error('Error fetching favorite listings', error, { userId: user.id })
      return finish('failure', NextResponse.json({ error: 'Failed to fetch favorite listings' }, { status: 500 }), {
        reason: 'supabase-error',
        code: error.code
      })
    }

    // Transform the data to match the expected format
    const favoritedListings = favorites?.map(f => ({
      ...f.listings,
      favorited_at: f.created_at
    })).filter(Boolean) || []

    performanceMonitor.incrementCounter('favorites.listings.results', favoritedListings.length, { type: 'listings' })
    return finish('success', NextResponse.json({ listings: favoritedListings }), {
      userId: user.id,
      count: favoritedListings.length
    })

  } catch (error) {
    logger.error('Favorite listings GET error', error as Error)
    return finish('failure', NextResponse.json({ error: 'Internal server error' }, { status: 500 }), {
      reason: (error as Error).message
    })
  }
}