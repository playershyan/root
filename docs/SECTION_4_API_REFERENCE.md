# Section 4: API Reference

Complete endpoint documentation organized by feature domain. All endpoints return JSON responses.

**Base URL**: `https://vera.lk/api`

## Common Response Format

```json
{
  "success": boolean,
  "data"?: any,
  "error"?: string,
  "message"?: string
}
```

## Common Headers

- `Content-Type: application/json`
- `Authorization: Bearer <token>` (when authentication required)
- `x-csrf-token: <token>` (for state-changing methods)
- `x-recaptcha-token: <token>` (optional, for additional security)

## Rate Limiting

All API endpoints are rate-limited. Rate limit information is returned in response headers:

- `X-RateLimit-Limit`: Maximum requests allowed
- `X-RateLimit-Remaining`: Remaining requests
- `X-RateLimit-Reset`: ISO timestamp when limit resets
- `Retry-After`: Seconds to wait (when rate limited)

**Rate Limit Tiers**:
- General API: 100 requests/minute
- Auth endpoints: 5 requests/15 minutes
- Search: 30 requests/minute
- File upload: 15 uploads/minute
- Messaging: 20 messages/minute
- AI endpoints: 10 requests/minute (100/day per user)
- Admin actions: 50 requests/minute
- Strict (sensitive ops): 20 requests/15 minutes

**Distributed Rate Limiting** (optional):
- Set `USE_UPSTASH=true` with Upstash Redis credentials for multi-instance rate limiting
- Quarantine feature blocks IPs with excessive 429 responses (configurable threshold)

---

## 4.1 Listings API

### POST /api/listings

Create a new vehicle listing with comprehensive validation.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```typescript
{
  // Vehicle Identity
  title?: string                    // Auto-generated if not provided
  vehicleType: string               // Required: "Car", "SUV", "Van", "Bike", etc.
  make: string                      // Required: Vehicle make or "Other"
  customMake?: string               // Required if make === "Other"
  model: string                     // Required for most types
  customModel?: string              // Required if model === "Other"
  trim?: string                     // Optional: Trim level/grade
  grade?: string                    // Optional: Alternative to trim
  year: number                      // Required for most types
  registrationYear?: number         // Optional: First registration year

  // Specifications
  condition: string                 // "Brand New", "Reconditioned", "Used"
  engineCapacity?: number           // CC (e.g., 1500)
  fuelType?: string                 // "Petrol", "Diesel", "Electric", "Hybrid"
  transmission?: string             // "Automatic", "Manual", "Tiptronic"
  mileage?: number                  // Odometer reading
  color?: string                    // Exterior color
  interiorColor?: string            // Interior color

  // Ownership & History
  previousOwners?: number           // Number of previous owners
  vehicleConditionDetails?: string  // Detailed condition description
  serviceRecordsAvailable?: boolean // Service history available

  // Pricing
  pricingType: string               // "cash" or "finance"
  price?: number                    // Required for cash (null for privileged user)
  negotiable?: boolean              // Default: true

  // Finance-specific fields (when pricingType === "finance")
  financeType?: string              // "Leasing" or "Hire Purchase"
  outstandingBalance?: number       // Remaining loan amount
  monthlyPayment?: number           // Monthly installment
  remainingTerm?: string            // e.g., "24 months"
  askingPrice?: number              // Down payment/asking price

  // Location
  district: string                  // Required: Sri Lankan district
  city: string                      // Required: City/town

  // Contact
  phone: string                     // Required: Contact phone (Sri Lankan format)
  whatsapp?: string                 // Optional: Defaults to phone if not provided
  email?: string                    // Optional: Contact email

  // OTP Verification
  phoneOtpCode?: string             // Required if phone number is new/changed

  // Media
  imageUrls: string[]               // Array of Cloudinary URLs (uploaded via /api/upload/cloudinary)

  // Additional
  features?: string[]               // Optional: Array of feature strings
}
```

**Response** (201):
```json
{
  "success": true,
  "listing": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "2020 Toyota Prius - Hybrid - Auto",
    "make": "Toyota",
    "model": "Prius",
    "year": 2020,
    "price": 8500000,
    "location": "Colombo, Western",
    "status": "pending",  // or "active" for privileged users
    "image_urls": ["https://..."],
    "created_at": "2025-01-21T10:00:00Z",
    // ... other fields
  },
  "message": "Listing created successfully"
}
```

**Errors**:
- 400: Validation failed / OTP required / Duplicate listing
- 401: Unauthorized
- 409: Duplicate listing (same user, make/model/year within 24h)
- 500: Server error

**Implementation Notes**:
- Privileged user (ID: `9b288153-3836-45ff-8f0b-8a196e423477`) bypasses OTP and auto-approves
- Phone number changes require OTP verification (10 min expiration, 3 attempts max)
- Duplicate check: same user, make, model, year within 24 hours
- Title auto-generated from vehicle details if not provided
- Phone numbers normalized and stored with +94 country code
- Finance listings use `askingPrice` as display price
- Image URLs must be pre-uploaded via `/api/upload/cloudinary`
- Listing status: `pending` (requires admin approval) or `active` (auto-approved)
- All promotion flags (`is_featured`, `is_top_spot`, etc.) default to false

---

### POST /api/listings/delete

Soft delete a listing (moves to trash).

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "listing": { /* updated listing with status: "deleted" */ },
  "message": "Listing moved to bin successfully!"
}
```

**Errors**:
- 400: Listing ID required / Already deleted
- 401: Unauthorized
- 403: Permission denied (not owner)
- 404: Listing not found
- 500: Server error

**Implementation Notes**:
- Sets `status = 'deleted'` and `deleted_at = NOW()`
- Logs action in `listing_actions` table
- Permanent deletion occurs 30 days later via cron job
- Can be recovered before permanent deletion

---

### POST /api/listings/mark-sold

Mark a listing as sold.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "listing": { /* updated listing with status: "sold" */ },
  "message": "Listing marked as sold successfully!"
}
```

**Errors**:
- 400: Invalid status transition (only active/pending can be marked sold)
- 401: Unauthorized
- 403: Permission denied
- 404: Listing not found
- 500: Server error

**Implementation Notes**:
- Sets `status = 'sold'`, `sold_at = NOW()`, `sold_date = NOW()`
- Clears pause flags: `is_paused = false`, `pause_date = null`
- Logs action in `listing_actions` table
- Removes listing from search results

---

### POST /api/listings/pause

