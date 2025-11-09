import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// This endpoint allows manual triggering of the cleanup process
// It should be protected and only accessible by admins

export async function POST(request: NextRequest) {
  try {
    // Check for admin authorization
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Create Supabase client with service role for admin operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify the user is an admin (you can customize this logic)
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Invalid token' },
        { status: 401 }
      )
    }

    // Check if user is admin (you can add your own admin check logic here)
    // For now, we'll check if the user email is in an admin list
    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json(
        { error: 'Insufficient permissions' },
        { status: 403 }
      )
    }

    // Execute the cleanup function
    const { data, error } = await supabase.rpc('permanently_delete_old_records')
    
    if (error) {
      logger.error('Cleanup error', error as Error, { details: error.message })
      return NextResponse.json(
        { error: 'Cleanup failed', details: error.message },
        { status: 500 }
      )
    }

    const result = data?.[0] || { deleted_listings: 0, deleted_wanted_requests: 0 }

    // Log the admin action
    await supabase.from('deletion_logs').insert({
      table_name: 'manual_cleanup',
      record_id: crypto.randomUUID(),
      user_id: user.id,
      deletion_reason: 'Manual cleanup triggered by admin',
      record_data: {
        deleted_listings: result.deleted_listings,
        deleted_wanted_requests: result.deleted_wanted_requests,
        triggered_by: user.email,
        timestamp: new Date().toISOString()
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Cleanup completed successfully',
      deleted: {
        listings: result.deleted_listings,
        wanted_requests: result.deleted_wanted_requests
      },
      triggered_by: user.email,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in cleanup', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// GET endpoint to check pending deletions
export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get pending deletions from the view
    const { data: pending, error: pendingError } = await supabase
      .from('pending_permanent_deletion')
      .select('*')
      .order('scheduled_permanent_deletion', { ascending: true })

    if (pendingError) {
      return NextResponse.json(
        { error: 'Failed to fetch pending deletions', details: pendingError.message },
        { status: 500 }
      )
    }

    // Get recent deletion logs
    const { data: logs, error: logsError } = await supabase
      .from('deletion_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (logsError) {
      logger.error('Error fetching logs', logsError as Error)
    }

    // Calculate statistics
    const stats = {
      total_pending: pending?.length || 0,
      overdue: pending?.filter(item => item.deletion_status === 'overdue').length || 0,
      imminent: pending?.filter(item => item.deletion_status === 'imminent').length || 0,
      pending: pending?.filter(item => item.deletion_status === 'pending').length || 0
    }

    return NextResponse.json({
      stats,
      pending_deletions: pending || [],
      recent_logs: logs || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in GET cleanup', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}