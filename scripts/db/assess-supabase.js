/*
  Read-only Supabase robustness/security assessment.
  - Calls validation RPCs and views defined in your migrations
  - Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
*/

require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

function envOrThrow(name) {
  const v = process.env[name]
  if (!v) throw new Error(`Missing env var: ${name}`)
  return v
}

async function main() {
  const url = envOrThrow('NEXT_PUBLIC_SUPABASE_URL')
  const serviceKey = envOrThrow('SUPABASE_SERVICE_ROLE_KEY')

  const supabase = createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })

  const results = { timestamp: new Date().toISOString(), url }

  // 1) Security validation
  try {
    const { data, error } = await supabase.rpc('validate_security_fixes')
    if (error) throw error
    results.validate_security_fixes = data
  } catch (err) {
    results.validate_security_fixes = { error: String(err?.message || err) }
  }

  // 2) Performance validation (INVOKER)
  try {
    const { data, error } = await supabase.rpc('validate_performance_fixes')
    if (error) throw error
    results.validate_performance_fixes = data
  } catch (err) {
    results.validate_performance_fixes = { error: String(err?.message || err) }
  }

  // 3) Lint/Policy consolidation validation
  try {
    const { data, error } = await supabase.rpc('validate_lint_fixes')
    if (error) throw error
    results.validate_lint_fixes = data
  } catch (err) {
    results.validate_lint_fixes = { error: String(err?.message || err) }
  }

  // 4) Security dashboard view
  try {
    const { data, error } = await supabase
      .from('security_status_dashboard')
      .select('*')
      .limit(50)
    if (error) throw error
    results.security_status_dashboard = data
  } catch (err) {
    results.security_status_dashboard = { error: String(err?.message || err) }
  }

  // 5) Quick table/RLS check sampling (presence only, not exhaustive)
  const tables = [
    'listings',
    'wanted_requests',
    'profiles',
    'business_profiles',
    'conversations',
    'messages',
    'offers',
    'admin_users',
    'deleted_listings',
    'deleted_wanted_requests',
    'cleanup_logs',
    'recovery_requests',
  ]
  results.tables_presence = {}
  for (const t of tables) {
    try {
      const { error } = await supabase.from(t).select('*', { count: 'exact', head: true })
      results.tables_presence[t] = error ? `ERROR: ${error.code || ''} ${error.message || ''}` : 'OK'
    } catch (err) {
      results.tables_presence[t] = `EXCEPTION: ${String(err?.message || err)}`
    }
  }

  // 6) Critical RPC existence check (do not execute destructive ones)
  const rpcSmokeTests = [
    { name: 'has_admin_access', args: { check_user_id: '00000000-0000-0000-0000-000000000000' } },
    { name: 'get_rotated_featured_ads', args: { p_limit: 0 } },
  ]
  results.rpc_existence = {}
  for (const r of rpcSmokeTests) {
    try {
      const { error } = await supabase.rpc(r.name, r.args)
      results.rpc_existence[r.name] = error ? `ERROR: ${error.code || ''} ${error.message || ''}` : 'OK'
    } catch (err) {
      results.rpc_existence[r.name] = `EXCEPTION: ${String(err?.message || err)}`
    }
  }

  // Output
  console.log(JSON.stringify(results, null, 2))
}

main().catch((e) => {
  console.error('Assessment failed:', e)
  process.exit(1)
})
