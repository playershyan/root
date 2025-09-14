import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error && data?.session) {
      // Check if this is a password recovery flow
      // The type parameter is set to 'recovery' in our reset email
      // Or we can check the session metadata
      if (type === 'recovery' || data.session.user?.recovery_sent_at) {
        // Redirect to reset password page
        return NextResponse.redirect(new URL('/reset-password', request.url))
      }
    }
  }

  // URL to redirect to after sign in process completes
  // Check for pending redirect in URL params or default to profile
  const redirectTo = requestUrl.searchParams.get('redirectTo') || '/profile'
  return NextResponse.redirect(new URL(redirectTo, request.url))
}