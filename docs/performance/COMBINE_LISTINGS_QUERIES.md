# Combine Listings Feed Queries

## Problem

Current implementation makes 2 separate database calls:
```typescript
const [initialFeed, promoted] = await Promise.all([
  getListingsFeed(dbFilters),        // Call 1: ~50ms
  getPromotedSlots(dbFilters)        // Call 2: ~50ms
])
// Total: ~50ms (parallel, but 2 network round-trips)
```

Even with `Promise.all`, each query:
1. Opens a connection
2. Sends query to database
3. Waits for network round-trip
4. Receives response

**Cross-region penalty**: If database is far from server, each round-trip adds 50-100ms.

## Solution

Create a **single database function** that returns everything in one call.

### Step 1: Create Combined Database Function

```sql
-- File: supabase/migrations/032_combine_listings_queries.sql

CREATE OR REPLACE FUNCTION public.get_listings_page(
  p_vehicle_type TEXT DEFAULT NULL,
  p_make TEXT DEFAULT NULL,
  p_model TEXT DEFAULT NULL,
  p_min_year INTEGER DEFAULT NULL,
  p_max_year INTEGER DEFAULT NULL,
  p_min_price NUMERIC DEFAULT NULL,
  p_max_price NUMERIC DEFAULT NULL,
  p_fuel_types TEXT[] DEFAULT NULL,
  p_transmission_types TEXT[] DEFAULT NULL,
  p_urgent_only BOOLEAN DEFAULT NULL,
  p_search TEXT DEFAULT NULL,
  p_sort TEXT DEFAULT 'recent',
  p_page INTEGER DEFAULT 1,
  p_page_size INTEGER DEFAULT 24
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  listings_payload JSONB;
  promoted_payload JSONB;
  v_offset INTEGER;
  v_total INTEGER;
BEGIN
  -- Calculate pagination
  v_offset := (p_page - 1) * p_page_size;
  
  -- Get regular listings
  WITH filtered_listings AS (
    SELECT
      l.id, l.title, l.price, l.make, l.model, l.year, l.mileage,
      l.fuel_type, l.transmission, l.vehicle_type, l.location,
      l.city, l.district, l.image_url, l.image_urls, l.primary_image_url,
      l.pricing_type, l.negotiable, l.asking_price, l.monthly_payment,
      l.phone, l.whatsapp, l.email, l.created_at,
      l.is_featured, l.is_top_spot, l.is_boosted, l.is_urgent,
      l.boost_score, l.user_id
    FROM listings l
    WHERE l.status = 'active' AND l.is_sold = false
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
      AND (p_make IS NULL OR l.make = p_make)
      AND (p_model IS NULL OR l.model = p_model)
      AND (p_min_year IS NULL OR l.year >= p_min_year)
      AND (p_max_year IS NULL OR l.year <= p_max_year)
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_fuel_types IS NULL OR l.fuel_type = ANY(p_fuel_types))
      AND (p_transmission_types IS NULL OR l.transmission = ANY(p_transmission_types))
      AND (p_urgent_only IS NULL OR p_urgent_only = false OR l.is_urgent = true)
      AND (
        p_search IS NULL OR
        l.title ILIKE '%' || p_search || '%' OR
        l.make ILIKE '%' || p_search || '%' OR
        l.model ILIKE '%' || p_search || '%' OR
        l.location ILIKE '%' || p_search || '%' OR
        l.city ILIKE '%' || p_search || '%' OR
        l.district ILIKE '%' || p_search || '%'
      )
    ORDER BY
      CASE WHEN p_sort = 'price_low' THEN l.price END ASC,
      CASE WHEN p_sort = 'price_high' THEN l.price END DESC,
      CASE WHEN p_sort = 'year_new' THEN l.year END DESC,
      CASE WHEN p_sort = 'year_old' THEN l.year END ASC,
      CASE WHEN p_sort = 'mileage_low' THEN l.mileage END ASC,
      CASE WHEN p_sort = 'recent' THEN l.created_at END DESC
    LIMIT p_page_size OFFSET v_offset
  ),
  total_count AS (
    SELECT COUNT(*) as total
    FROM listings l
    WHERE l.status = 'active' AND l.is_sold = false
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
      AND (p_make IS NULL OR l.make = p_make)
      AND (p_model IS NULL OR l.model = p_model)
      AND (p_min_year IS NULL OR l.year >= p_min_year)
      AND (p_max_year IS NULL OR l.year <= p_max_year)
      AND (p_min_price IS NULL OR l.price >= p_min_price)
      AND (p_max_price IS NULL OR l.price <= p_max_price)
      AND (p_fuel_types IS NULL OR l.fuel_type = ANY(p_fuel_types))
      AND (p_transmission_types IS NULL OR l.transmission = ANY(p_transmission_types))
      AND (p_urgent_only IS NULL OR p_urgent_only = false OR l.is_urgent = true)
      AND (
        p_search IS NULL OR
        l.title ILIKE '%' || p_search || '%' OR
        l.make ILIKE '%' || p_search || '%' OR
        l.model ILIKE '%' || p_search || '%'
      )
  )
  SELECT jsonb_build_object(
    'items', COALESCE(jsonb_agg(to_jsonb(fl)), '[]'::jsonb),
    'total', (SELECT total FROM total_count),
    'page', p_page,
    'pageSize', p_page_size,
    'totalPages', CEIL((SELECT total FROM total_count)::NUMERIC / p_page_size)
  )
  INTO listings_payload
  FROM filtered_listings fl;
  
  -- Get promoted slots (reuse existing function)
  SELECT public.get_promoted_slots_bundle(p_vehicle_type)
  INTO promoted_payload;
  
  -- Return combined result
  RETURN jsonb_build_object(
    'feed', listings_payload,
    'promoted', promoted_payload
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_listings_page TO anon;
GRANT EXECUTE ON FUNCTION public.get_listings_page TO authenticated;

COMMENT ON FUNCTION public.get_listings_page IS 'Combined query for listings feed + promoted slots - reduces network round-trips';
```

