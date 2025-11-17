/**
 * Test Duplicate OTP Scenario
 *
 * Simulates the exact error scenario:
 * 1. User requests OTP (creates pending record)
 * 2. User requests OTP again WITHOUT verifying (should replace, not duplicate)
 *
 * This tests if the deletion logic in send-phone-otp works correctly.
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testDuplicateOTPScenario() {
  console.log('='.repeat(60))
  console.log('DUPLICATE OTP SCENARIO TEST')
  console.log('='.repeat(60))

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  const testPhone = '94777777777'
  let testUserId: string

  try {
    // Get a real user first
    console.log('\n--- Getting test user ---')
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers()
    if (userError || !users || users.users.length === 0) {
      console.error('✗ No users found')
      return
    }
    testUserId = users.users[0].id
    console.log('✓ Using user:', testUserId)

    // Cleanup first
    console.log('\n--- Initial Cleanup ---')
    await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
    console.log('✓ Cleaned up existing records')

    // Scenario 1: Create first pending OTP
    console.log('\n--- Scenario 1: User requests first OTP ---')
    const { data: otp1, error: error1 } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUserId,
        phone_number: testPhone,
        otp_code: '111111',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        verified: false
      })
      .select()
      .single()

    if (error1) {
      console.error('✗ Failed to create first OTP:', error1.message)
      return
    }
    console.log('✓ First OTP created:', otp1.id)

    // Scenario 2: User requests OTP again WITHOUT deleting the first one
    console.log('\n--- Scenario 2: User requests second OTP (no deletion) ---')
    const { data: otp2, error: error2 } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUserId,
        phone_number: testPhone,
        otp_code: '222222',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        verified: false
      })
      .select()
      .single()

    if (error2) {
      if (error2.code === '23505') {
        console.log('✓ EXPECTED: Duplicate constraint violation')
        console.log('  Error:', error2.message)
        console.log('  Code:', error2.code)
        console.log('  Details:', error2.details)
      } else {
        console.error('✗ Unexpected error:', error2.message)
      }
    } else {
      console.error('✗ UNEXPECTED: Duplicate was allowed!')
      console.log('  Second OTP created:', otp2.id)
    }

    // Scenario 3: Delete first pending OTP, then create second
    console.log('\n--- Scenario 3: Delete pending OTP, then create new one ---')
    const { error: deleteError } = await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
      .eq('user_id', testUserId)
      .eq('verified', false)

    if (deleteError) {
      console.error('✗ Failed to delete:', deleteError.message)
      return
    }
    console.log('✓ Deleted pending OTP')

    const { data: otp3, error: error3 } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUserId,
        phone_number: testPhone,
        otp_code: '333333',
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        attempts: 0,
        verified: false
      })
      .select()
      .single()

    if (error3) {
      console.error('✗ Failed to create new OTP:', error3.message)
      if (error3.code === '23505') {
        console.log('\n⚠️  DELETION DID NOT WORK!')
        console.log('Checking for remaining records...')

        const { data: remaining } = await adminClient
          .from('phone_verifications')
          .select('*')
          .eq('phone_number', testPhone)
          .eq('user_id', testUserId)

        console.log('Remaining records:', remaining)
      }
    } else {
      console.log('✓ New OTP created successfully:', otp3.id)
    }

    // Scenario 4: Simulate RLS blocking deletion
    console.log('\n--- Scenario 4: Simulate RLS blocking deletion ---')
    const regularClient = createClient(SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })

    const { error: rlsDeleteError } = await regularClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
      .eq('user_id', testUserId)

    if (rlsDeleteError) {
      console.log('✓ EXPECTED: Regular client cannot delete (RLS blocking)')
      console.log('  Error:', rlsDeleteError.message)
    } else {
      console.log('⚠️  Regular client CAN delete (RLS not blocking)')
    }

  } catch (error: any) {
    console.error('\n❌ UNCAUGHT ERROR:', error.message)
  } finally {
    // Cleanup
    console.log('\n--- Final Cleanup ---')
    await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
    console.log('✓ Test records cleaned up')
  }

  console.log('\n' + '='.repeat(60))
}

testDuplicateOTPScenario()
  .then(() => {
    console.log('✓ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Test failed:', error)
    process.exit(1)
  })
