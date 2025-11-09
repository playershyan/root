# Phase 2: Client Components & Hooks Console.* Cleanup

## Context
You are cleaning up Phase 2 files from the ESLint console.* violation cleanup project. This phase focuses on client-side React components and context providers in the `app/components` directory.

## Objective
Replace all `console.log/error/warn/info/debug` statements with structured logging using `lib/utils/logger.ts` in all client component files.

## Target Files (32 files)
```
app/components/admin/AlertsWidget.tsx
app/components/admin/SystemHealthWidget.tsx
app/components/admin/CleanupMonitoringWidget.tsx
app/components/ImageUploadWithCompression.tsx
app/components/security/DeleteAccountCard.tsx
app/components/security/SessionsCard.tsx
app/components/messaging/EnhancedConversationModal.tsx
app/components/messaging/OfferModal.tsx
app/components/messages/MessagesTab.tsx
app/components/messaging/OfferCard.tsx
app/components/auth/OTPInput.tsx
app/components/auth/StreamlinedSignup.tsx
app/components/auth/GoogleSignInButton.tsx
app/components/auth/UsernameCreation.tsx
app/components/auth/OTPVerification.tsx
app/components/auth/AuthModal.tsx
app/components/auth/PhoneAuthForm.tsx
app/components/auth/EmailAuthForm.tsx
app/components/auth/PhoneNumberInput.tsx
app/components/FavoriteButton.tsx
app/components/ReportModal.tsx
app/components/WantedRequestFavoriteButton.tsx
app/components/modals/DeleteAccountModal.tsx
app/components/modals/ConversationModal.tsx
app/components/modals/ContactModal.tsx
app/components/wantedRequests/UrgentWantedCard.tsx
app/components/profile/ProfileSetup.tsx
app/components/profile/BusinessProfileRecovery.tsx
app/components/ContactProfile.tsx
app/components/ContactProfileOriginal.tsx
app/components/mobile/ProfileMenu.tsx
app/components/homepage/FeaturedListingsSSR.tsx
app/components/ErrorBoundary.tsx
```

## Standard Replacement Pattern for Client Components

### Import Addition (Client Components)
**IMPORTANT:** Client components use `'use client'` directive. Add logger import AFTER the directive:

```typescript
'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'  // Add here
```

### Replacement Patterns
```typescript
// Pattern 1: console.error with Error objects
// BEFORE:
console.error('Authentication failed:', error)

// AFTER:
logger.error('Authentication failed', error as Error)

// Pattern 2: console.log for debugging (client-side)
// BEFORE:
console.log('User clicked button:', userId)

// AFTER:
logger.debug('User clicked button', { userId })

// Pattern 3: console.warn for warnings
// BEFORE:
console.warn('Missing required field:', fieldName)

// AFTER:
logger.warn('Missing required field', { fieldName })

// Pattern 4: Multiple parameters (preserve context)
// BEFORE:
console.log('Form submitted:', { data, userId, timestamp })

// AFTER:
logger.debug('Form submitted', { data, userId, timestamp })

// Pattern 5: Error in catch blocks
// BEFORE:
catch (error) {
  console.error('Failed to submit:', error)
}

// AFTER:
catch (error) {
  logger.error('Failed to submit', error as Error)
}
```

## Step-by-Step Instructions

### Step 1: Process Components Directory by Directory

#### Group 1: Admin Components (3 files)
```bash
Read: app/components/admin/AlertsWidget.tsx
Read: app/components/admin/SystemHealthWidget.tsx
Read: app/components/admin/CleanupMonitoringWidget.tsx
```

#### Group 2: Auth Components (9 files)
```bash
Read: app/components/auth/OTPInput.tsx
Read: app/components/auth/StreamlinedSignup.tsx
Read: app/components/auth/GoogleSignInButton.tsx
Read: app/components/auth/UsernameCreation.tsx
Read: app/components/auth/OTPVerification.tsx
Read: app/components/auth/AuthModal.tsx
Read: app/components/auth/PhoneAuthForm.tsx
Read: app/components/auth/EmailAuthForm.tsx
Read: app/components/auth/PhoneNumberInput.tsx
```

#### Group 3: Messaging Components (4 files)
```bash
Read: app/components/messaging/EnhancedConversationModal.tsx
Read: app/components/messaging/OfferModal.tsx
Read: app/components/messages/MessagesTab.tsx
Read: app/components/messaging/OfferCard.tsx
```

#### Group 4: Security Components (2 files)
```bash
Read: app/components/security/DeleteAccountCard.tsx
Read: app/components/security/SessionsCard.tsx
```

#### Group 5: Modals (3 files)
```bash
Read: app/components/modals/DeleteAccountModal.tsx
Read: app/components/modals/ConversationModal.tsx
Read: app/components/modals/ContactModal.tsx
```

#### Group 6: Profile Components (2 files)
```bash
Read: app/components/profile/ProfileSetup.tsx
Read: app/components/profile/BusinessProfileRecovery.tsx
```

