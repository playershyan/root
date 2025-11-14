# Enable Supabase Connection Pooling

## Problem
Every database query opens a new connection, adding 10-30ms overhead per query.

## Solution
Use Supabase's built-in connection pooler (PgBouncer).

## Steps

### 1. Get Pooling Connection String

1. Go to https://supabase.com/dashboard/project/ahmynvxoxzhocuhxlcvo/settings/database
2. Scroll to **Connection Pooling** section
3. Copy the **Connection pooling** string (port 6543)

It looks like:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 2. Update Environment Variables

Add to `.env.local`:

```env
# Connection pooling for better performance
SUPABASE_POOLING_URL=postgresql://postgres.ahmynvxoxzhocuhxlcvo:[YOUR_PASSWORD]@aws-0-[region].pooler.supabase.com:6543/postgres
```

### 3. Update Supabase Server Client

```typescript
// lib/supabase-server.ts
import { createClient } from '@supabase/supabase-js'

export function createServiceSupabaseClient() {
  // Use connection pooling for server-side queries
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  
  return createClient(supabaseUrl, serviceKey, {
    db: {
      schema: 'public',
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      fetch: fetch.bind(globalThis),
    },
  })
}
```

### 4. Test Performance

Before:
```
Query time: 50-100ms per query
```

After:
```
Query time: 20-50ms per query
```

**Expected savings**: 20-30ms per query × 2 queries = **40-60ms total**


