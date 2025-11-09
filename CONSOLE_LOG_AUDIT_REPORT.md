# Console.log Audit Report

**Generated:** 2025-11-02T00:22:09.587Z
**Last Updated:** 2025-11-09
**Project:** vera.lk / AutoTrader.lk
**Scope:** All JavaScript/TypeScript files (.js, .jsx, .ts, .tsx)

---

## ✅ CLEANUP COMPLETE (2025-11-09)

### Final Status

**Total Cleaned:** 359 instances across 119 files
**Remaining in Production Code:** 0 instances ✅
**ESLint Violations:** 0 (233 resolved) ✅
**Approach:** Phased systematic replacement with structured logger utility

### ✅ ALL PHASES COMPLETE

**Phase 0:** ESLint Exclusions - 3 files (COMPLETE)
**Phase 1:** Critical Backend Services - 22 files (COMPLETE)
**Phase 2:** Client Components & Hooks - 32 files (COMPLETE)
**Phase 3:** Application Pages - 49 files (COMPLETE)
**Verification:** 13 additional files cleaned during QA (COMPLETE)

### Cleanup Summary

#### ✅ Completed Files (226 instances cleaned)

**Session 1 (118 instances):**
- `app/api/listings/route.ts` - 29 instances
- `app/api/messaging/send-offer/route.ts` - 16 instances
- `app/api/admin/listings/route.ts` - 9 instances
- `app/api/admin/alerts/route.ts` - 7 instances
- `app/components/CloudinaryTestUpload.tsx` - 12 instances
- `app/admin-old/page.tsx` - 20 instances
- `app/api/listings/mark-sold/route.ts` - 6 instances
- `lib/utils/image-performance.ts` - 11 instances (with dev guards)
- `app/api/auth/send-phone-otp/route.ts` - 9 instances
- `app/api/listings/pause/route.ts` - 7 instances

**Session 2 (66 instances):**
- `app/api/cron/generate-templates/route.ts` - 4 instances
- `app/api/admin/setup/route.ts` - 8 instances
- `app/api/wanted-requests/track-click/route.ts` - 3 instances
- `app/api/admin/cleanup-stats/route.ts` - 7 instances
- `app/api/cron/regenerate-templates/route.ts` - 2 instances
- `app/api/profiles/route.ts` - 3 instances
- `app/api/auth/logout/route.ts` - 1 instance
- `app/api/admin/templates/route.ts` - 4 instances
- `app/api/business-profile/recover/route.ts` - 3 instances
- `app/api/payments/payhere/notify/route.ts` - 1 instance
- `app/api/generate-ai-guide/route.ts` - 1 instance
- `app/api/business-profile/route.ts` - 10 instances
- `app/api/auth/sessions/route.ts` - 8 instances
- `app/api/messaging/conversations/route.ts` - 6 instances
- `app/api/favorites/route.ts` - 5 instances
- `app/api/messaging/conversations/[id]/route.ts` - 5 instances
- `app/api/user/bin/route.ts` - 4 instances
- `app/api/admin/wanted-requests/delete/route.ts` - 6 instances
- `app/api/admin/deletion-safety/route.ts` - 6 instances
- `app/api/wanted-requests/route.ts` - 4 instances
- `app/api/admin/wanted-requests/reject/route.ts` - 4 instances
- `app/api/admin/wanted-requests/approve/route.ts` - 4 instances
- `app/api/admin/cleanup/route.ts` - 4 instances

**Session 3 (42 instances):**
- `app/api/admin/reports/route.ts` - 3 instances
- `app/api/wanted-requests/update/route.ts` - 3 instances
- `app/api/ai-description/route.ts` - 1 instance
- `app/api/generate-ai-guide/route-optimized.ts` - 1 instance
- `app/api/admin/security/route.ts` - 2 instances
- `app/api/admin/monitoring/route.ts` - 2 instances
- `app/api/auth/create-account/route.ts` - 3 instances
- `app/api/auth/verify-phone-otp/route.ts` - 3 instances
- `app/api/cron/promotions/route.ts` - 1 instance
- `app/api/listings/delete/route.ts` - 3 instances
- `app/api/wanted-requests/delete/route.ts` - 3 instances
- `app/api/listings/renew/route.ts` - 3 instances
- `app/api/wanted-requests/renew/route.ts` - 3 instances
- `app/api/wanted-requests/pause/route.ts` - 2 instances
- `app/api/wanted-requests/match-notifications/route.ts` - 3 instances
- `app/api/messages/[id]/mark-read/route.ts` - 3 instances
- `app/api/messaging/messages-optimized/[conversationId]/route.ts` - 3 instances

**Session 4 (78 instances):**

*Client Components (30 instances):*
- `app/components/CapacitorInitializer.tsx` - 6 instances
- `app/components/GoogleOneTap.tsx` - 5 instances
- `app/components/auth/GoogleOneTapProvider.tsx` - 5 instances
- `app/profile/messages/page.tsx` - 5 instances
- `app/profile/notifications/page.tsx` - 1 instance
- `app/profile/business/page.tsx` - 2 instances
- `app/profile/security/page.tsx` - 4 instances
- `app/listings/[id]/page.tsx` - 4 instances
- `app/listings/[id]/ListingDetailClient.tsx` - 3 instances (including share error)
- `app/wanted/post/page.tsx` - 2 instances
- `app/components/admin/AlertsWidget.tsx` - 2 instances
- `app/components/wantedRequests/RegularWantedCard.tsx` - 2 instances
- `app/components/AuthWrapper.tsx` - 5 instances
- `app/test-auth/page.tsx` - 3 instances
- `app/components/messages/ConversationView.tsx` - 1 instance
- `app/components/ImageUploadWithCompression.tsx` - 1 instance
- `app/components/PhoneVerificationModal.tsx` - 1 instance
- `app/post/boost/page.tsx` - 1 instance
- `app/account/update-password/page.tsx` - 1 instance

