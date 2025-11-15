import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

// PATCH - Verify or reject business profile
export async function PATCH(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.hasPermission('view_dashboard')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const supabase = getServiceRoleClient()

    const body = await request.json()
    const { profileId, action, reason } = body

    if (!profileId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['verify', 'reject'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (action === 'verify') {
      updateData.is_verified = true
    } else if (action === 'reject') {
      updateData.is_verified = false
      updateData.is_active = false
      if (reason) {
        updateData.rejection_reason = reason
      }
    }

    const { data: profile, error } = await supabase
      .from('business_profiles')
      .update(updateData)
      .eq('id', profileId)
      .select()
      .single()

    if (error) {
      logger.error('Error updating business profile', error, { profileId, action })
      return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 })
    }

    // Create notification for the business owner
    if (profile) {
      const notificationType = action === 'verify' ? 'business_profile_verified' : 'business_profile_rejected'
      const notificationTitle = action === 'verify' ? 'Business Profile Verified' : 'Business Profile Rejected'
      const notificationMessage = action === 'verify'
        ? 'Your business profile has been verified and is now visible to customers.'
        : `Your business profile was rejected${reason ? ': ' + reason : '.'}`

      await supabase
        .from('notifications')
        .insert({
          user_id: profile.user_id,
          type: notificationType,
          title: notificationTitle,
          message: notificationMessage
        })
    }

    return NextResponse.json({ success: true, profile })
  } catch (error) {
    logger.error('Unexpected error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}