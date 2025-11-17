# OTP System Refactoring - Phone Update Only

## Overview

The OTP (One-Time Password) system has been refactored from a dual-purpose system (authentication + phone updates) to a **dedicated phone update system only**.

**Date**: 2025-11-17

**Reason**: Custom JWT-based phone authentication using text.lk was unreliable due to Supabase's session management being tightly coupled to native auth providers. Phone authentication will be reimplemented using Supabase native providers.

---

## Changes Made

### 1. Phone Auth Disabled in UI

**File**: `lib/config/auth.config.ts`

```typescript
phone: {
  enabled: false, // DISABLED - Phone OTP only used for phone number updates, not authentication
}
```

**Impact**:
- "Continue with Phone" button no longer appears in AuthModal
- "Login with Phone" button hidden in StreamlinedSignup
- Phone auth completely removed from user-facing UI

### 2. Send OTP API Simplified

**File**: `app/api/auth/send-phone-otp/route.ts`

**Before**: 356 lines (supported register, login, phone_update flows)
**After**: 192 lines (supports ONLY phone_update flow)

**Removed**:
- Login flow (finding user by phone, no authentication)
- Registration flow (unauthenticated OTP sending)
- Service role client complexity for unauthenticated flows
- reCAPTCHA verification (not needed for authenticated users)
- Flow detection logic (isRegistration, rawFlow parameters)
- phoneLookup usage

**Kept**:
- Phone update flow for authenticated users
- text.lk SMS integration
- Rate limiting (3 OTPs per hour)
- OTP generation and database storage
- Phone number normalization

**New Requirements**:
- **Authentication required**: All requests must have valid Supabase session
- Only `phoneNumber` parameter accepted (flow parameter removed)
- Returns 401 Unauthorized if user not authenticated

### 3. Verify OTP API Simplified

**File**: `app/api/auth/verify-phone-otp/route.ts`

**Before**: 427 lines (supported register, login, phone_update flows)
**After**: 171 lines (supports ONLY phone_update flow)

**Removed**:
- Login flow (JWT generation, session creation)
- Registration flow (no user_id verification)
- JWT token generation (`generateSupabaseTokens`)
- Session creation (`setSession`)
- User lookup by phone (`findUserByPhone`)
- Flow detection logic (isRegistration, rawFlow, isPhoneUpdate)
- Multiple database client strategies (service role vs regular)

**Kept**:
- Phone verification with OTP code matching
- Attempt limiting (max 3 attempts)
- OTP expiry checking
- Database update (mark OTP as verified)

**New Requirements**:
- **Authentication required**: User must be logged in
- OTP record must have `user_id` matching authenticated user
- Returns simple success response (no JWT tokens, no session)

### 4. Deprecated Files

#### `lib/auth/jwt.ts` - JWT Generation (DEPRECATED)

**Status**: Marked as DEPRECATED/UNUSED
**Reason**: Custom JWTs cannot reliably create sessions in Supabase's auth.sessions table

```typescript
/**
 * JWT Token Generation - DEPRECATED / UNUSED
 *
 * This file was previously used to generate custom JWT tokens for phone-based authentication
 * using text.lk SMS provider. This approach has been deprecated because:
 *
 * 1. Custom JWTs cannot reliably create sessions in Supabase's auth.sessions table
 * 2. Supabase's session system is tightly coupled to native auth providers
 * 3. Phone OTP is now only used for phone number updates (not authentication)
 */
```

**What it did**:
- Generated Supabase-compatible JWT access and refresh tokens
- Signed tokens with `SUPABASE_JWT_SECRET`
- Created UUID session IDs
- Set proper expiry times (1 hour access, 7 days refresh)

**Why it failed**:
- `setSession()` expected tokens from Supabase Auth, not custom tokens
- Session ID not registered in `auth.sessions` table
- Resulted in "Session not found" errors

#### `lib/auth/phoneLookup.ts` - User Lookup (DEPRECATED)

**Status**: Marked as DEPRECATED/UNUSED
**Reason**: No longer needed without login flow

```typescript
/**
 * Phone Lookup Helper - DEPRECATED / UNUSED
 *
 * This file was previously used to lookup users by phone number during login flow.
 * It has been deprecated because:
 *
 * 1. Phone OTP is now only used for phone number updates (not authentication)
 * 2. Authentication flows have been disabled and will be reimplemented using Supabase native providers
 * 3. Login no longer requires phone-based user lookup
 */
```

**What it did**:
- Found users by phone number using admin client
- Normalized phone to canonical format (94XXXXXXXXX)
- Handled Supabase's phone storage format quirks

---

## Current OTP Workflow (Phone Update Only)

### 1. Send OTP

**Endpoint**: `POST /api/auth/send-phone-otp`

