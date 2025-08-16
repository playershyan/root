import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const type = requestUrl.searchParams.get('type')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Handle email change confirmation
    if (type === 'email_change') {
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      
      if (!error) {
        // Update profile to mark email as verified
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          await supabase
            .from('profiles')
            .update({ email_verified: true })
            .eq('id', user.id)
        }
        
        // Redirect to home with success message
        return NextResponse.redirect(new URL('/?email_verified=true', requestUrl.origin))
      }
    } else {
      // Regular OAuth callback
      await supabase.auth.exchangeCodeForSession(code)
      return NextResponse.redirect(new URL('/profile', requestUrl.origin))
    }
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin))
}