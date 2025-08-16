import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import jwt from 'jsonwebtoken'

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json()
    
    if (!credential) {
      return NextResponse.json({ error: 'No credential provided' }, { status: 400 })
    }

    // Decode the JWT token from Google (without verification for now)
    // In production, you should verify the token with Google's public keys
    const decoded = jwt.decode(credential) as any
    
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid credential' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Try to sign in with Google OAuth
    const { data, error } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token: credential,
    })

    if (error) {
      // If user doesn't exist, try to sign up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: decoded.email,
        password: Math.random().toString(36).slice(-8), // Random password since we're using OAuth
        options: {
          data: {
            name: decoded.name,
            avatar_url: decoded.picture,
            email_verified: decoded.email_verified,
          }
        }
      })

      if (signUpError) {
        return NextResponse.json({ error: signUpError.message }, { status: 400 })
      }

      // Create profile for new user
      if (signUpData.user) {
        await supabase.from('profiles').insert({
          id: signUpData.user.id,
          email: decoded.email,
          name: decoded.name,
          created_at: new Date().toISOString()
        })
      }

      return NextResponse.json({ success: true, user: signUpData.user })
    }

    return NextResponse.json({ success: true, user: data.user })
  } catch (error) {
    console.error('Google One Tap error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}