Pause or resume a listing.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "listingId": "uuid",
  "action": "pause" | "resume"
}
```

**Response** (200):
```json
{
  "success": true,
  "listing": { /* updated listing */ },
  "message": "Ad paused successfully. It will not appear in search results."
  // or "Ad resumed successfully! It is now visible to buyers again."
}
```

**Errors**:
- 400: Invalid action / Only active listings can be paused / Only paused listings can be resumed
- 401: Unauthorized
- 403: Permission denied
- 404: Listing not found
- 500: Server error

**Implementation Notes**:
- Pause: Sets `status = 'pending'`, `is_paused = true`, `pause_date = NOW()`
- Resume: Sets `status = 'active'`, `is_paused = false`, `pause_date = null`
- Preserves original `posted_date` for renewal calculation
- Logs action in `listing_actions` table

---

### POST /api/listings/renew

Renew a listing (bump to top of search results).

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "listing": { /* updated listing with new posted_date */ },
  "message": "Listing renewed successfully! It will now appear at the top of search results."
}
```

**Errors**:
- 400: Cannot renew yet (must wait 18 days since last posted date)
- 401: Unauthorized
- 403: Permission denied
- 404: Listing not found
- 500: Server error

**Implementation Notes**:
- Updates `posted_date = NOW()` to move listing to top of results
- 18-day cooldown period enforced
- Logs action in `listing_actions` table
- Does not affect promotion status

---

### POST /api/listings/[id]/view

Track a listing view (with rate limiting and anti-fraud).

**Authentication**: Optional
**Rate Limit**: None (handled by database RPC)

**Response** (200):
```json
{
  "success": true,
  "view_recorded": true,  // false if rate limited or owner viewing own listing
  "message": "View recorded"
}
```

**Errors**:
- 500: Failed to record view

**Implementation Notes**:
- Uses database RPC function `increment_listing_views_enhanced`
- Rate limiting: 1 view per IP per listing per 5 minutes
- Owner views not counted
- Tracks IP address and optional user ID
- Returns false (not error) if rate limited or owner

---

### POST /api/listings/payment/complete

Complete payment for listing promotion.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "listingId": "uuid",
  "promotionType": "featured" | "top_spot" | "boost" | "urgent",
  "paymentId": "string",
  "transactionId": "string"
}
```

**Response** (200):
```json
{
  "success": true,
  "promotion": { /* promotion record */ },
  "message": "Promotion activated successfully"
}
```

**Errors**:
- 400: Invalid promotion type / Payment verification failed
- 401: Unauthorized
- 403: Permission denied
- 404: Listing not found
- 500: Server error

**Implementation Notes**:
- Creates promotion record with expiration
- Updates listing promotion flags
- Integrates with PayHere payment gateway
- Promotion durations vary by type (typically 7-30 days)

---

## 4.2 Wanted Requests API

### POST /api/wanted-requests

Create a new wanted request (buyer looking for vehicle).

**Authentication**: Required
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```typescript
{
  title?: string                    // Auto-generated if not provided
  description?: string              // Detailed requirements

  // Vehicle preferences
  make?: string                     // Vehicle make or "Other"
  customMake?: string               // Required if make === "Other"
  model?: string                    // Vehicle model or "Other"
  customModel?: string              // Required if model === "Other"
  min_year?: number                 // Minimum year
  max_year?: number                 // Maximum year
  max_mileage?: number              // Maximum acceptable mileage
  fuel_type?: string                // Preferred fuel type
  transmission?: string             // Preferred transmission

  // Budget
  min_budget?: number               // Minimum budget (LKR)
  max_budget?: number               // Maximum budget (LKR)

  // Location
  location: string                  // Required: Location preference

  // Contact
  phone: string                     // Required: Contact phone
  whatsapp?: string                 // Optional: WhatsApp number

  // OTP Verification
  phoneOtpCode?: string             // Required if phone is new/changed
}
```

**Response** (201):
```json
{
  "success": true,
  "request": {
    "id": "uuid",
    "user_id": "uuid",
    "title": "Looking for Toyota Prius 2018-2020",
    "make": "Toyota",
    "model": "Prius",
    "min_budget": 7000000,
    "max_budget": 9000000,
    "status": "active",  // or "pending" based on config
    "created_at": "2025-01-21T10:00:00Z"
  },
  "message": "Wanted request created successfully and is now live"
}
```

**Errors**:
- 400: Validation failed / OTP required
- 401: Unauthorized
- 409: Duplicate request (same user, make/model within 24h)
- 429: Rate limit exceeded
- 500: Server error

**Implementation Notes**:
- Auto-approval enabled (`AUTO_APPROVE_WANTED_REQUESTS = true`)
- Privileged users bypass approval
- Phone OTP verification required for new/changed numbers
- Duplicate check: same user, make, model within 24 hours
- Title auto-generated from preferences if not provided
- Phone normalized with +94 country code

---

### GET /api/wanted-requests

Search and filter wanted requests.

**Authentication**: Optional
**Rate Limit**: `search` (30 req/min)

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 15, max: 50)
- `search` (text search across title/make/model/location)
- `make`
- `model`
- `location`
- `minBudget`
- `maxBudget`
- `yearFrom`
- `yearTo`
- `urgentOnly` (boolean)
- `sortBy` ("recent", "budget-high", "budget-low", "high-priority")

**Response** (200):
```json
{
  "requests": [
    {
      "id": "uuid",
      "title": "Looking for Honda Civic 2015-2018",
      "make": "Honda",
      "model": "Civic",
      "min_budget": 5000000,
      "max_budget": 7000000,
      "location": "Colombo",
      "phone": "+94771234567",
      "created_at": "2025-01-21T10:00:00Z",
      "views": 42,
      "is_urgent": false
    }
  ],
  "totalCount": 150,
  "totalPages": 10,
  "currentPage": 1,
  "hasMore": true
}
```

---

### PUT /api/wanted-requests/update

Update an existing wanted request.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "requestId": "uuid",
  // ... any fields from POST /api/wanted-requests (except user_id)
}
```

**Response** (200):
```json
{
  "success": true,
  "wantedRequest": { /* updated request */ },
  "message": "Wanted request updated successfully!"
}
```

**Errors**:
- 400: Validation failed / OTP required
- 401: Unauthorized
- 403: Permission denied
- 404: Request not found
- 500: Server error

**Implementation Notes**:
- Phone changes require OTP re-verification
- Resubmitting deleted request sets `status = 'pending'`
- Logs action in `wanted_request_actions` table

---

### POST /api/wanted-requests/close

Mark a wanted request as fulfilled (closed).

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "requestId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "wantedRequest": { /* updated request with status: "fulfilled" */ },
  "message": "Wanted request closed successfully!"
}
```

**Errors**:
- 400: Already closed
- 401: Unauthorized
- 403: Permission denied
- 404: Request not found
- 500: Server error

---

### POST /api/wanted-requests/delete

Soft delete a wanted request.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "requestId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Wanted request deleted successfully"
}
```

**Errors**:
- 400: Request ID required
- 401: Unauthorized
- 403: Permission denied
- 404: Request not found
- 500: Server error

