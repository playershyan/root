# Email Verification Flow Plan

## Current Issue
After clicking "Create Account" with email, the modal closes without providing user feedback. Users need to check their email to verify and complete registration.

## Solution Overview
Add a new view in the AuthModal that shows after email registration, providing:
1. Confirmation message that email has been sent
2. Display of the email address used
3. Resend email button
4. Edit email button to go back and change email

## Implementation Steps

### 1. Add New View State
- Add `'email-verification-sent'` to `AuthView` type in `AuthModal.tsx`

### 2. Modify EmailAuthForm
- When registration requires email verification, pass the email address to `onSuccess` callback
- Update `AuthResult` type to include `email` field

### 3. Create EmailVerificationSent Component
- New component: `app/components/auth/EmailVerificationSent.tsx`
- Props:
  - `email: string` - The email address verification was sent to
  - `onResend: () => void` - Function to resend verification email
  - `onEditEmail: () => void` - Function to go back and edit email
  - `onClose?: () => void` - Optional close handler
- Features:
  - Success icon/message
  - Display email address
  - "Resend Email" button with loading state
  - "Edit Email" button to go back
  - Instructions text

### 4. Create Resend Email Function
- Add `resendEmailVerification(email: string)` function in `lib/auth.ts`
- Uses Supabase `resend()` method to resend confirmation email
- Returns success/error status

### 5. Update AuthModal
- Handle `requiresEmailVerification` case differently:
  - Don't close modal immediately
  - Set view to `'email-verification-sent'`
  - Store email address in state
- Add handler for resend email
- Add handler to go back to email form

### 6. User Flow
1. User fills email registration form
2. Clicks "Create Account"
3. Modal shows "Email Verification Sent" view (doesn't close)
4. User can:
   - Click "Resend Email" to send another verification email
   - Click "Edit Email" to go back and change email address
   - Close modal manually if needed

## Files to Modify/Create

### New Files:
- `app/components/auth/EmailVerificationSent.tsx`

### Modified Files:
- `app/components/auth/AuthModal.tsx`
- `app/components/auth/EmailAuthForm.tsx`
- `app/components/auth/types.ts`
- `lib/auth.ts`

## UI Design

```
┌─────────────────────────────────┐
│  [X]                            │
│                                 │
│  ✓ Email Sent!                  │
│                                 │
│  We've sent a verification      │
│  email to:                      │
│                                 │
│  user@example.com                │
│                                 │
│  Please check your inbox and    │
│  click the verification link    │
│  to complete your registration. │
│                                 │
│  [Resend Email]                 │
│  [Edit Email]                    │
│                                 │
└─────────────────────────────────┘
```

## Technical Details

### Resend Email Function
```typescript
export async function resendEmailVerification(
  email: string
): Promise<{ success: boolean; error?: AuthError }> {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email
    })
    
    if (error) {
      return { success: false, error: { message: error.message } }
    }
    
    return { success: true }
  } catch (error) {
    return { 
      success: false, 
      error: { message: 'Failed to resend email. Please try again.' }
    }
  }
}
```

### AuthResult Type Update
```typescript
export interface AuthResult {
  success: boolean
  requiresEmailVerification?: boolean
  requiresPhoneVerification?: boolean
  user?: any
  email?: string  // Add this
}
```

