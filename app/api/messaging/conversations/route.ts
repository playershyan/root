/**
 * Optimized Conversations API
 * Handles conversation creation and retrieval with proper authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'
import { getAuthenticatedSupabase } from '@/lib/server/getAuthenticatedSupabase'

/**
 * GET /api/messaging/conversations
 * Retrieve user's conversations with optimized query
 */
export async function GET(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.conversations.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/messaging/conversations')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/conversations', durationMs)
    performanceMonitor.incrementCounter(`messaging.conversations.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/messaging/conversations', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/messaging/conversations', new Error(reason), logContext)
    }

    return response
  }

  try {
    const authStart = performance.now()
    const { supabase, user, error: authError } = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'messaging-conversations'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    const conversationsStart = performance.now()
    const { data: conversations, error } = await supabase
      .from('conversations')
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
        is_active,
        buyer_archived,
        seller_archived,
        created_at,
        updated_at
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })
    const conversationsDuration = performance.now() - conversationsStart
    logger.db.query('conversations.fetch_all', {
      durationMs: Math.round(conversationsDuration),
      userId: user.id
    })
    performanceMonitor.trackDatabaseQuery('conversations.fetch_all', conversationsDuration)

    if (error) {
      logger.error('Database error fetching conversations', error as Error)
      return finish('failure', NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      ), { reason: 'supabase-error', code: error.code, userId: user.id })
    }

    const count = conversations?.length || 0
    performanceMonitor.incrementCounter('messaging.conversations.results', count, { type: 'conversations' })
    return finish('success', NextResponse.json({
      conversations: conversations || [],
      count
    }), { userId: user.id, returned: count })

  } catch (error) {
    logger.error('GET /api/messaging/conversations error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}

/**
 * POST /api/messaging/conversations
 * Create or retrieve existing conversation
 */
export async function POST(request: NextRequest) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.conversations.requests', 1, { method: 'POST' })
  logger.api.request('POST', '/api/messaging/conversations')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/conversations', durationMs)
    performanceMonitor.incrementCounter(`messaging.conversations.${outcome}`, 1, { method: 'POST' })

    if (outcome === 'success') {
      logger.api.success('POST', '/api/messaging/conversations', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('POST', '/api/messaging/conversations', new Error(reason), logContext)
    }

    return response
  }

  try {
    const authStart = performance.now()
    const { supabase, user, error: authError } = await getAuthenticatedSupabase({ request })
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'messaging-conversations'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    const { listing_id, seller_id, initial_message } = await request.json()

    // Validate required fields
    if (!listing_id || !seller_id) {
      return finish('failure', NextResponse.json(
        { error: 'Missing required fields: listing_id, seller_id' },
        { status: 400 }
      ), { reason: 'missing-fields' })
    }

    // Prevent self-messaging
    if (seller_id === user.id) {
      return finish('failure', NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      ), { reason: 'self-messaging', userId: user.id })
    }

    // Get listing information
    const listingStart = performance.now()
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, price, primary_image_url, image_url')
      .eq('id', listing_id)
      .single()
    const listingDuration = performance.now() - listingStart
    logger.db.query('listings.fetch_listing_for_conversation', {
      durationMs: Math.round(listingDuration),
      listingId: listing_id
    })
    performanceMonitor.trackDatabaseQuery('listings.fetch_listing_for_conversation', listingDuration)

    if (listingError || !listing) {
      return finish('failure', NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      ), { reason: 'listing-not-found', listingId: listing_id })
    }

    // Check for existing conversation
    const existingStart = performance.now()
    const { data: existingConv, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .eq('seller_id', seller_id)
      .eq('is_active', true)
      .single()
    const existingDuration = performance.now() - existingStart
    logger.db.query('conversations.find_existing', {
      durationMs: Math.round(existingDuration),
      listingId: listing_id,
      buyerId: user.id
    })
    performanceMonitor.trackDatabaseQuery('conversations.find_existing', existingDuration)

    if (existingError && existingError.code !== 'PGRST116') {
      logger.error('Database error checking existing conversation', existingError as Error)
      return finish('failure', NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      ), { reason: 'existing-conversation-error', code: existingError.code })
    }

    if (existingConv) {
      return finish('success', NextResponse.json({
        conversation_id: existingConv.id,
        existing: true
      }), { userId: user.id, conversationId: existingConv.id, existing: true })
    }

    // Create new conversation
    const createConversationStart = performance.now()
    const { data: newConv, error: convError } = await supabase
      .from('conversations')
      .insert({
        listing_id,
        listing_title: listing.title,
        listing_price: listing.price,
        listing_image_url: listing.primary_image_url || listing.image_url,
        buyer_id: user.id,
        seller_id,
        last_message_preview: initial_message ? initial_message.substring(0, 100) : null
      })
      .select('id')
      .single()
    const createConversationDuration = performance.now() - createConversationStart
    logger.db.query('conversations.insert', {
      durationMs: Math.round(createConversationDuration),
      listingId: listing_id,
      buyerId: user.id
    })
    performanceMonitor.trackDatabaseQuery('conversations.insert', createConversationDuration)

    if (convError) {
      logger.error('Database error creating conversation', convError as Error)
      return finish('failure', NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      ), { reason: 'insert-failed', code: convError.code })
    }

    // Create initial message if provided
    if (initial_message && newConv) {
      const initialMessageStart = performance.now()
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: initial_message.trim(),
          message_type: 'text'
        })
      const initialMessageDuration = performance.now() - initialMessageStart
      logger.db.query('messages.insert_initial', {
        durationMs: Math.round(initialMessageDuration),
        conversationId: newConv.id
      })
      performanceMonitor.trackDatabaseQuery('messages.insert_initial', initialMessageDuration)

      if (messageError) {
        logger.error('Error creating initial message', messageError as Error)
        // Don't fail the conversation creation if message creation fails
      }
    }

    performanceMonitor.incrementCounter('messaging.conversations.created', 1, { initialMessage: initial_message ? 'true' : 'false' })
    return finish('success', NextResponse.json({
      conversation_id: newConv.id,
      existing: false
    }), {
      userId: user.id,
      conversationId: newConv.id,
      existing: false
    })

  } catch (error) {
    logger.error('POST /api/messaging/conversations error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}