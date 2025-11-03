# Profile Route Migration Guide

## Overview

The profile system has been restructured from a monolithic tab-based component to a modular URL-based routing architecture. This document provides a complete migration guide for finishing the content migration.

---

## What's Been Completed ✅

### Phase 1: Shared Services Layer
Created reusable hooks that consolidate business logic:

**Files Created:**
- `lib/services/apiClient.ts` - Centralized fetch wrapper with auth (99 lines)
- `app/hooks/useBusinessProfile.ts` - Business profile CRUD operations (150 lines)
- `app/hooks/useListingManagement.ts` - Listing management (197 lines)
- `app/hooks/useMessaging.ts` - Messaging/conversations (131 lines)
- `app/hooks/useFavorites.ts` - Favorites management (117 lines)

**Benefits:**
- Eliminated 24 duplicate API endpoint calls
- Consolidated 37 state variables into 4 hooks
- Single source of truth for each data domain
- Testable in isolation

### Phase 2: URL-Based Routes
Replaced tab-based navigation with dedicated routes:

**New Route Structure:**
```
/profile                    → Landing page with categorized links
├── /account               → Personal profile settings
├── /business              → Business profile management
├── /listings              → Vehicle listings management
├── /wanted                → Wanted requests
├── /favorites             → Favorited items
├── /messages              → Messaging conversations
├── /notifications         → Notification preferences
├── /security              → Account security & sessions
├── /bin                   → Deleted items recovery
└── /setup                 → Profile creation (unchanged)
```

**Landing Page Features:**
- Categorized sections (Personal Management, Content & Activity, Business Tools, Utilities)
- Dynamic badge counts (listings count, favorites count, unread messages)
- Conditional business section (only shows if business profile is active)
- Responsive card grid layout

### Phase 3: Navigation Updates
Updated all navigation components to use new URLs:

**Updated Components:**
- `app/components/header.tsx`:
  - Desktop dropdown menu links
  - Mobile hamburger menu links
  - Notification icon links
  - All `?tab=` parameters replaced with `/profile/{route}`

**Changes Made:**
- `/profile?tab=messages` → `/profile/messages`
- `/profile?tab=listings` → `/profile/listings`
- `/profile?tab=favorites` → `/profile/favorites`
- `/profile?tab=wanted` → `/profile/wanted`
- `/profile?tab=notifications` → `/profile/notifications`
- `/profile?tab=security` → `/profile/security`
- `/profile?tab=bin` → `/profile/bin`

---

## Remaining Work 📋

### Current Status

All routes are **functional with working data hooks**. Stub pages display:
- Listings count from `useListingManagement`
- Favorites counts from `useFavorites`
- Conversation count from `useMessaging`
- Business profile name from `useBusinessProfile`

**Backup Location:** `app/profile/page.tsx.backup` (2,862 lines - original monolithic component)

### Migration Tasks

#### 1. `/profile/account` - Account Settings ⚠️ HIGH PRIORITY

**Location in backup:** Lines 2026-2144

**Content to migrate:**
- Personal profile form (name, email, phone, country)
- Avatar upload section
- Business profile management section
- Create business profile modal

**Components to import:**
```typescript
import { useAuth } from '@/app/contexts/AuthContext'
import { useBusinessProfile } from '@/app/hooks/useBusinessProfile'
import { supabase } from '@/lib/supabase'
import BusinessProfileManagement from '@/app/components/profile/BusinessProfileManagement'
import CreateBusinessProfile from '@/app/components/profile/CreateBusinessProfile'
import PhoneVerificationModal from '@/app/components/PhoneVerificationModal'
import { formatPhoneForStorage, formatPhoneDisplay } from '@/lib/utils/phoneFormatter'
```

**Key functionality:**
- Profile update with `PUT /api/profiles`
- Phone verification flow
- Business profile CRUD using `useBusinessProfile` hook
- Avatar upload (currently commented out)

**Estimated effort:** 2-3 hours

---

#### 2. `/profile/listings` - Listings Management ⚠️ HIGH PRIORITY

**Location in backup:** Lines 2193-2415

**Content to migrate:**
- Status filter dropdown
- Desktop table view with actions
- Mobile card view
- Empty states per filter
- Action buttons (Mark as Sold, Edit, Pause/Resume, Delete, Renew)

**Components already available:**
```typescript
import { useAuth } from '@/app/contexts/AuthContext'
import { useListingManagement } from '@/app/hooks/useListingManagement'
import ListingStatusBadge from '@/app/components/listings/ListingStatusBadge'
import ListingActions from '@/app/components/listings/ListingActions'
import ListingStatusMessage from '@/app/components/listings/ListingStatusMessage'
import { filterListingsByStatus } from '@/lib/utils/listingStatus'
```

