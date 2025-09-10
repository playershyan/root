import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export const runtime = 'nodejs'

export async function GET() {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      return NextResponse.json({ error: 'Profile not found', success: false }, { status: 404 })
    }

    return NextResponse.json({ data: profile, success: true })
  } catch (error) {
    console.error('Error in GET /api/profiles:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Authentication required', success: false }, { status: 401 })
    }

    const body = await request.json()
    console.log('PUT /api/profiles - Received data:', body)
    
    const { name, phone, location, bio, avatar_url, language } = body

    const { data: profile, error } = await supabase
      .from('profiles')
      .update({
        name,
        phone,
        location,
        bio,
        avatar_url,
        language,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to update profile', success: false, details: error }, { status: 500 })
    }

    console.log('Profile updated successfully:', profile)
    return NextResponse.json({ data: profile, success: true })
  } catch (error) {
    console.error('Error in PUT /api/profiles:', error)
    return NextResponse.json({ error: 'Internal server error', success: false }, { status: 500 })
  }
}