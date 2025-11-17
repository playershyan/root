# Reference Files for Future Twilio/Supabase Native Phone Auth

These files contain the original phone authentication implementation. They are preserved here for reference when implementing phone authentication using Supabase's native SMS providers (Twilio/MessageBird).

## Component Files (Deprecated - For Reference Only)

### 1. PhoneAuthForm.tsx (`app/components/auth/PhoneAuthForm.tsx`)

**Purpose**: Complete phone authentication form component
**Size**: 389 lines
**Features**:
- Phone number input with Sri Lankan format (+94)
- Name input for registration
- reCAPTCHA integration for bot protection
- OTP sending via text.lk
- Error handling and retry logic
- Alternative auth method switching (Email/Google)
- Mobile-optimized UI with responsive design

**Key Integration Points**:
```typescript
// API Call Pattern
const response = await fetch('/api/auth/send-phone-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber: cleanedPhone,
    recaptchaToken: recaptchaToken || '',
    flow: type === 'register' ? 'register' : 'login'
  })
})
```

**reCAPTCHA Implementation**:
```typescript
// Get fresh token before API call to avoid expiry
recaptchaToken = await getToken('phone_otp', { forceFresh: true })
```

**When to Use**:
- Implementing phone registration flow
- Implementing phone login flow
- Need reCAPTCHA protection for SMS endpoints
- Multi-step auth UI (phone → OTP → verification)

---

### 2. PhoneNumberInput.tsx (`app/components/auth/PhoneNumberInput.tsx`)

**Purpose**: Simplified phone input component (alternative to PhoneAuthForm)
**Size**: 169 lines
**Features**:
- Phone number formatting (0XX XXX XXXX)
- Real-time validation
- SMS OTP sending
- Loading states
- No reCAPTCHA (simpler flow)

**Phone Formatting Logic**:
```typescript
const formatPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '')
  if (digits.startsWith('0')) {
    return digits.slice(0, 3) + ' ' + digits.slice(3, 6) + ' ' + digits.slice(6, 10)
  }
  return digits
}
```

**When to Use**:
- Simpler phone auth flow without reCAPTCHA
- Progressive disclosure UI (phone first, then OTP)
- Testing or MVP implementations

---

### 3. OTPInput.tsx (`app/components/auth/OTPInput.tsx`)

**Purpose**: 6-digit OTP verification component
**Size**: 273 lines
**Features**:
- 6 individual digit inputs
- Auto-focus and auto-advance
- Paste support (mobile-friendly)
- Auto-submit on completion
- Resend OTP with cooldown timer
- Error handling with input clearing

**OTP Verification Pattern**:
```typescript
const response = await fetch('/api/auth/verify-phone-otp', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    phoneNumber,
    otpCode: otpValue,
    flow: 'register'
  })
})
```

**Auto-Submit Logic**:
```typescript
// Auto-submit when all 6 digits entered (mobile UX)
useEffect(() => {
  const otpValue = otp.join('')
  if (otpValue.length === 6 && !loading) {
    handleVerifyOTP(otpValue)
  }
}, [otp, loading])
```

**Resend Cooldown**:
```typescript
// 60-second cooldown after resending
setResendCooldown(60)
```

**When to Use**:
- OTP verification step in phone auth
- Mobile-optimized OTP input
- Need auto-submit and paste support

---

## File Locations

These files are **still in the codebase** but marked as unused:

```
app/components/auth/
├── PhoneAuthForm.tsx          (389 lines) - Main phone auth form
├── PhoneNumberInput.tsx       (169 lines) - Simplified phone input
└── OTPInput.tsx               (273 lines) - OTP verification UI

scripts/
├── test-otp-flows.ts          (Can be deleted - testing script)
├── normalize-auth-phone-numbers.ts  (Can be deleted - migration script)
└── debug-supabase-phone.ts    (Can be deleted - debug utilities)
```

---

## Migration Guide: From text.lk to Twilio/Supabase Native

When you're ready to implement phone authentication using Supabase's native SMS:

### Step 1: Enable Supabase Phone Auth

**Supabase Dashboard**:
1. Go to **Authentication** → **Providers**
2. Enable **Phone** provider
3. Configure **Twilio** or **MessageBird**:
   - Account SID
   - Auth Token
   - Messaging Service SID
4. Save configuration

### Step 2: Update Environment Variables

**Remove** (text.lk):
```env
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1234567890
```

**Add** (Supabase Native):
```env
# Supabase handles SMS via dashboard config
# No environment variables needed
```

### Step 3: Replace Custom OTP APIs

