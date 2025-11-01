# Wanted Request Creation Flow Analysis

## Overview
This document outlines the complete flow for creating a wanted request in the VERA.lk platform, from the user interface through validation, submission, storage, and approval processes.

---

## Flow Diagram

```
User Interface (Form)
    ↓
Authentication Check
    ↓
Multi-Step Form (Step 1: Vehicle Details)
    ↓
Validation (Step 1)
    ↓
Multi-Step Form (Step 2: Contact Info)
    ↓
Validation (Step 2)
    ↓
Data Processing & Formatting
    ↓
Database Insert (Supabase Direct)
    ↓
Status: 'pending', is_active: false
    ↓
Redirect Decision
    ├─ High Priority Selected → /wanted/payment/{id}
    └─ Regular → /wanted?posted=success
```

---

## Detailed Flow Breakdown

### 1. Entry Point
**File:** `app/wanted/post/page.tsx`

- **Route:** `/wanted/post`
- **Component:** `PostWantedPage` (Client Component)
- **Authentication Check:**
  ```typescript
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/?auth=true&redirect=/wanted/post')
    }
  }, [user, authLoading, router])
  ```
  - Redirects to home page with auth modal if user is not logged in

---

### 2. Form Structure

#### **Multi-Step Form System**

**Step 1: Vehicle Details** (Lines 574-930)
- Vehicle Type (required)
- Make (required, supports "Other" custom input)
- Model (required, supports "Other" custom input)
- Budget Range - Min & Max (required, must be positive, max > min)
- Year Range - Min & Max (required, 1990-currentYear, max > min)
- Fuel Type (optional)
- Transmission (optional)
- Maximum Mileage (optional)
- Additional Requirements/Description (optional, max 150 chars)

**Step 2: Contact Information** (Lines 934-1129)
- Location (District → City selection)
- Phone Number (required, with country selector)
- Preview Section
- High Priority Checkbox (create mode only)
- Terms acceptance

---

### 3. Validation Flow

#### **Step 1 Validation** (`validateStep(1)`, Lines 260-319)

```typescript
Case 1 Validations:
- vehicleType: Required
- make: Required (or customMake if "Other" selected)
- model: Required (or customModel if "Other" selected)
- min_budget: Required, must be >= 0
- max_budget: Required, must be >= 0, must be > min_budget
- min_year: Required, must be between 1990 and currentYear
- max_year: Required, must be between 1990 and currentYear, must be >= min_year
```

- Real-time validation feedback
- Error messages displayed inline
- Auto-scroll to first error field
- Prevents progression if validation fails

#### **Step 2 Validation** (`validateStep(2)`, Lines 320-325)

```typescript
Case 2 Validations:
- phone: Required
```

---

### 4. Data Processing

#### **Title Generation** (`generateTitle()`, Lines 228-244)

```typescript
Format: "{Make} {Model} {YearRange}"
Examples:
- "Toyota Corolla 2015-2020"
- "Honda Civic 2020 onwards"
- "BMW 3 Series up to 2019"
```

#### **Phone Number Formatting** (`formatPhoneNumber()`, Lines 378-405)

- **Sri Lanka (LK):** `+94 XX XXX XXXX` format
- **Other Countries:** `+{dialCode} {number}`
- Removes leading zeros, formats with country code

#### **Location Formatting** (Lines 419-422)

```typescript
Format: "{City}, {District}" or "{City}" or "{District}"
```

---

### 5. Submission Logic

#### **Create vs Edit Mode**

**Edit Mode Detection:**
```typescript
const isEditMode = searchParams.get('edit') !== null
const editId = searchParams.get('edit')
```

**Edit Flow** (Lines 427-456):
- Updates existing wanted request via Supabase
- Validates ownership
- Updates all fields except status (remains unchanged unless resubmitting)
- Redirects to profile with success message

**Create Flow** (Lines 458-500):
- Direct Supabase insert (no API route)
- Creates new record with initial status

---

### 6. Database Operation

#### **Direct Supabase Insert** (Lines 459-478)

```typescript
const { data, error } = await supabase
  .from('wanted_requests')
  .insert([{
    user_id: user.id,
    title: title,                    // Generated from make/model/year
    description: formData.description.trim() || null,
    min_budget: parseFloat(formData.min_budget) || null,
    max_budget: parseFloat(formData.max_budget) || null,
    make: formData.make === 'Other' 
      ? formData.customMake || 'Other' 
      : formData.make || null,
    model: formData.model === 'Other' 
      ? formData.customModel || 'Other' 
      : formData.model || null,
    min_year: parseInt(formData.min_year) || null,
    max_year: parseInt(formData.max_year) || null,
    location: locationString,        // "City, District"
    phone: formattedPhone,           // "+94 XX XXX XXXX"
    fuel_type: formData.fuel_type || null,
    transmission: formData.transmission || null,
    max_mileage: parseInt(formData.max_mileage) || null,
    status: 'pending',               // ⚠️ KEY: Initial status
    is_active: false                 // ⚠️ KEY: Not active initially
  }])
  .select()
```

**Key Points:**
- ❌ **No API Route Used** - Direct Supabase client call
- ✅ **Status:** `'pending'` (requires approval)
- ✅ **is_active:** `false` (not visible to public)
- ✅ **Returns:** Created record with ID

---

### 7. Post-Submission Redirects

#### **Regular Creation** (Lines 484-499)

