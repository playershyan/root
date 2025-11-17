/**
 * Phone Update Flow Test Script
 *
 * Tests the complete phone update flow:
 * 1. Send OTP to new phone number
 * 2. Verify OTP code
 * 3. Update phone in profile/listing
 *
 * Usage: npx tsx scripts/test-phone-update-flow.ts
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

interface TestResult {
  step: string
  success: boolean
  error?: string
  data?: any
}

const results: TestResult[] = []

function logResult(step: string, success: boolean, error?: string, data?: any) {
  results.push({ step, success, error, data })
  console.log(`\n[${ success ? '✓' : '✗' }] ${step}`)
  if (error) console.error(`   Error: ${error}`)
  if (data) console.log(`   Data:`, JSON.stringify(data, null, 2))
}

async function testPhoneUpdateFlow() {
  console.log('='.repeat(60))
  console.log('PHONE UPDATE FLOW TEST')
  console.log('='.repeat(60))

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Test data
  const testPhone = '94771234567' // Normalized format
  const testOTP = '123456'
  let testUserId: string | null = null
  let otpRecordId: string | null = null

  try {
    // Step 1: Get a test user
    console.log('\n--- Step 1: Finding test user ---')
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers()

    if (userError || !users || users.users.length === 0) {
      logResult('Find test user', false, userError?.message || 'No users found')
      return
    }

    testUserId = users.users[0].id
    logResult('Find test user', true, undefined, { userId: testUserId })

    // Step 2: Check existing OTPs
    console.log('\n--- Step 2: Check existing OTPs ---')
    const { data: existingOtps, error: checkError } = await adminClient
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', testPhone)
      .eq('user_id', testUserId)
      .eq('verified', false)

    if (checkError) {
      logResult('Check existing OTPs', false, checkError.message)
    } else {
      logResult('Check existing OTPs', true, undefined, {
        count: existingOtps?.length || 0,
        records: existingOtps
      })
    }

    // Step 3: Delete existing pending OTPs
    console.log('\n--- Step 3: Delete existing pending OTPs ---')
    const { error: deleteError } = await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
      .eq('user_id', testUserId)
      .eq('verified', false)

    if (deleteError) {
      logResult('Delete pending OTPs', false, deleteError.message)
    } else {
      logResult('Delete pending OTPs', true)
    }

    // Step 4: Create new OTP record
    console.log('\n--- Step 4: Create new OTP record ---')
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString()

    const { data: newOtp, error: insertError } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUserId,
        phone_number: testPhone,
        otp_code: testOTP,
        expires_at: expiresAt,
        attempts: 0,
        verified: false
      })
      .select()
      .single()

    if (insertError) {
      logResult('Create OTP record', false, insertError.message, insertError)
      console.error('Full insert error:', insertError)

      // Check constraint details
      if (insertError.code === '23505') {
        console.log('\n⚠️  UNIQUE CONSTRAINT VIOLATION DETECTED')
        console.log('Checking for conflicting records...')

        const { data: conflicts } = await adminClient
          .from('phone_verifications')
          .select('*')
          .eq('phone_number', testPhone)
          .eq('user_id', testUserId)

        console.log('Conflicting records:', conflicts)
      }

      return
    }

    otpRecordId = newOtp.id
    logResult('Create OTP record', true, undefined, { id: otpRecordId })

    // Step 5: Verify OTP record exists
    console.log('\n--- Step 5: Verify OTP record exists ---')
    const { data: verifyOtp, error: verifyError } = await adminClient
      .from('phone_verifications')
      .select('*')
      .eq('id', otpRecordId)
      .single()

    if (verifyError || !verifyOtp) {
      logResult('Verify OTP exists', false, verifyError?.message || 'Record not found')
    } else {
      logResult('Verify OTP exists', true, undefined, verifyOtp)
    }

    // Step 6: Simulate OTP verification
    console.log('\n--- Step 6: Simulate OTP verification ---')
    const { data: matchingOtp, error: matchError } = await adminClient
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', testPhone)
      .eq('otp_code', testOTP)
      .eq('verified', false)
      .eq('user_id', testUserId)
      .gte('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (matchError || !matchingOtp) {
      logResult('Find matching OTP', false, matchError?.message || 'No matching OTP found')
    } else {
      logResult('Find matching OTP', true, undefined, matchingOtp)

      // Step 7: Mark OTP as verified
      console.log('\n--- Step 7: Mark OTP as verified ---')
      const { error: updateError } = await adminClient
        .from('phone_verifications')
        .update({
          attempts: (matchingOtp.attempts || 0) + 1,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', matchingOtp.id)

      if (updateError) {
        logResult('Mark OTP as verified', false, updateError.message)
      } else {
        logResult('Mark OTP as verified', true)
      }
    }

    // Step 8: Check profile update capability
    console.log('\n--- Step 8: Check profile table structure ---')
    const { data: profileData, error: profileError } = await adminClient
      .from('profiles')
      .select('id, phone, temp_phone, temp_phone_otp_sent_at')
      .eq('id', testUserId)
      .single()

    if (profileError) {
      logResult('Check profile structure', false, profileError.message)
    } else {
      logResult('Check profile structure', true, undefined, profileData)
    }

    // Step 9: Simulate profile phone update
    console.log('\n--- Step 9: Simulate profile phone update ---')
    const { error: profileUpdateError } = await adminClient
      .from('profiles')
      .update({
        phone: testPhone,
        temp_phone: null,
        temp_phone_otp_sent_at: null
      })
      .eq('id', testUserId)

    if (profileUpdateError) {
      logResult('Update profile phone', false, profileUpdateError.message)
    } else {
      logResult('Update profile phone', true)
    }

    // Step 10: Check rate limiting
    console.log('\n--- Step 10: Test rate limiting ---')
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()
    const { data: recentOtps, error: rateLimitError } = await adminClient
      .from('phone_verifications')
      .select('id')
      .gte('created_at', oneHourAgo)
      .eq('phone_number', testPhone)
      .or(`user_id.eq.${testUserId},user_id.is.null`)

    if (rateLimitError) {
      logResult('Check rate limiting', false, rateLimitError.message)
    } else {
      const count = recentOtps?.length || 0
      const isBlocked = count >= 3
      logResult('Check rate limiting', true, undefined, {
        recentCount: count,
        limit: 3,
        blocked: isBlocked
      })
    }

    // Step 11: Check unique constraint
    console.log('\n--- Step 11: Test unique constraint ---')
    const { error: duplicateError } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUserId,
        phone_number: testPhone,
        otp_code: '999999',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        verified: false
      })

    if (duplicateError) {
      if (duplicateError.code === '23505') {
        logResult('Test unique constraint', true, 'Constraint working as expected (duplicate blocked)', duplicateError)
      } else {
        logResult('Test unique constraint', false, duplicateError.message)
      }
    } else {
      logResult('Test unique constraint', false, 'UNEXPECTED: Duplicate was allowed!')
    }

  } catch (error: any) {
    console.error('\n❌ UNCAUGHT ERROR:', error)
    logResult('Uncaught error', false, error.message, error)
  } finally {
    // Cleanup
    console.log('\n--- Cleanup ---')
    if (testUserId && testPhone) {
      const { error: cleanupError } = await adminClient
        .from('phone_verifications')
        .delete()
        .eq('phone_number', testPhone)
        .eq('user_id', testUserId)

      if (cleanupError) {
        console.error('Cleanup error:', cleanupError.message)
      } else {
        console.log('✓ Test records cleaned up')
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  console.log('TEST SUMMARY')
  console.log('='.repeat(60))

  const passed = results.filter(r => r.success).length
  const failed = results.filter(r => !r.success).length

  console.log(`Total Steps: ${results.length}`)
  console.log(`Passed: ${passed}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    console.log('\n❌ FAILED STEPS:')
    results.filter(r => !r.success).forEach(r => {
      console.log(`  - ${r.step}: ${r.error}`)
    })
  }

  console.log('\n' + '='.repeat(60))
}

// Run the test
testPhoneUpdateFlow()
  .then(() => {
    console.log('\n✓ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed with error:', error)
    process.exit(1)
  })
