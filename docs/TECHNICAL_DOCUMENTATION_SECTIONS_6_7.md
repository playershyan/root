# Vera.lk Technical Documentation - Sections 6 & 7

---

## 6. Code Patterns & Conventions

This section documents the coding patterns and conventions used throughout the Vera.lk codebase.

### 6.1 Component Architecture

#### Server vs Client Components (Next.js 14 App Router)

**Server Components (Default)**
- Run on the server only
- No JavaScript shipped to client
- Direct database access allowed
- Cannot use React hooks or browser APIs
- Optimal for data fetching and static content

```typescript
// app/listings/[id]/page.tsx (Server Component)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Direct database query in server component
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  return (
    <div>
      <h1>{listing.title}</h1>
      {/* Static content rendered on server */}
    </div>
  )
}
```

**Client Components (Explicit 'use client')**
- Run in browser
- Can use React hooks (useState, useEffect, etc.)
- Event handlers and interactivity
- Browser APIs (localStorage, window, etc.)

```typescript
// app/components/ContactProfile.tsx (Client Component)
'use client'

import { useState } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'

export default function ContactProfile() {
  const { user } = useAuth()  // React hook usage
  const [showPhone, setShowPhone] = useState(false)

  // Event handlers require client component
  const handleClick = () => {
    setShowPhone(true)
  }

  return (
    <button onClick={handleClick}>
      {showPhone ? user?.phone : 'Show Phone'}
    </button>
  )
}
```

**When to Use 'use client' Directive**
1. Using React hooks (useState, useEffect, useContext, etc.)
2. Event handlers (onClick, onChange, onSubmit)
3. Browser APIs (window, document, localStorage)
4. Third-party libraries requiring browser environment
5. Real-time updates or WebSocket connections

**Error Boundaries Implementation**

Server-side error boundary (app/error.tsx):
```typescript
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-4">Something went wrong</h2>
        <button
          onClick={() => reset()}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

**Loading States and Suspense**

Loading state (app/loading.tsx):
```typescript
export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
    </div>
  )
}
```

Suspense boundary pattern:
```typescript
import { Suspense } from 'react'

export default function Page() {
  return (
    <div>
      <Suspense fallback={<LoadingSpinner />}>
        <AsyncComponent />
      </Suspense>
    </div>
  )
}
```

**Combined Pattern: Server Component + Client Interactivity**

```typescript
// app/listings/[id]/page.tsx (Server Component)
import ListingDetailClient from './ListingDetailClient'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export default async function ListingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServerComponentClient({ cookies })

  // Server-side data fetching (no API call needed)
  const { data: listing } = await supabase
    .from('listings')
    .select('*')
    .eq('id', params.id)
    .single()

  // Pass data to client component for interactivity
  return <ListingDetailClient listing={listing} />
}

// app/listings/[id]/ListingDetailClient.tsx (Client Component)
'use client'

import { useState } from 'react'

export default function ListingDetailClient({ listing }: { listing: Listing }) {
  const [isFavorite, setIsFavorite] = useState(false)

  // Client-side interactivity
  const handleFavorite = async () => {
    const response = await fetch('/api/favorites', {
      method: 'POST',
      body: JSON.stringify({ listingId: listing.id })
    })
    setIsFavorite(true)
  }

  return (
    <div>
      <h1>{listing.title}</h1>
      <button onClick={handleFavorite}>
        {isFavorite ? 'Favorited' : 'Add to Favorites'}
      </button>
    </div>
  )
}
```

### 6.2 Form Handling

#### Multi-Step Forms Pattern

The post vehicle form uses a 4-step flow managed with currentStep state:

```typescript
// app/post/page.tsx (excerpt showing form state management)
'use client'

import { useState } from 'react'

interface FormData {
  // Step 1: Vehicle Type
  vehicleType: VehicleType | ''

  // Step 2: Vehicle Details
  make: string
  model: string
  year: string

  // Step 3: Photos and Description
  images: File[]
  description: string

  // Step 4: Contact Information
  phone: string
  whatsapp: string
  email: string
}

