# Lighthouse Testing Instructions
## Quick Start Guide for Performance Testing

---

## Prerequisites

### 1. Install Lighthouse
```bash
npm install -g lighthouse chrome-launcher
```

### 2. Start Development Server
```bash
npm run dev
# Server will run on http://localhost:3000
```

---

## Running Tests

### Option 1: Automated Script (Recommended)

#### Run All Tests
```bash
node scripts/lighthouse-test.js
```

**Output Location:** `lighthouse-reports/`
- Individual JSON reports: `lighthouse-reports/{page-name}-{device}.json`
- Individual HTML reports: `lighthouse-reports/{page-name}-{device}.html`
- Summary report: `lighthouse-reports/summary.html`

#### View Results
```bash
# Open summary in browser
open lighthouse-reports/summary.html  # macOS
xdg-open lighthouse-reports/summary.html  # Linux
start lighthouse-reports/summary.html  # Windows
```

---

### Option 2: Manual CLI Testing

#### Test Single Page - Mobile
```bash
lighthouse http://localhost:3000 \
  --output=json \
  --output=html \
  --output-path=./lighthouse-reports/home-mobile \
  --preset=mobile \
  --chrome-flags="--headless"
```

#### Test Single Page - Desktop
```bash
lighthouse http://localhost:3000 \
  --output=json \
  --output=html \
  --output-path=./lighthouse-reports/home-desktop \
  --preset=desktop \
  --chrome-flags="--headless"
```

#### Test Specific Page
```bash
# Listings page
lighthouse http://localhost:3000/listings \
  --output=html \
  --output-path=./lighthouse-reports/listings-mobile \
  --preset=mobile

# Profile page (requires authentication)
lighthouse http://localhost:3000/profile \
  --output=html \
  --output-path=./lighthouse-reports/profile-mobile \
  --preset=mobile \
  --extra-headers='{"Cookie":"sb-access-token=YOUR_TOKEN"}'
```

---

### Option 3: Chrome DevTools (Visual UI)

#### Steps:
1. Open Chrome browser
2. Navigate to page: `http://localhost:3000`
3. Open DevTools: `F12` or `Right-click → Inspect`
4. Click **"Lighthouse"** tab
5. Select categories:
   - ✅ Performance
   - ✅ Accessibility
   - ✅ Best Practices
   - ✅ SEO
6. Select device: **Mobile** or **Desktop**
7. Click **"Analyze page load"**
8. Wait for analysis to complete
9. Review results
10. Export: Click **"⋮"** → **"Save as HTML"** or **"Save as JSON"**

---

## Testing Authenticated Pages

Some pages require login: `/profile`, `/post`, `/messages`, `/wanted/post`

### Method 1: Manual Login + DevTools
```
1. Open Chrome browser
2. Login to the application manually
3. Navigate to authenticated page
4. Open DevTools (F12)
5. Run Lighthouse from DevTools
```

### Method 2: Export Auth Cookies
```bash
# 1. Login manually in Chrome
# 2. Open DevTools → Application → Cookies
# 3. Copy the auth token values

# 4. Use in CLI
lighthouse http://localhost:3000/profile \
  --extra-headers='{"Cookie":"sb-access-token=YOUR_TOKEN; sb-refresh-token=YOUR_REFRESH_TOKEN"}' \
  --output=html \
  --preset=mobile
```

### Method 3: Puppeteer Script (Advanced)
```javascript
// test-auth-pages.js
const puppeteer = require('puppeteer')
const lighthouse = require('lighthouse')

async function testAuthPage(url) {
  const browser = await puppeteer.launch()
  const page = await browser.newPage()

  // Login
  await page.goto('http://localhost:3000')
  await page.click('[data-auth-button]')
  await page.type('[name=email]', process.env.TEST_EMAIL)
  await page.type('[name=password]', process.env.TEST_PASSWORD)
  await page.click('[type=submit]')
  await page.waitForNavigation()

  // Get auth cookies
  const cookies = await page.cookies()

  // Run Lighthouse
  const result = await lighthouse(url, {
    port: new URL(browser.wsEndpoint()).port,
    output: 'html',
    logLevel: 'info',
  })

  await browser.close()
  return result
}

// Run
testAuthPage('http://localhost:3000/profile')
```