**Requirements**:
- User must be authenticated (valid Supabase session)
- Valid Sri Lankan phone number (0XXXXXXXXX format)

**Request**:
```json
{
  "phoneNumber": "0771234567"
}
```

**Process**:
1. Verify user is authenticated
2. Normalize phone number (0771234567 → 94771234567)
3. Validate phone format (Sri Lankan only)
4. Check rate limiting (max 3 OTPs per hour)
5. Generate 6-digit OTP
6. Store in `phone_verifications` table with user_id
7. Send SMS via text.lk
8. Update profile with `temp_phone` and `temp_phone_otp_sent_at`

**Response**:
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600
}
```

### 2. Verify OTP

**Endpoint**: `POST /api/auth/verify-phone-otp`

**Requirements**:
- User must be authenticated
- Valid OTP code (6 digits)
- OTP must be for authenticated user

**Request**:
```json
{
  "phoneNumber": "0771234567",
  "otpCode": "123456"
}
```

**Process**:
1. Verify user is authenticated
2. Normalize phone number
3. Find matching OTP record in database:
   - Matching phone number
   - Matching OTP code
   - Not yet verified
   - Belongs to authenticated user
   - Not expired
4. Check attempt limit (max 3 attempts)
5. Mark OTP as verified
6. Return success

**Response**:
```json
{
  "success": true,
  "userId": "user-uuid",
  "message": "Phone number verified successfully",
  "verified": true
}
```

**Important**: Does NOT create session, does NOT return JWT tokens

### 3. Client-Side Phone Update Flow

After OTP verification, the client must:
1. Update the user's phone in `profiles` table
2. Update phone in `listings` or `wanted_requests` if applicable
3. Clear `temp_phone` and `temp_phone_otp_sent_at`

---

## Usage Locations

### ✅ Supported Flows (Still Working)

1. **Profile Phone Update** (`/profile/account`)
   - User updates phone number in profile settings
   - Sends OTP → Verifies OTP → Updates profile

2. **Listing Phone Update** (`/post` or editing listing)
   - User updates phone number on a listing
   - Sends OTP → Verifies OTP → Updates listing

3. **Wanted Request Phone Update** (`/wanted/post`)
   - User updates phone number on wanted post
   - Sends OTP → Verifies OTP → Updates wanted request

### ❌ Disabled Flows (No Longer Supported)

1. **Phone Registration** - DISABLED
   - Previously: New users could register with phone + OTP
   - Now: Registration only via email or Google OAuth

2. **Phone Login** - DISABLED
   - Previously: Existing users could login with phone + OTP
   - Now: Login only via email or Google OAuth

---

## Environment Variables

### Still Required

- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY` - For bypassing RLS on phone_verifications table
- `TWILIO_ACCOUNT_SID` - text.lk service account
- `TWILIO_AUTH_TOKEN` - text.lk auth token
- `TWILIO_PHONE_NUMBER` - text.lk sender number

### No Longer Used (Can Be Removed)

- ~~`SUPABASE_JWT_SECRET`~~ - Was used for custom JWT signing (no longer needed)

---

## Database Schema

### `phone_verifications` Table

**Columns**:
- `id` - UUID primary key
- `user_id` - UUID (now REQUIRED, must match authenticated user)
- `phone_number` - String (normalized format: 94XXXXXXXXX)
- `otp_code` - String (6 digits)
- `verified` - Boolean (default false)
- `verified_at` - Timestamp (when OTP was verified)
- `attempts` - Integer (max 3)
- `expires_at` - Timestamp (10 minutes from creation)
- `created_at` - Timestamp
- `updated_at` - Timestamp

**Key Changes**:
- `user_id` is now ALWAYS set (never null)
- Only records with matching `user_id` are verified
- No more null `user_id` for registration flows

---

## Testing Checklist

### Manual Testing

- [ ] **Profile Phone Update**
  1. Login as existing user
  2. Go to `/profile/account`
  3. Edit phone number
  4. Request OTP
  5. Verify OTP received via SMS
  6. Enter OTP code
  7. Confirm phone updated in profile

- [ ] **Listing Phone Update**
  1. Login as existing user
  2. Edit an existing listing
  3. Change phone number
  4. Request OTP
  5. Verify OTP received
  6. Enter OTP code
  7. Confirm listing phone updated

- [ ] **Wanted Request Phone Update**
  1. Login as existing user
  2. Edit existing wanted request
  3. Change phone number
  4. Request OTP
  5. Verify OTP received
  6. Enter OTP code
  7. Confirm wanted request phone updated

### Negative Testing

- [ ] **Unauthenticated Request**
  - Send OTP without being logged in
  - Expected: 401 Unauthorized error