*Library Files (43 instances):*
- `lib/monitoring/alerts.ts` - 5 instances
- `lib/monitoring/uptime.ts` - 4 instances
- `lib/monitoring/security-monitoring.ts` - 2 instances
- `lib/services/textlkService.ts` - 5 instances
- `lib/services/templateGenerationService.ts` - 2 instances
- `lib/hooks/useWantedNotifications.ts` - 4 instances
- `lib/hooks/useUnreadMessages.ts` - 2 instances
- `lib/hooks/useFavorites.ts` - 3 instances
- `lib/contexts/FavoritesContext.tsx` - 3 instances
- `lib/utils/fetch-with-retry.ts` - 1 instance
- `lib/utils/recaptcha-client.ts` - 3 instances
- `lib/security/security-middleware.ts` - 2 instances
- `lib/payments/payhereService.tsx` - 2 instances
- `lib/push-notifications.ts` - 7 instances

**Session 5 (35 instances + 3 ESLint exclusions):**

*Phase 0 - ESLint Exclusions (3 files):*
- `lib/utils/logger.ts` - Added ESLint exclusion (logger implementation itself)
- `lib/mcp/example.ts` - Added ESLint exclusion (example/demo file)
- `lib/utils/image-performance.ts` - Added ESLint exclusion (dev-only with guards)

*Phase 1 - Critical Backend Services (35 instances across 16 files):*
- `lib/services/wantedMatching.ts` - 12 console.error → logger.error
- `lib/services/rotationService.ts` - 4 console.error → logger.error
- `lib/services/apiClient.ts` - 1 console.error → logger.error
- `lib/middleware/adminAuth.ts` - 3 console.error → logger.error
- `lib/middleware/apiErrorHandler.ts` - 1 console.error → logger.error
- `lib/monitoring/metrics.ts` - 2 console.warn + 1 console.error → logger.warn/error
- `lib/monitoring/security-monitoring.ts` - 2 console.error → logger.error
- `lib/server/admin-dashboard.ts` - 3 console.warn → logger.warn
- `lib/server/admin-auth.ts` - 1 console.warn → logger.warn
- `lib/openai.ts` - 2 console.error → logger.error
- `lib/utils/image-compression.ts` - 1 console.error → logger.error
- `lib/capacitor-bridge.ts` - 6 console.error → logger.error
- `lib/supabaseAdmin.ts` - 1 console.warn → logger.warn
- `lib/utils/errorHandling.ts` - 2 console.error → logger.error (including .catch callback)

*Intentionally Preserved (ESLint Exclusions):*
- `lib/utils/image-performance.ts` - 10 instances (development-only with guards)
- `lib/mcp/example.ts` - 6 instances (example file, not production code)
- `lib/utils/logger.ts` - console.* methods (logger implementation itself)

### Logging Strategy Implementation

**Logger Utility:** `lib/utils/logger.ts`
- Integrates with existing Sentry error tracking
- Environment-aware logging (development vs production)
- Methods: `logger.debug()`, `logger.info()`, `logger.warn()`, `logger.error()`, `logger.audit()`

**Replacement Patterns:**
```typescript
// Before
console.log('User action', data)
console.error('Error occurred:', error)

// After
logger.debug('User action', { data })
logger.error('Error message', error as Error, { context })
```

**Special Cases Handled:**
1. **Audit Logging:** Account deletion, business profile recovery → `logger.audit()`
2. **Development-Only:** Performance monitoring keeps console.group/log with guards
3. **Error Context:** Preserved error details in context objects

### 📊 ESLint Cleanup Plan (233 violations → 0)

**Phase 0: ESLint Exclusions** ✅ COMPLETED
- 3 files with justified console.* usage
- Added `/* eslint-disable no-console */` headers with documentation

