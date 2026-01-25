# TextLK Implementation & Phone Verification Modal Package

This package contains the complete TextLK SMS service implementation and phone number verification modal with all supporting logic.

## 📦 Contents

1. **TextLK Service** - SMS gateway service for Sri Lanka
2. **Phone Verification Modal** - Complete modal component with OTP verification
3. **Phone Verification Hook** - React hook for phone verification logic
4. **API Routes** - Backend endpoints for sending and verifying OTP
5. **Utility Functions** - Phone formatting and validation utilities
6. **Logger Utility** - Logging utility (optional, can be replaced)

---

## 🔧 Setup Instructions

### 1. Environment Variables

Add these to your `.env.local`:

```env
# TextLK SMS Gateway
TEXTLK_API_KEY=your_api_token_here
TEXTLK_SENDER_ID=VERAVERIFY1  # Optional, max 11 characters

# Supabase (for phone_verifications table)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 2. Database Table

Create the `phone_verifications` table in Supabase:

```sql
CREATE TABLE phone_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  otp_code TEXT NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure one pending OTP per user+phone
  CONSTRAINT unique_pending_verification UNIQUE NULLS NOT DISTINCT (phone_number, user_id) 
    WHERE verified = FALSE
);

-- Indexes
CREATE INDEX idx_phone_verifications_phone ON phone_verifications(phone_number);
CREATE INDEX idx_phone_verifications_user ON phone_verifications(user_id);
CREATE INDEX idx_phone_verifications_expires ON phone_verifications(expires_at) WHERE verified = FALSE;
```

### 3. Dependencies

Install required packages:

```bash
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs lucide-react
```

---

## 📁 File Structure

```
lib/
  services/
    textlkService.ts          # TextLK SMS service
  hooks/
    usePhoneVerification.ts   # Phone verification hook
  utils/
    phoneFormatter.ts         # Phone formatting utilities
    logger.ts                 # Logging utility (optional)

app/
  components/
    EditPhoneModal.tsx        # Phone verification modal component
  api/
    auth/
      send-phone-otp/
        route.ts              # API: Send OTP
      verify-phone-otp/
        route.ts              # API: Verify OTP
```

---

## 🚀 Usage Example

```tsx
import EditPhoneModal from '@/app/components/EditPhoneModal'

function MyComponent() {
  const [showModal, setShowModal] = useState(false)
  const [currentPhone, setCurrentPhone] = useState('')

  const handlePhoneVerified = (newPhone: string, otpCode?: string, shouldCache?: boolean) => {
    console.log('Phone verified:', newPhone)
    setCurrentPhone(newPhone)
    // Save phone to your database/state
  }

  return (
    <>
      <button onClick={() => setShowModal(true)}>Edit Phone</button>
      
      <EditPhoneModal
        currentPhone={currentPhone}
        isOpen={showModal}
        onVerified={handlePhoneVerified}
        onCancel={() => setShowModal(false)}
        purpose="profile" // or "listing" or "wanted"
      />
    </>
  )
}
```

---

## 📝 Notes

- **TextLK Service**: Handles SMS sending via Text.lk API for Sri Lankan numbers
- **Phone Format**: Accepts formats like `0771234567`, `771234567`, `+94771234567`, `94771234567`
- **OTP Expiry**: 10 minutes
- **Rate Limiting**: Max 3 OTP requests per hour per user/phone
- **Auto-verification**: OTP auto-submits when all 6 digits are entered
- **Resend Timer**: 60 seconds between resend attempts

---

## 🔍 Key Features

✅ Sri Lankan phone number validation  
✅ OTP generation and SMS delivery via TextLK  
✅ 6-digit OTP input with auto-focus  
✅ Resend OTP with countdown timer  
✅ Rate limiting (3 OTPs/hour)  
✅ Auto-verification on paste  
✅ Success screen with auto-close  
✅ Error handling and validation  
✅ Mobile-friendly UI  

---

## 📄 Files Included

All files are in the current directory:

1. **`textlkService.ts`** - Complete TextLK SMS service implementation
   - SMS sending via Text.lk API
   - OTP sending
   - Phone number validation
   - Campaign support
   - Message status checking

2. **`EditPhoneModal.tsx`** - Phone verification modal component
   - 3-step flow (Enter Phone → Verify OTP → Success)
   - Auto-focus and paste support
   - Resend timer
   - Success screen with auto-close

3. **`usePhoneVerification.ts`** - React hook for phone verification
   - `sendOTP()` - Send OTP code
   - `verifyOTP()` - Verify OTP code
   - Loading states and error handling

4. **`send-phone-otp-route.ts`** - API route for sending OTP
   - Place in: `app/api/auth/send-phone-otp/route.ts`
   - Rate limiting (3 OTPs/hour)
   - OTP generation and storage
   - SMS delivery via TextLK

5. **`verify-phone-otp-route.ts`** - API route for verifying OTP
   - Place in: `app/api/auth/verify-phone-otp/route.ts`
   - OTP validation
   - Attempt tracking
   - Verification status update

6. **`phoneFormatter.ts`** - Phone number utilities
   - `formatPhoneDisplay()` - Format for display
   - `normalizeSriLankaPhone()` - Normalize to canonical format
   - `isValidSriLankanPhone()` - Validation
   - `toE164()` - E.164 format conversion

7. **`logger.ts`** - Simple logging utility
   - Replace with your own logger if needed
   - Basic console logging with dev/prod modes

## 📋 Quick Setup Checklist

- [ ] Copy `textlkService.ts` to `lib/services/textlkService.ts`
- [ ] Copy `EditPhoneModal.tsx` to `app/components/EditPhoneModal.tsx`
- [ ] Copy `usePhoneVerification.ts` to `lib/hooks/usePhoneVerification.ts`
- [ ] Copy `send-phone-otp-route.ts` to `app/api/auth/send-phone-otp/route.ts`
- [ ] Copy `verify-phone-otp-route.ts` to `app/api/auth/verify-phone-otp/route.ts`
- [ ] Copy `phoneFormatter.ts` to `lib/utils/phoneFormatter.ts`
- [ ] Copy `logger.ts` to `lib/utils/logger.ts` (or use your own)
- [ ] Create `phone_verifications` table in Supabase
- [ ] Add environment variables to `.env.local`
- [ ] Install dependencies: `npm install lucide-react`
- [ ] Update import paths in files to match your project structure

