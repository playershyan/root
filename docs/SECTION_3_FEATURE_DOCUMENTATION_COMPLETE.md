# Section 3: Feature Documentation

This section provides deep technical implementation details for all major features in Vera.lk. Each subsection includes database schemas, API implementations, validation patterns, and complete code examples.

---

## 3.1 Vehicle Listings

The vehicle listings feature is the core functionality of Vera.lk, enabling users to post vehicle advertisements with comprehensive details.

### 3.1.1 Creation Flow

**File**: `D:\projects\vera.lk\app\post\page.tsx` (2,144 lines)

The listing creation page implements a multi-step form with dynamic field rendering based on vehicle type selection.

**Vehicle Types Supported** (10+ types):
- Car
- SUV
- Van
- Three Wheeler
- Motorbike / Scooter
- Lorry
- Bus / Coach
- Heavy Duty
- Land / Plot
- House

**Form Architecture**: VehicleFormFactory pattern

```typescript
// Simplified form factory pattern
const VehicleFormFactory = {
  getCar(): Field[] {
    return [
      { name: 'make', required: true, type: 'select' },
      { name: 'model', required: true, type: 'select' },
      { name: 'year', required: true, type: 'number' },
      { name: 'mileage', required: true, type: 'number' },
      { name: 'engineCapacity', required: false, type: 'number' },
      { name: 'fuelType', required: true, type: 'select' },
      { name: 'transmission', required: true, type: 'select' },
      { name: 'color', required: false, type: 'text' },
      { name: 'trim', required: false, type: 'text' },
      // ... more fields
    ]
  },
  getThreeWheeler(): Field[] {
    return [
      { name: 'make', required: true, type: 'select' },
      { name: 'model', required: true, type: 'select' },
      { name: 'year', required: true, type: 'number' },
      // Three-wheelers don't require mileage, engineCapacity
    ]
  },
  // ... other vehicle types
}
```

**Dynamic Required Field Validation**:
- Each vehicle type has different required fields
- Validation schema changes based on `vehicleType` selection
- Real-time validation feedback with error messages

### 3.1.2 Image Upload Flow

**Maximum Images**: 10 per listing
**Supported Formats**: JPEG, PNG, WebP
**Client-side Compression**: Enabled
**Drag-and-Drop Reordering**: Supported

**Upload Process**:
1. User selects images → Client-side compression → WebP conversion
2. Images uploaded to Cloudinary via POST `/api/upload/cloudinary`
3. Cloudinary returns optimized URLs
4. URLs stored in `imageUrls` array field
5. Primary image set as first image in array

**Cloudinary Optimization**:
```typescript
// Automatic format detection and optimization
const uploadResponse = await fetch('/api/upload/cloudinary', {
  method: 'POST',
  body: formData // Contains compressed WebP image
})

// Response includes optimized URL
const { url } = await uploadResponse.json()
// url format: https://res.cloudinary.com/.../image/upload/f_auto,q_auto/...
```

### 3.1.3 AI Description Generation

**Implementation**: Local deterministic description builder (NOT Google Gemini API)

**File**: `lib/utils/descriptionBuilder.ts`

```typescript
function generateListingDescription(listing: Partial<Listing>): string {
  const { year, make, model, condition, fuelType, transmission, mileage, engineCapacity } = listing

  let description = `${year} ${make} ${model} for sale. `

  if (condition) {
    description += `Condition: ${condition}. `
  }

  if (fuelType && transmission) {
    description += `${fuelType} engine with ${transmission} transmission. `
  }

  if (mileage) {
    description += `Mileage: ${mileage.toLocaleString()} km. `
  }

  if (engineCapacity) {
    description += `Engine capacity: ${engineCapacity}cc. `
  }

  return description.trim()
}
```

**Note**: Early versions used Google Gemini AI via `/api/ai-description`, but current production uses local template-based generation for cost optimization.

### 3.1.4 Draft Auto-Save

**Storage**: Browser localStorage
**Key Format**: `listing_draft_{userId}_{timestamp}`
**Auto-save Interval**: 30 seconds (debounced)
**Restore on Page Load**: Yes

```typescript
// Auto-save implementation
useEffect(() => {
  const timer = setTimeout(() => {
    localStorage.setItem(
      `listing_draft_${user.id}_${Date.now()}`,
      JSON.stringify(formData)
    )
  }, 30000) // 30 seconds

  return () => clearTimeout(timer)
}, [formData])
```

### 3.1.5 Pricing Models

**Two Pricing Types**: Cash vs Finance

**Cash Pricing**:
```typescript
{
  pricingType: 'cash',
  price: 3500000, // Required
  negotiable: true // Optional
}
```

**Finance Pricing**:
```typescript
{
  pricingType: 'finance',
  financeType: 'Leasing' | 'Hire Purchase',
  outstandingBalance: 2500000,
  monthlyPayment: 85000,
  remainingTerm: '24 months',
  askingPrice: 1000000, // Down payment
  negotiable: true
}
```

### 3.1.6 Phone Verification Integration

**When Required**: New or changed phone number
**OTP Flow**: `usePhoneVerification` hook

```typescript
const { sendOTP, verifyOTP, isSending, isVerifying } = usePhoneVerification({
  purpose: 'listing'
})

// Step 1: Send OTP
await sendOTP(phoneNumber) // Sends via Text.lk SMS gateway

// Step 2: User enters OTP
await verifyOTP(phoneNumber, otpCode)

// Step 3: Submit listing with OTP code
const response = await fetch('/api/listings', {
  method: 'POST',
  body: JSON.stringify({
    ...listingData,
    phoneOtpCode: otpCode // Verified on server
  })
})
```

**Privileged User Bypass**: User ID `9b288153-3836-45ff-8f0b-8a196e423477` bypasses OTP requirements.

### 3.1.7 Validation Patterns

**File**: `lib/validation/validateListing.ts`

**Validation Layers**:
1. **Client-side**: Zod schema validation
2. **Server-side**: Input sanitization + validation
3. **Database**: CHECK constraints

**Example Validation**:
```typescript
const carListingSchema = z.object({
  vehicleType: z.literal('Car'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  year: z.number().min(1900).max(new Date().getFullYear() + 1),
  mileage: z.number().min(0).optional(),
  price: z.number().positive('Price must be positive'),
  phone: z.string().regex(/^(\+94|0)[0-9]{9}$/, 'Invalid Sri Lankan phone number')
})
```

### 3.1.8 Database Insertion

**Method**: `create_listing_v2(payload JSONB)` database function

**Flow**:
1. Parse JSONB payload
2. Validate required fields
3. Check for duplicates (24-hour window using `idx_listings_duplicate_check`)
4. Insert into `listings` table
5. Return listing ID and status

**Duplicate Detection**:
```sql
-- Using composite index for O(1) lookup
SELECT 1 FROM listings
WHERE user_id = v_user_id
  AND status != 'deleted'
  AND make = v_make
  AND model = v_model
  AND year = v_year
  AND created_at >= NOW() - INTERVAL '24 hours'
LIMIT 1
```

**Status**: New listings set to `'pending'` for admin approval (or `'active'` for privileged user).

### 3.1.9 Browse & Search

**File**: `app/listings/page.tsx`

**ISR (Incremental Static Regeneration)**: 120 seconds

```typescript
export const revalidate = 120 // seconds
```

**Pagination**:
- Items per page: 24
- Maximum pages: 60 (1,440 total items)
- Server-side cursor pagination

**Filters Available**:
- Vehicle Type
- Make / Model
- Year Range (min/max sliders)
- Price Range (min/max)
- Fuel Type
- Transmission
- District / City
- Condition

