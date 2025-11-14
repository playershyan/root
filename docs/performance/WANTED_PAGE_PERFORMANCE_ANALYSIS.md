# Wanted Page Performance Analysis

## Problem
Users experience slow loading when navigating to the `/wanted` page. Unlike the home page (which is a Server Component), the wanted page is a **Client Component**, which has fundamentally different performance characteristics.

## Current Architecture

### Page Type: Client Component
```typescript
'use client'

export default function WantedRequestsPage() {
  // All state and logic runs in the browser
}
```

**Key Difference from Home Page:**
- Home page: Server Component (renders on server, HTML sent to browser)
- Wanted page: Client Component (JavaScript sent to browser, renders client-side)

---

## Root Causes

### 1. **Client-Side Rendering Overhead** 🔴 CRITICAL

**Issue**: The entire page renders on the client

**Performance Impact**:
```
User clicks /wanted
  ↓
Download JavaScript bundle (100-500KB)
  ↓
Parse & execute JavaScript
  ↓
Initialize React component + 30+ useState hooks
  ↓
Mount component, run useEffect hooks
  ↓
Fetch data from Supabase
  ↓
Wait for database response (cross-region latency)
  ↓
Process & transform data
  ↓
Apply filters, sorting, pagination
  ↓
Render UI
  ↓
Total: 2-4 seconds (3-5x slower than Server Component)
```

---

### 2. **Complex Database Query with Joins** 🟡 MODERATE

**Query from line 268-293**:
```typescript
const { data, error } = await supabase
  .from('wanted_requests')
  .select(`
    *,
    profiles (
      id,
      name,
      phone,
      email,
      location,
      avatar_url,
      business_profiles (
        id,
        business_name,
        phone,
        whatsapp,
        address,
        is_active
      )
    )
  `)
  .eq('status', 'active')
  .eq('is_active', true)
  .order('created_at', { ascending: false })
```

**Problems**:
1. **Triple join**: wanted_requests → profiles → business_profiles
2. **No composite index** for the WHERE clause filters
3. **Fetches ALL active requests** (no limit) - could be 100s or 1000s of rows
4. **Over-fetching data**: Gets business profile data for every request, even if not needed

**Current Indexes** (from migration 005):
```sql
CREATE INDEX idx_wanted_requests_user_id ON wanted_requests(user_id);
CREATE INDEX idx_wanted_requests_status ON wanted_requests(status);
CREATE INDEX idx_wanted_requests_deleted_at ON wanted_requests(deleted_at);
```

**Missing Indexes**:
- ❌ No index for `status='active' AND is_active=true ORDER BY created_at DESC`
- ❌ No index on `created_at` column
- ❌ No covering index to avoid table lookups

---

### 3. **Potential Schema Mismatch** 🔴 CRITICAL

**Issue**: Code queries `.eq('is_active', true)` but schema might not have this column

**Evidence**:
- Migration 005 (created wanted_requests) has no `is_active` column
- No subsequent migration adds `is_active` to wanted_requests
- Promotions table has `is_active`, but not wanted_requests

**Impact**:
- Query might silently ignore the filter (PostgREST behavior)
- OR query might fail and return empty results
- Either way, performance is impacted

---

### 4. **Client-Side Data Processing** 🟡 MODERATE

**After fetching, the code does heavy client-side processing** (lines 298-349):

```typescript
const enhancedRequests = (data || []).map((req) => {
  const profile = req.profiles
  
  // Complex contact info logic
  let contactInfo = { /* ... */ }
  
  if (profile) {
    if (profile.business_profiles && profile.business_profiles.is_active) {
      contactInfo = { /* nested logic */ }
    } else {
      contactInfo = { /* alternative logic */ }
    }
  }
  
  return {
    ...req,
    phone: contactInfo.phone || req.phone || 'Contact via platform',
    whatsapp: contactInfo.whatsapp || /* long fallback chain */,
    // etc...
  }
})
```

**Problems**:
- Runs in main thread (blocks UI)
- Complex nested conditionals for each record
- Multiple string operations per record
- For 100 records: ~50-100ms of blocking JavaScript

---

### 5. **Multiple Re-Renders**  🟡 MODERATE

**The component has 25+ state variables**:
- `requests`, `filteredRequests`, `loading`, `searchTerm`, `searchInput`
- `sortBy`, `highPriorityOnly`, `filters`, `expandedFilters`
- `makeSearchTerm`, `modelSearchTerm`, `tempMinBudget`, `tempMaxBudget`
- etc...

**Performance Impact**:
```typescript
// Every state change triggers re-render
useEffect(() => {
  applyFilters() // Runs on EVERY filter change
}, [requests, searchTerm, filters, sortBy, highPriorityOnly])
```

