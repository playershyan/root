# Payment Sandbox - Testing Paid Features

## Overview

The Payment Sandbox is a testing environment that allows you to test payment flows and promotion features without processing real payments. All transactions are simulated and won't charge any real money.

## 🚀 Quick Start

### 1. Enable Sandbox Mode

Add the following to your `.env.local` file:

```env
# Payment Sandbox Configuration
PAYMENT_SANDBOX_MODE=true
```

**Note:** Sandbox mode is automatically enabled in development (`NODE_ENV !== 'production'`), but you can explicitly enable it with this environment variable.

### 2. Access the Sandbox

Navigate to the sandbox page:
```
http://localhost:3000/payment-sandbox
```

Or with a listing ID:
```
http://localhost:3000/payment-sandbox?listing=YOUR_LISTING_ID
```

## 🧪 Test Scenarios

The sandbox supports multiple test scenarios:

### ✅ Success Scenario
- Simulates a successful payment
- Creates promotions in the database
- Returns success response
- **Use for:** Testing successful payment flows and promotion activation

### ❌ Failure Scenario
- Simulates a failed payment (e.g., insufficient funds)
- Does not create promotions
- Returns failure response
- **Use for:** Testing error handling and failure states

### ⏳ Delayed Scenario
- Simulates delayed payment processing (3 seconds)
- Creates promotions after delay
- **Use for:** Testing loading states and timeout handling

### ⚠️ Partial Scenario
- Simulates partially processed payment
- Does not create promotions
- Returns partial failure response
- **Use for:** Testing edge cases and partial failures

## 📝 Usage Instructions

### Step 1: Enter Listing ID

Enter a valid listing ID from your database. This should be a UUID of an existing listing in the `listings` table.

**Example:**
```
550e8400-e29b-41d4-a716-446655440000
```

### Step 2: Select Promotion Features

Choose one or more promotion features to test:

- **Featured** (Rs. 3,500) - Top 2 spots, homepage visibility
- **Top Spot** (Rs. 1,200) - Category top slots
- **Boost** (Rs. 800) - Daily repositioning
- **Urgent** (Rs. 600) - Urgent badge, priority placement

The total price will be calculated automatically, including bundle discounts:
- 2 features: Rs. 200 discount
- 3 features: Rs. 400 discount
- 4 features: Rs. 600 discount

### Step 3: Configure Customer Information

The sandbox includes test customer data that you can modify:

- **Name:** Test User (default)
- **Email:** test@example.com (default)
- **Phone:** 0771234567 (default)

### Step 4: Choose Test Scenario

Select a test scenario from the available options based on what you want to test.

### Step 5: Run Test

Click the "Test Payment" button to process the sandbox payment. Results will appear in the right panel.

## 📊 Understanding Results

### Success Response

```json
{
  "success": true,
  "orderId": "SANDBOX-1234567890-abc123",
  "transactionId": "TXN-1234567890-xyz789",
  "message": "Payment processed successfully (Sandbox)",
  "paymentData": {
    "amount": 3500,
    "promotionTypes": ["featured"],
    "listingId": "550e8400-e29b-41d4-a716-446655440000"
  }
}
```

### Failure Response

```json
{
  "success": false,
  "orderId": "SANDBOX-1234567890-abc123",
  "transactionId": "TXN-1234567890-xyz789",
  "message": "Payment failed: Insufficient funds (Sandbox)"
}
```

## 🔍 Verifying Results

After a successful test payment, verify that:

1. **Promotions Created:** Check the `promotions` table in your database:
   ```sql
   SELECT * FROM promotions 
   WHERE payment_id LIKE 'TXN-%' 
   ORDER BY created_at DESC 
   LIMIT 5;
   ```

2. **Listing Updated:** Check that the listing has promotion flags set:
   ```sql
   SELECT id, is_featured, is_top_spot, is_boosted, is_urgent,
          featured_until, top_spot_until, boosted_until, urgent_until
   FROM listings 
   WHERE id = 'YOUR_LISTING_ID';
   ```

3. **Expiration Dates:** Verify that expiration dates are set correctly:
   - Featured: +7 days
   - Top Spot: +7 days
   - Boost: +7 days
   - Urgent: +5 days

## 🔌 API Usage

You can also test the sandbox programmatically via the API:

```typescript
const response = await fetch('/api/payments/sandbox', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    listingId: '550e8400-e29b-41d4-a716-446655440000',
    promotionTypes: ['featured', 'boost'],
    customerEmail: 'test@example.com',
    customerName: 'Test User',
    customerPhone: '0771234567',
    scenario: 'success', // 'success' | 'failure' | 'delayed' | 'partial'
    delay: 1000 // Optional delay in milliseconds
  }),
})

const result = await response.json()
console.log(result)
```

## 🛡️ Security Notes

1. **Development Only:** The sandbox should only be enabled in development/testing environments
2. **No Real Payments:** Sandbox mode never processes real payments, even with valid credentials
3. **Database Impact:** Sandbox payments DO create real promotions in the database for testing purposes
4. **Production:** Ensure `PAYMENT_SANDBOX_MODE=false` or unset in production

## 🐛 Troubleshooting

### Sandbox Not Enabled

**Error:** "Sandbox mode is not enabled"

**Solution:** Add `PAYMENT_SANDBOX_MODE=true` to your `.env.local` file

### Invalid Listing ID

**Error:** "Failed to create promotions"

**Solution:** Ensure the listing ID exists in your database:
```sql
SELECT id FROM listings WHERE id = 'YOUR_LISTING_ID';
```

### Promotion Activation Failed

**Error:** "Payment succeeded but promotion activation failed"

**Possible Causes:**
1. Listing doesn't exist
2. Database connection issues
3. Missing required database tables/columns

**Solution:** Check database logs and ensure:
- `promotions` table exists
- `listings` table has promotion columns
- Database connection is working

## 📚 Related Documentation

- [Promotion System Setup](./PROMOTION_SYSTEM_SETUP.md)
- [Payment Gateway Setup](./ENVIRONMENT_SETUP_GUIDE.md#4--payment-gateway-setup)
- [Database Schema](../database/SUPABASE_DATABASE_ANALYSIS.md)

## 🎯 Testing Checklist

Use this checklist when testing paid features:

- [ ] Test successful payment flow
- [ ] Test payment failure handling
- [ ] Test multiple promotion features (bundle)
- [ ] Verify promotions are created in database
- [ ] Verify listing promotion flags are updated
- [ ] Verify expiration dates are correct
- [ ] Test promotion display on frontend
- [ ] Test promotion expiration handling
- [ ] Test promotion renewal flow
- [ ] Test error handling and edge cases

## 💡 Tips

1. **Use Real Listing IDs:** Always use actual listing IDs from your database for realistic testing
2. **Test All Scenarios:** Test both success and failure scenarios to ensure proper error handling
3. **Check Database:** After each test, verify the database state matches expectations
4. **Clean Up:** Consider cleaning up test promotions periodically:
   ```sql
   DELETE FROM promotions WHERE payment_id LIKE 'TXN-%';
   ```
5. **Monitor Logs:** Check application logs for any errors or warnings during testing

## 🚨 Important Warnings

⚠️ **Sandbox payments create REAL promotions in the database.** Always use test data or clean up after testing.

⚠️ **Never enable sandbox mode in production.** Always disable it or ensure `NODE_ENV=production`.

⚠️ **Test promotions count as real promotions** and will be displayed on the frontend. Use test listings or clean up regularly.

