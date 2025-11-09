import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { getAuthenticatedSupabase } from '@/lib/server/getAuthenticatedSupabase'

// GET favorites for current user
export async function GET(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('favorites.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/favorites')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/favorites', durationMs)
    performanceMonitor.incrementCounter(`favorites.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/favorites', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/favorites', new Error(reason), logContext)
    }

    return response
  }

  try {
    const authStart = performance.now()
    const authResult = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart
    const { supabase, user, error: authError } = authResult
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'favorites'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    
    if (authError || !user) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    // Get user's favorites
    const favoritesStart = performance.now()
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)
    const favoritesDuration = performance.now() - favoritesStart
    logger.db.query('favorites.fetch_ids', {
      durationMs: Math.round(favoritesDuration),
      userId: user.id
    })
    performanceMonitor.trackDatabaseQuery('favorites.fetch_ids', favoritesDuration)

    if (error) {
      logger.error('Error fetching favorites', error as Error)
      return finish('failure', NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 }), {
        reason: 'supabase-error',
        code: error.code
      })
    }

    // Return array of listing IDs
    const favoriteIds = favorites?.map(f => f.listing_id) || []
    performanceMonitor.incrementCounter('favorites.results', favoriteIds.length, { type: 'ids' })

    return finish('success', NextResponse.json({ favorites: favoriteIds }), {
      userId: user.id,
      count: favoriteIds.length
    })

  } catch (error) {
    logger.error('Favorites GET error', error as Error)
    return finish('failure', NextResponse.json({ error: 'Internal server error' }, { status: 500 }), {
      reason: (error as Error).message
    })
  }
}

// POST to add/remove favorite
export async function POST(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('favorites.requests', 1, { method: 'POST' })
  logger.api.request('POST', '/api/favorites')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/favorites', durationMs)
    performanceMonitor.incrementCounter(`favorites.${outcome}`, 1, { method: 'POST' })

    if (outcome === 'success') {
      logger.api.success('POST', '/api/favorites', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('POST', '/api/favorites', new Error(reason), logContext)
    }

    return response
  }

  try {
    const authStart = performance.now()
    const authResult = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart
    const { supabase, user, error: authError } = authResult
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'favorites'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    
    if (authError || !user) {
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    const { listingId, action } = await request.json()

    if (!listingId || !action) {
      return finish('failure', NextResponse.json({ error: 'Missing required fields' }, { status: 400 }), {
        reason: 'missing-fields'
      })
    }

    if (action === 'add') {
      // Check if already favorited
      const existingStart = performance.now()
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .single()
      const existingDuration = performance.now() - existingStart
      logger.db.query('favorites.check_existing', {
        durationMs: Math.round(existingDuration),
        userId: user.id,
        listingId
      })
      performanceMonitor.trackDatabaseQuery('favorites.check_existing', existingDuration)

      if (existing) {
        return finish('success', NextResponse.json({ message: 'Already favorited' }), {
          userId: user.id,
          listingId,
          existing: true
        })
      }

      // Add to favorites
      const insertStart = performance.now()
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          listing_id: listingId
        })
      const insertDuration = performance.now() - insertStart
      logger.db.query('favorites.insert', {
        durationMs: Math.round(insertDuration),
        userId: user.id,
        listingId
      })
      performanceMonitor.trackDatabaseQuery('favorites.insert', insertDuration)

      if (insertError) {
        logger.error('Error adding favorite', insertError as Error)
        return finish('failure', NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 }), {
          reason: 'insert-failed',
          code: insertError.code
        })
      }

      performanceMonitor.incrementCounter('favorites.mutations', 1, { action: 'add' })
      return finish('success', NextResponse.json({ message: 'Added to favorites' }), {
        userId: user.id,
        listingId,
        action: 'add'
      })

    } else if (action === 'remove') {
      // Remove from favorites
      const deleteStart = performance.now()
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
      const deleteDuration = performance.now() - deleteStart
      logger.db.query('favorites.delete', {
        durationMs: Math.round(deleteDuration),
        userId: user.id,
        listingId
      })
      performanceMonitor.trackDatabaseQuery('favorites.delete', deleteDuration)

      if (deleteError) {
        logger.error('Error removing favorite', deleteError as Error)
        return finish('failure', NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 }), {
          reason: 'delete-failed',
          code: deleteError.code
        })
      }

      performanceMonitor.incrementCounter('favorites.mutations', 1, { action: 'remove' })
      return finish('success', NextResponse.json({ message: 'Removed from favorites' }), {
        userId: user.id,
        listingId,
        action: 'remove'
      })

    } else {
      return finish('failure', NextResponse.json({ error: 'Invalid action' }, { status: 400 }), {
        reason: 'invalid-action',
        action
      })
    }

  } catch (error) {
    logger.error('Favorites POST error', error as Error)
    return finish('failure', NextResponse.json({ error: 'Internal server error' }, { status: 500 }), {
      reason: (error as Error).message
    })
  }
}