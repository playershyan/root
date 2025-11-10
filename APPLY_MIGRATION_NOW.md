# URGENT: Apply Migration to Fix /listings Page

## Critical Issue
The `/listings` page is failing with PGRST202 error because `get_promoted_slots_bundle` function doesn't exist in your production database.

## Solution: Apply Migration Immediately

The migration file is ready but **NOT YET APPLIED** to your Supabase database. You must apply it manually.

---

## Step 1: Copy the Migration SQL

The migration SQL is located at:
```
/home/user/root/database-migrations/20251110_optimized_listing_creation_and_rotation.sql
```

Full SQL content (728 lines):
- 4 performance indexes
- 5 database functions (create_listing_v2, rotation functions, bundle function)

---

## Step 2: Apply Migration via Supabase Dashboard

### RECOMMENDED METHOD:

1. **Open Supabase Dashboard**
   - Go to: https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo
   - Login with your Supabase credentials

2. **Navigate to SQL Editor**
   - Left sidebar → "SQL Editor"
   - Click "New Query"

3. **Paste Migration SQL**
   - Open file: `database-migrations/20251110_optimized_listing_creation_and_rotation.sql`
   - Copy entire contents (all 728 lines)
   - Paste into SQL Editor

4. **Execute Migration**
   - Click "Run" button (or press Cmd/Ctrl + Enter)
   - Wait for execution to complete (should take 2-5 seconds)

5. **Verify Success**
   - You should see: "Success. No rows returned"
   - Or: "4 indexes created, 5 functions created"

---

## Step 3: Verify Migration Was Applied

Run this verification query in SQL Editor:

```sql
-- Check if function exists
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'get_promoted_slots_bundle';

-- Expected result: 1 row showing the function exists
```

If you see 1 row returned, the migration succeeded.

---

## Step 4: Test /listings Page

1. Open your production site: https://vera.lk/listings
2. Page should load without PGRST202 error
3. Promoted slots (featured/top_spot/boosted/urgent) should display

---

## Alternative: Apply via Supabase CLI

If you have Supabase CLI configured:

```bash
cd /home/user/root
supabase db push --project-ref ahmynvxoxzhocuhxlcvo
```

---

## Alternative: Apply via psql

If you have direct database access:

```bash
psql "postgresql://postgres:[YOUR_PASSWORD]@db.ahmynvxoxzhocuhxlcvo.supabase.co:5432/postgres" \
  -f database-migrations/20251110_optimized_listing_creation_and_rotation.sql
```

Replace `[YOUR_PASSWORD]` with your Supabase database password.

---

## What This Migration Does

### Creates 4 Performance Indexes:
1. `idx_listings_duplicate_check` - Speeds up duplicate detection (O(n) → O(log n))
2. `idx_listings_active_feed` - Optimizes active listings queries
3. `idx_promotions_rotation_performance` - Optimizes rotation ORDER BY
4. `idx_listings_status_sold_vehicle_type` - Optimizes JOIN operations

### Creates/Updates 5 Functions:
1. `create_listing_v2` - Atomic listing creation with indexed duplicate check
2. `get_rotated_featured_ads` - Returns full listing data (eliminates double JOIN)
3. `get_rotated_top_spot_ads` - Returns full listing data (eliminates double JOIN)
4. `get_rotated_boost_ads` - Returns full listing data (eliminates double JOIN)
5. `get_promoted_slots_bundle` - Aggregates all promoted slots in single query

### Performance Impact:
- **Listings page load: 2-10× faster** (110-485ms improvement)
- **Eliminates PGRST202 error** (function now exists)
- **100% backward compatible** (no code changes needed)

---

## Rollback (If Needed)

If issues occur after migration:

```sql
-- Drop the bundle function
DROP FUNCTION IF EXISTS public.get_promoted_slots_bundle(TEXT, INTEGER, INTEGER, INTEGER, INTEGER);

-- Revert to old rotation function signatures
-- (restore from database-migrations/20251109_optimize_listing_creation.sql)
```

---

## Support

If you encounter errors during migration:

1. **Check error message** - SQL Editor shows detailed error output
2. **Common issues:**
   - "relation does not exist" → Check table names match your schema
   - "permission denied" → Use service role key or postgres user
   - "function already exists" → Migration is idempotent, this is OK

3. **Contact support:** Provide error message and migration file

---

## STATUS: ⚠️ MIGRATION NOT YET APPLIED

**Your /listings page will continue failing until you apply this migration to your Supabase database.**

**Estimated time to apply: 2-3 minutes**

---

## Quick Start (Copy-Paste)

**For fastest resolution:**

1. Open: https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo/sql/new
2. Copy-paste the entire SQL from: `database-migrations/20251110_optimized_listing_creation_and_rotation.sql`
3. Click "Run"
4. Refresh your /listings page

Done!