**Delete**:
- `app/api/auth/send-phone-otp/route.ts` (current phone-update-only version)
- `app/api/auth/verify-phone-otp/route.ts` (current phone-update-only version)

**Use Supabase SDK Instead**:

```typescript
// Send OTP
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+94771234567'
})

// Verify OTP
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+94771234567',
  token: '123456',
  type: 'sms'
})

// Session created automatically!
// No custom JWT generation needed
```

### Step 4: Integrate UI Components

**Registration Flow**:
1. Use `PhoneAuthForm` component (set `type="register"`)
2. Replace `/api/auth/send-phone-otp` with `supabase.auth.signInWithOtp()`
3. Use `OTPInput` component for verification
4. Replace `/api/auth/verify-phone-otp` with `supabase.auth.verifyOtp()`

**Login Flow**:
1. Use `PhoneAuthForm` component (set `type="login"`)
2. Same Supabase SDK calls as registration
3. Supabase automatically creates or signs in user

### Step 5: Re-enable Phone Auth in Config

**File**: `lib/config/auth.config.ts`
```typescript
phone: {
  enabled: true,  // RE-ENABLED for Supabase native auth
}
```

### Step 6: Update Database Schema (Optional)

**If Using Custom Phone Verification Table**:
- Keep `phone_verifications` table for phone updates only
- Supabase manages auth-related OTPs in `auth.` schema

**If Migrating Completely**:
- Drop `phone_verifications` table
- Use Supabase's `auth.users.phone` field
- Phone verification handled by Supabase

---

## Code Comparison: text.lk vs Supabase Native

### Sending OTP

**Before (text.lk custom)**:
```typescript
const response = await fetch('/api/auth/send-phone-otp', {
  method: 'POST',
  body: JSON.stringify({
    phoneNumber: '0771234567',
    recaptchaToken,
    flow: 'register'
  })
})
```

**After (Supabase native)**:
```typescript
const { data, error } = await supabase.auth.signInWithOtp({
  phone: '+94771234567'
})
```

### Verifying OTP

**Before (text.lk custom)**:
```typescript
const response = await fetch('/api/auth/verify-phone-otp', {
  method: 'POST',
  body: JSON.stringify({
    phoneNumber: '0771234567',
    otpCode: '123456',
    flow: 'register'
  })
})

// Manual session creation with custom JWT
const tokens = generateSupabaseTokens(userId, email, phone)
await supabase.auth.setSession({
  access_token: tokens.access_token,
  refresh_token: tokens.refresh_token
})
```

**After (Supabase native)**:
```typescript
const { data, error } = await supabase.auth.verifyOtp({
  phone: '+94771234567',
  token: '123456',
  type: 'sms'
})

// Session created automatically!
// No manual JWT generation needed
const session = data.session
const user = data.user
```

---

## Benefits of Supabase Native Phone Auth

✅ **No Custom APIs**: Supabase handles OTP sending and verification
✅ **Automatic Session Management**: Sessions created without custom JWTs
✅ **Reliable**: Battle-tested by thousands of projects
✅ **Secure**: Proper session storage in `auth.sessions` table
✅ **International**: Works globally (not just Sri Lanka)
✅ **Scalable**: Twilio infrastructure handles high volume
✅ **Dashboard Management**: Configure SMS templates, rate limits, etc.

---

## Cost Comparison

**text.lk (Current)**:
- Cost: ~LKR 0.50 per SMS
- Coverage: Sri Lanka only
- Reliability: Moderate
- Setup: Custom implementation required

**Twilio via Supabase (Recommended)**:
- Cost: ~$0.08 per SMS (~LKR 24)
- Coverage: Global
- Reliability: Enterprise-grade (99.95% uptime)
- Setup: Dashboard configuration only

**MessageBird via Supabase (Alternative)**:
- Cost: ~$0.06 per SMS (~LKR 18)
- Coverage: Global
- Reliability: High (99.9% uptime)
- Setup: Dashboard configuration only

---

## Rollback Plan

If Supabase native phone auth has issues, revert to text.lk:

1. Re-enable custom OTP APIs (from git history before 2025-11-17)
2. Set `phone.enabled = false` in auth config
3. Keep phone updates working (already isolated)
4. Users can still auth via Email/Google

---

## Summary

These reference files contain battle-tested patterns for:
- Phone number input and validation
- OTP sending with reCAPTCHA
- OTP verification with auto-submit
- Resend logic with cooldown
- Error handling and retry
- Mobile-optimized UX

When implementing Supabase native phone auth, these components can be reused with minimal changes—just replace the API calls with Supabase SDK methods.

**The UI/UX is solid. The backend integration needs to change from text.lk to Supabase.**
