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

    // Check if user has admin access (with fallback for development)
    let adminResult = null
    let adminError = null
    let usedFallback = false

    try {
      const response = await supabase.rpc('has_admin_access', { check_user_id: user.id })
      const result = response.data?.[0]
      adminError = response.error

      if (result?.is_admin) {
        adminResult = result
      }
    } catch (funcError) {
      console.log('has_admin_access function not available, using simple fallback')
      usedFallback = true
      
      // Simple fallback: check admin_users table directly
      try {
        const { data: adminUser, error: tableError } = await supabase
          .from('admin_users')
          .select('role, permissions, is_active')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .single()

        if (tableError) {
          if (tableError.code === 'PGRST116' || tableError.message?.includes('relation') || tableError.message?.includes('does not exist')) {
            // admin_users table doesn't exist - check for development fallback
            const isDevelopmentAdmin = (
              user.email?.includes('@admin.local') ||
              user.email?.includes('@dev.local') ||
              user.email?.startsWith('admin@') ||
              user.email === 'test@example.com'
            )

            if (isDevelopmentAdmin) {
              adminResult = {
                is_admin: true,
                user_role: 'admin',
                user_permissions: ['moderate_listings', 'moderate_reports', 'manage_admins', 'view_dashboard', 'manage_cleanup', 'manage_alerts'],
                is_fallback: true
              }
            }
          } else if (tableError.code !== 'PGRST116' && !tableError.message?.includes('No rows')) {
            // Some other error
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
        console.error('Fallback admin check failed:', fallbackError)
        adminError = fallbackError
      }
    }

    if (adminError && !usedFallback) {
      console.error('Admin access check error:', adminError)
      
      // If it's a function/table not found error, try development fallback
      if (adminError.code === '42883' || adminError.code === 'PGRST116' || 
          adminError.message?.includes('function') || adminError.message?.includes('does not exist')) {
        
        const isDevelopmentAdmin = (
          user.email?.includes('@admin.local') ||
          user.email?.includes('@dev.local') ||
          user.email?.startsWith('admin@') ||
          user.email === 'test@example.com'
        )

        if (isDevelopmentAdmin) {
          adminResult = {
            is_admin: true,
            user_role: 'admin',
            user_permissions: ['moderate_listings', 'moderate_reports', 'manage_admins', 'view_dashboard', 'manage_cleanup', 'manage_alerts'],
            is_fallback: true
          }
        }
      } else {
        return NextResponse.json({ error: 'Admin access check failed' }, { status: 500 })
      }
    }

    if (!adminResult?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Create admin user object for compatibility
    const adminUser = {
      role: adminResult.user_role,
      permissions: adminResult.user_permissions,
      is_fallback: adminResult.is_fallback || usedFallback
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