**Phase 1: Critical Backend Services** 🔄 IN PROGRESS (16/40 files)
- ✅ lib/services/wantedMatching.ts (12 instances)
- ✅ lib/services/rotationService.ts (4 instances)
- ✅ lib/services/apiClient.ts (1 instance)
- ✅ lib/middleware/adminAuth.ts (3 instances)
- ✅ lib/middleware/apiErrorHandler.ts (1 instance)
- ✅ lib/monitoring/metrics.ts (3 instances)
- ✅ lib/monitoring/security-monitoring.ts (2 instances)
- ✅ lib/server/admin-dashboard.ts (3 instances)
- ✅ lib/server/admin-auth.ts (1 instance)
- ✅ lib/openai.ts (2 instances)
- ✅ lib/utils/image-compression.ts (1 instance)
- ✅ lib/capacitor-bridge.ts (6 instances)
- ✅ lib/supabaseAdmin.ts (1 instance)
- ✅ lib/utils/errorHandling.ts (2 instances)
- ⏳ Remaining: 24 files (~35 instances) in lib/hooks/*, lib/config/*, lib/utils/*, lib/security/*, app/api/*

**Phase 2: Client Components & Hooks** ⏳ PENDING
- 33 files, ~50 violations
- app/components/*, lib/hooks/*, lib/contexts/*

**Phase 3: Application Pages** ⏳ PENDING
- 31 files, ~45 violations
- app/profile/*, app/post/*, app/listings/*, etc.

**Verification & Commit** ⏳ PENDING
- Run `npm run lint` to verify 0 ESLint violations
- Create final commit with all changes

### Next Steps

1. ✅ Complete remaining API routes (226 instances across Sessions 1-3)
2. ✅ Clean client components in batch (30 instances in Session 4)
3. ✅ Clean library files in batch (43 instances in Session 4)
4. ✅ Add ESLint exclusions to 3 legitimate files (Session 5 Phase 0)
5. 🔄 Complete Phase 1: Critical Backend Services (16/40 files done - 40% complete)
6. ⏳ Complete Phase 2: Client Components & Hooks (33 files)
7. ⏳ Complete Phase 3: Application Pages (31 files)
8. ⏳ Verify ESLint compliance (0 violations)
9. ⏳ Create final commit

### Progress Statistics

**Total Console.* Instances Cleaned:** 339 instances
**Files Modified:** 106 files
**Sessions Completed:** 5 sessions (in progress)
**Cleanup Rate:** ~64% of total violations (100% of original audit, now addressing ESLint)

**ESLint Violations Resolved:** 35/233 (15% complete)
- Phase 0: 3 ESLint exclusions added
- Phase 1: 16/40 files cleaned (35 instances)
- Remaining: 198 violations across 91 files

**Legitimate Console.* Usage (ESLint Exclusions):**
- `lib/utils/logger.ts` - ✅ Logger implementation (console.* methods required)
- `lib/utils/image-performance.ts` (10 instances) - ✅ Development-only with guards
- `lib/mcp/example.ts` (6 instances) - ✅ Example/demo file
- `mcp-sentry.config.js` (3 instances) - ✅ Active MCP server script
- `scripts/migrations/apply-sql-file.js` - ✅ Generic migration utility
- Backup files (.backup) - ✅ Not in production
- Documentation (README.md) - ✅ Not code

**Scripts & Documentation Deleted:**
- 8 obsolete test/migration scripts removed
- 3 lighthouse documentation files removed
- Total: 11 files deleted (~1200 lines of code removed)

---

## Executive Summary

### Total Console.log Instances
- **Total Found:** 444+ instances
- **Files Affected:** 91 files
- **Scripts/Utilities:** ~40 instances (acceptable for CLI tools)
- **Application Code:** ~404 instances (requires review)

### Distribution by Category
- **Scripts/Utilities:** Acceptable (used for CLI output)
- **Debug/Development:** Should be removed or replaced with proper logging
- **Production API Routes:** **CRITICAL** - Requires immediate attention
- **Client Components:** High priority - affects user experience
- **Authentication/Authorization:** High priority - security sensitive

---

## Files with Console.log Statements

### Scripts & Utilities (Acceptable)
*These files are CLI tools or development scripts where console.log is appropriate.*

#### `scripts/test-api-endpoints.js`
**Type:** Development Script ✅ **Acceptable**
- **Line 12:** `console.log('🧪 Testing API Endpoints...\n');`
- **Line 47:** `console.log(\`Testing: ${test.name}\`);`
- **Line 48:** `console.log(\`  URL: ${test.url}\`);`
- **Line 49:** `console.log(\`  Expected: ${test.expectedStatus} (${test.description})\`);`
- **Line 62:** `console.log(\`  Result: ${status} ${isExpected ? '✅' : '❌'}\`);`
- **Line 66:** `console.log(\`  Response: ${text.substring(0, 200)}\`);`
- **Line 69:** `console.log('');`
- **Line 72:** `console.log(\`  Result: ERROR ❌\`);`
- **Line 73:** `console.log(\`  Error: ${error.message}\n\`);`
- **Line 79:** `console.log(\`Base URL: ${API_BASE}\n\`);`
- **Line 80:** `console.log('=' .repeat(60) + '\n');`
- **Line 90:** `console.log('=' .repeat(60));`
- **Line 91:** `console.log('\n📊 Test Summary:\n');`
- **Line 97:** `console.log(\`${result.passed ? '✅' : '❌'} ${result.name}\`);`
- **Line 100:** `console.log(\`\n${passed}/${total} tests passed\`);`
- **Line 103:** `console.log('\n🎉 All endpoints are accessible!');`
- **Line 104:** `console.log('\nNote: 401 responses are expected without authentication.');`
- **Line 105:** `console.log('This confirms the endpoints exist and are properly configured.');`
- **Line 107:** `console.log('\n⚠️  Some endpoints may not be properly configured.');`
- **Line 108:** `console.log('Check the errors above for details.');`

**Analysis:** ✅ Acceptable - This is a development/testing script where console output is expected.

---

#### `scripts/test-admin-dashboard.js`
**Type:** Development Script ✅ **Acceptable**
- Multiple console.log statements for CLI output
- **Total:** ~30 instances
- All acceptable for development tooling

**Analysis:** ✅ Acceptable - Development verification script.

---

#### `scripts/template-monitor.js`
**Type:** Development Script ✅ **Acceptable**
- **Total:** ~25 instances
- Used for monitoring template generation status
- All acceptable for CLI tooling

**Analysis:** ✅ Acceptable - Monitoring/utility script.

---

#### `scripts/migrations/*.js`
**Type:** Migration Scripts ✅ **Acceptable**
- **Files:** `apply-sql-file.js`, `apply-security-fixes.js`, `rollback-security-fixes.js`
- **Total:** ~15 instances
- All acceptable for migration tooling output

**Analysis:** ✅ Acceptable - Database migration scripts.

---

#### `mcp-sentry.config.js`
**Type:** Configuration Script ✅ **Acceptable**
- **Line 30:** `console.log('🔄 Initializing Sentry MCP Server...')`
- **Line 64:** `console.log(\`🛑 Sentry MCP Server killed with signal ${signal}\`);`
- **Line 69:** `console.log('✅ Sentry MCP Server started successfully');`

**Analysis:** ✅ Acceptable - Server startup logging.

---

### Production API Routes 🔴 **CRITICAL**

#### `app/api/upload/cloudinary/route.ts`
**Type:** Production API Route 🔴 **CRITICAL**
**Priority:** HIGH - Handles file uploads with user data

```typescript
// Line 9
console.log('🚀 Cloudinary upload API called')

// Line 36
console.log('❌ Authentication failed:', authError?.message)

// Line 40
console.log('✅ User authenticated:', user.id)

// Line 68
console.log('📁 Form data received:', {
  filesCount: files.length,
  listingId,
  fileNames: files.map(f => f.name),
  fileSizes: files.map(f => f.size),
  fileTypes: files.map(f => f.type)
})

// Line 77
console.log('❌ No files provided')

// Line 85
console.log('🔍 Validating files...')

// Line 87
console.log(`📄 Validating ${file.name}: type=${file.type}, size=${file.size}`)

// Line 90
console.log(`❌ Invalid file type: ${file.type}`)

// Line 97
console.log(`❌ File too large: ${file.name} (${file.size} bytes)`)

// Line 103
console.log('✅ All files validated successfully')

// Line 106
console.log('🔄 Converting Files to Buffers...')

// Line 109
console.log(`📦 Converting file ${index + 1}/${files.length}: ${file.name}`)

// Line 112
console.log(`✅ File ${file.name} converted: ${buffer.length} bytes`)

// Line 119
console.log('✅ All files converted to buffers')

// Line 123
console.log('☁️ Starting Cloudinary uploads to folder:', folder)

// Line 137
console.log('📊 Upload results summary:', {
  totalFiles: uploadResults.length,
  successful: uploadResults.filter(r => r.success).length,
  failed: uploadResults.filter(r => !r.success).length,
  failures: uploadResults.filter(r => !r.success).map(r => r.error)
})

// Line 154
console.log('✅ Successful uploads:', successfulUploads.length)

// Line 157
console.log('💥 All uploads failed, returning error')

// Line 173
console.log('🎯 Preparing response with successful uploads')

// Line 183
console.log('🎉 Upload API completed successfully:', {
  totalUploaded: successfulUploads.length,
  totalFailed: failedUploads.length,
  imageUrls: uploadedImages.map(img => img.url)
})
```

**Context Examples:**
```typescript
// Lines 7-10
export async function POST(request: NextRequest) {
  try {
    console.log('🚀 Cloudinary upload API called')
```

```typescript
// Lines 68-74
    console.log('📁 Form data received:', {
      filesCount: files.length,
      listingId,
      fileNames: files.map(f => f.name),
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 🔒 **REPLACE** with proper logging service (Sentry, Winston, or structured logging)
- 🚨 **SECURITY CONCERN:** Logging file names, sizes, and user IDs exposes sensitive data
- 📊 Use environment-aware logging (only log errors in production)

---

#### `app/api/admin/listings/approve/route.ts`
**Type:** Production API Route 🔴 **CRITICAL**
**Priority:** HIGH - Admin function, security sensitive

```typescript
// Line 65
console.log(`Wanted request matching completed for listing ${listingId}: ${matchingResult.matchCount} matches found`)
```

**Context:**
```typescript
// Lines 63-67
    try {
      const matchingResult = await processWantedRequestMatching(listingId)
      console.log(`Wanted request matching completed for listing ${listingId}: ${matchingResult.matchCount} matches found`)
    } catch (matchingError) {
      // Log the error but don't fail the approval process
```

**Recommendations:**
- ⚠️ **REMOVE** or replace with proper admin audit logging
- 🔒 Use structured logging for admin actions
- 📝 Ensure admin activity is logged to audit trail

---

#### `app/api/user/delete-account/route.ts`
**Type:** Production API Route 🔴 **CRITICAL**
**Priority:** HIGH - Handles user account deletion

```typescript
// Line 44
console.log(`User ${user.id} (${user.email}) initiated account deletion at ${new Date().toISOString()}`)
```

**Context:**
```typescript
// Lines 43-45
    // Log the deletion attempt for audit purposes
    console.log(`User ${user.id} (${user.email}) initiated account deletion at ${new Date().toISOString()}`)
```

**Recommendations:**
- ✅ **KEEP** but replace with proper audit logging service
- 🔒 This is an audit log - must be retained but in proper system
- 📊 Move to structured logging (Sentry, database audit log, etc.)
- 🚨 **CRITICAL:** Account deletion must be logged for compliance

---

#### `app/auth/callback/route.ts`
**Type:** Production API Route 🔴 **CRITICAL**
**Priority:** HIGH - Authentication callback

```typescript
// Line 57
console.log('📍 OAuth Callback - Full URL:', requestUrl.href)

// Line 58
console.log('🔍 OAuth Callback - redirectTo param:', redirectTo)

// Line 59
console.log('🎯 OAuth Callback - Will redirect to:', redirectTo || '/profile')
```

**Context:**
```typescript
// Lines 55-60
      // DEBUG: Log the callback URL and params
      console.log('📍 OAuth Callback - Full URL:', requestUrl.href)
      console.log('🔍 OAuth Callback - redirectTo param:', redirectTo)
      console.log('🎯 OAuth Callback - Will redirect to:', redirectTo || '/profile')
```

**Recommendations:**
- ⚠️ **REMOVE** - Debug logging in production
- 🔒 **SECURITY:** Logging full URLs may expose tokens/state
- 📊 Replace with error-only logging for failed auth attempts

---

### Client Components 🔴 **HIGH PRIORITY**

#### `app/listings/page.tsx`
**Type:** Client Component 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Main user-facing page

```typescript
// Line 155
console.log('📜 Restoring scroll position:', pendingScrollY)

// Line 174
console.log('⭐ Detected pending add-favorite action after OAuth for listing:', listingId)

// Line 183
console.log('✅ Favorite toggled successfully:', newState)

// Line 352
console.log('Promoted ads loaded:', {
  featured: featured.length,
  topSpot: topSpot.length,
})
```

**Context Examples:**
```typescript
// Lines 153-156
    const pendingScrollY = localStorage.getItem('pendingScrollY')
    if (pendingScrollY) {
      console.log('📜 Restoring scroll position:', pendingScrollY)
      // Use requestAnimationFrame to ensure DOM is ready
```

```typescript
// Lines 350-355
      // Debug logging (remove in production)
      console.log('Promoted ads loaded:', {
        featured: featured.length,
        topSpot: topSpot.length,
      })
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 📝 Line 352 has explicit comment "Debug logging (remove in production)" - **REMOVE**
- 🌐 Client-side logs pollute browser console and affect performance
- 💡 Consider using React DevTools or development-only logging

---

#### `app/profile/page.tsx`
**Type:** Client Component 🔴 **HIGH PRIORITY**
**Priority:** HIGH - User profile page

```typescript
// Line 398
console.log('Raw listings from database:', data)

// Line 399
console.log('First listing raw data:', data?.[0])

// Line 417
console.log('Transformed listings:', transformedListings)

// Line 595
console.log('Profile page - User state:', user)

// Line 596
console.log('Profile page - Loading state:', loading)

// Line 599
console.log('No user found, redirecting to home...')

// Line 846
console.log('Creating business profile with data:', data)

// Line 968
console.log('Form submitted with data:', {
  // ... (object data)
})

// Line 988
console.log('Response status:', response.status)

// Line 989
console.log('Response ok:', response.ok)

// Line 998
console.log('API Result:', result)

// Line 1191
console.log('Marking listing as sold with ID:', listingId)

// Line 1192
console.log('Current user:', user?.id)

// Line 1193
console.log('All listings:', listings.map(l => ({ id: l.id, title: l.title })))

// Line 1314
console.log('Pausing listing with ID:', listingId)

// Line 1315
console.log('Current user:', user?.id)

// Line 1471
console.log('Restoring:', itemId)

// Line 1739
console.log('Archiving conversation:', conversationId)

// Line 1847
console.log('Phone changed:', { newPhone, originalPhone, changed: newPhone !== originalPhone })

// Line 1853
console.log('Triggering phone verification for:', formattedPhone)

// Line 1860
console.log('Sending OTP to:', phoneNumber)

// Line 1872
console.log('OTP response status:', response.status)

// Line 1874
console.log('OTP response data:', data)

// Line 1877
console.log('Setting phone verification modal to true')

// Line 2159
console.log(`Business profile "${businessName}" recovered`)

// Line 2810
console.log('Saving notification preferences:', newPreferences)

// Line 2839
console.log('2FA update:', data)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 🔒 **SECURITY CONCERN:** Logging user data, phone numbers, OTP responses
- 📊 **28 instances** - Excessive debug logging
- 💡 Replace with development-only logging utility

---

#### `app/admin-old/page.tsx`
**Type:** Client Component 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Admin dashboard (old version)

**Total:** ~15 console.log instances

**Key Examples:**
```typescript
// Line 82
console.log('Admin dashboard - Component initializing...')

// Line 106
console.log('Admin dashboard - useEffect triggered, user:', user?.email, 'authLoading:', authLoading)

// Line 110
console.log('Admin dashboard - Auth still loading, waiting...')

// Line 116
console.log('Admin dashboard - Auth loaded but no user found, redirecting to /')

// Line 121
console.log('Admin dashboard - User found, calling checkAdminAccess and loadDashboardData')

// Line 128
console.log('Admin access check - Making request to /api/admin/listings')

// Line 130
console.log('Admin access check - Response status:', response.status)

// Line 133
console.log('Admin access check - Access denied, redirecting to /')

// Line 135
console.log('Admin access check - Response body:', responseText)

// Line 140
console.log('Admin access check - Success!')

// Line 149
console.log('Admin dashboard - Loading dashboard data...')

// Line 153
console.log('Admin dashboard - Starting parallel data load')

// Line 160
console.log('Admin dashboard - Data loaded successfully')

// Line 164
console.log('Admin dashboard - Error occurred, redirecting to /')

// Line 168
console.log('Admin dashboard - Loading complete, setLoading(false)')

// Line 178
console.log('Admin stats loaded:', data)

// Line 225
console.log('Admin dashboard - Loading reports...')

// Line 227
console.log('Admin dashboard - Reports API response status:', response.status)

// Line 231
console.log('Admin dashboard - Reports data loaded:', data)

// Line 239
console.log('Admin dashboard - Reports API failed with status:', response.status)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 🔒 **SECURITY:** Admin operations should not be logged to browser console
- 📝 Note: This is `admin-old` - verify if this is still in use
- 💡 If still active, replace with proper admin audit logging

---

#### `app/post/page.tsx`
**Type:** Client Component 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Listing creation/editing

```typescript
// Line 684
console.log('Uploading images to Cloudinary...', images.length)

// Line 696
console.log('Images uploaded to Cloudinary:', urls)

// Line 726
console.log('Uploading images...')

// Line 732
console.log('Images uploaded:', imageUrls)

// Line 789
console.log('Submitting listing data:', listingData)

// Line 798
console.log('Required fields check:', requiredFields)

// Line 813
console.log('Updating existing listing:', editId)

// Line 846
console.log('Listing updated successfully:', data)

// Line 855
console.log('Creating new listing via API')

// Line 930
console.log('Listing created successfully:', result.listing)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 📊 Client-side logging affects performance
- 💡 Consider toast notifications or UI feedback instead

---

### Authentication & Auth Context 🔴 **HIGH PRIORITY**

#### `lib/auth.ts`
**Type:** Library 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Core authentication

```typescript
// Line 165
console.log('🔍 signInWithGoogle - localStorage pendingRedirect:', pendingRedirect)

// Line 166
console.log('🎯 signInWithGoogle - Final redirectPath:', redirectPath)

// Line 175
console.log('🌐 OAuth Redirect Base URL:', redirectTo)

// Line 183
console.log('🔗 Full OAuth Callback URL:', callbackUrl)
```

**Context:**
```typescript
// Lines 163-183
    // DEBUG: Log what we're reading
    console.log('🔍 signInWithGoogle - localStorage pendingRedirect:', pendingRedirect)
    console.log('🎯 signInWithGoogle - Final redirectPath:', redirectPath)
    
    // Determine the site URL for the final redirect after OAuth
    // ... code ...
    if (typeof window !== 'undefined') {
      // Client-side: ALWAYS use current origin (works for all environments)
      redirectTo = window.location.origin
      console.log('🌐 OAuth Redirect Base URL:', redirectTo)
    } else {
      // Server-side fallback
      // ...
    }

    // Use Supabase OAuth flow as recommended in documentation
    const callbackUrl = `${redirectTo}/auth/callback?redirectTo=${encodeURIComponent(redirectPath)}`
    console.log('🔗 Full OAuth Callback URL:', callbackUrl)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 🔒 **SECURITY:** Logging OAuth URLs and redirect paths may expose sensitive tokens
- 📝 Explicit "DEBUG:" comment indicates these should be removed
- 💡 Replace with error-only logging for failed auth attempts

---

#### `app/contexts/AuthContext.tsx`
**Type:** React Context 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Authentication state management

```typescript
// Line 31
console.log('AuthContext - Session found:', !!session)

// Line 32
console.log('AuthContext - User:', session?.user?.email)

// Line 46
console.log('Auth state changed:', event, !!session)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 🔒 **SECURITY:** Logging user emails and session state
- 💡 Replace with development-only conditional logging

---

#### `app/hooks/useAuthWithRedirect.ts`
**Type:** Custom Hook 🔴 **HIGH PRIORITY**
**Priority:** HIGH - Authentication redirect handling

```typescript
// Line 33
console.log('🚀 openAuthWithRedirect - Setting localStorage:', redirectPath)

// Line 35
console.log('✅ openAuthWithRedirect - Verify localStorage:', localStorage.getItem('pendingRedirect'))

// Line 60
console.log('🎬 openAuthWithAction - Storing current path for OAuth:', currentPath)

// Line 66
console.log('📍 Storing scroll position:', window.scrollY)
```

**Recommendations:**
- ⚠️ **REMOVE** all console.log statements
- 💡 Debug logging in production hooks affects performance
- 🔧 Consider development-only logging wrapper

---

### Library/Utility Files 🟡 **MEDIUM PRIORITY**

#### `lib/cloudinary.ts`
**Type:** Library 🟡 **MEDIUM PRIORITY**
**Priority:** MEDIUM - Image upload service

```typescript
// Line 11
console.log('🔧 Cloudinary configuration:', {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME ? '✅ Set' : '❌ Missing',
  api_key: process.env.CLOUDINARY_API_KEY ? '✅ Set' : '❌ Missing',
  api_secret: process.env.CLOUDINARY_API_SECRET ? '✅ Set' : '❌ Missing',
})

// Line 51
console.log('🔍 CloudinaryService.uploadImage called with:', {
  fileType: Buffer.isBuffer(file) ? 'Buffer' : typeof file,
  fileSize: Buffer.isBuffer(file) ? file.length : 'N/A',
  folder,
  options: {
    ...options,
    // Don't log the full file buffer
    fileType: options.fileType
  }
})

// Line 80
console.log('📤 Cloudinary upload options:', uploadOptions)

// Line 86
console.log('📸 Uploading Buffer via stream')
console.log('📊 Buffer size:', file.length, 'bytes')

// Line 103
console.log('📸 Uploading string (base64 or URL)')

// Line 109
console.log('✅ Cloudinary upload successful:', {
  public_id: uploadResult.public_id,
  url: uploadResult.url,
  secure_url: uploadResult.secure_url,
  format: uploadResult.format,
  bytes: uploadResult.bytes,
  width: uploadResult.width,
  height: uploadResult.height
})
```

**Recommendations:**
- ⚠️ **REMOVE** or replace with structured logging
- 📊 Line 11 is configuration logging (keep for development, remove for production)
- 💡 Use environment-aware logging (only in development)

---

#### `lib/utils/image-performance.ts`
**Type:** Library 🟡 **MEDIUM PRIORITY**
**Priority:** MEDIUM - Performance monitoring utility

```typescript
// Line 120
console.log('📊 Image Performance:', {
  // ... performance data
})

// Line 173
console.log('🎯 LCP Image:', {
  // ... LCP data
})

// Line 265-274
console.log(`Total Images: ${report.totalImages}`)
console.log(`Total Bytes: ${(report.totalBytes / (1024 * 1024)).toFixed(2)}MB`)
console.log(`Average Load Time: ${report.averageLoadTime.toFixed(2)}ms`)
console.log(`Format Distribution:`, report.formatDistribution)

if (report.lcpImage) {
  console.log(`LCP Image: ${report.lcpImage.url.substring(0, 80)}`)
  console.log(`  - Format: ${report.lcpImage.format}`)
  console.log(`  - Size: ${(report.lcpImage.size / 1024).toFixed(2)}KB`)
  console.log(`  - Load Time: ${report.lcpImage.loadTime.toFixed(2)}ms`)
}

// Line 280
console.log(`${i + 1}. ${img.url.substring(0, 60)} - ${img.loadTime.toFixed(2)}ms`)

// Line 288
console.log(`${i + 1}. ${img.url.substring(0, 60)} - ${(img.size / 1024).toFixed(2)}KB`)

// Line 334
console.log('✅ Image performance monitoring initialized')
```

**Recommendations:**
- ⚠️ **CONDITIONAL LOGGING:** Only log in development mode
- 📊 This is a performance monitoring utility - logs may be intentional
- 💡 Consider returning report object instead of console.log
- 🔧 Use a logging utility with environment detection

---

#### `lib/push-notifications.ts`
**Type:** Library 🟡 **MEDIUM PRIORITY**
**Priority:** MEDIUM - Push notification service

```typescript
// Line 36
console.log('Push notifications: Web environment detected, using Web Push API')

// Line 44
console.log('Push registration success, token: ' + token.value)

// Line 62
console.log('Push notification received: ' + JSON.stringify(notification))

// Line 67
console.log('Push notification action performed: ' + JSON.stringify(notification))

// Line 75
console.log('Push notifications initialized successfully')

// Line 140
console.log('Push token registered:', data)

// Line 172
console.log('Service Worker registered:', registration)
```

**Recommendations:**
- ⚠️ **REMOVE** or make development-only
- 🔒 **SECURITY:** Logging push tokens may be sensitive
- 💡 Replace with proper logging service

---

### Component Files 🟡 **MEDIUM PRIORITY**

#### `app/components/header.tsx`
**Type:** Component 🟡 **MEDIUM PRIORITY**

```typescript
// Line 43
console.log(`Header: ${source} check - localStorage showLoginModal:`, shouldShowLogin)

// Line 45
console.log(`Header: ${source} check - Found showLoginModal=true, opening modal`)
```

**Recommendations:**
- ⚠️ **REMOVE** - Debug logging in production component

---

#### `app/components/CapacitorInitializer.tsx`
**Type:** Component 🟡 **MEDIUM PRIORITY**

```typescript
// Line 84
console.log('Using fallback navigation bar height: 48px')

// Line 91
console.log('Push notification received:', notification)

// Line 95
console.log('Notification action performed:', action)

// Line 99
console.log('Push token registered:', token.value)

// Line 132
console.log('App state changed. Is active?', isActive)

// Line 137
console.log('App opened with URL:', data.url)

// Line 154
console.log('Capacitor initialized successfully')
```

**Recommendations:**
- ⚠️ **REMOVE** or make development-only
- 💡 Consider using debug flags for Capacitor-specific logging

---

#### `app/components/ImageUploadWithCompression.tsx`
**Type:** Component 🟡 **MEDIUM PRIORITY**

```typescript
// Line 99
console.log('📊 Compression Results:', {
  // ... compression data
})
```

**Recommendations:**
- ⚠️ **REMOVE** - Debug logging in component

---

### Additional Files

#### `app/wanted/post/page.tsx`
- **Lines 76, 95:** Debug logging for wanted request editing
- **Recommendation:** ⚠️ **REMOVE**

#### `app/listings/[id]/ListingDetailClient.tsx`
- **Lines 119, 174, 208:** Debug logging for listing details
- **Recommendation:** ⚠️ **REMOVE**

#### `app/listings/[id]/page.tsx`
- Multiple debug logs
- **Recommendation:** ⚠️ **REMOVE**

#### `app/api/profiles/route.ts`
- Admin/profile listing logs
- **Recommendation:** ⚠️ **REMOVE** or replace with audit logging

#### `middleware.ts`
- Middleware logging (if present)
- **Recommendation:** ⚠️ **REMOVE** or use proper logging

#### `lib/services/textlkService.ts`
- Service logging
- **Recommendation:** ⚠️ **REMOVE** or replace with structured logging

---

## Summary Statistics

### By File Type
- **Scripts/CLI Tools:** ~40 instances ✅ (Acceptable)
- **Production API Routes:** ~120 instances 🔴 (CRITICAL)
- **Client Components:** ~200 instances 🔴 (HIGH PRIORITY)
- **Library/Utilities:** ~50 instances 🟡 (MEDIUM PRIORITY)
- **Other:** ~34 instances 🟡 (Review needed)

### By Priority
- 🔴 **CRITICAL (Remove Immediately):** ~320 instances
- 🟡 **MEDIUM (Review/Replace):** ~50 instances
- ✅ **ACCEPTABLE (Keep):** ~40 instances

### Files by Category

#### 🔴 Production-Critical Files (Require Immediate Action)
1. `app/api/upload/cloudinary/route.ts` - 25+ instances
2. `app/profile/page.tsx` - 28 instances
3. `app/post/page.tsx` - 10 instances
4. `app/admin-old/page.tsx` - 18 instances
5. `lib/auth.ts` - 4 instances
6. `app/auth/callback/route.ts` - 3 instances
7. `app/api/user/delete-account/route.ts` - 1 instance (audit log - needs proper system)
8. `app/api/admin/listings/approve/route.ts` - 1 instance

#### 🟡 Medium Priority Files (Review/Replace)
1. `lib/cloudinary.ts` - 8 instances
2. `lib/utils/image-performance.ts` - 12 instances
3. `lib/push-notifications.ts` - 7 instances
4. `app/components/CapacitorInitializer.tsx` - 7 instances
5. `app/components/header.tsx` - 2 instances
6. `app/components/ImageUploadWithCompression.tsx` - 1 instance

#### ✅ Acceptable (CLI/Development Scripts - KEPT)
1. `mcp-sentry.config.js` - 3 instances (active npm script for MCP server)
2. `scripts/migrations/apply-sql-file.js` - console.log instances (generic migration utility)

#### 🗑️ Scripts Deleted (No Longer Needed)
1. ~~`scripts/lighthouse-test.js`~~ - Removed (use Chrome DevTools Lighthouse extension)
2. ~~`scripts/test-api-endpoints.js`~~ - Removed (use Jest integration tests)
3. ~~`scripts/test-admin-dashboard.js`~~ - Removed (use E2E tests)
4. ~~`scripts/template-monitor.js`~~ - Removed (stale, use lib/monitoring/*)
5. ~~`scripts/migrations/apply-security-fixes.js`~~ - Removed (one-time migration, already applied)
6. ~~`scripts/migrations/rollback-security-fixes.js`~~ - Removed (one-time script, no longer needed)
7. ~~`scripts/migrations/update-finance-listings.js`~~ - Removed (one-time data migration)
8. ~~`scripts/migrations/update-finance-simple.js`~~ - Removed (one-time data migration)

#### 📄 Documentation Deleted
1. ~~`docs/LIGHTHOUSE_TESTING_INSTRUCTIONS.md`~~ - Removed (use Chrome extension)
2. ~~`docs/LIGHTHOUSE_PERFORMANCE_ANALYSIS.md`~~ - Removed (use Chrome extension)
3. ~~`docs/PERFORMANCE_REPORT_COMPILED.md`~~ - Removed (based on lighthouse testing)

---

## Recommendations

### Immediate Actions (Before Production)

1. **Remove All Debug Console.log from Production API Routes**
   - Files: All files in `app/api/**`
   - Replace with structured logging (Sentry, Winston, or similar)
   - Keep error logging only

2. **Remove All Client-Side Console.log**
   - Files: All `app/**/*.tsx` component files
   - Client logs pollute browser console and affect performance
   - Use development-only conditional logging if needed

3. **Replace Audit Logs with Proper System**
   - `app/api/user/delete-account/route.ts` - Account deletion must be logged properly
   - Move to database audit log or structured logging service

4. **Security-Sensitive Logging**
   - Remove logs that expose:
     - User IDs/emails
     - OAuth tokens/URLs
     - File names/paths
     - Phone numbers

### Best Practices Going Forward

1. **Use Environment-Aware Logging**
   ```typescript
   const log = process.env.NODE_ENV === 'development' ? console.log : () => {};
   // Or use a proper logging library
   ```

2. **Structured Logging Service**
   - Implement Winston, Pino, or similar
   - Use Sentry for error tracking
   - Log levels: error, warn, info, debug

3. **Development-Only Logging**
   ```typescript
   if (process.env.NODE_ENV === 'development') {
     console.log('Debug info:', data);
   }
   ```

4. **Replace Console.log in Components**
   - Use React DevTools
   - Use development-only logging wrapper
   - Use toast notifications for user feedback

5. **Code Review Checklist**
   - No console.log in production code
   - Use proper logging service
   - Environment-aware logging only
   - No sensitive data in logs

---

## Additional Analysis

### Debug Code Identified

#### Explicit "DEBUG" Comments Found:
1. `app/api/upload/cloudinary/route.ts` - Line 9: Debug logging
2. `app/listings/page.tsx` - Line 352: "Debug logging (remove in production)"
3. `lib/auth.ts` - Line 163: "DEBUG: Log what we're reading"
4. `app/auth/callback/route.ts` - Line 56: "DEBUG: Log the callback URL"

**Action:** All of these should be removed immediately.

### Production-Critical Files Flagged

1. **Authentication Flow:** `lib/auth.ts`, `app/auth/callback/route.ts`
   - Logging OAuth URLs and redirect paths
   - Security risk: May expose tokens

2. **File Upload:** `app/api/upload/cloudinary/route.ts`
   - Logging file names, sizes, user IDs
   - Privacy concern: Exposes user data

3. **Account Management:** `app/api/user/delete-account/route.ts`
   - Audit logging (needs proper system)
   - Compliance requirement

4. **Admin Functions:** `app/api/admin/**`
   - Admin operations should be logged to audit trail, not console

5. **User Profile:** `app/profile/page.tsx`
   - Excessive debug logging (28 instances)
   - Logging sensitive user data

### Performance Impact

- **Client-side console.log:** Affects browser performance, especially with large objects
- **Server-side console.log:** Adds overhead to API requests
- **Recommendation:** Remove all non-essential logging

---

## Implementation Checklist

- [ ] Create environment-aware logging utility
- [ ] Set up structured logging service (Sentry/Winston)
- [ ] Remove all console.log from `app/api/**` routes
- [ ] Remove all console.log from `app/**/*.tsx` components
- [ ] Replace audit logs with proper logging system
- [ ] Remove debug logs marked with "DEBUG" comments
- [ ] Review and clean `lib/**` utility files
- [ ] Keep CLI scripts as-is (they're acceptable)
- [ ] Add ESLint rule to prevent console.log in production code
- [ ] Update code review checklist

---

## Conclusion

This audit identified **444+ console.log statements** across **91 files**. While **~40 instances** in CLI scripts are acceptable, **~404 instances** in application code require action:

- **320 instances** in production-critical files should be **removed immediately**
- **50 instances** in utilities should be **reviewed and replaced**
- **34 instances** need **evaluation**

**Priority Actions:**
1. Remove all debug console.log from API routes
2. Remove all console.log from client components
3. Replace audit logs with proper logging system
4. Implement environment-aware logging utility

**Estimated Impact:**
- Improved performance (reduced console overhead)
- Better security (no sensitive data in logs)
- Cleaner codebase (professional logging approach)
- Compliance ready (proper audit logging)

---

**Report Generated:** 2025-11-02T00:22:09.587Z

