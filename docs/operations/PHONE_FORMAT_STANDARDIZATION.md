# Phone Number Format Standardization

**Status**: ✅ Implemented
**Date**: 2025-11-16

## Overview

All phone number handling has been standardized to use a single, consistent format across the application. No legacy formats are supported.

## Format Standards

### Internal Storage (phone_verifications table)
- **Format**: Canonical format without leading `+`
- **Pattern**: `94XXXXXXXXX` (11 digits)
- **Example**: `94783607777`
- **Validation**: `/^94[0-9]{9}$/`

### Auth System (auth.users table)
- **Format**: E.164 international format
- **Pattern**: `+94XXXXXXXXX`
- **Example**: `+94783607777`
- **Required by**: Supabase Auth

### Display Format (UI)
- **Format**: Local format with parentheses
- **Pattern**: `(0XX) XXX-XXXX`
- **Example**: `(078) 360-7777`
- **Function**: `formatPhoneDisplay()`

## Phone Normalization Functions

### Core Functions (`lib/utils/phoneFormatter.ts`)

```typescript
// Normalize any Sri Lankan phone input to canonical format
normalizeSriLankaPhone(input: string): string
// Returns: "94XXXXXXXXX" or "" if invalid

// Validate canonical format
isValidSriLankanPhone(normalizedPhone: string): boolean
// Returns: true if matches /^94[0-9]{9}$/

// Convert canonical to E.164
toE.164(normalizedPhone: string): string
// Returns: "+94XXXXXXXXX"

// Format for display
formatPhoneDisplay(phone: string, countryCode?: string): string
// Returns: "(0XX) XXX-XXXX"
```

### Accepted Input Formats

All of these normalize to `94783607777`:

```typescript
normalizeSriLankaPhone("0783607777")    // → "94783607777"
normalizeSriLankaPhone("783607777")     // → "94783607777"
normalizeSriLankaPhone("+94783607777")  // → "94783607777"
normalizeSriLankaPhone("94783607777")   // → "94783607777"
```

## Database Schema

### phone_verifications Table

```sql
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  phone_number TEXT NOT NULL,  -- Canonical: 94XXXXXXXXX
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  verified_at TIMESTAMPTZ,

  -- Format validation
  CONSTRAINT valid_phone_format CHECK (phone_number ~ '^94[0-9]{9}$')
);

-- Partial unique index (prevents duplicate unverified records)
CREATE UNIQUE INDEX idx_phone_verifications_unique_unverified
ON phone_verifications (phone_number, user_id)
WHERE verified = false;
```

### auth.users Table

- **phone**: E.164 format (`+94XXXXXXXXX`)
- **phone_confirmed_at**: Timestamp when phone was verified
- Managed by Supabase Auth (cannot modify schema)

## OTP Flow Architecture

### Registration Flow

1. **Send OTP** (`/api/auth/send-phone-otp`)
   - Input: Any format (0771234567, 771234567, +94771234567)
   - Normalizes to canonical: `94771234567`
   - Validates format
   - Deletes old OTP records
   - Inserts new OTP with canonical format
   - Sends SMS

2. **Verify OTP** (`/api/auth/verify-phone-otp`)
   - Input: Phone (any format) + OTP code
   - Normalizes phone
   - Finds matching OTP in canonical format
   - Marks as verified
   - Returns success (no session yet)

3. **Create Account** (`/api/auth/create-account`)
   - Input: Phone (any format) + username
   - Normalizes to canonical: `94771234567`
   - Converts to E.164: `+94771234567`
   - Creates auth.users with E.164 phone
   - Creates session
   - Links OTP record to user_id

### Login Flow

1. **Send OTP** (`/api/auth/send-phone-otp`)
   - Finds user by phone (E.164 lookup)
   - Inserts OTP with user_id + canonical phone
   - Sends SMS

2. **Verify OTP** (`/api/auth/verify-phone-otp`)
   - Finds user by phone (E.164 lookup)
   - Verifies OTP code
   - Generates access token (Admin API)
   - Returns session

### Phone Update Flow

1. **Send OTP** (`/api/auth/send-phone-otp`)
   - Authenticated request
   - New phone number (any format)
   - Normalizes and validates
   - Inserts OTP with user_id
   - Sends SMS

2. **Verify OTP** (`/api/auth/verify-phone-otp`)
   - Verifies OTP code
   - Updates auth.users phone to E.164
   - Returns success

## API Endpoints

### POST /api/auth/send-phone-otp

```typescript
Request:
{
  phoneNumber: string,  // Any format
  flow: 'register' | 'login' | 'phone_update',
  recaptchaToken?: string  // Required for login
}

Response:
{
  success: boolean,
  expiresIn: number,  // 600 (10 minutes)
  error?: string
}
```

### POST /api/auth/verify-phone-otp

```typescript
Request:
{
  phoneNumber: string,  // Any format
  otpCode: string,      // 6 digits
  flow: 'register' | 'login' | 'phone_update'
}

Response (Login):
{
  success: boolean,
  userId: string,
  session: {
    access_token: string,
    refresh_token: string,
    expires_at: number
  },
  error?: string
}

Response (Register):
{
  success: boolean,
  error?: string
}
```

### POST /api/auth/create-account

