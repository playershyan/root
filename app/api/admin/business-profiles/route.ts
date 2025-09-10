import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

// GET - Fetch all business profiles for admin review
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const { data: adminUser } = await supabase
      .from('admin_users')
      .select('role')
      .eq('user_id', user.id)
      .single()

    if (!adminUser) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

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
        user_id
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
      console.error('Error fetching business profiles:', error)
      return NextResponse.json({ error: 'Failed to fetch business profiles' }, { status: 500 })
    }

    return NextResponse.json({ profiles })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}