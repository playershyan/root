import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'
import { logger } from '@/lib/utils/logger'

// Admin endpoint for managing deletion safety and approvals

export async function GET(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Verify admin user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Get safety status
    const { data: safetyStatus, error: statusError } = await supabase
      .from('deletion_safety_status')
      .select('*')
      .single()

    if (statusError) {
      logger.error('Error fetching safety status', statusError as Error)
    }

    // Get pending approval requests
    const { data: pendingApprovals, error: approvalsError } = await supabase
      .from('deletion_approval_requests')
      .select('*')
      .eq('status', 'pending')
      .order('requested_at', { ascending: false })

    if (approvalsError) {
      logger.error('Error fetching approvals', approvalsError as Error)
    }

    // Get recent safety activity
    const { data: recentActivity, error: activityError } = await supabase
      .from('deletion_logs')
      .select('*')
      .in('table_name', ['cleanup_operation', 'restoration'])
      .order('created_at', { ascending: false })
      .limit(10)

    if (activityError) {
      logger.error('Error fetching activity', activityError as Error)
    }

    // Get restorable backups
    const { data: backups, error: backupsError } = await supabase
      .from('deletion_backups')
      .select('*')
      .eq('can_restore', true)
      .is('restored_at', null)
      .order('backup_created_at', { ascending: false })
      .limit(20)

    if (backupsError) {
      logger.error('Error fetching backups', backupsError as Error)
    }

    return NextResponse.json({
      safety_status: safetyStatus,
      pending_approvals: pendingApprovals || [],
      recent_activity: recentActivity || [],
      restorable_backups: backups || [],
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Unexpected error in GET deletion safety', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST endpoint for admin actions
export async function POST(request: NextRequest) {
  try {
    const headersList = headers()
    const authorization = headersList.get('authorization')
    
    if (!authorization?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
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

    // Verify admin user
    const token = authorization.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const adminEmails = process.env.ADMIN_EMAILS?.split(',') || []
    if (!adminEmails.includes(user.email || '')) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    const body = await request.json()
    const { action, ...params } = body

    switch (action) {
      case 'approve_deletion':
        const { data: approvalResult, error: approvalError } = await supabase
          .rpc('approve_deletion_request', {
            request_id: params.request_id,
            admin_user_id: user.id
          })

        if (approvalError) {
          return NextResponse.json({ error: 'Approval failed', details: approvalError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          action: 'approval_completed',
          result: approvalResult,
          approved_by: user.email
        })

      case 'reject_deletion':
        const { data: rejectionResult, error: rejectionError } = await supabase
          .rpc('reject_deletion_request', {
            request_id: params.request_id,
            admin_user_id: user.id,
            reason: params.reason || 'Rejected by admin'
          })

        if (rejectionError) {
          return NextResponse.json({ error: 'Rejection failed', details: rejectionError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          action: 'rejection_completed',
          result: rejectionResult,
          rejected_by: user.email
        })

      case 'restore_backup':
        const { data: restoreResult, error: restoreError } = await supabase
          .rpc('restore_from_backup', {
            backup_record_id: params.backup_id,
            admin_user_id: user.id
          })

        if (restoreError) {
          return NextResponse.json({ error: 'Restoration failed', details: restoreError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          action: 'restoration_completed',
          result: restoreResult,
          restored_by: user.email
        })

      case 'run_safe_cleanup':
        const { data: cleanupResult, error: cleanupError } = await supabase
          .rpc('safely_delete_old_records')

        if (cleanupError) {
          return NextResponse.json({ error: 'Cleanup failed', details: cleanupError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          action: 'cleanup_completed',
          result: cleanupResult,
          triggered_by: user.email
        })

      case 'update_safety_config':
        const { error: configError } = await supabase
          .from('deletion_safety_config')
          .update({
            ...params.config,
            last_updated: new Date().toISOString(),
            updated_by: user.id
          })
          .eq('id', 1)

        if (configError) {
          return NextResponse.json({ error: 'Config update failed', details: configError.message }, { status: 500 })
        }

        return NextResponse.json({
          success: true,
          action: 'config_updated',
          updated_by: user.email
        })

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

  } catch (error) {
    logger.error('Unexpected error in POST deletion safety', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}