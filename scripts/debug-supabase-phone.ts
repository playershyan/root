#!/usr/bin/env tsx

/**
 * Debug script to understand how Supabase handles phone numbers
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function main() {
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Check the user that was just created
  const userId = '78b65d4e-ca0c-4167-9c71-3b2ecb43e1d3'

  console.log('Fetching user...')
  const { data: userData, error: fetchError } = await adminClient.auth.admin.getUserById(userId)

  if (fetchError) {
    console.error('Error fetching user:', fetchError)
    return
  }

  console.log('\nUser data from getUserById:')
  console.log('  phone:', userData.user.phone)
  console.log('  phone type:', typeof userData.user.phone)
  console.log('  phone length:', userData.user.phone?.length)
  console.log('  phone charCodes:', userData.user.phone?.split('').map((c: string) => c.charCodeAt(0)))

  // Now try to update it
  console.log('\nAttempting to update phone to +94783607777...')
  const { data: updateData, error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
    phone: '+94783607777',
    phone_confirm: true
  })

  if (updateError) {
    console.error('Error updating:', updateError)
  } else {
    console.log('Update response:')
    console.log('  phone:', updateData.user.phone)
    console.log('  phone_confirmed_at:', updateData.user.phone_confirmed_at)
  }

  // Verify the update
  console.log('\nVerifying update in database...')
  const { data: verifyData } = await adminClient.auth.admin.getUserById(userId)
  console.log('  phone:', verifyData?.user.phone)
  console.log('  phone_confirmed_at:', verifyData?.user.phone_confirmed_at)
}

main().catch(console.error)
