import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// PATCH - Verify or reject business profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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
      console.error('Error updating business profile:', error)
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
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}