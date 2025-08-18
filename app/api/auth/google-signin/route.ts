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

    // Verify the token with Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    })
    
    const payload = ticket.getPayload()
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid token payload' }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    
    // Check if user exists with this email
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', payload.email)
      .single()

    let userId: string

    if (!existingProfile) {
      // Create a new user with email/password auth
      // Generate a secure random password that user won't need to know
      const randomPassword = crypto.randomUUID() + crypto.randomUUID()
      
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: payload.email,
        password: randomPassword,
        options: {
          data: {
            name: payload.name,
            avatar_url: payload.picture,
            provider: 'google',
            google_id: payload.sub
          }
        }
      })

      if (signUpError) {
        // User might already exist, try to sign them in
        const { data: userData } = await supabase.auth.admin.getUserByEmail(payload.email)
        if (userData?.user) {
          userId = userData.user.id
        } else {
          return NextResponse.json({ error: signUpError.message }, { status: 400 })
        }
      } else if (signUpData.user) {
        userId = signUpData.user.id
        
        // Create profile for new user
        await supabase.from('profiles').insert({
          id: userId,
          email: payload.email,
          name: payload.name,
          avatar_url: payload.picture,
          created_at: new Date().toISOString()
        })
      } else {
        return NextResponse.json({ error: 'Failed to create user' }, { status: 400 })
      }
    } else {
      userId = existingProfile.id
    }

    // Create a session for the user
    const { data: sessionData, error: sessionError } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: 'dummy' // This will fail, but we'll handle it differently
    }).catch(() => ({ data: null, error: 'Need alternative auth' }))

    // Since we can't sign in with password (we don't know it), we'll create a magic link
    const { data: magicLinkData, error: magicLinkError } = await supabase.auth.signInWithOtp({
      email: payload.email,
      options: {
        shouldCreateUser: false
      }
    })

    if (magicLinkError) {
      return NextResponse.json({ error: magicLinkError.message }, { status: 400 })
    }

    // Return success with instruction to check email
    return NextResponse.json({ 
      success: true, 
      message: 'Please check your email for a login link',
      requiresEmailVerification: true,
      user: { id: userId, email: payload.email, name: payload.name }
    })

  } catch (error) {
    console.error('Google Sign-in error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}