**Implementation Notes**:
- Soft delete: sets `status = 'deleted'` and `deleted_at`
- Permanent deletion after 30 days
- Can be recovered/resubmitted via update endpoint

---

### POST /api/wanted-requests/pause

Pause or resume a wanted request.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "requestId": "uuid",
  "action": "pause" | "resume"
}
```

**Response** (200):
```json
{
  "success": true,
  "wantedRequest": { /* updated request */ },
  "message": "Request paused/resumed successfully"
}
```

---

### POST /api/wanted-requests/renew

Renew a wanted request (bump to top).

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "requestId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "wantedRequest": { /* updated request */ },
  "message": "Request renewed successfully"
}
```

**Implementation Notes**:
- 18-day cooldown between renewals
- Updates `posted_date` to move to top of search

---

### POST /api/wanted-requests/track-click

Track when a user clicks on a wanted request.

**Authentication**: Optional
**Rate Limit**: None (handled internally)

**Request Body**:
```json
{
  "requestId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Click tracked"
}
```

---

### POST /api/wanted-requests/payment/complete

Complete payment for wanted request promotion.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Implementation**: Similar to listings payment endpoint.

---

### POST /api/wanted-requests/payment/skip

Skip payment and post wanted request without promotion.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

---

## 4.3 Authentication API

### POST /api/auth/send-phone-otp

Send OTP code to phone number for verification (phone update only).

**Authentication**: Required
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "phoneNumber": "0771234567"  // Sri Lankan format
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "OTP sent successfully",
  "expiresIn": 600  // seconds (10 minutes)
}
```

**Errors**:
- 400: Invalid phone number format
- 401: Authentication required
- 429: Too many OTP requests (max 3 per hour per user/phone)
- 500: SMS sending failed

**Implementation Notes**:
- Requires authenticated user (Supabase session)
- OTP: 6-digit code, 10-minute expiration, 3 verification attempts max
- Phone normalized to format: `0XXXXXXXXX` (stored with +94)
- SMS sent via Text.lk service
- Previous pending OTPs deleted for same user+phone
- Stores OTP in `phone_verifications` table (service role client)
- Development mode: OTP logged to console if SMS fails
- Updates profile `temp_phone` and `temp_phone_otp_sent_at`

---

### POST /api/auth/verify-phone-otp

Verify OTP code for phone number update.

**Authentication**: Required
**Rate Limit**: None (3 attempts per OTP)

**Request Body**:
```json
{
  "phoneNumber": "0771234567",
  "otpCode": "123456",
  "purpose": "profile" | "listing" | "wanted"
}
```

**Response** (200):
```json
{
  "success": true,
  "userId": "uuid",
  "message": "Phone number verified successfully",
  "verified": true
}
```

**Errors**:
- 400: Invalid/expired OTP / Too many attempts
- 401: Authentication required
- 500: Server error

**Implementation Notes**:
- Validates OTP against `phone_verifications` table
- Increments attempt counter (max 3)
- For `purpose: "profile"`, marks OTP as verified immediately
- For `purpose: "listing"/"wanted"`, increments counter only (API verifies later)
- OTP must match user ID and be unexpired
- Phone normalized before lookup

---

### GET /api/auth/callback

OAuth callback handler (Google Sign-In, email verification, password recovery).

**Authentication**: None (handles authentication)
**Rate Limit**: None

**Query Parameters**:
- `code` (legacy OAuth code flow)
- `token_hash` (new email verification flow)
- `type` ("email", "recovery", "magiclink")

**Response**: Redirect to:
- `/profile` (successful auth with complete profile)
- `/profile/setup` (successful auth but incomplete profile)
- `/reset-password` (password recovery flow)
- `/auth/error` (verification failed)
- `/` (fallback)

**Implementation Notes**:
- Handles both legacy `code` and new `token_hash` flows
- Checks profile completeness (`name`, `phone`)
- Creates profile record if missing
- Differentiates between email verification, OAuth, and password recovery

---

### POST /api/auth/logout

Logout current user session.

**Authentication**: Required
**Rate Limit**: None

**Response** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

---

### GET /api/auth/sessions

Get all active sessions for current user.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Response** (200):
```json
{
  "sessions": [
    {
      "id": "uuid",
      "created_at": "2025-01-21T10:00:00Z",
      "ip": "127.0.0.1",
      "user_agent": "Mozilla/5.0..."
    }
  ]
}
```

---

### POST /api/auth/check-email

Check if email is already registered.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "email": "user@example.com"
}
```

**Response** (200):
```json
{
  "available": false,
  "message": "Email already registered"
}
```

---

### POST /api/auth/check-username

Check if username is available.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "username": "john_doe"
}
```

**Response** (200):
```json
{
  "available": true
}
```

---

### POST /api/auth/create-account

Create new user account with email/password.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "0771234567"
}
```

**Response** (201):
```json
{
  "success": true,
  "user": { /* user object */ },
  "message": "Account created. Please verify your email."
}
```

---

### POST /api/auth/google-signin

Sign in with Google OAuth.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "credential": "google_jwt_token"
}
```

**Response** (200):
```json
{
  "success": true,
  "user": { /* user object */ },
  "session": { /* session object */ }
}
```

---

### POST /api/auth/google-one-tap

Google One Tap sign-in flow.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

---

### POST /api/auth/verify-email

Verify email address with token.

**Authentication**: None
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "token": "verification_token"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Email verified successfully"
}
```

---

## 4.4 Messaging API

### POST /api/messaging/send-offer

Send a price offer to a listing owner.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Request Body**:
```json
{
  "listingId": "uuid",
  "sellerId": "uuid",
  "amount": 8000000,
  "message": "Is this price negotiable?",
  "listingTitle": "2020 Toyota Prius"
}
```

**Response** (200):
```json
{
  "success": true,
  "offerId": "uuid",
  "conversationId": "uuid",
  "message": {
    "id": "uuid",
    "content": "Made an offer of Rs. 8,000,000: Is this price negotiable?",
    "message_type": "offer",
    "offer_data": {
      "type": "offer",
      "offerId": "uuid",
      "amount": 8000000,
      "message": "Is this price negotiable?",
      "listingTitle": "2020 Toyota Prius",
      "status": "pending"
    },
    "created_at": "2025-01-21T10:00:00Z"
  }
}
```

**Errors**:
- 400: Missing required fields / Cannot offer on own listing
- 401: Unauthorized
- 500: Server error

**Implementation Notes**:
- Creates conversation if one doesn't exist between buyer and seller
- Creates offer record with status "pending"
- Sends message in conversation with `message_type: "offer"`
- Links offer to message for realtime status updates
- Updates conversation `last_message_at` and unread counters
- Prevents users from offering on their own listings

