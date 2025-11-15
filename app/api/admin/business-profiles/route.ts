import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/middleware/adminAuth'
import { logger } from '@/lib/utils/logger'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

export const runtime = 'nodejs'

// GET - Fetch all business profiles for admin review
export async function GET(request: NextRequest) {
  try {
    const authResult = await verifyAdminAccess(request)
    if (authResult instanceof NextResponse) {
      return authResult
    }

    if (!authResult.hasPermission('view_dashboard')) {
      return NextResponse.json({ error: 'Permission denied' }, { status: 403 })
    }

    const supabase = getServiceRoleClient()

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') || 'pending'

    let query = supabase
      .from('business_profiles')
      .select(`
        id,
        business_name,
        business_type,
        description,
        website,
        address,
        phone,
        operating_hours,
        is_verified,
        is_active,
        is_paused,
        created_at,
        updated_at,
        user_id,
        profiles:profiles!business_profiles_user_id_fkey (
          email,
          name
        )
      `)

    if (status === 'pending') {
      query = query.eq('is_verified', false)
    } else if (status === 'verified') {
      query = query.eq('is_verified', true)
    }

    const { data: profiles, error } = await query
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching business profiles', error, { status })
      return NextResponse.json({ error: 'Failed to fetch business profiles' }, { status: 500 })
    }

    const businesses = (profiles || []).map(({ profiles: ownerProfile, ...rest }) => ({
      ...rest,
      user: ownerProfile
        ? {
            email: ownerProfile.email,
            full_name: ownerProfile.name || undefined
          }
        : undefined
    }))

    return NextResponse.json({ businesses })
  } catch (error) {
    logger.error('Unexpected error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}