**Sort Options**:
- Most Recent (default)
- Price: Low to High
- Price: High to Low
- Year: Newest First
- Year: Oldest First
- Mileage: Low to High

**Promoted Listings Exclusion**:
```sql
-- Active listings feed excludes promoted items
SELECT * FROM listings
WHERE status = 'active'
  AND is_sold = FALSE
  AND is_paused = FALSE
  AND is_featured = FALSE  -- Not in featured rotation
  AND is_top_spot = FALSE  -- Not in top spot rotation
  AND is_boosted = FALSE   -- Not in boost rotation
ORDER BY created_at DESC
LIMIT 24;
```

### 3.1.10 Detail View

**File**: `app/listings/[id]/page.tsx`

**ISR**: 60 seconds per listing

**Features**:
1. **Image Gallery**: Lightbox with thumbnails, swipe support
2. **Vehicle Details**: All specifications in organized sections
3. **Seller Contact**: Phone (click-to-reveal), WhatsApp link, Email
4. **Similar Listings**: 4-6 similar vehicles (`get_similar_listings()` function)
5. **Share Buttons**: Facebook, Twitter, WhatsApp, Copy Link
6. **Report Listing**: Flag inappropriate content
7. **Save to Favorites**: Bookmark for later

**View Tracking**: Increments `views` counter via GET `/api/listings/[id]/view`

```typescript
// Anti-fraud view tracking
useEffect(() => {
  const trackView = async () => {
    await fetch(`/api/listings/${listingId}/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referrer: document.referrer,
        timestamp: Date.now()
      })
    })
  }

  // Track view only once per session
  if (!sessionStorage.getItem(`viewed_${listingId}`)) {
    trackView()
    sessionStorage.setItem(`viewed_${listingId}`, 'true')
  }
}, [listingId])
```

### 3.1.11 Management Operations

**Available Operations**:
1. **Delete**: Soft delete (30-day grace period)
2. **Mark as Sold**: Updates `is_sold` flag
3. **Pause**: Temporarily hide from browse
4. **Renew**: Extend expiry date (18-day cooldown)

**API Endpoints**:
- DELETE `/api/listings/delete` - Soft delete with reason
- POST `/api/listings/mark-sold` - Mark listing as sold
- POST `/api/listings/pause` - Pause active listing
- POST `/api/listings/renew` - Renew expired/expiring listing

**Renew Cooldown**:
```typescript
// 18-day cooldown between renewals
const canRenew = listing.updated_at < new Date(Date.now() - 18 * 24 * 60 * 60 * 1000)
```

---

## 3.2 Wanted Requests

Users can post "Wanted" ads specifying the vehicle they're looking for, enabling sellers to contact them directly.

### 3.2.1 Creation Flow

**File**: `app/wanted/post/page.tsx`

**Form Fields**:
- **Title**: Required (e.g., "Looking for Toyota Corolla 2018-2020")
- **Description**: Optional detailed requirements
- **Vehicle Type**: Required
- **Make**: Optional
- **Model**: Optional
- **Year Range**: min_year and max_year
- **Budget**: min_budget and max_budget (both required)
- **Max Mileage**: Optional
- **Fuel Type**: Optional
- **Transmission**: Optional
- **Location**: District and City preferences
- **Contact**: Phone (with OTP verification), WhatsApp, Email

**High Priority Option**:
- **Cost**: Rs. 1,000
- **Duration**: 14 days
- **Visibility Boost**: Appears in prominent "Urgent Wanted" section
- **Expiration**: Auto-expires after 14 days

### 3.2.2 Phone Verification

Similar to listings, wanted requests require phone verification for new/changed numbers.

```typescript
const { sendOTP, verifyOTP } = usePhoneVerification({ purpose: 'wanted' })

// Verification flow identical to listings
await sendOTP(phoneNumber)
await verifyOTP(phoneNumber, otpCode)

// Submit with OTP code
await fetch('/api/wanted-requests', {
  method: 'POST',
  body: JSON.stringify({
    ...wantedData,
    phoneOtpCode: otpCode
  })
})
```

### 3.2.3 Auto-Approval System

**Configuration**: Enabled by default

```sql
-- Auto-approval on creation
INSERT INTO wanted_requests (...)
VALUES (..., status = 'active'); -- No pending state
```

If auto-approval is disabled:
```sql
-- Admin approval required
INSERT INTO wanted_requests (...)
VALUES (..., status = 'pending');
```

### 3.2.4 Browse Page

**File**: `app/wanted/page.tsx`

**ISR**: 30 seconds (faster than listings for real-time feel)

```typescript
export const revalidate = 30
```

**Pagination**: 20 items per page

**Card Types**:
1. **UrgentWantedCard**: For high-priority wanted requests (with Rs. 1,000 payment)
2. **RegularWantedCard**: Standard wanted requests

**Urgent Card Features**:
- Red "URGENT" badge
- Prominent positioning (top of list)
- Expiration countdown timer
- Highlighted border

**Expiration Checking**:
```typescript
const isExpired = wantedRequest.expires_at && new Date(wantedRequest.expires_at) < new Date()
```

### 3.2.5 Database Schema

```sql
CREATE TABLE wanted_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id),

  -- Content
  title TEXT NOT NULL,
  description TEXT,

  -- Vehicle Criteria
  make TEXT,
  model TEXT,
  min_year INTEGER,
  max_year INTEGER,
  max_mileage INTEGER,
  fuel_type TEXT,
  transmission TEXT,
  body_type TEXT,

  -- Budget
  budget NUMERIC, -- Deprecated (use min/max)
  min_budget NUMERIC,
  max_budget NUMERIC,

  -- Location
  location TEXT,
  city TEXT,
  district TEXT,

  -- Contact
  phone TEXT,
  whatsapp TEXT,
  email TEXT,

  -- Status
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted', 'fulfilled')),

  -- Engagement
  clicks INTEGER DEFAULT 0,

  -- Soft Deletion
  deleted_at TIMESTAMPTZ,
  permanently_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days')
);
```

### 3.2.6 API Endpoints

**POST `/api/wanted-requests`** - Create wanted request
- Requires authentication
- Phone OTP verification for new/changed phone
- Auto-approval if enabled

**PUT `/api/wanted-requests/update`** - Update wanted request
- User can update own wanted requests
- Re-approval may be required if auto-approval disabled

**POST `/api/wanted-requests/close`** - Mark as fulfilled
- Sets status to 'fulfilled'
- Removes from browse page

**POST `/api/wanted-requests/delete`** - Soft delete
- Sets status to 'deleted' and deleted_at timestamp
- 30-day grace period before permanent deletion

**POST `/api/wanted-requests/pause`** - Temporarily hide
- Sets status to 'paused'
- Not shown in browse page
- Can be resumed later

**POST `/api/wanted-requests/renew`** - Extend expiry
- Extends expires_at by 30 days
- Same 18-day cooldown as listings

**POST `/api/wanted-requests/track-click`** - Track engagement
- Increments `clicks` counter
- Tracks user interest analytics

### 3.2.7 Management Features

**User Dashboard** (`app/profile/page.tsx`):
- View all wanted requests (active, paused, fulfilled)
- Edit details
- Renew expiring requests
- Delete unwanted requests
- View click statistics

---

## 3.3 Promotion System

Advanced listing promotion with four tiers and fair rotation algorithms.

### 3.3.1 Promotion Tiers

**1. Featured Listings**
- **Price**: Rs. 5,000 per 30 days
- **Placement**: Homepage featured carousel (2 slots, hourly rotation)
- **Visibility**: Maximum exposure

**2. Top Ad**
- **Price**: Rs. 2,500 per 7 days
- **Placement**: Top of search results (3 slots, hourly rotation)
- **Visibility**: High exposure

**3. Urgent Tag**
- **Price**: Rs. 1,000 per 14 days
- **Placement**: "URGENT" badge on listing card
- **Visibility**: Visual prominence in regular browse

**4. Daily Refresh**
- **Price**: Rs. 500 per 24 hours
- **Placement**: Bumps listing to top of feed (as if newly posted)
- **Visibility**: Temporary top positioning

### 3.3.2 Database Schema

```sql
CREATE TABLE promotions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id),

  -- Type
  promotion_type VARCHAR(50) NOT NULL CHECK (
    promotion_type IN ('featured', 'top_spot', 'boost', 'urgent')
  ),

  -- Payment
  payment_id UUID,
  amount DECIMAL(10,2) NOT NULL,

  -- Active Period
  started_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,

  -- Rotation Tracking
  rotation_score INTEGER DEFAULT 0,
  impressions INTEGER DEFAULT 0,
  last_shown_at TIMESTAMPTZ,
  rotation_group VARCHAR(50),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Critical Index for Rotation**:
