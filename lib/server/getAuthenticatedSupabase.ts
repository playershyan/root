import 'server-only'

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import type { AuthError, SupabaseClient, User } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

type AppSupabaseClient = SupabaseClient<any, 'public', any>

interface AuthHelperOptions {
  request?: NextRequest
  token?: string | null
  allowUnauthenticated?: boolean
  traceId?: string
}

interface AuthHelperResult {
  supabase: AppSupabaseClient
  user: User | null
  token: string | null
  error: AuthError | null
}

const BEARER_PREFIX = 'bearer '

function extractBearerToken(request?: NextRequest): string | null {
  if (!request) return null

  const header = request.headers.get('authorization')
  if (!header) return null

  const normalized = header.trim()
  if (normalized.length < BEARER_PREFIX.length) {
    return null
  }

  if (normalized.toLowerCase().startsWith(BEARER_PREFIX)) {
    return normalized.slice(BEARER_PREFIX.length).trim() || null
  }

  return null
}

export async function getAuthenticatedSupabase(
  options: AuthHelperOptions = {}
): Promise<AuthHelperResult> {
  const { request, traceId, allowUnauthenticated = false } = options

  const cookieStore = cookies()
  const supabase = createRouteHandlerClient<any>({ cookies: () => cookieStore }) as AppSupabaseClient

  const token = options.token ?? extractBearerToken(request)

  const {
    data: { user },
    error,
  } = token ? await supabase.auth.getUser(token) : await supabase.auth.getUser()

  if (error && error.message !== 'Auth session missing') {
    logger.warn('Supabase auth lookup failed', {
      scope: 'getAuthenticatedSupabase',
      traceId,
      hasToken: Boolean(token),
      error: {
        message: error.message,
        name: error.name,
        status: (error as AuthError).status,
      },
    })
  }

  if (!user && !allowUnauthenticated) {
    return {
      supabase,
      user: null,
      token: token ?? null,
      error: error ?? null,
    }
  }

  return {
    supabase,
    user,
    token: token ?? null,
    error: error ?? null,
  }
}


