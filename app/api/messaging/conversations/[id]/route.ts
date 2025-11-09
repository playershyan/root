/**
 * Individual Conversation API
 * Handles messages for a specific conversation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'

/**
 * GET /api/messaging/conversations/[id]
 * Get messages for a specific conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.conversation_detail.requests', 1, { method: 'GET' })
  logger.api.request('GET', '/api/messaging/conversations/[id]', { conversationId: params.id })

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/conversations/[id]', durationMs)
    performanceMonitor.incrementCounter(`messaging.conversation_detail.${outcome}`, 1, { method: 'GET' })

    if (outcome === 'success') {
      logger.api.success('GET', '/api/messaging/conversations/[id]', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('GET', '/api/messaging/conversations/[id]', new Error(reason), logContext)
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
      endpoint: 'messaging-conversation-detail'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    const conversationId = params.id

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

    // Get messages
    const messagesStart = performance.now()
    const { data: messages, error: msgError } = await supabase
      .from('messages')
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        read_at,
        created_at,
        updated_at,
        status,
        message_type,
        offer_data
      `)
      .eq('conversation_id', conversationId)
      .eq('status', 'active')
      .order('created_at', { ascending: true })
    const messagesDuration = performance.now() - messagesStart
    logger.db.query('messages.fetch_conversation', {
      durationMs: Math.round(messagesDuration),
      conversationId
    })
    performanceMonitor.trackDatabaseQuery('messages.fetch_conversation', messagesDuration)

    if (msgError) {
      logger.error('Error fetching messages', msgError as Error)
      return finish('failure', NextResponse.json(
        { error: 'Failed to fetch messages' },
        { status: 500 }
      ), { reason: 'messages-query-error', code: msgError.code, conversationId })
    }

    const count = messages?.length || 0
    performanceMonitor.incrementCounter('messaging.conversation_detail.results', count, { type: 'messages' })
    return finish('success', NextResponse.json({
      messages: messages || []
    }), { conversationId, returned: count })

  } catch (error) {
    logger.error('GET conversation error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}

/**
 * POST /api/messaging/conversations/[id]
 * Send a new message to a conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.conversation_detail.requests', 1, { method: 'POST' })
  logger.api.request('POST', '/api/messaging/conversations/[id]', { conversationId: params.id })

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/conversations/[id]', durationMs)
    performanceMonitor.incrementCounter(`messaging.conversation_detail.${outcome}`, 1, { method: 'POST' })

    if (outcome === 'success') {
      logger.api.success('POST', '/api/messaging/conversations/[id]', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('POST', '/api/messaging/conversations/[id]', new Error(reason), logContext)
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
      endpoint: 'messaging-conversation-detail'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)
    if (authError || !user) {
      return finish('failure', NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      ), { reason: authError?.message || 'unauthorized' })
    }

    const conversationId = params.id
    const { content } = await request.json()

    if (!content || !content.trim()) {
      return finish('failure', NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      ), { reason: 'missing-content' })
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

    // Create message using service role to bypass RLS
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const insertStart = performance.now()
    const { data: message, error: msgError } = await supabaseAdmin
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: content.trim(),
        message_type: 'text'
      })
      .select(`
        id,
        conversation_id,
        sender_id,
        content,
        is_read,
        read_at,
        created_at,
        updated_at,
        status,
        message_type,
        offer_data
      `)
      .single()
    const insertDuration = performance.now() - insertStart
    logger.db.query('messages.insert', {
      durationMs: Math.round(insertDuration),
      conversationId,
      senderId: user.id
    })
    performanceMonitor.trackDatabaseQuery('messages.insert', insertDuration)

    if (msgError) {
      logger.error('Detailed message error', msgError as Error, {
        code: msgError.code,
        details: msgError.details,
        hint: msgError.hint,
        message: msgError.message,
        userId: user.id,
        conversationId
      })
      return finish('failure', NextResponse.json(
        { error: 'Failed to send message' },
        { status: 500 }
      ), { reason: 'message-insert-failed', code: msgError.code })
    }

    // Update conversation last message info
    const updateStart = performance.now()
    const { error: updateError } = await supabaseAdmin
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        last_message_preview: content.trim().substring(0, 100),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
    const updateDuration = performance.now() - updateStart
    logger.db.query('conversations.update_last_message', {
      durationMs: Math.round(updateDuration),
      conversationId
    })
    performanceMonitor.trackDatabaseQuery('conversations.update_last_message', updateDuration)

    if (updateError) {
      logger.error('Error updating conversation', updateError as Error)
      // Don't fail the message creation if conversation update fails
    }

    performanceMonitor.incrementCounter('messaging.conversation_detail.messages_created', 1, { method: 'POST' })
    return finish('success', NextResponse.json({
      message
    }), { conversationId, userId: user.id, messageId: message?.id })

  } catch (error) {
    logger.error('POST conversation error', error as Error)
    return finish('failure', NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    ), { reason: (error as Error).message })
  }
}