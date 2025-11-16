#!/usr/bin/env ts-node

/**
 * Normalize all phone numbers in auth.users to E.164 format
 *
 * This script:
 * 1. Lists all users in auth.users
 * 2. Identifies users with phone numbers not in E.164 format
 * 3. Updates them to E.164 format (+94XXXXXXXXX)
 *
 * Run with: npx ts-node scripts/normalize-auth-phone-numbers.ts
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from '../lib/utils/phoneFormatter.js'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface UpdateResult {
  userId: string
  oldPhone: string
  newPhone: string
  success: boolean
  error?: string
}

const results: UpdateResult[] = []

function log(message: string, data?: any) {
  console.log(`[${new Date().toISOString()}] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function logError(message: string, error: any) {
  console.error(`[ERROR] ${message}`, error)
}

async function main() {
  console.log('Starting auth.users phone number normalization...\n')

  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    logError('Missing environment variables', {
      hasUrl: !!SUPABASE_URL,
      hasKey: !!SUPABASE_SERVICE_ROLE_KEY
    })
    process.exit(1)
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Step 1: List all users
  log('Fetching all users from auth.users...')
  const { data, error } = await supabase.auth.admin.listUsers()

  if (error) {
    logError('Failed to list users', error)
    process.exit(1)
  }

  const users = data?.users || []
  log(`Found ${users.length} total users`)

  // Step 2: Identify users with phone numbers
  const usersWithPhone = users.filter(user => !!user.phone)
  log(`Found ${usersWithPhone.length} users with phone numbers`)

  // Step 3: Identify users needing normalization
  const usersNeedingUpdate = usersWithPhone.filter(user => {
    const phone = user.phone!
    // E.164 format starts with +
    return !phone.startsWith('+')
  })

  log(`Found ${usersNeedingUpdate.length} users with non-E.164 phone numbers\n`)

  if (usersNeedingUpdate.length === 0) {
    log('✅ All phone numbers are already in E.164 format!')
    return
  }

  // Step 4: Update each user
  log('Starting phone number updates...\n')

  for (const user of usersNeedingUpdate) {
    const oldPhone = user.phone!

    try {
      // Normalize the phone number
      const normalized = normalizeSriLankaPhone(oldPhone)

      if (!normalized || !isValidSriLankanPhone(normalized)) {
        const errorMsg = `Invalid phone format: ${oldPhone}`
        logError(`User ${user.id}:`, errorMsg)
        results.push({
          userId: user.id,
          oldPhone,
          newPhone: '',
          success: false,
          error: errorMsg
        })
        continue
      }

      // Convert to E.164
      const newPhone = `+${normalized}`

      // Check if this phone number is already used by another user
      const existingUser = usersWithPhone.find(u => u.phone === newPhone && u.id !== user.id)
      if (existingUser) {
        const errorMsg = `Phone ${newPhone} already exists for user ${existingUser.id}`
        logError(`User ${user.id}:`, errorMsg)
        results.push({
          userId: user.id,
          oldPhone,
          newPhone,
          success: false,
          error: errorMsg
        })
        continue
      }

      log(`Updating user ${user.id}: ${oldPhone} → ${newPhone}`)

      // Update the user's phone number
      const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
        phone: newPhone
      })

      if (updateError) {
        logError(`Failed to update user ${user.id}`, updateError)
        results.push({
          userId: user.id,
          oldPhone,
          newPhone,
          success: false,
          error: updateError.message
        })
      } else {
        log(`✅ Successfully updated user ${user.id}`)
        results.push({
          userId: user.id,
          oldPhone,
          newPhone,
          success: true
        })
      }

    } catch (err) {
      logError(`Exception updating user ${user.id}`, err)
      results.push({
        userId: user.id,
        oldPhone,
        newPhone: '',
        success: false,
        error: err instanceof Error ? err.message : 'Unknown error'
      })
    }
  }

  // Step 5: Print summary
  console.log('\n' + '='.repeat(80))
  console.log('NORMALIZATION SUMMARY')
  console.log('='.repeat(80))

  const successful = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`\nTotal Users: ${usersNeedingUpdate.length}`)
  console.log(`✅ Successfully Updated: ${successful}`)
  console.log(`❌ Failed: ${failed}`)

  if (failed > 0) {
    console.log('\nFAILED UPDATES:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  ❌ User ${r.userId}`)
      console.log(`     Old: ${r.oldPhone}`)
      console.log(`     Error: ${r.error}`)
    })
  }

  if (successful > 0) {
    console.log('\nSUCCESSFUL UPDATES:')
    results.filter(r => r.success).forEach(r => {
      console.log(`  ✅ User ${r.userId}: ${r.oldPhone} → ${r.newPhone}`)
    })
  }

  console.log('\n' + '='.repeat(80))
  console.log('✅ Normalization complete!')
  console.log('='.repeat(80) + '\n')

  // Exit with appropriate code
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Script failed:', error)
  process.exit(1)
})