export default function PostVehiclePage() {
  const [formData, setFormData] = useState<FormData>(initialFormData)
  const [currentStep, setCurrentStep] = useState(1)

  // Validation varies by vehicle type
  const validateForm = (): boolean => {
    const fieldConfig = getFieldConfig(formData.vehicleType || '')
    const errors: Record<string, string> = {}

    // Dynamic validation based on vehicle type
    if (fieldConfig.modelRequired && !formData.model) {
      errors.model = 'Model is required'
    }

    if (fieldConfig.mileageRequired && !formData.mileage) {
      errors.mileage = 'Mileage is required'
    }

    setErrors(errors)
    return Object.keys(errors).length === 0
  }

  return (
    <div>
      {/* Single scrolling page - no actual steps, just sections */}
      <VehicleTypeSection />
      <VehicleDetailsSection />
      <PhotosSection />
      <ContactSection />
    </div>
  )
}
```

#### Dynamic Validation Based on Vehicle Type

Different vehicle types have different required fields:

```typescript
// lib/utils/vehicleFieldConfig.ts
export function getFieldConfig(vehicleType: string) {
  switch (vehicleType) {
    case 'car':
    case 'van':
      return {
        showModel: true,
        modelRequired: true,
        showYear: true,
        yearRequired: true,
        showMileage: true,
        mileageRequired: true,
        showTrim: true,
        trimRequired: false,
        showEngineCapacity: true,
        showFuelType: true,
        showTransmission: true
      }

    case 'bicycle':
      return {
        showModel: true,
        modelRequired: false,
        showYear: false,
        yearRequired: false,
        showMileage: false,
        mileageRequired: false,
        showTrim: false,
        trimRequired: false,
        showEngineCapacity: false,
        showFuelType: false,
        showTransmission: false
      }

    case 'plant-machinery':
      return {
        showModel: true,
        modelRequired: true,
        showYear: true,
        yearRequired: true,
        showMileage: true,
        mileageRequired: false,  // Not required for machinery
        showTrim: false,
        trimRequired: false,
        showEngineCapacity: true,
        showFuelType: true,
        showTransmission: false
      }

    default:
      return defaultConfig
  }
}
```

#### Draft Auto-Save to localStorage

```typescript
// app/post/page.tsx (excerpt)
useEffect(() => {
  if (isEditMode) return  // Skip in edit mode

  const timer = setTimeout(() => {
    // Don't save images (File objects can't be serialized)
    const { images, imageUrls, ...draftData } = formData
    localStorage.setItem('vehiclePostDraft', JSON.stringify(draftData))
  }, 1000)  // Debounce: save 1 second after last change

  return () => clearTimeout(timer)
}, [formData, isEditMode])

// Load draft on mount
useEffect(() => {
  if (isEditMode) return

  const draft = localStorage.getItem('vehiclePostDraft')
  if (draft) {
    try {
      const parsed = JSON.parse(draft)
      delete parsed.images  // Can't restore File objects
      delete parsed.imageUrls
      setFormData({ ...initialFormData, ...parsed })
    } catch (e) {
      console.error('Failed to parse draft', e)
    }
  }
}, [isEditMode])
```

#### Phone Verification Integration in Forms

```typescript
// app/post/page.tsx (excerpt)
const [pendingPhone, setPendingPhone] = useState<string>('')
const [pendingOtpCode, setPendingOtpCode] = useState<string>('')
const [showEditPhoneModal, setShowEditPhoneModal] = useState(false)

const handlePhoneVerified = (newPhone: string, otpCode?: string, shouldCache?: boolean) => {
  setFormData(prev => ({ ...prev, phone: newPhone }))

  // Store OTP code to send with form submission
  if (otpCode) {
    setPendingOtpCode(otpCode)
  }

  // Save to cache if user has no profile contact info
  if (shouldCache) {
    saveContactToCache(newPhone, formData.whatsapp || newPhone)
  }

  setShowEditPhoneModal(false)
}

// Submit listing with OTP verification
const submitListing = async () => {
  const response = await fetch('/api/listings', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      // ... listing data
      phone: formData.phone,
      phoneOtpCode: pendingOtpCode  // Include OTP for server verification
    })
  })
}
```

#### Form State Management Patterns

```typescript
// Controlled inputs with validation
<input
  name="price"
  type="number"
  value={formData.price}
  onChange={(e) => {
    setFormData(prev => ({ ...prev, price: e.target.value }))
    // Clear error when user starts typing
    setErrors(prev => ({ ...prev, price: undefined }))
  }}
  className={errors.price ? 'border-red-300' : 'border-gray-300'}
/>
{errors.price && (
  <p className="text-red-600 text-sm mt-1">{errors.price}</p>
)}

// Checkbox for boolean values
<label className="flex items-center">
  <input
    type="checkbox"
    checked={formData.negotiable}
    onChange={(e) => setFormData(prev => ({
      ...prev,
      negotiable: e.target.checked
    }))}
    className="mr-2"
  />
  Price is negotiable
</label>