```sql
CREATE INDEX idx_promotions_rotation_performance
ON promotions (
  promotion_type,
  is_active,
  expires_at,
  last_shown_at NULLS FIRST,  -- Never-shown promotions prioritized
  impressions,                 -- Lower impressions prioritized
  created_at                   -- Older promotions prioritized
)
WHERE is_active = TRUE;
```

### 3.3.3 Rotation Algorithm

**File**: `lib/services/rotationService.ts` (222 lines)

**Core Principles**:
1. **Fair Distribution**: All promotions get equal exposure over time
2. **Hourly Cycles**: Rotation updates every hour (synchronized at :00)
3. **Never-shown Priority**: Promotions that haven't been shown get first priority
4. **Impression Balancing**: Promotions with fewer impressions get boosted
5. **Age Fairness**: Older promotions don't get starved

**Algorithm Steps**:
1. Filter active, non-expired promotions
2. Join to active listings (exclude sold/paused)
3. Order by:
   - `last_shown_at NULLS FIRST` (never-shown first)
   - `impressions ASC` (lower impressions first)
   - `created_at ASC` (older promotions first)
4. Select top N slots (2 for featured, 3 for top_spot)
5. Update selected promotions:
   - Set `last_shown_at = NOW()`
   - Increment `impressions`
   - Increment `rotation_score`

**Database Function**: `get_rotated_featured_ads(vehicle_type, limit)`

```sql
CREATE FUNCTION get_rotated_featured_ads(
  p_vehicle_type TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 2
)
RETURNS TABLE (...listing columns...)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  WITH candidates AS (
    SELECT p.id AS promotion_id, l.*
    FROM promotions p
    INNER JOIN listings l ON l.id = p.listing_id
    WHERE p.promotion_type = 'featured'
      AND p.is_active = TRUE
      AND p.expires_at > NOW()
      AND l.status = 'active'
      AND l.is_sold = FALSE
      AND l.is_paused = FALSE
      AND (p_vehicle_type IS NULL OR l.vehicle_type = p_vehicle_type)
    ORDER BY
      p.last_shown_at NULLS FIRST,
      p.impressions ASC,
      p.created_at ASC
    FOR UPDATE OF p SKIP LOCKED
    LIMIT GREATEST(p_limit, 0)
  ),
  updated AS (
    UPDATE promotions p
    SET
      last_shown_at = NOW(),
      impressions = p.impressions + 1,
      rotation_score = p.rotation_score + 1
    FROM candidates c
    WHERE p.id = c.promotion_id
    RETURNING p.listing_id
  )
  SELECT c.* FROM candidates c
  INNER JOIN updated u ON u.listing_id = c.listing_id;
END;
$$;
```

**Concurrency Safety**: `FOR UPDATE SKIP LOCKED` prevents race conditions during concurrent rotation requests.

### 3.3.4 Fair Share Calculation

**File**: `lib/hooks/usePromotionFairShare.ts`

**Fair Share Formula**:
```
fair_share_percentage = (available_slots / total_competing_ads) * 100
```

**Example**:
- Featured slots available: 2
- Active featured promotions: 10
- Fair share: (2 / 10) * 100 = 20% exposure per rotation cycle

**Priority Boosting**:
Promotions with impressions below fair share threshold get higher priority in next rotation.

### 3.3.5 Client-Side Rotation Hook

**File**: `lib/hooks/useRotatedPromotions.ts` (179 lines)

```typescript
export function useRotatedPromotions(promotionType: 'featured' | 'top_spot', limit: number) {
  const [promotions, setPromotions] = useState<Listing[]>([])
  const [lastRotation, setLastRotation] = useState<Date>(new Date())

  useEffect(() => {
    const fetchRotated = async () => {
      const response = await fetch(
        `/api/promotions/rotated?type=${promotionType}&limit=${limit}`
      )
      const data = await response.json()
      setPromotions(data.listings)
      setLastRotation(new Date())
    }

    fetchRotated()

    // Auto-refresh every hour
    const interval = setInterval(() => {
      fetchRotated()
    }, 60 * 60 * 1000) // 60 minutes

    return () => clearInterval(interval)
  }, [promotionType, limit])

  return { promotions, lastRotation }
}

// Usage
const { promotions: featuredListings } = useRotatedPromotions('featured', 2)
```

**Hourly Sync**: All clients refresh promotions at the top of each hour to synchronize rotation.

### 3.3.6 Promotion Selection Page

**File**: `app/post/boost/page.tsx`

**Flow**:
1. User creates listing → Listing enters 'pending' status
2. User navigates to boost page
3. Selects promotion tier (Featured, Top Ad, Urgent, Daily Refresh)
4. Confirms pricing and duration
5. Proceeds to payment (PayHere integration)
6. On payment success → Promotion activated

**Payment Integration**: PayHere payment gateway (not detailed here).

### 3.3.7 Impression Tracking

**Table**: `promotion_rotations`

```sql
CREATE TABLE promotion_rotations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  promotion_id UUID REFERENCES promotions(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL,

  -- Rotation Details
  promotion_type VARCHAR(50) NOT NULL,
  rotation_slot INTEGER NOT NULL,
  rotation_cycle INTEGER DEFAULT 0,
  impressions_in_cycle INTEGER DEFAULT 0,

  -- Timestamps
  last_rotated_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

**Purpose**: Track detailed rotation history and per-cycle impression counts for analytics.

---

## 3.4 Messaging System

Real-time buyer-seller communication with offer management.

### 3.4.1 Conversation Creation

**Automatic Creation**: First message from buyer to seller creates conversation record.

**Flow**:
1. Buyer clicks "Contact Seller" on listing detail page
2. Modal opens with message composer
3. Buyer types message and clicks "Send"
4. API checks for existing conversation:
   ```sql
   SELECT * FROM conversations
   WHERE listing_id = $1 AND buyer_id = $2
   LIMIT 1
   ```
5. If not found, create conversation:
   ```sql
   INSERT INTO conversations (listing_id, buyer_id, seller_id)
   VALUES ($1, $2, $3)
   RETURNING *
   ```
6. Insert message into conversation
7. Redirect to `/messages/{conversationId}`

### 3.4.2 Database Schema

**Conversations Table**:
```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  listing_id UUID REFERENCES listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  seller_id UUID NOT NULL REFERENCES auth.users(id),

  -- Unread Tracking
  buyer_unread_count INTEGER DEFAULT 0,
  seller_unread_count INTEGER DEFAULT 0,

  -- Status
  is_active BOOLEAN DEFAULT true,

  -- Timestamps
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Unique constraint: one conversation per buyer-listing pair
  UNIQUE(listing_id, buyer_id)
);
```

**Messages Table**:
```sql
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),

  -- Content
  content TEXT NOT NULL,
  message_type VARCHAR DEFAULT 'text' CHECK (
    message_type IN ('text', 'offer', 'image', 'file')
  ),

  -- Offer Details (when message_type = 'offer')
  offer_data JSONB,

  -- Read Status
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,

  -- Status Management
  status VARCHAR DEFAULT 'active' CHECK (status IN ('active', 'deleted')),

  -- Soft Deletion
  deleted_at TIMESTAMPTZ,
  permanently_deleted BOOLEAN DEFAULT false,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