#### Group 7: Feature Components (9 files)
```bash
Read: app/components/FavoriteButton.tsx
Read: app/components/ReportModal.tsx
Read: app/components/WantedRequestFavoriteButton.tsx
Read: app/components/wantedRequests/UrgentWantedCard.tsx
Read: app/components/ContactProfile.tsx
Read: app/components/ContactProfileOriginal.tsx
Read: app/components/mobile/ProfileMenu.tsx
Read: app/components/homepage/FeaturedListingsSSR.tsx
Read: app/components/ImageUploadWithCompression.tsx
Read: app/components/ErrorBoundary.tsx
```

### Step 2: For Each File

1. **Read the file**
2. **Count console.* instances** - Note the count for reporting
3. **Add logger import after 'use client' directive**:
   ```typescript
   'use client'

   import { logger } from '@/lib/utils/logger'
   ```
4. **Replace each console.* statement** using patterns above
5. **Verify no console.* remains** in that file

### Step 3: Client-Side Specific Considerations

**Event Handlers:**
```typescript
// BEFORE:
const handleClick = () => {
  console.log('Button clicked', data)
}

// AFTER:
const handleClick = () => {
  logger.debug('Button clicked', { data })
}
```

**useEffect Hooks:**
```typescript
// BEFORE:
useEffect(() => {
  console.log('Component mounted', props)
}, [])

// AFTER:
useEffect(() => {
  logger.debug('Component mounted', { props })
}, [])
```

**API Calls:**
```typescript
// BEFORE:
const response = await fetch(url)
console.log('API response:', response)

// AFTER:
const response = await fetch(url)
logger.debug('API response', { status: response.status, url })
```

**Error Boundaries:**
```typescript
// BEFORE:
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  console.error('Error caught:', error, errorInfo)
}

// AFTER:
componentDidCatch(error: Error, errorInfo: ErrorInfo) {
  logger.error('Error caught', error, { errorInfo })
}
```

## Expected Console.* Distribution
- **Admin components:** ~5-8 instances
- **Auth components:** ~15-20 instances
- **Messaging components:** ~10-15 instances
- **Security components:** ~4-6 instances
- **Modals:** ~6-9 instances
- **Profile components:** ~4-6 instances
- **Feature components:** ~10-15 instances

**Total Expected:** ~54-79 instances across 32 files

## Verification Commands

### Per-directory verification:
```bash
# Verify admin components
Grep pattern: "console\.(log|error|warn|info|debug)" in app/components/admin/*.tsx

# Verify auth components
Grep pattern: "console\.(log|error|warn|info|debug)" in app/components/auth/*.tsx

# Verify messaging components
Grep pattern: "console\.(log|error|warn|info|debug)" in app/components/messaging/*.tsx

# Verify all components
Grep pattern: "console\.(log|error|warn|info|debug)" in app/components/**/*.tsx
```

Expected: No matches or 0 files found

## Common Patterns in This Phase

### Pattern A: Form Submission Logging
```typescript
// BEFORE:
const handleSubmit = async (data) => {
  console.log('Submitting form:', data)
  try {
    const result = await api.post('/endpoint', data)
    console.log('Success:', result)
  } catch (error) {
    console.error('Submission failed:', error)
  }
}

// AFTER:
const handleSubmit = async (data) => {
  logger.debug('Submitting form', { data })
  try {
    const result = await api.post('/endpoint', data)
    logger.debug('Success', { result })
  } catch (error) {
    logger.error('Submission failed', error as Error)
  }
}
```

### Pattern B: State Change Logging
```typescript
// BEFORE:
const handleStateChange = (newState) => {
  console.log('State changed:', newState)
  setState(newState)
}

// AFTER:
const handleStateChange = (newState) => {
  logger.debug('State changed', { newState })
  setState(newState)
}
```

### Pattern C: Modal/Dialog Logging
```typescript
// BEFORE:
const openModal = () => {
  console.log('Opening modal:', modalType)
  setIsOpen(true)
}

// AFTER:
const openModal = () => {
  logger.debug('Opening modal', { modalType })
  setIsOpen(true)
}
```

## Special Cases

### ErrorBoundary Component
In `app/components/ErrorBoundary.tsx`, error logging is CRITICAL. Ensure proper error reporting:

```typescript
// BEFORE:
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  console.error('Uncaught error:', error, errorInfo)
}

// AFTER:
componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
  logger.error('Uncaught error', error, {
    componentStack: errorInfo.componentStack
  })
}
```

## Completion Criteria
- ✅ All 32 component files have logger import added
- ✅ All console.* statements replaced with logger.*
- ✅ 'use client' directive position preserved
- ✅ Grep verification shows 0 remaining violations in app/components
- ✅ No syntax errors introduced

## Output Format
After completion, report:
```
Phase 2 Client Components Cleanup Complete
- Files processed: 32/32
- Total console.* instances replaced: [count]
- Verification: PASSED/FAILED
- Breakdown by directory:
  - admin: [count] instances across 3 files
  - auth: [count] instances across 9 files
  - messaging: [count] instances across 4 files
  - security: [count] instances across 2 files
  - modals: [count] instances across 3 files
  - profile: [count] instances across 2 files
  - features: [count] instances across 9 files
```

## Next Steps
After completion, Phase 2 is 100% done. Report completion and await Phase 1/3 completion from other agents.