**Key functionality:**
- Filter by status: all, active, sold, pending, paused, reported
- Desktop: Table with image, title, price, views, status, date, actions
- Mobile: Card layout
- Actions: mark sold, pause, resume, delete, renew
- View link to `/listings/{id}`
- Edit link to `/post?edit={id}`

**Hook methods available:**
```typescript
const {
  listings,
  loading,
  statusFilter,
  setStatusFilter,
  markAsSold,
  renewListing,
  pauseListing,
  resumeListing,
  deleteListing
} = useListingManagement(user?.id)
```

**Estimated effort:** 3-4 hours

---

#### 3. `/profile/messages` - Messages ✅ EASY (Component Reuse)

**Location in backup:** Lines 2446-2458

**Already extracted component:** `app/components/messages/MessagesTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useMessaging } from '@/app/hooks/useMessaging'
import { useEffect } from 'react'
import MessagesTab from '@/app/components/messages/MessagesTab'

export default function MessagesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const messaging = useMessaging(user?.id)

  useEffect(() => {
    if (user) {
      messaging.fetchConversations()
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <MessagesTab
          conversations={messaging.conversations}
          selectedConversation={messaging.selectedConversation}
          messages={messaging.messages}
          loading={messaging.loading}
          messagesLoading={messaging.messagesLoading}
          onConversationSelect={messaging.selectConversation}
          onFetchMessages={messaging.fetchMessages}
          onMarkAsRead={messaging.markAsRead}
        />
      </div>
    </div>
  )
}
```

**Estimated effort:** 30 minutes

---

#### 4. `/profile/favorites` - Favorites ✅ EASY (Component Reuse)

**Location in backup:** Lines 2417-2444

**Already extracted component:** `app/components/favorites/FavoritesTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useFavorites } from '@/app/hooks/useFavorites'
import FavoritesTab from '@/app/components/favorites/FavoritesTab'

export default function FavoritesPage() {
  const router = useRouter()
  const { user } = useAuth()
  const { favoritedAds, favoritedWantedRequests, loading } = useFavorites(user?.id)

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <FavoritesTab
          favoriteAds={favoritedAds.map(ad => ({
            ...ad,
            // Transform to expected format
          }))}
          favoriteWantedRequests={favoritedWantedRequests}
          loading={loading}
        />
      </div>
    </div>
  )
}
```

**Estimated effort:** 30 minutes

---

#### 5. `/profile/wanted` - Wanted Requests ⚠️ MEDIUM PRIORITY

**Location in backup:** Lines 2460-2774

**Content to migrate:**
- Desktop table view
- Mobile card view
- Status badges and messages
- Action buttons (Pause, Resume, Close, Renew, Delete, Edit)
- Empty state

**Components to import:**
```typescript
import WantedRequestStatusBadge from '@/app/components/wantedRequests/WantedRequestStatusBadge'
import WantedRequestActions from '@/app/components/wantedRequests/WantedRequestActions'
import WantedRequestStatusMessage from '@/app/components/wantedRequests/WantedRequestStatusMessage'
```

**Key functionality:**
- Fetch wanted requests from Supabase
- Table columns: title, budget, location, clicks, status, posted date, actions
- Actions: pause, resume, close, renew, delete, edit
- View link to `/wanted/{id}`
- Edit link to `/wanted/post?edit={id}`

**Note:** Similar structure to listings page, but for wanted requests.

**Estimated effort:** 2-3 hours

---

#### 6. `/profile/notifications` - Notifications ✅ EASY (Component Reuse)

**Location in backup:** Lines 2776-2789

**Already extracted component:** `app/components/notifications/NotificationsTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import NotificationsTab from '@/app/components/notifications/NotificationsTab'
import { useState } from 'react'

export default function NotificationsPage() {
  const router = useRouter()

  // State for notification preferences
  const [preferences, setPreferences] = useState({
    emailNewMatches: true,
    emailPriceDrops: true,
    emailMessages: false,
    emailListingUpdates: true,
    smsUrgent: true,
    smsSecurity: false,
    marketingNewsletter: true,
    marketingPromotions: false
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <NotificationsTab
          preferences={preferences}
          onUpdate={setPreferences}
        />
      </div>
    </div>
  )
}
```

**Estimated effort:** 30 minutes

---

#### 7. `/profile/security` - Security Settings ✅ EASY (Component Reuse)