**Offer Data Structure (JSONB)**:
```typescript
{
  type: "offer"
  offerId: string
  amount: number
  message?: string
  listingTitle: string
  status: "pending" | "accepted" | "rejected" | "counter"
}
```

---

### GET /api/messaging/conversations

Get all conversations for current user.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 50)
- `archived` (boolean, default: false)

**Response** (200):
```json
{
  "conversations": [
    {
      "id": "uuid",
      "listing_id": "uuid",
      "listing_title": "2020 Toyota Prius",
      "listing_price": 8500000,
      "listing_image_url": "https://...",
      "buyer_id": "uuid",
      "seller_id": "uuid",
      "last_message_at": "2025-01-21T10:00:00Z",
      "last_message_preview": "Made an offer of Rs. 8,000,000",
      "buyer_unread_count": 0,
      "seller_unread_count": 1,
      "is_active": true,
      "participant": {
        "id": "uuid",
        "name": "John Doe",
        "avatar_url": "https://..."
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 5,
    "hasMore": false
  }
}
```

---

### GET /api/messaging/conversations/[id]

Get a specific conversation with messages.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Response** (200):
```json
{
  "conversation": {
    "id": "uuid",
    "listing_id": "uuid",
    "listing_title": "2020 Toyota Prius",
    "listing": { /* full listing details */ },
    "buyer": { /* buyer profile */ },
    "seller": { /* seller profile */ }
  },
  "messages": [
    {
      "id": "uuid",
      "sender_id": "uuid",
      "content": "Made an offer of Rs. 8,000,000",
      "message_type": "text" | "offer" | "image" | "file",
      "offer_data": { /* if message_type === "offer" */ },
      "is_read": false,
      "created_at": "2025-01-21T10:00:00Z"
    }
  ]
}
```

---

### GET /api/messaging/conversations-optimized

Optimized conversation list with database view.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Implementation**: Uses `conversation_details` database view for better performance.

---

### GET /api/messaging/messages-optimized/[conversationId]

Optimized message retrieval for a conversation.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

---

### POST /api/messaging/offers/[offerId]/respond

Respond to a price offer (accept/reject/counter).

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Request Body**:
```json
{
  "action": "accept" | "reject" | "counter",
  "counterAmount"?: number,  // Required if action === "counter"
  "message"?: string
}
```

**Response** (200):
```json
{
  "success": true,
  "offer": { /* updated offer with new status */ },
  "message": "Offer accepted successfully"
}
```

**Errors**:
- 400: Invalid action / Counter amount required
- 401: Unauthorized
- 403: Not the seller
- 404: Offer not found
- 500: Server error

---

### POST /api/messages/[id]/mark-read

Mark a message as read.

**Authentication**: Required
**Rate Limit**: `messaging` (20 req/min)

**Response** (200):
```json
{
  "success": true
}
```

**Implementation Notes**:
- Updates `is_read = true` and `read_at = NOW()`
- Decrements appropriate unread counter in conversation

---

## 4.5 Business Profile API

### GET /api/business-profile

Fetch current user's business profile.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Response** (200):
```json
{
  "profile": {
    "id": "uuid",
    "user_id": "uuid",
    "business_name": "Premium Auto Sales",
    "description": "Trusted dealer since 2010",
    "website": "https://premiumauto.lk",
    "address": "123 Galle Road, Colombo 03",
    "phone": "+94771234567",
    "whatsapp": "+94771234567",
    "operating_hours": "Mon-Sat: 9AM-6PM",
    "logo_url": "https://...",
    "banner_url": "https://...",
    "profile_image_url": "https://...",
    "is_verified": true,
    "is_paused": false,
    "created_at": "2024-01-01T00:00:00Z",
    "updated_at": "2025-01-21T10:00:00Z"
  }
}
```

**Response** (200) - No profile:
```json
{
  "profile": null
}
```

---

### POST /api/business-profile

Create a business profile.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "business_name": "Premium Auto Sales",  // Required
  "description": "Trusted dealer since 2010",
  "website": "https://premiumauto.lk",
  "address": "123 Galle Road, Colombo 03",
  "phone": "+94771234567",
  "whatsapp": "+94771234567",
  "operating_hours": "Mon-Sat: 9AM-6PM",
  "logo_url": "https://...",
  "banner_url": "https://...",
  "profile_image_url": "https://..."
}
```

**Response** (200):
```json
{
  "profile": { /* created/reactivated profile */ }
}
```

**Errors**:
- 400: Missing business name / Profile already exists
- 401: Unauthorized
- 500: Server error

**Implementation Notes**:
- Business name is required
- Reactivates soft-deleted profile if exists
- Auto-verifies profile (`is_verified = true`)
- Sets `is_active = true`, `is_paused = false`
- Profile ID matches user ID (one profile per user)

---

### PATCH /api/business-profile

Update business profile.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  // Any subset of fields from POST endpoint
  "business_name"?: string,
  "description"?: string,
  "is_paused"?: boolean,
  // ... other fields
}
```

**Response** (200):
```json
{
  "profile": { /* updated profile */ }
}
```

**Errors**:
- 401: Unauthorized
- 404: Profile not found
- 500: Server error

**Implementation Notes**:
- Updates only provided fields
- Cannot update `is_verified`, `user_id`, `id`
- Must have active profile

---

### DELETE /api/business-profile

Soft delete business profile.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Response** (200):
```json
{
  "success": true
}
```

**Errors**:
- 401: Unauthorized
- 500: Server error

**Implementation Notes**:
- Soft delete: sets `is_active = false`, `deleted_at = NOW()`
- Can be reactivated by creating profile again (POST)
- Does not delete associated listings

---

### POST /api/business-profile/pause

Pause business profile temporarily.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Response** (200):
```json
{
  "success": true,
  "profile": { /* updated profile with is_paused: true */ }
}
```

---

### POST /api/business-profile/resume

Resume paused business profile.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Response** (200):
```json
{
  "success": true,
  "profile": { /* updated profile with is_paused: false */ }
}
```

---

### POST /api/business-profile/recover

Recover soft-deleted business profile.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Response** (200):
```json
{
  "success": true,
  "profile": { /* recovered profile */ }
}
```

---

## 4.6 AI Services API

### POST /api/ai-description

Generate vehicle listing description using rule-based system.

**Authentication**: None
**Rate Limit**: `ai` (10 req/min), `aiDaily` (100 req/day)
**reCAPTCHA**: Required (score >= 0.3)