### 3.4.3 Real-time Updates

**Supabase Realtime** (optional):
```typescript
useEffect(() => {
  const channel = supabase
    .channel(`conversation:${conversationId}`)
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'messages',
      filter: `conversation_id=eq.${conversationId}`
    }, (payload) => {
      setMessages(prev => [...prev, payload.new])
    })
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [conversationId])
```

**Polling Fallback** (if realtime disabled):
```typescript
useEffect(() => {
  const interval = setInterval(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .gt('created_at', lastMessageTimestamp)

    if (data && data.length > 0) {
      setMessages(prev => [...prev, ...data])
    }
  }, 5000) // Poll every 5 seconds

  return () => clearInterval(interval)
}, [conversationId, lastMessageTimestamp])
```

### 3.4.4 Message Pagination

**Cursor-based Pagination** (load older messages):
```typescript
const loadMore = async () => {
  const { data } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .lt('created_at', oldestMessageTimestamp) // Cursor
    .order('created_at', { ascending: false })
    .limit(20)

  setMessages(prev => [...data.reverse(), ...prev])
}
```

### 3.4.5 Unread Count Tracking

**Trigger**: `update_conversation_on_message`

```sql
CREATE FUNCTION update_conversation_on_message()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE conversations
  SET
    last_message_at = NEW.created_at,
    buyer_unread_count = CASE
      WHEN NEW.sender_id = seller_id THEN buyer_unread_count + 1
      ELSE buyer_unread_count
    END,
    seller_unread_count = CASE
      WHEN NEW.sender_id = buyer_id THEN seller_unread_count + 1
      ELSE seller_unread_count
    END
  WHERE id = NEW.conversation_id;

  RETURN NEW;
END;
$$;

CREATE TRIGGER update_conversation_on_message
  AFTER INSERT ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_conversation_on_message();
```

**Mark as Read** (on conversation open):
```typescript
useEffect(() => {
  const markAsRead = async () => {
    // Determine if current user is buyer or seller
    const unreadColumn = isBuyer ? 'buyer_unread_count' : 'seller_unread_count'

    await supabase
      .from('conversations')
      .update({ [unreadColumn]: 0 })
      .eq('id', conversationId)

    // Mark all messages as read
    await supabase
      .from('messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .eq('is_read', false)
      .neq('sender_id', user.id)
  }

  markAsRead()
}, [conversationId])
```

### 3.4.6 Offer System

**Flow**:
1. Buyer sends offer message with amount
2. Offer stored in `offers` table + message with `message_type = 'offer'`
3. Seller receives notification
4. Seller can: Accept, Decline, or Counter

**Offers Table**:
```sql
CREATE TABLE offers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- References
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id),
  listing_id UUID NOT NULL REFERENCES listings(id),

  -- Offer Details
  amount NUMERIC NOT NULL,
  message TEXT,

  -- Status
  status VARCHAR DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'declined', 'expired')
  ),

  -- Response
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES auth.users(id),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Create Offer API**:
```typescript
// POST /api/messaging/send-offer
async function createOffer(req: NextRequest) {
  const { conversationId, listingId, amount, message } = await req.json()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create offer
  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      listing_id: listingId,
      amount: amount,
      message: message,
      status: 'pending'
    })
    .select('*')
    .single()

  if (error) {
    throw error
  }

  // Create message notification
  await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_id: user.id,
      message_type: 'offer',
      content: `Offered Rs. ${amount.toLocaleString()}`,
      offer_data: { offer_id: offer.id, amount }
    })

  return NextResponse.json({ success: true, offer }, { status: 201 })
}
```

**Offer Response API** (`POST /api/messaging/offers/[offerId]/respond`):
```typescript
async function respondToOffer(offerId: string, action: 'accept' | 'decline' | 'counter', data: any) {
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch offer
  const { data: offer } = await supabase
    .from('offers')
    .select('*, conversation:conversations(*)')
    .eq('id', offerId)
    .single()

  // Verify user is seller
  if (offer.conversation.seller_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  if (action === 'accept') {
    await supabase
      .from('offers')
      .update({
        status: 'accepted',
        responded_at: new Date().toISOString(),
        responded_by: user.id,
        response_message: data.message
      })
      .eq('id', offerId)

    // Create acceptance message
    await supabase.from('messages').insert({
      conversation_id: offer.conversation_id,
      sender_id: user.id,
      content: `Accepted your offer of Rs. ${offer.amount.toLocaleString()}`
    })
  }
  else if (action === 'decline') {
    await supabase
      .from('offers')
      .update({
        status: 'declined',
        responded_at: new Date().toISOString(),
        responded_by: user.id,
        response_message: data.message
      })
      .eq('id', offerId)
  }
  else if (action === 'counter') {
    // Create counter offer
    await supabase.from('offers').insert({
      conversation_id: offer.conversation_id,
      sender_id: user.id,
      listing_id: offer.listing_id,
      amount: data.counterAmount,
      message: data.message,
      status: 'pending'
    })

    // Mark original offer as countered
    await supabase
      .from('offers')
      .update({ status: 'countered' })
      .eq('id', offerId)
  }

  return NextResponse.json({ success: true })
}
```

---

## 3.5 Business Profiles

Business profiles enable dealers and professional sellers to enhance their presence with verified badges, operating hours, and enhanced branding.

### 3.5.1 Database Schema

```sql
CREATE TABLE business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,

  -- Business information
  business_name TEXT NOT NULL,
  business_registration_number TEXT,

  -- Branding
  logo_url TEXT,
  banner_url TEXT,
  tagline TEXT,
  description TEXT,

  -- Contact details
  business_email TEXT,
  business_phone TEXT,
  whatsapp_number TEXT,
  website_url TEXT,

  -- Location
  business_address TEXT,
  city TEXT,
  postal_code TEXT,

  -- Operating hours (JSONB format)
  operating_hours JSONB DEFAULT '{
    "monday": {"open": "09:00", "close": "18:00", "closed": false},
    "tuesday": {"open": "09:00", "close": "18:00", "closed": false},
    "wednesday": {"open": "09:00", "close": "18:00", "closed": false},
    "thursday": {"open": "09:00", "close": "18:00", "closed": false},
    "friday": {"open": "09:00", "close": "18:00", "closed": false},
    "saturday": {"open": "09:00", "close": "14:00", "closed": false},
    "sunday": {"open": null, "close": null, "closed": true}
  }'::jsonb,

  -- Social media links
  facebook_url TEXT,
  instagram_url TEXT,
  twitter_url TEXT,

  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_badge_tier TEXT CHECK (verification_badge_tier IN ('bronze', 'silver', 'gold', 'platinum')),

  -- Status
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'suspended', 'deleted')),

  -- Statistics
  total_sales INTEGER DEFAULT 0,
  average_rating NUMERIC(3,2) DEFAULT 0.00,
  total_reviews INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deleted_at TIMESTAMP WITH TIME ZONE,

  CONSTRAINT valid_email CHECK (business_email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
  CONSTRAINT valid_website CHECK (website_url IS NULL OR website_url ~* '^https?://')
);

