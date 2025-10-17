import { supabase } from './supabase'

export interface AuthError {
  message: string
  code?: string
}

export async function signInWithOTP(phone: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signInWithOtp({
      phone: phone,
      options: {
        channel: 'sms'
      }
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to send OTP. Please try again.' }
    }
  }
}

export async function signInWithEmailOTP(email: string): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const res = await fetch('/api/auth/send-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: { message: data.error } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to send email OTP. Please try again.' }
    }
  }
}

export async function verifyEmailOTP(email: string, token: string): Promise<{ success: boolean; error?: AuthError; user?: any }> {
  try {
    const res = await fetch('/api/auth/verify-email-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, token }),
    })

    const data = await res.json()

    if (!res.ok) {
      return { success: false, error: { message: data.error } }
    }

    return { success: true, user: data.user }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Invalid OTP. Please try again.' }
    }
  }
}

export async function verifyOTP(phone: string, token: string): Promise<{ success: boolean; error?: AuthError; user?: any }> {
  try {
    const { data, error } = await supabase.auth.verifyOtp({
      phone: phone,
      token: token,
      type: 'sms'
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    if (data.user) {
      // Check if user profile exists, if not create one
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (!profile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          phone: phone,
          created_at: new Date().toISOString()
        })
      }
    }

    return { success: true, user: data.user }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Invalid OTP. Please try again.' }
    }
  }
}

export async function signInWithEmail(email: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    return { success: true, user: data.user }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to sign in. Please check your credentials.' }
    }
  }
}

export async function signUp(email: string, password: string, phone?: string, name?: string): Promise<{ success: boolean; error?: AuthError; user?: any }> {
  try {
    // Get the current site URL for email redirect
    const siteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          name
        },
        emailRedirectTo: `${siteUrl}/api/auth/callback`
      }
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    if (data.user) {
      // Create user profile
      await supabase.from('profiles').insert({
        id: data.user.id,
        email: email,
        phone: phone,
        name: name,
        created_at: new Date().toISOString()
      })
    }

    return { success: true, user: data.user }
  } catch (error) {
    return {
      success: false,
      error: { message: 'Failed to create account. Please try again.' }
    }
  }
}

export async function signOut(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.signOut()
    
    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to sign out.' }
    }
  }
}

export async function getSession() {
  const { data: { session } } = await supabase.auth.getSession()
  return session
}

export async function getUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function signInWithGoogle(): Promise<{ success: boolean; error?: AuthError }> {
  try {
    // Check for pending redirect
    const pendingRedirect = localStorage.getItem('pendingRedirect')
    const redirectPath = pendingRedirect || '/profile'
    
    // Determine the site URL for the final redirect after OAuth
    // In production, this should be https://vera.lk
    // In development, this will be http://localhost:3000
    let redirectTo: string
    
    if (typeof window !== 'undefined') {
      // Client-side: use current origin for development, or production URL
      const isProduction = window.location.hostname !== 'localhost'
      redirectTo = isProduction ? 'https://vera.lk' : window.location.origin
    } else {
      // Server-side fallback
      redirectTo = process.env.NEXT_PUBLIC_SITE_URL || 'https://vera.lk'
    }
    
    // Use Supabase OAuth flow as recommended in documentation
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${redirectTo}/api/auth/callback?redirectTo=${encodeURIComponent(redirectPath)}`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    })

    if (error) {
      if (error.message?.includes('provider is not enabled')) {
        return { 
          success: false, 
          error: { 
            message: 'Google sign-in requires enabling Google provider in Supabase Dashboard. Go to Authentication > Providers and enable Google.',
            code: 'provider_not_enabled'
          }
        }
      }
      return { success: false, error: { message: error.message, code: error.code } }
    }

    return { success: true }
  } catch (error: any) {
    if (error?.message?.includes('provider is not enabled')) {
      return { 
        success: false, 
        error: { 
          message: 'Google sign-in requires enabling Google provider in Supabase Dashboard. Go to Authentication > Providers and enable Google.',
          code: 'provider_not_enabled'
        }
      }
    }
    return { 
      success: false, 
      error: { message: 'Failed to sign in with Google. Please try again.' }
    }
  }
}


export async function signInWithPassword(email: string, password: string): Promise<{ success: boolean; error?: AuthError; user?: any }> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    // Sync email to profiles table on successful login
    if (data.user?.id && data.user?.email) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert(
          {
            id: data.user.id,
            email: data.user.email
          },
          {
            onConflict: 'id',
            ignoreDuplicates: false
          }
        )

      if (profileError) {
        console.error('Failed to sync email to profile:', profileError)
        // Non-blocking error - login still succeeds
      }
    }

    return { success: true, user: data.user }
  } catch (error: any) {
    return {
      success: false,
      error: { message: 'Failed to sign in. Please try again.' }
    }
  }
}

export async function checkAndAutoSignIn(): Promise<{ shouldAutoLogin: boolean; user?: any }> {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session) {
      return { shouldAutoLogin: false, user: session.user }
    }
    
    const hasVisitedBefore = localStorage.getItem('hasVisited')
    const autoLoginDisabled = localStorage.getItem('disableAutoLogin')
    
    if (!hasVisitedBefore && autoLoginDisabled !== 'true') {
      localStorage.setItem('hasVisited', 'true')
      return { shouldAutoLogin: true }
    }
    
    return { shouldAutoLogin: false }
  } catch (error) {
    console.error('Error checking auto sign-in:', error)
    return { shouldAutoLogin: false }
  }
}