import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'

export async function GET(request: NextRequest) {
  logger.debug('Admin listings API - Starting request')

  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  logger.debug('Admin listings API - Auth result', { isError: authResult instanceof NextResponse })

  if (authResult instanceof NextResponse) {
    logger.warn('Admin listings API - Auth check failed')
    return authResult
  }

  logger.debug('Admin listings API - Admin authenticated', {
    email: authResult.user.email,
    role: authResult.adminUser.role,
    permissions: authResult.adminUser.permissions
  })

  const hasPermission = authResult.hasPermission('view_dashboard')
  logger.debug('Admin listings API - Permission check', { hasViewDashboard: hasPermission })

  if (!hasPermission) {
    logger.warn('Admin listings API - Permission denied', { userId: authResult.user.id })
    return NextResponse.json({ error: 'Permission denied - view_dashboard required' }, { status: 403 })
  }

  logger.debug('Admin listings API - Permission check passed')

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get listings with simplified query first (we can add joins back later)
    // Note: The field is 'status' in the database
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listingsError) {
      logger.error('Error fetching admin listings', listingsError as Error, { status })
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (countError) {
      logger.error('Error counting admin listings', countError as Error, { status })
      return NextResponse.json({ error: 'Failed to count listings' }, { status: 500 })
    }

    return NextResponse.json({
      listings,
      totalCount: count,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit)
    })

  } catch (error) {
    logger.error('Get admin listings unexpected error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}