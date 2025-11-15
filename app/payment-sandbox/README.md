# Payment Sandbox

Quick reference guide for the Payment Sandbox testing environment.

## Quick Start

1. **Enable sandbox mode:**
   ```env
   PAYMENT_SANDBOX_MODE=true
   ```

2. **Access sandbox:**
   ```
   http://localhost:3000/payment-sandbox
   ```

3. **Test a payment:**
   - Enter a listing ID
   - Select promotion features
   - Choose a test scenario
   - Click "Test Payment"

## Test Scenarios

- ✅ **Success** - Simulates successful payment
- ❌ **Failure** - Simulates failed payment
- ⏳ **Delayed** - Simulates delayed processing (3s)
- ⚠️ **Partial** - Simulates partial failure

## API Endpoint

```typescript
POST /api/payments/sandbox
Content-Type: application/json

{
  "listingId": "uuid",
  "promotionTypes": ["featured", "boost"],
  "customerEmail": "test@example.com",
  "customerName": "Test User",
  "customerPhone": "0771234567",
  "scenario": "success",
  "delay": 1000 // optional
}
```

## Important Notes

⚠️ Sandbox payments create **REAL** promotions in the database.

⚠️ Always disable sandbox mode in production.

📚 See [PAYMENT_SANDBOX_GUIDE.md](../../docs/setup/PAYMENT_SANDBOX_GUIDE.md) for complete documentation.

