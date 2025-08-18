import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function verifyAdminAccess(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is an admin
    const { data: adminUser, error: adminError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (adminError || !adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    return {
      user,
      adminUser,
      hasPermission: (permission: string) => {
        const permissions = adminUser.permissions as string[]
        return permissions.includes(permission) || adminUser.role === 'admin'
      }
    }
  } catch (error) {
    console.error('Admin auth error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function requireAdminPermission(permission: string) {
  return async function(request: NextRequest) {
    const authResult = await verifyAdminAccess(request)
    
    if (authResult instanceof NextResponse) {
      return authResult // Return error response
    }

    if (!authResult.hasPermission(permission)) {
      return NextResponse.json({ 
        error: `Permission '${permission}' required` 
      }, { status: 403 })
    }

    return authResult
  }
}