**Request Body**:
```typescript
{
  // Vehicle Identity
  vehicleType?: string
  make: string               // Required
  customMake?: string
  model?: string             // Required for most types
  customModel?: string
  trim?: string
  year?: number              // Required for most types
  registrationYear?: number

  // Specifications
  condition?: string
  engineCapacity?: number
  fuelType?: string
  transmission?: string
  mileage?: number           // Required for most types
  color?: string
  interiorColor?: string

  // History
  previousOwners?: number
  vehicleConditionDetails?: string
  serviceRecordsAvailable?: boolean

  // Pricing
  pricingType?: string
  price?: number
  negotiable?: boolean
  financeType?: string
  outstandingBalance?: number
  monthlyPayment?: number
  remainingTerm?: string
  askingPrice?: number

  // Location
  district?: string
  city?: string

  // Features
  features?: string[]

  // Additional
  title?: string
  recaptchaToken: string     // Required
}
```

**Response** (200):
```json
{
  "description": "**2020 Toyota Prius - Hybrid Excellence**\n\nWell-maintained 2020 Toyota Prius in excellent condition...",
  "linesCount": 12
}
```

**Errors**:
- 400: Validation failed / Missing required fields
- 403: reCAPTCHA verification failed (score < 0.3)
- 413: Payload too large (> 25KB)
- 500: Description generation failed

**Implementation Notes**:
- Rule-based description builder (no LLM)
- Validates required fields based on vehicle type category
- Field requirements vary by category:
  - Cars/SUVs: make, model, year, mileage required
  - Bikes: make required, model optional
  - Three-wheelers: make, year required
- reCAPTCHA verification with IP-based rate limiting
- Returns formatted markdown description
- Respects rate limits: 10/min per IP, 100/day per user
- Content sections: Overview, Specifications, Features, Finance Details, Location

---

### POST /api/generate-ai-guide

Retrieve cached buying guide for vehicle make/model.

**Authentication**: None
**Rate Limit**: `ai` (10 req/min)

**Request Body**:
```json
{
  "searchContext": "Toyota Prius 2020"  // Search query string
}
```

**Response** (200) - Guide available:
```json
{
  "available": true,
  "make": "Toyota",
  "model": "Prius",
  "year": 2020,
  "generation": "4th Gen (2016-2023)",
  "compact": "The Toyota Prius is a pioneer in hybrid technology...",
  "detailed": "**Overview**\nThe Toyota Prius fourth generation...\n\n**Key Features**\n- Hybrid Synergy Drive\n- Excellent fuel economy..."
}
```

**Response** (200) - No guide:
```json
{
  "available": false,
  "message": "AI overview not available"
}
```

**Errors**:
- 413: Payload too large (> 25KB)
- 500: Internal server error (returns unavailable, not error)

**Implementation Notes**:
- Uses pre-generated cached guides (no realtime LLM calls)
- Extracts make/model/year from search context
- Checks cache with priority: `make:model:year` → `make:model` → `make`
- Returns unavailable if no make matched or cache miss
- Cache populated by cron job (`/api/cron/generate-guides`)
- Metrics tracked: `ai.guide.cache_hit`, `ai.guide.cache_miss`, `ai.guide.no_make_match`

---

## 4.7 Promotions API

### GET /api/promotions/check

Check active promotions for a listing.

**Authentication**: Optional
**Rate Limit**: `api` (100 req/min)

**Query Parameters**:
- `listingId` (required)

**Response** (200):
```json
{
  "hasActivePromotions": true,
  "activePromotions": [
    {
      "id": "uuid",
      "promotion_type": "featured",
      "expires_at": "2025-02-01T00:00:00Z"
    },
    {
      "id": "uuid",
      "promotion_type": "boost",
      "expires_at": "2025-01-28T00:00:00Z"
    }
  ]
}
```

**Errors**:
- 400: Missing listingId parameter
- 500: Failed to check promotions

**Implementation Notes**:
- Queries `promotions` table for active promotions
- Filters by `is_active = true` and `expires_at > NOW()`
- Promotion types: "featured", "top_spot", "boost", "urgent"

---

## 4.8 Upload API

### POST /api/upload/cloudinary

Upload images to Cloudinary with optimization.

**Authentication**: Required
**Rate Limit**: `upload` (15 req/min)
**reCAPTCHA**: Optional (configurable via `RECAPTCHA_UPLOAD_REQUIRED`)

**Request**: `multipart/form-data`
- `images`: File[] (multiple files)
- `listingId`: string (optional)
- `recaptchaToken`: string (optional/required based on config)

**File Constraints**:
- Max size: 10MB per file
- Allowed types: JPEG, JPG, PNG, WebP, TIFF
- Max files: No explicit limit (rate limited at 15 uploads/min)

**Response** (200):
```json
{
  "success": true,
  "images": [
    {
      "url": "https://res.cloudinary.com/.../original.jpg",
      "publicId": "vera-lk/listings/uuid/abc123",
      "thumbnail": "https://res.cloudinary.com/.../thumbnail.jpg",
      "mobile": "https://res.cloudinary.com/.../mobile.jpg",
      "gallery": "https://res.cloudinary.com/.../gallery.jpg"
    }
  ],
  "totalUploaded": 5,
  "totalFailed": 0
}
```

**Errors**:
- 400: No files / Invalid file type / File too large / reCAPTCHA blocked
- 401: Unauthorized
- 500: Cloudinary service error / Upload failed

**Implementation Notes**:
- Uploads to folder: `vera-lk/listings/{listingId || userId}`
- Tags: `['vera-lk', 'vehicle-listing', userId, listingId]`
- Transformation: `width: 1920, height: 1440, crop: limit, quality: auto:eco, fetch_format: auto`
- Generates optimized variants:
  - `thumbnail`: 400px width
  - `mobile`: optimized for mobile
  - `gallery`: optimized for gallery view
- reCAPTCHA required if `RECAPTCHA_UPLOAD_REQUIRED=true`
- Partial success: returns successful uploads even if some fail
- Returns debug info in development mode

**Cloudinary Optimizations**:
- Auto format selection (WebP/AVIF)
- Responsive breakpoints
- Quality: auto:eco
- Lazy loading support

---

### DELETE /api/upload/cloudinary

Delete image from Cloudinary.

**Authentication**: Required
**Rate Limit**: `upload` (15 req/min)

**Query Parameters**:
- `publicId` (required): Cloudinary public ID

**Response** (200):
```json
{
  "success": true
}
```

**Errors**:
- 400: Public ID required
- 401: Unauthorized
- 403: Unauthorized to delete this image (not owned by user)
- 500: Deletion failed

**Implementation Notes**:
- User can only delete images in their own folder
- Validates `publicId` contains user ID
- Calls Cloudinary delete API

---

## 4.9 Search API

### GET /api/search

Search and filter vehicle listings.

**Authentication**: Optional
**Rate Limit**: `search` (30 req/min)

**Query Parameters**:
- `q` (text search across title/description/make/model)
- `make`
- `model`
- `minYear`
- `maxYear`
- `minPrice`
- `maxPrice`
- `fuelType`
- `transmission`
- `bodyType`
- `location`
- `isFinance` ("true" | "false")
- `sortBy` ("price_asc", "price_desc", "year_asc", "year_desc", "created_at")
- `page` (default: 1)
- `limit` (default: 15, max: 50)

