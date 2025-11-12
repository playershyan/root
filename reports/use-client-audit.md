# 'use client' Audit Results

## Summary Statistics
- Total components with 'use client': 164
- Can be converted to Server: 5 (3.0%)
- Need to be split: 1 (0.6%)
- Must remain Client: 158 (96.3%)

## Estimated Bundle Savings
- Components to convert: 5 × avg 5KB = 25KB
- Components to split: 1 × avg 3KB = 3KB
- **Total Estimated Savings**: 28KB

## High Priority Conversions (Quick Wins)

### app/components/listings/ListingStatusBadge.tsx
- **Reason**: Pure display, no interactivity detected
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

### app/components/listings/ListingStatusMessage.tsx
- **Reason**: Pure display, no interactivity detected
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

### app/components/listings/PromotionBadges.tsx
- **Reason**: Pure display, no interactivity detected
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

### app/components/wantedRequests/WantedRequestStatusBadge.tsx
- **Reason**: Pure display, no interactivity detected
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

### app/components/wantedRequests/WantedRequestStatusMessage.tsx
- **Reason**: Pure display, no interactivity detected
- **Action**: Remove 'use client' directive
- **Estimated Savings**: ~5KB

## Components Requiring Split

### 1. app/components/messages/MessagesList.tsx
- **Current**: Lightweight interactivity detected (event handlers without local state). Consider extracting handlers into a client sub-component.
- **Strategy**: Extract interactive elements into dedicated Client Component
- **Estimated Savings**: ~3KB

## Components That Must Remain Client

### 1. app/account/update-password/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 2. app/admin-old/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 3. app/admin-old/setup/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 4. app/admin-old/templates/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 5. app/admin/analytics/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 6. app/admin/business/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 7. app/admin/components/AdminHeader.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 8. app/admin/components/AdminProvider.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 9. app/admin/components/AdminSidebar.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 10. app/admin/components/AlertsOverviewClient.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 11. app/admin/components/DashboardStatsClient.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 12. app/admin/components/RecentActivityClient.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 13. app/admin/components/SystemHealthClient.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 14. app/admin/listings/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 15. app/admin/reports/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 16. app/admin/users/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 17. app/admin/wanted-requests/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 18. app/careers/page.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 19. app/components/admin/AlertsWidget.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

### 20. app/components/admin/CleanupMonitoringWidget.tsx
- **Reason**: Uses client-only features that require the component to remain a Client Component.
- **Action**: No change

## Implementation Priority Order
1. Pure display components (no dependencies)
2. Simple splits (single button extraction)
3. Complex splits (multiple interactive elements)
4. Components with external dependencies

## Detailed Analysis

### Component: `app/account/update-password/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin-old/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin-old/setup/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin-old/templates/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/analytics/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/business/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/AdminHeader.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/AdminProvider.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [x] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/AdminSidebar.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/AlertsOverviewClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/DashboardStatsClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/RecentActivityClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/components/SystemHealthClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/listings/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/reports/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/users/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/admin/wanted-requests/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/careers/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/admin/AlertsWidget.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/admin/CleanupMonitoringWidget.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/admin/SecurityStatusWidget.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/admin/SystemHealthWidget.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/AuthModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/EmailAuthForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/ForgotPasswordFlow.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/GoogleOneTapProvider.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/GoogleSignInButton.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/OTPInput.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/OTPVerification.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/PhoneAuthForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/PhoneNumberInput.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/SimpleForgotPassword.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/StreamlinedSignup.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/auth/UsernameCreation.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/AuthWrapper.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/bin/BinListingCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/bin/BinMessageCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/bin/BinTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/bin/BinWantedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/CapacitorInitializer.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/CloudinaryTestUpload.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ContactProfile.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ContactProfileOriginal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/EmailVerificationAlert.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ErrorBoundary.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/FavoriteButton.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/favorites/FavoriteAdCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/favorites/FavoritesTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/favorites/FavoriteWantedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/filters/MobileFilterSheet.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/filters/MobileWantedFilterSheet.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/Footer.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/GoogleOneTap.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/header.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/hero/HeroFiltersSection.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/hero/HeroSearchBar.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/hero/QuickFilters.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/hero/SimpleLocationFilter.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/hero/SmartLocationSearch.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ImageLightbox.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ImageUploadWithCompression.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/BoostedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/FairShareIndicator.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/FeaturedAdCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/GoldFeaturedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/ListingActions.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/ListingCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/ListingStatusBadge.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: CONVERT TO SERVER

**Reasoning**: No client-only hooks or browser APIs detected; component is a pure display element.

**Recommendation**:
- Remove 'use client', ensure no client features used

### Component: `app/components/listings/ListingStatusMessage.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: CONVERT TO SERVER

**Reasoning**: No client-only hooks or browser APIs detected; component is a pure display element.

**Recommendation**:
- Remove 'use client', ensure no client features used

