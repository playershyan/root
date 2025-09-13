# reCAPTCHA v3 Integration Guide

This guide explains how to implement reCAPTCHA v3 client-side integration for AI endpoints.

## Overview

The application now supports reCAPTCHA v3 protection for AI endpoints:
- `/api/ai-description` - Vehicle description generation
- `/api/generate-ai-guide` - AI buying guide generation

## Implementation

### 1. Environment Configuration

Add to your `.env.local`:
```bash
# Enable reCAPTCHA protection
RECAPTCHA_ENABLED=true
RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
RECAPTCHA_SECRET_KEY=your_recaptcha_v3_secret_key
# Client-side configuration
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_recaptcha_v3_site_key
```

### 2. Client-Side Integration

#### Automatic Integration (Recommended)
Use the provided `useRecaptcha` hook for automatic token generation:

```typescript
import { useRecaptcha } from '@/lib/hooks/useRecaptcha'

function MyComponent() {
  const { getAIToken } = useRecaptcha()
  
  const callAIAPI = async () => {
    // Automatically gets reCAPTCHA token
    const token = await getAIToken()
    
    const response = await fetch('/api/ai-description', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        make: 'Toyota',
        model: 'Camry',
        year: 2020,
        recaptchaToken: token // Include token in request
      })
    })
  }
}
```

#### Manual Integration
For custom implementations:

```typescript
import { recaptchaClient } from '@/lib/utils/recaptcha-client'

// Get token for specific action
const token = await recaptchaClient.getToken('ai_description')

// Or use convenience methods
const token = await recaptchaClient.getAIToken()
const guideToken = await recaptchaClient.getAIGuideToken()
```

### 3. API Request Format

Both AI endpoints now expect a `recaptchaToken` field:

#### `/api/ai-description`
```javascript
const response = await fetch('/api/ai-description', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    make: 'Toyota',
    model: 'Camry', 
    year: 2020,
    mileage: 50000,
    fuel_type: 'Petrol',
    transmission: 'Automatic',
    additionalInfo: 'Well maintained',
    recaptchaToken: token // Required when RECAPTCHA_ENABLED=true
  })
})
```

#### `/api/generate-ai-guide`
```javascript
const response = await fetch('/api/generate-ai-guide', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    searchContext: 'Toyota Camry in Colombo',
    recaptchaToken: token // Required when RECAPTCHA_ENABLED=true
  })
})
```

### 4. Error Handling

The API returns specific errors for reCAPTCHA failures:

```javascript
try {
  const response = await fetch('/api/ai-description', { ... })
  const data = await response.json()
  
  if (!response.ok) {
    if (data.error === 'reCAPTCHA verification failed') {
      console.log('reCAPTCHA failed, minimum score:', data.minScore)
      // Handle reCAPTCHA failure (retry, show message, etc.)
    }
  }
} catch (error) {
  console.error('Request failed:', error)
}
```

### 5. Configuration Options

#### Score Threshold
The default minimum score is 0.3. You can customize this in the API routes:

```typescript
// In route.ts
const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.5)) {
  return captchaGuardFailJson(0.5) // Custom threshold
}
```

#### Development Mode
When `RECAPTCHA_ENABLED=false`, the system works without reCAPTCHA:
- Client returns `null` tokens (handled gracefully)
- Server accepts requests without validation
- No impact on development workflow

## Testing

### Development Testing
1. Set `RECAPTCHA_ENABLED=false` in `.env.local`
2. Test endpoints work without reCAPTCHA
3. Enable reCAPTCHA for production testing

### Production Testing  
1. Get reCAPTCHA v3 keys from Google Console
2. Set `RECAPTCHA_ENABLED=true`
3. Test with valid domain
4. Monitor scores in Google Console

## Security Considerations

1. **Server-side validation**: All validation happens server-side
2. **Score-based filtering**: Requests with low scores are blocked  
3. **IP validation**: Client IP is sent to Google for validation
4. **Rate limiting**: Combine with existing rate limiting for best protection
5. **Graceful degradation**: System works when reCAPTCHA is unavailable

## Troubleshooting

### Common Issues

1. **"reCAPTCHA verification failed"**
   - Check site key configuration
   - Verify domain is registered in Google Console
   - Check browser console for JavaScript errors

2. **Low scores**
   - Test with different browsers/devices
   - Check for bot-like behavior patterns
   - Consider lowering threshold for testing

3. **Script loading failures**
   - Check network connectivity
   - Verify site key is valid
   - Check browser security settings

### Debug Mode
Enable debug logging:

```typescript
// Temporary debug logging
const token = await getAIToken()
console.log('reCAPTCHA token generated:', token ? 'success' : 'failed')
```

## Implementation Status

✅ **Completed:**
- Client-side reCAPTCHA utilities (`/lib/utils/recaptcha-client.ts`)
- React hook for easy integration (`/lib/hooks/useRecaptcha.ts`)
- Server-side verification system (`/lib/security/recaptcha.ts`)
- Environment configuration updated
- Both AI endpoints updated with token support
- Automatic token generation in existing UI components

🔧 **Manual Steps Required:**
1. Get reCAPTCHA v3 keys from Google Console
2. Add keys to environment variables
3. Set `RECAPTCHA_ENABLED=true` when ready
4. Test in production environment

The implementation provides robust protection while maintaining developer experience and graceful degradation.
# reCAPTCHA Integration Guide (AI, Reports, OTP, Uploads)

This project supports Google reCAPTCHA v3 on several abuse‑prone endpoints.

Client setup:
- Set `NEXT_PUBLIC_RECAPTCHA_SITE_KEY` in env.
- The app’s `useRecaptcha` hook loads the script and exposes `getToken()`.

Endpoints requiring/accepting reCAPTCHA:
- `/api/ai-description` (JSON, required when `RECAPTCHA_ENABLED=true`)
- `/api/generate-ai-guide` (JSON, required when `RECAPTCHA_ENABLED=true`)
- `/api/reports/create` (JSON, required when `RECAPTCHA_ENABLED=true`)
- `/api/auth/send-phone-otp` (JSON, required when `RECAPTCHA_ENABLED=true`)
- `/api/upload` and `/api/upload/cloudinary` (FormData):
  - If `RECAPTCHA_UPLOAD_REQUIRED=true`, a token is required.
  - Otherwise, a provided token will be validated if present.

Form field/header names:
- JSON routes: `recaptchaToken` in request body.
- Upload routes: include `recaptchaToken` in `FormData` or `x-recaptcha-token` header.

Enable in production by setting:
```
RECAPTCHA_ENABLED=true
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=...
RECAPTCHA_SECRET_KEY=...
```