```typescript
if (highPriority) {
  // High priority selected → Payment flow
  router.push(`/wanted/payment/${requestId}`)
} else {
  // Regular submission → Wanted page with success message
  router.push('/wanted?posted=success')
}
```

**High Priority Flow:**
- User checks "Mark as High Priority" checkbox
- Redirects to `/wanted/payment/{id}` for payment
- Payment must be completed before activation

**Regular Flow:**
- Redirects to `/wanted` with `?posted=success` query param
- Request enters approval queue

---

### 8. Approval Flow (Inferred)

Based on the codebase analysis:

**Status Progression:**
```
'pending' + is_active: false  →  Admin Review  →  'active' + is_active: true
```

**Activation Requirements:**
1. Admin reviews the request
2. Status changed from `'pending'` to `'active'`
3. `is_active` flag set to `true`
4. Request becomes visible in public listings

**Visibility Rules:**
- **Public View:** Only shows requests with `status = 'active'` AND `is_active = true`
- **User View:** Users can see their own requests regardless of status

---

## Key Components & Files

### Frontend Components

1. **Form Page:** `app/wanted/post/page.tsx`
   - Multi-step form component
   - Validation logic
   - Data processing
   - Direct Supabase insertion

2. **Location Selector:** `app/components/CountrySelector.tsx`
   - Country code selection
   - Phone number formatting

3. **Toast Notifications:** `app/components/notifications/Toast.tsx`
   - Success/error feedback

### Database Schema

**Table:** `wanted_requests`
- Primary fields: `id`, `user_id`, `title`, `description`
- Budget: `min_budget`, `max_budget`
- Vehicle: `make`, `model`, `min_year`, `max_year`, `fuel_type`, `transmission`, `max_mileage`
- Location: `location`, `phone`
- Status: `status` (pending/active/paused/deleted/fulfilled), `is_active` (boolean)
- Timestamps: `created_at`, `updated_at`, `posted_date`, `expires_at`
- Metrics: `responses`, `views`

### API Routes (Not Used for Creation)

**Note:** The creation flow does **NOT** use API routes. However, related routes exist:

- `GET /api/wanted-requests/route.ts` - Fetching active requests (filtering)
- `PUT /api/wanted-requests/update/route.ts` - Updating requests
- `POST /api/wanted-requests/pause/route.ts` - Pausing/resuming
- `POST /api/wanted-requests/close/route.ts` - Closing requests
- `POST /api/wanted-requests/delete/route.ts` - Deleting requests

---

## Security & Validation

### Client-Side Validation
- ✅ Required field checks
- ✅ Numeric range validation (years, budgets)
- ✅ Min/max comparisons
- ✅ Phone number formatting
- ✅ Real-time error feedback

### Authentication
- ✅ Auth check on page load
- ✅ Redirects to login if not authenticated
- ✅ User ID automatically assigned from session

### Data Integrity
- ✅ Phone number formatting (country code handling)
- ✅ Location normalization (city, district)
- ✅ Make/model handling (custom vs predefined)
- ✅ Budget validation (positive, logical ranges)

---

## Edge Cases & Special Handling

1. **Custom Make/Model:**
   - User selects "Other" option
   - Custom input fields appear
   - Values stored as custom strings

2. **Edit Mode:**
   - Detects `?edit={id}` query parameter
   - Loads existing request data
   - Pre-fills form fields
   - Updates instead of creates

3. **High Priority:**
   - Optional checkbox for paid promotion
   - Redirects to payment flow
   - Payment must complete before activation

4. **Location Selection:**
   - District → City cascade
   - City list filtered by district
   - Stores as "City, District" string

---

## Missing/Improvement Opportunities

### Current Gaps

1. **No API Route for Creation:**
   - Direct Supabase calls in client component
   - Cannot add server-side validation
   - Cannot add rate limiting
   - Cannot add middleware processing

2. **No Approval API Endpoint:**
   - Status change logic not found in codebase
   - Admin approval process unclear

3. **No Server-Side Validation:**
   - All validation is client-side only
   - Could be bypassed by direct API calls

### Recommendations

1. **Create API Route:** `POST /api/wanted-requests/route.ts`
   - Add server-side validation
   - Add rate limiting
   - Add spam detection
   - Centralize creation logic

2. **Add Approval Workflow:**
   - Admin dashboard endpoint
   - Notification system
   - Status transition tracking

3. **Add Validation Middleware:**
   - Re-validate on server
   - Sanitize inputs
   - Check for duplicates

---

## Status Flow Summary

```
CREATE → status: 'pending', is_active: false
    ↓
ADMIN REVIEW → (approval/rejection)
    ↓
APPROVED → status: 'active', is_active: true (Publicly Visible)
    ↓
LIFECYCLE:
    ├─ PAUSE → status: 'paused', is_active: false
    ├─ RESUME → status: 'active', is_active: true
    ├─ CLOSE → status: 'fulfilled' or 'closed'
    └─ DELETE → status: 'deleted', deleted_at: timestamp
```

---

## Conclusion

The wanted request creation flow is a **client-side driven process** with:
- ✅ Strong client-side validation
- ✅ Multi-step form UX
- ✅ Direct database insertion
- ⚠️ No server-side API route
- ⚠️ Initial status is `pending` with `is_active: false`
- ✅ Supports edit mode and high-priority payment flow

**Creation is successful** when:
1. User is authenticated ✅
2. All validations pass ✅
3. Database insert succeeds ✅
4. User is redirected appropriately ✅

**Activation requires** admin approval to change status from `pending` to `active` and set `is_active` to `true`.

