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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          phone,
          name
        }
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