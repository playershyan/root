import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { OAuth2Client } from 'google-auth-library'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()
    
    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // First verify the token with Google to get user info
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Try to use signInWithIdToken
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) {
      console.error('Supabase signInWithIdToken error:', error)
      if (typeof error.message === 'string' && error.message.toLowerCase().includes('provider is not enabled')) {
        return NextResponse.json({
          success: false,
          error: 'Supabase Google provider not enabled. Enable Google in Supabase Dashboard > Authentication > Providers and configure Client ID/Secret.',
          code: 'provider_not_enabled'
        }, { status: 400 })
      }
      
      // If signInWithIdToken doesn't work, fallback to checking if user exists
      // and prompt them to use OAuth flow
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', payload.email)
        .single()

      if (existingProfile) {
        // User exists - they need to sign in with OAuth
        return NextResponse.json({ 
          success: false,
          needsOAuth: true,
          message: 'Account exists. Please use "Continue with Google" button to sign in.'
        })
      } else {
        // New user - they need to create account with OAuth
        return NextResponse.json({ 
          success: false,
          needsOAuth: true,
          message: 'Please use "Continue with Google" button to create your account.'
        })
      }
    }

    // If successful, user is signed in
    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Google One Tap error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
