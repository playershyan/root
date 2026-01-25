# Migration Guide: Prisma to Supabase Client

Complete guide to migrate from Prisma ORM to Supabase client exclusively, following the root project's implementation pattern.

## Table of Contents
1. [Overview](#overview)
2. [Setup & Installation](#setup--installation)
3. [Client Configuration](#client-configuration)
4. [Migration Steps](#migration-steps)
5. [Query Patterns](#query-patterns)
6. [Code Examples](#code-examples)
7. [Removing Prisma](#removing-prisma)

---

## Overview

### Why Migrate?

- ✅ **Simpler**: No schema files, migrations, or code generation
- ✅ **Direct**: Works directly with Supabase PostgreSQL
- ✅ **Type-safe**: TypeScript types generated from database
- ✅ **RLS Support**: Row Level Security works out of the box
- ✅ **Less Maintenance**: No Prisma version conflicts or setup issues

### Architecture Comparison

**Before (Prisma):**
```
Next.js App → Prisma Client → Direct PostgreSQL Connection → Supabase DB
```

**After (Supabase Client):**
```
Next.js App → Supabase Client → Supabase API → Supabase DB
```

---

## Setup & Installation

### 1. Install Required Packages

```bash
npm install @supabase/supabase-js @supabase/ssr @supabase/auth-helpers-nextjs
```

### 2. Remove Prisma

```bash
npm uninstall prisma @prisma/client
```

### 3. Environment Variables

Update your `.env.local`:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Remove DATABASE_URL (no longer needed)
# DATABASE_URL=postgresql://...
```

---

## Client Configuration

### 1. Client-Side Client

**File:** `lib/supabase.ts`

```typescript
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

// Create a single supabase client for client components
export const supabase = createClientComponentClient()
```

### 2. Server-Side Client (API Routes & Server Components)

**File:** `utils/supabase/server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
```

### 3. Service Role Client (Admin Operations)

**File:** `lib/supabase/serviceRoleClient.ts`

```typescript
import { createClient, type SupabaseClient } from '@supabase/supabase-js'

let cachedClient: SupabaseClient | null = null

export function getServiceRoleClient() {
  if (cachedClient) {
    return cachedClient
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceKey) {
    throw new Error('Supabase service role credentials are not configured')
  }

  cachedClient = createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  return cachedClient
}
```

### 4. Alternative Server Client (Route Handlers)

**File:** `lib/supabase-server.ts`

```typescript
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

// For server components
export function createServerSupabaseClient() {
  return createServerComponentClient({ cookies })
}

// Service role client for admin operations (bypasses RLS)
export function createServiceSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
```

---

## Migration Steps

### Step 1: Replace Prisma Imports

**Before:**
```typescript
import { prisma } from '@/lib/db/prisma'
```

**After:**
```typescript
import { createClient } from '@/utils/supabase/server'
// or
import { supabase } from '@/lib/supabase' // for client components
```

### Step 2: Replace Query Patterns

See [Query Patterns](#query-patterns) section below.

### Step 3: Update Type Definitions

Generate TypeScript types from your Supabase database:

```bash
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts
```

Or use the Supabase CLI:

```bash
supabase gen types typescript --local > types/supabase.ts
```

### Step 4: Update Error Handling

**Before (Prisma):**
```typescript
try {
  const result = await prisma.person.findMany()
} catch (error) {
  // Prisma error
}
```

**After (Supabase):**
```typescript
const { data, error } = await supabase
  .from('persons')
  .select('*')

if (error) {
  // Supabase error
  throw new Error(error.message)
}
```

---

## Query Patterns

### SELECT (Find Many)

**Prisma:**
```typescript
const persons = await prisma.person.findMany({
  where: { shelter_id: shelterId },
  orderBy: { created_at: 'desc' },
  take: 10
})
```

**Supabase:**
```typescript
const { data: persons, error } = await supabase
  .from('persons')
  .select('*')
  .eq('shelter_id', shelterId)
  .order('created_at', { ascending: false })
  .limit(10)

if (error) throw error
```

### SELECT (Find One)

**Prisma:**
```typescript
const person = await prisma.person.findUnique({
  where: { id: personId }
})
```

**Supabase:**
```typescript
const { data: person, error } = await supabase
  .from('persons')
  .select('*')
  .eq('id', personId)
  .single()

if (error) throw error
```

### INSERT

**Prisma:**
```typescript
const newPerson = await prisma.person.create({
  data: {
    full_name: 'John Doe',
    age: 30,
    shelter_id: shelterId
  }
})
```

**Supabase:**
```typescript
const { data: newPerson, error } = await supabase
  .from('persons')
  .insert({
    full_name: 'John Doe',
    age: 30,
    shelter_id: shelterId
  })
  .select()
  .single()

if (error) throw error
```

### UPDATE

**Prisma:**
```typescript
const updated = await prisma.person.update({
  where: { id: personId },
  data: { age: 31 }
})
```

**Supabase:**
```typescript
const { data: updated, error } = await supabase
  .from('persons')
  .update({ age: 31 })
  .eq('id', personId)
  .select()
  .single()

if (error) throw error
```

### DELETE

**Prisma:**
```typescript
await prisma.person.delete({
  where: { id: personId }
})
```

**Supabase:**
```typescript
const { error } = await supabase
  .from('persons')
  .delete()
  .eq('id', personId)

if (error) throw error
```

### Complex Queries

**Prisma:**
```typescript
const results = await prisma.person.findMany({
  where: {
    shelter_id: shelterId,
    age: { gte: 18 },
    created_at: { gte: new Date('2024-01-01') }
  },
  include: {
    shelter: true,
    missingPerson: true
  },
  orderBy: { created_at: 'desc' },
  skip: 0,
  take: 20
})
```

**Supabase:**
```typescript
const { data: results, error } = await supabase
  .from('persons')
  .select(`
    *,
    shelter:shelters(*),
    missing_person:missing_persons(*)
  `)
  .eq('shelter_id', shelterId)
  .gte('age', 18)
  .gte('created_at', '2024-01-01')
  .order('created_at', { ascending: false })
  .range(0, 19)

if (error) throw error
```

### Transactions

**Prisma:**
```typescript
await prisma.$transaction([
  prisma.person.create({ data: {...} }),
  prisma.missingPerson.create({ data: {...} })
])
```

**Supabase:**
```typescript
// Use RPC functions for complex transactions
const { data, error } = await supabase.rpc('create_person_with_missing_report', {
  person_data: {...},
  missing_person_data: {...}
})

// Or use multiple queries (not atomic, but simpler)
const { data: person } = await supabase.from('persons').insert({...})
const { data: missing } = await supabase.from('missing_persons').insert({...})
```

---

## Code Examples

### Example 1: API Route (GET)

**File:** `app/api/persons/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    const shelterId = searchParams.get('shelterId')

    let query = supabase
      .from('persons')
      .select('*')

    if (shelterId) {
      query = query.eq('shelter_id', shelterId)
    }

    const { data: persons, error } = await query.order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: persons, success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Example 2: API Route (POST)

**File:** `app/api/persons/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    
    // Verify authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, age, shelter_id } = body

    // Validate required fields
    if (!full_name || !shelter_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Insert new person
    const { data: newPerson, error } = await supabase
      .from('persons')
      .insert({
        full_name,
        age,
        shelter_id,
        user_id: user.id
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: newPerson, success: true }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### Example 3: Service Function

**File:** `lib/services/personService.ts`

```typescript
import { createClient } from '@/utils/supabase/server'
import type { Database } from '@/types/supabase'

type Person = Database['public']['Tables']['persons']['Row']

export async function getPersonsByShelter(shelterId: string): Promise<Person[]> {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('persons')
    .select('*')
    .eq('shelter_id', shelterId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to fetch persons: ${error.message}`)
  }

  return data || []
}

export async function createPerson(data: {
  full_name: string
  age: number
  shelter_id: string
}): Promise<Person> {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    throw new Error('Unauthorized')
  }

  const { data: newPerson, error } = await supabase
    .from('persons')
    .insert({
      ...data,
      user_id: user.id
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create person: ${error.message}`)
  }

  return newPerson
}
```

### Example 4: Client Component

**File:** `components/PersonList.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/supabase'

type Person = Database['public']['Tables']['persons']['Row']

export default function PersonList({ shelterId }: { shelterId: string }) {
  const [persons, setPersons] = useState<Person[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPersons() {
      const { data, error } = await supabase
        .from('persons')
        .select('*')
        .eq('shelter_id', shelterId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Error fetching persons:', error)
        return
      }

      setPersons(data || [])
      setLoading(false)
    }

    fetchPersons()
  }, [shelterId])

  if (loading) return <div>Loading...</div>

  return (
    <div>
      {persons.map(person => (
        <div key={person.id}>{person.full_name}</div>
      ))}
    </div>
  )
}
```

### Example 5: Admin Route (Service Role)

**File:** `app/api/admin/persons/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { getServiceRoleClient } from '@/lib/supabase/serviceRoleClient'

export async function GET(request: NextRequest) {
  try {
    // Verify admin access (your auth logic)
    // ...

    // Use service role client (bypasses RLS)
    const supabase = getServiceRoleClient()

    const { data: persons, error } = await supabase
      .from('persons')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ data: persons })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

---

## Removing Prisma

### 1. Delete Prisma Files

```bash
rm -rf prisma/
rm -f prisma.config.ts
rm -f lib/db/prisma.ts
```

### 2. Remove from package.json

Remove these scripts:
```json
{
  "scripts": {
    "db:generate": "...",
    "db:push": "...",
    "db:migrate": "...",
    "db:seed": "...",
    "db:studio": "..."
  }
}
```

### 3. Update Imports

Search and replace all Prisma imports:
```bash
# Find all Prisma usage
grep -r "from.*prisma" .
grep -r "import.*prisma" .
grep -r "PrismaClient" .
```

### 4. Remove Prisma from CI/CD

Remove any Prisma-related steps from your deployment pipeline.

---

## Common Query Patterns

### Filtering

```typescript
// Equal
.eq('status', 'active')

// Not equal
.neq('status', 'deleted')

// Greater than
.gt('age', 18)

// Greater than or equal
.gte('age', 18)

// Less than
.lt('age', 65)

// Less than or equal
.lte('age', 65)

// In array
.in('status', ['active', 'pending'])

// Like (case-insensitive)
.ilike('name', '%john%')

// Is null
.is('deleted_at', null)

// Is not null
.not('deleted_at', 'is', null)
```

### Joins (Relations)

```typescript
// Single relation
.select(`
  *,
  shelter:shelters(*)
`)

// Multiple relations
.select(`
  *,
  shelter:shelters(*),
  missing_person:missing_persons(*)
`)

// Nested relations
.select(`
  *,
  shelter:shelters(
    *,
    auth:shelter_auth(*)
  )
`)
```

### Pagination

```typescript
const page = 1
const limit = 20
const from = (page - 1) * limit
const to = from + limit - 1

const { data, error, count } = await supabase
  .from('persons')
  .select('*', { count: 'exact' })
  .range(from, to)
```

### Text Search

```typescript
// Simple search
.or(`name.ilike.%${query}%,description.ilike.%${query}%`)

// Full-text search (requires pg_trgm extension)
.textSearch('name', query)
```

### Aggregations

```typescript
// Count
const { count } = await supabase
  .from('persons')
  .select('*', { count: 'exact', head: true })

// Use RPC for complex aggregations
const { data } = await supabase.rpc('get_person_stats', {
  shelter_id: shelterId
})
```

---

## TypeScript Types

### Generate Types

```bash
# Using Supabase CLI
npx supabase gen types typescript --project-id your-project-id > types/supabase.ts

# Or from local database
supabase gen types typescript --local > types/supabase.ts
```

### Use Types

```typescript
import type { Database } from '@/types/supabase'

type Person = Database['public']['Tables']['persons']['Row']
type PersonInsert = Database['public']['Tables']['persons']['Insert']
type PersonUpdate = Database['public']['Tables']['persons']['Update']
```

---

## Best Practices

1. **Always check for errors** after Supabase queries
2. **Use service role client** only for admin operations
3. **Respect RLS policies** - use regular client for user operations
4. **Handle null data** - Supabase returns `null` when no rows found
5. **Use `.single()`** when expecting exactly one row
6. **Use transactions** via RPC functions for complex operations
7. **Cache service role client** (already done in example)
8. **Generate types** regularly from your database schema

---

## Troubleshooting

### Error: "relation does not exist"
- Check table name matches exactly (case-sensitive)
- Ensure table exists in Supabase dashboard

### Error: "new row violates row-level security policy"
- Check RLS policies in Supabase
- Use service role client for admin operations
- Verify user authentication

### Error: "JWT expired"
- Refresh the session
- Check token expiration settings

### Types not updating
- Regenerate types: `npx supabase gen types typescript --project-id your-project-id`
- Restart TypeScript server in your IDE

---

## Summary

✅ **Removed**: Prisma ORM, schema files, migrations  
✅ **Added**: Supabase client, type generation  
✅ **Simplified**: Direct database access via Supabase API  
✅ **Maintained**: Type safety, error handling, authentication  

The migration is complete when:
- All Prisma imports are removed
- All queries use Supabase client
- Types are generated from Supabase
- Tests pass
- No Prisma files remain