- [ ] **Wrong User OTP**
  - User A requests OTP
  - User B tries to verify with User A's OTP
  - Expected: "Invalid or expired verification code"

- [ ] **Rate Limiting**
  - Send 4 OTP requests within 1 hour
  - Expected: 4th request returns 429 error

- [ ] **Attempt Limiting**
  - Enter wrong OTP 3 times
  - Expected: 4th attempt returns "Too many attempts" error

---

## Migration Path

### For Future Phone Authentication

When reimplementing phone authentication using Supabase native providers:

1. **Option 1: Supabase Native SMS (Twilio/MessageBird)**
   - Switch from text.lk to Twilio/MessageBird
   - Use Supabase's built-in `signInWithOtp({ phone })`
   - Sessions automatically managed by Supabase
   - Reliable, but costs money

2. **Option 2: Third-Party Auth Integration**
   - Configure text.lk as Third-Party Auth provider
   - Implement OAuth/OIDC flow
   - Complex, may not be feasible for SMS OTP

3. **Option 3: Hybrid Approach**
   - Use email/Google for initial authentication
   - Use phone OTP only for phone verification
   - Link verified phone to account metadata
   - Current approach, already working

---

## Files Modified

### API Routes
- ✅ `app/api/auth/send-phone-otp/route.ts` - Simplified to phone update only
- ✅ `app/api/auth/verify-phone-otp/route.ts` - Simplified to phone update only

### Configuration
- ✅ `lib/config/auth.config.ts` - Disabled phone auth in UI

### Deprecated Files (Marked Unused)
- ⚠️ `lib/auth/jwt.ts` - Custom JWT generation (no longer used)
- ⚠️ `lib/auth/phoneLookup.ts` - User lookup by phone (no longer used)

### Unchanged Files (Still Active)
- ✅ `lib/utils/phoneFormatter.ts` - Phone normalization utilities
- ✅ `lib/services/textlkService.ts` - text.lk SMS integration
- ✅ `app/components/PhoneVerificationModal.tsx` - Phone update UI
- ✅ `app/components/EditPhoneModal.tsx` - Phone edit UI
- ✅ `lib/hooks/usePhoneVerification.ts` - Phone verification hook

### No Longer Used (Can Be Deleted Later)
- `app/components/auth/PhoneAuthForm.tsx` - Phone login/register UI
- `app/components/auth/PhoneNumberInput.tsx` - Phone input for auth
- `app/components/auth/OTPInput.tsx` - OTP input for auth
- `scripts/test-otp-flows.ts` - Testing script for auth flows
- `scripts/normalize-auth-phone-numbers.ts` - Migration script
- `scripts/debug-supabase-phone.ts` - Debug script

---

## Known Limitations

1. **Phone Authentication Disabled**
   - Users cannot register or login with phone number
   - Only email and Google OAuth available for auth

2. **SMS Provider Locked**
   - Still using text.lk for SMS (Sri Lankan only)
   - No international phone support

3. **Authenticated Users Only**
   - Phone verification only works for logged-in users
   - Cannot verify phone during registration

---

## Rollback Plan

If phone updates break, revert these files:
1. `app/api/auth/send-phone-otp/route.ts`
2. `app/api/auth/verify-phone-otp/route.ts`
3. `lib/config/auth.config.ts` (set `phone.enabled = true`)

Revert to git commit before this refactoring.

---

## Success Criteria

- ✅ Build completes without errors
- ✅ Phone auth buttons hidden in UI
- ✅ Phone update flow still works on `/profile`, `/post`, `/wanted/post`
- ✅ Unauthenticated OTP requests return 401
- ✅ JWT generation marked as deprecated
- ✅ phoneLookup marked as deprecated
- ⏳ Manual testing confirms phone updates work
- ⏳ No regressions in existing phone update flows

---

## Conclusion

The OTP system has been successfully simplified from a 750+ line dual-purpose system to a focused 360-line phone update system. Custom JWT authentication has been deprecated in favor of a future Supabase native implementation.

Phone verification remains reliable for authenticated users updating their phone numbers across profiles, listings, and wanted posts.

---

## Reference Files for Future Implementation

For implementing phone authentication using Supabase native providers (Twilio/MessageBird), see:

**[REFERENCE_FILES_FOR_TWILIO_AUTH.md](./REFERENCE_FILES_FOR_TWILIO_AUTH.md)**

This document contains:
- Complete UI components (PhoneAuthForm, PhoneNumberInput, OTPInput)
- Migration guide from text.lk to Twilio/Supabase
- Code comparison (before/after)
- Cost analysis
- Integration patterns

The deprecated auth components (`PhoneAuthForm.tsx`, `PhoneNumberInput.tsx`, `OTPInput.tsx`) are preserved in the codebase and can be reused when switching to Supabase native phone authentication.
