# API Integration Test Plan

## Testing Strategy

This document outlines tests to verify the listing and wanted request creation APIs are working correctly.

## 1. Listing Creation API Test

### Test Case 1: Basic Listing Creation
**Endpoint**: `POST /api/listings`
**Prerequisites**: Authenticated user

**Test Data**:
```json
{
  "title": "Test Toyota Corolla 2020",
  "vehicleType": "car",
  "make": "Toyota",
  "model": "Corolla",
  "year": "2020",
  "mileage": "50000",
  "condition": "Used",
  "fuelType": "Petrol",
  "transmission": "Automatic",
  "price": "5000000",
  "pricingType": "cash",
  "district": "Colombo",
  "city": "Colombo 05",
  "phone": "0771234567",
  "description": "Well maintained Toyota Corolla",
  "imageUrls": ["https://example.com/image1.jpg"]
}
```

**Expected Results**:
- Status: 201 Created
- Response contains `listing` object with `id`
- `status` field is `pending`
- Phone number is formatted correctly
- Metrics counter `listing.created` incremented

### Test Case 2: Validation Error Handling
**Endpoint**: `POST /api/listings`

**Test Data** (missing required fields):
```json
{
  "make": "Toyota",
  "model": "Corolla"
  // Missing: year, price, district, city, phone
}
```

**Expected Results**:
- Status: 400 Bad Request
- Response contains `errors` object with field-specific errors
- Metrics counter `listing.validation.failed` incremented
- No database insert

### Test Case 3: Duplicate Detection
**Endpoint**: `POST /api/listings`

**Steps**:
1. Create listing with specific make/model/year/price
2. Immediately try to create identical listing
3. Verify duplicate is blocked

**Expected Results**:
- Status: 409 Conflict
- Error message indicates duplicate
- Metrics counter `listing.duplicate.blocked` incremented
- No database insert

### Test Case 4: Rate Limiting
**Endpoint**: `POST /api/listings`

**Steps**:
1. Create 5 listings rapidly (within 15 minutes)
2. Try to create 6th listing

**Expected Results**:
- Status: 429 Too Many Requests
- Response contains rate limit information
- No database insert

### Test Case 5: Finance Listing
**Endpoint**: `POST /api/listings`

**Test Data**:
```json
{
  "title": "Test Finance Listing",
  "vehicleType": "car",
  "make": "Toyota",
  "model": "Corolla",
  "year": "2020",
  "mileage": "50000",
  "condition": "Used",
  "price": "5000000",
  "pricingType": "finance",
  "financeType": "Lease",
  "outstandingBalance": "3000000",
  "monthlyPayment": "50000",
  "remainingTerm": "24 months",
  "askingPrice": "3500000",
  "district": "Colombo",
  "city": "Colombo 05",
  "phone": "0771234567",
  "description": "Finance listing test",
  "imageUrls": ["https://example.com/image1.jpg"]
}
```

**Expected Results**:
- Status: 201 Created
- Finance fields properly saved
- `pricing_type` is `finance`

## 2. Wanted Request Creation API Test

### Test Case 1: Basic Wanted Request Creation
**Endpoint**: `POST /api/wanted-requests`

**Test Data**:
```json
{
  "make": "Toyota",
  "model": "Corolla",
  "min_year": "2018",
  "max_year": "2022",
  "min_budget": "4000000",
  "max_budget": "6000000",
  "location": "Colombo",
  "phone": "0771234567",
  "description": "Looking for a Toyota Corolla"
}
```

**Expected Results**:
- Status: 201 Created
- Response contains `request` object with `id`
- `status` field is `pending`
- `is_active` is `false`

### Test Case 2: Duplicate Detection
Similar to listing duplicate test

### Test Case 3: Rate Limiting
Similar to listing rate limit test

## 3. Admin Approval API Tests

### Test Case 1: Listing Approval
**Endpoint**: `POST /api/admin/listings/approve`
**Prerequisites**: Admin user with `moderate_listings` permission

**Test Data**:
```json
{
  "listingId": "<pending_listing_id>",
  "approvalNotes": "Approved after review"
}
```

**Expected Results**:
- Status: 200 OK
- Listing status changed to `active`
- `approved_by` and `approved_at` set
- Notification created for user
- Metrics counter `admin.listing.approved` incremented
- Wanted request matching triggered

### Test Case 2: Wanted Request Approval
**Endpoint**: `POST /api/admin/wanted-requests/approve`

**Expected Results**:
- Status: 200 OK
- Request status changed to `active`
- `is_active` set to `true`
- Notification created
- Metrics counter `admin.wanted_request.approved` incremented

## 4. Integration Test Checklist

- [ ] API routes are accessible
- [ ] Authentication works correctly
- [ ] Rate limiting is enforced
- [ ] Validation catches invalid data
- [ ] Duplicate detection works
- [ ] Phone numbers are formatted correctly
- [ ] Database inserts succeed with correct data
- [ ] Admin approval workflow functions
- [ ] Error responses are user-friendly
- [ ] Metrics are tracked correctly

## 5. Manual Testing Steps

1. **Test Listing Creation**:
   - Navigate to `/post`
   - Fill out form with valid data
   - Submit
   - Check browser console for API call
   - Verify network request to `/api/listings`
   - Check response status and data
   - Verify listing appears in database with `status = 'pending'`

2. **Test Validation**:
   - Submit form with missing required fields
   - Verify validation errors are displayed
   - Check API response has `errors` object

3. **Test Duplicate Detection**:
   - Create a listing
   - Try to create identical listing immediately
   - Verify duplicate error is shown

4. **Test Rate Limiting**:
   - Create 5 listings rapidly
   - Try 6th listing
   - Verify rate limit error

5. **Test Admin Approval**:
   - Log in as admin
   - Approve a pending listing
   - Verify listing becomes active
   - Check notification is created

## 6. Potential Issues to Check

1. **Phone Formatting Mismatch**:
   - Verify client sends raw phone number
   - Verify API formats phone correctly
   - Check country code conversion (LK → 94)

2. **Data Type Mismatches**:
   - Ensure numbers are parsed correctly
   - Verify boolean values are handled
   - Check null/undefined handling

3. **Missing Fields**:
   - Verify all required fields are validated
   - Check optional fields are properly nullified
   - Ensure database schema matches payload

4. **Error Handling**:
   - Test network failures
   - Test database errors
   - Test validation edge cases

## 7. Debugging Commands

### Check API Logs
```bash
# Look for API route calls in logs
grep "POST /api/listings" logs.txt
grep "POST /api/wanted-requests" logs.txt
```

### Check Database
```sql
-- Verify pending listings
SELECT * FROM listings WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;

-- Verify pending wanted requests
SELECT * FROM wanted_requests WHERE status = 'pending' ORDER BY created_at DESC LIMIT 10;

-- Check for duplicates
SELECT user_id, make, model, year, COUNT(*) 
FROM listings 
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY user_id, make, model, year
HAVING COUNT(*) > 1;
```

### Test API Directly (if authenticated)
```bash
curl -X POST http://localhost:3000/api/listings \
  -H "Content-Type: application/json" \
  -H "Cookie: <auth-cookie>" \
  -d '{
    "title": "Test Listing",
    "vehicleType": "car",
    "make": "Toyota",
    "model": "Corolla",
    "year": "2020",
    "price": "5000000",
    "district": "Colombo",
    "city": "Colombo 05",
    "phone": "0771234567",
    "description": "Test",
    "imageUrls": []
  }'
```

