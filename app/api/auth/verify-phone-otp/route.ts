import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { phoneNumber, otp } = await request.json()
    
    if (!phoneNumber || !otp) {
      return NextResponse.json({ error: 'Phone number and OTP are required' }, { status: 400 })
    }

    // Call the database function to verify OTP
    const { data, error } = await supabase.rpc('verify_phone_otp', {
      p_user_id: user.id,
      p_phone_number: phoneNumber,
      p_otp_code: otp
    })

    if (error) {
      console.error('Error verifying OTP:', error)
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }

    const result = data?.[0]
    
    if (!result) {
      return NextResponse.json({ error: 'Verification failed' }, { status: 500 })
    }

    if (result.success) {
      return NextResponse.json({ 
        success: true, 
        message: result.message 
      })
    } else {
      return NextResponse.json({ 
        success: false, 
        error: result.message 
      }, { status: 400 })
    }

  } catch (error) {
    console.error('Verify phone OTP error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}