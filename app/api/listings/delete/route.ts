import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

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

    // First, check if the listing belongs to the user
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
        { error: 'You do not have permission to delete this listing' },
        { status: 403 }
      )
    }

    // Check if listing is already deleted
    if (listing.status === 'deleted') {
      return NextResponse.json(
        { error: 'Listing is already deleted' },
        { status: 400 }
      )
    }

    const now = new Date()

    // Update the listing status to deleted (soft delete)
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'deleted',
        deleted_at: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error('Error deleting listing', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to delete listing' },
        { status: 500 }
      )
    }

    // Log the deletion action
    const { error: logError } = await supabase
      .from('listing_actions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        action: 'deleted',
        created_at: now.toISOString()
      })
    
    if (logError) {
      logger.error('Failed to log deletion action', logError as Error)
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing moved to bin successfully!'
    })
    
  } catch (error) {
    logger.error('Error in delete listing endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}