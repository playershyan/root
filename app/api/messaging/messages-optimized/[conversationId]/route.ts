/**
 * Optimized Messages API - Single Query with Pagination
 * Industry Best Practices:
 * - Single JOIN query (no N+1)
 * - Pagination (load last N messages)
 * - Server-side transformation
 * - Automatic mark-as-read on fetch
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'

interface MessageResponse {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  is_read: boolean
  created_at: string
  message_type: string
  offer_data: any | null
  sender_name: string
  sender_avatar_url: string | null
}

/**
 * GET /api/messaging/messages-optimized/[conversationId]
 * Query params:
 * - limit: Number of messages to return (default: 50)
 * - before: Load messages before this timestamp (for pagination)
 * - markAsRead: Auto mark as read (default: true)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.messages_optimized.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/messaging/messages-optimized/[conversationId]', {
    conversationId: params.conversationId
  })

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/messages-optimized', durationMs)
    performanceMonitor.incrementCounter(`messaging.messages_optimized.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/messaging/messages-optimized/[conversationId]', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/messaging/messages-optimized/[conversationId]', new Error(reason), logContext)
    }

    return response
  }

  try {
    const supabase = createServerComponentClient({ cookies })

    const authStart = performance.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'messaging-messages-optimized'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    const conversationId = params.conversationId
    const searchParams = request.nextUrl.searchParams
    const limit = Math.min(parseInt(searchParams.get('limit') || '30', 10), 200)
    const before = searchParams.get('before') // ISO timestamp for pagination
    const markAsRead = searchParams.get('markAsRead') !== 'false'

    // Validate limit
    if (limit < 1 || limit > 200) {
      return finish('failure', NextResponse.json(
        { error: 'Limit must be between 1 and 200' },
        { status: 400 }
      ), { reason: 'invalid-limit', limit })
    }

    // Verify user has access to this conversation
    const conversationStart = performance.now()
    const { data: conversation, error: convError } = await supabase
      .from('conversations')
      .select('buyer_id, seller_id')
      .eq('id', conversationId)
      .single()
    const conversationDuration = performance.now() - conversationStart
    logger.db.query('conversations.fetch_single', {
      durationMs: Math.round(conversationDuration),
      conversationId
    })
    performanceMonitor.trackDatabaseQuery('conversations.fetch_single', conversationDuration)

    if (convError || !conversation) {
      return finish('failure', NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      ), { reason: 'conversation-not-found', conversationId })
    }

    if (conversation.buyer_id !== user.id && conversation.seller_id !== user.id) {
      return finish('failure', NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      ), { reason: 'access-denied', conversationId, userId: user.id })
    }

    // Fetch messages (with sender profile data from view)
    let query = supabase
      .from('message_details')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        created_at,
        message_type,
        offer_data,
        sender_name,
        sender_avatar_url
      `)
      .eq('conversation_id', conversationId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(limit)

    // Apply before filter for pagination
    if (before) {
      query = query.lt('created_at', before)
    }

    const messagesStart = performance.now()
    const { data: messages, error: msgError } = await query
    const messagesDuration = performance.now() - messagesStart
    logger.db.query('message_details.fetch_paginated', {
      durationMs: Math.round(messagesDuration),
      conversationId,
      limit
    })
    performanceMonitor.trackDatabaseQuery('message_details.fetch_paginated', messagesDuration)

    if (msgError) {
      logger.error('Error fetching messages', msgError as Error)
      return finish('failure', NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      ), { reason: 'messages-query-error', code: msgError.code, conversationId })
    }

    // Transform to flat structure - server-side is faster than client-side
    const transformedMessages: MessageResponse[] = (messages || []).map(msg => ({
      id: msg.id,
      conversation_id: msg.conversation_id,
      sender_id: msg.sender_id,
      content: msg.content,
      is_read: msg.is_read,
      created_at: msg.created_at,
      message_type: msg.message_type,
      offer_data: msg.offer_data,
      sender_name: msg.sender_name || 'Unknown User',
      sender_avatar_url: msg.sender_avatar_url || null,
    }))

    // Reverse to get chronological order (oldest first)
    transformedMessages.reverse()

    // Auto mark as read (async, don't block response)
    if (markAsRead && transformedMessages.length > 0) {
      // Fire and forget - don't wait for this to complete
      const supabaseAdmin = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      )

      const isBuyer = conversation.buyer_id === user.id

      // Mark unread messages as read
      const markStart = performance.now()
      supabaseAdmin
        .from('messages')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
        .eq('conversation_id', conversationId)
        .eq('sender_id', isBuyer ? conversation.seller_id : conversation.buyer_id)
        .eq('is_read', false)
        .then(() => {
          // Reset unread count
          const updateField = isBuyer ? 'buyer_unread_count' : 'seller_unread_count'
          return supabaseAdmin
            .from('conversations')
            .update({
              [updateField]: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', conversationId)
        })
        .catch(err => logger.error('Error marking as read', err as Error))
        .finally(() => {
          const markDuration = performance.now() - markStart
          logger.db.query('messages.mark_as_read_async', {
            durationMs: Math.round(markDuration),
            conversationId,
            affected: transformedMessages.length
          })
        })
    }

    performanceMonitor.incrementCounter('messaging.messages_optimized.results', transformedMessages.length, { type: 'messages' })
    return finish('success', NextResponse.json({
      messages: transformedMessages,
      count: transformedMessages.length,
      hasMore: transformedMessages.length === limit
    }), {
      conversationId,
      userId: user.id,
      returned: transformedMessages.length,
      limit
    })

  } catch (error) {
    logger.error('GET messages error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}
