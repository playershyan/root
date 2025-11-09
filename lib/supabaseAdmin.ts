import { createClient } from '@supabase/supabase-js'
import { logger } from '@/lib/utils/logger'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  logger.warn('Missing env.SUPABASE_SERVICE_ROLE_KEY - admin functions will fail')
}

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
)