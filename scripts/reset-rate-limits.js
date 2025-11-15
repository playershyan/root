#!/usr/bin/env node

/**
 * Reset Site-Wide Rate Limiters Script
 * 
 * This script resets all rate limiting systems:
 * 1. Redis/Upstash rate limiters (if configured)
 * 2. Database-based OTP rate limiting (phone_verifications table)
 * 3. Optionally: IP quarantine records (if using quarantine system)
 * 
 * Usage:
 *   node scripts/reset-rate-limits.js [options]
 * 
 * Options:
 *   --all              Reset all rate limiters (default)
 *   --redis            Reset only Redis/Upstash rate limiters
 *   --otp              Reset only OTP rate limits (database)
 *   --phone <number>   Reset OTP rate limit for specific phone number
 *   --ip-quarantine    Reset IP quarantine/block records
 *   --help             Show this help message
 * 
 * Examples:
 *   node scripts/reset-rate-limits.js --all
 *   node scripts/reset-rate-limits.js --otp
 *   node scripts/reset-rate-limits.js --phone 94771234567
 *   node scripts/reset-rate-limits.js --redis --otp
 */

require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function showHelp() {
  log('\n📋 Reset Site-Wide Rate Limiters', 'bright')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
  log('\nUsage: node scripts/reset-rate-limits.js [options]\n', 'yellow')
  log('Options:', 'bright')
  log('  --all              Reset all rate limiters (default)', 'cyan')
  log('  --redis            Reset only Redis/Upstash rate limiters (if configured)', 'cyan')
  log('  --otp              Reset only OTP rate limits (database) ⭐ Active', 'cyan')
  log('  --phone <number>   Reset OTP rate limit for specific phone number', 'cyan')
  log('  --ip-quarantine    Reset IP quarantine/block records', 'cyan')
  log('  --help             Show this help message\n', 'cyan')
  log('Note: In-memory rate limiters reset on server restart.', 'yellow')
  log('      Database OTP limits persist and need manual reset.\n', 'yellow')
  log('Examples:', 'bright')
  log('  node scripts/reset-rate-limits.js --all', 'green')
  log('  node scripts/reset-rate-limits.js --otp', 'green')
  log('  node scripts/reset-rate-limits.js --phone 94771234567', 'green')
  log('  node scripts/reset-rate-limits.js --redis --otp\n', 'green')
}