**Response** (200):
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "title": "2020 Toyota Prius - Hybrid",
      "price": 8500000,
      "location": "Colombo, Western",
      "make": "Toyota",
      "model": "Prius",
      "year": 2020,
      "mileage": 45000,
      "fuel_type": "Hybrid",
      "transmission": "Automatic",
      "body_type": "Sedan",
      "negotiable": true,
      "pricing_type": "cash",
      "image_url": "https://...",
      "primary_image_url": "https://...",
      "image_urls": ["https://..."],
      "created_at": "2025-01-21T10:00:00Z",
      "views": 150,
      "user_id": "uuid",
      // Promotion fields (only if active)
      "is_featured": true,
      "is_top_spot": true,
      "boost_score": 100
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 15,
    "total": 150,
    "totalPages": 10
  }
}
```

**Errors**:
- 500: Search failed

**Implementation Notes**:
- Filters out sold listings (`is_sold = false`)
- Text search uses `OR` across multiple fields with case-insensitive `ILIKE`
- Promotion-based sorting:
  1. Featured listings first
  2. Top spot listings second
  3. Boost score (highest first)
  4. User-selected sort order
- Pagination: `RANGE` query with offset/limit
- Optimized response: promotion fields only included if active
- Default sort: `created_at DESC`

---

## 4.10 User Dashboard API

### GET /api/user/dashboard

Get user dashboard data (favorites, messages, wanted requests).

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Response** (200):
```json
{
  "favorites": {
    "total": 12,
    "recent": [
      {
        "id": "uuid",
        "title": "2020 Toyota Prius",
        "price": 8500000,
        "location": "Colombo",
        "imageUrl": "https://...",
        "favoritedAt": "2025-01-21T10:00:00Z"
      }
    ]
  },
  "messaging": {
    "total": 8,
    "unreadMessages": 5,
    "unreadConversations": 3,
    "recent": [
      {
        "id": "uuid",
        "listingTitle": "2020 Toyota Prius",
        "listingPrice": 8500000,
        "listingImageUrl": "https://...",
        "lastMessageAt": "2025-01-21T10:00:00Z",
        "lastMessagePreview": "Is this still available?",
        "unreadCount": 2,
        "participant": {
          "role": "buyer" | "seller",
          "name": "John Doe",
          "avatarUrl": "https://..."
        }
      }
    ]
  },
  "wantedRequests": {
    "total": 3,
    "active": 2,
    "pending": 1,
    "paused": 0,
    "closed": 0
  }
}
```

**Errors**:
- 401: Authentication required
- 500: Internal server error

**Implementation Notes**:
- Fetches data in parallel (3 queries):
  1. Favorites with listing details (last 5)
  2. Conversations with unread counts (last 5)
  3. Wanted requests grouped by status
- Uses optimized `conversation_details` view
- Calculates unread messages and conversations
- Determines participant role (buyer/seller) relative to user

---

## 4.11 Admin API

### POST /api/admin/cleanup

Manually trigger permanent deletion of old records.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Request Headers**:
- `Authorization: Bearer <admin_token>`

**Response** (200):
```json
{
  "success": true,
  "message": "Cleanup completed successfully",
  "deleted": {
    "listings": 15,
    "wanted_requests": 8
  },
  "triggered_by": "admin@vera.lk",
  "timestamp": "2025-01-21T10:00:00Z"
}
```

**Errors**:
- 401: Unauthorized / Invalid token
- 403: Insufficient permissions (not admin)
- 500: Cleanup failed

**Implementation Notes**:
- Calls database RPC: `permanently_delete_old_records()`
- Admin verification: checks `ADMIN_EMAILS` environment variable
- Logs action in `deletion_logs` table with admin email
- Deletes records soft-deleted 30+ days ago
- Returns count of deleted listings and wanted requests

---

### GET /api/admin/cleanup

Get pending deletion statistics.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "stats": {
    "total_pending": 45,
    "overdue": 5,
    "imminent": 12,
    "pending": 28
  },
  "pending_deletions": [
    {
      "id": "uuid",
      "table_name": "listings",
      "title": "2020 Toyota Prius",
      "scheduled_permanent_deletion": "2025-01-25T00:00:00Z",
      "days_until_deletion": 4,
      "deletion_status": "imminent",
      "seller_id": "uuid",
      "created_at": "2024-12-01T00:00:00Z"
    }
  ],
  "recent_logs": [
    {
      "id": "uuid",
      "table_name": "listings",
      "record_id": "uuid",
      "user_id": "uuid",
      "deletion_reason": "Auto cleanup - 30 days expired",
      "record_data": { /* backup of deleted record */ },
      "created_at": "2025-01-20T10:00:00Z"
    }
  ],
  "timestamp": "2025-01-21T10:00:00Z"
}
```

**Implementation Notes**:
- Queries `pending_permanent_deletion` view
- Deletion statuses:
  - `overdue`: Past scheduled deletion date
  - `imminent`: 1-7 days remaining
  - `pending`: 8-30 days remaining
- Shows last 50 deletion logs
- Includes backup data for recovery

---

### POST /api/admin/deletion-safety

Approve or reject deletion batches.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/stats

Get platform statistics.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "listings": {
    "total": 15000,
    "active": 12000,
    "pending": 500,
    "sold": 2000,
    "deleted": 500
  },
  "users": {
    "total": 5000,
    "verified": 4500,
    "business_profiles": 150
  },
  "wanted_requests": {
    "total": 1000,
    "active": 800,
    "pending": 100,
    "fulfilled": 100
  },
  "conversations": {
    "total": 8000,
    "active": 6000
  },
  "promotions": {
    "active": 50,
    "featured": 20,
    "top_spot": 15,
    "boost": 10,
    "urgent": 5
  }
}
```

---

### GET /api/admin/listings

Get all listings for admin review.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Query Parameters**:
- `status` ("pending", "active", "sold", "deleted")
- `page` (default: 1)
- `limit` (default: 50, max: 100)

---

### POST /api/admin/listings/approve

Approve a pending listing.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "listing": { /* approved listing with status: "active" */ }
}
```

---

### POST /api/admin/listings/reject

Reject a pending listing.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Request Body**:
```json
{
  "listingId": "uuid",
  "reason": "Violates terms of service"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Listing rejected"
}
```

---

### GET /api/admin/wanted-requests

Get all wanted requests for admin review.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### POST /api/admin/wanted-requests/approve

Approve a pending wanted request.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### POST /api/admin/wanted-requests/reject

Reject a pending wanted request.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### DELETE /api/admin/wanted-requests/delete

