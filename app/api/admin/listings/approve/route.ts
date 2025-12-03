import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { withRateLimit, rateLimiters } from '@/lib/middleware/rateLimiter'
import { incr } from '@/lib/security/metrics'
import { AuditEvents } from '@/lib/utils/audit'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'
import { emailService } from '@/lib/services/emailService'

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

    const supabase = getServiceRoleClient()
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

    // Fetch user email from profiles table
    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', listing.user_id)
      .single()

    // Send email notification to listing owner
    if (profile?.email) {
      await emailService.sendListingApprovedEmail(
        profile.email,
        listing.title,
        listingId,
        approvalNotes
      )
    }

    AuditEvents.listingApproved(listingId, (authResult.adminUser as any).user_id, 0)

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
    incr('admin.listing.approve.error')
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}