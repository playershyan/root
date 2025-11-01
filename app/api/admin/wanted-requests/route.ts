import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!authResult.hasPermission('moderate_listings')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)

    const status = searchParams.get('status') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const search = searchParams.get('search') || ''
    const reported = searchParams.get('reported') === 'true'
    const pending = searchParams.get('pending') === 'true'
    const limit = 20
    const offset = (page - 1) * limit

    // Build query
    let query = supabase
      .from('wanted_requests')
      .select(`
        *,
        profiles!wanted_requests_user_id_fkey (
          id,
          name,
          email,
          phone,
          location
        )
      `, { count: 'exact' })

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status)
    }

    if (pending) {
      query = query.eq('status', 'pending')
    }

    if (reported) {
      query = query.gt('report_count', 0)
        .order('report_count', { ascending: false })
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,make.ilike.%${search}%,model.ilike.%${search}%,location.ilike.%${search}%`)
    }

    // Add pagination and ordering
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    const { data: requests, count, error } = await query

    if (error) {
      console.error('Error fetching wanted requests:', error)
      return NextResponse.json({ error: 'Failed to fetch wanted requests' }, { status: 500 })
    }

    // Process requests to include user info
    const processedRequests = requests?.map(request => ({
      ...request,
      user_name: request.profiles?.name || 'Unknown User',
      user_email: request.profiles?.email || '',
      user_phone: request.profiles?.phone || request.phone,
      user_location: request.profiles?.location || request.location
    }))

    // Log admin activity
    const { error: logError } = await supabase.rpc('log_admin_activity', {
      p_admin_id: authResult.user.id,
      p_action_type: 'view_wanted_requests',
      p_details: { status, page, search, reported, pending }
    })

    if (logError) {
      console.error('Error logging activity:', logError)
    }

    return NextResponse.json({
      requests: processedRequests || [],
      totalCount: count || 0,
      totalPages: Math.ceil((count || 0) / limit),
      currentPage: page
    })

  } catch (error) {
    console.error('Get wanted requests error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}