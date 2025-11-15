# Wanted Requests Auto-Approval (Temporary Configuration)

## Overview
As of November 15, 2025, wanted requests are **automatically approved** upon creation, bypassing the admin moderation queue. This is a temporary measure that can be easily toggled back to require admin approval.

## Current Behavior
When a user creates a wanted request:
- ✅ Status is immediately set to `'active'`
- ✅ `is_active` is set to `true`
- ✅ Request appears on `/wanted` page instantly
- ✅ No admin approval required

## Changes Made

### 1. API Configuration (`app/api/wanted-requests/route.ts`)
Added a configuration flag to control auto-approval:

```typescript
// TEMPORARY CONFIGURATION: Auto-approve wanted requests (bypass admin moderation)
// Set to false to require admin approval before wanted requests go live
const AUTO_APPROVE_WANTED_REQUESTS = true
```

### 2. Database Migration (`supabase/migrations/036_fix_wanted_requests_status_constraint.sql`)
Fixed the CHECK constraint on `wanted_requests.status` to include `'pending'` status:

**Old constraint (broken):**
```sql
CHECK (status IN ('active', 'paused', 'deleted', 'fulfilled'))
```

**New constraint (fixed):**
```sql
CHECK (status IN ('pending', 'active', 'paused', 'deleted', 'fulfilled'))
```

This migration **must be applied** even with auto-approval enabled, as it ensures the system can support pending status when re-enabled.

## How to Re-Enable Admin Approval

### Step 1: Update the Configuration Flag
In `app/api/wanted-requests/route.ts`, change line 11:

```typescript
// FROM:
const AUTO_APPROVE_WANTED_REQUESTS = true

// TO:
const AUTO_APPROVE_WANTED_REQUESTS = false
```

### Step 2: Verify Migration Was Applied
Ensure that migration `036_fix_wanted_requests_status_constraint.sql` has been applied to your database:

```bash
# Check if constraint exists
psql your_database_url -c "
SELECT 
    con.conname AS constraint_name,
    pg_get_constraintdef(con.oid) AS constraint_definition
FROM pg_constraint con
INNER JOIN pg_class rel ON rel.oid = con.conrelid
INNER JOIN pg_namespace nsp ON nsp.oid = connamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'wanted_requests'
  AND con.conname = 'wanted_requests_status_check';
"
```

Expected output should show the constraint includes 'pending'.

### Step 3: Deploy Changes
Redeploy your application to apply the configuration change.

## System Components Involved

### API Endpoints
- **POST `/api/wanted-requests`** - Creates new wanted requests
  - Currently sets: `status: 'active'`, `is_active: true`
  - With approval enabled: `status: 'pending'`, `is_active: false`

- **POST `/api/admin/wanted-requests/approve`** - Admin approval endpoint
  - Still functional and ready to use when approval is re-enabled
  - Sets: `status: 'active'`, `is_active: true`, `approved_by`, `approved_at`

### Frontend Pages
- **`/wanted`** - Public wanted requests listing
  - Filters: `status = 'active'` AND `is_active = true`
  - Works correctly with both auto-approval and manual approval modes

- **`/wanted/post`** - Wanted request creation form
  - Success message adapts based on `AUTO_APPROVE_WANTED_REQUESTS` flag

### Database Schema
```sql
CREATE TABLE wanted_requests (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(20) DEFAULT 'active' 
    CHECK (status IN ('pending', 'active', 'paused', 'deleted', 'fulfilled')),
  is_active BOOLEAN DEFAULT true,
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  -- ... other fields
);
```

## Status Flow

### Current Flow (Auto-Approval)
```
User Creates Request
        ↓
status: 'active'
is_active: true
        ↓
Appears on /wanted page
```

### Manual Approval Flow (When Re-enabled)
```
User Creates Request
        ↓
status: 'pending'
is_active: false
        ↓
Admin Reviews
        ↓
Admin Approves
        ↓
status: 'active'
is_active: true
        ↓
Appears on /wanted page
```

## Admin Dashboard
The admin panel at `/admin/wanted-requests` will still function correctly:
- Pending requests (if any) will appear in the "Pending" filter
- Currently, with auto-approval, all new requests will show as "Active"
- Approval functionality remains intact for future use

## Testing Checklist

### With Auto-Approval (Current State)
- [ ] User can create a wanted request
- [ ] Request immediately appears on `/wanted` page
- [ ] Request shows `status: 'active'` in database
- [ ] Request shows `is_active: true` in database
- [ ] Success message says "is now live"

### With Manual Approval (When Re-enabled)
- [ ] User can create a wanted request
- [ ] Request does NOT appear on `/wanted` page
- [ ] Request shows `status: 'pending'` in database
- [ ] Request shows `is_active: false` in database
- [ ] Request appears in admin panel under "Pending"
- [ ] Admin can approve request
- [ ] After approval, request appears on `/wanted` page
- [ ] Success message says "pending approval"

## Notes

### Why Keep the Migration?
Even though we're temporarily bypassing admin approval, the migration is essential because:
1. The old CHECK constraint was missing 'pending', causing database errors
2. When approval is re-enabled, 'pending' status must be allowed
3. Existing code references 'pending' status in multiple places
4. The admin approval workflow needs 'pending' to function

### Performance Impact
Auto-approval has minimal performance impact:
- No additional database queries
- No async approval workflow
- Slightly faster user experience (immediate visibility)

### Security Considerations
Auto-approval removes the content moderation layer. Consider:
- Users can post any wanted request content immediately
- Spam/inappropriate content may appear on the site
- Recommended: Monitor `/wanted` page and use reporting system
- Recommended: Re-enable approval when moderation capacity is available

## Rollback Plan
If auto-approval causes issues:

1. Set `AUTO_APPROVE_WANTED_REQUESTS = false`
2. Redeploy application
3. All new requests will require approval
4. Existing active requests remain active

## Support
For issues or questions:
- Check database constraint: `wanted_requests_status_check`
- Verify migration 036 was applied successfully
- Review API logs for wanted request creation errors
- Check admin panel for pending approvals queue

---

**Last Updated:** November 15, 2025  
**Modified Files:**
- `app/api/wanted-requests/route.ts`
- `supabase/migrations/036_fix_wanted_requests_status_constraint.sql`

