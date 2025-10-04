/**
 * Optimized Conversations API
 * Handles conversation creation and retrieval with proper authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/messaging/auth'
import {
  getUserConversations,
  createOrGetConversation,
  getListingInfo,
  logPerformanceMetric
} from '@/lib/messaging/database'

/**
 * GET /api/messaging/conversations
 * Retrieve user's conversations with optimized query
 */
export async function GET(request: NextRequest) {
  const startTime = Date.now()

  try {
    // Authenticate user
    const { user, error: authError } = await getAuthenticatedUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: authError || 'Authentication required' },
        { status: 401 }
      )
    }

    // Get conversations
    const conversations = await getUserConversations(user.id)

    // Log performance
    await logPerformanceMetric(
      'get_conversations',
      Date.now() - startTime,
      user.id
    )

    return NextResponse.json({
      conversations,
      count: conversations.length
    })

  } catch (error) {
    console.error('GET /api/messaging/conversations error:', error)

    // Log performance for failed request
    await logPerformanceMetric(
      'get_conversations_error',
      Date.now() - startTime
    )

    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messaging/conversations
 * Create or retrieve existing conversation
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()

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
    const { listing_id, seller_id, initial_message } = await request.json()

    // Validate required fields
    if (!listing_id || !seller_id) {
      return NextResponse.json(
        { error: 'Missing required fields: listing_id, seller_id' },
        { status: 400 }
      )
    }

    // Prevent self-messaging
    if (seller_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot message yourself' },
        { status: 400 }
      )
    }

    // Get listing information
    const listing = await getListingInfo(listing_id)
    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Create or get conversation
    const result = await createOrGetConversation({
      listing_id,
      listing_title: listing.title,
      listing_price: listing.price,
      listing_image_url: listing.primary_image_url || listing.image_url,
      buyer_id: user.id,
      seller_id,
      initial_message
    })

    // Log performance
    await logPerformanceMetric(
      'create_conversation',
      Date.now() - startTime,
      user.id,
      result.conversation_id
    )

    return NextResponse.json(result)

  } catch (error) {
    console.error('POST /api/messaging/conversations error:', error)

    // Log performance for failed request
    await logPerformanceMetric(
      'create_conversation_error',
      Date.now() - startTime
    )

    const errorMessage = error instanceof Error ? error.message : 'Failed to create conversation'
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    )
  }
}