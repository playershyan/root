import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { OAuth2Client } from 'google-auth-library'
import { log } from '../../../../lib/utils/logger'

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID)

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()
    
    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Use the same flow as Google One Tap for consistency
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) {
      log.auth.error('Google sign-in with Supabase', error)
      
      // If provider not enabled error
      if (error.message?.includes('provider is not enabled')) {
        return NextResponse.json({ 
          error: 'Google provider not enabled in Supabase. Please enable it in your Supabase dashboard under Authentication > Providers.',
          details: 'Go to: https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo/auth/providers'
        }, { status: 400 })
      }
      
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Verify the token with Google for additional user info
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()

    // Check if profile exists, if not create one
    if (data.user && payload) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          email: payload.email,
          name: payload.name,
          avatar_url: payload.picture,
          created_at: new Date().toISOString()
        })
      }
    }

    return NextResponse.json({ success: true, user: data.user })

  } catch (error) {
    log.auth.error('Google Sign-in error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}