CREATE INDEX idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX idx_business_profiles_verified ON business_profiles(is_verified) WHERE is_verified = TRUE;
CREATE INDEX idx_business_profiles_city ON business_profiles(city);
CREATE INDEX idx_business_profiles_status ON business_profiles(status);

-- RLS policies
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active business profiles"
  ON business_profiles FOR SELECT
  USING (status = 'active' AND deleted_at IS NULL);

CREATE POLICY "Users can create their own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own business profile"
  ON business_profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to update profile is_business flag
CREATE OR REPLACE FUNCTION update_profile_business_status()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles
    SET is_business = TRUE
    WHERE id = NEW.user_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles
    SET is_business = FALSE
    WHERE id = OLD.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_profile_business_status
AFTER INSERT OR DELETE ON business_profiles
FOR EACH ROW
EXECUTE FUNCTION update_profile_business_status();
```

### 3.5.2 API: Business Profile CRUD

**File**: `D:\projects\vera.lk\app\api\business-profile\route.ts` (267 lines)

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { z } from 'zod';

const operatingHoursSchema = z.object({
  monday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  tuesday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  wednesday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  thursday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  friday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  saturday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() }),
  sunday: z.object({ open: z.string().nullable(), close: z.string().nullable(), closed: z.boolean() })
});

const businessProfileSchema = z.object({
  businessName: z.string().min(2).max(100),
  businessRegistrationNumber: z.string().optional(),
  logoUrl: z.string().url().optional(),
  bannerUrl: z.string().url().optional(),
  tagline: z.string().max(200).optional(),
  description: z.string().max(1000).optional(),
  businessEmail: z.string().email().optional(),
  businessPhone: z.string().regex(/^(\+94|0)[0-9]{9}$/).optional(),
  whatsappNumber: z.string().regex(/^(\+94|0)[0-9]{9}$/).optional(),
  websiteUrl: z.string().url().optional(),
  businessAddress: z.string().optional(),
  city: z.string().optional(),
  postalCode: z.string().optional(),
  operatingHours: operatingHoursSchema.optional(),
  facebookUrl: z.string().url().optional(),
  instagramUrl: z.string().url().optional(),
  twitterUrl: z.string().url().optional()
});

// GET - Fetch business profile
export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data, error } = await supabase
    .from('business_profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ businessProfile: data || null });
}

// POST - Create business profile
export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Check if business profile already exists
    const { data: existing } = await supabase
      .from('business_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (existing) {
      return NextResponse.json(
        { error: 'Business profile already exists' },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validatedData = businessProfileSchema.parse(body);

    // Insert business profile
    const { data, error } = await supabase
      .from('business_profiles')
      .insert({
        user_id: user.id,
        business_name: validatedData.businessName,
        business_registration_number: validatedData.businessRegistrationNumber || null,
        logo_url: validatedData.logoUrl || null,
        banner_url: validatedData.bannerUrl || null,
        tagline: validatedData.tagline || null,
        description: validatedData.description || null,
        business_email: validatedData.businessEmail || null,
        business_phone: validatedData.businessPhone || null,
        whatsapp_number: validatedData.whatsappNumber || null,
        website_url: validatedData.websiteUrl || null,
        business_address: validatedData.businessAddress || null,
        city: validatedData.city || null,
        postal_code: validatedData.postalCode || null,
        operating_hours: validatedData.operatingHours || null,
        facebook_url: validatedData.facebookUrl || null,
        instagram_url: validatedData.instagramUrl || null,
        twitter_url: validatedData.twitterUrl || null,
        is_verified: true, // Auto-verify on creation
        verified_at: new Date().toISOString(),
        status: 'active'
      })
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    // Log activity
    await supabase.from('admin_activity_log').insert({
      user_id: user.id,
      action: 'business_profile_created',
      details: { business_profile_id: data.id }
    });

    return NextResponse.json({
      success: true,
      businessProfile: data
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Business profile creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create business profile' },
      { status: 500 }
    );
  }
}

// PATCH - Update business profile
export async function PATCH(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validatedData = businessProfileSchema.partial().parse(body);

    const updatePayload: any = {
      updated_at: new Date().toISOString()
    };

    // Map validated fields to database columns
    if (validatedData.businessName) updatePayload.business_name = validatedData.businessName;
    if (validatedData.businessRegistrationNumber !== undefined)
      updatePayload.business_registration_number = validatedData.businessRegistrationNumber;
    if (validatedData.logoUrl !== undefined) updatePayload.logo_url = validatedData.logoUrl;
    if (validatedData.bannerUrl !== undefined) updatePayload.banner_url = validatedData.bannerUrl;
    if (validatedData.tagline !== undefined) updatePayload.tagline = validatedData.tagline;
    if (validatedData.description !== undefined) updatePayload.description = validatedData.description;
    if (validatedData.businessEmail !== undefined) updatePayload.business_email = validatedData.businessEmail;
    if (validatedData.businessPhone !== undefined) updatePayload.business_phone = validatedData.businessPhone;
    if (validatedData.whatsappNumber !== undefined) updatePayload.whatsapp_number = validatedData.whatsappNumber;
    if (validatedData.websiteUrl !== undefined) updatePayload.website_url = validatedData.websiteUrl;
    if (validatedData.businessAddress !== undefined) updatePayload.business_address = validatedData.businessAddress;
    if (validatedData.city !== undefined) updatePayload.city = validatedData.city;
    if (validatedData.postalCode !== undefined) updatePayload.postal_code = validatedData.postalCode;
    if (validatedData.operatingHours !== undefined) updatePayload.operating_hours = validatedData.operatingHours;
    if (validatedData.facebookUrl !== undefined) updatePayload.facebook_url = validatedData.facebookUrl;
    if (validatedData.instagramUrl !== undefined) updatePayload.instagram_url = validatedData.instagramUrl;
    if (validatedData.twitterUrl !== undefined) updatePayload.twitter_url = validatedData.twitterUrl;

    const { data, error } = await supabase
      .from('business_profiles')
      .update(updatePayload)
      .eq('user_id', user.id)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({
      success: true,
      businessProfile: data
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.errors[0].message }, { status: 400 });
    }

    console.error('Business profile update error:', error);
    return NextResponse.json(
      { error: 'Failed to update business profile' },
      { status: 500 }
    );
  }
}

// DELETE - Soft delete business profile
export async function DELETE(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { error } = await supabase
    .from('business_profiles')
    .update({
      status: 'deleted',
      deleted_at: new Date().toISOString()
    })
    .eq('user_id', user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  // Log activity
  await supabase.from('admin_activity_log').insert({
    user_id: user.id,
    action: 'business_profile_deleted'
  });

  return NextResponse.json({ success: true });
}
```

### 3.5.3 Business Profile Page

**File**: `D:\projects\vera.lk\app\business\[id]\page.tsx`

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { notFound } from 'next/navigation';
import { ClockIcon, MapPinIcon, PhoneIcon, GlobeAltIcon } from '@heroicons/react/24/outline';

export const revalidate = 300; // 5 minutes

interface Props {
  params: { id: string };
}

