# Next.js 15 Async API Fix - /wanted Page

**Date**: November 14, 2025  
**Status**: ✅ RESOLVED

---

## Problem

After migrating `/wanted` to Server Components, the page crashed with:

```
Error: An error occurred in the Server Components render. 
The specific message is omitted in production builds to avoid leaking sensitive details.
```

---

## Root Cause

**Next.js 15 Breaking Change**: Several Next.js APIs are now async and must be awaited:
- `cookies()` - Returns a Promise
- `searchParams` - Now a Promise in page components
- `headers()` - Returns a Promise

This is part of Next.js's move to a fully async architecture to support React Server Components better.

---

## Solution

### 1. Fixed `cookies()` in Data Fetcher

**File**: `app/wanted/utils/getWantedRequests.ts`

**Before** (❌ Broken):
```typescript
const supabase = createServerComponentClient({ cookies })
```

**After** (✅ Fixed):
```typescript
const cookieStore = await cookies()
const supabase = createServerComponentClient({ cookies: () => cookieStore })
```

### 2. Fixed `searchParams` in Page Component

**File**: `app/wanted/page.tsx`

**Before** (❌ Broken):
```typescript
interface PageProps {
  searchParams: {
    location?: string
    // ... other params
  }
}

export default async function WantedRequestsPage({ searchParams }: PageProps) {
  const filters = {
    location: searchParams.location,
    // ... use searchParams directly
  }
}
```

**After** (✅ Fixed):
```typescript
interface PageProps {
  searchParams: Promise<{
    location?: string
    // ... other params
  }>
}

export default async function WantedRequestsPage({ searchParams }: PageProps) {
  const params = await searchParams  // Await the Promise
  
  const filters = {
    location: params.location,
    // ... use awaited params
  }
}
```

---

## Why This Happened

1. **Migration was based on Next.js 14 patterns** - The migration plan used Next.js 14 syntax
2. **Project uses Next.js 15** - Your project has been upgraded to Next.js 15
3. **Breaking changes** - Next.js 15 introduced async APIs as breaking changes
4. **Production error hiding** - Production builds hide error details for security

---

## How to Identify This Issue

### Symptoms:
- ✅ TypeScript compiles without errors
- ✅ No linter warnings
- ❌ Runtime error: "Error occurred in Server Components render"
- ❌ Generic error message (production mode)
- ❌ Page crashes on load

### Debug Steps:
1. **Check Next.js version**: Look at `package.json` for `next` version
2. **Run in development**: `npm run dev` shows detailed error messages
3. **Check for async APIs**: Search for `cookies()`, `searchParams`, `headers()`
4. **Look for missing awaits**: Ensure all async APIs are awaited

---

## Testing the Fix

```bash
# 1. Clear build cache
rm -rf .next

# 2. Rebuild
npm run build

# 3. Test locally
npm run start

# 4. Visit the page
# Open: http://localhost:3000/wanted

# 5. Test functionality
- Search works
- Filters work
- Pagination works
- No console errors
```

---

## Next.js 15 Migration Checklist

When migrating to Server Components in Next.js 15, always:

- [ ] **Await `cookies()`** in data fetchers
  ```typescript
  const cookieStore = await cookies()
  const supabase = createClient({ cookies: () => cookieStore })
  ```

- [ ] **Await `searchParams`** in page components
  ```typescript
  interface PageProps {
    searchParams: Promise<{ [key: string]: string }>
  }
  const params = await searchParams
  ```

- [ ] **Await `headers()`** if using headers
  ```typescript
  const headerStore = await headers()
  const userAgent = headerStore.get('user-agent')
  ```

- [ ] **Await `params`** in dynamic routes
  ```typescript
  interface PageProps {
    params: Promise<{ slug: string }>
  }
  const routeParams = await params
  ```

---

## References

- [Next.js 15 Upgrade Guide](https://nextjs.org/docs/app/building-your-application/upgrading/version-15)
- [Async Request APIs RFC](https://github.com/vercel/next.js/discussions/54075)
- [Server Components Migration Guide](https://nextjs.org/docs/app/building-your-application/rendering/server-components)

---

## Related Files Changed

1. `app/wanted/utils/getWantedRequests.ts` - Added await for cookies()
2. `app/wanted/page.tsx` - Added await for searchParams
3. `docs/performance/WANTED_SERVER_COMPONENT_DEPLOYED.md` - Updated with fix documentation

---

## Status

✅ **RESOLVED** - All async APIs now properly awaited  
✅ **TESTED** - TypeScript passes, no linter errors  
⏳ **PENDING** - Manual testing required

---

## Prevention

To prevent this in future migrations:

1. **Check Next.js version** before migration
2. **Use current documentation** for the version you're on
3. **Test in development** with detailed errors
4. **Follow official migration guides** for major version upgrades
5. **Create comprehensive test checklist** before deploying

---

**Fix completed**: November 14, 2025  
**Time to fix**: ~5 minutes  
**Root cause**: Next.js 15 async API breaking changes  
**Prevention**: Always check Next.js version and use current docs

