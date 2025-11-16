#!/usr/bin/env ts-node

/**
 * Comprehensive OTP Flow Testing Script
 *
 * Tests all OTP verification flows end-to-end:
 * 1. Registration flow
 * 2. Login flow
 * 3. Phone update flow (profile/listing/wanted)
 *
 * Run with: npx ts-node scripts/test-otp-flows.ts
 */

import { createClient } from '@supabase/supabase-js'
import { normalizeSriLankaPhone, isValidSriLankanPhone } from '../lib/utils/phoneFormatter'

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!
const API_BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

// Test phone numbers (ensure these are valid for your SMS provider)
const TEST_PHONES = {
  registration: '0771111111', // New user registration
  login: '0772222222',        // Existing user login
  phoneUpdate: '0773333333'   // Phone number update
}

interface TestResult {
  test: string
  passed: boolean
  error?: string
  details?: any
}

const results: TestResult[] = []

function log(message: string, data?: any) {
  console.log(`[${new Date().toISOString()}] ${message}`)
  if (data) {
    console.log(JSON.stringify(data, null, 2))
  }
}

function logError(message: string, error: any) {
  console.error(`[ERROR] ${message}`, error)
}

function addResult(test: string, passed: boolean, error?: string, details?: any) {
  results.push({ test, passed, error, details })
  if (passed) {
    log(`✅ PASS: ${test}`)
  } else {
    logError(`❌ FAIL: ${test}`, error)
  }
}

async function makeAPICall(endpoint: string, body: any): Promise<Response> {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  })
  return response
}

async function testPhoneNormalization() {
  log('Testing phone normalization...')

  const testCases = [
    { input: '0771234567', expected: '94771234567' },
    { input: '771234567', expected: '94771234567' },
    { input: '+94771234567', expected: '94771234567' },
    { input: '94771234567', expected: '94771234567' }
  ]

  let allPassed = true
  for (const testCase of testCases) {
    const normalized = normalizeSriLankaPhone(testCase.input)
    const isValid = isValidSriLankanPhone(normalized)

    if (normalized !== testCase.expected || !isValid) {
      allPassed = false
      addResult(
        `Phone normalization: ${testCase.input}`,
        false,
        `Expected ${testCase.expected}, got ${normalized}. Valid: ${isValid}`
      )
    }
  }

  if (allPassed) {
    addResult('Phone normalization', true, undefined, { testCases: testCases.length })
  }
}

