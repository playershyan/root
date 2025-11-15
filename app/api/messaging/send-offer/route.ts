import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { performance } from 'perf_hooks'
import { logger } from '@/lib/utils/logger'
import { performanceMonitor } from '@/lib/monitoring/metrics'

export async function POST(request: NextRequest) {
  logger.debug('Send offer API - Starting request')
  const requestStart = performance.now()
  performanceMonitor.incrementCounter('messaging.send_offer.requests', 1, { method: 'POST' })
  logger.api.request('POST', '/api/messaging/send-offer')

  const finish = (
    outcome: 'success' | 'failure',
    response: NextResponse,
    context: Record<string, any> = {}
  ) => {
    const durationMs = Math.round(performance.now() - requestStart)
    const logContext = { ...context, durationMs }
    performanceMonitor.trackApiResponseTime('/api/messaging/send-offer', durationMs)
    performanceMonitor.incrementCounter(`messaging.send_offer.${outcome}`, 1, { method: 'POST' })

    if (outcome === 'success') {
      logger.api.success('POST', '/api/messaging/send-offer', durationMs, logContext)
    } else {
      const reason = context.reason || 'Request failed'
      logger.api.error('POST', '/api/messaging/send-offer', new Error(reason), logContext)
    }

    return response
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the current user
    logger.debug('Send offer API - Getting user')
    const authStart = performance.now()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    const authDuration = performance.now() - authStart
    logger.db.query('supabase.auth.getUser', {
      durationMs: Math.round(authDuration),
      endpoint: 'send-offer'
    })
    performanceMonitor.trackDatabaseQuery('supabase.auth.getUser', authDuration)

    if (authError || !user) {
      logger.error('Send offer API - Auth error', authError)
      return finish('failure', NextResponse.json({ error: 'Unauthorized' }, { status: 401 }), {
        reason: authError?.message || 'unauthorized'
      })
    }

    logger.debug('Send offer API - User authenticated', { userId: user.id, email: user.email })

    const body = await request.json()
    logger.debug('Send offer API - Request body received', { hasListingId: !!body.listingId, hasSellerId: !!body.sellerId })
    
    const { listingId, sellerId, amount, message, listingTitle } = body

    if (!listingId || !sellerId || !amount) {
      logger.warn('Send offer API - Missing required fields')
      return finish('failure', NextResponse.json({ error: 'Missing required fields' }, { status: 400 }), {
        reason: 'missing-fields'
      })
    }

    // Prevent users from making offers on their own listings
    if (user.id === sellerId) {
      logger.warn('Send offer API - User trying to offer on own listing', { userId: user.id, sellerId })
      return finish('failure', NextResponse.json({ error: 'Cannot make offer on your own listing' }, { status: 400 }), {
        reason: 'self-offer',
        userId: user.id
      })
    }

    logger.debug('Send offer API - Validation passed, checking for existing conversation')

    // Check if a conversation already exists between these users for this listing
    let conversationId
    const existingConvStart = performance.now()
    const { data: existingConversation, error: findConversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .maybeSingle()
    const existingConvDuration = performance.now() - existingConvStart
    logger.db.query('conversations.find_for_offer', {
      durationMs: Math.round(existingConvDuration),
      listingId,
      buyerId: user.id
    })
    performanceMonitor.trackDatabaseQuery('conversations.find_for_offer', existingConvDuration)

    if (findConversationError) {
      logger.error('Send offer API - Error finding conversation', findConversationError as Error)
      return finish('failure', NextResponse.json({
        error: 'Database error finding conversation',
        details: findConversationError.message,
        code: findConversationError.code
      }, { status: 500 }), { reason: 'conversation-query-error', code: findConversationError.code })
    }

    if (existingConversation) {
      logger.debug('Send offer API - Found existing conversation', { conversationId: existingConversation.id })
      conversationId = existingConversation.id
    } else {
      logger.debug('Send offer API - Creating new conversation')
      // Create a new conversation
      const newConversationStart = performance.now()
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          listing_id: listingId,
          listing_title: listingTitle || 'Untitled',
          buyer_id: user.id,
          seller_id: sellerId,
          is_active: true,
          buyer_archived: false,
          seller_archived: false,
          buyer_unread_count: 0,
          seller_unread_count: 1
        })
        .select()
        .single()
      const newConversationDuration = performance.now() - newConversationStart
      logger.db.query('conversations.insert_offer_conversation', {
        durationMs: Math.round(newConversationDuration),
        listingId,
        buyerId: user.id
      })
      performanceMonitor.trackDatabaseQuery('conversations.insert_offer_conversation', newConversationDuration)

      if (conversationError) {
        logger.error('Send offer API - Error creating conversation', conversationError as Error)
        return finish('failure', NextResponse.json({
          error: 'Failed to create conversation',
          details: conversationError.message,
          code: conversationError.code,
          hint: conversationError.hint
        }, { status: 500 }), { reason: 'conversation-insert-failed', code: conversationError.code })
      }

      logger.debug('Send offer API - Created new conversation', { conversationId: newConversation.id })
      conversationId = newConversation.id
    }

    logger.debug('Send offer API - Creating offer record')
    
    // Create the offer record
    const offerStart = performance.now()
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        listing_id: listingId,
        amount: amount,
        message: message || null,
        status: 'pending'
      })
      .select()
      .single()
    const offerDuration = performance.now() - offerStart
    logger.db.query('offers.insert', {
      durationMs: Math.round(offerDuration),
      conversationId,
      senderId: user.id
    })
    performanceMonitor.trackDatabaseQuery('offers.insert', offerDuration)

    if (offerError) {
      logger.error('Send offer API - Error creating offer', offerError as Error)
      return finish('failure', NextResponse.json({ error: 'Failed to create offer' }, { status: 500 }), {
        reason: 'offer-insert-failed',
        code: offerError.code
      })
    }

    logger.info('Send offer API - Created offer', { offerId: offer.id, amount, listingId })

    // Send a message in the conversation with the offer
    logger.debug('Send offer API - Creating offer message')
    
    const offerMessageContent = {
      type: 'offer',
      offerId: offer.id,
      amount,
      message,
      listingTitle,
      status: 'pending'
    }
    
    const messageStart = performance.now()
    const { data: messageRecord, error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Made an offer of Rs. ${amount.toLocaleString()}${message ? `: ${message}` : ''}`,
        message_type: 'offer',
        offer_data: offerMessageContent
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
    const messageDuration = performance.now() - messageStart
    logger.db.query('messages.insert_offer_message', {
      durationMs: Math.round(messageDuration),
      conversationId,
      senderId: user.id
    })
    performanceMonitor.trackDatabaseQuery('messages.insert_offer_message', messageDuration)

    if (messageError) {
      logger.error('Send offer API - Error sending offer message', messageError as Error)
      return finish('failure', NextResponse.json({ error: 'Failed to send offer message' }, { status: 500 }), {
        reason: 'offer-message-failed',
        code: messageError.code
      })
    }

    logger.debug('Send offer API - Created offer message', { messageId: messageRecord?.id })

    // Link offer to message for realtime status updates
    if (messageRecord?.id) {
      const { error: linkError } = await supabase
        .from('offers')
        .update({
          message_id: messageRecord.id,
          updated_at: new Date().toISOString()
        })
        .eq('id', offer.id)

      if (linkError) {
        logger.error('Send offer API - Error linking offer to message', linkError as Error, {
          offerId: offer.id,
          messageId: messageRecord.id
        })
      }
    }

    // Update conversation last activity
    const updateStart = performance.now()
    await supabase
      .from('conversations')
      .update({
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
    const updateDuration = performance.now() - updateStart
    logger.db.query('conversations.update_after_offer', {
      durationMs: Math.round(updateDuration),
      conversationId
    })
    performanceMonitor.trackDatabaseQuery('conversations.update_after_offer', updateDuration)

    logger.info('Send offer API - Success', { offerId: offer.id, conversationId })
    performanceMonitor.incrementCounter('messaging.send_offer.offers_created', 1, { status: 'success' })

    return finish('success', NextResponse.json({
      success: true,
      offerId: offer.id,
      conversationId,
      message: messageRecord
    }), {
      offerId: offer.id,
      conversationId,
      userId: user.id
    })

  } catch (error) {
    logger.error('Send offer API - Unexpected error', error as Error)
    
    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error && 'details' in error ? (error as any).details : undefined
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined
    
    return finish('failure', NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: errorDetails,
      code: errorCode
    }, { status: 500 }), { reason: errorMessage || 'unexpected-error', code: errorCode })
  }
}