Permanently delete a wanted request (admin override).

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/business-profiles

Get all business profiles for verification.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### POST /api/admin/business-profiles/verify

Verify a business profile.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Request Body**:
```json
{
  "profileId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "profile": { /* verified profile with is_verified: true */ }
}
```

---

### GET /api/admin/reports

Get user-submitted reports.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/alerts

Get system alerts.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/alerts/unread-count

Get count of unread alerts.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "count": 5
}
```

---

### GET /api/admin/activity/recent

Get recent admin activity log.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/health

Get system health metrics.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "status": "healthy",
  "database": {
    "connected": true,
    "latency_ms": 15
  },
  "redis": {
    "connected": true,
    "latency_ms": 5
  },
  "cloudinary": {
    "configured": true
  },
  "rate_limiter": {
    "type": "upstash",  // or "memory"
    "status": "healthy"
  }
}
```

---

### GET /api/admin/security-metrics

Get security and rate limiting metrics.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "rate_limits": {
    "api": { "hits": 15000, "blocks": 50 },
    "auth": { "hits": 500, "blocks": 15 },
    "upload": { "hits": 2000, "blocks": 10 }
  },
  "quarantine": {
    "blocked_ips": 5,
    "strikes_tracked": 25
  },
  "top_offenders": {
    "ips": [
      { "id": "192.168.1.100", "count": 50 }
    ],
    "paths": [
      { "id": "/api/search", "count": 100 }
    ]
  },
  "captcha": {
    "blocks": 20,
    "success_rate": 0.98
  }
}
```

---

### POST /api/admin/auth/verify

Verify admin authentication token.

**Authentication**: Required
**Rate Limit**: `admin` (50 req/min)

**Response** (200):
```json
{
  "valid": true,
  "user": {
    "id": "uuid",
    "email": "admin@vera.lk",
    "role": "admin"
  }
}
```

---

### POST /api/admin/setup

Initial admin setup endpoint.

**Authentication**: Special (setup token)
**Rate Limit**: `admin` (50 req/min)

---

### GET /api/admin/templates

Get AI guide templates.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

---

## 4.12 Utility APIs

### GET /api/csrf-token

Get CSRF token for form submissions.

**Authentication**: None
**Rate Limit**: None

**Response** (200):
```json
{
  "token": "csrf_token_string"
}
```

---

### GET /api/health

Public health check endpoint.

**Authentication**: None
**Rate Limit**: None

**Response** (200):
```json
{
  "status": "ok",
  "timestamp": "2025-01-21T10:00:00Z"
}
```

---

### GET /api/docs

API documentation (Swagger/OpenAPI).

**Authentication**: None
**Rate Limit**: None

**Response**: HTML page with interactive API documentation

---

### GET /api/docs/openapi.json

OpenAPI specification in JSON format.

**Authentication**: None
**Rate Limit**: None

**Response** (200):
```json
{
  "openapi": "3.0.0",
  "info": {
    "title": "Vera.lk API",
    "version": "1.0.0"
  },
  "paths": { /* ... */ }
}
```

---

### POST /api/security/verify-recaptcha

Verify reCAPTCHA token.

**Authentication**: None
**Rate Limit**: `api` (100 req/min)

**Request Body**:
```json
{
  "token": "recaptcha_response_token"
}
```

**Response** (200):
```json
{
  "success": true,
  "score": 0.9,
  "action": "submit",
  "challenge_ts": "2025-01-21T10:00:00Z",
  "hostname": "vera.lk"
}
```

---

### GET /api/locations/search

Search for locations (cities/districts in Sri Lanka).

**Authentication**: None
**Rate Limit**: `search` (30 req/min)

**Query Parameters**:
- `q` (search query)

**Response** (200):
```json
{
  "locations": [
    { "name": "Colombo", "district": "Colombo", "province": "Western" },
    { "name": "Kandy", "district": "Kandy", "province": "Central" }
  ]
}
```

---

### GET /api/profiles

Get user profiles (public).

**Authentication**: Optional
**Rate Limit**: `api` (100 req/min)

**Query Parameters**:
- `userId` (optional)

**Response** (200):
```json
{
  "profile": {
    "id": "uuid",
    "name": "John Doe",
    "avatar_url": "https://...",
    "created_at": "2024-01-01T00:00:00Z",
    "listing_count": 5,
    "business_profile": { /* if exists */ }
  }
}
```

---

### POST /api/reports/create

Submit a report (listing/user).

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "type": "listing" | "user" | "message",
  "targetId": "uuid",
  "reason": "spam" | "inappropriate" | "scam" | "other",
  "description": "Additional details"
}
```

**Response** (200):
```json
{
  "success": true,
  "reportId": "uuid",
  "message": "Report submitted successfully"
}
```

---

### POST /api/favorites

Add listing to favorites.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Request Body**:
```json
{
  "listingId": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "favorite": {
    "id": "uuid",
    "listing_id": "uuid",
    "user_id": "uuid",
    "created_at": "2025-01-21T10:00:00Z"
  }
}
```

---

### DELETE /api/favorites

Remove listing from favorites.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Query Parameters**:
- `listingId` (required)

**Response** (200):
```json
{
  "success": true
}
```

---

### GET /api/favorites/listings

Get user's favorited listings.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Query Parameters**:
- `page` (default: 1)
- `limit` (default: 20, max: 50)

**Response** (200):
```json
{
  "favorites": [
    {
      "listing_id": "uuid",
      "created_at": "2025-01-21T10:00:00Z",
      "listing": { /* full listing details */ }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "totalPages": 3
  }
}
```

---

### POST /api/user/password

Update user password.

**Authentication**: Required
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecurePass456!"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

---

### POST /api/user/delete-account

Request account deletion.

**Authentication**: Required
**Rate Limit**: `auth` (5 req/15 min)

**Request Body**:
```json
{
  "password": "current_password",
  "reason": "No longer needed"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Account deletion scheduled. You have 30 days to cancel."
}
```

**Implementation Notes**:
- Soft deletion: account marked for deletion
- 30-day grace period before permanent deletion
- All listings/requests moved to deleted status
- Can cancel deletion within grace period

---

### GET /api/user/bin

Get user's deleted items (trash bin).

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Response** (200):
```json
{
  "listings": [
    {
      "id": "uuid",
      "title": "2020 Toyota Prius",
      "deleted_at": "2025-01-01T00:00:00Z",
      "scheduled_permanent_deletion": "2025-01-31T00:00:00Z",
      "days_remaining": 10
    }
  ],
  "wanted_requests": [
    {
      "id": "uuid",
      "title": "Looking for Honda Civic",
      "deleted_at": "2025-01-01T00:00:00Z",
      "scheduled_permanent_deletion": "2025-01-31T00:00:00Z",
      "days_remaining": 10
    }
  ]
}
```

---

