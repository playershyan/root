/**
 * Optimized Conversation Messages API
 * Handles message retrieval and creation with proper authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser, verifyConversationAccess } from '@/lib/messaging/auth'
import {
  getConversationWithMessages,
  createMessage,
  logPerformanceMetric
} from '@/lib/messaging/database'

/**
 * GET /api/messaging/conversations/[conversationId]
 * Retrieve conversation with messages
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now()
  const conversationId = params.conversationId

  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    // Verify user has access to this conversation
    const hasAccess = await verifyConversationAccess(conversationId, user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Get conversation with messages
    const result = await getConversationWithMessages(conversationId, user.id)
    if (!result) {
      return NextResponse.json(
        { error: 'Conversation not found' },
        { status: 404 }
      )
    }

    // Log performance
    await logPerformanceMetric(
      'get_conversation_messages',
      Date.now() - startTime,
      user.id,
      conversationId
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error(`GET /api/messaging/conversations/${conversationId} error:`, error)

    // Log performance for failed request
    await logPerformanceMetric(
      'get_conversation_messages_error',
      Date.now() - startTime,
      undefined,
      conversationId
    )

    const errorMessage = error instanceof Error ? error.message : 'Failed to fetch conversation'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messaging/conversations/[conversationId]
 * Send a new message in conversation
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { conversationId: string } }
) {
  const startTime = Date.now()
  const conversationId = params.conversationId

  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse request body
    const { content, message_type, offer_data } = await request.json()

    // Validate content
    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message content is required' },
        { status: 400 }
      )
    }

    if (content.length > 2000) {
      return NextResponse.json(
        { error: 'Message content too long (max 2000 characters)' },
        { status: 400 }
      )
    }

    // Verify user has access to this conversation
    const hasAccess = await verifyConversationAccess(conversationId, user.id)
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Conversation not found or access denied' },
        { status: 404 }
      )
    }

    // Create message
    const message = await createMessage({
      conversation_id: conversationId,
      sender_id: user.id,
      content: content.trim(),
      message_type,
      offer_data
    })

    // Log performance
    await logPerformanceMetric(
      'send_message',
      Date.now() - startTime,
      user.id,
      conversationId
    )

    return NextResponse.json({ message })

  } catch (error) {
    console.error(`POST /api/messaging/conversations/${conversationId} error:`, error)

    // Log performance for failed request
    await logPerformanceMetric(
      'send_message_error',
      Date.now() - startTime,
      undefined,
      conversationId
    )

    const errorMessage = error instanceof Error ? error.message : 'Failed to send message'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}