import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'

export async function GET(request: NextRequest) {
  console.log('Admin stats API - Starting request')

  // Verify admin access
  const authResult = await verifyAdminAccess(request)

  if (authResult instanceof NextResponse) {
    return authResult
  }

  const hasPermission = authResult.hasPermission('view_dashboard')
  if (!hasPermission) {
    return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
  }

  try {
    const supabase = createRouteHandlerClient({ cookies })

    // Get all stats in parallel
    const [
      pendingListings,
      approvedListings,
      totalUsers,
      pendingReports,
      todayListings,
      todayReports,
      pendingBusinessProfiles,
      verifiedBusinessProfiles
    ] = await Promise.all([
      // Pending listings count
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Approved/Active listings count
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved')
        .eq('is_sold', false),

      // Total users count
      supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true }),

      // Pending reports count
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending'),

      // Today's listings count
      supabase
        .from('listings')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      // Today's reports count
      supabase
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', new Date(new Date().setHours(0, 0, 0, 0)).toISOString()),

      // Pending business profiles count
      supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', false)
        .eq('is_active', true),

      // Verified business profiles count
      supabase
        .from('business_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_verified', true)
    ])

    const stats = {
      pendingListings: pendingListings.count || 0,
      activeListings: approvedListings.count || 0,
      totalUsers: totalUsers.count || 0,
      pendingReports: pendingReports.count || 0,
      todayListings: todayListings.count || 0,
      todayReports: todayReports.count || 0,
      pendingBusinessProfiles: pendingBusinessProfiles.count || 0,
      verifiedBusinessProfiles: verifiedBusinessProfiles.count || 0
    }

    console.log('Admin stats API - Stats:', stats)

    return NextResponse.json(stats)

  } catch (error) {
    console.error('Get admin stats error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}