```typescript
Request:
{
  phoneNumber: string,  // Any format
  username: string
}

Response:
{
  success: boolean,
  userId: string,
  session: Session,
  message: string,
  error?: string
}
```

## Client-Side Functions

### lib/auth.ts

```typescript
// Send OTP using custom API
sendPhoneOTP(phone: string, flow: 'register' | 'login'): Promise<Result>

// Verify OTP using custom API
verifyOTP(phone: string, token: string, name?: string): Promise<Result>
```

### lib/hooks/usePhoneVerification.ts

```typescript
// For authenticated phone updates
const { sendOTP, verifyOTP, isSending, isVerifying, error } = usePhoneVerification({
  purpose: 'profile' | 'listing' | 'wanted'
})
```

### lib/auth/phoneLookup.ts

```typescript
// Find user by phone number (server-side only)
findUserByPhone(adminClient, phoneNumber): Promise<UserLookupResult>
// Converts to E.164 and searches auth.users
```

## Migration History

### Phase 1: Database Schema (2025-11-16)

- ✅ `fix_phone_verifications_unique_constraint.sql` - Partial unique index
- ✅ `add_phone_format_validation.sql` - CHECK constraint for canonical format
- ✅ `normalize_phone_data_cleanup_v2.sql` - Normalized all existing data
- ✅ `add_otp_cleanup_and_monitoring.sql` - Cleanup functions

### Phase 2: Auth Users Normalization (2025-11-16)

- ✅ `scripts/normalize-auth-phone-numbers.ts` - Updated auth.users to E.164
- Result: 1 user updated from `94783607777` to `+94783607777`

### Phase 3: Code Standardization (2025-11-16)

- ✅ Replaced `lib/auth.ts` functions to use custom OTP API
- ✅ Removed dual-format support from `lib/auth/phoneLookup.ts`
- ✅ All API endpoints use canonical format internally
- ✅ All auth operations use E.164 for auth.users

## Testing

### Test Script

```bash
npx tsx scripts/test-otp-flows.ts
```

Tests:
- ✅ Phone normalization
- ✅ Registration flow
- ✅ Login flow
- ✅ Phone update flow
- ✅ Database integrity

### Manual Testing Checklist

- [ ] Register new account with phone
- [ ] Login with phone OTP
- [ ] Update phone number on profile
- [ ] Update phone number on listing
- [ ] Update phone number on wanted request
- [ ] Verify all phones stored in E.164 in auth.users
- [ ] Verify all phones stored in canonical in phone_verifications
- [ ] Check cleanup cron is working (daily 2 AM UTC)

## Monitoring

### OTP Statistics

```sql
SELECT * FROM get_otp_stats();
```

Returns:
- `total_records`: Total OTP records
- `verified_records`: Successfully verified
- `unverified_records`: Pending
- `expired_records`: Unverified past expiry
- `orphaned_records`: Verified without user_id
- `records_last_24h`: Recent activity
- `avg_verification_time_seconds`: User speed

### Cleanup Monitoring

- **Cron**: Daily at 2 AM UTC (`/api/cron/cleanup-otp`)
- **Logs**: Sentry + Vercel Functions
- **Alerts**: Orphaned records > 10, Invalid formats > 0

### Security Advisors

```typescript
// Check for missing RLS policies
await mcp__supabase__get_advisors({
  project_id: 'your-project-id',
  type: 'security'
})
```

## Troubleshooting

### "Invalid phone number format" Error

**Cause**: Phone not matching canonical format

**Fix**: Ensure `normalizeSriLankaPhone()` is called before validation

```typescript
const normalized = normalizeSriLankaPhone(userInput)
if (!isValidSriLankanPhone(normalized)) {
  throw new Error('Invalid phone number')
}
```

### "User not found" on Login

**Cause**: Phone in auth.users not in E.164 format

**Fix**: Run normalization script

```bash
npx tsx scripts/normalize-auth-phone-numbers.ts
```

### Duplicate Phone Number Error

**Cause**: Another user already has this phone

**Fix**: Check for existing users before creating OTP

```typescript
const { user } = await findUserByPhone(adminClient, phoneNumber)
if (user && flow === 'register') {
  return { error: 'Phone number already registered' }
}
```

### OTP Expiry Issues

**Default**: 10 minutes (600 seconds)

**Check expiry**:
```sql
SELECT phone_number, expires_at, NOW()
FROM phone_verifications
WHERE phone_number = '94XXXXXXXXX'
ORDER BY created_at DESC
LIMIT 1;
```

## Related Documentation

- [OTP Flow Implementation](../implementation/PHONE_OTP_VERIFICATION_PLAN.md)
- [OTP Cleanup Automation](./OTP_CLEANUP_AUTOMATION.md)
- [Phone Formatter Utilities](../guides/SMS_OTP_FIXED.md)
- [Database Schema](../database/SUPABASE_DATABASE_ANALYSIS.md)

## Summary

- **Internal Storage**: Canonical `94XXXXXXXXX`
- **Auth Storage**: E.164 `+94XXXXXXXXX`
- **User Input**: Any format → normalized
- **Display**: `(0XX) XXX-XXXX`
- **Validation**: Single regex pattern
- **Lookup**: E.164 only in auth.users
- **No Legacy Support**: All formats standardized
