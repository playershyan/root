# /profile Optimization - Quick Reference Card

**Last Updated**: November 14, 2025

---

## At a Glance

| Stat | Value |
|------|-------|
| **Pages to Optimize** | 10 pages |
| **Current State** | 100% Client Components ❌ |
| **Target State** | Server Components + Client Islands ✅ |
| **Average Load Time** | 2-4s → 500ms-1s |
| **Average Improvement** | **75-90%** ⚡⚡⚡ |
| **Total Time** | 31-43 hours (~1-2 weeks) |
| **ROI** | Excellent 🎯 |

---

## Pages by Priority

| # | Page | Current Load | Target | Time | Impact |
|---|------|--------------|--------|------|--------|
| 1️⃣ | `/profile` | 2-4s | ~500ms | 2-3h | ⚡⚡⚡ 85-90% |
| 2️⃣ | `/profile/listings` | 1.5-3s | ~500ms | 4-5h | ⚡⚡⚡ 80-85% |
| 3️⃣ | `/profile/wanted` | 1.5-3s | ~500ms | 3-4h | ⚡⚡⚡ 85-90% |
| 4️⃣ | `/profile/favorites` | 1-2.5s | ~500ms | 3-4h | ⚡⚡ 75-80% |
| 5️⃣ | `/profile/bin` | 1-2s | ~500ms | 2-3h | ⚡⚡ 75-80% |
| 6️⃣ | `/profile/account` | 1.5-2.5s | ~750ms | 4-5h | ⚡⚡ 60-70% |
| 7️⃣ | `/profile/business` | 1-2s | ~500ms | 2-3h | ⚡⚡ 70-75% |
| 8️⃣ | `/profile/messages` | 1.5-2.5s | ~750ms | 5-6h | ⚡ 50-60% |
| 9️⃣ | `/profile/notifications` | 1-1.5s | ~750ms | 1-2h | ⚡ 30-40% |
| 🔟 | `/profile/security` | 1-1.5s | ~750ms | 1-2h | ⚡ 30-40% |

---

## Current Problems

### ❌ Problem #1: All Client Components
```typescript
'use client'  // ❌ Every single page
```
- Zero server-side rendering
- No ISR caching
- Heavy JavaScript bundles

### ❌ Problem #2: Multiple API Calls
```typescript
useBusinessProfile()   // API call #1
useListingManagement() // API call #2
useFavorites()        // API call #3
useMessaging()        // API call #4
```
- `/profile`: 4 concurrent calls
- 2-4 second load times
- Wasteful data fetching

### ❌ Problem #3: No Caching
```
Visit /profile/listings → Fetch from DB
Visit /profile         → Fetch from DB (again!)
Back to /profile/listings → Fetch from DB (again!!)
```
- 0% cache hit rate
- High database load

### ❌ Problem #4: Client-Side Filtering
```typescript
// Fetches ALL listings
const listings = await fetchAllListings()

// Filters on client (wasteful!)
const filtered = listings.filter(l => l.status === 'active')
```

### ❌ Problem #5: No Pagination
- Loads ALL listings/favorites/wanted at once
- Slow with 50+ items
- Poor mobile performance

---

## Solution Pattern

### Before (Client Component)
```typescript
'use client'

export default function Page() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    fetchData().then(setData)
  }, [])
  
  if (loading) return <Spinner />
  return <Content data={data} />
}
```

**Problems**:
- ❌ Loading spinner
- ❌ No caching
- ❌ Large JavaScript
- ❌ 2-4 second load

### After (Server Component + Islands)
```typescript
// ✅ Server Component
export const revalidate = 30

export default async function Page({ searchParams }: Props) {
  const params = await searchParams
  const data = await fetchData(params)  // Cached!
  
  return (
    <>
      <FilterDropdown />  {/* Client Island */}
      <Content data={data} />  {/* Server */}
      <LoadMore />  {/* Client Island */}
    </>
  )
}
```

**Benefits**:
- ✅ Instant load (cached)
- ✅ 30s ISR cache
- ✅ Small JavaScript
- ✅ 500ms load time

---

## Quick Start: First Migration

### Step 1: Pick `/profile` Main Page (Highest Impact)

**Why?**
- Most visited page
- 4 API calls → 1 query
- Quick win (2-3 hours)
- 85-90% improvement

### Step 2: Create Database Function (30 min)

