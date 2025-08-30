import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET - Fetch user's business profile
export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: profile, error } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching business profile:', error)
      return NextResponse.json({ error: 'Failed to fetch business profile' }, { status: 500 })
    }

    return NextResponse.json({ profile: profile || null })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create business profile
export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { 
      business_name, 
      description, 
      website, 
      address, 
      phone, 
      whatsapp,
      operating_hours,
      logo_url,
      banner_url,
      profile_image_url 
    } = body

    // Validate required fields
    if (!business_name || !description || !phone) {
      return NextResponse.json({ error: 'Missing required fields: business name, description, and phone are required' }, { status: 400 })
    }

    // Check if any profile exists (active or deleted)
    const { data: existingProfile } = await supabase
      .from('business_profiles')
      .select('id, is_active')
      .eq('user_id', user.id)
      .maybeSingle()

    if (existingProfile?.is_active) {
      return NextResponse.json({ error: 'Business profile already exists' }, { status: 400 })
    }

    let profile, error

    if (existingProfile) {
      // Reactivate soft-deleted profile with new data
      const { data: updatedProfile, error: updateError } = await supabase
        .from('business_profiles')
        .update({
          business_name,
          description,
          website,
          address,
          phone,
          whatsapp,
          operating_hours,
          logo_url,
          banner_url,
          profile_image_url,
          is_active: true,
          is_paused: false,
          is_verified: false,
          deleted_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single()
      
      profile = updatedProfile
      error = updateError
    } else {
      // Create new profile
      const { data: newProfile, error: insertError } = await supabase
        .from('business_profiles')
        .insert({
          id: user.id,
          user_id: user.id,
          business_name,
          description,
          website,
          address,
          phone,
          whatsapp,
          operating_hours,
          logo_url,
          banner_url,
          profile_image_url,
          is_active: true,
          is_paused: false,
          is_verified: false
        })
        .select()
        .single()
      
      profile = newProfile
      error = insertError
    }

    if (error) {
      console.error('Error creating business profile:', error)
      console.error('Error details:', JSON.stringify(error, null, 2))
      console.error('Insert data:', JSON.stringify({
        id: user.id,
        user_id: user.id,
        business_name,
        description,
        website,
        address,
        phone,
        operating_hours,
        logo_url
      }, null, 2))
      return NextResponse.json({ 
        error: 'Failed to create business profile', 
        details: error.message || error 
      }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PATCH - Update business profile
export async function PATCH(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: any = {}

    // Only include fields that are provided
    const allowedFields = [
      'business_name', 
      'description', 
      'website', 
      'address', 
      'phone', 
      'whatsapp',
      'operating_hours',
      'logo_url',
      'banner_url',
      'profile_image_url',
      'is_paused'
    ]

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updates[field] = body[field]
      }
    }

    const { data: profile, error } = await supabase
      .from('business_profiles')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating business profile:', error)
      return NextResponse.json({ error: 'Failed to update business profile' }, { status: 500 })
    }

    return NextResponse.json({ profile })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Soft delete business profile
export async function DELETE(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Soft delete by setting deleted_at and is_active
    const { error } = await supabase
      .from('business_profiles')
      .update({ 
        is_active: false,
        deleted_at: new Date().toISOString()
      })
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting business profile:', error)
      return NextResponse.json({ error: 'Failed to delete business profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}