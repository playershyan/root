import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('view_dashboard')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // Get recent alerts
    const { data: alerts, error } = await supabase
      .from('system_alerts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      logger.error('Error fetching alerts', error)
      return NextResponse.json({ alerts: [] })
    }

    const formattedAlerts = alerts.map(alert => ({
      id: alert.id,
      type: alert.alert_type,
      title: alert.title,
      message: alert.message,
      timestamp: alert.created_at,
      isRead: alert.is_read,
      severity: alert.severity
    }))

    return NextResponse.json({ alerts: formattedAlerts })

  } catch (error) {
    logger.error('Get recent alerts error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}