// Dynamic conditional fields
{formData.pricingType === 'finance' && (
  <div>
    <label>Outstanding Balance</label>
    <input
      name="outstandingBalance"
      type="number"
      value={formData.outstandingBalance}
      onChange={(e) => setFormData(prev => ({
        ...prev,
        outstandingBalance: e.target.value
      }))}
    />
  </div>
)}
```

### 6.3 Type System

#### Core Types from lib/types.ts

**User and Profile Types**
```typescript
export interface User {
  id: string
  email: string
  name?: string
  phone?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface Profile {
  id: string
  email: string
  phone?: string
  whatsapp?: string
  name?: string
  location?: string
  language: string
  bio?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

export interface BusinessProfile {
  id: string
  business_name: string
  business_type: string
  description?: string
  logo_url?: string
  website?: string
  address?: string
  phone?: string
  operating_hours?: string
  is_verified: boolean
  created_at: string
  updated_at: string
}
```

**Listing Type**
```typescript
export interface Listing {
  id: string
  user_id: string
  title: string
  description: string
  price: number
  make: string
  model: string
  year: number
  mileage?: number
  fuel_type: string
  transmission: string
  body_type?: string
  engine_capacity?: string
  location: string
  phone?: string
  whatsapp?: string
  email?: string
  image_urls: string[]
  primary_image_url?: string

  // AI-generated content
  ai_generated_description?: string
  ai_summary?: string

  // Promotion flags
  is_featured: boolean
  is_top_spot: boolean
  is_boosted: boolean
  is_urgent: boolean
  boost_score: number
  featured_until?: string
  top_spot_until?: string
  boosted_until?: string
  urgent_until?: string

  // Finance information
  pricing_type: 'cash' | 'finance'
  negotiable: boolean
  finance_type?: string
  finance_provider?: string
  original_amount?: number
  outstanding_balance?: number
  monthly_payment?: number
  remaining_term?: number
  early_settlement?: number
  asking_price?: number

  is_sold: boolean
  views: number
  created_at: string
  updated_at: string
  vehicle_type?: string
}
```

**Wanted Request Type**
```typescript
export interface WantedRequest {
  id: string
  user_id: string
  title: string
  description: string
  vehicle_type?: string
  make?: string
  model?: string
  min_year?: number
  max_year?: number
  min_budget: number
  max_budget: number
  fuel_type?: string
  transmission?: string
  body_type?: string
  location?: string
  phone?: string
  whatsapp?: string
  email?: string
  is_active: boolean
  status?: 'pending' | 'active' | 'paused' | 'deleted' | 'fulfilled'
  approved_at?: string
  approved_by?: string
  rejection_reason?: string
  expires_at?: string
  created_at: string
  updated_at: string
}
```

**Promotion Types**
```typescript
export interface Promotion {
  id: string
  listing_id: string
  promotion_type: 'featured' | 'top_spot' | 'boost' | 'urgent'
  started_at: string
  expires_at: string
  is_active: boolean
  last_boosted_at?: string
  payment_id?: string
  amount: number
  rotation_score: number
  impressions: number
  last_shown_at?: string
  rotation_group?: string
  created_at: string
  updated_at: string
}

export interface PromotionRotation {
  id: string
  promotion_id: string
  listing_id: string
  promotion_type: string
  rotation_slot: number
  rotation_cycle: number
  impressions_in_cycle: number
  last_rotated_at: string
  created_at: string
}
```

**Message Type**
```typescript
export interface Message {
  id: string
  sender_id: string
  recipient_id: string
  listing_id?: string
  subject: string
  content: string
  is_read: boolean
  is_archived: boolean
  created_at: string
}
```

#### API Request/Response Types

```typescript
export interface ApiResponse<T = any> {
  data?: T
  error?: string
  message?: string
  success: boolean
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

// Usage example:
const fetchListings = async (): Promise<PaginatedResponse<Listing>> => {
  const response = await fetch('/api/listings?page=1&limit=20')
  return response.json()
}
```

#### Utility Types

```typescript
// Make all properties nullable
export type Nullable<T> = {
  [P in keyof T]: T[P] | null
}

// Make specific keys optional
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// Make all properties optional recursively
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P]
}

// Usage examples:
type NullableListing = Nullable<Listing>  // All fields can be null
type OptionalPhone = Optional<Profile, 'phone' | 'whatsapp'>  // phone and whatsapp optional
type PartialFormData = DeepPartial<FormData>  // All fields recursively optional
```

**Search Filters Type**
```typescript
export interface SearchFilters {
  make?: string
  model?: string
  minYear?: number
  maxYear?: number
  minPrice?: number
  maxPrice?: number
  fuelType?: string
  transmission?: string
  bodyType?: string
  location?: string
  isFinance?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'year_asc' | 'year_desc' | 'created_at'
}
```

**Form Data Type**
```typescript
export interface VehicleFormData {
  title: string
  description: string
  make: string
  model: string
  year: number
  price: number
  mileage?: number
  fuel_type: string
  transmission: string
  body_type?: string
  engine_capacity?: string
  location: string
  phone?: string
  whatsapp?: string
  email?: string
  images: File[]
  pricing_type: 'cash' | 'finance'
  negotiable: boolean
  finance_type?: string
  finance_provider?: string
  original_amount?: number
  outstanding_balance?: number
  monthly_payment?: number
  remaining_term?: number
  early_settlement?: number
  asking_price?: number
}
```

### 6.4 Error Handling

#### APIError Class Pattern

```typescript
// lib/errorHandling.ts
export class APIError extends Error {
  status: number
  details?: any

  constructor(message: string, status: number = 500, details?: any) {
    super(message)
    this.name = 'APIError'
    this.status = status
    this.details = details
  }
}

// Usage in API routes:
if (!user) {
  throw new APIError('Unauthorized', 401)
}

if (validationErrors.length > 0) {
  throw new APIError('Validation failed', 400, { errors: validationErrors })
}
```

#### Try/Catch in API Routes with Proper Status Codes

```typescript
// app/api/listings/route.ts (excerpt)
export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // 2. Parse and validate
    const body = await request.json()
    const validation = validateListing(body)

    if (!validation.isValid) {
      return NextResponse.json(
        { error: 'Validation failed', errors: validation.errors },
        { status: 400 }
      )
    }

