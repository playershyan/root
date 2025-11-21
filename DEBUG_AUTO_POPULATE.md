# Debug Guide: Auto-Populate Profile Contact Fields

## Issue
Profile phone/whatsapp fields not updating after listing creation with OTP verification.

## Critical Steps to Verify

### 1. Database Migration Status

**IMPORTANT**: The `whatsapp` column MUST exist in the profiles table.

**Check if migration was applied:**

```sql
-- Run in Supabase SQL Editor or psql
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'profiles'
AND table_schema = 'public'
AND column_name IN ('phone', 'whatsapp');
```

**Expected result:**
```
column_name | data_type
------------+----------
phone       | text
whatsapp    | text
```

**If `whatsapp` column is missing, run migration:**

```bash
# Via Supabase CLI
supabase migration apply 20251121_add_whatsapp_to_profiles

# OR via SQL Editor (copy/paste contents of):
cat database-migrations/20251121_add_whatsapp_to_profiles.sql
```

---

### 2. Check Current Profile Data

```sql
-- Replace YOUR_USER_ID with actual user ID
SELECT id, phone, whatsapp, name
FROM public.profiles
WHERE id = 'YOUR_USER_ID';
```

**Expected for empty profile:**
```
id          | phone | whatsapp | name
------------|-------|----------|-----
<user-id>   | NULL  | NULL     | ...
```

---

### 3. Test Listing Creation

**Steps:**
1. Clear profile fields in database (if testing):
   ```sql
   UPDATE public.profiles
   SET phone = NULL, whatsapp = NULL
   WHERE id = 'YOUR_USER_ID';
   ```

2. Create a new listing at `/post`
3. Enter phone number: `0771234567`
4. Complete OTP verification
5. Ensure "Save to profile for future listings" is CHECKED
6. Submit listing

---

### 4. Check Server Logs

**Look for these log entries:**

✅ **Success pattern:**
```
[AUTO-POPULATE] Starting profile auto-population check
  userId: xxx
  saveToProfile: true
  hasUserProfile: true
  currentPhone: EMPTY
  currentWhatsapp: EMPTY

[AUTO-POPULATE] Phone check
  phoneIsEmpty: true
  normalizedPhone: 94771234567

[AUTO-POPULATE] Will update phone field
  normalizedPhone: 94771234567

[AUTO-POPULATE] Executing profile update
  updates: { phone: "94771234567" }

[AUTO-POPULATE] SUCCESS - Profile contact fields updated
  fields: ["phone"]
  values: { phone: "94771234567" }
```

❌ **Failure patterns:**

**Pattern 1: saveToProfile disabled**
```
[AUTO-POPULATE] Skipped - saveToProfile disabled or no userProfile
  saveToProfile: false
```
→ User unchecked the checkbox

**Pattern 2: Database error**
```
[AUTO-POPULATE] Failed to update profile contact fields
  errorCode: 42703
  errorMessage: column "whatsapp" does not exist
```
→ Migration not applied - run migration

**Pattern 3: Profile already populated**
```
[AUTO-POPULATE] No update needed - profile fields already populated
  currentPhone: 94771234567
```
→ Working as expected - profile not empty

---

### 5. Verify Profile Update

```sql
SELECT phone, whatsapp, updated_at
FROM public.profiles
WHERE id = 'YOUR_USER_ID';
```

**Expected after successful listing creation:**
```
phone        | whatsapp     | updated_at
-------------|--------------|---------------------------
94771234567  | 94771234567  | 2025-11-21 14:30:00+00
```

---

## Common Issues

| Symptom | Cause | Fix |
|---------|-------|-----|
| Error: column "whatsapp" does not exist | Migration not applied | Run migration SQL |
| Fields not updating but no error | Phone already exists in profile | Clear profile.phone first to test |
| Checkbox not visible | Using profile page (not listing form) | Check /post or /wanted/post pages only |
| OTP verification fails | Phone number format issue | Use Sri Lankan format: 0771234567 |

---

## Log File Locations

- **Development**: Terminal where `npm run dev` is running
- **Production (Vercel)**: Vercel Dashboard → Logs → Runtime Logs
- **Supabase**: Supabase Dashboard → Logs → API Logs

---

## Quick Test Script

```bash
# 1. Check if migration exists
ls -la database-migrations/20251121_add_whatsapp_to_profiles.sql

# 2. View migration contents
cat database-migrations/20251121_add_whatsapp_to_profiles.sql

# 3. Check TypeScript types
grep -A 5 "interface Profile" lib/types.ts

# 4. Verify API includes whatsapp
grep -n "select.*phone.*whatsapp" app/api/listings/route.ts
```

---

## Expected Behavior

1. ✅ User creates listing with new phone number
2. ✅ OTP verification completes successfully
3. ✅ Checkbox "Save to profile for future listings" is checked (default)
4. ✅ Profile.phone is NULL or empty
5. ✅ Listing submission succeeds
6. ✅ Profile.phone updates to normalized format (94XXXXXXXXX)
7. ✅ Profile.whatsapp updates if provided and different from phone
8. ✅ Future listings auto-populate from profile (no OTP required)

---

## Next Steps

1. Run database migration if needed
2. Test listing creation
3. Check server logs for [AUTO-POPULATE] entries
4. Verify profile.phone and profile.whatsapp populated
5. Report specific error code if still failing
