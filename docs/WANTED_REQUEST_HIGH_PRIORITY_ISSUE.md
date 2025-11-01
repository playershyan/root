# Wanted Request High Priority Issue Analysis

## Problem

All wanted requests are being created as high priority even when the "Mark as High Priority" checkbox is not checked.

## Root Cause Analysis

### Issue 1: Form Not Sending High Priority Flag
**Location**: `app/wanted/post/page.tsx` lines 464-481

**Problem**: The form has a `highPriority` state variable (line 54) and checkbox (line 1109), but when submitting to the API, the `highPriority` value was **NOT** included in the request body.

**Before Fix**:
```typescript
body: JSON.stringify({
  title: title,
  description: formData.description.trim() || null,
  // ... other fields
  // ❌ highPriority was MISSING here
  countryCode: selectedCountry.dialCode || '94'
})
```

### Issue 2: API Not Setting Urgency Field
**Location**: `app/api/wanted-requests/route.ts` lines 106-123

**Problem**: The API route didn't receive or set the `urgency` field in the database payload.

**Before Fix**:
```typescript
const payload = {
  user_id: user.id,
  title: finalTitle,
  // ... other fields
  status: 'pending',
  is_active: false
  // ❌ urgency field was MISSING
}
```

### Issue 3: Database Default Value
**Location**: Database schema

**Problem**: The `urgency` column in `wanted_requests` table has `DEFAULT 'high'`:

```sql
urgency text DEFAULT 'high' CHECK (urgency IN ('high', 'medium', 'low'))
```

**Impact**: When `urgency` is not explicitly set in the INSERT statement, the database automatically sets it to `'high'`, making all requests high priority by default.

## Solution

1. ✅ **Form**: Send `highPriority` boolean to the API
2. ✅ **API**: Receive `highPriority` and set `urgency` field explicitly
3. ✅ **Database**: Set `urgency` to `'high'` only when `highPriority === true`, otherwise set to `'medium'`

## Fix Implementation

### ✅ Step 1: Update Form to Send High Priority Flag

**Fixed in**: `app/wanted/post/page.tsx` line 480

**After Fix**:
```typescript
body: JSON.stringify({
  // ... existing fields
  highPriority: highPriority, // ✅ Added
  countryCode: selectedCountry.dialCode || '94'
})
```

### ✅ Step 2: Update API to Handle High Priority

**Fixed in**: `app/api/wanted-requests/route.ts` lines 42 and 122

1. Receive `highPriority` from request body (line 42):
```typescript
const {
  // ... other fields
  highPriority = false,  // ✅ Added with default
  countryCode = 'LK'
} = body
```

2. Set `urgency` field explicitly based on the flag (line 122):
```typescript
const payload = {
  // ... existing fields
  urgency: highPriority ? 'high' : 'medium', // ✅ Explicitly set: 'high' if checked, 'medium' otherwise
  status: 'pending',
  is_active: false
}
```

### ✅ Step 3: Appropriate Default Selected

**Decision**: Set to `'medium'` when `highPriority === false`

**Reasoning**: 
- Setting `null` would trigger database default to `'high'` (the problem we're fixing)
- Setting `'medium'` explicitly controls the value and avoids the database default
- `'medium'` is a reasonable default for regular (non-paid) wanted requests

## Verification

After these changes:
- ✅ Form sends `highPriority` flag to API
- ✅ API receives and uses `highPriority` flag
- ✅ Database receives explicit `urgency` value:
  - `'high'` when checkbox is checked
  - `'medium'` when checkbox is NOT checked
- ✅ No longer relies on database default

## Testing

To verify the fix:
1. Create a wanted request **WITHOUT** checking "Mark as High Priority"
   - Expected: `urgency = 'medium'` in database
   - Expected: Request appears as regular (not urgent) in listings
2. Create a wanted request **WITH** checking "Mark as High Priority"
   - Expected: `urgency = 'high'` in database
   - Expected: Request appears as urgent in listings
   - Expected: User redirected to payment page

## Files Modified

1. `app/wanted/post/page.tsx` - Added `highPriority` to API request body
2. `app/api/wanted-requests/route.ts` - Added `highPriority` handling and `urgency` field

## Summary

The issue was a **cascade of missing connections**:
1. Form checkbox existed but value wasn't sent to API
2. API didn't receive or process the flag
3. Database defaulted to `'high'` when `urgency` was not provided

**Fix**: Complete the data flow by sending the flag from form → API → database with explicit values.
