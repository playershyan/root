# Quick Start: Wanted Requests Auto-Approval

## ✅ What Was Done

### 1. Fixed Database Constraint Issue
**File:** `supabase/migrations/036_fix_wanted_requests_status_constraint.sql`

The original wanted_requests table CHECK constraint was missing `'pending'` status, which would cause errors when trying to create requests with pending approval. This migration fixes it by allowing all status values: `'pending'`, `'active'`, `'paused'`, `'deleted'`, `'fulfilled'`.

### 2. Temporarily Disabled Admin Approval
**File:** `app/api/wanted-requests/route.ts`

Added a configuration flag at the top of the file:
```typescript
const AUTO_APPROVE_WANTED_REQUESTS = true  // Set to false to require approval
```

When `true` (current):
- Wanted requests are created with `status: 'active'` and `is_active: true`
- They appear on `/wanted` page immediately
- No admin approval needed

When `false` (future):
- Wanted requests are created with `status: 'pending'` and `is_active: false`
- They require admin approval via `/admin/wanted-requests`
- Only appear on `/wanted` page after approval

## 🚀 Deploy Instructions

### Step 1: Apply Database Migration
You **MUST** run this migration before deploying code changes:

```bash
# If using Supabase CLI
supabase db push

# Or manually via psql
psql your_database_url < supabase/migrations/036_fix_wanted_requests_status_constraint.sql
```

### Step 2: Deploy Application
Deploy your updated application code to production.

### Step 3: Verify
1. Create a test wanted request
2. Check it appears immediately on `/wanted` page
3. Verify in database: `status = 'active'` and `is_active = true`

## 🔄 To Re-Enable Admin Approval Later

1. Open `app/api/wanted-requests/route.ts`
2. Change line 11: `const AUTO_APPROVE_WANTED_REQUESTS = false`
3. Redeploy application
4. New wanted requests will require admin approval

## 📋 Files Changed

1. ✅ `supabase/migrations/036_fix_wanted_requests_status_constraint.sql` - New migration
2. ✅ `app/api/wanted-requests/route.ts` - Added auto-approval flag
3. ✅ `docs/WANTED_REQUESTS_AUTO_APPROVAL.md` - Full documentation
4. ✅ `QUICKSTART_AUTO_APPROVAL.md` - This file

## ⚠️ Important Notes

- The migration is **required** even with auto-approval enabled
- Admin approval endpoints remain functional for future use
- The `/wanted` page query is already correct (filters by status='active' and is_active=true)
- Pending functionality is preserved, just temporarily disabled

## 🐛 If Issues Occur

Check these:
1. Migration was applied: `SELECT * FROM wanted_requests LIMIT 1;` (should not error)
2. Constraint exists: Run verification query from migration file
3. New requests have correct status: Check database after creating test request
4. Logs: Check API logs for any errors during wanted request creation

## 📚 Full Documentation
See `docs/WANTED_REQUESTS_AUTO_APPROVAL.md` for complete details.

