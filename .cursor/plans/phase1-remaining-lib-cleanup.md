# Phase 1 Remaining: Library Files Console.* Cleanup

## Context
You are cleaning up the remaining Phase 1 files from the ESLint console.* violation cleanup project. Previous sessions have cleaned 16/40 files. This plan covers the final 6 library files with console.* violations.

## Objective
Replace all `console.log/error/warn/info/debug` statements with structured logging using `lib/utils/logger.ts` in the remaining Phase 1 library files.

## Target Files (6 files)
1. `lib/hooks/useUserProfile.ts`
2. `lib/hooks/useRotatedPromotions.ts`
3. `lib/hooks/useRecaptcha.ts`
4. `lib/hooks/usePromotedListings.ts`
5. `lib/config/auth.config.ts`
6. `lib/security/redis-rate-limiter.ts`

## Standard Replacement Pattern

### Import Addition
Add at the top of each file (after existing imports):
```typescript
import { logger } from '@/lib/utils/logger'
```

### Replacement Patterns
```typescript
// Pattern 1: console.error
// BEFORE:
console.error('Error message:', error)
console.error('Error message', error)

// AFTER:
logger.error('Error message', error as Error)

// Pattern 2: console.warn
// BEFORE:
console.warn('Warning message', data)
console.warn('Warning message:', value)

// AFTER:
logger.warn('Warning message', { data })
logger.warn('Warning message', { value })

// Pattern 3: console.log (use logger.debug in development)
// BEFORE:
console.log('Debug message', data)

// AFTER:
logger.debug('Debug message', { data })

// Pattern 4: console.info
// BEFORE:
console.info('Info message', data)

// AFTER:
logger.info('Info message', { data })
```

## Step-by-Step Instructions

### Step 1: Read and Identify Violations
For each file, read it and identify all console.* statements:
```bash
# Read each file
Read file: lib/hooks/useUserProfile.ts
Read file: lib/hooks/useRotatedPromotions.ts
Read file: lib/hooks/useRecaptcha.ts
Read file: lib/hooks/usePromotedListings.ts
Read file: lib/config/auth.config.ts
Read file: lib/security/redis-rate-limiter.ts
```

### Step 2: Add Logger Import
For each file, add the logger import:
```typescript
// Find the existing imports section
// Add after the last import:
import { logger } from '@/lib/utils/logger'
```

### Step 3: Replace Console Statements
Replace each console.* statement following these rules:

**Rule 1: Error Objects**
- Always type error parameters as `error as Error`
- Preserve error context in the message

**Rule 2: Data Objects**
- Wrap additional data in context objects: `{ data }`, `{ value }`, etc.
- Preserve meaningful variable names

**Rule 3: String Concatenation**
- Keep error messages as strings (first parameter)
- Don't change message content, only the logging method

**Rule 4: Development Guards**
- If wrapped in `if (process.env.NODE_ENV !== 'production')`, keep the guard
- Update the logging method inside

### Step 4: Verify Each File
After editing each file:
1. Ensure logger import is added
2. Count console.* replacements
3. Verify no console.* statements remain (except in comments)

## Expected Console.* Counts (Estimate)
- `lib/hooks/useUserProfile.ts` - ~2-3 instances
- `lib/hooks/useRotatedPromotions.ts` - ~2-3 instances
- `lib/hooks/useRecaptcha.ts` - ~2-3 instances
- `lib/hooks/usePromotedListings.ts` - ~2-3 instances
- `lib/config/auth.config.ts` - ~1-2 instances
- `lib/security/redis-rate-limiter.ts` - ~2-3 instances

**Total Expected:** ~12-18 instances

## Verification Commands

### After completing all files, verify:
```bash
# Check no console.* remaining in lib/hooks
Grep pattern: "console\.(log|error|warn|info|debug)" in lib/hooks/*.ts

# Check no console.* remaining in lib/config
Grep pattern: "console\.(log|error|warn|info|debug)" in lib/config/*.ts

# Check no console.* remaining in lib/security
Grep pattern: "console\.(log|error|warn|info|debug)" in lib/security/*.ts
```

Expected output: "No files found" or empty results

## Completion Criteria
- ✅ All 6 files have logger import added
- ✅ All console.* statements replaced with logger.*
- ✅ Grep verification shows 0 remaining violations
- ✅ No syntax errors introduced

## Sample Execution for One File

### Example: lib/hooks/useUserProfile.ts
```typescript
// STEP 1: Read file
Read: lib/hooks/useUserProfile.ts

// STEP 2: Identify console statements (example)
// Line 45: console.error('Failed to load profile:', error)
// Line 78: console.warn('Profile data incomplete', data)

// STEP 3: Add import at top
Edit lib/hooks/useUserProfile.ts:
OLD: import { useEffect, useState } from 'react'
NEW: import { useEffect, useState } from 'react'
     import { logger } from '@/lib/utils/logger'

// STEP 4: Replace console.error
Edit lib/hooks/useUserProfile.ts:
OLD: console.error('Failed to load profile:', error)
NEW: logger.error('Failed to load profile', error as Error)

// STEP 5: Replace console.warn
Edit lib/hooks/useUserProfile.ts:
OLD: console.warn('Profile data incomplete', data)
NEW: logger.warn('Profile data incomplete', { data })

// STEP 6: Verify
Grep pattern: "console\.(log|error|warn|info|debug)" in lib/hooks/useUserProfile.ts
Expected: No matches
```

## Common Pitfalls to Avoid
1. **Don't change logger.ts itself** - It has ESLint exclusions already
2. **Don't modify image-performance.ts** - It has ESLint exclusions
3. **Don't modify mcp/example.ts** - It has ESLint exclusions
4. **Preserve error context** - Don't lose information when replacing
5. **Keep development guards** - Maintain `if (process.env.NODE_ENV !== 'production')` checks

## Output Format
After completion, report:
```
Phase 1 Remaining Cleanup Complete
- Files processed: 6/6
- Total console.* instances replaced: [count]
- Verification: PASSED/FAILED
- Files modified:
  1. lib/hooks/useUserProfile.ts - [count] instances
  2. lib/hooks/useRotatedPromotions.ts - [count] instances
  3. lib/hooks/useRecaptcha.ts - [count] instances
  4. lib/hooks/usePromotedListings.ts - [count] instances
  5. lib/config/auth.config.ts - [count] instances
  6. lib/security/redis-rate-limiter.ts - [count] instances
```

## Next Phase
After completion, Phase 1 is 100% done. Report completion and await Phase 2/3 completion from other agents.