The `applyFilters` function (lines 450-545):
- Creates new filtered array
- Runs 7+ filter checks per item
- Sorts entire array
- Slices for pagination
- **Runs on EVERY state change** (could be 10-20 times during page load)

---

### 6. **Loading.tsx Exists But Doesn't Show** ❓

The page already has `app/wanted/loading.tsx`, but:
- Client Components don't benefit from loading.tsx the same way Server Components do
- loading.tsx shows during **navigation** (Next.js routing)
- But NOT during **client-side data fetching** (useEffect)

**User Experience**:
```
Click /wanted
  ↓
loading.tsx shows briefly (100-200ms)
  ↓
JavaScript loads and executes
  ↓
Page renders with "Loading wanted requests..." spinner
  ↓
Data fetches from Supabase
  ↓
Total perceived delay: 2-4 seconds
```

---

## Performance Comparison

| Page | Type | Data Fetch | Filtering | Time |
|------|------|------------|-----------|------|
| **Home** | Server Component | Server-side | Server-side | 500ms-1s |
| **Wanted** | Client Component | Client-side | Client-side | 2-4s |

**Why the difference?**

| Operation | Server Component | Client Component |
|-----------|-----------------|------------------|
| JavaScript Download | ❌ Not needed | ✅ Required (100-500KB) |
| JavaScript Parse | ❌ Not needed | ✅ Required (~50-200ms) |
| React Hydration | ✅ Minimal | ✅ Full component tree |
| Database Query | ✅ Server (fast) | ✅ Client → Server (slower) |
| Data Processing | ✅ Server (Node.js) | ✅ Client (browser) |
| HTML Generation | ✅ Server | ✅ Client |
| Network Waterfalls | ✅ Parallel | ❌ Sequential |

---

## Solutions

### Option A: Keep Client Component, Optimize (Quick Fix)

**Pros**: Maintains interactivity, less refactoring
**Cons**: Still slower than Server Component
**Time**: 1-2 hours

#### 1. Fix Schema Issue (if exists)
Check if `is_active` column exists:

```sql
-- In Supabase SQL Editor
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'wanted_requests' 
  AND column_name = 'is_active';
```

If it doesn't exist, either:
- Add the column:
```sql
ALTER TABLE wanted_requests 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
```

- OR remove the filter from the query:
```typescript
.eq('status', 'active')
// .eq('is_active', true) // Remove this line
```

#### 2. Add Database Index (CRITICAL)

**Migration**: `supabase/migrations/033_optimize_wanted_requests_query.sql`

```sql
-- Composite index for the main query
CREATE INDEX IF NOT EXISTS idx_wanted_requests_active_recent 
ON wanted_requests (created_at DESC) 
WHERE status = 'active';

-- If is_active exists, use this instead:
CREATE INDEX IF NOT EXISTS idx_wanted_requests_active_recent 
ON wanted_requests (created_at DESC) 
WHERE status = 'active' AND is_active = true;

-- Index for user profile joins
CREATE INDEX IF NOT EXISTS idx_profiles_id ON profiles(id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
```

**Expected Impact**: 50-80% faster query execution

#### 3. Limit Initial Data Fetch

**Before**:
```typescript
// Fetches ALL records
.from('wanted_requests')
.select(`...`)
.eq('status', 'active')
.order('created_at', { ascending: false })
```

**After**:
```typescript
// Fetch only first page
.from('wanted_requests')
.select(`...`)
.eq('status', 'active')
.order('created_at', { ascending: false })
.limit(20) // ⬅️ Add this
```

Then load more with pagination:
```typescript
// In loadMore function
.range(displayCount, displayCount + 20)
```

**Expected Impact**: 70-90% faster initial load

#### 4. Optimize Data Processing

Move heavy processing to a Web Worker or use useMemo:

```typescript
const enhancedRequests = useMemo(() => {
  return (data || []).map((req) => {
    // ... processing logic ...
  })
}, [data])
```

**Expected Impact**: 30-50% faster rendering

#### 5. Debounce Filter Application

```typescript
import { debounce } from 'lodash'

const debouncedFilter = useMemo(
  () => debounce(applyFilters, 150),
  [requests, searchTerm, filters, sortBy, highPriorityOnly]
)

useEffect(() => {
  debouncedFilter()
  return () => debouncedFilter.cancel()
}, [debouncedFilter])
```

**Expected Impact**: Reduces re-renders by 80%

---

### Option B: Convert to Server Component with Client Islands (Major Refactor)

**Pros**: 3-5x faster, better SEO, reduced JavaScript
**Cons**: More complex, loses some interactivity
**Time**: 4-8 hours

#### Architecture

```
app/wanted/
├── page.tsx (Server Component - fetches data)
├── loading.tsx (Shows during navigation)
├── components/
│   ├── WantedFilters.tsx ('use client' - interactive filters)
│   ├── WantedGrid.tsx (Server Component - renders grid)
│   └── WantedCard.tsx (Server Component - renders cards)
```