async function resetRedisRateLimits() {
  const useUpstash = (process.env.USE_UPSTASH || '').toLowerCase() === 'true'
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!useUpstash || !upstashUrl || !upstashToken) {
    log('⚠️  Redis/Upstash not configured.', 'yellow')
    log('💡 Using in-memory rate limiters instead (resets on server restart).', 'cyan')
    return { success: false, skipped: true }
  }

  log('\n🔄 Resetting Redis/Upstash rate limiters...', 'blue')

  try {
    // Import Upstash Redis client
    const { Redis } = require('@upstash/redis')
    const redis = new Redis({
      url: upstashUrl,
      token: upstashToken,
    })

    // Get all rate limit keys (pattern: rl:*)
    const keys = await redis.keys('rl:*')
    
    if (!keys || keys.length === 0) {
      log('✅ No Redis rate limit keys found.', 'green')
      return { success: true, deleted: 0 }
    }

    log(`📊 Found ${keys.length} rate limit keys.`, 'cyan')

    // Delete all rate limit keys
    let deletedCount = 0
    for (const key of keys) {
      try {
        await redis.del(key)
        deletedCount++
      } catch (error) {
        log(`⚠️  Error deleting key ${key}: ${error.message}`, 'yellow')
      }
    }

    log(`✅ Reset Redis rate limiters! Deleted ${deletedCount} keys.`, 'green')
    return { success: true, deleted: deletedCount }

  } catch (error) {
    log(`❌ Error resetting Redis rate limiters: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

function resetInMemoryRateLimiters() {
  log('\n🔄 In-Memory Rate Limiters Info...', 'blue')
  log('💡 In-memory rate limiters (LRUCache) are stored in server memory.', 'cyan')
  log('💡 They automatically reset when the server restarts.', 'cyan')
  log('💡 To reset NOW without restarting:', 'yellow')
  log('   1. Restart your Next.js server/dev server', 'cyan')
  log('   2. Or redeploy your application (Vercel/production)', 'cyan')
  log('💡 Current in-memory limiters:', 'yellow')
  log('   - API: 100 req/min', 'cyan')
  log('   - Auth: 5 req/15min', 'cyan')
  log('   - Search: 30 req/min', 'cyan')
  log('   - Upload: 15 req/min', 'cyan')
  log('   - Messaging: 20 req/min', 'cyan')
  log('   - AI: 10 req/min', 'cyan')
  log('   - Admin: 50 req/min', 'cyan')
  log('   - Strict: 20 req/15min', 'cyan')
  log('⚠️  Cannot reset in-memory limiters from script (require server restart).', 'yellow')
  return { success: true, info: 'Requires server restart' }
}

async function resetOTPRateLimits(phoneNumber = null) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    log('❌ Error: Missing Supabase environment variables', 'red')
    log('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY', 'yellow')
    return { success: false, error: 'Missing env vars' }
  }

  log(phoneNumber 
    ? `\n🔄 Resetting OTP rate limit for phone: ${phoneNumber}` 
    : '\n🔄 Resetting all OTP rate limits...', 'blue')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Format phone number if provided
    let formattedPhone = null
    if (phoneNumber) {
      formattedPhone = phoneNumber.replace(/[^0-9]/g, '')
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '94' + formattedPhone.substring(1)
      } else if (!formattedPhone.startsWith('94')) {
        formattedPhone = '94' + formattedPhone
      }
    }

    // Delete OTP records from last hour (or all if no phone specified)
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    
    let deleteQuery = supabase
      .from('phone_verifications')
      .delete()
      .gte('created_at', oneHourAgo)

    if (formattedPhone) {
      deleteQuery = deleteQuery.eq('phone_number', formattedPhone)
    }

    const { data, error } = await deleteQuery

    if (error) {
      log(`❌ Error: ${error.message}`, 'red')
      return { success: false, error: error.message }
    }

    const deletedCount = data?.length || 0
    log(`✅ Reset OTP rate limits! Deleted ${deletedCount} OTP records.`, 'green')
    
    return { success: true, deleted: deletedCount }

  } catch (error) {
    log(`❌ Error resetting OTP rate limits: ${error.message}`, 'red')
    return { success: false, error: error.message }
  }
}

async function resetIPQuarantine() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    log('⚠️  Supabase not configured. Skipping IP quarantine reset.', 'yellow')
    return { success: false, skipped: true }
  }

  log('\n🔄 Resetting IP quarantine records...', 'blue')

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Check if quarantine table exists (it might be in Redis or a custom table)
    // For now, we'll check common table names
    const possibleTables = ['ip_quarantine', 'blocked_ips', 'security_strikes']
    
    let deletedCount = 0
    for (const tableName of possibleTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all

        if (!error && data) {
          deletedCount += data.length || 0
          log(`  ✓ Cleared ${tableName}: ${data.length || 0} records`, 'green')
        }
      } catch (tableError) {
        // Table might not exist, skip silently
      }
    }

    if (deletedCount === 0) {
      log('⚠️  No IP quarantine tables found or they use Redis.', 'yellow')
      log('💡 IP quarantine might be stored in Redis. Use --redis to clear.', 'cyan')
    } else {
      log(`✅ Reset IP quarantine! Cleared ${deletedCount} records.`, 'green')
    }

    return { success: true, deleted: deletedCount }

  } catch (error) {
    log(`⚠️  Could not reset IP quarantine: ${error.message}`, 'yellow')
    return { success: false, error: error.message }
  }
}

async function main() {
  const args = process.argv.slice(2)

  // Parse arguments
  const options = {
    all: args.includes('--all') || args.length === 0,
    redis: args.includes('--redis'),
    otp: args.includes('--otp'),
    ipQuarantine: args.includes('--ip-quarantine'),
    phone: args.includes('--phone') ? args[args.indexOf('--phone') + 1] : null,
    help: args.includes('--help'),
  }

  if (options.help) {
    showHelp()
    process.exit(0)
  }

  log('\n🚀 Rate Limiter Reset Tool', 'bright')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  const results = {
    redis: null,
    otp: null,
    ipQuarantine: null,
  }

  // Show in-memory rate limiter info (always show for context)
  if (options.all) {
    resetInMemoryRateLimiters()
  }

  // Reset Redis rate limiters (if configured)
  if (options.all || options.redis) {
    results.redis = await resetRedisRateLimits()
  }

  // Reset OTP rate limits (database-based - this is what's actively limiting)
  if (options.all || options.otp || options.phone) {
    results.otp = await resetOTPRateLimits(options.phone)
  }

  // Reset IP quarantine
  if (options.all || options.ipQuarantine) {
    results.ipQuarantine = await resetIPQuarantine()
  }

  // Summary
  log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan')
  log('📊 Reset Summary', 'bright')
  log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n', 'cyan')

  if (results.redis) {
    if (results.redis.skipped) {
      log('  Redis: ⚪ Skipped (not configured)', 'yellow')
    } else if (results.redis.success) {
      log(`  Redis: ✅ Reset (${results.redis.deleted} keys deleted)`, 'green')
    } else {
      log(`  Redis: ❌ Failed (${results.redis.error})`, 'red')
    }
  }

  if (results.otp) {
    if (results.otp.success) {
      log(`  OTP: ✅ Reset (${results.otp.deleted} records deleted)`, 'green')
    } else if (!results.otp.error) {
      log('  OTP: ⚪ Skipped', 'yellow')
    } else {
      log(`  OTP: ❌ Failed (${results.otp.error})`, 'red')
    }
  }

  if (results.ipQuarantine) {
    if (results.ipQuarantine.skipped) {
      log('  IP Quarantine: ⚪ Skipped', 'yellow')
    } else if (results.ipQuarantine.success) {
      log(`  IP Quarantine: ✅ Reset (${results.ipQuarantine.deleted} records)`, 'green')
    } else {
      log(`  IP Quarantine: ⚠️  Partial (${results.ipQuarantine.error})`, 'yellow')
    }
  }

  log('\n✨ Rate limit reset complete!\n', 'green')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    log(`\n❌ Fatal error: ${error.message}`, 'red')
    console.error(error)
    process.exit(1)
  })

