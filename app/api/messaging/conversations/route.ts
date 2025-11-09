/**
 * Optimized Conversations API
 * Handles conversation creation and retrieval with proper authentication
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

/**
 * GET /api/messaging/conversations
 * Retrieve user's conversations with optimized query
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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

    if (error) {
      logger.error('Database error fetching conversations', error as Error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      conversations: conversations || [],
      count: conversations?.length || 0
    })

  } catch (error) {
    logger.error('GET /api/messaging/conversations error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messaging/conversations
 * Create or retrieve existing conversation
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

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
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, price, primary_image_url, image_url')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check for existing conversation
    const { data: existingConv, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .eq('seller_id', seller_id)
      .eq('is_active', true)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      logger.error('Database error checking existing conversation', existingError as Error)
      return NextResponse.json(
        { error: 'Database error' },
        { status: 500 }
      )
    }

    if (existingConv) {
      return NextResponse.json({
        conversation_id: existingConv.id,
        existing: true
      })
    }

    // Create new conversation
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

    if (convError) {
      logger.error('Database error creating conversation', convError as Error)
      return NextResponse.json(
        { error: 'Failed to create conversation' },
        { status: 500 }
      )
    }

    // Create initial message if provided
    if (initial_message && newConv) {
      const { error: messageError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: initial_message.trim(),
          message_type: 'text'
        })

      if (messageError) {
        logger.error('Error creating initial message', messageError as Error)
        // Don't fail the conversation creation if message creation fails
      }
    }

    return NextResponse.json({
      conversation_id: newConv.id,
      existing: false
    })

  } catch (error) {
    logger.error('POST /api/messaging/conversations error', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}