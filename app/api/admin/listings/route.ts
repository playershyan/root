import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  console.log('Admin listings API - Starting request')
  
  // Verify admin access
  const authResult = await verifyAdminAccess(request)
  console.log('Admin listings API - Auth result:', authResult instanceof NextResponse ? 'Error response' : 'Success')
  
  if (authResult instanceof NextResponse) {
    console.log('Admin listings API - Returning auth error response')
    return authResult
  }

  console.log('Admin listings API - User:', authResult.user.email)
  console.log('Admin listings API - Admin user role:', authResult.adminUser.role)
  console.log('Admin listings API - Admin permissions:', authResult.adminUser.permissions)
  
  const hasPermission = authResult.hasPermission('view_dashboard')
  console.log('Admin listings API - Has view_dashboard permission:', hasPermission)
  
  if (!hasPermission) {
    console.log('Admin listings API - Permission denied')
    return NextResponse.json({ error: 'Permission denied - view_dashboard required' }, { status: 403 })
  }
  
  console.log('Admin listings API - Permission check passed, proceeding with listings fetch')

  try {
    const supabase = createRouteHandlerClient({ cookies })
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = (page - 1) * limit

    // Get listings with simplified query first (we can add joins back later)
    // Note: The field is 'moderation_status', not 'status'
    const { data: listings, error: listingsError } = await supabase
      .from('listings')
      .select('*')
      .eq('moderation_status', status)
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
      .eq('moderation_status', status)

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