export default async function BusinessProfilePage({ params }: Props) {
  const supabase = createServerSupabaseClient();

  // Fetch business profile
  const { data: business, error } = await supabase
    .from('business_profiles')
    .select(`
      *,
      user:profiles!business_profiles_user_id_fkey(
        id,
        name,
        avatar_url,
        created_at
      )
    `)
    .eq('id', params.id)
    .eq('status', 'active')
    .single();

  if (error || !business) {
    notFound();
  }

  // Fetch business listings
  const { data: listings } = await supabase
    .from('listings')
    .select('*')
    .eq('user_id', business.user_id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(12);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      {business.banner_url && (
        <div className="w-full h-64 bg-gray-200">
          <img
            src={business.banner_url}
            alt={business.business_name}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Business header */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-8 -mt-16 relative">
          <div className="flex items-start">
            {/* Logo */}
            {business.logo_url && (
              <img
                src={business.logo_url}
                alt={business.business_name}
                className="w-32 h-32 rounded-lg border-4 border-white shadow-md mr-6"
              />
            )}

            <div className="flex-1">
              <div className="flex items-center mb-2">
                <h1 className="text-3xl font-bold mr-3">
                  {business.business_name}
                </h1>
                {business.is_verified && (
                  <span className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-semibold">
                    Verified
                  </span>
                )}
              </div>

              {business.tagline && (
                <p className="text-lg text-gray-600 mb-4">{business.tagline}</p>
              )}

              {/* Contact info */}
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                {business.business_address && (
                  <div className="flex items-center">
                    <MapPinIcon className="w-5 h-5 mr-2" />
                    {business.business_address}
                  </div>
                )}
                {business.business_phone && (
                  <div className="flex items-center">
                    <PhoneIcon className="w-5 h-5 mr-2" />
                    {business.business_phone}
                  </div>
                )}
                {business.website_url && (
                  <a
                    href={business.website_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-blue-600 hover:underline"
                  >
                    <GlobeAltIcon className="w-5 h-5 mr-2" />
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: About & Hours */}
          <div className="lg:col-span-1 space-y-6">
            {/* About */}
            {business.description && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">About</h2>
                <p className="text-gray-700 whitespace-pre-wrap">
                  {business.description}
                </p>
              </div>
            )}

            {/* Operating Hours */}
            {business.operating_hours && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <ClockIcon className="w-6 h-6 mr-2" />
                  Operating Hours
                </h2>
                <dl className="space-y-2">
                  {Object.entries(business.operating_hours).map(([day, hours]: [string, any]) => (
                    <div key={day} className="flex justify-between text-sm">
                      <dt className="capitalize font-medium">{day}</dt>
                      <dd className="text-gray-600">
                        {hours.closed ? 'Closed' : `${hours.open} - ${hours.close}`}
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Social media */}
            {(business.facebook_url || business.instagram_url || business.twitter_url) && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold mb-4">Follow Us</h2>
                <div className="flex space-x-4">
                  {business.facebook_url && (
                    <a
                      href={business.facebook_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700"
                    >
                      Facebook
                    </a>
                  )}
                  {business.instagram_url && (
                    <a
                      href={business.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-pink-600 hover:text-pink-700"
                    >
                      Instagram
                    </a>
                  )}
                  {business.twitter_url && (
                    <a
                      href={business.twitter_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700"
                    >
                      Twitter
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right column: Listings */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">Current Listings</h2>

              {listings && listings.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listings.map(listing => (
                    <a
                      key={listing.id}
                      href={`/listing/${listing.id}`}
                      className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                    >
                      <img
                        src={listing.images[0]}
                        alt={`${listing.year} ${listing.make} ${listing.model}`}
                        className="w-full h-48 object-cover"
                      />
                      <div className="p-4">
                        <h3 className="font-semibold mb-2">
                          {listing.year} {listing.make} {listing.model}
                        </h3>
                        <p className="text-xl font-bold text-blue-600">
                          Rs. {listing.price.toLocaleString()}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-center py-8">
                  No active listings at the moment
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
```

### 3.5.4 Key Features

**Auto-verification on Creation**:
- All business profiles are auto-verified (`is_verified: true`) on creation
- Verification badge tier can be upgraded by admin

**Soft Delete with Reactivation**:
```sql
-- Reactivate deleted business profile
UPDATE business_profiles
SET
  status = 'active',
  deleted_at = NULL,
  updated_at = NOW()
WHERE user_id = 'user-uuid' AND status = 'deleted';
```

**Pause Functionality**:
```typescript
// Pause business profile (hides from public view)
await supabase
  .from('business_profiles')
  .update({ status: 'paused' })
  .eq('user_id', userId);
```

---

## 3.6 Admin Dashboard

Comprehensive admin interface for content moderation, user management, and system monitoring.

### 3.6.1 Access Control

**Admin Role Check** (`lib/middleware/admin-auth.ts`):

```typescript
import { createServerSupabaseClient } from '@/lib/supabase-server';
import { NextResponse } from 'next/server';

export type AdminPermission =
  | 'view_dashboard'
  | 'manage_listings'
  | 'manage_users'
  | 'manage_business'
  | 'manage_promotions'
  | 'manage_reports'
  | 'manage_wanted_requests'
  | 'view_analytics'
  | 'system_settings'
  | 'bulk_import';

const ADMIN_PERMISSIONS: Record<string, AdminPermission[]> = {
  admin: [
    'view_dashboard',
    'manage_listings',
    'manage_users',
    'manage_business',
    'manage_promotions',
    'manage_reports',
    'manage_wanted_requests',
    'view_analytics',
    'system_settings',
    'bulk_import'
  ],
  moderator: [
    'view_dashboard',
    'manage_listings',
    'manage_reports',
    'manage_wanted_requests'
  ],
  support: [
    'view_dashboard',
    'manage_users'
  ]
};

export async function ensureAdmin(
  requiredPermission: AdminPermission
): Promise<{ authorized: boolean; user: any; profile: any; error?: string }> {
  const supabase = createServerSupabaseClient();

  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      authorized: false,
      user: null,
      profile: null,
      error: 'Unauthorized'
    };
  }

  // Fetch user profile with role
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return {
      authorized: false,
      user,
      profile: null,
      error: 'Profile not found'
    };
  }

  // Check if user has admin role
  const userPermissions = ADMIN_PERMISSIONS[profile.role] || [];

  if (!userPermissions.includes(requiredPermission)) {
    return {
      authorized: false,
      user,
      profile,
      error: 'Insufficient permissions'
    };
  }

  return { authorized: true, user, profile };
}

// Usage in API route
export async function requireAdmin(requiredPermission: AdminPermission) {
  const result = await ensureAdmin(requiredPermission);

  if (!result.authorized) {
    return NextResponse.json(
      { error: result.error || 'Forbidden' },
      { status: 403 }
    );
  }

  return null; // Authorized, continue
}
```

### 3.6.2 Dashboard Overview

**File**: `D:\projects\vera.lk\app\admin\page.tsx`

```typescript
import { ensureAdmin } from '@/lib/middleware/admin-auth';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';
import DashboardStats from '@/app/admin/components/DashboardStats';
import RecentActivity from '@/app/admin/components/RecentActivity';
import SystemHealth from '@/app/admin/components/SystemHealth';
import AlertsOverview from '@/app/admin/components/AlertsOverview';

export default async function AdminDashboardPage() {
  const { authorized } = await ensureAdmin('view_dashboard');

  if (!authorized) {
    redirect('/');
  }

  const supabase = createServerSupabaseClient();

  // Fetch dashboard data in parallel
  const [stats, activity, health, alerts] = await Promise.all([
    getDashboardStats(supabase),
    getRecentActivity(supabase),
    getSystemHealth(supabase),
    getAlerts(supabase)
  ]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* Stats overview */}
        <DashboardStats stats={stats} />

        {/* System health alerts */}
        {alerts && alerts.length > 0 && (
          <AlertsOverview alerts={alerts} />
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
          {/* Recent activity */}
          <RecentActivity activities={activity} />

          {/* System health */}
          <SystemHealth health={health} />
        </div>
      </div>
    </div>
  );
}

// Data fetching functions
async function getDashboardStats(supabase: any) {
  const [
    totalListings,
    activeListings,
    totalUsers,
    totalBusinesses,
    totalPromotions,
    totalWantedRequests,
    pendingReports
  ] = await Promise.all([
    supabase.from('listings').select('id', { count: 'exact', head: true }),
    supabase.from('listings').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('business_profiles').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('promotions').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('wanted_requests').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'pending')
  ]);

  return {
    totalListings: totalListings.count || 0,
    activeListings: activeListings.count || 0,
    totalUsers: totalUsers.count || 0,
    totalBusinesses: totalBusinesses.count || 0,
    totalPromotions: totalPromotions.count || 0,
    totalWantedRequests: totalWantedRequests.count || 0,
    pendingReports: pendingReports.count || 0
  };
}

async function getRecentActivity(supabase: any) {
  const { data } = await supabase
    .from('admin_activity_log')
    .select('*, user:profiles(name, email)')
    .order('created_at', { ascending: false })
    .limit(10);

  return data || [];
}

async function getSystemHealth(supabase: any) {
  // Check database performance
  const { data: performanceWarnings } = await supabase
    .rpc('get_advisors')
    .limit(5);

  // Check for stale promotions
  const { count: expiredPromotions } = await supabase
    .from('promotions')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());

  // Check for listings needing attention
  const { count: expiredListings } = await supabase
    .from('listings')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'active')
    .lt('expires_at', new Date().toISOString());

  return {
    performanceWarnings: performanceWarnings?.length || 0,
    expiredPromotions: expiredPromotions || 0,
    expiredListings: expiredListings || 0
  };
}

async function getAlerts(supabase: any) {
  const alerts: any[] = [];

  // Check for high report volume
  const { count: todayReports } = await supabase
    .from('reports')
    .select('id', { count: 'exact', head: true })
    .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

  if (todayReports && todayReports > 50) {
    alerts.push({
      type: 'warning',
      message: `High report volume: ${todayReports} reports in last 24 hours`,
      action: '/admin/reports'
    });
  }

  // Check for failed promotions
  const { count: failedPromotions } = await supabase
    .from('promotions')
    .select('id', { count: 'exact', head: true })
    .eq('payment_status', 'failed');

  if (failedPromotions && failedPromotions > 0) {
    alerts.push({
      type: 'error',
      message: `${failedPromotions} promotions with failed payments`,
      action: '/admin/promotions'
    });
  }

  return alerts;
}
```

### 3.6.3 Dashboard Components

**DashboardStats Component**:

```typescript
// app/admin/components/DashboardStats.tsx
export default function DashboardStats({ stats }: { stats: any }) {
  const statCards = [
    {
      label: 'Total Listings',
      value: stats.totalListings,
      subtext: `${stats.activeListings} active`,
      icon: 'listings',
      color: 'blue'
    },
    {
      label: 'Total Users',
      value: stats.totalUsers,
      subtext: `${stats.totalBusinesses} businesses`,
      icon: 'users',
      color: 'green'
    },
    {
      label: 'Active Promotions',
      value: stats.totalPromotions,
      icon: 'promotions',
      color: 'purple'
    },
    {
      label: 'Wanted Requests',
      value: stats.totalWantedRequests,
      icon: 'wanted',
      color: 'orange'
    },
    {
      label: 'Pending Reports',
      value: stats.pendingReports,
      icon: 'reports',
      color: stats.pendingReports > 10 ? 'red' : 'gray',
      alert: stats.pendingReports > 10
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
      {statCards.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg shadow-sm p-6 border-l-4 border-${stat.color}-500`}
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-gray-600">{stat.label}</h3>
            {stat.alert && (
              <span className="bg-red-100 text-red-600 text-xs px-2 py-1 rounded">
                Alert
              </span>
            )}
          </div>
          <div className="text-3xl font-bold text-gray-900 mb-1">
            {stat.value.toLocaleString()}
          </div>
          {stat.subtext && (
            <p className="text-sm text-gray-500">{stat.subtext}</p>
          )}
        </div>
      ))}
    </div>
  );
}
```

**RecentActivity Component**:

```typescript
// app/admin/components/RecentActivity.tsx
import { formatDistanceToNow } from 'date-fns';

export default function RecentActivity({ activities }: { activities: any[] }) {
  const getActivityIcon = (action: string) => {
    const iconMap: Record<string, string> = {
      listing_created: '📝',
      listing_deleted: '🗑️',
      user_banned: '🚫',
      promotion_created: '⭐',
      report_resolved: '✅',
      business_profile_created: '🏢'
    };

    return iconMap[action] || '📌';
  };

  const getActivityText = (activity: any) => {
    const actionMap: Record<string, string> = {
      listing_created: 'created a listing',
      listing_deleted: 'deleted a listing',
      user_banned: 'banned a user',
      promotion_created: 'created a promotion',
      report_resolved: 'resolved a report',
      business_profile_created: 'created a business profile'
    };

    return actionMap[activity.action] || activity.action;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>

      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start">
            <div className="text-2xl mr-3">{getActivityIcon(activity.action)}</div>
            <div className="flex-1">
              <p className="text-sm text-gray-900">
                <span className="font-medium">{activity.user?.name || 'System'}</span>
                {' '}
                {getActivityText(activity)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDistanceToNow(new Date(activity.created_at))} ago
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### 3.6.4 Admin Subsections

**Listing Management** (`app/admin/listings/page.tsx`):

```typescript
import { ensureAdmin } from '@/lib/middleware/admin-auth';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function AdminListingsPage({
  searchParams
}: {
  searchParams: { status?: string; page?: string }
}) {
  const { authorized } = await ensureAdmin('manage_listings');
  if (!authorized) redirect('/');

  const page = parseInt(searchParams.page || '1');
  const status = searchParams.status || 'all';
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('listings')
    .select('*, user:profiles(name, email)', { count: 'exact' });

  if (status !== 'all') {
    query = query.eq('status', status);
  }

  const { data: listings, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manage Listings</h1>

        {/* Filter tabs */}
        <div className="flex space-x-2">
          <FilterTab label="All" status="all" currentStatus={status} />
          <FilterTab label="Active" status="active" currentStatus={status} />
          <FilterTab label="Pending" status="pending" currentStatus={status} />
          <FilterTab label="Sold" status="sold" currentStatus={status} />
          <FilterTab label="Deleted" status="deleted" currentStatus={status} />
        </div>
      </div>

      {/* Listings table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Listing
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Seller
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Price
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Created
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {listings?.map(listing => (
              <tr key={listing.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img
                      src={listing.images[0]}
                      alt="Listing"
                      className="w-16 h-16 object-cover rounded mr-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900">
                        {listing.year} {listing.make} {listing.model}
                      </div>
                      <div className="text-sm text-gray-500">
                        {listing.vehicle_type}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-900">{listing.user.name}</div>
                  <div className="text-sm text-gray-500">{listing.user.email}</div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  Rs. {listing.price.toLocaleString()}
                </td>
                <td className="px-6 py-4">
                  <StatusBadge status={listing.status} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(listing.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <ListingActions listingId={listing.id} currentStatus={listing.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination currentPage={page} totalCount={count || 0} pageSize={limit} />
    </div>
  );
}
```

**User Management** (`app/admin/users/page.tsx`):

```typescript
import { ensureAdmin } from '@/lib/middleware/admin-auth';
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function AdminUsersPage({
  searchParams
}: {
  searchParams: { role?: string; page?: string; search?: string }
}) {
  const { authorized } = await ensureAdmin('manage_users');
  if (!authorized) redirect('/');

  const page = parseInt(searchParams.page || '1');
  const role = searchParams.role || 'all';
  const search = searchParams.search || '';
  const limit = 50;
  const offset = (page - 1) * limit;

  const supabase = createServerSupabaseClient();

  let query = supabase
    .from('profiles')
    .select('*', { count: 'exact' });

  if (role !== 'all') {
    query = query.eq('role', role);
  }

  if (search) {
    query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%`);
  }

  const { data: users, count } = await query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Manage Users</h1>

      {/* Search and filters */}
      <div className="flex space-x-4 mb-6">
        <input
          type="text"
          placeholder="Search users..."
          defaultValue={search}
          className="flex-1 px-4 py-2 border rounded-lg"
        />
        <select
          defaultValue={role}
          className="px-4 py-2 border rounded-lg"
        >
          <option value="all">All Roles</option>
          <option value="user">User</option>
          <option value="business">Business</option>
          <option value="moderator">Moderator</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Listings
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Joined
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users?.map(user => (
              <tr key={user.id}>
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img
                      src={user.avatar_url || '/default-avatar.png'}
                      alt={user.name}
                      className="w-10 h-10 rounded-full mr-4"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <RoleBadge role={user.role} />
                </td>
                <td className="px-6 py-4 text-sm text-gray-900">
                  {user.total_listings || 0}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {new Date(user.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-right text-sm">
                  <UserActions userId={user.id} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

### 3.6.5 Admin Activity Log

**Database Schema**:

```sql
CREATE TABLE admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Action details
  action TEXT NOT NULL,
  details JSONB,

  -- Target (what was acted upon)
  target_type TEXT, -- e.g., 'listing', 'user', 'business_profile'
  target_id UUID,

  -- Request metadata
  ip_address INET,
  user_agent TEXT,

  -- Timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_admin_activity_user ON admin_activity_log(user_id);
CREATE INDEX idx_admin_activity_action ON admin_activity_log(action);
CREATE INDEX idx_admin_activity_target ON admin_activity_log(target_type, target_id);
CREATE INDEX idx_admin_activity_created ON admin_activity_log(created_at DESC);
```

**Logging Function**:

```typescript
// lib/admin/activity-logger.ts
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function logAdminActivity(
  action: string,
  details?: any,
  targetType?: string,
  targetId?: string
) {
  const supabase = createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return;

  await supabase.from('admin_activity_log').insert({
    user_id: user.id,
    action,
    details: details || null,
    target_type: targetType || null,
    target_id: targetId || null
  });
}

// Usage example
await logAdminActivity(
  'listing_deleted',
  { reason: 'Spam', listing_title: '2020 Toyota Corolla' },
  'listing',
  'listing-uuid'
);
```

### 3.6.6 Bulk Import System

**File**: `D:\projects\vera.lk\app\admin\bulk-import\page.tsx`

```typescript
'use client';

import { useState } from 'react';
import { ensureAdmin } from '@/lib/middleware/admin-auth';

export default function BulkImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/admin/bulk-import', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Import failed');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(Boolean);

        for (const line of lines) {
          try {
            const data = JSON.parse(line);

            if (data.progress) {
              setProgress(data.progress);
            }

            if (data.results) {
              setResults(data.results);
            }
          } catch (e) {
            console.error('Failed to parse chunk:', e);
          }
        }
      }

    } catch (error) {
      console.error('Import error:', error);
      alert('Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl">
      <h1 className="text-3xl font-bold mb-8">Bulk Import Listings</h1>

      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Upload CSV File</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">
            Select CSV file
          </label>
          <input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border rounded-lg"
          />
        </div>

        {file && (
          <div className="mb-4 text-sm text-gray-600">
            Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
          </div>
        )}

        <button
          onClick={handleImport}
          disabled={!file || importing}
          className="btn btn-primary w-full"
        >
          {importing ? 'Importing...' : 'Start Import'}
        </button>

        {importing && (
          <div className="mt-4">
            <div className="flex justify-between text-sm mb-2">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {results && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Import Results</h2>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-green-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-green-600">
                {results.success}
              </div>
              <div className="text-sm text-gray-600">Successful</div>
            </div>
            <div className="bg-red-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-red-600">
                {results.failed}
              </div>
              <div className="text-sm text-gray-600">Failed</div>
            </div>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-2xl font-bold text-gray-600">
                {results.total}
              </div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
          </div>

          {results.errors && results.errors.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Errors:</h3>
              <ul className="space-y-1 text-sm text-red-600">
                {results.errors.map((error: any, index: number) => (
                  <li key={index}>
                    Row {error.row}: {error.message}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* CSV format guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
        <h3 className="font-semibold mb-2">CSV Format Guide</h3>
        <p className="text-sm text-gray-700 mb-4">
          Required columns: vehicle_type, make, model, year, price, location, phone_number
        </p>
        <pre className="text-xs bg-white p-4 rounded border overflow-x-auto">
{`vehicle_type,make,model,year,mileage,price,condition,fuel_type,transmission,location,phone_number
Car,Toyota,Corolla,2020,15000,3500000,used,Petrol,Automatic,Colombo,0771234567
Van,Nissan,Caravan,2018,45000,4200000,used,Diesel,Automatic,Kandy,0772345678`}
        </pre>
      </div>
    </div>
  );
}
```

---

## Summary

This comprehensive Section 3 covers all 6 major features of Vera.lk:

- **3.1 Vehicle Listings**: Complete creation flow with 2,144-line implementation, dynamic form factory, image uploads (max 10, WebP), draft auto-save, phone verification, AI description generation (local builder), validation patterns, database insertion with duplicate detection, browse & search (ISR 120s), detail view (ISR 60s), and management operations.

- **3.2 Wanted Requests**: Creation flow similar to listings, high priority option (Rs. 1,000, 14 days), auto-approval, browse page (ISR 30s), database schema, API endpoints, and management features.

- **3.3 Promotion System**: Four tiers (Featured Rs. 5,000/30d, Top Ad Rs. 2,500/7d, Urgent Rs. 1,000/14d, Daily Refresh Rs. 500/24h), fair rotation algorithm with hourly cycles, fair share calculation, client-side hook with synchronized refresh, promotion selection page, and impression tracking.

- **3.4 Messaging System**: Automatic conversation creation, real-time updates (Supabase Realtime with polling fallback), cursor-based pagination, unread count tracking via database trigger, and complete offer system with accept/decline/counter workflow.

- **3.5 Business Profiles**: Database schema with operating hours (JSONB), logo/banner, verification badges, complete CRUD API (267 lines), business profile page, auto-verification on creation, soft delete with reactivation, and pause functionality.

- **3.6 Admin Dashboard**: Role-based access control (admin/moderator/support), comprehensive dashboard with stats/activity/health, dashboard components, listing management subsection, user management subsection, activity logging, and bulk import system with CSV support.

All implementations include actual file paths, complete code examples, database schemas, validation patterns, and production-ready patterns.
