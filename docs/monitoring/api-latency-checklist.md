## API Latency Measurement Checklist

Use this quick checklist to capture before/after timing for the newly instrumented routes.

### Browser DevTools (ideal for `/api/listings` + `/api/upload/cloudinary`)
- **Open DevTools → Network** and make sure `Disable cache` is checked.
- Trigger the flow (e.g. create listing, upload images).
- Select the API call and note `Timing → Total` (TTFB) plus the detailed `Request/Response` breakdown.
- Repeat after changes to confirm delta. Export HAR for longer comparisons if needed.

### cURL or HTTPie (scriptable baselines)
- Use the same auth token/cookies for each run.
- Example (`/api/listings`):
  ```bash
  time curl -X POST https://<host>/api/listings \
    -H "Authorization: Bearer <token>" \
    -H "Content-Type: application/json" \
    -d @payload.json
  ```
- The shell `time` output gives wall-clock duration; combine with response payload (now includes `durationMs` in logs) for correlation.

### Postman / Bruno Collections
- Set up a collection with the target endpoints (`/api/listings`, `/api/upload/cloudinary`, `/api/messaging/...`, `/api/favorites`, `/api/admin/stats`).
- Enable the built-in **Console** to watch total request time and status.
- Save runs before/after instrumentation to compare round-trip latency.

### Observability Hooks (new instrumentation)
- **API timing logs**: search for `API GET /api/... success (###ms)` in centralized logs.
- **Database timings**: look for `DB Query: <label>` entries with `durationMs` context.
- **Metrics** (Sentry / Monitoring):
  - Counters: `api.listings.*`, `uploads.cloudinary.*`, `messaging.*`, `favorites.*`, `admin.stats.*`.
  - Gauges: API response time samples via `performanceMonitor.trackApiResponseTime`.
- For spikes, correlate `durationMs` on API logs with corresponding `DB Query` durations.

### Comparing Results
- Capture a minimum of 5 consecutive runs in each environment (dev, staging, prod).
- Compute mean/median durations; note max spikes >3 s for `/api/listings` or >2 s for uploads.
- Share findings in the release notes or Slack with:
  - Before vs after average/95th percentile.
  - Screenshots of DevTools or Postman timings.
  - Any anomalous DB timings (e.g. `listings.insert` > 1000 ms).

Following this playbook ensures QA and stakeholders can verify latency improvements quickly and reference the new observability data points.

