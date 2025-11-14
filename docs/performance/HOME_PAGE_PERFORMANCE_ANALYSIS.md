# Home Page Performance Analysis

## Problem
Users experience a 2-3 second freeze when clicking the header logo to navigate to the home page from other pages. The browser URL doesn't change immediately, and there's no loading indicator.

## Root Causes

### 1. **No Loading.tsx (Primary Issue)**
- The home page (`app/page.tsx`) lacks a corresponding `app/loading.tsx` file
- Without this, Next.js has no instant loading UI to show during navigation
- Users see a "freeze" with no visual feedback

### 2. **Force-Dynamic Rendering (Blocking Issue)**
```typescript
export const dynamic = 'force-dynamic'
```
- Forces server-side rendering on EVERY request
- Prevents Next.js from using cached/static versions
- Each navigation requires a full server round-trip

### 3. **Uncached Database Query**
- `FeaturedListingsSSR` component fetches from Supabase on every page load
- No caching strategy implemented
- Query must complete before page can render (blocking)

```typescript
async function getFeaturedListings(displayCount: number = 6): Promise<Listing[]> {
  const supabase = createServerComponentClient({ cookies })
  const { data: listings, error } = await supabase
    .from('listings')
    .select(`...`)
    .eq('is_featured', true)
    .eq('status', 'active')
    .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
    .order('created_at', { ascending: false })
  // No caching, no optimization
}
```

### 4. **Cross-Region Latency**
- Similar to `/listings` page issue
- Vercel deployed to Singapore, Supabase in Singapore
- But still experiences ~100-200ms database query latency
- Combined with SSR overhead = 2-3 second total

## Performance Breakdown

```
User clicks logo → Navigation request
  ↓
No loading.tsx → User sees "freeze" (no feedback)
  ↓
force-dynamic → Must fetch from server (can't use cache)
  ↓
Database query → 100-200ms latency to Supabase
  ↓
SSR processing → Render React components
  ↓
HTML response → Browser receives page
  ↓
Hydration → React takes over
  ↓
Total: 2-3 seconds with no visual feedback
```

## Solutions

### Solution 1: Add Loading.tsx (Immediate Fix) ⚡
**Priority: HIGH - Instant visual feedback**

Create `app/loading.tsx` with skeleton UI:

```typescript
export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section Skeleton */}
      <section className="relative bg-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Animated heading skeleton */}
          <div className="h-12 md:h-16 bg-gray-200 rounded-lg max-w-2xl mx-auto mb-6 animate-pulse" />
          <div className="h-6 bg-gray-200 rounded-lg max-w-xl mx-auto mb-8 animate-pulse" />
          
          {/* Search bar skeleton */}
          <div className="h-14 bg-gray-200 rounded-full max-w-2xl mx-auto mb-10 animate-pulse" />
          
          {/* Quick filters skeleton */}
          <div className="flex justify-center gap-3 flex-wrap">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-10 w-24 bg-gray-200 rounded-full animate-pulse" />
            ))}
          </div>
        </div>
      </section>
      
      {/* Featured listings skeleton */}
      <section className="py-16 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="h-8 w-48 bg-gray-200 rounded-lg mb-8 animate-pulse" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
                <div className="h-48 bg-gray-200 animate-pulse" />
                <div className="p-6 space-y-3">
                  <div className="h-6 bg-gray-200 rounded animate-pulse" />
                  <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
                  <div className="h-8 bg-gray-200 rounded animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
```

**Impact**: Users see instant loading feedback instead of a freeze ✅

### Solution 2: Remove force-dynamic (Performance Fix) 🚀
**Priority: HIGH - Enables caching**

Remove the `force-dynamic` directive from `app/page.tsx`:

```typescript
// Remove this line
// export const dynamic = 'force-dynamic'

// Keep revalidation for ISR
export const revalidate = 60 // Revalidate every minute
```

**Impact**: 
- Enables Incremental Static Regeneration (ISR)
- First user gets fresh page, subsequent users get cached version
- 10-100x faster for cached requests ✅