    // 3. Database operation
    const { data: listing, error: dbError } = await supabase
      .from('listings')
      .insert(listingData)
      .select()
      .single()

    if (dbError) {
      logger.error('Database error creating listing', dbError)
      return NextResponse.json(
        { error: 'Failed to create listing', details: dbError.message },
        { status: 500 }
      )
    }

    // 4. Success response
    return NextResponse.json(
      { success: true, listing },
      { status: 201 }
    )

  } catch (error: any) {
    // Generic error handler
    logger.error('Unexpected error in POST /api/listings', error)
    return NextResponse.json(
      { error: 'Internal server error', details: error.message },
      { status: 500 }
    )
  }
}
```

#### Safe JSON Response Generation

```typescript
// lib/utils/api-helpers.ts
export function safeJsonResponse<T>(
  data: T,
  status: number = 200
): NextResponse {
  try {
    return NextResponse.json(data, { status })
  } catch (error) {
    logger.error('Failed to serialize JSON response', error as Error)
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    )
  }
}

// Usage:
return safeJsonResponse({ listings, total: count }, 200)
```

#### Logger Integration in Error Handlers

```typescript
// lib/utils/logger.ts provides structured logging
import { logger } from '@/lib/utils/logger'

try {
  // Operation
} catch (error) {
  logger.error('Operation failed', error as Error, {
    context: 'create-listing',
    userId: user.id,
    attemptNumber: 3
  })

  throw new APIError('Operation failed', 500)
}

// Logger methods:
logger.debug('Debug message', context)
logger.info('Info message', context)
logger.warn('Warning message', context)
logger.error('Error message', error, context)
logger.api.request('GET', '/api/listings')
logger.api.success('GET', '/api/listings', durationMs)
logger.api.error('GET', '/api/listings', error)
logger.db.query('SELECT * FROM listings', { durationMs: 45 })
```

#### Client-Side Error Boundaries

```typescript
// app/error.tsx (global error boundary)
'use client'

import { useEffect } from 'react'
import { logger } from '@/lib/utils/logger'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log error to monitoring service
    logger.error('Unhandled error in application', error)
  }, [error])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong
        </h2>
        <p className="text-gray-600 mb-6">
          We've been notified and are working on a fix.
        </p>
        <button
          onClick={() => reset()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
```

### 6.5 State Management

#### React Context Pattern (AuthContext Example)

```typescript
// app/contexts/AuthContext.tsx
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { User } from '@supabase/supabase-js'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

interface AuthContextType {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signOut: async () => {},
  refreshUser: async () => {}
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabase] = useState(() => createClientComponentClient())

  useEffect(() => {
    // Check active session
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        setUser(session?.user ?? null)
      } catch (error) {
        console.error('Error checking session', error)
      } finally {
        setLoading(false)
      }
    }

    checkSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null)
        setLoading(false)

        if (event === 'SIGNED_OUT') {
          window.location.href = '/'
        }
      }
    )

    return () => subscription.unsubscribe()
  }, [supabase])

  const signOut = async () => {
    await supabase.auth.signOut()
    setUser(null)
    window.location.href = '/'
  }

  const refreshUser = async () => {
    const { data: { session } } = await supabase.auth.getSession()
    setUser(session?.user ?? null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signOut, refreshUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
```

Usage:
```typescript
// app/layout.tsx
import { AuthProvider } from '@/app/contexts/AuthContext'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}

// Any client component
'use client'
import { useAuth } from '@/app/contexts/AuthContext'

export default function ProfilePage() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not authenticated</div>

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  )
}
```

#### Custom Hooks for Server State (useUserProfile Pattern)

```typescript
// lib/hooks/useUserProfile.ts
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/contexts/AuthContext'
import { Profile } from '@/lib/types'
import { supabase } from '@/lib/supabase'

export function useUserProfile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error
        setProfile(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [user])

  const getPhoneNumber = () => {
    return profile?.phone || user?.phone || ''
  }

  const getWhatsAppNumber = () => {
    return profile?.whatsapp || profile?.phone || ''
  }

  return {
    profile,
    loading,
    error,
    getPhoneNumber,
    getWhatsAppNumber
  }
}
```

#### Local State Management with useState

```typescript
// Simple local state for UI
const [isOpen, setIsOpen] = useState(false)
const [searchQuery, setSearchQuery] = useState('')
const [selectedItems, setSelectedItems] = useState<string[]>([])

// Complex form state
interface FormState {
  name: string
  email: string
  phone: string
}

const [formState, setFormState] = useState<FormState>({
  name: '',
  email: '',
  phone: ''
})

// Update single field
const updateField = (field: keyof FormState, value: string) => {
  setFormState(prev => ({ ...prev, [field]: value }))
}

