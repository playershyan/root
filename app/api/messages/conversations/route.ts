import { NextRequest, NextResponse } from 'next/server'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { createAuthenticatedSupabaseClient } from '@/lib/supabase-server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Authenticated user:', user.id)

    // Fetch conversations for the user
    const { data: conversations, error } = await supabase
      .from('conversations')
      .select(`
        *,
        buyer:buyer_id(id, email, profiles(name, avatar_url)),
        seller:seller_id(id, email, profiles(name, avatar_url))
      `)
      .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
      .eq('is_active', true)
      .order('last_message_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    // Mark which role the current user has in each conversation
    const conversationsWithRole = conversations?.map(conv => ({
      ...conv,
      current_user_role: conv.buyer_id === user.id ? 'buyer' : 'seller',
      unread_count: conv.buyer_id === user.id ? conv.buyer_unread_count : conv.seller_unread_count,
      is_archived: conv.buyer_id === user.id ? conv.buyer_archived : conv.seller_archived
    }))

    return NextResponse.json({ conversations: conversationsWithRole })
  } catch (error) {
    console.error('Error in GET /api/messages/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerComponentClient({ cookies })

    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      console.error('POST Authentication error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('POST Authenticated user:', user.id)

    const { listing_id, seller_id, initial_message } = await request.json()

    if (!listing_id || !seller_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent users from messaging themselves
    if (seller_id === user.id) {
      return NextResponse.json({ error: 'Cannot message yourself' }, { status: 400 })
    }

    // Get listing details
    const { data: listing, error: listingError } = await supabase
      .from('listings')
      .select('id, title, price, image_url, primary_image_url')
      .eq('id', listing_id)
      .single()

    if (listingError || !listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Check if conversation already exists
    const { data: existingConv, error: existingError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listing_id)
      .eq('buyer_id', user.id)
      .eq('seller_id', seller_id)
      .single()

    if (existingError && existingError.code !== 'PGRST116') {
      console.error('Error checking existing conversation:', existingError)
      return NextResponse.json({ error: 'Database error' }, { status: 500 })
    }

    if (existingConv) {
      // Return existing conversation
      return NextResponse.json({ conversation_id: existingConv.id, existing: true })
    }

    console.log('Creating new conversation for listing:', listing_id)

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
      .select()
      .single()

    if (convError) {
      console.error('Error creating conversation:', convError)
      return NextResponse.json({ error: `Failed to create conversation: ${convError.message}` }, { status: 500 })
    }

    // If initial message provided, create it
    if (initial_message && newConv) {
      const { error: msgError } = await supabase
        .from('messages')
        .insert({
          conversation_id: newConv.id,
          sender_id: user.id,
          content: initial_message
        })

      if (msgError) {
        console.error('Error creating initial message:', msgError)
      }
    }

    return NextResponse.json({ conversation_id: newConv.id, existing: false })
  } catch (error) {
    console.error('Error in POST /api/messages/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}