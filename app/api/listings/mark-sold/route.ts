import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    console.log('[MARK-SOLD API] Auth user:', user?.id, 'Auth error:', authError)

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get listing ID from request body
    const { listingId } = await request.json()
    console.log('[MARK-SOLD API] Received listingId:', listingId, 'userId:', user.id)
    
    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // First, check if the listing belongs to the user and get its current status
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id, status')
      .eq('id', listingId)
      .single()

    console.log('[MARK-SOLD API] Database query result:', { listing, fetchError })

    if (fetchError || !listing) {
      console.log('[MARK-SOLD API] Listing not found. Error:', fetchError)
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    console.log('[MARK-SOLD API] Ownership check:', { listingUserId: listing.user_id, currentUserId: user.id })
    if (listing.user_id !== user.id) {
      console.log('[MARK-SOLD API] Ownership verification failed')
      return NextResponse.json(
        { error: 'You do not have permission to modify this listing' },
        { status: 403 }
      )
    }

    // Check if listing is in a valid state to be marked as sold
    if (listing.status !== 'active' && listing.status !== 'pending') {
      return NextResponse.json(
        { error: 'Only active or paused listings can be marked as sold' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update the listing status to sold
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'sold',
        sold_at: now.toISOString(),
        updated_at: now.toISOString(),
        is_paused: false,  // Clear pause status if it was paused
        pause_date: null
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error marking listing as sold:', updateError)
      return NextResponse.json(
        { error: 'Failed to mark listing as sold' },
        { status: 500 }
      )
    }

    // Log the action
    const { error: logError } = await supabase
      .from('listing_actions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        action: 'marked_as_sold',
        created_at: now.toISOString()
      })
    
    if (logError) {
      console.error('Failed to log mark as sold action:', logError)
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing marked as sold successfully!'
    })
    
  } catch (error) {
    console.error('Error in mark as sold endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}