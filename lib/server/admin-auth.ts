import 'server-only'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import type { SupabaseClient } from '@supabase/supabase-js'

type AppSupabaseClient = SupabaseClient<any, 'public', any>

interface AdminContext {
  supabase: AppSupabaseClient
  user: {
    id: string
    email?: string | null
  }
  role: string
  permissions: string[]
}

async function resolveAdminRecord(supabase: AppSupabaseClient, userId: string) {
  try {
    const response = await supabase.rpc('has_admin_access', { check_user_id: userId })
    const result = Array.isArray(response.data) ? response.data[0] : response.data

    if (response.error) {
      throw response.error
    }

    if (result?.is_admin) {
      return {
        role: result.user_role ?? 'admin',
        permissions: Array.isArray(result.user_permissions) ? result.user_permissions : [],
      }
    }
  } catch (error: any) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Admin RPC check failed, attempting table fallback', error)
    }
  }

  const { data: adminUser, error: tableError } = await supabase
    .from('admin_users')
    .select('role, permissions, is_active')
    .eq('user_id', userId)
    .eq('is_active', true)
    .single()

  if (tableError || !adminUser) {
    return null
  }

  return {
    role: adminUser.role ?? 'admin',
    permissions: Array.isArray(adminUser.permissions) ? adminUser.permissions : [],
  }
}

export async function ensureAdmin(requiredPermission?: string): Promise<AdminContext> {
  const supabase = createServerComponentClient<any>({ cookies }) as AppSupabaseClient

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect('/login')
  }

  const adminRecord = await resolveAdminRecord(supabase, user.id)

  if (!adminRecord) {
    redirect('/')
  }

  const permissions = adminRecord.permissions ?? []
  const role = adminRecord.role ?? 'admin'

  if (
    requiredPermission &&
    role !== 'admin' &&
    !permissions.includes(requiredPermission)
  ) {
    redirect('/')
  }

  return {
    supabase,
    user: { id: user.id, email: user.email },
    role,
    permissions,
  }
}
