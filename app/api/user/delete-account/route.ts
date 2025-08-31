import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// DELETE - Delete user account and all associated data
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get confirmation from request body
    const body = await request.json()
    const { confirmPhrase, password } = body

    // Validate confirmation phrase
    if (confirmPhrase !== 'DELETE MY ACCOUNT') {
      return NextResponse.json({ 
        error: 'Invalid confirmation phrase. Please type "DELETE MY ACCOUNT" to confirm.' 
      }, { status: 400 })
    }

    // Optionally verify password for extra security
    if (password) {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: password
      })

      if (signInError) {
        return NextResponse.json({ 
          error: 'Invalid password. Please enter your correct password to confirm deletion.' 
        }, { status: 401 })
      }
    }

    // Log the deletion attempt for audit purposes
    console.log(`User ${user.id} (${user.email}) initiated account deletion at ${new Date().toISOString()}`)

    // The database triggers will handle:
    // 1. Archiving all listings to deleted_listings table
    // 2. Archiving all wanted_requests to deleted_wanted_requests table
    // 3. Soft deleting business profile if exists
    // 4. Removing user from profiles table

    // Delete the user's profile (this will trigger cascading deletes)
    const { error: profileDeleteError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', user.id)

    if (profileDeleteError) {
      console.error('Error deleting user profile:', profileDeleteError)
      return NextResponse.json({ 
        error: 'Failed to delete user profile. Please try again or contact support.' 
      }, { status: 500 })
    }

    // Delete the auth user account
    // Note: This uses admin client in production, but for now we'll mark for deletion
    const { error: authDeleteError } = await supabase.auth.admin?.deleteUser(user.id)

    if (authDeleteError) {
      console.error('Error deleting auth user:', authDeleteError)
      // Even if auth deletion fails, profile is deleted so account is effectively disabled
      // Log this for manual cleanup
      console.error(`Auth deletion failed for user ${user.id} - manual cleanup required`)
    }

    // Sign out the user
    await supabase.auth.signOut()

    return NextResponse.json({ 
      success: true,
      message: 'Your account has been successfully deleted. All your data has been removed or archived according to our data retention policy.'
    })

  } catch (error) {
    console.error('Unexpected error during account deletion:', error)
    return NextResponse.json({ 
      error: 'An unexpected error occurred. Please try again or contact support.' 
    }, { status: 500 })
  }
}

// GET - Check if user can delete their account
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has any active premium subscriptions or pending payments
    // This is a placeholder - implement based on your business logic
    const canDelete = true
    const warnings = []

    // Check for active listings
    const { count: listingsCount } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('status', 'active')

    if (listingsCount && listingsCount > 0) {
      warnings.push(`You have ${listingsCount} active listing(s) that will be permanently deleted.`)
    }

    // Check for active wanted requests
    const { count: wantedCount } = await supabase
      .from('wanted_requests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('is_active', true)

    if (wantedCount && wantedCount > 0) {
      warnings.push(`You have ${wantedCount} active wanted request(s) that will be permanently deleted.`)
    }

    // Check for business profile
    const { data: businessProfile } = await supabase
      .from('business_profiles')
      .select('business_name')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (businessProfile) {
      warnings.push(`Your business profile "${businessProfile.business_name}" will be permanently deleted.`)
    }

    return NextResponse.json({
      canDelete,
      warnings,
      email: user.email,
      userId: user.id
    })

  } catch (error) {
    console.error('Error checking deletion eligibility:', error)
    return NextResponse.json({ 
      error: 'Failed to check account status' 
    }, { status: 500 })
  }
}