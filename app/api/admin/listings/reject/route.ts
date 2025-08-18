import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function POST(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('moderate_listings')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { listingId, rejectionReason } = await request.json()

    if (!listingId || !rejectionReason) {
      return NextResponse.json({ 
        error: 'Listing ID and rejection reason are required' 
      }, { status: 400 })
    }

    // Update listing status to deleted with rejection reason
    const { data: listing, error: updateError } = await supabase
      .from('listings')
      .update({
        status: 'deleted',
        rejection_reason: rejectionReason,
        approved_by: authResult.adminUser.user_id,
        approved_at: new Date().toISOString()
      })
      .eq('id', listingId)
      .select('user_id, title')
      .single()

    if (updateError) {
      console.error('Error rejecting listing:', updateError)
      return NextResponse.json({ error: 'Failed to reject listing' }, { status: 500 })
    }

    // Create notification for the user
    await supabase
      .from('notifications')
      .insert({
        user_id: listing.user_id,
        type: 'listing_rejected',
        title: 'Listing Rejected',
        message: `Your listing "${listing.title}" has been rejected. Reason: ${rejectionReason}. You can edit and resubmit your listing.`,
        listing_id: listingId
      })

    return NextResponse.json({ 
      success: true, 
      message: 'Listing rejected successfully' 
    })

  } catch (error) {
    console.error('Reject listing error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}