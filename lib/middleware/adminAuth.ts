import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export async function verifyAdminAccess(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has admin access
    let adminResult = null
    let adminError = null

    try {
      const response = await supabase.rpc('has_admin_access', { check_user_id: user.id })
      const result = response.data?.[0]
      adminError = response.error

      if (result?.is_admin) {
        adminResult = result
      }
    } catch (funcError) {
      // Function not available, try checking admin_users table directly
      try {
        const { data: adminUser, error: tableError } = await supabase
          .from('admin_users')
          .select('role, permissions, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (tableError) {
          if (tableError.code !== 'PGRST116' && !tableError.message?.includes('No rows')) {
            // Real error (not just "no rows found")
            adminError = tableError
          }
        } else if (adminUser) {
          adminResult = {
            is_admin: true,
            user_role: adminUser.role,
            user_permissions: adminUser.permissions,
            is_fallback: false
          }
        }
      } catch (fallbackError) {
        if (process.env.NODE_ENV !== 'production') {
          logger.error('Admin check failed', fallbackError as Error)
        }
        adminError = fallbackError
      }
    }

    if (adminError) {
      // Log error only in development
      if (process.env.NODE_ENV !== 'production') {
        logger.error('Admin access check error', adminError as Error)
      }

      // If it's a function/table not found error, return 403 instead of 500
      if (adminError.code === '42883' || adminError.code === 'PGRST116' || 
          adminError.message?.includes('function') || adminError.message?.includes('does not exist')) {
        return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
      }
      
      return NextResponse.json({ error: 'Admin access check failed' }, { status: 500 })
    }

    if (!adminResult?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Create admin user object for compatibility
    const adminUser = {
      user_id: user.id,
      role: adminResult.user_role,
      permissions: adminResult.user_permissions,
      is_fallback: false
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
    if (process.env.NODE_ENV !== 'production') {
      logger.error('Admin auth error', error as Error)
    }
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