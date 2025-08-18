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

  if (!authResult.hasPermission('view_dashboard')) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get listings with user profiles
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select(`
        *,
        user:profiles!listings_user_id_fkey(name, email, phone),
        reports:reports!reports_listing_id_fkey(id, reason, description, created_at, reporter:profiles!reports_reporter_id_fkey(name))
      `)
      .eq('status', status)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listingsError) {
      console.error('Error fetching listings:', listingsError)
      return NextResponse.json({ error: 'Failed to fetch listings' }, { status: 500 })
    }

    // Get total count for pagination
    const { count, error: countError } = await supabase
      .from('listings')
      .select('*', { count: 'exact', head: true })
      .eq('status', status)

    if (countError) {
      console.error('Error counting listings:', countError)
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
    console.error('Get admin listings error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}