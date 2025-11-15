# Phone OTP Verification Implementation Plan

## Overview
Add OTP verification for phone number changes in:
1. `/profile` page (AccountPageClient)
2. Ad listing form (`/post`)
3. Wanted request form (`/wanted/post`)

## Current OTP Implementation Analysis

### Existing Components & APIs

#### 1. API Routes
- **`/api/auth/send-phone-otp`**: Sends OTP to phone number
  - Supports `isRegistration` flag (null user_id for registration)
  - Rate limiting: 3 OTPs per hour per phone/user
  - reCAPTCHA verification (optional for registration)
  - Stores OTP in `phone_verifications` table
  - Uses Text.lk service for SMS sending
  - OTP expires in 10 minutes

- **`/api/auth/verify-phone-otp`**: Verifies OTP code
  - Supports `isRegistration` flag
  - Checks expiry and attempt limits (max 3 attempts)
  - Marks OTP as verified
  - Returns success/error

#### 2. UI Components
- **`OTPVerification.tsx`**: Reusable OTP input component
  - 6-digit OTP input with auto-focus
  - Timer for resend (default 60s)
  - Error handling
  - Paste support
  - Calls `verifyOTP()` from `lib/auth.ts`

#### 3. Database
- **`phone_verifications` table**:
  - `user_id` (nullable for registration)
  - `phone_number`
  - `otp_code`
  - `expires_at`
  - `attempts`
  - `verified`
  - `verified_at`

### Key Functions
- `verifyOTP(phone, token, name?)` in `lib/auth.ts` - Uses Supabase auth
- `formatPhoneForStorage(phone, countryCode)` - Formats phone numbers
- `textlkService.validatePhoneNumber(phone)` - Validates Sri Lankan format
- `textlkService.sendOTP(phone, otp)` - Sends SMS

## Implementation Plan

### Phase 1: Create Reusable Phone Verification Modal

**File**: `app/components/PhoneVerificationModal.tsx` (new)

**Purpose**: Reusable modal for phone OTP verification that can be used in:
- Profile page
- Ad listing form
- Wanted request form

**Features**:
- Modal with OTP input (reuse existing `OTPVerification` component)
- Phone number display
- Timer for resend
- Success/error states
- Callbacks: `onVerified`, `onCancel`, `onResend`
- Optional: Show verification status badge

**Props Interface**:
```typescript
interface PhoneVerificationModalProps {
  phone: string
  isOpen: boolean
  onVerified: (verifiedPhone: string) => void
  onCancel: () => void
  purpose: 'profile' | 'listing' | 'wanted'
  onResend?: () => Promise<void>
}
```

### Phase 2: Create Phone Verification Hook

**File**: `lib/hooks/usePhoneVerification.ts` (new)

**Purpose**: Custom hook to manage phone verification flow

**Features**:
- Send OTP
- Verify OTP
- Resend OTP (with rate limiting)
- Track verification status
- Handle errors

**Hook API**:
```typescript
const {
  sendOTP,
  verifyOTP,
  resendOTP,
  isVerifying,
  isVerified,
  error,
  timer
} = usePhoneVerification()
```

### Phase 3: Update Profile API to Require OTP Verification

**File**: `app/api/profiles/route.ts` (modify PUT handler)

**Changes**:
1. Check if phone number changed
2. If changed, require OTP verification token
3. Verify OTP before updating phone
4. Update phone only if OTP is verified

**Request Body**:
```typescript
{
  name?: string
  phone?: string
  phoneOtpCode?: string  // Required if phone changed
  whatsapp?: string
  location?: string
  bio?: string
  // ... other fields
}
```

**Logic**:
```typescript
// Pseudo-code
if (phone changed && phone !== currentPhone) {
  if (!phoneOtpCode) {
    return error('OTP verification required for phone number change')
  }
  
  // Verify OTP
  const verified = await verifyPhoneOTP(phone, phoneOtpCode, user.id)
  if (!verified) {
    return error('Invalid OTP')
  }
  
  // Update phone
}
```

### Phase 4: Update Profile Page

**File**: `app/profile/account/AccountPageClient.tsx`

**Changes**:
1. Add state for pending phone change
2. Show verification modal when phone changes
3. Only submit form after OTP verification
4. Store temp phone during verification

**Flow**:
1. User changes phone number
2. Click "Save" or "Update Phone"
3. Modal opens with OTP verification
4. User enters OTP
5. On verification success, update profile
6. Close modal and show success message

**UI Updates**:
- Add "Verify Phone" button next to phone field (when changed)
- Show verification badge if phone is verified
- Disable save button until phone is verified (if changed)

### Phase 5: Update Ad Listing Form

**File**: `app/post/page.tsx`

**Changes**:
1. Detect phone number change
2. Show verification modal before submission
3. Store verified phone in form state
4. Include OTP in submission payload (if phone changed)

**Flow**:
1. User changes phone number in form
2. On form submission, check if phone changed
3. If changed, open verification modal
4. After verification, submit form with verified phone
5. If no change, submit directly

**Form State**:
```typescript
{
  // ... existing fields
  phone: string
  phoneVerified: boolean
  pendingPhoneChange?: string
  phoneOtpCode?: string
}
```

**Submission Logic**:
```typescript
if (phoneChanged && !phoneVerified) {
  // Show modal
  return
}

// Submit with verified phone
const payload = {
  // ... other fields
  phone: formData.phone,
  phoneOtpCode: formData.phoneOtpCode // Only if phone changed
}
```

### Phase 6: Update Wanted Request Form

**File**: `app/wanted/post/page.tsx`

