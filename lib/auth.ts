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

export async function verifyOTP(
  phone: string,
  token: string,
  name?: string
): Promise<{ success: boolean; error?: AuthError; user?: any }> {
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
      const resolvedName =
        name?.trim() ||
        data.user.user_metadata?.full_name ||
        data.user.user_metadata?.name ||
        null

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, name, phone')
        .eq('id', data.user.id)
        .single()

      if (!existingProfile) {
        await supabase.from('profiles').insert({
          id: data.user.id,
          phone,
          name: resolvedName,
          email: data.user.email,
          created_at: new Date().toISOString()
        })
      } else if (!existingProfile.name || !existingProfile.phone) {
        const updatePayload: Record<string, string | null> = {}
        if (!existingProfile.name && resolvedName) {
          updatePayload.name = resolvedName
        }
        if (!existingProfile.phone && phone) {
          updatePayload.phone = phone
        }

        if (Object.keys(updatePayload).length > 0) {
          await supabase
            .from('profiles')
            .update({
              ...updatePayload,
              updated_at: new Date().toISOString()
            })
            .eq('id', data.user.id)
        }
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

export async function signUp(
  email: string,
  password: string,
  name?: string,
  phone?: string
): Promise<{ success: boolean; error?: AuthError; user?: any }> {
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
    const pendingRedirect = localStorage.getItem('pendingRedirect')
    const redirectPath = pendingRedirect || '/profile'

    let redirectTo: string

    if (typeof window !== 'undefined') {
      redirectTo = window.location.origin
    } else {
      redirectTo = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3001'
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