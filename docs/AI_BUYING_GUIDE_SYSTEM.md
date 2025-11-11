# AI Buying Guide System

## Overview

Pre-generated, cached buying guides for vehicle models. Guides are served exclusively from cache with zero real-time AI generation on user requests.

---

## Architecture

### Components

1. **API Endpoint**: `/api/generate-ai-guide`
2. **Database Table**: `buying_guides_cache`
3. **Extraction Utility**: `lib/utils/vehicleExtraction.ts`
4. **Cache Service**: `lib/services/guideCache.ts`
5. **Generation Scripts**:
   - `scripts/generate-buying-guides.ts`
   - `scripts/clean-expired-guides.ts`
6. **Cron Jobs**:
   - `/api/cron/generate-guides` (Weekly: Sunday 00:00 UTC)
   - `/api/cron/clean-guides` (Daily: 02:00 UTC)

---

## Request Flow

```
User searches "Toyota Prius 2018"
  ↓
POST /api/generate-ai-guide { searchContext: "Toyota Prius 2018" }
  ↓
Sanitize input → Extract make/model/year
  ↓
Generate cache keys (priority order):
  1. guide:toyota:prius:2018 (specific year)
  2. guide:toyota:prius:gen_2015-2019 (generation)
  3. guide:toyota:prius:general (fallback)
  ↓
Query database for ANY matching key (specificity DESC)
  ↓
Return guide OR { available: false, message: "AI overview not available" }
```

---

## Cache Key Structure

| Specificity | Format | Example |
|-------------|--------|---------|
| 2 (Highest) | `guide:{make}:{model}:{year}` | `guide:toyota:prius:2018` |
| 1 (Medium) | `guide:{make}:{model}:gen_{range}` | `guide:toyota:prius:gen_2015-2019` |
| 0 (General) | `guide:{make}:{model}:general` | `guide:toyota:prius:general` |

**Database Query:**
```sql
SELECT * FROM buying_guides_cache
WHERE cache_key IN (
  'guide:toyota:prius:2018',
  'guide:toyota:prius:gen_2015-2019',
  'guide:toyota:prius:general'
)
AND expires_at > NOW()
ORDER BY specificity DESC
LIMIT 1;
```

---

## Input Sanitization

### Dangerous Pattern Removal

```typescript
// Blocks:
- <script>, <iframe>, javascript:, onerror=
- SQL injection: DROP, DELETE, INSERT, UPDATE
- Template injection: {, }, `, $
- HTML tags: <...>
```

### Length Limits

- Input: 100 characters max
- Payload: 25KB max

### Normalization

- Trim whitespace
- Collapse multiple spaces
- Case-insensitive matching

---

## Entity Extraction

### Make Extraction

- Matches against known makes from `vehicleData.ts`
- Whole-word match preferred
- Longest match wins (e.g., "Mercedes-Benz" > "Mercedes")

### Model Extraction

- Only searches models for matched make
- Ignores "Other" as valid match
- Whole-word match preferred

### Year Extraction

- Regex: `\b(199\d|20[0-2]\d)\b`
- Valid range: 1990 to current year + 1
- Uses last year found in query

---

## Response Formats

### Success

```json
{
  "available": true,
  "make": "Toyota",
  "model": "Prius",
  "year": 2018,
  "generation": "2015-2019",
  "compact": "<p>...</p><ul>...</ul>",
  "detailed": "<p>...</p><ul>...</ul><div>...</div>"
}
```

### Not Available

```json
{
  "available": false,
  "message": "AI overview not available"
}
```

**Cases:**
- No make matched
- Make matched but no model
- No cached guide exists
- Error during retrieval

---

## Guide Generation

### OpenAI Configuration

```typescript
{
  model: 'gpt-4o-mini',
  temperature: 0.3,  // Low for consistency
  max_completion_tokens: 400,
  // Cost: ~$0.0003 per guide
}
```

### Prompt Rules

- Output: HTML only
- Length: 150 words max
- Tone: Neutral, factual, technical
- Forbidden: Hype, sales talk, opinions, emotion, exclamation marks
- Context: Sri Lankan conditions (roads, climate, resale)

### Structure

```html
<p>Two-line overview...</p>
<ul>
  <li><strong>Engine:</strong> Mechanical checks</li>
  <li><strong>Body:</strong> Physical inspection</li>
  <li><strong>Documents:</strong> Papers to verify</li>
  <li><strong>Test Drive:</strong> Aspects to observe</li>