**Changes**: Same as ad listing form
- Detect phone change
- Show verification modal
- Include OTP in submission

### Phase 7: Update Listing/Wanted Request APIs

**Files**:
- `app/api/listings/route.ts`
- `app/api/wanted-requests/route.ts`
- `app/api/wanted-requests/update/route.ts`

**Changes**:
1. Accept `phoneOtpCode` in request body (optional)
2. If phone changed, verify OTP before saving
3. Update phone only if OTP verified

**Logic**:
```typescript
// Get existing listing/request
const existing = await getListing(request.id)

// Check if phone changed
if (phone && phone !== existing.phone) {
  if (!phoneOtpCode) {
    return error('OTP verification required for phone number change')
  }
  
  // Verify OTP
  const verified = await verifyPhoneOTP(phone, phoneOtpCode, user.id)
  if (!verified) {
    return error('Invalid OTP')
  }
}
```

## Implementation Details

### New API Endpoint (Optional Enhancement)

**File**: `app/api/profiles/verify-phone/route.ts` (new)

**Purpose**: Dedicated endpoint for phone verification that:
- Sends OTP for phone change
- Verifies OTP for phone change
- Updates profile phone after verification

**Alternative**: Reuse existing `/api/auth/send-phone-otp` and `/api/auth/verify-phone-otp` with `isRegistration: false`

### Helper Functions

**File**: `lib/utils/phoneVerification.ts` (new)

**Functions**:
1. `checkPhoneChanged(oldPhone, newPhone): boolean`
2. `formatPhoneForVerification(phone): string`
3. `isPhoneVerified(phone, userId): Promise<boolean>`

### Database Considerations

**No schema changes needed** - `phone_verifications` table already supports:
- Nullable `user_id` (works for authenticated users)
- Multiple OTPs per phone (handled by expiry/cleanup)

**Optional Enhancement**:
- Add `purpose` column to track verification context
- Add `verified_phone` column to store verified phone number

## User Experience Flow

### Profile Page
1. User edits phone number
2. Clicks "Save" button
3. If phone changed → Modal appears: "Verify your new phone number"
4. OTP sent via SMS
5. User enters 6-digit code
6. On success → Phone updated, modal closes, success toast
7. On failure → Error message, option to resend

### Ad Listing Form
1. User fills form with phone number
2. If phone different from profile → Verification prompt on submit
3. Modal appears: "Verify phone number for this listing"
4. OTP sent
5. Verification → Form submits
6. Phone saved with listing

### Wanted Request Form
1. Same flow as ad listing form
2. Verification before posting request
3. Phone saved with wanted request

## Error Handling

1. **OTP Not Sent**: Show error, allow retry
2. **Invalid OTP**: Show error, allow retry (max 3 attempts)
3. **Expired OTP**: Show error, offer to resend
4. **Rate Limit**: Show "Too many requests, wait 1 hour"
5. **SMS Failure**: Show error, log to monitoring

## Security Considerations

1. **Rate Limiting**: Already implemented (3 OTPs/hour)
2. **reCAPTCHA**: Required for non-registration flows
3. **OTP Expiry**: 10 minutes (already implemented)
4. **Attempt Limits**: Max 3 attempts per OTP
5. **Phone Validation**: Validate format before sending OTP
6. **User Authentication**: Verify user owns the phone being verified

## Testing Checklist

### Profile Page
- [ ] Change phone → Modal appears
- [ ] OTP sent successfully
- [ ] Enter correct OTP → Phone updated
- [ ] Enter wrong OTP → Error shown
- [ ] Resend OTP works
- [ ] Rate limiting works
- [ ] Cancel modal works
- [ ] No change → No verification needed

### Ad Listing Form
- [ ] Same phone as profile → No verification
- [ ] Different phone → Verification required
- [ ] Verification successful → Form submits
- [ ] Verification failed → Form doesn't submit

### Wanted Request Form
- [ ] Same as ad listing form tests

### Edge Cases
- [ ] Empty phone number
- [ ] Invalid phone format
- [ ] Expired OTP
- [ ] Multiple OTP requests
- [ ] Network failures
- [ ] SMS service down

## Implementation Order

1. ✅ **Phase 1**: Create reusable PhoneVerificationModal component
2. ✅ **Phase 2**: Create usePhoneVerification hook
3. ✅ **Phase 3**: Update Profile API
4. ✅ **Phase 4**: Update Profile Page
5. ✅ **Phase 5**: Update Ad Listing Form
6. ✅ **Phase 6**: Update Wanted Request Form
7. ✅ **Phase 7**: Update API routes for listings/wanted requests

## Files to Create/Modify

### New Files
- `app/components/PhoneVerificationModal.tsx`
- `lib/hooks/usePhoneVerification.ts`
- `lib/utils/phoneVerification.ts`

### Modified Files
- `app/profile/account/AccountPageClient.tsx`
- `app/post/page.tsx`
- `app/wanted/post/page.tsx`
- `app/api/profiles/route.ts`
- `app/api/listings/route.ts` (if exists)
- `app/api/wanted-requests/route.ts`
- `app/api/wanted-requests/update/route.ts`

## Dependencies

- Existing: `OTPVerification` component
- Existing: `/api/auth/send-phone-otp`
- Existing: `/api/auth/verify-phone-otp`
- Existing: `textlkService` for SMS
- Existing: `phone_verifications` table

## Notes

- Reuse existing OTP infrastructure where possible
- Maintain consistency with current auth flow
- Ensure backward compatibility (existing phone numbers remain valid)
- Consider adding verification badges/indicators in UI
- Log verification attempts for security monitoring

