/*
  Danger: Permanently delete all listings, wanted_requests, profiles and related data.
  Usage:
    - Ensure env vars are set: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
    - Run with Node: `ts-node scripts/admin/purge-all-data.ts --confirm PURGE`
    - This will TRUNCATE tables and cannot be undone.
*/

import { createClient } from '@supabase/supabase-js'

async function main() {
  const args = process.argv.slice(2)
  const confirmIndex = args.indexOf('--confirm')
  const confirmValue = confirmIndex >= 0 ? args[confirmIndex + 1] : undefined
  if (confirmValue !== 'PURGE') {
    throw new Error('Refusing to run. Pass --confirm PURGE to proceed.')
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  }

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  // Delete child/dependent tables first, then parent tables.
  // Using a catch-and-continue approach to ensure best-effort cleanup.
  async function wipe(table: string) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) {
      throw new Error(`Failed to delete from ${table}: ${error.message}`)
    }
  }

  const order = [
    // child tables
    'favorites',
    'messages',
    'conversations',
    'offers',
    'promotions',
    'deleted_listings',
    'deleted_wanted_requests',
    'deletion_logs',
    'cleanup_logs',
    // main entities
    'wanted_requests',
    'listings',
    'business_profiles',
    'profiles',
  ]

  for (const t of order) {
    try { await wipe(t) } catch (e) { throw e }
  }

  // Optionally verify counts
  // Skipping for safety to avoid exposing data
}

main().then(() => {
  process.exit(0)
}).catch((err) => {
  console.error(err)
  process.exit(1)
})
