# Auto-Populate Profile Contact - Complete Removal Analysis

## Overview
Complete inventory of all auto-populate related code, configuration, and documentation for removal.

---

## Files Containing Auto-Populate Code

### 1. API Routes (Core Logic)

#### `/app/api/listings/route.ts`
**Lines: 255-293**
```typescript
// Auto-populate profile contact fields if empty
// This runs REGARDLESS of whether OTP was required
if (body.saveToProfile !== false) {
  try {
    // Fetch current profile
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('phone, whatsapp')
      .eq('id', user.id)
      .single()

    const updates: { phone?: string; whatsapp?: string } = {}

    // Normalize inputs
    const normalizedPhone = normalizeSriLankaPhone(sanitized.phone)
    const normalizedWhatsApp = sanitized.whatsapp ? normalizeSriLankaPhone(sanitized.whatsapp) : null

    // Update phone if empty
    if (!currentProfile?.phone || currentProfile.phone.trim() === '') {
      updates.phone = normalizedPhone
    }

    // Update whatsapp if empty (ALWAYS if provided, regardless of whether it equals phone)
    if (normalizedWhatsApp && (!currentProfile?.whatsapp || currentProfile.whatsapp.trim() === '')) {
      updates.whatsapp = normalizedWhatsApp
    }

    // Perform update
    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
    }
  } catch (error) {
    // Don't fail listing creation if profile update fails
    logger.error('Auto-populate profile failed', error as Error, { userId: user.id })
  }
}
```

**Action Required:** Remove entire block (lines 255-293)

---

#### `/app/api/wanted-requests/route.ts`
**Lines: 158-196**
```typescript
// Auto-populate profile contact fields if empty
// This runs REGARDLESS of whether OTP was required
if (body.saveToProfile !== false) {
  try {
    // Fetch current profile
    const { data: currentProfile } = await supabaseAdmin
      .from('profiles')
      .select('phone, whatsapp')
      .eq('id', user.id)
      .single()

    const updates: { phone?: string; whatsapp?: string } = {}

    // Normalize inputs
    const normalizedPhone = normalizeSriLankaPhone(sanitized.phone)
    const normalizedWhatsApp = sanitized.whatsapp ? normalizeSriLankaPhone(sanitized.whatsapp) : null

    // Update phone if empty
    if (!currentProfile?.phone || currentProfile.phone.trim() === '') {
      updates.phone = normalizedPhone
    }

    // Update whatsapp if empty (ALWAYS if provided, regardless of whether it equals phone)
    if (normalizedWhatsApp && (!currentProfile?.whatsapp || currentProfile.whatsapp.trim() === '')) {
      updates.whatsapp = normalizedWhatsApp
    }

    // Perform update
    if (Object.keys(updates).length > 0) {
      await supabaseAdmin
        .from('profiles')
        .update(updates)
        .eq('id', user.id)
    }
  } catch (error) {
    // Don't fail wanted request creation if profile update fails
    logger.error('Auto-populate profile failed', error as Error, { userId: user.id })
  }
}
```

**Action Required:** Remove entire block (lines 158-196)

---

### 2. Frontend Components (State & Data Passing)

#### `/app/post/page.tsx`
**Lines affected:**
- Line 129: `const [saveToProfile, setSaveToProfile] = useState<boolean>(true)`
- Line 1199: `saveToProfile: saveToProfile // Include save preference for profile auto-population`
- Lines 1289-1296: `handlePhoneVerified` function receives and sets `saveToProfilePref`

**Code blocks:**
```typescript
// Line 129 - State declaration
const [saveToProfile, setSaveToProfile] = useState<boolean>(true)

// Line 1199 - API payload
body: JSON.stringify({
  // ... other fields
  saveToProfile: saveToProfile // Include save preference for profile auto-population
})

// Lines 1289-1296 - Handler
const handlePhoneVerified = (newPhone: string, otpCode?: string, saveToProfilePref?: boolean) => {
  setFormData(prev => ({ ...prev, phone: newPhone }))
  if (otpCode) {
    setPendingOtpCode(otpCode)
  }
  if (saveToProfilePref !== undefined) {
    setSaveToProfile(saveToProfilePref)
  }
  setShowEditPhoneModal(false)
  // Toast is now shown in EditPhoneModal component
}
```