// Update multiple fields
const updateForm = (updates: Partial<FormState>) => {
  setFormState(prev => ({ ...prev, ...updates }))
}
```

#### Data Fetching Patterns (SWR-style with useEffect)

```typescript
// Manual data fetching with caching
function useListings(filters: SearchFilters) {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    let cancelled = false

    const fetchListings = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/listings?' + new URLSearchParams({
          make: filters.make || '',
          minPrice: String(filters.minPrice || ''),
          maxPrice: String(filters.maxPrice || '')
        }))

        if (!response.ok) {
          throw new Error('Failed to fetch listings')
        }

        const data = await response.json()

        // Prevent state update if component unmounted
        if (!cancelled) {
          setListings(data.listings)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err as Error)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    fetchListings()

    // Cleanup function to prevent memory leaks
    return () => {
      cancelled = true
    }
  }, [filters.make, filters.minPrice, filters.maxPrice])

  return { listings, loading, error }
}

// Usage:
function ListingsPage() {
  const [filters, setFilters] = useState<SearchFilters>({ make: 'Toyota' })
  const { listings, loading, error } = useListings(filters)

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <div>
      {listings.map(listing => (
        <ListingCard key={listing.id} listing={listing} />
      ))}
    </div>
  )
}
```

---

## 7. Development Workflow

Complete guide to local development, testing, database management, and deployment.

### 7.1 Local Development

#### Start Development Server

```bash
# Start Next.js dev server + Sentry MCP server
npm run dev

# Development server runs on http://localhost:3001
# Uses custom server.js (not default Next.js dev server)
```

**Custom server.js Implementation:**
```javascript
// server.js
const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')
const { spawn } = require('child_process')

const dev = process.env.NODE_ENV !== 'production'
const hostname = 'localhost'
const port = process.env.PORT || 3001

const app = next({ dev, hostname, port })
const handle = app.getRequestHandler()

let mcpProcess = null

// Start MCP Server (Sentry monitoring)
function startMCPServer() {
  console.log('🚀 Starting Sentry MCP Server...')

  mcpProcess = spawn('node', ['mcp-sentry.config.js'], {
    stdio: ['inherit', 'inherit', 'inherit'],
    cwd: process.cwd()
  })

  mcpProcess.on('error', (err) => {
    console.error('❌ MCP Server failed to start:', err)
  })

  console.log('✅ Sentry MCP Server started')
}

// Graceful shutdown
function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`)

  if (mcpProcess) {
    mcpProcess.kill('SIGTERM')
    setTimeout(() => {
      if (mcpProcess && !mcpProcess.killed) {
        mcpProcess.kill('SIGKILL')
      }
    }, 5000)
  }

  process.exit(0)
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
process.on('SIGINT', () => gracefulShutdown('SIGINT'))

// Start servers
app.prepare().then(() => {
  startMCPServer()  // MCP first

  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  }).listen(port, hostname, (err) => {
    if (err) throw err
    console.log(`✅ Next.js server ready on http://${hostname}:${port}`)
    console.log(`🔗 Both Next.js and Sentry MCP Server are running`)
  })
})
```

#### Environment Setup

```bash
# 1. Copy environment template
cp .env.example .env.local

# 2. Configure required variables
# Edit .env.local with your values
```

**Required Environment Variables (18):**
```bash
# Supabase (3 required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary (3 required)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Text.lk SMS (2 required)
TEXTLK_API_KEY=your_bearer_token
TEXTLK_SENDER_ID=your_sender_id

# OpenAI (1 required)
OPENAI_API_KEY=sk-your_openai_key

# PayHere (2 required)
PAYHERE_MERCHANT_ID=your_merchant_id
PAYHERE_MERCHANT_SECRET=your_merchant_secret

# Google OAuth (2 required)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_client_secret

# Security (3 required)
JWT_SECRET=your_jwt_secret
CSRF_SECRET=your_csrf_secret
CRON_SECRET=your_cron_secret

# Application (2 required)
NEXT_PUBLIC_APP_URL=http://localhost:3001
NEXT_PUBLIC_SITE_URL=https://vera.lk
```

**Optional Environment Variables (6):**
```bash
# Sentry (optional - for error tracking)
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
SENTRY_ORG=your_org_slug
SENTRY_PROJECT=your_project_slug

# Upstash Redis (optional - for distributed rate limiting)
UPSTASH_REDIS_REST_URL=your_upstash_url
UPSTASH_REDIS_REST_TOKEN=your_upstash_token

# reCAPTCHA (optional - disabled by default)
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=your_site_key
RECAPTCHA_SECRET_KEY=your_secret_key
RECAPTCHA_ENABLED=false
```

#### Database Connection

The application uses Supabase remote PostgreSQL (no local database required):

```typescript
// lib/supabase.ts (client-side)
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// lib/supabase-server.ts (server-side)
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export function createServerClient() {
  const cookieStore = cookies()
  return createServerComponentClient({ cookies: () => cookieStore })
}

// lib/supabaseAdmin.ts (admin operations)
import { createClient } from '@supabase/supabase-js'

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
```

### 7.2 Testing

#### Test Commands

```bash
# Run all tests
npm test

# Run tests in watch mode (auto-rerun on file changes)
npm test:watch

# Run tests with coverage report
npm test:coverage

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# End-to-end tests (Playwright)
npm run test:e2e

# E2E with UI mode
npm run test:e2e:ui

# E2E in headed mode (see browser)
npm run test:e2e:headed

