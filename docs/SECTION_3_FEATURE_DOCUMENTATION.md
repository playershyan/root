# Section 3: Feature Documentation

This section provides comprehensive technical documentation for all 6 major features.

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

(Continuing with Section 3.5 Business Profiles and 3.6 Admin Dashboard in output from agent a346cf0)
