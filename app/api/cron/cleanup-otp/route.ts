import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

// Automated OTP cleanup cron job
// Schedule: Daily at 2 AM UTC (cleans up expired records older than 24 hours)
// Vercel Cron: Configured in vercel.json

export async function GET(request: NextRequest) {
  try {
    // Verify the request is from an authorized source (Vercel Cron)
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      logger.warn('Unauthorized OTP cleanup attempt', {
        hasAuthHeader: !!authHeader,
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Create service role client for admin operations
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      logger.error('OTP cleanup failed: Missing environment variables', new Error('Missing config'), {
        hasUrl: !!supabaseUrl,
        hasKey: !!serviceRoleKey
      })
      return NextResponse.json({
        error: 'Server configuration error'
      }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    // Execute cleanup function
    const { data, error } = await supabase
      .rpc('cleanup_expired_otp_records')

    if (error) {
      logger.error('OTP cleanup function failed', error as Error, {
        timestamp: new Date().toISOString()
      })
      return NextResponse.json({
        success: false,
        error: 'Failed to execute cleanup',
        details: error.message
      }, { status: 500 })
    }

    const result = data?.[0] || { deleted_count: 0, orphaned_count: 0, invalid_format_count: 0 }

    // Log cleanup results
    logger.info('OTP cleanup completed', {
      deletedRecords: result.deleted_count,
      orphanedRecords: result.orphaned_count,
      invalidFormatRecords: result.invalid_format_count,
      timestamp: new Date().toISOString()
    })

    // Get current stats for monitoring
    const { data: stats, error: statsError } = await supabase
      .rpc('get_otp_stats')

    const currentStats = stats?.[0] || {}

    // Alert if there are concerning metrics
    if (result.orphaned_count > 10) {
      logger.warn('High number of orphaned OTP records detected', {
        count: result.orphaned_count,
        timestamp: new Date().toISOString()
      })
    }

    if (result.invalid_format_count > 0) {
      logger.error('Invalid phone format records detected', new Error('Data integrity issue'), {
        count: result.invalid_format_count,
        timestamp: new Date().toISOString()
      })
    }

    return NextResponse.json({
      success: true,
      message: 'OTP cleanup completed successfully',
      timestamp: new Date().toISOString(),
      cleanup: {
        deletedRecords: result.deleted_count,
        orphanedRecords: result.orphaned_count,
        invalidFormatRecords: result.invalid_format_count
      },
      currentStats: statsError ? null : {
        totalRecords: currentStats.total_records,
        verifiedRecords: currentStats.verified_records,
        unverifiedRecords: currentStats.unverified_records,
        expiredRecords: currentStats.expired_records,
        recordsLast24h: currentStats.records_last_24h,
        avgVerificationTimeSeconds: currentStats.avg_verification_time_seconds
      }
    })

  } catch (error) {
    logger.error('OTP cleanup cron job error', error as Error, {
      timestamp: new Date().toISOString()
    })
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to run OTP cleanup',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Edge runtime for better performance and cold start times
export const runtime = 'edge'
export const dynamic = 'force-dynamic'
