# DDoS and Abuse Mitigation Implementation Guide

## Overview

This guide documents the comprehensive DDoS and abuse mitigation system implemented for the vera.lk application, following security best practices and recommendations.

## Implementation Status ✅

### 1. **Persistent, Distributed Rate Limiting** ✅
**Location:** `lib/security/redis-rate-limiter.ts`

- **Redis/Upstash Integration:** Token bucket and sliding window algorithms
- **Multiple Limiter Types:**
  - API: 100 req/min with burst of 20
  - Auth: 5 attempts/15 min (credential stuffing protection)
  - OTP: 3/hour (SMS bombing prevention)
  - AI: 10/min + 100/day dual limits
  - Upload: 10/hour (storage abuse prevention)
  - Admin: 50/min
  - Strict: 3/hour (password reset, account deletion)

- **Features:**
  - Automatic fallback to in-memory when Redis unavailable
  - IP quarantine with exponential backoff
  - Analytics tracking for monitoring

### 2. **Enhanced reCAPTCHA Integration** ✅
**Location:** `lib/security/security-middleware.ts`

Protected endpoints:
- `/api/auth/send-email-otp`
- `/api/auth/send-phone-otp`
- `/api/auth/verify-email-otp`
- `/api/auth/verify-phone-otp`
- `/api/reports/create`
- `/api/contact`
- `/api/upload`
- `/api/ai-description`
- `/api/generate-ai-guide`

### 3. **Strict Payload Size Limits** ✅
**Location:** `lib/security/security-middleware.ts`

Endpoint-specific limits:
- Auth/OTP: 2-5KB
- AI: 25KB
- Contact/Report: 10KB
- Messaging: 50KB
- Listings/Profile: 50-100KB
- Uploads: 10MB

### 4. **Request Timeouts & Circuit Breakers** ✅
**Location:** `lib/utils/fetch-with-retry.ts`

- **Timeouts:** 30s default, configurable per request
- **Circuit Breaker:** Prevents hammering failed services
- **Auto-recovery:** After 1 minute cooldown

### 5. **Exponential Backoff with Jitter** ✅
**Location:** `lib/utils/fetch-with-retry.ts`

- **Retry Logic:** 3 attempts by default
- **Backoff:** 1s → 2s → 4s (configurable)
- **Jitter:** ±30% to prevent thundering herd
- **Retry-After:** Honors server headers

### 6. **Security Monitoring & Alerting** ✅
**Location:** `lib/monitoring/security-monitoring.ts`

- **Metrics Tracked:**
  - Rate limit violations
  - reCAPTCHA failures
  - Payload size violations
  - Auth failures
  - Quarantined IPs
  - Error rates
  - Response times

- **Alert Types:**
  - Rate limit spikes (>50/min)
  - Captcha failures (>20/min)
  - Error spikes (>10%)
  - Slow responses (>5s)
  - DDoS patterns (>10 quarantined IPs)

- **Severity Levels:** low, medium, high, critical

## Configuration

### Environment Variables

Add to `.env.local`:

```bash
# Redis/Upstash Configuration
UPSTASH_REDIS_REST_URL=your_upstash_redis_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_redis_token

# Rate Limiting
AI_RATE_LIMIT_PER_MINUTE=10
AI_DAILY_LIMIT=100

# reCAPTCHA (already configured)
RECAPTCHA_ENABLED=true
RECAPTCHA_SITE_KEY=6Lekc8crAAAAAODMqGjv2kNlM86uPP5atdJGRtid
RECAPTCHA_SECRET_KEY=6Lekc8crAAAAAAeIVydrj-OuLDakQof4ZgZzuWXf
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lekc8crAAAAAODMqGjv2kNlM86uPP5atdJGRtid
```

## Usage Examples

### 1. Apply Security Middleware to API Routes

```typescript
// In your API route handler
import { securityMiddleware } from '@/lib/security/security-middleware'

export async function POST(request: NextRequest) {
  // Apply security checks
  const securityCheck = await securityMiddleware(request, {
    endpoint: '/api/your-endpoint',
    rateLimit: 'api',        // or 'auth', 'ai', 'upload', etc.
    requireAuth: false,      // Require authentication?
    requireCaptcha: true,    // Require reCAPTCHA?
  })
  
  if (securityCheck) {
    return securityCheck // Return 429/403/413 response
  }
  
  // Your handler logic here
}
```

### 2. Use Enhanced Fetch Client

```typescript
import { fetchWithRetry, apiClient } from '@/lib/utils/fetch-with-retry'

// With retry and timeout
const response = await fetchWithRetry('/api/endpoint', {
  maxRetries: 3,
  timeout: 15000,
  onRetry: (attempt) => console.log(`Retry ${attempt}`)
})

// Or use the API client
const data = await apiClient.get('/endpoint')
```

### 3. Monitor Security Events

