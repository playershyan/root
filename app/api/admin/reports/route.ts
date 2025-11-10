import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get reports with related data
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select(`
        *,
        reporter:profiles!reports_reporter_id_fkey(name, email),
        listing:listings(id, title, status, user_id, report_count),
        wanted_request:wanted_requests(id, title, is_active, user_id, report_count),
        reviewed_by_admin:admin_users!reports_reviewed_by_fkey(
          user:profiles!admin_users_user_id_fkey(name)
        )
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (reportsError) {
      logger.error('Error fetching reports', reportsError as Error)
      return NextResponse.json({ error: 'Failed to fetch reports' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (countError) {
      logger.error('Error counting reports', countError as Error)
      return NextResponse.json({ error: 'Failed to count reports' }, { status: 500 })
    }

    return NextResponse.json({
      reports,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logger.error('Get admin reports error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}