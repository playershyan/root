import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// POST - Bootstrap admin user (only works if no admins exist)
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Must be signed in to bootstrap admin' }, { status: 401 })
    }

    const body = await request.json()
    const { action, email } = body

    if (action === 'bootstrap') {
      // Bootstrap admin user
      const adminEmail = email || user.email

      let result = null
      let bootstrapError = null

      try {
        const response = await supabase.rpc('bootstrap_admin_user', { admin_email: adminEmail })
        result = response.data
        bootstrapError = response.error
      } catch (funcError) {
        console.log('bootstrap_admin_user function not available, using direct insertion')
        
        // Fallback: directly insert into admin_users table
        try {
          // First check if admin_users table exists and if user is already admin
          const { data: existingAdmin, error: checkError } = await supabase
            .from('admin_users')
            .select('id, role, is_active')
            .eq('user_id', user.id)
            .single()

          if (checkError && checkError.code !== 'PGRST116' && !checkError.message?.includes('No rows')) {
            if (checkError.message?.includes('relation') || checkError.message?.includes('does not exist')) {
              // admin_users table doesn't exist
              return NextResponse.json({ 
                error: 'Admin system not initialized. Please run database migrations first.',
                details: 'admin_users table does not exist'
              }, { status: 500 })
            }
            throw checkError
          }

          if (existingAdmin) {
            // User is already an admin, just activate and update permissions
            const { error: updateError } = await supabase
              .from('admin_users')
              .update({
                role: 'admin',
                permissions: ['moderate_listings', 'moderate_reports', 'manage_admins', 'view_dashboard', 'manage_cleanup', 'manage_alerts'],
                is_active: true,
                updated_at: new Date().toISOString()
              })
              .eq('user_id', user.id)

            if (updateError) throw updateError

            result = [{
              success: true,
              message: `User ${adminEmail} updated to admin with full permissions.`,
              user_id: user.id
            }]
          } else {
            // Insert new admin user
            const { error: insertError } = await supabase
              .from('admin_users')
              .insert({
                user_id: user.id,
                role: 'admin',
                permissions: ['moderate_listings', 'moderate_reports', 'manage_admins', 'view_dashboard', 'manage_cleanup', 'manage_alerts'],
                is_active: true,
                created_by: user.id
              })

            if (insertError) throw insertError

            result = [{
              success: true,
              message: `User ${adminEmail} has been granted admin access with full permissions.`,
              user_id: user.id
            }]
          }
        } catch (fallbackError) {
          console.error('Fallback bootstrap failed:', fallbackError)
          bootstrapError = fallbackError
        }
      }

      if (bootstrapError) {
        console.error('Error bootstrapping admin user:', bootstrapError)
        return NextResponse.json({ 
          error: 'Failed to bootstrap admin user',
          details: bootstrapError.message || bootstrapError
        }, { status: 500 })
      }

      const bootstrapResult = result?.[0]
      
      if (!bootstrapResult?.success) {
        return NextResponse.json({ 
          error: bootstrapResult?.message || 'Failed to bootstrap admin user'
        }, { status: 400 })
      }

      return NextResponse.json({
        success: true,
        message: bootstrapResult.message,
        user_id: bootstrapResult.user_id,
        email: adminEmail
      })

    } else if (action === 'check') {
      // Check admin permissions for current user
      let permissions = []
      let checkError = null

      try {
        const result = await supabase.rpc('check_admin_permissions', { user_email: user.email })
        permissions = result.data || []
        checkError = result.error
      } catch (funcError) {
        console.log('check_admin_permissions function not available for check action, using fallback')
        // Use same fallback as GET method
        try {
          const { data: adminUsers, error: adminError } = await supabase
            .from('admin_users')
            .select('user_id, role, permissions, is_active')
            .eq('user_id', user.id)
            .eq('is_active', true)

          if (adminError) {
            if (adminError.code === 'PGRST116' || adminError.message?.includes('relation')) {
              permissions = []
            } else {
              checkError = adminError
            }
          } else {
            permissions = adminUsers || []
          }
        } catch (tableError) {
          console.error('Fallback check failed:', tableError)
          permissions = []
        }
      }

      if (checkError) {
        console.error('Error checking admin permissions:', checkError)
        if (checkError.code === '42883' || checkError.code === 'PGRST116' || 
            checkError.message?.includes('function') || checkError.message?.includes('does not exist')) {
          permissions = []
        } else {
          return NextResponse.json({ 
            error: 'Failed to check permissions',
            details: checkError.message || checkError 
          }, { status: 500 })
        }
      }

      const userPermissions = permissions?.find(p => p.user_id === user.id || p.email === user.email)

      return NextResponse.json({
        success: true,
        user_email: user.email,
        user_id: user.id,
        is_admin: !!userPermissions,
        permissions: userPermissions || null,
        all_admins: permissions || []
      })

    } else {
      return NextResponse.json({ 
        error: 'Invalid action. Use "bootstrap" or "check"' 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Unexpected error in admin setup:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

// GET - Check admin status and permissions
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin permissions with fallback
    let permissions = []
    let checkError = null
    let fallbackMode = false

    try {
      const result = await supabase.rpc('check_admin_permissions')
      permissions = result.data || []
      checkError = result.error
    } catch (funcError) {
      console.log('check_admin_permissions function not available, using fallback')
      fallbackMode = true
      
      // Fallback: directly query admin_users table
      try {
        const { data: adminUsers, error: adminError } = await supabase
          .from('admin_users')
          .select(`
            user_id,
            role,
            permissions,
            is_active,
            created_at
          `)
          .eq('is_active', true)

        if (adminError) {
          if (adminError.code === 'PGRST116' || adminError.message?.includes('relation') || adminError.message?.includes('does not exist')) {
            // admin_users table doesn't exist - this is a fresh system
            permissions = []
          } else {
            checkError = adminError
          }
        } else {
          // Convert admin_users data to match expected format
          permissions = adminUsers?.map(admin => ({
            user_id: admin.user_id,
            email: 'unknown', // We don't have email in admin_users
            role: admin.role,
            permissions: admin.permissions,
            is_active: admin.is_active,
            has_view_dashboard: admin.permissions?.includes?.('view_dashboard') || admin.role === 'admin',
            has_manage_cleanup: admin.permissions?.includes?.('manage_cleanup') || admin.role === 'admin',
            has_manage_alerts: admin.permissions?.includes?.('manage_alerts') || admin.role === 'admin'
          })) || []
        }
      } catch (tableError) {
        console.error('Fallback admin check failed:', tableError)
        permissions = []
      }
    }

    if (checkError && !fallbackMode) {
      console.error('Error checking admin permissions:', checkError)
      console.error('Check error details:', JSON.stringify(checkError, null, 2))
      
      // If it's a function/table not found error, treat as empty system
      if (checkError.code === '42883' || checkError.code === 'PGRST116' || 
          checkError.message?.includes('function') || checkError.message?.includes('does not exist') ||
          checkError.message?.includes('relation')) {
        permissions = []
      } else {
        return NextResponse.json({ 
          error: 'Failed to check permissions',
          details: checkError.message || checkError
        }, { status: 500 })
      }
    }

    const currentUserPermissions = permissions?.find(p => p.user_id === user.id)
    const totalAdmins = permissions?.length || 0

    return NextResponse.json({
      success: true,
      current_user: {
        email: user.email,
        user_id: user.id,
        is_admin: !!currentUserPermissions,
        permissions: currentUserPermissions || null
      },
      admin_summary: {
        total_admins: totalAdmins,
        can_bootstrap: totalAdmins === 0
      },
      all_admins: permissions || []
    })

  } catch (error) {
    console.error('Unexpected error in admin setup GET:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}