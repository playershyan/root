import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

function requireEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`${name} environment variable is required`)
  }
  return value
}

export function createServerSupabaseClient() {
  return createServerComponentClient({ cookies })
}

// Service role client for admin-only operations (bypasses RLS)
export function createServiceSupabaseClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseServiceKey = requireEnv('SUPABASE_SERVICE_ROLE_KEY')

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Public client for read-only operations that respect RLS
export function createPublicSupabaseClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Authenticated client for user operations (respects RLS)
export function createAuthenticatedSupabaseClient() {
  const supabaseUrl = requireEnv('NEXT_PUBLIC_SUPABASE_URL')
  const supabaseAnonKey = requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')

  return createClient(supabaseUrl, supabaseAnonKey)
}