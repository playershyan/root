/*
  Danger: Permanently delete all listings, wanted_requests, profiles and related data.
  Usage:
    node scripts/admin/purge-all-data.js --confirm PURGE
*/
const { createClient } = require('@supabase/supabase-js')

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

  async function wipe(table) {
    const { error } = await supabase.from(table).delete().not('id', 'is', null)
    if (error) throw new Error(`Failed to delete from ${table}: ${error.message}`)
  }

  const order = [
    'favorites',
    'messages',
    'conversations',
    'offers',
    'promotions',
    'deleted_listings',
    'deleted_wanted_requests',
    'deletion_logs',
    'cleanup_logs',
    'wanted_requests',
    'listings',
    'business_profiles',
    'profiles',
  ]

  for (const t of order) {
    await wipe(t)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