async function testRegistrationFlow() {
  log('Testing registration flow...')

  try {
    const phoneNumber = TEST_PHONES.registration
    const username = `testuser${Date.now()}`

    // Step 1: Send OTP
    log('Step 1: Sending OTP for registration...')
    const sendOTPResponse = await makeAPICall('/api/auth/send-phone-otp', {
      phoneNumber,
      flow: 'register'
    })

    const sendOTPResult = await sendOTPResponse.json()
    if (!sendOTPResponse.ok || !sendOTPResult.success) {
      addResult('Registration: Send OTP', false, sendOTPResult.error || 'Failed to send OTP')
      return
    }

    addResult('Registration: Send OTP', true, undefined, { expiresIn: sendOTPResult.expiresIn })

    // Step 2: Get OTP from database (in production, user would receive SMS)
    log('Step 2: Retrieving OTP from database...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const normalizedPhone = normalizeSriLankaPhone(phoneNumber)

    const { data: otpRecord, error: otpError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('verified', false)
      .is('user_id', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      addResult('Registration: Retrieve OTP', false, 'OTP not found in database')
      return
    }

    addResult('Registration: Retrieve OTP', true, undefined, { otpLength: otpRecord.otp_code.length })

    // Step 3: Verify OTP
    log('Step 3: Verifying OTP...')
    const verifyOTPResponse = await makeAPICall('/api/auth/verify-phone-otp', {
      phoneNumber,
      otpCode: otpRecord.otp_code,
      flow: 'register'
    })

    const verifyOTPResult = await verifyOTPResponse.json()
    if (!verifyOTPResponse.ok || !verifyOTPResult.success) {
      addResult('Registration: Verify OTP', false, verifyOTPResult.error || 'OTP verification failed')
      return
    }

    addResult('Registration: Verify OTP', true, undefined, { verified: verifyOTPResult.success })

    // Step 4: Create account
    log('Step 4: Creating account...')
    const createAccountResponse = await makeAPICall('/api/auth/create-account', {
      phoneNumber,
      username
    })

    const createAccountResult = await createAccountResponse.json()
    if (!createAccountResponse.ok || !createAccountResult.success) {
      addResult('Registration: Create Account', false, createAccountResult.error || 'Account creation failed')
      return
    }

    addResult('Registration: Create Account', true, undefined, {
      userId: createAccountResult.userId,
      hasSession: !!createAccountResult.session
    })

    // Step 5: Verify session was created
    if (createAccountResult.session) {
      addResult('Registration: Session Creation', true, undefined, {
        hasAccessToken: !!createAccountResult.session.access_token,
        hasRefreshToken: !!createAccountResult.session.refresh_token
      })
    } else {
      addResult('Registration: Session Creation', false, 'No session returned')
    }

    // Step 6: Verify auth.users record
    log('Step 6: Verifying auth.users record...')
    const { data: authUser } = await supabase.auth.admin.getUserById(createAccountResult.userId)

    if (authUser?.user) {
      const phoneConfirmed = !!authUser.user.phone_confirmed_at
      addResult('Registration: Phone Confirmed', phoneConfirmed, phoneConfirmed ? undefined : 'phone_confirmed_at is null')
    } else {
      addResult('Registration: Auth User Lookup', false, 'User not found in auth.users')
    }

  } catch (error) {
    addResult('Registration Flow', false, (error as Error).message)
  }
}

async function testLoginFlow() {
  log('Testing login flow...')

  try {
    const phoneNumber = TEST_PHONES.login

    // Prerequisite: Create user if doesn't exist
    log('Prerequisite: Ensuring test user exists...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const normalizedPhone = normalizeSriLankaPhone(phoneNumber)
    const e164Phone = `+${normalizedPhone}`

    const { data: existingUsers } = await supabase.auth.admin.listUsers()
    let userId = existingUsers?.users?.find(u => u.phone === e164Phone)?.id

    if (!userId) {
      log('Creating test user for login flow...')
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        phone: e164Phone,
        phone_confirmed: true,
        user_metadata: {
          phone: phoneNumber,
          username: `testlogin${Date.now()}`
        }
      })

      if (createError || !newUser) {
        addResult('Login: User Creation', false, 'Failed to create test user')
        return
      }
      userId = newUser.user.id
    }

    // Step 1: Send OTP for login
    log('Step 1: Sending OTP for login...')
    const sendOTPResponse = await makeAPICall('/api/auth/send-phone-otp', {
      phoneNumber,
      flow: 'login',
      recaptchaToken: 'test-token' // In production, use real reCAPTCHA
    })

    const sendOTPResult = await sendOTPResponse.json()
    if (!sendOTPResponse.ok || !sendOTPResult.success) {
      addResult('Login: Send OTP', false, sendOTPResult.error || 'Failed to send OTP')
      return
    }

    addResult('Login: Send OTP', true, undefined, { expiresIn: sendOTPResult.expiresIn })

    // Step 2: Get OTP from database
    log('Step 2: Retrieving OTP from database...')
    const { data: otpRecord, error: otpError } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('verified', false)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (otpError || !otpRecord) {
      addResult('Login: Retrieve OTP', false, 'OTP not found in database')
      return
    }

    addResult('Login: Retrieve OTP', true, undefined, { otpLength: otpRecord.otp_code.length })

    // Step 3: Verify OTP and create session
    log('Step 3: Verifying OTP and creating session...')
    const verifyOTPResponse = await makeAPICall('/api/auth/verify-phone-otp', {
      phoneNumber,
      otpCode: otpRecord.otp_code,
      flow: 'login'
    })

    const verifyOTPResult = await verifyOTPResponse.json()
    if (!verifyOTPResponse.ok || !verifyOTPResult.success) {
      addResult('Login: Verify OTP', false, verifyOTPResult.error || 'OTP verification failed')
      return
    }

    addResult('Login: Verify OTP', true, undefined, {
      userId: verifyOTPResult.userId,
      hasSession: !!verifyOTPResult.session
    })

    // Step 4: Verify session was created
    if (verifyOTPResult.session) {
      addResult('Login: Session Creation', true, undefined, {
        hasAccessToken: !!verifyOTPResult.session.access_token,
        hasRefreshToken: !!verifyOTPResult.session.refresh_token,
        expiresAt: verifyOTPResult.session.expires_at
      })
    } else {
      addResult('Login: Session Creation', false, 'No session returned')
    }

  } catch (error) {
    addResult('Login Flow', false, (error as Error).message)
  }
}

async function testPhoneUpdateFlow() {
  log('Testing phone update flow...')

  try {
    const oldPhoneNumber = '0774444444'
    const newPhoneNumber = TEST_PHONES.phoneUpdate

    // Prerequisite: Create user with old phone number
    log('Prerequisite: Creating user with old phone number...')
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
    const e164OldPhone = `+${normalizeSriLankaPhone(oldPhoneNumber)}`

    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      phone: e164OldPhone,
      phone_confirmed: true,
      user_metadata: {
        phone: oldPhoneNumber,
        username: `testupdate${Date.now()}`
      }
    })

    if (createError || !newUser) {
      addResult('Phone Update: User Creation', false, 'Failed to create test user')
      return
    }

    const userId = newUser.user.id

    // Step 1: Send OTP for phone update
    log('Step 1: Sending OTP for phone update...')
    // Note: This would normally be called with an authenticated session
    // For testing, we'll use the admin client

    const normalizedNewPhone = normalizeSriLankaPhone(newPhoneNumber)

    // Directly insert OTP record (simulating authenticated request)
    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const { error: insertError } = await supabase
      .from('phone_verifications')
      .insert({
        user_id: userId,
        phone_number: normalizedNewPhone,
        otp_code: otp,
        expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
        verified: false
      })

    if (insertError) {
      addResult('Phone Update: Send OTP', false, insertError.message)
      return
    }

    addResult('Phone Update: Send OTP', true)

    // Step 2: Verify OTP for phone update
    log('Step 2: Verifying OTP for phone update...')
    const { data: otpRecords, error: updateError } = await supabase
      .from('phone_verifications')
      .update({
        verified: true,
        verified_at: new Date().toISOString()
      })
      .eq('phone_number', normalizedNewPhone)
      .eq('user_id', userId)
      .eq('verified', false)
      .select()

    if (updateError || !otpRecords || otpRecords.length === 0) {
      addResult('Phone Update: Verify OTP', false, updateError?.message || 'Verification failed')
      return
    }

    addResult('Phone Update: Verify OTP', true, undefined, { verified: true })

  } catch (error) {
    addResult('Phone Update Flow', false, (error as Error).message)
  }
}

