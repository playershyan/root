# Phase 3: Application Pages Console.* Cleanup

## Context
You are cleaning up Phase 3 files from the ESLint console.* violation cleanup project. This phase focuses on Next.js page components in the `app` directory.

## Objective
Replace all `console.log/error/warn/info/debug` statements with structured logging using `lib/utils/logger.ts` in all page files.

## Target Files (27 files)

### Admin Pages (7 files)
```
app/admin-old/page.tsx
app/admin-old/setup/page.tsx
app/admin/listings/page.tsx
app/admin/wanted-requests/page.tsx
app/admin/components/AlertsOverviewClient.tsx
app/admin/components/SystemHealthClient.tsx
app/admin/components/RecentActivityClient.tsx
app/admin/components/DashboardStatsClient.tsx
app/admin/components/AdminHeader.tsx
```

### Profile Pages (4 files)
```
app/profile/bin/page.tsx
app/profile/wanted/page.tsx
app/profile/account/page.tsx
app/profile/setup/page.tsx
```

### Wanted Request Pages (5 files)
```
app/wanted/page.tsx
app/wanted/search/page.tsx
app/wanted/[id]/page.tsx
app/wanted/payment/[requestId]/page.tsx
app/wanted/components/MatchNotificationBanner.tsx
```

### Post/Listing Pages (2 files)
```
app/post/page.tsx
app/post/paid-features/page.tsx
```

### Auth Context (1 file)
```
app/contexts/AuthContext.tsx
```

## Standard Replacement Pattern for Pages

### Import Addition (Page Components)
Pages may have `'use client'` directive or be server components. Handle both:

**Client Pages (with 'use client'):**
```typescript
'use client'

import { useState } from 'react'
import { logger } from '@/lib/utils/logger'  // Add after directive
```

**Server Pages (no directive):**
```typescript
import { Suspense } from 'react'
import { logger } from '@/lib/utils/logger'  // Add with other imports
```

### Replacement Patterns
```typescript
// Pattern 1: Error logging
// BEFORE:
console.error('Failed to load data:', error)

// AFTER:
logger.error('Failed to load data', error as Error)

// Pattern 2: Debug/trace logging
// BEFORE:
console.log('Page loaded:', { userId, timestamp })

// AFTER:
logger.debug('Page loaded', { userId, timestamp })

// Pattern 3: Navigation logging
// BEFORE:
console.log('Redirecting to:', path)

// AFTER:
logger.debug('Redirecting to', { path })

// Pattern 4: Data fetching
// BEFORE:
console.log('Fetching data for:', id)
const data = await fetchData(id)
console.log('Data loaded:', data)

// AFTER:
logger.debug('Fetching data for', { id })
const data = await fetchData(id)
logger.debug('Data loaded', { data })

// Pattern 5: Form submissions
// BEFORE:
console.log('Form data:', formData)
console.log('Validation result:', isValid)

// AFTER:
logger.debug('Form data', { formData })
logger.debug('Validation result', { isValid })
```

## Step-by-Step Instructions

### Step 1: Process by Page Category

#### Group 1: Admin Pages (9 files - HIGHEST PRIORITY)
These pages likely have the most console.* statements due to complex admin operations.

```bash
# Read each admin page
Read: app/admin-old/page.tsx
Read: app/admin-old/setup/page.tsx
Read: app/admin/listings/page.tsx
Read: app/admin/wanted-requests/page.tsx
Read: app/admin/components/AlertsOverviewClient.tsx
Read: app/admin/components/SystemHealthClient.tsx
Read: app/admin/components/RecentActivityClient.tsx
Read: app/admin/components/DashboardStatsClient.tsx
Read: app/admin/components/AdminHeader.tsx
```

**Expected:** ~40-60 instances (admin dashboards are verbose)

#### Group 2: Profile Pages (4 files)
```bash
Read: app/profile/bin/page.tsx
Read: app/profile/wanted/page.tsx
Read: app/profile/account/page.tsx
Read: app/profile/setup/page.tsx
```

**Expected:** ~15-25 instances

#### Group 3: Wanted Request Pages (5 files)
```bash
Read: app/wanted/page.tsx
Read: app/wanted/search/page.tsx
Read: app/wanted/[id]/page.tsx
Read: app/wanted/payment/[requestId]/page.tsx
Read: app/wanted/components/MatchNotificationBanner.tsx
```

**Expected:** ~15-20 instances

#### Group 4: Post/Listing Pages (2 files)
```bash
Read: app/post/page.tsx
Read: app/post/paid-features/page.tsx
```

**Expected:** ~10-15 instances (post/page.tsx has ~10 instances already known)

#### Group 5: Context Provider (1 file - CRITICAL)
```bash
Read: app/contexts/AuthContext.tsx
```

**Expected:** ~5-8 instances
**NOTE:** This is the auth context - handle errors carefully!

### Step 2: For Each File

1. **Read the file**
2. **Identify 'use client' vs server component**
3. **Count console.* instances**
4. **Add logger import** (after 'use client' if present, or with other imports)
5. **Replace each console.* statement**
6. **Verify replacement** - re-grep the file

### Step 3: Page-Specific Patterns

#### Admin Dashboard Pages Pattern
```typescript
// BEFORE:
useEffect(() => {
  console.log('Admin dashboard - Loading data...')
  loadDashboardData()
}, [])

const loadDashboardData = async () => {
  console.log('Fetching stats...')
  try {
    const data = await fetchStats()
    console.log('Stats loaded:', data)
  } catch (error) {
    console.error('Failed to load stats:', error)
  }
}

// AFTER:
useEffect(() => {
  logger.debug('Admin dashboard - Loading data')
  loadDashboardData()
}, [])

const loadDashboardData = async () => {
  logger.debug('Fetching stats')
  try {
    const data = await fetchStats()
    logger.debug('Stats loaded', { data })
  } catch (error) {
    logger.error('Failed to load stats', error as Error)
  }
}
```