**Location in backup:** Lines 2791-2830

**Already extracted component:** `app/components/security/SecurityTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import { useSessionManager } from '@/app/hooks/useSessionManager'
import SecurityTab from '@/app/components/security/SecurityTab'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function SecurityPage() {
  const router = useRouter()
  const { user } = useAuth()
  const sessions = useSessionManager()

  const [hasExistingPassword, setHasExistingPassword] = useState(false)
  const [authProvider, setAuthProvider] = useState<'email' | 'google' | 'phone'>('email')

  // Detect authentication providers
  useEffect(() => {
    const detectAuthProviders = async () => {
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser()
        if (authUser?.identities) {
          const providers = authUser.identities.map(i => i.provider)
          const hasEmailProvider = providers.includes('email')
          setHasExistingPassword(hasEmailProvider)

          if (providers.includes('google')) {
            setAuthProvider('google')
          } else if (providers.includes('phone')) {
            setAuthProvider('phone')
          } else {
            setAuthProvider('email')
          }
        }
      } catch (error) {
        console.error('Error detecting auth providers:', error)
      }
    }

    if (user) {
      detectAuthProviders()
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <SecurityTab
          emailData={{
            email: user?.email || '',
            verified: user?.email_confirmed_at != null
          }}
          passwordData={{
            hasPassword: hasExistingPassword,
            provider: authProvider
          }}
          sessionsData={sessions}
        />
      </div>
    </div>
  )
}
```

**Estimated effort:** 1 hour

---

#### 8. `/profile/bin` - Deleted Items ✅ EASY (Component Reuse)

**Location in backup:** Lines 2832-2847

**Already extracted component:** `app/components/bin/BinTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useAuth } from '@/app/contexts/AuthContext'
import BinTab from '@/app/components/bin/BinTab'
import { useState, useCallback, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function BinPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [binItems, setBinItems] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const loadBinItems = useCallback(async () => {
    if (!user) return

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const response = await fetch('/api/user/bin', {
        headers: {
          'Authorization': `Bearer ${session?.access_token}`,
          'Content-Type': 'application/json',
        }
      })

      if (!response.ok) throw new Error('Failed to load bin items')

      const data = await response.json()
      setBinItems(data.all_items || [])
    } catch (error) {
      console.error('Error loading bin items:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadBinItems()
  }, [loadBinItems])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <BinTab
          binItems={binItems}
          loading={loading}
          onRestore={loadBinItems}
        />
      </div>
    </div>
  )
}
```

**Estimated effort:** 1 hour

---

#### 9. `/profile/business` - Business Profile ⚠️ MEDIUM PRIORITY

**Location in backup:** Lines 2147-2161

**Already extracted component:** `app/components/profile/BusinessPageTab.tsx`

**Simple migration:**
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { useBusinessProfile } from '@/app/hooks/useBusinessProfile'
import BusinessPageTab from '@/app/components/profile/BusinessPageTab'
import BusinessProfileRecovery from '@/app/components/profile/BusinessProfileRecovery'

export default function BusinessPage() {
  const router = useRouter()
  const { businessProfile, loading } = useBusinessProfile()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <button
          onClick={() => router.push('/profile')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Profile
        </button>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-semibold mb-6">Business Profile</h1>

          {loading ? (
            <p className="text-gray-600">Loading business profile...</p>
          ) : businessProfile ? (
            <BusinessPageTab
              businessProfile={businessProfile}
              onUpdate={() => {/* refresh */}}
            />
          ) : (
            <BusinessProfileRecovery />
          )}
        </div>
      </div>
    </div>
  )
}
```

**Estimated effort:** 1 hour

---

## Migration Checklist

### Pre-Migration
- [x] Create shared service hooks
- [x] Create URL-based route structure
- [x] Update navigation components
- [x] Create landing page
- [x] Backup original file (`page.tsx.backup`)

### Content Migration
- [ ] `/profile/account` - Account settings with business management
- [ ] `/profile/listings` - Listings table/cards with actions
- [ ] `/profile/messages` - Import MessagesTab component
- [ ] `/profile/favorites` - Import FavoritesTab component
- [ ] `/profile/wanted` - Wanted requests table with actions
- [ ] `/profile/notifications` - Import NotificationsTab component
- [ ] `/profile/security` - Import SecurityTab component
- [ ] `/profile/bin` - Import BinTab component
- [ ] `/profile/business` - Import BusinessPageTab component

### Post-Migration Testing
- [ ] Test all navigation links
- [ ] Test data loading on each route
- [ ] Test action buttons (mark sold, pause, delete, etc.)
- [ ] Test business profile CRUD
- [ ] Test messaging functionality
- [ ] Test favorites toggle
- [ ] Test security settings (password, sessions)
- [ ] Test bin restore functionality
- [ ] Test mobile responsive layouts
- [ ] Test back navigation
- [ ] Remove backup file after confirming everything works

---

## Key Architectural Improvements

### Before
- **Single file:** 2,862 lines, 115KB
- **State management:** 37 useState variables
- **Navigation:** Tab-based with URL params (`?tab=`)
- **Data fetching:** 24 duplicate API calls
- **Code splitting:** Manual dynamic imports

### After
- **Modular files:** Landing page (229 lines) + route pages
- **State management:** 4 reusable hooks (595 lines total)
- **Navigation:** URL-based routes (`/profile/{route}`)
- **Data fetching:** Centralized `apiClient` service
- **Code splitting:** Automatic via Next.js App Router

### Performance Benefits
- Smaller initial bundle (landing page only)
- Route-based code splitting
- Reduced prop drilling
- Better caching (URL-based)
- Easier to test (isolated routes)

---

## Helper Functions & Utilities

### Date Formatting
```typescript
function formatListingDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Yesterday'
  if (diffDays < 7) return `${diffDays} days ago`
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`
  return date.toLocaleDateString()
}
```

