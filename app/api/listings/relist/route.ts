import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get listing ID from request body
    const { listingId } = await request.json()
    
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
    
    if (fetchError || !listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (listing.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to modify this listing' },
        { status: 403 }
      )
    }

    // Check if listing is sold (only sold listings can be relisted)
    if (listing.status !== 'sold') {
      return NextResponse.json(
        { error: 'Only sold listings can be relisted' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update the listing status to pending (under review)
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'pending',
        reactivated_at: now.toISOString(),
        updated_at: now.toISOString(),
        sold_at: null,  // Clear sold timestamp
        is_paused: false,
        pause_date: null
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      console.error('Error relisting:', updateError)
      return NextResponse.json(
        { error: 'Failed to relist' },
        { status: 500 }
      )
    }

    // Log the action
    await supabase
      .from('listing_actions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        action: 'relisted',
        created_at: now.toISOString()
      })
      .catch(err => console.error('Failed to log relist action:', err))

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing relisted successfully! It will be reviewed by our team.'
    })
    
  } catch (error) {
    console.error('Error in relist endpoint:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}