---

## Understanding Results

### Performance Score
```
Score    Status         Action Required
────────────────────────────────────────────
90-100   ✅ Excellent   No immediate action
80-89    🟨 Good        Minor optimizations
50-79    🟧 Needs Work  Significant issues
0-49     🟥 Poor        Critical problems
```

### Core Web Vitals

#### Largest Contentful Paint (LCP)
How long until main content loads
```
Good: < 2.5s  🟢
Okay: 2.5-4s  🟡
Poor: > 4s    🔴
```

#### First Input Delay (FID)
How long until page becomes interactive
```
Good: < 100ms  🟢
Okay: 100-300ms 🟡
Poor: > 300ms  🔴
```

#### Cumulative Layout Shift (CLS)
How much content jumps around
```
Good: < 0.1    🟢
Okay: 0.1-0.25 🟡
Poor: > 0.25   🔴
```

### Key Metrics

#### First Contentful Paint (FCP)
Time until first content appears
```
Good: < 1.8s
Okay: 1.8-3s
Poor: > 3s
```

#### Time to Interactive (TTI)
Time until page is fully interactive
```
Good: < 3.8s
Okay: 3.8-7.3s
Poor: > 7.3s
```

#### Total Blocking Time (TBT)
Time main thread is blocked
```
Good: < 200ms
Okay: 200-600ms
Poor: > 600ms
```

---

## Analyzing Reports

### HTML Report Sections

#### 1. Performance
- **Metrics:** LCP, FCP, TTI, TBT, CLS, Speed Index
- **Opportunities:** Actionable improvements with estimated savings
- **Diagnostics:** Additional performance insights

#### 2. Opportunities (High Priority)
Look for:
- 🟧 **Eliminate render-blocking resources**
- 🟧 **Properly size images**
- 🟧 **Defer offscreen images**
- 🟧 **Minify JavaScript**
- 🟧 **Remove unused JavaScript**
- 🟧 **Serve images in next-gen formats**

#### 3. Diagnostics (Medium Priority)
Common issues:
- 🟨 Large JavaScript execution time
- 🟨 Avoid enormous network payloads
- 🟨 Minimize main-thread work
- 🟨 Reduce JavaScript execution time

### JSON Report Analysis
```javascript
// Load report
const report = require('./lighthouse-reports/home-mobile.json')

// Extract key metrics
const metrics = report.audits.metrics.details.items[0]
console.log('LCP:', metrics.largestContentfulPaint, 'ms')
console.log('FCP:', metrics.firstContentfulPaint, 'ms')
console.log('TTI:', metrics.interactive, 'ms')
console.log('TBT:', metrics.totalBlockingTime, 'ms')
console.log('CLS:', metrics.cumulativeLayoutShift)

// Get performance score
const score = report.categories.performance.score * 100
console.log('Performance Score:', score)

// Get opportunities
const opportunities = Object.values(report.audits)
  .filter(audit => audit.score !== null && audit.score < 1)
  .sort((a, b) => b.numericValue - a.numericValue)

console.log('Top 5 Opportunities:')
opportunities.slice(0, 5).forEach(opp => {
  console.log(`- ${opp.title}: ${opp.displayValue}`)
})
```

---

## Pages to Test (14 Total)

### Public Pages (No Auth)
```
✅ Home                    http://localhost:3000
✅ Browse Listings         http://localhost:3000/listings
✅ Listing Detail         http://localhost:3000/listings/[id]
✅ Browse Wanted          http://localhost:3000/wanted
✅ Wanted Detail          http://localhost:3000/wanted/[id]
✅ Wanted Search          http://localhost:3000/wanted/search
✅ Cars by Make           http://localhost:3000/lk/cars/toyota
✅ Cars by Model          http://localhost:3000/lk/cars/toyota/prius
✅ Business Profile       http://localhost:3000/business/[id]
✅ Forgot Password        http://localhost:3000/forgot-password
✅ Reset Password         http://localhost:3000/reset-password
```