```typescript
import { securityMonitor } from '@/lib/monitoring/security-monitoring'

// Record security event
securityMonitor.recordEvent('rate_limit', { 
  ip: '1.2.3.4',
  endpoint: '/api/ai-description' 
})

// Get health status
const health = securityMonitor.getHealthStatus()
console.log('System status:', health.status) // 'healthy' | 'degraded' | 'critical'

// Get unacknowledged alerts
const alerts = securityMonitor.getAlerts()
```

## Edge/WAF Configuration (Vercel/Cloudflare)

### Vercel Edge Config
Add to `vercel.json`:

```json
{
  "functions": {
    "app/api/*": {
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "X-Content-Type-Options",
          "value": "nosniff"
        },
        {
          "key": "X-Frame-Options",
          "value": "DENY"
        },
        {
          "key": "X-XSS-Protection",
          "value": "1; mode=block"
        }
      ]
    }
  ]
}
```

### Cloudflare Configuration
If using Cloudflare:

1. **Enable DDoS Protection:** Under Attack Mode for emergencies
2. **Rate Limiting Rules:**
   - `/api/*`: 100 requests/minute per IP
   - `/api/auth/*`: 5 requests/15 minutes per IP
   - `/api/ai-*`: 10 requests/minute per IP

3. **WAF Rules:**
   - Block known bad IPs/ASNs
   - Challenge suspicious patterns
   - Geo-restrictions if needed

4. **Bot Management:**
   - Enable Bot Fight Mode
   - Custom rules for AI endpoints

## Testing

### Test Rate Limiting
```bash
# Test rate limit (should fail after limit)
for i in {1..15}; do
  curl -X POST http://localhost:3000/api/ai-description \
    -H "Content-Type: application/json" \
    -d '{"make":"Toyota","model":"Camry","year":2020}'
done
```

### Test Payload Size Limits
```bash
# Should fail with 413 Payload Too Large
curl -X POST http://localhost:3000/api/auth/send-otp \
  -H "Content-Type: application/json" \
  -d "$(python -c 'print("{\"data\":\"" + "x"*10000 + "\"}")')"
```

### Monitor Health
```bash
# Check system health
curl http://localhost:3000/api/admin/health
```

## Security Checklist

✅ **Infrastructure:**
- [ ] Redis/Upstash configured for distributed rate limiting
- [ ] Cloudflare/Vercel Edge protection enabled
- [ ] SSL/TLS enforced

✅ **Application:**
- [x] Rate limiting on all endpoints
- [x] reCAPTCHA on sensitive anonymous flows
- [x] Payload size validation
- [x] Request timeouts
- [x] Exponential backoff on client
- [x] Circuit breaker pattern
- [x] IP quarantine system

✅ **Monitoring:**
- [x] Security event logging
- [x] Anomaly detection
- [x] Alert system
- [ ] External monitoring integration (Sentry/DataDog)
- [ ] Incident response playbook

✅ **Headers & Policies:**
- [x] Security headers (X-Frame-Options, etc.)
- [x] CORS properly configured
- [ ] CSP (Content Security Policy) - complex, implement when assets finalized

## Incident Response

### DDoS Attack Response
1. **Detection:** Monitor alerts for DDoS patterns
2. **Immediate:** Enable Cloudflare Under Attack Mode
3. **Analysis:** Check security metrics, identify patterns
4. **Mitigation:** Update rate limits, block IPs/ASNs
5. **Recovery:** Gradually restore normal operations
6. **Post-mortem:** Document attack, update defenses

### Rate Limit Tuning
Monitor false positives and adjust limits:
```typescript
// In redis-rate-limiter.ts
api: new Ratelimit({
  limiter: Ratelimit.tokenBucket(200, '1 m', 40), // Increased if needed
})
```

## Maintenance

### Regular Tasks
- **Weekly:** Review security alerts and metrics
- **Monthly:** Analyze rate limit effectiveness
- **Quarterly:** Security audit and penetration testing
- **Ongoing:** Monitor and tune thresholds

### Scaling Considerations
- Move to dedicated Redis cluster for high traffic
- Implement geographic rate limiting
- Add machine learning for anomaly detection
- Consider CDN with edge workers for global protection

## Next Steps

1. **Set up Upstash Redis:**
   - Create account at https://upstash.com
   - Create Redis database
   - Add credentials to environment

2. **Configure monitoring:**
   - Set up Sentry alerts
   - Configure PagerDuty for critical alerts
   - Add Slack notifications

3. **Test thoroughly:**
   - Load testing with k6 or Artillery
   - Security scanning with OWASP ZAP
   - Penetration testing

4. **Documentation:**
   - Create incident response playbook
   - Document rate limit policies for users
   - Update API documentation

This implementation provides comprehensive protection against DDoS attacks and abuse while maintaining good user experience through graceful degradation and intelligent retry mechanisms.