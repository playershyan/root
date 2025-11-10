import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    logger.debug('Mark-sold API - Auth check', { userId: user?.id, hasError: !!authError })

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get listing ID from request body
    const { listingId } = await request.json()
    logger.debug('Mark-sold API - Request received', { listingId, userId: user.id })
    
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

    logger.debug('Mark-sold API - Database query result', { hasListing: !!listing, hasError: !!fetchError })

    if (fetchError || !listing) {
      logger.warn('Mark-sold API - Listing not found', { listingId, error: fetchError })
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    logger.debug('Mark-sold API - Ownership check', { listingUserId: listing.user_id, currentUserId: user.id })
    if (listing.user_id !== user.id) {
      logger.warn('Mark-sold API - Ownership verification failed', { listingId, userId: user.id })
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
        sold_date: now.toISOString(),
        updated_at: now.toISOString(),
        is_paused: false,  // Clear pause status if it was paused
        pause_date: null
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error('Error marking listing as sold', updateError as Error, { listingId })
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
      logger.error('Failed to log mark as sold action', logError as Error, { listingId })
    }

    logger.info('Listing marked as sold successfully', { listingId, userId: user.id })

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing marked as sold successfully!'
    })

  } catch (error) {
    logger.error('Error in mark as sold endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}