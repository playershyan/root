import { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { handleAPIResponse, APIError } from '@/lib/errorHandling'

export async function GET() {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new APIError('Authentication required', 401)
    }

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (error) {
      throw new APIError('Profile not found', 404)
    }

    return Response.json({ data: profile, success: true })
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return Response.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const supabase = createClient()
    
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      throw new APIError('Authentication required', 401)
    }

    const body = await request.json()
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
      throw new APIError('Failed to update profile', 500, error)
    }

    return Response.json({ data: profile, success: true })
  } catch (error) {
    if (error instanceof APIError) {
      return Response.json(
        { error: error.message, success: false },
        { status: error.status }
      )
    }
    return Response.json(
      { error: 'Internal server error', success: false },
      { status: 500 }
    )
  }
}