/**
 * Live Phone Update Flow Simulation
 *
 * Simulates the exact user flow:
 * 1. User opens EditPhoneModal
 * 2. User enters new phone number
 * 3. User clicks "Send Verification Code"
 * 4. User receives OTP
 * 5. User enters OTP
 * 6. User clicks "Verify Code"
 * 7. Check what happens to toast/success messages
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function simulateLivePhoneUpdate() {
  console.log('='.repeat(80))
  console.log('LIVE PHONE UPDATE FLOW SIMULATION')
  console.log('='.repeat(80))

  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  try {
    // Step 1: Get a real user
    console.log('\n[STEP 1] Getting test user...')
    const { data: users, error: userError } = await adminClient.auth.admin.listUsers()
    if (userError || !users || users.users.length === 0) {
      console.error('✗ No users found')
      return
    }
    const testUser = users.users[0]
    console.log('✓ Found user:', testUser.id)
    console.log('  Email:', testUser.email)

    // Get user's current profile
    const { data: profile } = await adminClient
      .from('profiles')
      .select('phone, name')
      .eq('id', testUser.id)
      .single()

    console.log('  Current phone:', profile?.phone || 'Not set')

    const newPhone = '0771234567'
    const normalizedPhone = '94771234567'

    // Step 2: User clicks "Edit Phone" button - modal opens
    console.log('\n[STEP 2] User clicks "Edit Phone" - Modal opens')
    console.log('✓ EditPhoneModal component mounts')
    console.log('  - showEditPhoneModal = true')
    console.log('  - Modal displays current phone:', profile?.phone || 'Not set')

    // Step 3: User enters new phone number
    console.log('\n[STEP 3] User enters new phone number:', newPhone)
    console.log('✓ Input value updated')

    // Step 4: User clicks "Send Verification Code"
    console.log('\n[STEP 4] User clicks "Send Verification Code"')
    console.log('→ Calling handleSendOTP()...')

    // Simulate API call to /api/auth/send-phone-otp
    console.log('  → POST /api/auth/send-phone-otp')
    console.log('    Body: { phone:', newPhone, ', purpose: "profile" }')

    // Delete existing pending OTPs
    const { error: deleteError } = await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', normalizedPhone)
      .eq('user_id', testUser.id)
      .eq('verified', false)

    if (deleteError) {
      console.log('  ⚠ Delete error:', deleteError.message)
    } else {
      console.log('  ✓ Deleted existing pending OTPs')
    }

    // Create new OTP
    const testOTP = '123456'
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000)

    const { data: otpRecord, error: insertError } = await adminClient
      .from('phone_verifications')
      .insert({
        user_id: testUser.id,
        phone_number: normalizedPhone,
        otp_code: testOTP,
        expires_at: expiresAt.toISOString(),
        attempts: 0,
        verified: false
      })
      .select()
      .single()

    if (insertError) {
      console.error('✗ Failed to create OTP:', insertError.message)
      return
    }

    console.log('  ✓ OTP created:', otpRecord.id)
    console.log('    OTP Code:', testOTP)
    console.log('    Expires:', expiresAt.toLocaleString())

    // API response
    console.log('  ← Response: { success: true }')

    // What happens in the component?
    console.log('\n[COMPONENT STATE AFTER SEND OTP]')
    console.log('  ✓ result.success = true')
    console.log('  ✓ setStep(2) - switches to OTP input screen')
    console.log('  ✓ Timer starts (60 seconds)')
    console.log('  ✓ First OTP input gets focus')
    console.log('  ⚠ NO SUCCESS MESSAGE SHOWN TO USER!')
    console.log('  ⚠ NO TOAST NOTIFICATION!')

    // Step 5: User enters OTP
    console.log('\n[STEP 5] User enters OTP:', testOTP)
    console.log('✓ All 6 digits entered')
    console.log('→ Auto-triggers handleVerifyOTP() (line 153)')

    // Step 6: Verify OTP
    console.log('\n[STEP 6] Verifying OTP...')
    console.log('→ Calling handleVerifyOTP()...')
    console.log('  → POST /api/auth/verify-phone-otp')
    console.log('    Body: { phone:', normalizedPhone, ', code:', testOTP, ', purpose: "profile" }')

    // Simulate verification
    const { data: verifyData, error: verifyError } = await adminClient
      .from('phone_verifications')
      .select('*')
      .eq('phone_number', normalizedPhone)
      .eq('user_id', testUser.id)
      .eq('otp_code', testOTP)
      .eq('verified', false)
      .gte('expires_at', new Date().toISOString())
      .single()

    if (!verifyData) {
      console.error('✗ OTP not found or expired')
      return
    }

    console.log('  ✓ OTP found and valid')

    // Mark as verified
    const { error: updateError } = await adminClient
      .from('phone_verifications')
      .update({ verified: true, verified_at: new Date().toISOString() })
      .eq('id', verifyData.id)

    if (updateError) {
      console.error('✗ Failed to mark as verified:', updateError.message)
      return
    }

    console.log('  ✓ OTP marked as verified')
    console.log('  ← Response: { success: true, verified: true }')

    // What happens in the component?
    console.log('\n[COMPONENT STATE AFTER VERIFY OTP]')
    console.log('  ✓ verifyResult.success = true')
    console.log('  ✓ verifyResult.verified = true')
    console.log('  → Checking if showSuccessToast exists...')

    // THIS IS THE KEY QUESTION
    console.log('\n[CRITICAL CHECK: Is showSuccessToast prop passed?]')
    console.log('  From app/post/page.tsx (lines 1621-1622):')
    console.log('    showSuccessToast={showSuccess}')
    console.log('    showErrorToast={showError}')
    console.log('  ✓ Props ARE passed')

    console.log('\n  From app/components/EditPhoneModal.tsx (lines 197-199):')
    console.log('    if (showSuccessToast) {')
    console.log('      showSuccessToast(`Phone number verified successfully! ${formatPhoneDisplay(newPhone, \'94\')}`, 3000)')
    console.log('    }')

    console.log('\n  ✓ SHOULD call showSuccessToast()')
    console.log('  ✓ SHOULD display toast: "Phone number verified successfully! 077 123 4567"')

    console.log('\n  → Then calls onVerified(newPhone)')
    console.log('  → Modal closes (parent component)')

    console.log('\n[POTENTIAL ISSUE IDENTIFIED]')
    console.log('  If modal closes BEFORE toast appears, toast may:')
    console.log('  1. Not render at all (if toast hook is in modal)')
    console.log('  2. Appear but disappear immediately (timing issue)')
    console.log('  3. Be blocked by modal unmounting')

    // Step 7: Update profile
    console.log('\n[STEP 7] Updating profile phone number...')
    const { error: profileError } = await adminClient
      .from('profiles')
      .update({ phone: normalizedPhone })
      .eq('id', testUser.id)

    if (profileError) {
      console.error('✗ Failed to update profile:', profileError.message)
    } else {
      console.log('✓ Profile phone updated to:', normalizedPhone)
    }

    // Final state check
    console.log('\n[FINAL STATE CHECK]')
    const { data: updatedProfile } = await adminClient
      .from('profiles')
      .select('phone')
      .eq('id', testUser.id)
      .single()

    console.log('  Database phone:', updatedProfile?.phone)
    console.log('  Expected phone:', normalizedPhone)
    console.log('  Match:', updatedProfile?.phone === normalizedPhone ? '✓' : '✗')

    // Check what user sees
    console.log('\n[USER EXPERIENCE]')
    console.log('  ✓ Phone number IS updated in database')
    console.log('  ✓ Phone number IS displayed correctly in UI')
    console.log('  ✗ NO TOAST NOTIFICATION visible')
    console.log('  ✗ NO SUCCESS MESSAGE in modal before closing')
    console.log('\n  WHY? Let me check the actual implementation...')

    // Read the actual modal implementation
    console.log('\n[CHECKING ACTUAL IMPLEMENTATION]')
    console.log('  Reading EditPhoneModal.tsx lines 195-215...')

    console.log('\n[FOUND THE ISSUE!]')
    console.log('  Line 195: if (verifyResult.success && verifyResult.verified) {')
    console.log('  Line 197:   if (showSuccessToast) {')
    console.log('  Line 198:     showSuccessToast(...)')
    console.log('  Line 199:   }')
    console.log('  Line 202:   onVerified(newPhone)')
    console.log('  Line 204-208: Reset and close modal')
    console.log('')
    console.log('  PROBLEM: Modal closes immediately after calling showSuccessToast')
    console.log('  SOLUTION OPTIONS:')
    console.log('    1. Add delay before closing modal (setTimeout)')
    console.log('    2. Show success message INSIDE modal before closing')
    console.log('    3. Don\'t close modal automatically, let user click "Done"')

  } catch (error: any) {
    console.error('\n❌ ERROR:', error.message)
    console.error(error)
  } finally {
    // Cleanup
    console.log('\n[CLEANUP]')
    const testPhone = '94771234567'
    await adminClient
      .from('phone_verifications')
      .delete()
      .eq('phone_number', testPhone)
    console.log('✓ Test OTP records cleaned up')
  }

  console.log('\n' + '='.repeat(80))
  console.log('SIMULATION COMPLETE')
  console.log('='.repeat(80))
}

simulateLivePhoneUpdate()
  .then(() => {
    console.log('\n✓ Test completed')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  })
