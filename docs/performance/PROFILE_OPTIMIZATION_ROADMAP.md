# /profile Optimization Roadmap

**Date**: November 14, 2025  
**Total Pages**: 10 pages to optimize  
**Total Time**: 31-43 hours (~1-2 weeks)  
**Expected Impact**: 75-90% performance improvement

---

## Quick Reference

### Pages by Priority

| Priority | Page | Impact | Time | Difficulty |
|----------|------|--------|------|------------|
| 🔴 **P1** | `/profile` (Landing) | ⚡⚡⚡ Very High | 2-3h | Medium |
| 🔴 **P1** | `/profile/listings` | ⚡⚡⚡ Very High | 4-5h | Medium-High |
| 🟠 **P2** | `/profile/wanted` | ⚡⚡⚡ High | 3-4h | Medium |
| 🟠 **P2** | `/profile/favorites` | ⚡⚡ High | 3-4h | Medium |
| 🟠 **P2** | `/profile/bin` | ⚡⚡ Medium | 2-3h | Low |
| 🟡 **P3** | `/profile/account` | ⚡⚡ Medium | 4-5h | Medium-High |
| 🟡 **P3** | `/profile/business` | ⚡⚡ Medium | 2-3h | Medium |
| 🟡 **P3** | `/profile/messages` | ⚡ Medium | 5-6h | High |
| 🟢 **P4** | `/profile/notifications` | ⚡ Low | 1-2h | Low |
| 🟢 **P4** | `/profile/security` | ⚡ Low | 1-2h | Low |

---

## Week 1: Quick Wins (Priority 1)

### Day 1-2: `/profile` Main Landing Page

**Time**: 2-3 hours  
**Impact**: ⚡⚡⚡ Very High (most visited page)

#### Current State
```typescript
'use client'  // ❌ Client Component

export default function ProfileLandingPage() {
  const { user, loading: authLoading } = useAuth()
  const { businessProfile } = useBusinessProfile()        // API call #1
  const { listings } = useListingManagement(user?.id)     // API call #2
  const { favoritedAds, favoritedWantedRequests } = useFavorites(user?.id)  // API call #3
  const { conversations } = useMessaging(user?.id)        // API call #4
  
  // 4 concurrent API calls!
  // Fetches ALL data just for counts!
}
```

**Problems**:
- 4 separate API calls (2-4 second load)
- Fetches full datasets for badge counts only
- No caching
- Large JavaScript bundle (~150-200KB)

#### Target State
```typescript
// ✅ Server Component

export const revalidate = 60  // Cache for 60 seconds

export default async function ProfileLandingPage() {
  // Single optimized query for all counts
  const profileStats = await getProfileStats()
  
  return (
    <div>
      {/* Server-rendered content */}
      {/* Only navigation links need client interaction */}
    </div>
  )
}
```

**Benefits**:
- Single optimized database query
- ~500ms load time (vs 2-4s)
- 85-90% smaller JavaScript bundle
- ISR caching (instant for subsequent users)

#### Implementation Steps

**Step 1**: Create server-side data fetcher
```bash
File: app/profile/utils/getProfileStats.ts
```

```typescript
export async function getProfileStats(userId: string) {
  const supabase = createServerComponentClient({ cookies: await cookies() })
  
  // Single optimized query
  const { data } = await supabase.rpc('get_profile_stats', { user_id: userId })
  
  return {
    listingsCount: data?.listings_count || 0,
    favoritesCount: data?.favorites_count || 0,
    messagesCount: data?.messages_count || 0,
    unreadCount: data?.unread_count || 0,
    hasBusinessProfile: data?.has_business_profile || false
  }
}
```

**Step 2**: Create database function
```sql
CREATE OR REPLACE FUNCTION get_profile_stats(user_id UUID)
RETURNS TABLE (
  listings_count INT,
  favorites_count INT,
  messages_count INT,
  unread_count INT,
  has_business_profile BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*)::INT FROM listings WHERE user_id = $1 AND status = 'active'),
    (SELECT COUNT(*)::INT FROM favorites WHERE user_id = $1),
    (SELECT COUNT(*)::INT FROM conversations WHERE buyer_id = $1 OR seller_id = $1),
    (SELECT COALESCE(SUM(unread_count), 0)::INT FROM conversations WHERE buyer_id = $1),
    (SELECT EXISTS(SELECT 1 FROM business_profiles WHERE user_id = $1 AND is_active = true));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 3**: Convert page to Server Component
```typescript
import { redirect } from 'next/navigation'
import { getProfileStats } from './utils/getProfileStats'

export const revalidate = 60  // ISR caching

