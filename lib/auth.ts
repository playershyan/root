import { supabase } from './supabase'

export interface AuthError {
  message: string
  code?: string
}

/**
 * Send OTP code to phone number using custom OTP API
 * Uses our custom phone verification system, not Supabase's built-in SMS
 */
export async function sendPhoneOTP(
  phone: string,
  flow: 'register' | 'login'
): Promise<{ success: boolean; error?: AuthError; expiresIn?: number }> {
  try {
    const response = await fetch('/api/auth/send-phone-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phone,
        flow
      })
    })

    const result = await response.json()

    if (!response.ok) {
      return {
        success: false,
        error: {
          message: result.error || 'Failed to send OTP',
          code: 'otp_send_failed'
        }
      }
    }

    return {
      success: true,
      expiresIn: result.expiresIn
    }
  } catch (error) {
    return {
      success: false,
      error: { message: 'Failed to send OTP. Please try again.' }
    }
  }
}

/**
 * Verify OTP code using custom OTP API
 * Uses our custom phone verification system, not Supabase's built-in SMS
 *
 * For registration flow: Verifies OTP then creates account via /api/auth/create-account
 * For login flow: Verifies OTP and returns session
 */
export async function verifyOTP(
  phone: string,
  token: string,
  name?: string
): Promise<{ success: boolean; error?: AuthError; user?: any; requiresAccountCreation?: boolean }> {
  try {
    // First verify the OTP code
    const verifyResponse = await fetch('/api/auth/verify-phone-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phoneNumber: phone,
        otpCode: token,
        flow: 'login' // Try login first
      })
    })

    const verifyResult = await verifyResponse.json()

    if (!verifyResponse.ok) {
      // If login fails and user doesn't exist, they need to register
      if (verifyResult.error?.includes('No account found') || verifyResult.error?.includes('User not found')) {
        // Phone was verified but no account exists - need to create account
        return {
          success: false,
          requiresAccountCreation: true,
          error: {
            message: 'Phone verified. Please complete registration.',
            code: 'account_required'
          }
        }
      }

      return {
        success: false,
        error: {
          message: verifyResult.error || 'Invalid OTP code',
          code: 'invalid_otp'
        }
      }
    }

    // If verification succeeded and returned a session, we're done (login flow)
    if (verifyResult.session) {
      // Set the session in the client
      const { error: sessionError } = await supabase.auth.setSession({
        access_token: verifyResult.session.access_token,
        refresh_token: verifyResult.session.refresh_token
      })

      if (sessionError) {
        return {
          success: false,
          error: {
            message: 'Failed to set session. Please try again.',
            code: 'session_error'
          }
        }
      }

      // Get user data
      const { data: { user } } = await supabase.auth.getUser()

      return { success: true, user }
    }

    // If no session returned, phone was verified but account needs to be created
    // This happens in registration flow
    return {
      success: true,
      requiresAccountCreation: true,
      user: null
    }

  } catch (error) {
    return {
      success: false,
      error: { message: 'Verification failed. Please try again.' }
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

export async function signUp(
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<{ success: boolean; error?: AuthError; user?: any; requiresEmailVerification?: boolean }> {
  try {
    // Get the current site URL for email redirect
    const siteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          phone
        },
        emailRedirectTo: `${siteUrl}/api/auth/callback`
      }
    })

    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }

    if (data.user) {
      // Create user profile
      await supabase
        .from('profiles')
        .insert({
          id: data.user.id,
          email,
          phone,
          name,
          created_at: new Date().toISOString()
        })
      
      // Check if email verification is required
      // Supabase returns user with email_confirmed_at as null if verification is required
      const requiresEmailVerification = !data.user.email_confirmed_at
      
      return { 
        success: true, 
        user: data.user,
        requiresEmailVerification 
      }
    }

    return { success: true, user: data.user }
  } catch (error) {
    return {
      success: false,
      error: { message: 'Failed to create account. Please try again.' }
    }
  }
}

export async function resendEmailVerification(
  email: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    // Get the current site URL for email redirect (same as signup)
    const siteUrl = typeof window !== 'undefined'
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'

    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email,
      options: {
        emailRedirectTo: `${siteUrl}/api/auth/callback`
      }
    })
    
    if (error) {
      return { success: false, error: { message: error.message, code: error.code } }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to resend email. Please try again.' }
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
    const pendingRedirect = localStorage.getItem('pendingRedirect')
    const redirectPath = pendingRedirect || '/profile'

    let redirectTo: string

    if (typeof window !== 'undefined') {
      redirectTo = window.location.origin
    } else {
      redirectTo = process.env.NEXT_PUBLIC_SITE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://vera.lk'
    }

    const callbackUrl = `${redirectTo}/auth/callback?redirectTo=${encodeURIComponent(redirectPath)}`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: callbackUrl,
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
    return { shouldAutoLogin: false }
  }
}