### Filtered Listings
```typescript
const filteredListings = filterListingsByStatus(listings, statusFilter)
```

---

## API Endpoints Reference

### Profile
- `PUT /api/profiles` - Update user profile
- `GET /api/profiles` - Get current user profile

### Listings
- `POST /api/listings/mark-sold` - Mark listing as sold
- `POST /api/listings/renew` - Renew listing
- `POST /api/listings/pause` - Pause listing

### Wanted Requests
- `POST /api/wanted-requests/pause` - Pause wanted request
- `POST /api/wanted-requests/resume` - Resume wanted request
- `POST /api/wanted-requests/close` - Close wanted request
- `POST /api/wanted-requests/renew` - Renew wanted request

### Messaging
- `GET /api/messaging/conversations-optimized` - Fetch conversations
- `GET /api/messaging/messages-optimized/{id}` - Fetch messages
- `POST /api/messages/{id}/mark-read` - Mark messages as read

### Favorites
- `GET /api/favorites/listings` - Fetch favorited listings
- `POST /api/favorites` - Add/remove favorite

### Business Profile
- `GET /api/business-profile` - Fetch business profile
- `POST /api/business-profile` - Create business profile
- `PATCH /api/business-profile` - Update business profile
- `POST /api/business-profile/pause` - Pause business profile
- `POST /api/business-profile/resume` - Resume business profile
- `DELETE /api/business-profile` - Delete business profile

### User
- `GET /api/user/bin` - Fetch deleted items
- `POST /api/user/bin/restore` - Restore deleted items

---

## Troubleshooting

### Route Not Found
- Ensure directory structure matches route paths
- Check `page.tsx` files exist in each route directory
- Verify no conflicting `layout.tsx` files

### Hook Not Working
- Ensure user ID is passed correctly
- Check authentication state before calling hooks
- Verify API endpoints are accessible

### Component Import Errors
- Check import paths use `@/` alias
- Ensure components are marked `'use client'` if needed
- Verify component exists in expected location

### Data Not Loading
- Check network tab for failed API requests
- Verify authentication token in request headers
- Check console for hook initialization errors

---

## Estimated Total Effort

| Priority | Routes | Effort |
|----------|--------|--------|
| High | `/account`, `/listings` | 5-7 hours |
| Medium | `/wanted`, `/business` | 3-4 hours |
| Easy | `/messages`, `/favorites`, `/notifications`, `/security`, `/bin` | 4-5 hours |
| **Total** | **9 routes** | **12-16 hours** |

---

## Next Steps

1. Start with **easy routes** (component reuse) to build momentum
2. Tackle **/listings** next as it's the most complex inline UI
3. Complete **/account** for full user profile management
4. Finish **/wanted** for complete content management
5. Test thoroughly on both desktop and mobile
6. Remove `page.tsx.backup` after confirming everything works

---

## Contact & Questions

If you encounter issues during migration:
1. Check the backup file for original implementation details
2. Verify hooks are imported and called correctly
3. Test data fetching independently before UI integration
4. Use browser DevTools to debug state and network requests

The new architecture is cleaner, more maintainable, and follows Next.js App Router best practices.