### POST /api/user/delete

Restore item from trash.

**Authentication**: Required
**Rate Limit**: `strict` (20 req/15 min)

**Request Body**:
```json
{
  "type": "listing" | "wanted_request",
  "id": "uuid"
}
```

**Response** (200):
```json
{
  "success": true,
  "message": "Item restored successfully"
}
```

---

### POST /api/notifications/register

Register device for push notifications.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Request Body**:
```json
{
  "token": "fcm_device_token",
  "platform": "web" | "ios" | "android"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

### POST /api/notifications/unregister

Unregister device from push notifications.

**Authentication**: Required
**Rate Limit**: `api` (100 req/min)

**Request Body**:
```json
{
  "token": "fcm_device_token"
}
```

**Response** (200):
```json
{
  "success": true
}
```

---

## 4.13 Payment API

### POST /api/payments/payhere/notify

PayHere payment gateway notification webhook.

**Authentication**: Webhook signature verification
**Rate Limit**: None

**Request Body**: PayHere webhook payload

**Response** (200):
```json
{
  "success": true
}
```

**Implementation Notes**:
- Verifies webhook signature
- Updates payment status in database
- Activates promotions on successful payment
- Sends confirmation email/notification

---

### GET /api/payments/sandbox/check

Check if PayHere is in sandbox mode.

**Authentication**: None
**Rate Limit**: None

**Response** (200):
```json
{
  "sandbox": true,
  "merchant_id": "sandbox_merchant_id"
}
```

---

### POST /api/payments/sandbox

Test payment in sandbox mode.

**Authentication**: Required (Development only)
**Rate Limit**: None

---

## 4.14 Cron Job APIs

### POST /api/cron/cleanup-otp

Clean up expired OTP codes.

**Authentication**: Cron secret (`CRON_SECRET`)
**Rate Limit**: None

**Response** (200):
```json
{
  "success": true,
  "deleted": 150
}
```

**Schedule**: Every hour

---

### POST /api/cron/promotions

Rotate promoted listings (featured, top spot, boost).

**Authentication**: Cron secret
**Rate Limit**: None

**Response** (200):
```json
{
  "success": true,
  "rotated": {
    "featured": 5,
    "top_spot": 3
  }
}
```

**Schedule**: Every 6 hours

**Implementation Notes**:
- Implements fair rotation algorithm
- Ensures diverse listing visibility
- Expires old promotions
- Updates boost scores

---

### POST /api/cron/generate-guides

Generate AI buying guides for popular vehicles.

**Authentication**: Cron secret
**Rate Limit**: None

**Response** (200):
```json
{
  "success": true,
  "generated": 50,
  "cached": 50
}
```

**Schedule**: Weekly

---

### POST /api/cron/clean-guides

Clean up old/stale AI buying guides.

**Authentication**: Cron secret
**Rate Limit**: None

**Schedule**: Monthly

---

### POST /api/cron/generate-templates

Generate AI guide templates for new vehicle models.

**Authentication**: Cron secret
**Rate Limit**: None

**Schedule**: Daily

---

### POST /api/cron/regenerate-templates

Regenerate existing AI guide templates.

**Authentication**: Cron secret
**Rate Limit**: None

**Schedule**: Weekly

---

## 4.15 Test/Debug APIs

### GET /api/sentry-example-api

Test Sentry error tracking.

**Authentication**: None (Development only)
**Rate Limit**: None

**Response**: Throws error to test Sentry integration

---

### POST /api/test/sentry-metrics

Test Sentry metrics/performance tracking.

**Authentication**: None (Development only)
**Rate Limit**: None

---

## 4.16 Bulk Operations (Admin)

### POST /api/admin/bulk-import-listings

Bulk import listings from CSV/JSON.

**Authentication**: Required (Admin only)
**Rate Limit**: `admin` (50 req/min)

**Request**: `multipart/form-data`
- `file`: CSV or JSON file

**Response** (200):
```json
{
  "success": true,
  "imported": 150,
  "failed": 5,
  "errors": [
    { "row": 10, "error": "Invalid phone number" }
  ]
}
```

---

## Error Response Format

All API endpoints return errors in a consistent format:

```json
{
  "error": "Error message",
  "details"?: "Additional error details",
  "code"?: "ERROR_CODE",
  "success": false
}
```

**Common HTTP Status Codes**:
- 200: Success
- 201: Created
- 400: Bad Request (validation error)
- 401: Unauthorized (authentication required)
- 403: Forbidden (permission denied)
- 404: Not Found
- 409: Conflict (duplicate resource)
- 413: Payload Too Large
- 429: Too Many Requests (rate limit exceeded)
- 500: Internal Server Error

---

## Rate Limit Bypass (Development)

In development mode, rate limiting can be bypassed by setting:
- `RATE_LIMIT_DISABLED=true` in environment variables

**Distributed Rate Limiting** (Production):
- Enable Upstash Redis: `USE_UPSTASH=true`
- Configure Upstash credentials: `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- Benefits: Shared rate limits across multiple server instances

---

## Authentication Methods

1. **Session-based** (Supabase Auth):
   - Cookie-based sessions
   - Automatic session refresh
   - Used by most endpoints

2. **Bearer Token**:
   - `Authorization: Bearer <token>`
   - Used for admin endpoints
   - Token from Supabase `session.access_token`

3. **API Key** (Future):
   - Not yet implemented
   - Planned for third-party integrations

---

## Webhook Signature Verification

PayHere webhooks verified using:
- Merchant ID + Order ID + Amount + Status + MD5 hash
- Signature in `md5sig` field

---

## Database Transaction Guarantees

Critical operations use database transactions:
- Listing creation with promotion
- Payment completion with promotion activation
- Conversation + offer + message creation (atomic)

---

## Monitoring & Observability

All API endpoints instrumented with:
- Performance metrics (response time, throughput)
- Error tracking (Sentry)
- Rate limit metrics
- Database query timing
- Custom counters: `api.{endpoint}.{outcome}`

---

## Production Considerations

1. **Rate Limiting**:
   - LRU cache (in-memory) for single-instance deployments
   - Upstash Redis for distributed deployments
   - Quarantine feature for abusive IPs

2. **File Uploads**:
   - Max 10MB per file
   - Cloudinary transformation pipeline
   - Virus scanning (future)

3. **Database Connection Pooling**:
   - Supabase handles connection pooling
   - Recommended: Use connection string with `pgbouncer` mode

4. **Error Handling**:
   - All errors logged to Sentry
   - Sensitive data scrubbed from logs
   - User-friendly error messages

5. **Security**:
   - CSRF protection on state-changing endpoints
   - ReCAPTCHA on public forms
   - SQL injection prevention (parameterized queries)
   - XSS prevention (sanitized inputs)

---

**End of Section 4: API Reference**