### Step 2: Update Server Code

```typescript
// lib/server/listings-feed.ts

async function fetchListingsPageCombined(filters: ListingsFeedFilters): Promise<{
  feed: ListingsFeedResult
  promoted: PromotedSlots
}> {
  const supabase = createServiceSupabaseClient()
  
  const { data, error } = await supabase.rpc('get_listings_page', {
    p_vehicle_type: filters.vehicleType ?? null,
    p_make: filters.make ?? null,
    p_model: filters.model ?? null,
    p_min_year: filters.minYear ?? null,
    p_max_year: filters.maxYear ?? null,
    p_min_price: filters.minPrice ?? null,
    p_max_price: filters.maxPrice ?? null,
    p_fuel_types: filters.fuelTypes ?? null,
    p_transmission_types: filters.transmissionTypes ?? null,
    p_urgent_only: filters.urgentOnly ?? null,
    p_search: filters.search ?? null,
    p_sort: filters.sort ?? 'recent',
    p_page: filters.page ?? 1,
    p_page_size: filters.pageSize ?? 24,
  })
  
  if (error) {
    logger.error('Failed to fetch listings page', error, { filters })
    throw error
  }
  
  return {
    feed: data.feed as ListingsFeedResult,
    promoted: data.promoted as PromotedSlots,
  }
}

// Update the cached version
export async function getListingsPageCombined(
  filters: ListingsFeedFilters
): Promise<{ feed: ListingsFeedResult; promoted: PromotedSlots }> {
  const serialized = JSON.stringify(filters ?? {})
  
  const getCached = unstable_cache(
    async (key: string) => {
      const parsed = JSON.parse(key) as ListingsFeedFilters
      return fetchListingsPageCombined(parsed)
    },
    ['listings-page-combined'],
    { revalidate: 120 }
  )
  
  return getCached(serialized)
}
```

### Step 3: Update Page Component

```typescript
// app/listings/page.tsx

export default async function ListingsPage(props: ListingsPageProps) {
  const searchParams = await props.searchParams
  const { dbFilters, clientFilters } = parseFilters(searchParams)

  // OLD: Two separate calls
  // const [initialFeed, promoted] = await Promise.all([
  //   getListingsFeed(dbFilters),
  //   getPromotedSlots(dbFilters.vehicleType ?? null)
  // ])
  
  // NEW: Single combined call
  const { feed: initialFeed, promoted } = await getListingsPageCombined(dbFilters)

  const shouldRefetchLastPage =
    (dbFilters.page ?? 1) > 1 &&
    initialFeed.totalPages > 0 &&
    initialFeed.page > initialFeed.totalPages

  const feed = shouldRefetchLastPage
    ? (await getListingsPageCombined({ ...dbFilters, page: initialFeed.totalPages })).feed
    : initialFeed

  const pagination: ListingsPagePaginationState = {
    page: feed.page,
    total: feed.total,
    pageSize: feed.pageSize,
    totalPages: feed.totalPages
  }

  return (
    <ListingsPageClient
      listings={feed.items}
      promoted={promoted}
      pagination={pagination}
      filters={clientFilters}
    />
  )
}
```

## Performance Improvement

### Before (2 queries):
```
Query 1: 50ms
Query 2: 50ms (parallel)
-------------------
Total: 50ms (but 2 network round-trips)
```

### After (1 query):
```
Combined Query: 50ms
-------------------
Total: 50ms (1 network round-trip)
```

**Savings**: Eliminates 1 round-trip

**Cross-region benefit**: If database is in different region (100ms latency):
- Before: 100ms
- After: 50ms (**50% faster**)

## Testing

```bash
# Apply migration
npx supabase db push

# Test the function
psql "postgresql://..." -c "SELECT get_listings_page(NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'recent', 1, 24);"
```

Expected: JSON response with both `feed` and `promoted` fields.