**Action Required:**
- Remove `saveToProfile` state variable
- Remove `saveToProfile` from API request payload
- Remove `saveToProfilePref` parameter from `handlePhoneVerified`
- Update function signature in both phone and whatsapp handlers

---

#### `/app/wanted/post/page.tsx`
**Lines affected:**
- Line 81: `const [saveToProfile, setSaveToProfile] = useState<boolean>(true)`
- Line 547: `saveToProfile: saveToProfile, // Include save preference for profile auto-population`
- Lines 648-655: `handlePhoneVerified` function receives and sets `saveToProfilePref`

**Code blocks:**
```typescript
// Line 81 - State declaration
const [saveToProfile, setSaveToProfile] = useState<boolean>(true)

// Line 547 - API payload
const response = await fetch('/api/wanted-requests', {
  // ... other fields
  saveToProfile: saveToProfile, // Include save preference for profile auto-population
})

// Lines 648-655 - Handler
const handlePhoneVerified = (newPhone: string, otpCode?: string, saveToProfilePref?: boolean) => {
  setFormData(prev => ({ ...prev, phone: newPhone }))
  if (otpCode) {
    setPendingOtpCode(otpCode)
  }
  if (saveToProfilePref !== undefined) {
    setSaveToProfile(saveToProfilePref)
  }
  setShowEditPhoneModal(false)
  // Toast is now shown in EditPhoneModal component
}
```

**Action Required:**
- Remove `saveToProfile` state variable
- Remove `saveToProfile` from API request payload
- Remove `saveToProfilePref` parameter from `handlePhoneVerified`

---

#### `/app/components/EditPhoneModal.tsx`
**Lines affected:**
- Line 15: Function signature `onVerified: (newPhone: string, otpCode?: string, saveToProfile?: boolean) => void`
- Line 41: `const [saveToProfile, setSaveToProfile] = useState(true)`
- Line 60: `setSaveToProfile(true)` (reset on modal open)
- Line 318: `onVerified(newPhone, code, saveToProfile)` (callback with preference)
- Lines 459-475: Checkbox UI for save to profile

**Code blocks:**
```typescript
// Line 15 - Interface
interface EditPhoneModalProps {
  currentPhone: string
  isOpen: boolean
  onVerified: (newPhone: string, otpCode?: string, saveToProfile?: boolean) => void // ← Remove saveToProfile param
  onCancel: () => void
  purpose: 'profile' | 'listing' | 'wanted'
  showSuccessToast: (message: string, duration?: number) => void
  showErrorToast: (message: string, duration?: number) => void
}

// Line 41 - State
const [saveToProfile, setSaveToProfile] = useState(true)

// Line 60 - Reset on open
useEffect(() => {
  if (isOpen) {
    // ... other resets
    setSaveToProfile(true)
  }
}, [isOpen])

// Line 318 - Callback
onVerified(newPhone, code, saveToProfile) // ← Remove third parameter

// Lines 459-475 - Checkbox UI
{(purpose === 'listing' || purpose === 'wanted') && (
  <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
    <input
      type="checkbox"
      id="saveToProfile"
      checked={saveToProfile}
      onChange={(e) => setSaveToProfile(e.target.checked)}
      className="mt-0.5 h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
    />
    <label htmlFor="saveToProfile" className="text-sm text-gray-700 cursor-pointer">
      <span className="font-medium">Save to profile for future listings</span>
      <p className="text-xs text-gray-600 mt-1">
        If your profile contact information is empty, we'll automatically save this verified number so you won't need to verify it again.
      </p>
    </label>
  </div>
)}
```

**Action Required:**
- Remove `saveToProfile` parameter from `onVerified` function signature
- Remove `saveToProfile` state variable
- Remove `setSaveToProfile(true)` reset
- Remove checkbox UI block (lines 459-475)
- Update `onVerified` callback to only pass phone and OTP code

---

### 3. Documentation Files

#### `/home/user/root/AUTO_POPULATE_ISSUE_ANALYSIS.md`
**Size:** 10,314 bytes
**Content:** Complete analysis of auto-populate issues, root causes, fixes

**Action Required:** DELETE entire file

---

#### `/home/user/root/DEBUG_AUTO_POPULATE.md`
**Size:** 4,937 bytes
**Content:** Debug guide for auto-populate feature

**Action Required:** DELETE entire file

---

### 4. Database Migrations

