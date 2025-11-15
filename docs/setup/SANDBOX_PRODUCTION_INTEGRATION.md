# Payment Sandbox - Production Integration Guide

## Overview

The payment sandbox has been integrated into the actual user flow for both listings and wanted requests. Users can now choose between real payments (PayHere) and sandbox testing mode directly from the payment modal.

## 🎯 Integration Points

### 1. Listings Paid Features
**URL:** `/post/paid-features?listing=LISTING_ID`

- Users select promotion features
- Click "Proceed to Payment"
- Payment modal opens with two options:
  - **PayHere** (Real Payment)
  - **Sandbox Mode** (Testing - only visible if enabled)

### 2. Wanted Requests Paid Features
**URL:** `/wanted/paid-features?request=REQUEST_ID`

- Users select promotion features for wanted requests
- Click "Proceed to Payment"
- Same payment modal with sandbox option

## 🔧 Production Configuration

### Enable Sandbox in Production

To enable sandbox mode in production, set the environment variable:

```env
PAYMENT_SANDBOX_MODE=true
```

**Important:** 
- Sandbox mode is **disabled by default** in production
- Sandbox mode is **enabled by default** in development
- When enabled, sandbox option appears in the payment modal
- Sandbox payments create **real promotions** in the database

### Disable Sandbox in Production

To ensure sandbox is disabled in production:

```env
PAYMENT_SANDBOX_MODE=false
```

Or simply don't set the variable (defaults to disabled in production).

## 🎨 User Experience

### Payment Modal Features

1. **Payment Method Selection:**
   - PayHere option (always visible)
   - Sandbox option (only visible when enabled)
   - Clear visual distinction with yellow highlighting

2. **Sandbox Warning:**
   - Yellow alert box when sandbox is selected
   - Explains that promotions will be created but no money charged
   - "TEST" badge on sandbox option

3. **Customer Information:**
   - Name, email, phone required for both methods
   - Same validation for both payment types

## 🔐 Security Considerations

### Production Safety

1. **Explicit Enable Required:**
   - Sandbox won't appear unless explicitly enabled
   - Environment variable must be set to `true`

2. **Database Impact:**
   - Sandbox payments create real promotions
   - Use test listings/requests or clean up regularly
   - Consider adding a sandbox flag to promotions table

3. **User Awareness:**
   - Clear visual indicators (yellow, "TEST" badge)
   - Warning message when sandbox is selected
   - Only show to authorized users if needed

## 📊 Testing Workflow

### For Development/Staging

1. **Default Behavior:**
   - Sandbox enabled automatically
   - Appears in payment modal
   - Can test without real payments

2. **Test Scenarios:**
   - Select features
   - Choose sandbox payment
   - Verify promotions created
   - Check database state

### For Production Testing

1. **Enable Sandbox:**
   ```env
   PAYMENT_SANDBOX_MODE=true
   ```

2. **Test Flow:**
   - Navigate to paid features page
   - Select promotion features
   - Choose sandbox payment option
   - Verify promotions created
   - Check listing/wanted request updated

3. **Disable After Testing:**
   ```env
   PAYMENT_SANDBOX_MODE=false
   ```
   Or remove the variable entirely

## 🔄 API Endpoints

### Sandbox Check
```
GET /api/payments/sandbox/check
```
Returns: `{ enabled: boolean }`

### Sandbox Payment
```
POST /api/payments/sandbox
Body: {
  listingId: string,
  promotionTypes: PromotionType[],
  customerEmail: string,
  customerName: string,
  customerPhone: string,
  scenario: 'success' | 'failure' | 'delayed' | 'partial'
}
```

### Payment Completion (Supports Both)
```
POST /api/listings/payment/complete
Body: {
  listingId: string,
  features: string[],
  amount: number,
  useSandbox?: boolean
}
```

## 📝 Code Structure

### Components

- `app/components/payments/PaymentModal.tsx` - Main payment modal with sandbox support
- `app/post/paid-features/page.tsx` - Listings paid features page
- `app/wanted/paid-features/page.tsx` - Wanted requests paid features page

### Services

- `lib/payments/sandboxPaymentService.ts` - Sandbox payment processing
- `lib/payments/payhereService.tsx` - Real PayHere payment processing

### API Routes

- `app/api/payments/sandbox/route.ts` - Sandbox payment endpoint
- `app/api/payments/sandbox/check/route.ts` - Sandbox availability check
- `app/api/listings/payment/complete/route.ts` - Payment completion (supports both)

## 🚨 Important Notes

1. **Database Promotions:**
   - Sandbox payments create real promotions
   - They will appear on the frontend
   - Clean up test promotions regularly

2. **Production Use:**
   - Only enable sandbox when actively testing
   - Disable after testing is complete
   - Monitor for unauthorized sandbox usage

3. **User Experience:**
   - Sandbox option is clearly marked
   - Users understand it's for testing
   - Real payment option always available

## 🎯 Best Practices

1. **Environment Management:**
   - Use different env files for dev/staging/prod
   - Never commit `PAYMENT_SANDBOX_MODE=true` to production config
   - Use feature flags if available

2. **Testing:**
   - Test both payment methods
   - Verify promotions are created correctly
   - Check expiration dates
   - Test error scenarios

3. **Monitoring:**
   - Log sandbox payments separately
   - Track sandbox usage
   - Monitor for unexpected sandbox activations

## 📚 Related Documentation

- [Payment Sandbox Guide](./PAYMENT_SANDBOX_GUIDE.md) - Complete sandbox documentation
- [Promotion System Setup](./PROMOTION_SYSTEM_SETUP.md) - Promotion system details
- [Environment Setup Guide](./ENVIRONMENT_SETUP_GUIDE.md) - Environment configuration