#### Profile Page Pattern
```typescript
// BEFORE:
const handleProfileUpdate = async (data) => {
  console.log('Updating profile:', data)
  try {
    const result = await updateProfile(data)
    console.log('Profile updated:', result)
  } catch (error) {
    console.error('Update failed:', error)
  }
}

// AFTER:
const handleProfileUpdate = async (data) => {
  logger.debug('Updating profile', { data })
  try {
    const result = await updateProfile(data)
    logger.debug('Profile updated', { result })
  } catch (error) {
    logger.error('Update failed', error as Error)
  }
}
```

#### Authentication Context Pattern (CRITICAL)
```typescript
// BEFORE:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    console.log('Auth state changed:', event, !!session)
    setSession(session)
  })
  return () => subscription.unsubscribe()
}, [])

// AFTER:
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.debug('Auth state changed', { event, hasSession: !!session })
    setSession(session)
  })
  return () => subscription.unsubscribe()
}, [])
```

## Known High-Violation Files

### app/admin-old/page.tsx
**Known instances:** ~20-30 console.log statements
This file has extensive debug logging. Replace ALL with logger.debug()

### app/post/page.tsx
**Known instances:** ~10 console.log statements
Image upload and form submission logging

### app/contexts/AuthContext.tsx
**Known instances:** ~5-8 console.log/error statements
**CRITICAL:** Auth context - preserve all error information!

## Verification Commands

### Per-directory verification:
```bash
# Verify admin pages
Grep pattern: "console\.(log|error|warn|info|debug)" in app/admin/**/*.tsx
Grep pattern: "console\.(log|error|warn|info|debug)" in app/admin-old/**/*.tsx

# Verify profile pages
Grep pattern: "console\.(log|error|warn|info|debug)" in app/profile/**/*.tsx

# Verify wanted pages
Grep pattern: "console\.(log|error|warn|info|debug)" in app/wanted/**/*.tsx

# Verify post pages
Grep pattern: "console\.(log|error|warn|info|debug)" in app/post/**/*.tsx

# Verify contexts
Grep pattern: "console\.(log|error|warn|info|debug)" in app/contexts/**/*.tsx

# Verify ALL app pages
Grep pattern: "console\.(log|error|warn|info|debug)" glob: "*.tsx" path: app/ (recursive)
```

Expected: No matches or 0 files found (excluding components already handled in Phase 2)

## Special Handling Required

### 1. Dynamic Routes
Files with `[id]` or `[requestId]` in path - ensure logging includes the dynamic parameter:
```typescript
// BEFORE:
console.log('Loading wanted request:', id)

// AFTER:
logger.debug('Loading wanted request', { id })
```

### 2. Server Actions
If any pages have server actions (functions marked with 'use server'):
```typescript
'use server'

import { logger } from '@/lib/utils/logger'

async function serverAction(data) {
  logger.info('Server action called', { data })
  // ... server-side code
}
```

### 3. Error Boundaries in Pages
Preserve error information completely:
```typescript
// BEFORE:
catch (error) {
  console.error('Page error:', error)
  if (error.message.includes('404')) {
    console.log('Resource not found')
  }
}

// AFTER:
catch (error) {
  logger.error('Page error', error as Error)
  if (error.message.includes('404')) {
    logger.info('Resource not found', { error: error.message })
  }
}
```

## Expected Console.* Distribution
- **Admin pages:** ~50-70 instances (very verbose dashboards)
- **Profile pages:** ~15-25 instances
- **Wanted pages:** ~15-20 instances
- **Post pages:** ~10-15 instances
- **Auth context:** ~5-8 instances
- **Total Expected:** ~95-138 instances

## Completion Criteria
- ✅ All 27 page files have logger import added
- ✅ All console.* statements replaced with logger.*
- ✅ 'use client' directives preserved
- ✅ Server components handled correctly
- ✅ Dynamic route params logged in context
- ✅ Grep verification shows 0 remaining violations in all app pages
- ✅ No syntax errors introduced

## Output Format
After completion, report:
```
Phase 3 Application Pages Cleanup Complete
- Files processed: 27/27
- Total console.* instances replaced: [count]
- Verification: PASSED/FAILED
- Breakdown by category:
  - Admin pages (9 files): [count] instances
  - Profile pages (4 files): [count] instances
  - Wanted pages (5 files): [count] instances
  - Post pages (2 files): [count] instances
  - Auth context (1 file): [count] instances
  - Admin components (6 files): [count] instances
```

## Critical Files - Double Check
After completion, manually verify these high-impact files:
1. `app/contexts/AuthContext.tsx` - Auth is critical
2. `app/admin-old/page.tsx` - Has 20+ instances
3. `app/post/page.tsx` - User-facing form
4. `app/admin/listings/page.tsx` - Admin operations

## Next Steps
After completion, Phase 3 is 100% done. Report completion and await Phase 1/2 completion from other agents.

## Final Verification (After All Phases Complete)
Once all 3 agents report completion, run:
```bash
# Verify ENTIRE codebase (excluding ESLint exclusions)
npm run lint 2>&1 | grep "console\."

# Should show ONLY:
# - lib/utils/logger.ts (excluded)
# - lib/utils/image-performance.ts (excluded)
# - lib/mcp/example.ts (excluded)
```