```sql
-- File: supabase/migrations/XXX_profile_stats.sql
CREATE OR REPLACE FUNCTION get_profile_stats(user_id UUID)
RETURNS JSON AS $$
  SELECT json_build_object(
    'listings_count', (SELECT COUNT(*) FROM listings WHERE user_id = $1 AND status = 'active'),
    'favorites_count', (SELECT COUNT(*) FROM favorites WHERE user_id = $1),
    'unread_count', (SELECT COALESCE(SUM(unread_count), 0) FROM conversations WHERE buyer_id = $1),
    'has_business', (SELECT EXISTS(SELECT 1 FROM business_profiles WHERE user_id = $1 AND is_active = true))
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

Apply:
```bash
supabase db push
```

### Step 3: Create Server Fetcher (30 min)

```typescript
// File: app/profile/utils/getProfileStats.ts
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function getProfileStats(userId: string) {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data } = await supabase.rpc('get_profile_stats', { 
    user_id: userId 
  })
  
  return data || {
    listings_count: 0,
    favorites_count: 0,
    unread_count: 0,
    has_business: false
  }
}
```

### Step 4: Convert Page (60 min)

```typescript
// File: app/profile/page.tsx
import { redirect } from 'next/navigation'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { getProfileStats } from './utils/getProfileStats'
import Link from 'next/link'

export const revalidate = 60  // Cache 60s