### Solution 3: Cache Featured Listings Query 💾
**Priority: MEDIUM - Reduces database load**

Wrap the database query with `unstable_cache`:

```typescript
import { unstable_cache } from 'next/cache'

const getFeaturedListings = unstable_cache(
  async (displayCount: number = 6): Promise<Listing[]> => {
    try {
      const supabase = createServerComponentClient({ cookies })
      const { data: listings, error } = await supabase
        .from('listings')
        .select(`...`)
        .eq('is_featured', true)
        .eq('status', 'active')
        .or(`featured_until.is.null,featured_until.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
      
      // ... rest of logic
    } catch (error) {
      return []
    }
  },
  ['featured-listings'],
  {
    revalidate: 60, // Cache for 60 seconds
    tags: ['featured-listings']
  }
)
```

**Impact**: 
- Query results cached for 60 seconds
- Multiple requests use same cached data
- Reduces database load and latency ✅

### Solution 4: Add Database Index (Database Optimization) 🗄️
**Priority: MEDIUM - Faster queries**

Create migration for featured listings index:

```sql
-- Migration: optimize_featured_listings_query.sql
CREATE INDEX IF NOT EXISTS idx_listings_featured_active 
ON listings (created_at DESC) 
WHERE is_featured = true AND status = 'active';
```

**Impact**: 
- Faster query execution (50-90% improvement)
- Reduces database CPU usage ✅

## Recommended Implementation Order

1. **Create `app/loading.tsx`** (5 minutes) ⚡
   - Immediate visual feedback
   - No code changes to existing logic
   - Instant UX improvement

2. **Remove `force-dynamic`** (2 minutes) 🚀
   - Massive performance boost via caching
   - Simple one-line change
   - Works with existing code

3. **Add database index** (5 minutes) 🗄️
   - Run migration
   - Verify with Supabase dashboard
   - Measurable query speedup

4. **Add query caching** (10 minutes) 💾
   - More complex code changes
   - Requires testing rotation logic
   - Further optimization

## Expected Results

### Before Optimization
- Navigation freeze: 2-3 seconds
- No loading feedback
- Database query on every request
- Poor perceived performance

### After Step 1 (loading.tsx)
- Navigation freeze: 2-3 seconds (same)
- **Instant loading skeleton** ✅
- User knows something is happening
- Better perceived performance

### After Step 2 (remove force-dynamic)
- Navigation: **100-300ms (cached)** ✅
- First request: 1-2 seconds (fresh)
- Loading skeleton shows briefly
- Excellent perceived performance

### After Steps 3-4 (full optimization)
- Navigation: **50-150ms (cached)** ✅
- First request: 500ms-1s (fresh)
- Loading skeleton barely visible
- Outstanding performance

## Testing Checklist

- [ ] Create `app/loading.tsx`
- [ ] Test navigation from header logo
- [ ] Verify skeleton appears instantly
- [ ] Remove `force-dynamic` from `app/page.tsx`
- [ ] Test first request (slow)
- [ ] Test cached request (fast)
- [ ] Run database migration
- [ ] Verify index created in Supabase
- [ ] Add query caching
- [ ] Test featured listings rotation still works
- [ ] Performance test with HAR file

## Additional Considerations

### Why was force-dynamic added?
- Likely to ensure fresh featured listings
- However, 60-second revalidation achieves same goal without blocking every request

### Featured listings rotation
- Current implementation rotates every 5 minutes
- Works fine with ISR and caching
- Rotation seed based on time, not request

### SEO implications
- ISR is better for SEO than force-dynamic
- Search engines get fully rendered HTML
- Faster page loads improve rankings

## Monitoring

After implementing, monitor:
1. **Page load time** - Should drop from 2-3s to 100-300ms
2. **Database query count** - Should drop by 90%+
3. **User complaints** - Should drop to zero
4. **Core Web Vitals** - Should improve significantly
   - LCP (Largest Contentful Paint)
   - FID (First Input Delay)
   - CLS (Cumulative Layout Shift)