### Component: `app/components/listings/PremiumCardSelector.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/listings/PromotedListingsSection.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/PromotionBadges.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: CONVERT TO SERVER

**Reasoning**: No client-only hooks or browser APIs detected; component is a pure display element.

**Recommendation**:
- Remove 'use client', ensure no client features used

### Component: `app/components/listings/RegularAdCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/TopSpotCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/listings/UrgentListingCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/LocationFilter.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messages/ConversationView.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messages/MessagePreview.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messages/MessagesList.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: SPLIT COMPONENT

**Reasoning**: Lightweight interactivity detected (event handlers without local state). Consider extracting handlers into a client sub-component.

**Recommendation**:
- Extract interactive parts into separate Client Component

**Split Strategy** (if applicable):
```tsx
// BEFORE (all client)
'use client'
export function ExampleComponent(props) {
  return <InteractiveSubcomponent {...props} />;
}

// AFTER (split server + client)
// ExampleComponent.tsx (Server Component - no directive)
import { InteractiveSubcomponent } from './InteractiveSubcomponent';

export function ExampleComponent(props) {
  return <InteractiveSubcomponent {...props} />;
}

'use client'
export function InteractiveSubcomponent(props) {
  return <button onClick={props.onClick}>Action</button>;
}
```

### Component: `app/components/messages/MessagesTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messaging/EnhancedConversationModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messaging/OfferCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/messaging/OfferModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/mobile/MobileProfileHeader.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/mobile/MobileProfileTabs.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/mobile/ProfileMenu.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/modals/ContactModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/modals/ConversationModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/modals/DeleteAccountModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/ImageSizeError.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/NotificationCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/NotificationsTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/Toast.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/ToastContainer.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/notifications/useToast.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/NotificationSystem.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [x] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/payments/PaymentModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/PhoneVerificationModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/profile/BusinessPageTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/profile/BusinessProfileManagement.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/profile/BusinessProfileRecovery.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/profile/CreateBusinessProfile.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/profile/ProfileSetup.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/ReportModal.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/DeleteAccountCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/EmailSecurityCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/PasswordSecurityCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/SecuritySettingsCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/SecurityTab.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/SessionsCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/security/TwoFactorCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/AdditionalInformationSection.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/BaseVehicleForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/BicycleForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/BoatForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/BusForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/CarForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/DescriptionGenerator.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/FeaturesSection.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/LorryForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/MotorcycleForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/PlantMachineryForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/PricingSection.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/ThreeWheelerForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/TractorForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/VanForm.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/vehicle-forms/VehicleFormFactory.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: No direct client-only APIs detected, but component name suggests interactive responsibilities; manual review recommended before conversion.

**Recommendation**:
- No change needed

### Component: `app/components/WantedRequestFavoriteButton.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/wantedRequests/RegularWantedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/wantedRequests/UrgentWantedCard.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/wantedRequests/WantedRequestActions.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/components/wantedRequests/WantedRequestStatusBadge.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: CONVERT TO SERVER

**Reasoning**: No client-only hooks or browser APIs detected; component is a pure display element.

**Recommendation**:
- Remove 'use client', ensure no client features used

### Component: `app/components/wantedRequests/WantedRequestStatusMessage.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: CONVERT TO SERVER

**Reasoning**: No client-only hooks or browser APIs detected; component is a pure display element.

**Recommendation**:
- Remove 'use client', ensure no client features used

### Component: `app/contexts/AuthContext.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [x] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/faq/FAQClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/forgot-password/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/hooks/useAuthWithRedirect.ts`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/hooks/useSessionManager.ts`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/listings/_components/ListingsPageClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/listings/[id]/ListingDetailClient.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/post/boost/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/post/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/post/paid-features/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/account/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/bin/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/business/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/favorites/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/listings/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/messages/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/notifications/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/security/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/setup/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/profile/wanted/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/reset-password/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/security/recaptcha-test/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/test-auth/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/[id]/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/components/MatchNotificationBanner.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [ ] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/edit/[id]/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [ ] useState/useReducer
- [x] useEffect/useLayoutEffect
- [ ] Event handlers (onClick, onChange, etc.)
- [ ] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [ ] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/payment/[requestId]/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/post/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [x] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed

### Component: `app/wanted/search/page.tsx`

**Current Status**: 'use client' directive present

**Features Detected**:
- [x] useState/useReducer
- [x] useEffect/useLayoutEffect
- [x] Event handlers (onClick, onChange, etc.)
- [x] Browser APIs (window, localStorage, etc.)
- [ ] useRef with DOM manipulation
- [x] Third-party client libraries
- [ ] Client-only context consumption

**Verdict**: KEEP CLIENT

**Reasoning**: Uses client-only features that require the component to remain a Client Component.

**Recommendation**:
- No change needed
