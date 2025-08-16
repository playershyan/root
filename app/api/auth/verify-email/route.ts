import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const token = requestUrl.searchParams.get('token')
  const type = requestUrl.searchParams.get('type')

  if (token && type) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Verify the email change token
    const { error } = await supabase.auth.verifyOtp({
      token_hash: token,
      type: type as any
    })

    if (!error) {
      // Update the profile to mark email as verified
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await supabase
          .from('profiles')
          .update({ email_verified: true })
          .eq('id', user.id)
      }

      // Redirect to home page with success message
      return NextResponse.redirect(new URL('/?email_verified=true', requestUrl.origin))
    }
  }

  // If verification failed, redirect to home with error
  return NextResponse.redirect(new URL('/?email_verification_failed=true', requestUrl.origin))
}