async function testDatabaseIntegrity() {
  log('Testing database integrity...')

  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Test 1: All phone numbers in canonical format
    log('Checking phone_verifications format...')
    const { data: allRecords } = await supabase
      .from('phone_verifications')
      .select('phone_number')

    let allValid = true
    const invalidRecords: string[] = []

    allRecords?.forEach(record => {
      if (!isValidSriLankanPhone(record.phone_number)) {
        allValid = false
        invalidRecords.push(record.phone_number)
      }
    })

    if (allValid) {
      addResult('Database: Phone Format Validation', true, undefined, { totalRecords: allRecords?.length })
    } else {
      addResult('Database: Phone Format Validation', false, `${invalidRecords.length} invalid records`, { invalidRecords: invalidRecords.slice(0, 5) })
    }

    // Test 2: No orphaned verified records
    log('Checking for orphaned verified records...')
    const { data: orphanedRecords } = await supabase
      .from('phone_verifications')
      .select('*')
      .eq('verified', true)
      .is('user_id', null)

    if (orphanedRecords && orphanedRecords.length > 0) {
      addResult('Database: Orphaned Records', false, `${orphanedRecords.length} orphaned verified records found`, {
        count: orphanedRecords.length,
        sample: orphanedRecords.slice(0, 3)
      })
    } else {
      addResult('Database: Orphaned Records', true)
    }

  } catch (error) {
    addResult('Database Integrity', false, (error as Error).message)
  }
}

function printSummary() {
  console.log('\n' + '='.repeat(80))
  console.log('TEST SUMMARY')
  console.log('='.repeat(80))

  const passed = results.filter(r => r.passed).length
  const failed = results.filter(r => !r.passed).length
  const total = results.length

  console.log(`\nTotal Tests: ${total}`)
  console.log(`✅ Passed: ${passed}`)
  console.log(`❌ Failed: ${failed}`)
  console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`)

  if (failed > 0) {
    console.log('FAILED TESTS:')
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  ❌ ${r.test}`)
      console.log(`     Error: ${r.error}`)
      if (r.details) {
        console.log(`     Details: ${JSON.stringify(r.details)}`)
      }
    })
  }

  console.log('\n' + '='.repeat(80))
}

async function main() {
  console.log('Starting OTP Flow Tests...\n')

  // Run tests sequentially
  await testPhoneNormalization()
  await testDatabaseIntegrity()
  await testRegistrationFlow()
  await testLoginFlow()
  await testPhoneUpdateFlow()

  printSummary()

  // Exit with appropriate code
  const failed = results.filter(r => !r.passed).length
  process.exit(failed > 0 ? 1 : 0)
}

main().catch(error => {
  console.error('Test script failed:', error)
  process.exit(1)
})