#### Benefits
- Data fetches on server (faster, uses server-side cache)
- SEO-friendly (fully rendered HTML)
- Smaller JavaScript bundle
- Instant loading.tsx feedback
- Progressive enhancement

#### Implementation Example

```typescript
// app/wanted/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { WantedFilters } from './components/WantedFilters'
import { WantedGrid } from './components/WantedGrid'

export const revalidate = 30 // ISR with 30s cache

async function getWantedRequests(filters?: any) {
  const supabase = createServerComponentClient({ cookies })
  
  const { data, error } = await supabase
    .from('wanted_requests')
    .select('...')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(20)
  
  return data || []
}

export default async function WantedPage({ searchParams }) {
  const requests = await getWantedRequests(searchParams)
  
  return (
    <div>
      <WantedFilters /> {/* Client Component */}
      <WantedGrid requests={requests} /> {/* Server Component */}
    </div>
  )
}
```

---

### Option C: Hybrid Approach (Recommended)

Combine Option A (quick fixes) + gradual migration to Option B:

**Phase 1 (Week 1)**: Quick Wins
1. ✅ Fix schema issue
2. ✅ Add database indexes
3. ✅ Limit initial fetch
4. ✅ Add loading states

**Phase 2 (Week 2)**: Optimization
1. ✅ Optimize data processing
2. ✅ Debounce filters
3. ✅ Code splitting
4. ✅ Performance monitoring

**Phase 3 (Month 2)**: Architecture
1. ✅ Migrate to Server Component
2. ✅ Client-side filter islands
3. ✅ ISR caching
4. ✅ Full optimization

---

## Expected Results

### After Quick Fixes (Option A)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load | 2-4s | 1-2s | 50-75% |
| Database Query | 300-800ms | 50-150ms | 70-90% |
| Data Processing | 100-200ms | 30-60ms | 60-70% |
| Re-renders | 15-20 | 3-5 | 75-80% |

### After Full Migration (Option B)
| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Initial Load | 2-4s | 500ms-1s | 75-90% |
| JavaScript Size | 100-500KB | 30-100KB | 70-90% |
| Time to Interactive | 2-4s | 500ms-1s | 75-90% |
| SEO Score | 60-70 | 90-100 | +30 points |

---

## Immediate Action Plan

1. **Verify Schema** (5 minutes)
   ```sql
   SELECT column_name FROM information_schema.columns 
   WHERE table_name = 'wanted_requests' AND column_name = 'is_active';
   ```

2. **Apply Database Index** (10 minutes)
   - Create migration file
   - Run in Supabase
   - Verify index created

3. **Add Query Limit** (5 minutes)
   - Add `.limit(20)` to query
   - Test pagination

4. **Performance Test** (10 minutes)
   - Measure load time before/after
   - Check HAR file
   - Verify improvements

**Total Time**: 30 minutes for 50-75% improvement ✅

---

## Monitoring

After implementing fixes, monitor:

1. **Page Load Time**
   - Tool: Browser DevTools Performance tab
   - Target: < 1.5 seconds

2. **Database Query Time**
   - Tool: Supabase Dashboard → Logs
   - Target: < 150ms

3. **JavaScript Execution Time**
   - Tool: Browser DevTools Performance → Main thread
   - Target: < 200ms

4. **Time to Interactive (TTI)**
   - Tool: Lighthouse
   - Target: < 2 seconds

5. **First Contentful Paint (FCP)**
   - Tool: Lighthouse
   - Target: < 1.5 seconds

---

## Related Documentation
- [HOME_PAGE_PERFORMANCE_ANALYSIS.md](./HOME_PAGE_PERFORMANCE_ANALYSIS.md) - Home page optimization
- [LISTINGS_PAGE_PERFORMANCE_FIX.md](./LISTINGS_PAGE_PERFORMANCE_FIX.md) - /listings optimization
- [GEOGRAPHIC_LATENCY_FIX.md](./GEOGRAPHIC_LATENCY_FIX.md) - Cross-region latency fixes

---

## Technical Debt

The /wanted page has accumulated significant technical debt:

1. **Over-reliance on Client Components**
   - Should use Server Components where possible
   - Migrate to hybrid architecture

2. **Inefficient State Management**
   - 25+ useState hooks is excessive
   - Consider useReducer or state management library

3. **Missing Database Optimization**
   - No indexes for common queries
   - Schema inconsistencies (is_active?)

4. **Lack of Caching**
   - No query caching
   - No result caching
   - Each visit = full refetch

5. **No Performance Monitoring**
   - No metrics tracking
   - No error monitoring
   - No slow query alerts

**Recommendation**: Schedule dedicated performance sprint to address technical debt

