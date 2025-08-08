# Sentry Error Tracking Setup Guide

## Installation Complete
Sentry has been installed and configured for your AutoTrader.lk application.

## Quick Start (5 minutes)

### 1. Create Sentry Account
1. Go to [sentry.io](https://sentry.io) and sign up (free tier available)
2. Create a new project and select "Next.js"
3. Copy your DSN (Data Source Name) - it looks like: `https://xxxxx@xxxxx.ingest.sentry.io/xxxxx`

### 2. Set Environment Variables
Create/update your `.env.local` file with:

```env
# Sentry Configuration
NEXT_PUBLIC_SENTRY_DSN=https://your-dsn@sentry.ingest.sentry.io/project-id
SENTRY_ORG=your-org-slug
SENTRY_PROJECT=your-project-slug
```

### 3. Test the Integration

**Development Testing:**
1. Start your dev server: `npm run dev`
2. Visit your homepage - you'll see a red "Sentry Test Controls" button in bottom-left
3. Click "Test Error" - this sends test errors to Sentry
4. Check your Sentry dashboard for the errors

**Production Testing:**
1. Add `?sentry-test` to any URL to show test controls in production
2. Example: `https://yourdomain.com?sentry-test`

### 4. Production Deployment
Your production environment needs these variables:
- `NEXT_PUBLIC_SENTRY_DSN` (public - goes to client)
- `SENTRY_ORG` (private - for source maps)
- `SENTRY_PROJECT` (private - for source maps)

## What You Get

### Automatic Error Tracking
- All JavaScript errors are automatically captured
- Server-side errors from API routes
- Unhandled promise rejections
- React component errors (via Error Boundary)

### Enhanced Error Context
Every error includes:
- User browser and device info
- URL where error occurred
- Stack traces with source maps
- Custom tags (component name, action, etc.)
- User actions leading up to error

### Performance Monitoring
- API response times
- Database query performance
- Page load times
- Core Web Vitals

### Session Replay (10% of sessions)
- See exactly what users did before errors
- Visual reproduction of user sessions
- Helps debug complex user interaction issues

## 🔍 Sentry Dashboard Features

### Issues Tab
- All errors grouped by type
- Error frequency and trends
- Which users are affected
- Stack traces and context

### Performance Tab
- Slow API endpoints
- Database query performance
- Page load metrics

### Alerts
- Email/Slack notifications for new errors
- Threshold alerts (e.g., >10 errors/hour)
- Regression alerts (new errors after deployment)

## Custom Error Handling

Your app now has enhanced error handling:

```typescript
// Automatic error tracking for your existing error handlers
import { logError } from '@/lib/utils/errorHandling'

// This now automatically sends to Sentry in production
logError({
  type: 'api',
  message: 'Payment processing failed',
  details: 'Credit card validation error',
  retryable: true
}, 'payment_flow', {
  userId: user.id,
  amount: 1500
})
```

## 📝 Monitoring Your App

### Daily Monitoring
1. Check Sentry dashboard for new errors
2. Review error frequency trends
3. Monitor performance metrics

### Weekly Reviews
1. Analyze most common errors
2. Review user feedback reports
3. Check if error rates increased after deployments

### Setting Up Alerts
1. Go to Sentry Settings > Alerts
2. Create alert for "New Issue"
3. Add email/Slack notifications
4. Set threshold alerts (e.g., >5 errors in 1 hour)

## Production Optimization

### Error Rate Targets
- **Good:** <0.1% error rate (1 error per 1000 requests)
- **Warning:** 0.1-1% error rate
- **Critical:** >1% error rate

### Key Metrics to Watch
1. **Unhandled Errors:** Should be near 0
2. **API Errors:** Database/network issues
3. **User Errors:** Form validation, user input
4. **Performance:** API response times <2s

## Privacy & Compliance

### Data Filtering
Sentry is configured to:
- Filter out browser extension errors
- Mask sensitive data in session replays
- Exclude non-actionable network errors

### GDPR Compliance
- No personal data is sent to Sentry by default
- Session replays mask all text/media
- Users can opt-out if needed

## Support & Troubleshooting

### Common Issues
1. **No errors showing:** Check DSN in environment variables
2. **Source maps missing:** Verify SENTRY_ORG and SENTRY_PROJECT
3. **Too many errors:** Add filters in beforeSend function

### Getting Help
- [Sentry Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Next.js Integration Guide](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- Sentry Community Discord

## Removing Test Component
After confirming Sentry works, remove the test button:
1. Remove `<SentryTestButton />` from `app/page.tsx`
2. Delete `app/components/SentryTestButton.tsx`

---

**Congratulations!** Your AutoTrader.lk app now has enterprise-grade error monitoring. You'll be notified of issues before users even report them!