#### `/home/user/root/database-migrations/20251121_add_whatsapp_to_profiles.sql`
**Size:** 456 bytes
**Content:**
```sql
-- Add whatsapp column to profiles table
-- Migration: 20251121_add_whatsapp_to_profiles

BEGIN;

-- Add whatsapp column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS whatsapp TEXT;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp ON public.profiles(whatsapp);

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.whatsapp IS 'User WhatsApp number in international format';

COMMIT;
```

**Action Required:**
**DO NOT DELETE** - WhatsApp column may be used for other purposes (displaying contact info, messaging, etc.)
**KEEP** - Migration and column remain, only auto-populate functionality removed

---

### 5. Other References

#### `/app/wanted/page.client-backup.tsx`
**Line 373:** Comment reference to profile saving
```typescript
// Save full request data for profile page (similar to listings page)
```

**Action Required:** CHECK if actual auto-populate logic exists, remove if found

---

## Summary of Changes Required

### Code Removals
1. **API Routes (2 files)**
   - `/app/api/listings/route.ts` - Remove lines 255-293
   - `/app/api/wanted-requests/route.ts` - Remove lines 158-196

2. **Frontend State & Handlers (3 files)**
   - `/app/post/page.tsx` - Remove saveToProfile state, payload field, handler parameter
   - `/app/wanted/post/page.tsx` - Remove saveToProfile state, payload field, handler parameter
   - `/app/components/EditPhoneModal.tsx` - Remove saveToProfile state, checkbox UI, callback parameter

### Documentation Removals
3. **Documentation Files (2 files)**
   - DELETE `/AUTO_POPULATE_ISSUE_ANALYSIS.md`
   - DELETE `/DEBUG_AUTO_POPULATE.md`

### Database Migrations
4. **Keep Migration**
   - KEEP `/database-migrations/20251121_add_whatsapp_to_profiles.sql`
   - WhatsApp column still needed for contact display

---

## Impact Assessment

### What Will Still Work
- Phone number OTP verification ✓
- WhatsApp number input in forms ✓
- Contact information display ✓
- Profile contact fields (phone/whatsapp columns exist) ✓
- Manual profile editing ✓

### What Will Stop Working
- Auto-population of profile.phone from listing/wanted forms ✗
- Auto-population of profile.whatsapp from listing/wanted forms ✗
- "Save to profile" checkbox in EditPhoneModal ✗

### User Impact
- Users must manually update profile contact information
- Each listing/wanted request requires phone verification if number changes
- No automatic profile convenience feature

---

## Removal Checklist

- [ ] Remove auto-populate block from `/app/api/listings/route.ts`
- [ ] Remove auto-populate block from `/app/api/wanted-requests/route.ts`
- [ ] Remove saveToProfile state from `/app/post/page.tsx`
- [ ] Remove saveToProfile from API payload in `/app/post/page.tsx`
- [ ] Remove saveToProfilePref from handlers in `/app/post/page.tsx`
- [ ] Remove saveToProfile state from `/app/wanted/post/page.tsx`
- [ ] Remove saveToProfile from API payload in `/app/wanted/post/page.tsx`
- [ ] Remove saveToProfilePref from handlers in `/app/wanted/post/page.tsx`
- [ ] Remove saveToProfile parameter from `/app/components/EditPhoneModal.tsx` interface
- [ ] Remove saveToProfile state from `/app/components/EditPhoneModal.tsx`
- [ ] Remove checkbox UI from `/app/components/EditPhoneModal.tsx`
- [ ] Update onVerified callback in `/app/components/EditPhoneModal.tsx`
- [ ] Delete `/AUTO_POPULATE_ISSUE_ANALYSIS.md`
- [ ] Delete `/DEBUG_AUTO_POPULATE.md`
- [ ] Verify no other references exist
- [ ] Test listing creation flow
- [ ] Test wanted request creation flow
- [ ] Commit and push changes

---

## Files to Modify (Total: 5)
1. `/app/api/listings/route.ts`
2. `/app/api/wanted-requests/route.ts`
3. `/app/post/page.tsx`
4. `/app/wanted/post/page.tsx`
5. `/app/components/EditPhoneModal.tsx`

## Files to Delete (Total: 2)
1. `/AUTO_POPULATE_ISSUE_ANALYSIS.md`
2. `/DEBUG_AUTO_POPULATE.md`

## Files to Keep (Total: 1)
1. `/database-migrations/20251121_add_whatsapp_to_profiles.sql`
