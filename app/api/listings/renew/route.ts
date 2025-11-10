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

    // First, check if the listing belongs to the user and get its posted date
    const { data: listing, error: fetchError } = await supabase
      .from('listings')
      .select('posted_date, user_id')
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
        { error: 'You do not have permission to renew this listing' },
        { status: 403 }
      )
    }

    // Check if 18 days have passed since posted date
    const postedDate = new Date(listing.posted_date)
    const now = new Date()
    const daysSincePosted = Math.floor((now.getTime() - postedDate.getTime()) / (1000 * 60 * 60 * 24))
    
    if (daysSincePosted < 18) {
      return NextResponse.json(
        { error: `You can renew this listing in ${18 - daysSincePosted} days` },
        { status: 400 }
      )
    }

    // Update the listing's posted_date to now
    const { data: updatedListing, error: updateError } = await supabase
      .from('listings')
      .update({
        posted_date: now.toISOString(),
        updated_at: now.toISOString()
      })
      .eq('id', listingId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error('Error renewing listing', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to renew listing' },
        { status: 500 }
      )
    }

    // Log the renewal action
    const { error: logError } = await supabase
      .from('listing_actions')
      .insert({
        listing_id: listingId,
        user_id: user.id,
        action: 'renewed',
        created_at: now.toISOString()
      })
    
    if (logError) {
      logger.error('Failed to log renewal action', logError as Error)
    }

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      message: 'Listing renewed successfully! It will now appear at the top of search results.'
    })
    
  } catch (error) {
    logger.error('Error in renew listing endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}