# CI mode (all tests with coverage, no watch)
npm run test:ci
```

#### Jest Configuration

```javascript
// jest.config.js
const nextJest = require('next/jest')

const createJestConfig = nextJest({
  dir: './',
})

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',

  // Test file patterns
  testMatch: [
    '<rootDir>/tests/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/__tests__/**/*.{js,jsx,ts,tsx}',
    '<rootDir>/**/*.{test,spec}.{js,jsx,ts,tsx}'
  ],

  testPathIgnorePatterns: [
    '<rootDir>/.next/',
    '<rootDir>/node_modules/',
  ],

  // Coverage collection
  collectCoverageFrom: [
    'lib/**/*.{js,jsx,ts,tsx}',
    'app/**/*.{js,jsx,ts,tsx}',
    'components/**/*.{js,jsx,ts,tsx}',
    'utils/**/*.{js,jsx,ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
    '!**/.next/**',
    '!**/coverage/**',
    '!**/__tests__/**',
    '!**/tests/**',
  ],

  // Coverage thresholds (70% enforced)
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },

  // Module path aliases
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/utils/(.*)$': '<rootDir>/utils/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
}

module.exports = createJestConfig(customJestConfig)
```

#### Test Organization

```
tests/
├── unit/                    # Unit tests (isolated functions)
│   ├── lib/
│   │   ├── phoneFormatter.test.ts
│   │   ├── errorHandling.test.ts
│   │   └── rateLimiter.test.ts
│   └── utils/
│       └── validation.test.ts
│
├── integration/             # Integration tests (multiple components)
│   ├── api/
│   │   ├── listings.test.ts
│   │   └── auth.test.ts
│   └── components/
│       └── ListingCard.test.ts
│
└── e2e/                     # End-to-end tests (Playwright)
    ├── listing-flow.spec.ts
    ├── auth-flow.spec.ts
    └── search-flow.spec.ts
```

#### Example Unit Test

```typescript
// tests/unit/lib/phoneFormatter.test.ts
import { formatPhoneForStorage, formatPhoneDisplay, normalizeSriLankaPhone } from '@/lib/utils/phoneFormatter'

describe('phoneFormatter', () => {
  describe('formatPhoneForStorage', () => {
    it('should format local numbers to international format', () => {
      expect(formatPhoneForStorage('0771234567', '94')).toBe('+94771234567')
      expect(formatPhoneForStorage('771234567', '94')).toBe('+94771234567')
    })

    it('should preserve already formatted numbers', () => {
      expect(formatPhoneForStorage('+94771234567', '94')).toBe('+94771234567')
      expect(formatPhoneForStorage('94771234567', '94')).toBe('+94771234567')
    })

    it('should handle numbers with spaces and dashes', () => {
      expect(formatPhoneForStorage('077 123 4567', '94')).toBe('+94771234567')
      expect(formatPhoneForStorage('077-123-4567', '94')).toBe('+94771234567')
    })
  })

  describe('formatPhoneDisplay', () => {
    it('should format international numbers for display', () => {
      expect(formatPhoneDisplay('+94771234567', '94')).toBe('077 123 4567')
      expect(formatPhoneDisplay('94771234567', '94')).toBe('077 123 4567')
    })

    it('should handle already local format', () => {
      expect(formatPhoneDisplay('0771234567', '94')).toBe('077 123 4567')
    })
  })

  describe('normalizeSriLankaPhone', () => {
    it('should normalize various phone formats', () => {
      const tests = [
        ['0771234567', '+94771234567'],
        ['771234567', '+94771234567'],
        ['+94771234567', '+94771234567'],
        ['94771234567', '+94771234567'],
        ['077 123 4567', '+94771234567'],
      ]

      tests.forEach(([input, expected]) => {
        expect(normalizeSriLankaPhone(input)).toBe(expected)
      })
    })

    it('should return original if invalid', () => {
      expect(normalizeSriLankaPhone('invalid')).toBe('invalid')
      expect(normalizeSriLankaPhone('123')).toBe('123')
    })
  })
})
```

#### Example E2E Test (Playwright)

```typescript
// tests/e2e/listing-flow.spec.ts
import { test, expect } from '@playwright/test'

