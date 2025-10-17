import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  try {
    const { currentPassword, newPassword } = await request.json()

    // Validation
    if (!newPassword || newPassword.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 })
    }

    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has existing password (email provider)
    const hasEmailProvider = user.identities?.some(i => i.provider === 'email')

    if (hasEmailProvider) {
      // PASSWORD CHANGE: Verify current password
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password required' }, { status: 400 })
      }

      // Verify current password by attempting sign-in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email!,
        password: currentPassword
      })

      if (signInError) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 403 })
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Audit log: password_changed
      await supabase.from('security_audit_log').insert({
        audit_type: 'password_changed',
        status: 'success',
        details: { provider: 'email' },
        performed_by: user.id,
        validation_passed: true
      })

      return NextResponse.json({ message: 'Password updated successfully' })

    } else {
      // PASSWORD CREATION: No verification needed
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 })
      }

      // Audit log: password_created
      const primaryProvider = user.app_metadata?.provider ||
                             user.identities?.[0]?.provider ||
                             'unknown'

      await supabase.from('security_audit_log').insert({
        audit_type: 'password_created',
        status: 'success',
        details: {
          original_provider: primaryProvider,
          email: user.email
        },
        performed_by: user.id,
        validation_passed: true
      })

      return NextResponse.json({ message: 'Password created successfully' })
    }
  } catch (error: any) {
    console.error('Error updating password:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
