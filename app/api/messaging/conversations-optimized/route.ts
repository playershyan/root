/**
 * Optimized Conversations API - Single Query with Pagination
 * Industry Best Practices:
 * - Single JOIN query (no N+1)
 * - Pagination support
 * - Server-side transformation
 * - Efficient data structure
 */

import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'

export const dynamic = 'force-dynamic'

interface ConversationResponse {
  id: string
  listing_id: string
  listing_title: string
  listing_price: number
  listing_image_url: string | null
  buyer_id: string
  seller_id: string
  last_message_at: string
  last_message_preview: string | null
  buyer_unread_count: number
  seller_unread_count: number
  buyer_archived: boolean
  seller_archived: boolean
  buyer_name: string
  buyer_avatar_url: string | null
  seller_name: string
  seller_avatar_url: string | null
}

/**
 * GET /api/messaging/conversations-optimized
 * Query params:
 * - limit: Number of conversations to return (default: 20)
 * - offset: Offset for pagination (default: 0)
 * - archived: Include archived conversations (default: false)
 */
export async function GET(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.conversations_optimized.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/messaging/conversations-optimized')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/conversations-optimized', durationMs)
    performanceMonitor.incrementCounter(`messaging.conversations_optimized.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/messaging/conversations-optimized', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/messaging/conversations-optimized', new Error(reason), logContext)
    }

    return response
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    const authStart = performance.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'messaging-conversations-optimized'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const includeArchived = searchParams.get('archived') === 'true'

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return finish('failure', NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      ), { reason: 'invalid-limit', limit })
    }

    if (offset < 0) {
      return finish('failure', NextResponse.json(
        { error: 'Offset must be >= 0' },
        { status: 400 }
      ), { reason: 'invalid-offset', offset })
    }

    // Fetch conversations with profile data via view
    const query = supabase
      .from('conversation_details')
      .select(`
        id,
        listing_id,
        listing_title,
        listing_price,
        listing_image_url,
        buyer_id,
        seller_id,
        last_message_at,
        last_message_preview,
        buyer_unread_count,
        seller_unread_count,
        buyer_archived,
        seller_archived,
        buyer_name,
        buyer_avatar_url,
        seller_name,
        seller_avatar_url
      `, { count: 'exact' })
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('is_active', true)

    // Apply archived filter
    if (!includeArchived) {
      query.or(`buyer_archived.eq.false,seller_archived.eq.false`)
    }

    const conversationsStart = performance.now()
    const { data: conversations, error, count } = await query
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)
    const conversationsDuration = performance.now() - conversationsStart
    logger.db.query('conversation_details.fetch_paginated', {
      durationMs: Math.round(conversationsDuration),
      userId: user.id,
      limit,
      offset
    })
    performanceMonitor.trackDatabaseQuery('conversation_details.fetch_paginated', conversationsDuration)

    if (error) {
      logger.error('Database error fetching conversations', error, { userId: user.id, limit, offset })
      return finish('failure', NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      ), { reason: 'supabase-error', code: error.code, userId: user.id })
    }

    // Transform to flat structure with profile data
    const transformedConversations: ConversationResponse[] = (conversations || []).map(conv => ({
      id: conv.id,
      listing_id: conv.listing_id,
      listing_title: conv.listing_title,
      listing_price: conv.listing_price,
      listing_image_url: conv.listing_image_url,
      buyer_id: conv.buyer_id,
      seller_id: conv.seller_id,
      last_message_at: conv.last_message_at,
      last_message_preview: conv.last_message_preview,
      buyer_unread_count: conv.buyer_unread_count || 0,
      seller_unread_count: conv.seller_unread_count || 0,
      buyer_archived: conv.buyer_archived || false,
      seller_archived: conv.seller_archived || false,
      buyer_name: conv.buyer_name || 'Unknown User',
      buyer_avatar_url: conv.buyer_avatar_url || null,
      seller_name: conv.seller_name || 'Unknown User',
      seller_avatar_url: conv.seller_avatar_url || null,
    }))

    performanceMonitor.incrementCounter('messaging.conversations_optimized.results', transformedConversations.length, { type: 'conversations' })
    return finish('success', NextResponse.json({
      conversations: transformedConversations,
      pagination: {
        limit,
        offset,
        total: count,
        hasMore: count ? offset + limit < count : false
      }
    }), {
      userId: user.id,
      returned: transformedConversations.length,
      limit,
      offset
    })

  } catch (error) {
    logger.error('GET /api/messaging/conversations-optimized error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}
