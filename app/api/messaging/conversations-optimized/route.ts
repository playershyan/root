/**
 * Optimized Conversations API - Single Query with Pagination
 * Industry Best Practices:
 * - Single JOIN query (no N+1)
 * - Pagination support
 * - Server-side transformation
 * - Efficient data structure
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

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
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const includeArchived = searchParams.get('archived') === 'true'

    // Validate pagination params
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        { error: 'Limit must be between 1 and 100' },
        { status: 400 }
      )
    }

    if (offset < 0) {
      return NextResponse.json(
        { error: 'Offset must be >= 0' },
        { status: 400 }
      )
    }

    // Single optimized query with JOINs - NO N+1 queries
    // This fetches conversations with buyer and seller profiles in ONE query
    const query = supabase
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
        buyer_archived,
        seller_archived,
        buyer:profiles!buyer_id(name, avatar_url),
        seller:profiles!seller_id(name, avatar_url)
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('is_active', true)

    // Apply archived filter
    if (!includeArchived) {
      query.or(`buyer_archived.eq.false,seller_archived.eq.false`)
    }

    const { data: conversations, error, count } = await query
      .order('last_message_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch conversations' },
        { status: 500 }
      )
    }

    // Transform to flat structure - server-side transformation is faster
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
      buyer_name: (conv.buyer as any)?.name || 'Unknown User',
      buyer_avatar_url: (conv.buyer as any)?.avatar_url || null,
      seller_name: (conv.seller as any)?.name || 'Unknown User',
      seller_avatar_url: (conv.seller as any)?.avatar_url || null,
    }))

    return NextResponse.json({
      conversations: transformedConversations,
      pagination: {
        limit,
        offset,
        total: count,
        hasMore: count ? offset + limit < count : false
      }
    })

  } catch (error) {
    console.error('GET /api/messaging/conversations-optimized error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