export default async function ProfileLandingPage() {
  const cookieStore = await cookies()
  const supabase = createServerComponentClient({ 
    cookies: () => cookieStore 
  })
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/')
  
  const stats = await getProfileStats(user.id)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <h1 className="text-3xl font-bold mb-8">Profile</h1>
        
        {/* Personal Section */}
        <section>
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Personal
          </h2>
          <div className="bg-white rounded-lg shadow-sm border">
            <Link href="/profile/account" className="block px-4 py-4 hover:bg-gray-50">
              Account Settings
            </Link>
            <Link href="/profile/security" className="block px-4 py-4 hover:bg-gray-50">
              Security & Privacy
            </Link>
          </div>
        </section>
        
        {/* Content Section */}
        <section className="mt-8">
          <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
            Content
          </h2>
          <div className="bg-white rounded-lg shadow-sm border">
            <Link href="/profile/listings" className="block px-4 py-4 hover:bg-gray-50">
              <span>My Listings</span>
              {stats.listings_count > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {stats.listings_count}
                </span>
              )}
            </Link>
            <Link href="/profile/favorites" className="block px-4 py-4 hover:bg-gray-50">
              <span>Favorites</span>
              {stats.favorites_count > 0 && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">
                  {stats.favorites_count}
                </span>
              )}
            </Link>
            <Link href="/profile/messages" className="block px-4 py-4 hover:bg-gray-50">
              <span>Messages</span>
              {stats.unread_count > 0 && (
                <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded-full">
                  {stats.unread_count}
                </span>
              )}
            </Link>
          </div>
        </section>
        
        {/* Business Section (conditional) */}
        {stats.has_business && (
          <section className="mt-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase mb-3">
              Business
            </h2>
            <div className="bg-white rounded-lg shadow-sm border">
              <Link href="/profile/business" className="block px-4 py-4 hover:bg-gray-50">
                Business Profile
              </Link>
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
```

### Step 5: Test (30 min)

```bash
# Build and test
npm run build
npm run start

# Open: http://localhost:3000/profile
```

**Test Checklist**:
- [ ] Page loads instantly
- [ ] All counts display correctly
- [ ] Navigation works
- [ ] Business section shows/hides correctly
- [ ] No console errors
- [ ] Performance improved (check Network tab)

### Step 6: Measure Results

**Before**:
- Load time: 2-4s
- API calls: 4
- JavaScript: ~150KB

**After**:
- Load time: ~500ms (85% faster!) ⚡⚡⚡
- API calls: 1 (75% fewer)
- JavaScript: ~30KB (80% smaller)

---

## Common Issues & Solutions

### Issue #1: `cookies()` Error

**Error**: `cookies is not a function`

**Solution**:
```typescript
// ❌ Wrong (Next.js 14)
const supabase = createServerComponentClient({ cookies })

// ✅ Correct (Next.js 15)
const cookieStore = await cookies()
const supabase = createServerComponentClient({ 
  cookies: () => cookieStore 
})
```

### Issue #2: `searchParams` Error

**Error**: `Cannot read properties of promise`

**Solution**:
```typescript
// ❌ Wrong
export default async function Page({ searchParams }: Props) {
  const filter = searchParams.status  // Error!
}

// ✅ Correct
export default async function Page({ searchParams }: Props) {
  const params = await searchParams  // Await it!
  const filter = params.status
}
```

### Issue #3: Client Component in Server Component

**Error**: `'use client' directive in Server Component`

**Solution**: Extract interactive parts to separate files
```typescript
// ❌ Wrong
'use client'
export default function Page() {
  // Entire page is client
}

// ✅ Correct
// page.tsx (Server Component)
export default async function Page() {
  const data = await fetchData()
  return (
    <>
      <StaticContent data={data} />
      <InteractivePart />  {/* Client Island */}
    </>
  )
}

// components/InteractivePart.tsx (Client Component)
'use client'
export function InteractivePart() {
  // Interactive logic here
}
```

---

## Week-by-Week Plan

### Week 1: Priority 1 (6-8 hours)
- [x] Analyze `/profile` (Done)
- [ ] Migrate `/profile` main page (2-3h)
- [ ] Migrate `/profile/listings` (4-5h)
- [ ] Measure improvements

**Goal**: 2 pages optimized, 85%+ improvement

### Week 2: Priority 2 (8-11 hours)
- [ ] Migrate `/profile/wanted` (3-4h)
- [ ] Migrate `/profile/favorites` (3-4h)
- [ ] Migrate `/profile/bin` (2-3h)

**Goal**: 5 pages total optimized

### Week 3: Priority 3 (11-14 hours)
- [ ] Migrate `/profile/account` (4-5h)
- [ ] Migrate `/profile/business` (2-3h)
- [ ] Migrate `/profile/messages` (5-6h)

**Goal**: 8 pages total optimized

### Week 4: Priority 4 + Testing (6-10 hours)
- [ ] Migrate `/profile/notifications` (1-2h)
- [ ] Migrate `/profile/security` (1-2h)
- [ ] Comprehensive testing (4-6h)

**Goal**: All 10 pages optimized and tested

---

## Success Checklist

### Per Page ✅
- [ ] Convert to Server Component
- [ ] Add ISR caching
- [ ] Extract client islands
- [ ] All features work
- [ ] Performance improved >70%
- [ ] No console errors
- [ ] Mobile responsive

### Overall 🎯
- [ ] Average load time < 1s
- [ ] Average JS bundle < 80KB
- [ ] API calls reduced >70%
- [ ] Cache hit rate > 60%
- [ ] No regressions
- [ ] Lighthouse score > 90

---

## Key Files Reference

```
app/profile/
├── page.tsx                          # Main landing (Priority 1)
├── listings/
│   ├── page.tsx                      # Listings page (Priority 1)
│   ├── utils/getListings.ts          # Server fetcher
│   └── components/
│       ├── FilterDropdown.tsx        # Client island
│       └── LoadMoreButton.tsx        # Client island
├── wanted/
│   ├── page.tsx                      # Wanted page (Priority 2)
│   └── utils/getWantedRequests.ts    # Server fetcher
└── ... (other pages)

supabase/migrations/
├── XXX_profile_stats.sql             # Profile stats function
├── XXX_optimize_listings_query.sql   # Listings optimization
└── XXX_optimize_wanted_query.sql     # Wanted optimization
```

---

## Resources

- 📊 [Full Analysis](./PROFILE_PERFORMANCE_ANALYSIS.md) - Detailed 67-page report
- 🗺️ [Roadmap](./PROFILE_OPTIMIZATION_ROADMAP.md) - Week-by-week plan
- 📋 [Summary](./PROFILE_OPTIMIZATION_SUMMARY.md) - Executive summary
- 🎯 [Quick Reference](./PROFILE_QUICK_REFERENCE.md) - This document
- ✅ [/wanted Migration](./WANTED_SERVER_COMPONENT_MIGRATION_PLAN.md) - Reference

---

## Need Help?

See completed `/wanted` migration for reference:
- Implementation: `/app/wanted/`
- Documentation: `docs/performance/WANTED_*.md`
- Database: `supabase/migrations/033_optimize_wanted_requests_query.sql`

---

**Last Updated**: November 14, 2025  
**Status**: Ready to Begin 🚀  
**Next**: Migrate `/profile` main page (2-3 hours)