export default async function ProfileLandingPage() {
  const supabase = createServerComponentClient({ cookies: await cookies() })
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    redirect('/')
  }
  
  const stats = await getProfileStats(user.id)
  
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      {/* Render sections with stats */}
      {/* All static, no client JavaScript needed */}
    </div>
  )
}
```

**Testing Checklist**:
- [ ] Page loads without errors
- [ ] All counts display correctly
- [ ] Navigation links work
- [ ] Business profile section shows/hides correctly
- [ ] Performance improved (measure with Lighthouse)

---

### Day 3-5: `/profile/listings`

**Time**: 4-5 hours  
**Impact**: ⚡⚡⚡ Very High (frequently used)

#### Current State
```typescript
'use client'  // ❌ Client Component

export default function ListingsPage() {
  const { listings, loading } = useListingManagement(user?.id)
  
  // Fetches ALL listings
  // Client-side filtering
  // No pagination
}
```

**Problems**:
- Fetches ALL listings at once (slow with 50+ listings)
- Client-side filtering (wasteful)
- No pagination
- Large JavaScript bundle (~200-250KB)

#### Target State
```typescript
// ✅ Server Component + Client Islands

export const revalidate = 30

export default async function ListingsPage({ searchParams }: PageProps) {
  const params = await searchParams
  const statusFilter = params.status || 'all'
  const page = parseInt(params.page || '1')
  
  // Server-side filtered + paginated query
  const { listings, totalCount } = await getListings(user.id, statusFilter, page)
  
  return (
    <>
      <FilterDropdown />  {/* Client Island */}
      <ListingsTable listings={listings} />  {/* Server Component */}
      <LoadMoreButton hasMore={...} />  {/* Client Island */}
    </>
  )
}
```

**Benefits**:
- Server-side filtering (no wasted data transfer)
- Pagination (fast even with 1000+ listings)
- 80-85% smaller bundle
- ISR caching
- URL-based state (shareable links)

#### Implementation Steps

Similar pattern to `/wanted` page migration (already completed):
1. Create server-side data fetcher
2. Create client components for interactive parts
3. Convert page to Server Component
4. Add ISR caching
5. Test thoroughly

**Reference**: See `docs/performance/WANTED_SERVER_COMPONENT_MIGRATION_PLAN.md`

---

## Week 2: High Impact Pages (Priority 2)

### `/profile/wanted` (3-4 hours)

**Pattern**: Same as public `/wanted` page (already migrated)

**Steps**:
1. Adapt existing `/wanted` server-side code
2. Filter by user ID
3. Add user-specific actions (edit, delete)
4. Test

**Reference**: Reuse code from `/app/wanted/utils/getWantedRequests.ts`

---

### `/profile/favorites` (3-4 hours)

**Current**: Client-side fetch of all favorites

**Target**: 
- Server Component with pagination
- Client Islands for favorite toggle
- Optimistic UI updates

**Key Changes**:
- Server-side data fetching
- Paginate (20 per page)
- Real-time toggle with optimistic updates

---

### `/profile/bin` (2-3 hours)

**Current**: Client-side fetch of all deleted items

**Target**:
- Server Component with pagination
- Client Islands for restore actions
- Confirmation dialogs

**Low Complexity**: Simple list page, straightforward migration

---

## Week 3: Medium Priority (Priority 3)

### `/profile/account` (4-5 hours)

**Challenge**: Forms need client interactivity

**Approach**: Hybrid
- Server Component for initial data
- Client Island for form
- Server Actions for submission
- Optimistic updates

```typescript
// Server Component (page.tsx)
export default async function AccountPage() {
  const profile = await getProfile()
  
  return <AccountForm profile={profile} />  {/* Client Island */}
}

// Client Component (AccountForm.tsx)
'use client'

export function AccountForm({ profile }: Props) {
  // Form state and submission
}
```

---

### `/profile/business` (2-3 hours)

Similar to `/profile/account` - hybrid approach

---

### `/profile/messages` (5-6 hours)

**Challenge**: Real-time requirements

**Approach**:
- Server Component for initial messages (SSR)
- Client Island for chat interface
- Real-time updates via Supabase subscriptions
- Keep existing optimized API endpoints

**Benefit**: Fast initial load, then real-time updates

---

## Week 4: Low Priority (Priority 4)

### `/profile/notifications` (1-2 hours)

**Mostly Client**: Settings page needs interactivity

**Minor Optimizations**:
- Server Component wrapper
- Client Island for form
- Smaller bundle

---

### `/profile/security` (1-2 hours)

Similar to notifications - simple optimization

---

## Migration Pattern (Reusable)

### For List Pages (listings, favorites, wanted, bin)

```typescript
// 1. Server-side data fetcher
app/profile/[page]/utils/getData.ts

// 2. Client components for interactivity
app/profile/[page]/components/
  - FilterDropdown.tsx ('use client')
  - ActionButton.tsx ('use client')
  - LoadMoreButton.tsx ('use client')

