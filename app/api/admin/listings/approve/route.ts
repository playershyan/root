import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { processWantedRequestMatching } from '@/lib/services/wantedMatching'
import { incr } from '@/lib/security/metrics'

export async function POST(request: NextRequest) {
  try {
    // Apply rate limiting for admin actions
    const rateLimitResponse = await withRateLimit(request, rateLimiters.admin)
    if (rateLimitResponse) {
      return rateLimitResponse
    }

    // Verify admin access
    const authResult = await verifyAdminAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.hasPermission('moderate_listings')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const { listingId, approvalNotes } = await request.json()

    if (!listingId) {
      return NextResponse.json({ error: 'Listing ID is required' }, { status: 400 })
    }

    // Update listing status to active
    const { data: listing, error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'active',
        approved_by: (authResult.adminUser as any).user_id,
        approved_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select('user_id, title')
      .single()

    if (updateError) {
      console.error('Error approving listing:', updateError)
      return NextResponse.json({ error: 'Failed to approve listing' }, { status: 500 })
    }

    // Create notification for the user
    await supabase
      .from('notifications')
      .insert({
        user_id: listing.user_id,
        type: 'listing_approved',
        title: 'Listing Approved',
        message: `Your listing "${listing.title}" has been approved and is now live.${approvalNotes ? ` Admin notes: ${approvalNotes}` : ''}`,
        listing_id: listingId
      })

    // Process wanted request matching for the approved listing
    try {
      const matchingResult = await processWantedRequestMatching(listingId)
      console.log(`Wanted request matching completed for listing ${listingId}: ${matchingResult.matchCount} matches found`)
    } catch (matchingError) {
      // Log the error but don't fail the approval process
      console.error('Error in wanted request matching:', matchingError)
    }

    incr('admin.listing.approved')

    return NextResponse.json({
      success: true,
      message: 'Listing approved successfully',
      listing: {
        id: listingId,
        status: 'active'
      }
    })

  } catch (error) {
    console.error('Approve listing error:', error)
    incr('admin.listing.approve.error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}