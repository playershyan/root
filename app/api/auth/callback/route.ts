import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { EmailOtpType } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)

  // Handle new token_hash flow (for email verification)
  const token_hash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type') as EmailOtpType | null

  // Handle legacy code flow (for OAuth and password recovery)
  const code = requestUrl.searchParams.get('code')

  const supabase = createRouteHandlerClient({ cookies })

  // New token_hash flow for email verification
  if (token_hash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    })

    if (!error && data?.user) {
      // Check if this is a password recovery flow
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/reset-password', request.url))
      }

      // For email verification, check if user has completed profile setup
      if (type === 'email') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, phone')
          .eq('id', data.user.id)
          .single()

        // If no profile exists or profile is incomplete, redirect to setup
        if (!profile || !profile.name || !profile.phone) {
          return NextResponse.redirect(new URL('/profile/setup', request.url))
        }
      }

      // Successful verification, redirect to profile
      return NextResponse.redirect(new URL('/profile', request.url))
    }

    // Token verification failed, redirect to error page
    return NextResponse.redirect(new URL('/auth/error', request.url))
  }

  // Legacy code flow for OAuth providers and other auth methods
  if (code) {
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session?.user) {
      // Check if this is a password recovery flow
      if (data.session.user?.recovery_sent_at) {
        return NextResponse.redirect(new URL('/reset-password', request.url))
      }

      // Check if user has completed profile setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, phone')
        .eq('id', data.session.user.id)
        .single()

      // If no profile exists or profile is incomplete, redirect to setup
      if (!profile || !profile.name || !profile.phone) {
        return NextResponse.redirect(new URL('/profile/setup', request.url))
      }

      // Profile exists, redirect to main profile page
      return NextResponse.redirect(new URL('/profile', request.url))
    }
  }

  // URL to redirect to after sign in process completes
  // Check for pending redirect in URL params or default to home
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}