// 3. Main page (Server Component)
app/profile/[page]/page.tsx

// 4. Server actions
app/profile/[page]/actions/
  - updateItem.ts ('use server')
```

### For Form Pages (account, business, notifications)

```typescript
// 1. Server-side data fetcher
app/profile/[page]/utils/getData.ts

// 2. Form component (Client)
app/profile/[page]/components/Form.tsx ('use client')

// 3. Main page (Server Component wrapper)
app/profile/[page]/page.tsx

// 4. Server actions for submission
app/profile/[page]/actions/submit.ts ('use server')
```

---

## Performance Tracking

### Baseline Metrics (Before)

| Page | Load Time | JS Size | API Calls |
|------|-----------|---------|-----------|
| `/profile` | 2-4s | ~150KB | 4 |
| `/profile/listings` | 1.5-3s | ~200KB | 2 |
| `/profile/wanted` | 1.5-3s | ~250KB | 1 |
| `/profile/favorites` | 1-2.5s | ~180KB | 2 |
| **Average** | **2-3s** | **~195KB** | **2-3** |

### Target Metrics (After)

| Page | Load Time | JS Size | API Calls |
|------|-----------|---------|-----------|
| `/profile` | 500ms-1s | ~30KB | 1 |
| `/profile/listings` | 500ms-1s | ~40KB | 1 |
| `/profile/wanted` | 500ms-1s | ~40KB | 1 |
| `/profile/favorites` | 500ms-1s | ~35KB | 1 |
| **Average** | **~500-750ms** | **~35KB** | **1** |

**Improvements**: 
- ⚡ 75-85% faster
- ⚡ 80-85% smaller bundles
- ⚡ 50-66% fewer API calls

---

## Testing Strategy

### Per Page Checklist

- [ ] Page loads without errors
- [ ] All features work correctly
- [ ] Performance improved (Lighthouse)
- [ ] No regressions
- [ ] Mobile responsive
- [ ] Loading states work
- [ ] Error handling works
- [ ] Navigation works

### Integration Testing

- [ ] Navigation between profile pages
- [ ] State persists correctly
- [ ] Auth flow works
- [ ] Edge cases handled

### Performance Testing

- [ ] Lighthouse Performance > 90
- [ ] First Contentful Paint < 1.5s
- [ ] Time to Interactive < 2s
- [ ] Total Blocking Time < 200ms

---

## Rollback Strategy

For each page:

```bash
# Create backup before migration
cp app/profile/[page]/page.tsx app/profile/[page]/page.backup.tsx

# If issues occur, rollback
cp app/profile/[page]/page.backup.tsx app/profile/[page]/page.tsx
git add app/profile/[page]/page.tsx
git commit -m "rollback: restore [page] to client component"
```

---

## Success Criteria

### Must Have ✅
- [ ] 70%+ load time reduction
- [ ] 70%+ bundle size reduction
- [ ] All features working
- [ ] No critical bugs
- [ ] Performance metrics improved

### Should Have 🎯
- [ ] 80%+ load time reduction
- [ ] 80%+ bundle size reduction
- [ ] Lighthouse score > 90
- [ ] ISR caching working

### Nice to Have 🌟
- [ ] 90%+ load time reduction
- [ ] Lighthouse score > 95
- [ ] Sub-second loads on 3G

---

## Next Steps

1. **Review this roadmap** with team
2. **Get approval** to start migration
3. **Set up monitoring** (baseline metrics)
4. **Create feature branch**: `feature/profile-server-components`
5. **Start with `/profile` main page** (quickest win)
6. **Document learnings** after each migration
7. **Iterate and improve** based on findings

---

## Estimated Timeline

| Week | Focus | Deliverables |
|------|-------|--------------|
| **Week 1** | Priority 1 pages | `/profile`, `/profile/listings` optimized |
| **Week 2** | Priority 2 pages | 3 more pages optimized |
| **Week 3** | Priority 3 pages | 3 more pages optimized |
| **Week 4** | Priority 4 + polish | Final 2 pages + testing |

**Total**: 4 weeks (part-time) or 1-2 weeks (full-time)

---

## Resources

- [Performance Analysis](./PROFILE_PERFORMANCE_ANALYSIS.md) - Detailed analysis
- [/wanted Migration Plan](./WANTED_SERVER_COMPONENT_MIGRATION_PLAN.md) - Reference implementation
- [/wanted Deployed](./WANTED_SERVER_COMPONENT_DEPLOYED.md) - Success story
- [Next.js 15 Fix](./WANTED_NEXTJS15_FIX.md) - Common issues and solutions

---

**Status**: ⏳ **Ready to Begin**  
**Priority**: 🔴 **HIGH**  
**Next Action**: Get approval and start with `/profile` main page

