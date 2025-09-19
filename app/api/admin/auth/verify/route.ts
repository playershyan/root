import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin access
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('role, permissions, is_active')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      // Check if user email is in admin list (fallback)
      const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
      if (adminEmails.includes(user.email || '')) {
        // Create admin user record if not exists
        const { data: newAdmin, error: createError } = await supabase
          .from('admin_users')
          .insert({
            user_id: user.id,
            role: 'admin',
            permissions: ['*'],
            is_active: true
          })
          .select()
          .single()

        if (!createError && newAdmin) {
          return NextResponse.json({
            role: newAdmin.role,
            permissions: newAdmin.permissions
          })
        }
      }

      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return NextResponse.json({
      role: adminUser.role,
      permissions: adminUser.permissions
    })

  } catch (error) {
    console.error('Admin verification error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}