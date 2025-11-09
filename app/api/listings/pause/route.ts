import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    logger.debug('Pause API - Auth check', { userId: user?.id, hasError: !!authError })

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get listing ID and action from request body
    const { listingId, action } = await request.json()
    logger.debug('Pause API - Request received', { listingId, action, userId: user.id })
    
    if (!listingId || !action || !['pause', 'resume'].includes(action)) {
      return NextResponse.json(
        { error: 'Listing ID and valid action (pause/resume) are required' },
        { status: 400 }
      )
    }

    // First, check if the listing belongs to the user
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('user_id, status, is_paused, posted_date, pause_date')
      .eq('id', listingId)
      .single()

    logger.debug('Pause API - Database query result', { hasListing: !!listing, hasError: !!fetchError })

    if (fetchError || !listing) {
      logger.warn('Pause API - Listing not found', { listingId, error: fetchError })
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

    const now = new Date()
    let updateData: any = {
      updated_at: now.toISOString()
    }

    if (action === 'pause') {
      // Check if listing can be paused (must be active)
      if (listing.status !== 'active') {
        return NextResponse.json(
          { error: 'Only active listings can be paused' },
          { status: 400 }
        )
      }

      // Check if already paused
      if (listing.is_paused) {
        return NextResponse.json(
          { error: 'Listing is already paused' },
          { status: 400 }
        )
      }

      updateData.status = 'pending'
      updateData.is_paused = true
      updateData.pause_date = now.toISOString()
    } else { // resume
      // Check if listing is currently paused
      if (!listing.is_paused) {
        return NextResponse.json(
          { error: 'Only paused listings can be resumed' },
          { status: 400 }
        )
      }

      // When resuming, check if the listing had been active before pause
      // If it was under review (pending) when paused, keep it pending
      // If it was active, make it active again
      updateData.status = 'active'  // Default to active when resuming
      updateData.is_paused = false
      updateData.pause_date = null
      // Note: We don't update posted_date when resuming (preserves original date for renewal calculation)
    }

    // Update the listing
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update(updateData)
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (updateError) {
      logger.error(`Error ${action}ing listing`, updateError as Error, { listingId, action })
      return NextResponse.json(
        { error: `Failed to ${action} listing` },
        { status: 500 }
      )
    }

    // Log the action
    const { error: logError } = await supabase
      .from('listing_actions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        action: action === 'pause' ? 'paused' : 'resumed',
        created_at: now.toISOString()
      })

    if (logError) {
      logger.error(`Failed to log ${action} action`, logError as Error, { listingId })
    }

    logger.info(`Listing ${action}d successfully`, { listingId, userId: user.id })

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: action === 'pause'
        ? 'Ad paused successfully. It will not appear in search results.'
        : 'Ad resumed successfully! It is now visible to buyers again.'
    })

  } catch (error) {
    logger.error('Error in pause/resume listing endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}