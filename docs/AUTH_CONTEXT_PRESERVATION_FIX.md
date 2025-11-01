# Authentication Context Preservation - Root Cause & Fix

## Problem

User reported: "I am still being directed to /profile in all the above actions"

After multiple attempted fixes to AuthModal and auth components, the issue persisted. The root cause was NOT in the modal components - it was in the **OAuth callback route**.

## Root Cause Analysis

### The OAuth Callback Hardcoded Redirect

**File**: `app/auth/callback/route.ts:54-58`

```typescript
// Check for stored redirect URL
const redirectTo = requestUrl.searchParams.get('redirectTo')
if (redirectTo) {
  return NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
}
return NextResponse.redirect(new URL('/profile', requestUrl.origin))  // ← ALWAYS triggers
```

**The Problem**: Line 58 hardcodes `/profile` redirect when no `redirectTo` parameter exists.

### The Missing Link

**File**: `lib/auth.ts:161-182`

The infrastructure ALREADY EXISTS to handle redirects:

```typescript
export async function signInWithGoogle(): Promise<{ success: boolean; error?: AuthError }> {
  // Line 161: READS from localStorage
  const pendingRedirect = localStorage.getItem('pendingRedirect')
  const redirectPath = pendingRedirect || '/profile'
  
  // Line 182: PASSES to OAuth callback
  redirectTo: `${redirectTo}/api/auth/callback?redirectTo=${encodeURIComponent(redirectPath)}`
}
```

**BUT**: No component actually SETS `pendingRedirect` in localStorage before calling `signInWithGoogle()`!

### Why Previous Fixes Failed

1. **AuthModal callback approach**: Works for modal flows (Email/Phone) but bypassed by OAuth redirects
2. **Component state management**: Lost during OAuth page reload
3. **Router.push() in callbacks**: Never executes because OAuth callback route redirects first

## The Complete Flow (What Actually Happens)

### Google OAuth Flow
```
User clicks "Sell" (unauthenticated)
  ↓
Component sets state: setPendingRedirect('/post')
  ↓
User clicks "Google Sign In"
  ↓
signInWithGoogle() executes
  ├─ Reads localStorage.getItem('pendingRedirect')  // = null (never set!)
  ├─ redirectPath = null || '/profile'  // = '/profile'
  └─ Opens OAuth: /api/auth/callback?redirectTo=/profile
  ↓
Google OAuth flow (page reloads, all state lost)
  ↓
Callback route.ts
  ├─ searchParams.get('redirectTo')  // = '/profile'
  └─ NextResponse.redirect('/profile')  // ← USER SENT HERE
```

### Modal Flow (Email/Phone)
```
User clicks "Make Offer" (unauthenticated)
  ↓
Component provides callback: onAuthSuccess={() => setShowOfferModal(true)}
  ↓
User completes auth in modal (no page reload)
  ↓
AuthModal.handleAuthSuccess() executes callback
  ↓
Offer modal opens  // ✓ This works!
```

## Solution

### Two-Track Approach

**Track 1: OAuth (Page Reload Involved)**
- Store redirect in `localStorage` BEFORE initiating OAuth
- `signInWithGoogle()` reads from localStorage
- OAuth callback receives correct path
- User redirected to intended destination

**Track 2: Modal (No Page Reload)**
- Use callback functions as currently implemented
- AuthModal executes callback after auth
- User stays on page, action executes

### Implementation

Created: `app/hooks/useAuthWithRedirect.ts`

Centralized hook managing both patterns:

```typescript
export function useAuthWithRedirect() {
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [authCallback, setAuthCallback] = useState<(() => void) | null>(null)

  const openAuthWithRedirect = (redirectPath: string) => {
    localStorage.setItem('pendingRedirect', redirectPath)  // ← For OAuth
    setAuthCallback(() => () => router.push(redirectPath)) // ← For Modal
    setShowAuthModal(true)
  }

  const openAuthWithAction = (action: () => void) => {
    localStorage.removeItem('pendingRedirect')  // ← Clear OAuth redirect
    setAuthCallback(() => action)               // ← Set modal callback
    setShowAuthModal(true)
  }

  const handleAuthSuccess = () => {
    if (authCallback) authCallback()
    setAuthCallback(null)
  }

  return { showAuthModal, openAuthWithRedirect, openAuthWithAction, closeAuth, handleAuthSuccess }
}
```

### Usage Examples

**Sell Button (Page Redirect)**:
```typescript
const { openAuthWithRedirect, showAuthModal, closeAuth, handleAuthSuccess } = useAuthWithRedirect()

<button onClick={() => openAuthWithRedirect('/post')}>Sell</button>

<AuthModal
  isOpen={showAuthModal}
  onClose={closeAuth}
  onAuthSuccess={handleAuthSuccess}
/>
```

**Make Offer Button (In-Page Action)**:
```typescript
const { openAuthWithAction, showAuthModal, closeAuth, handleAuthSuccess } = useAuthWithRedirect()

<button onClick={() => openAuthWithAction(() => setShowOfferModal(true))}>Make Offer</button>

<AuthModal
  isOpen={showAuthModal}
  onClose={closeAuth}
  onAuthSuccess={handleAuthSuccess}
/>
```

## Why Other Sites Don't Have This Problem

Major sites handle OAuth context preservation via:

1. **Twitter/X**: Session storage + OAuth state parameter
2. **GitHub**: `return_to` parameter stored in OAuth state
3. **LinkedIn**: Encrypted cookie with redirect path
4. **Airbnb**: Combination of modal auth (stays on page) + session storage for OAuth

Our implementation now matches industry patterns by:
- Using localStorage for OAuth persistence
- Using callbacks for modal flows
- Separating concerns between redirect vs action
