/**
 * Vercel Cron endpoint for cleaning expired guides
 * Scheduled to run daily
 *
 * Configure in vercel.json:
 * "crons": [{
 *   "path": "/api/cron/clean-guides",
 *   "schedule": "0 2 * * *"
 * }]
 */

import { NextResponse } from 'next/server'
import { cleanExpiredGuides } from '@/lib/services/guideCache'

// Verify cron secret
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return true // Allow in development
  }

  return authHeader === `Bearer ${cronSecret}`
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Starting scheduled guide cleanup...')

  try {
    const deletedCount = await cleanExpiredGuides()

    return NextResponse.json({
      success: true,
      deleted: deletedCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Guide cleanup cron failed:', error)
    return NextResponse.json(
      { error: 'Cleanup failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
