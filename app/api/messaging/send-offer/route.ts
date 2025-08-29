import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  console.log('Send offer API - Starting request')
  
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    console.log('Send offer API - Getting user')
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      console.log('Send offer API - Auth error:', authError)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Send offer API - User authenticated:', user.email)

    const body = await request.json()
    console.log('Send offer API - Request body:', body)
    
    const { listingId, sellerId, amount, message, listingTitle } = body

    if (!listingId || !sellerId || !amount) {
      console.log('Send offer API - Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent users from making offers on their own listings
    if (user.id === sellerId) {
      console.log('Send offer API - User trying to offer on own listing')
      return NextResponse.json({ error: 'Cannot make offer on your own listing' }, { status: 400 })
    }

    console.log('Send offer API - Validation passed, checking for existing conversation')

    // Check if a conversation already exists between these users for this listing
    let conversationId
    const { data: existingConversation, error: findConversationError } = await supabase
      .from('conversations')
      .select('id')
      .eq('listing_id', listingId)
      .eq('buyer_id', user.id)
      .eq('seller_id', sellerId)
      .maybeSingle()

    if (findConversationError) {
      console.error('Send offer API - Error finding conversation:', findConversationError)
      return NextResponse.json({ 
        error: 'Database error finding conversation',
        details: findConversationError.message,
        code: findConversationError.code
      }, { status: 500 })
    }

    if (existingConversation) {
      console.log('Send offer API - Found existing conversation:', existingConversation.id)
      conversationId = existingConversation.id
    } else {
      console.log('Send offer API - Creating new conversation')
      // Create a new conversation
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

      if (conversationError) {
        console.error('Send offer API - Error creating conversation:', conversationError)
        return NextResponse.json({ 
          error: 'Failed to create conversation',
          details: conversationError.message,
          code: conversationError.code,
          hint: conversationError.hint
        }, { status: 500 })
      }

      console.log('Send offer API - Created new conversation:', newConversation.id)
      conversationId = newConversation.id
    }

    console.log('Send offer API - Creating offer record')
    
    // Create the offer record
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

    if (offerError) {
      console.error('Send offer API - Error creating offer:', offerError)
      return NextResponse.json({ error: 'Failed to create offer' }, { status: 500 })
    }

    console.log('Send offer API - Created offer:', offer.id)

    // Send a message in the conversation with the offer
    console.log('Send offer API - Creating offer message')
    
    const offerMessageContent = {
      type: 'offer',
      offerId: offer.id,
      amount,
      message,
      listingTitle
    }

    const { error: messageError } = await supabase
      .from('messages')
      .insert({
        conversation_id: conversationId,
        sender_id: user.id,
        content: `Made an offer of Rs. ${amount.toLocaleString()}${message ? `: ${message}` : ''}`,
        message_type: 'offer',
        offer_data: offerMessageContent
      })

    if (messageError) {
      console.error('Send offer API - Error sending offer message:', messageError)
      return NextResponse.json({ error: 'Failed to send offer message' }, { status: 500 })
    }

    console.log('Send offer API - Created offer message')

    // Update conversation last activity
    await supabase
      .from('conversations')
      .update({ 
        last_message_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)

    console.log('Send offer API - Success!')

    return NextResponse.json({ 
      success: true, 
      offerId: offer.id,
      conversationId 
    })

  } catch (error) {
    console.error('Send offer API - Unexpected error:', error)
    
    // More detailed error response for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorDetails = error instanceof Error && 'details' in error ? (error as any).details : undefined
    const errorCode = error instanceof Error && 'code' in error ? (error as any).code : undefined
    
    return NextResponse.json({ 
      error: 'Internal server error',
      message: errorMessage,
      details: errorDetails,
      code: errorCode
    }, { status: 500 })
  }
}