test.describe('Listing Creation Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    await page.goto('/login')
    await page.fill('input[name="email"]', 'test@example.com')
    await page.fill('input[name="password"]', 'password123')
    await page.click('button[type="submit"]')
    await page.waitForURL('/profile')
  })

  test('should create a new car listing', async ({ page }) => {
    // Navigate to post page
    await page.goto('/post')

    // Step 1: Select vehicle type
    await page.click('button:has-text("Car")')
    await expect(page.locator('text=Vehicle Details')).toBeVisible()

    // Step 2: Fill vehicle details
    await page.selectOption('select[name="make"]', 'Toyota')
    await page.selectOption('select[name="model"]', 'Corolla')
    await page.fill('input[name="year"]', '2020')
    await page.fill('input[name="mileage"]', '25000')
    await page.fill('input[name="price"]', '5000000')

    // Step 3: Upload image
    await page.setInputFiles('input[type="file"]', 'tests/fixtures/car.jpg')
    await expect(page.locator('img[alt*="Preview"]')).toBeVisible()

    // Step 4: Fill description
    await page.fill('textarea[name="description"]', 'Well maintained Toyota Corolla')

    // Step 5: Fill location
    await page.selectOption('select[name="district"]', 'Colombo')
    await page.selectOption('select[name="city"]', 'Colombo 3')

    // Step 6: Submit
    await page.click('button:has-text("Publish Listing")')

    // Verify success
    await expect(page.locator('text=Listing created successfully')).toBeVisible()
    await page.waitForURL('/profile')
  })

  test('should show validation errors', async ({ page }) => {
    await page.goto('/post')

    // Try to submit without filling form
    await page.click('button:has-text("Publish Listing")')

    // Check for validation errors
    await expect(page.locator('text=Vehicle type is required')).toBeVisible()
    await expect(page.locator('text=Price is required')).toBeVisible()
    await expect(page.locator('text=At least one image is required')).toBeVisible()
  })
})
```

### 7.3 Database Development

#### Migration Creation Workflow

```bash
# 1. Create new migration file in database-migrations/
# Naming convention: YYYYMMDD_description.sql
touch database-migrations/20260121_add_new_feature.sql
```

#### Migration Template

```sql
-- Migration: Add New Feature
-- Description: Brief description of what this migration does
-- Date: 2026-01-21

BEGIN;

-- ============================================================================
-- 1. CREATE TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS new_feature_table (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Constraints
  CONSTRAINT check_name_not_empty CHECK (name <> '')
);

-- ============================================================================
-- 2. CREATE INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_new_feature_user_id
  ON new_feature_table(user_id);

CREATE INDEX IF NOT EXISTS idx_new_feature_active
  ON new_feature_table(is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_new_feature_search
  ON new_feature_table USING gin(to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- ============================================================================
-- 3. ROW LEVEL SECURITY (RLS)
-- ============================================================================

ALTER TABLE new_feature_table ENABLE ROW LEVEL SECURITY;

-- Users can view their own records
CREATE POLICY "Users can view own records"
  ON new_feature_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own records
CREATE POLICY "Users can insert own records"
  ON new_feature_table
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own records
CREATE POLICY "Users can update own records"
  ON new_feature_table
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own records
CREATE POLICY "Users can delete own records"
  ON new_feature_table
  FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- 4. GRANT PERMISSIONS
-- ============================================================================

GRANT SELECT, INSERT, UPDATE, DELETE ON new_feature_table TO authenticated;
GRANT SELECT ON new_feature_table TO anon;

-- ============================================================================
-- 5. CREATE FUNCTIONS (if needed)
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_new_feature_updated_at
  BEFORE UPDATE ON new_feature_table
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

COMMIT;
```

#### Apply Migrations

```bash
# Method 1: Supabase CLI
supabase db push

# Method 2: Supabase Dashboard
# 1. Go to Supabase Dashboard > SQL Editor
# 2. Paste migration SQL
# 3. Click "Run"

# Method 3: MCP Tool (if using Supabase MCP server)
# Use mcp__supabase__apply_migration tool from Claude Desktop
```

#### Performance Monitoring

```bash
# Check database performance advisors
npm run mcp:server

# Then use MCP tool: mcp__supabase__get_advisors
# Returns performance warnings and recommendations
```

Performance Advisor output example:
```json
{
  "security": {
    "level": "EXCELLENT",
    "issues": 0
  },
  "performance": {
    "level": "EXCELLENT",
    "warnings": 37,
    "previousWarnings": 157,
    "improvement": "76% reduction"
  },
  "recommendations": [
    {
      "level": "INFO",
      "message": "Consider adding composite index on (user_id, created_at) for listings table",
      "impact": "Medium",
      "query": "SELECT * FROM listings WHERE user_id = ? ORDER BY created_at DESC"
    }
  ]
}
```

#### RLS Policy Testing

Test RLS policies using SET LOCAL commands:

```sql
-- Test as specific user
BEGIN;
SET LOCAL role TO authenticated;
SET LOCAL request.jwt.claim.sub TO '9b288153-3836-45ff-8f0b-8a196e423477';

-- Test query (should only return user's own records)
SELECT * FROM listings WHERE user_id = current_setting('request.jwt.claim.sub')::uuid;

ROLLBACK;

-- Test as anonymous user
BEGIN;
SET LOCAL role TO anon;

-- Test query (should only return public data)
SELECT * FROM listings WHERE status = 'active';

ROLLBACK;
```

### 7.4 Deployment

#### Build for Production

```bash
# 1. Install dependencies
npm install

# 2. Run tests
npm run test:ci

# 3. Build application
npm run build

# Output: .next/standalone directory (standalone build)
```

**Build Configuration (next.config.js):**
```javascript
// next.config.js
const nextConfig = {
  output: 'standalone',  // Vercel deployment optimization

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/your-cloud-name/**',
      },
      {
        protocol: 'https',
        hostname: 'ahmynvxoxzhocuhxlcvo.supabase.co',
        pathname: '/**',
      },
    ],
  },

  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

module.exports = nextConfig
```

#### Vercel Deployment (Automatic)

```bash
# 1. Connect GitHub repository to Vercel
# 2. Configure environment variables in Vercel dashboard
# 3. Push to main branch

git add .
git commit -m "Deploy changes"
git push origin main

# Vercel automatically:
# - Detects push to main
# - Runs npm run build
# - Deploys to production
# - Updates vera.lk domain
```

**Vercel Configuration (vercel.json):**
```json
{
  "regions": ["sin1"],
  "crons": [
    {
      "path": "/api/cron/cleanup-otp",
      "schedule": "0 2 * * *"
    }
  ]
}
```

#### Environment Variables

**Setting in Vercel Dashboard:**
1. Go to Project Settings > Environment Variables
2. Add all required variables (18 required + 6 optional)
3. Set scope: Production, Preview, Development

**Required Variables:**
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY
- CLOUDINARY_CLOUD_NAME
- CLOUDINARY_API_KEY
- CLOUDINARY_API_SECRET
- TEXTLK_API_KEY
- TEXTLK_SENDER_ID
- OPENAI_API_KEY
- PAYHERE_MERCHANT_ID
- PAYHERE_MERCHANT_SECRET
- NEXT_PUBLIC_GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET
- JWT_SECRET
- CSRF_SECRET
- CRON_SECRET
- NEXT_PUBLIC_APP_URL
- NEXT_PUBLIC_SITE_URL

#### Cron Jobs Configuration

```json
// vercel.json
{
  "crons": [
    {
      "path": "/api/cron/cleanup-otp",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/expire-promotions",
      "schedule": "0 */1 * * *"
    },
    {
      "path": "/api/cron/rotate-featured",
      "schedule": "0 */1 * * *"
    }
  ]
}
```

Cron job endpoint example:
```typescript
// app/api/cron/cleanup-otp/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Delete expired OTP codes (older than 10 minutes)
  const { error } = await supabaseAdmin
    .from('otp_codes')
    .delete()
    .lt('created_at', new Date(Date.now() - 10 * 60 * 1000).toISOString())

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
```

#### Monitoring Setup

**Sentry Error Tracking:**
```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,

  beforeSend(event) {
    // Filter out known errors
    if (event.exception?.values?.[0]?.value?.includes('ResizeObserver loop')) {
      return null
    }
    return event
  },
})

// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs'

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 1.0,
  environment: process.env.NODE_ENV,
})
```

**Vercel Analytics:**
```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
```

#### Post-Deployment Checks (5-Point Checklist)

```bash
# 1. Check deployment status
# - Vercel Dashboard > Deployments
# - Verify build succeeded
# - Check deployment logs for errors

# 2. Test critical paths
curl https://vera.lk/api/health
# Expected: { "status": "ok", "timestamp": "2026-01-21T..." }

# 3. Verify database connection
curl https://vera.lk/api/listings?page=1&limit=10
# Expected: { "listings": [...], "total": 150 }

# 4. Test authentication
# - Login with test account
# - Create test listing
# - Verify profile page loads

# 5. Monitor error rates
# - Sentry Dashboard > Issues
# - Check for new errors in last 30 minutes
# - Vercel Dashboard > Analytics
# - Verify 200 response rate > 99%
```

**Health Check Endpoint:**
```typescript
// app/api/health/route.ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET() {
  try {
    // Test database connection
    const { error } = await supabaseAdmin
      .from('listings')
      .select('id')
      .limit(1)

    if (error) throw error

    return NextResponse.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    })
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
```

---

## Conclusion

This comprehensive technical documentation covers the complete architecture, implementation details, and operational aspects of Vera.lk. For an external engineer, this provides:

1. **System Understanding**: Complete technology stack, architecture, and data flows
2. **Implementation Details**: Code-level examples for all major features
3. **API Reference**: Complete endpoint documentation with request/response schemas
4. **Database Schema**: Full schema with RLS policies, indexes, and optimizations
5. **Code Patterns**: Reusable patterns and conventions used throughout
6. **Development Workflow**: Local development, testing, database management, deployment

**Key Metrics**:
- Lines of Code: ~100,000+ across frontend and backend
- API Endpoints: 50+ REST endpoints
- Database Tables: 45 tables with comprehensive RLS
- Performance: 76% reduction in database warnings (157 → 37)
- Test Coverage: 70% threshold enforced
- Deployment: Vercel with standalone output

**Architectural Highlights**:
- Next.js 14 App Router with Server/Client Components
- Supabase for database, auth, and storage
- Multi-provider authentication (Email, Google OAuth, Phone OTP)
- Advanced promotion rotation with fair share algorithm
- Comprehensive security (rate limiting, CSRF, RLS)
- Performance optimizations (composite indexes, RLS caching)

**External Service Integrations**:
- Cloudinary: Image processing and optimization
- Text.lk: SMS gateway for OTP
- Google Gemini AI: Description generation
- Sentry: Error tracking and monitoring
- Upstash Redis: Distributed rate limiting

This documentation serves as the definitive technical reference for understanding, maintaining, and extending the Vera.lk vehicle marketplace platform.