### Authenticated Pages (Requires Login)
```
🔒 User Profile           http://localhost:3000/profile
🔒 Post Listing          http://localhost:3000/post
🔒 Post Wanted Request   http://localhost:3000/wanted/post
```

---

## Troubleshooting

### Error: "Chrome not found"
```bash
# Install Chrome/Chromium
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# macOS:
brew install --cask google-chrome

# Or specify Chrome path:
lighthouse http://localhost:3000 \
  --chrome-flags="--chrome-path=/path/to/chrome"
```

### Error: "Port already in use"
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
npm run dev -- -p 3001
lighthouse http://localhost:3001
```

### Error: "Connection refused"
```bash
# Ensure dev server is running
npm run dev

# Wait for server to start
# Look for: "Ready - started server on 0.0.0.0:3000"
```

### Slow Test Execution
```bash
# Disable throttling for faster tests (not recommended for accurate results)
lighthouse http://localhost:3000 \
  --throttling.cpuSlowdownMultiplier=1 \
  --throttling.rttMs=0 \
  --throttling.throughputKbps=0
```

### Reports Not Generating
```bash
# Create reports directory
mkdir -p lighthouse-reports

# Check permissions
chmod 755 lighthouse-reports

# Verify output path
lighthouse http://localhost:3000 \
  --output=html \
  --output-path=./lighthouse-reports/test.html
```

---

## CI/CD Integration

### GitHub Actions
```yaml
name: Lighthouse CI

on:
  pull_request:
    branches: [main]

jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18

      - name: Install dependencies
        run: npm ci

      - name: Build application
        run: npm run build

      - name: Start server
        run: npm start &
        env:
          PORT: 3000

      - name: Wait for server
        run: npx wait-on http://localhost:3000

      - name: Run Lighthouse
        run: |
          npm install -g lighthouse
          lighthouse http://localhost:3000 \
            --output=json \
            --output-path=./lighthouse-report.json

      - name: Upload results
        uses: actions/upload-artifact@v3
        with:
          name: lighthouse-report
          path: lighthouse-report.json
```

---

## Next Steps

### After Running Tests

1. **Review Performance Analysis:**
   - Read: `/docs/LIGHTHOUSE_PERFORMANCE_ANALYSIS.md`
   - Identify critical issues from reports

2. **Prioritize Optimizations:**
   - Phase 1: Image optimization, bundle analysis
   - Phase 2: Code splitting for large components
   - Phase 3: Advanced optimizations

3. **Implement Fixes:**
   - Follow recommendations in analysis document
   - Re-test after each phase
   - Compare before/after metrics

4. **Monitor Continuously:**
   - Set up performance budgets
   - Integrate Lighthouse CI
   - Track Core Web Vitals in production

---

## Additional Resources

### Documentation
- [Lighthouse Performance Analysis](./LIGHTHOUSE_PERFORMANCE_ANALYSIS.md)
- [Messaging Performance Optimization](./MESSAGING_PERFORMANCE_OPTIMIZATION.md)
- [Profile Page Mobile Optimization](./PROFILE_PAGE_MOBILE_OPTIMIZATION.md)

### Official Links
- [Lighthouse Documentation](https://github.com/GoogleChrome/lighthouse)
- [Web Vitals Guide](https://web.dev/vitals/)
- [Next.js Performance](https://nextjs.org/docs/advanced-features/measuring-performance)
- [Chrome DevTools](https://developer.chrome.com/docs/devtools/)

### Tools
- [PageSpeed Insights](https://pagespeed.web.dev/) - Test live URLs
- [WebPageTest](https://www.webpagetest.org/) - Advanced testing
- [Chrome UX Report](https://developers.google.com/web/tools/chrome-user-experience-report) - Real user data

---

## Summary

```bash
# Quick test workflow:
npm run dev                          # Start server
node scripts/lighthouse-test.js     # Run all tests
open lighthouse-reports/summary.html # View results
```

**Testing Complete!** Review the performance analysis document for detailed optimization recommendations.