</ul>
```

---

## Cache Management

### TTL

- **30 days** from creation
- Auto-expires via database query filter
- Daily cleanup cron removes expired rows

### Pre-generated Vehicles

Currently configured for top 8 models × 3 guides each = 24 guides:

- Toyota Prius (general, 2015-2019, 2020-2024)
- Toyota Aqua (general, 2015-2019, 2020-2024)
- Toyota Axio (general, 2015-2019, 2020-2024)
- Honda Vezel (general, 2015-2019, 2020-2024)
- Honda Fit (general, 2015-2019, 2020-2024)
- Nissan Leaf (general, 2015-2019, 2020-2024)
- Suzuki Wagon R (general, 2015-2019, 2020-2024)
- Suzuki Alto (general, 2015-2019, 2020-2024)

---

## Scripts

### Generate Guides

```bash
npm run guides:generate
```

- Generates guides for `POPULAR_VEHICLES` list
- Runs locally with 1-second delay between requests
- Shows progress and success/fail counts

### Clean Expired

```bash
npm run guides:clean
```

- Removes guides with `expires_at < NOW()`
- Returns count of deleted guides

---

## Cron Jobs

### Weekly Generation

**Schedule**: Sunday 00:00 UTC
**Endpoint**: `/api/cron/generate-guides`
**Auth**: `Authorization: Bearer ${CRON_SECRET}`
**Action**: Regenerates all guides in `POPULAR_VEHICLES`

### Daily Cleanup

**Schedule**: Daily 02:00 UTC
**Endpoint**: `/api/cron/clean-guides`
**Auth**: `Authorization: Bearer ${CRON_SECRET}`
**Action**: Deletes expired guides

---

## Security

### No reCAPTCHA

- Disabled for maximum speed
- Cache-only strategy eliminates abuse vectors
- No AI generation on user requests = no DoS risk

### No 400 Errors

- All failures return `{ available: false }`
- Consistent UX, no error exposure

### Cache Poisoning Mitigation

- Input sanitized BEFORE extraction
- Only pre-generated content served
- No user input in cached HTML
- Guides generated by backend only

---

## Metrics

Tracked via `incr()`:

- `ai.guide.cache_hit`: Guide found in cache
- `ai.guide.cache_miss`: No guide available
- `ai.guide.no_make_match`: Make not extracted
- `ai.guide.no_model_match`: Model not extracted
- `ai.guide.error`: Retrieval error

---

## Database Schema

```sql
CREATE TABLE buying_guides_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  generation TEXT,
  compact_html TEXT NOT NULL,
  detailed_html TEXT NOT NULL,
  specificity INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_buying_guides_cache_key ON buying_guides_cache(cache_key);
CREATE INDEX idx_buying_guides_make_model ON buying_guides_cache(make, model);
CREATE INDEX idx_buying_guides_expires_at ON buying_guides_cache(expires_at);
CREATE INDEX idx_buying_guides_specificity ON buying_guides_cache(specificity DESC);
```

---

## Future Enhancements

1. **Expand Vehicle List**: Add more models based on search analytics
2. **Multi-language**: Generate Sinhala/Tamil versions
3. **Comparison Guides**: "Toyota Prius vs Honda Insight"
4. **User Feedback**: Thumbs up/down on guide quality
5. **Analytics Dashboard**: Track cache hit rates, popular models
6. **Fallback Content**: Static generic guide when no cache hit

---

## Troubleshooting

### No guides available

**Check:**
1. Database table exists: `SELECT * FROM buying_guides_cache LIMIT 1;`
2. Guides not expired: `SELECT COUNT(*) FROM buying_guides_cache WHERE expires_at > NOW();`
3. Cache keys correct: `SELECT cache_key FROM buying_guides_cache;`

**Fix:**
```bash
npm run guides:generate
```

### Extraction not working

**Test extraction:**
```typescript
import { extractVehicleInfo } from '@/lib/utils/vehicleExtraction'
console.log(extractVehicleInfo('Toyota Prius 2018'))
// Should return: { make: 'Toyota', model: 'Prius', year: 2018, ... }
```

**Common issues:**
- Make/model not in `vehicleData.ts`
- Typo in user input (extraction is exact match)
- Special characters interfering

### Cron not running

**Check Vercel dashboard:**
- Deployments → Cron Jobs
- Verify schedule and last run time

**Test locally:**
```bash
curl http://localhost:3001/api/cron/generate-guides \
  -H "Authorization: Bearer ${CRON_SECRET}"
```

---

## Cost Analysis

### OpenAI Costs

- Per guide: ~$0.0003
- 24 guides/week: ~$0.0072/week = $0.37/year
- Negligible at this scale

### Database Storage

- ~5KB per guide × 50 guides = 250KB
- Negligible storage cost

### Bandwidth

- Average guide: 2KB
- 1000 requests/day × 2KB = 2MB/day = 60MB/month
- Well within free tier limits

---

## Performance

- **Cache hit**: <10ms (database query)
- **Extraction**: <5ms (in-memory operations)
- **Total response time**: <20ms
- **99th percentile**: <50ms

100x faster than real-time AI generation (4-5 seconds).
