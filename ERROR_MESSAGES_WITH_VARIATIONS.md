# Complete List of Error Messages with Dynamic Content Variations

This document lists all ~80 unique error messages found in the codebase, including all variations of their dynamic content.

---

## 1. Account & Profile Management

### 1.1 Profile Update Errors
**Base Pattern:** `Failed to update profile: ${error.message || 'Try again later.'}`

**Variations:**
- `Failed to update profile: [specific error message]` (when error.message exists)
- `Failed to update profile: Try again later.` (fallback)

**Location:** `app/profile/account/AccountPageClient.tsx:108`

---

## 2. Business Profile Management

### 2.1 Business Profile Creation Errors
**Base Pattern:** `Error: ${result.error || 'Failed to create business profile'}`

**Variations:**
- `Error: [specific error from result.error]`
- `Error: Failed to create business profile` (fallback)

**Alternative Pattern:** `error instanceof Error ? error.message : 'Failed to create business profile'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to create business profile` (fallback)

**Locations:**
- `app/profile/account/AccountPageClient.tsx:133` (first pattern)
- `app/profile/business/BusinessPageClient.tsx:71` (second pattern)

### 2.2 Business Profile Update Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to update business profile'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to update business profile` (fallback)

**Location:** `app/profile/business/BusinessPageClient.tsx:100`

### 2.3 Business Profile Pause Errors
**Base Pattern:** `Error: ${result.error || 'Failed to pause business profile'}`

**Variations:**
- `Error: [specific error from result.error]`
- `Error: Failed to pause business profile` (fallback)

**Alternative Pattern:** `error instanceof Error ? error.message : 'Failed to pause business profile'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to pause business profile` (fallback)

**Locations:**
- `app/profile/account/AccountPageClient.tsx:144` (first pattern)
- `app/profile/business/BusinessPageClient.tsx:125` (second pattern)

### 2.4 Business Profile Resume Errors
**Base Pattern:** `Error: ${result.error || 'Failed to resume business profile'}`

**Variations:**
- `Error: [specific error from result.error]`
- `Error: Failed to resume business profile` (fallback)

**Alternative Pattern:** `error instanceof Error ? error.message : 'Failed to resume business profile'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to resume business profile` (fallback)

**Locations:**
- `app/profile/account/AccountPageClient.tsx:154` (first pattern)
- `app/profile/business/BusinessPageClient.tsx:149` (second pattern)

### 2.5 Business Profile Delete Errors
**Base Pattern:** `Error: ${result.error || 'Failed to delete business profile'}`

**Variations:**
- `Error: [specific error from result.error]`
- `Error: Failed to delete business profile` (fallback)

**Alternative Pattern:** `error instanceof Error ? error.message : 'Failed to delete business profile'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to delete business profile` (fallback)

**Locations:**
- `app/profile/account/AccountPageClient.tsx:168` (first pattern)
- `app/profile/business/BusinessPageClient.tsx:177` (second pattern)

---

## 3. Listings Management

### 3.1 Listing Pause Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to pause listing'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to pause listing` (fallback)

**Location:** `app/profile/listings/ListingsPageClient.tsx:143`

### 3.2 Listing Resume Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to resume listing'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to resume listing` (fallback)

**Location:** `app/profile/listings/ListingsPageClient.tsx:165`

### 3.3 Listing Mark as Sold Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to mark as sold'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to mark as sold` (fallback)

**Location:** `app/profile/listings/ListingsPageClient.tsx:189`

### 3.4 Listing Move to Bin Errors
**Static Message:**
- `Failed to move listing to bin`

**Location:** `app/profile/listings/ListingsPageClient.tsx:217`

### 3.5 Payment Errors
**Static Message:**
- `Payment failed. Please try again.`

**Location:** `app/profile/listings/ListingsPageClient.tsx:118`

---

## 4. Listing Creation & Editing

### 4.1 Listing Not Found/Permission Errors
**Static Message:**
- `Listing not found or you do not have permission to edit it`

**Location:** `app/post/page.tsx:169`

### 4.2 Listing Data Load Errors
**Static Message:**
- `Failed to load listing data`

**Location:** `app/post/page.tsx:285`

### 4.3 Image Upload Errors
**Base Pattern:** `Failed to upload ${file.name}: ${errorMessage}`

**Variations:**
- `Failed to upload [filename]: [specific error message]`
- `Failed to upload [filename]: Upload failed` (fallback)

**Alternative Pattern:** `Failed to upload ${file.name}: ${error?.message || 'Unknown error'}`

**Variations:**
- `Failed to upload [filename]: [error.message]` (when error.message exists)
- `Failed to upload [filename]: Unknown error` (fallback)

**Locations:**
- `app/post/page.tsx:685` (first pattern)
- `app/post/page.tsx:697` (second pattern)

### 4.4 Image Size Errors
**Static Messages:**
- `Image exceeds 10MB`
- `Image exceeds 10MB: ${file.name}`

**Variations:**
- `Image exceeds 10MB` (generic)
- `Image exceeds 10MB: [filename]` (with filename)

**Locations:**
- `app/post/page.tsx:733` (generic)
- `app/post/page.tsx:765` (with filename)
- `app/components/profile/BusinessPageTab.tsx:109` (generic)

### 4.5 Image Limit Errors
**Static Message:**
- `Maximum 10 images allowed`

**Location:** `app/post/page.tsx:743, 775`

### 4.6 Invalid File Type Errors
**Base Pattern:** `Invalid file type: ${file.name}. Allowed: JPEG, JPG, PNG, TIFF, WebP`

**Variations:**
- `Invalid file type: [filename]. Allowed: JPEG, JPG, PNG, TIFF, WebP`

**Location:** `app/post/page.tsx:759`

### 4.7 AI Description Generation Errors
**Static Message:**
- `Could not build the description. Try again later.`

**Location:** `app/post/page.tsx:876`

### 4.8 Validation Errors
**Base Pattern (Single Error):** `Validation failed: ${firstError}`

**Variations:**
- `Validation failed: [first error message]`

**Base Pattern (Multiple Errors):** `Validation failed: ${errorCount} errors found. ${firstError}`

**Variations:**
- `Validation failed: [number] errors found. [first error message]`
  - Example: `Validation failed: 3 errors found. Title is required`
  - Example: `Validation failed: 5 errors found. Price must be a number`

**Locations:** `app/post/page.tsx:1070, 1072`

### 4.9 Duplicate Listing Errors
**Base Pattern:** `result.error || 'You have already posted a similar listing recently.'`

**Variations:**
- `[result.error]` (when result.error exists)
- `You have already posted a similar listing recently.` (fallback)

**Location:** `app/post/page.tsx:1091`

### 4.10 Server Errors
**Base Pattern:** `Server error: ${result.details}`

**Variations:**
- `Server error: [server error details]`

**Location:** `app/post/page.tsx:1097`

### 4.11 Listing Creation Errors
**Base Pattern:** `result.error || result.details || 'Failed to create listing'`

**Variations:**
- `[result.error]` (when result.error exists)
- `[result.details]` (when result.details exists but result.error doesn't)
- `Failed to create listing` (fallback)

**Location:** `app/post/page.tsx:1102`

### 4.12 Generic Submission Errors
**Base Pattern:** `errorMessage` (dynamic variable)

**Variations:**
- Any error message constructed from catch block
- Typically includes error details from API responses

**Location:** `app/post/page.tsx:1132`

---

## 5. Wanted Requests

### 5.1 Wanted Request Load Errors
**Static Messages:**
- `Error loading wanted request. Try again later.` (sonner)
- `Error loading wanted request. Please try again.` (useToast)

**Locations:**
- `app/wanted/post/page.tsx:217` (sonner)
- `app/wanted/post/page.tsx:130` (useToast)

### 5.2 High Priority Payment Errors
**Static Message:**
- `High priority payments are coming soon. Your request is live as a regular post.`

**Location:** `app/wanted/post/page.tsx:487`

### 5.3 Wanted Request Validation Errors
**Base Pattern:** `result.error || 'Validation failed. Please check your input.'`

**Variations:**
- `[result.error]` (when result.error exists)
- `Validation failed. Please check your input.` (fallback)

**Locations:** `app/wanted/post/page.tsx:554, 586`

### 5.4 Wanted Request Update Errors
**Base Pattern:** `result.error || 'Failed to update wanted request'`

**Variations:**
- `[result.error]` (when result.error exists)
- `Failed to update wanted request` (fallback)

**Location:** `app/wanted/post/page.tsx:558`

### 5.5 Duplicate Wanted Request Errors
**Base Pattern:** `result.error || 'You have already posted a similar request recently.'`

**Variations:**
- `[result.error]` (when result.error exists)
- `You have already posted a similar request recently.` (fallback)

**Location:** `app/wanted/post/page.tsx:591`

### 5.6 Rate Limit Errors
**Base Pattern:** `result.message || 'Too many requests. Please try again later.'`

**Variations:**
- `[result.message]` (when result.message exists)
- `Too many requests. Please try again later.` (fallback)

**Location:** `app/wanted/post/page.tsx:596`

### 5.7 Generic Wanted Request Errors
**Static Message:**
- `Error posting request. Please try again.`

**Location:** `app/wanted/post/page.tsx:625`

### 5.8 Wanted Request Action Errors (Pause/Resume)
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to ${action} wanted request'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to pause wanted request` (when action = 'pause')
- `Failed to resume wanted request` (when action = 'resume')

**Location:** `app/profile/wanted/WantedPageClient.tsx:83`

### 5.9 Wanted Request Close Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to close wanted request'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to close wanted request` (fallback)

**Location:** `app/profile/wanted/WantedPageClient.tsx:109`

### 5.10 Wanted Request Move to Bin Errors
**Static Message:**
- `Failed to move wanted request to bin`

**Location:** `app/profile/wanted/WantedPageClient.tsx:137`

---

## 6. Paid Features & Promotions

### 6.1 Active Features Errors
**Static Message:**
- `This listing already has active paid features`

**With Description (Sonner):**
- Description: `Active: ${featureNames}. Only one paid feature can be active at a time.`

**Variations:**
- `Active: [feature names]. Only one paid feature can be active at a time.`
  - Example: `Active: Featured, Top Spot. Only one paid feature can be active at a time.`
  - Example: `Active: Boosted. Only one paid feature can be active at a time.`

**Locations:**
- `app/post/paid-features/page.tsx:60`
- `app/components/payments/PaymentModal.tsx:86`

### 6.2 Missing Listing ID Errors
**Static Messages:**
- `No listing ID provided`
- `Please enter a listing ID`

**Locations:**
- `app/post/paid-features/page.tsx:155`
- `app/payment-sandbox/page.tsx:61`

### 6.3 Missing Wanted Request ID Errors
**Static Message:**
- `No wanted request ID provided`

**Location:** `app/wanted/paid-features/page.tsx:116`

### 6.4 Missing Feature Selection Errors
**Static Message:**
- `Please select at least one promotion feature`

**Locations:**
- `app/post/paid-features/page.tsx:160`
- `app/wanted/paid-features/page.tsx:121`
- `app/payment-sandbox/page.tsx:66`

### 6.5 Active Features Conflict Errors
**Static Message:**
- `Cannot add promotions to a listing with active features`

**Locations:**
- `app/post/paid-features/page.tsx:165`
- `app/components/payments/PaymentModal.tsx:133, 143`

### 6.6 Payment Sandbox Errors
**Base Pattern:** `result.message || 'Payment failed (Sandbox)'`

**Variations:**
- `[result.message]` (when result.message exists)
- `Payment failed (Sandbox)` (fallback)

**Alternative Pattern:** `data.message || 'Payment failed (Sandbox)'`

**Variations:**
- `[data.message]` (when data.message exists)
- `Payment failed (Sandbox)` (fallback)

**Locations:**
- `app/components/payments/PaymentModal.tsx:189` (first pattern)
- `app/payment-sandbox/page.tsx:102` (second pattern)

### 6.7 Payment Processing Errors
**Static Messages:**
- `Error processing sandbox payment`
- `Error processing payment test`

**Locations:**
- `app/components/payments/PaymentModal.tsx:194`
- `app/payment-sandbox/page.tsx:106`

---

## 7. Messaging & Conversations

### 7.1 Message Send Errors
**Static Messages:**
- `Failed to send message. Please try again.`
- `Failed to send message. Try again later.`

**Locations:**
- `app/messages/[conversationId]/ConversationThreadClient.tsx:184` (first)
- `app/components/modals/ConversationModal.tsx:273` (second)
- `app/components/messaging/EnhancedConversationModal.tsx:302` (second)

### 7.2 Offer Send Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to send offer'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to send offer` (fallback)

**Location:** `app/messages/[conversationId]/ConversationThreadClient.tsx:227`

### 7.3 Offer Update Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to update offer'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to update offer` (fallback)

**Location:** `app/messages/[conversationId]/ConversationThreadClient.tsx:271`

### 7.4 Message Load Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to load messages'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to load messages` (fallback)

**Location:** `app/messages/[conversationId]/ConversationThreadClient.tsx:300`

### 7.5 Conversation Start Errors
**Static Messages:**
- `Unable to send message. Listing information is missing.`
- `You cannot send messages to your own listing.`
- `Failed to start conversation. Try again later.`

**Locations:**
- `app/components/ContactProfile.tsx:227` (first)
- `app/components/ContactProfile.tsx:253` (second)
- `app/components/ContactProfile.tsx:267` (third)

### 7.6 Offer on Own Listing Errors
**Static Message:**
- `You cannot make an offer on your own listing`

**Location:** `app/listings/[id]/ListingDetailClient.tsx:206`

### 7.7 Generic Listing Detail Errors
**Base Pattern:** `errorMessage` (dynamic variable)

**Variations:**
- Any error message from API responses

**Location:** `app/listings/[id]/ListingDetailClient.tsx:175`

### 7.8 Unexpected Errors
**Static Message:**
- `An unexpected error occurred. Please try again.`

**Location:** `app/listings/[id]/ListingDetailClient.tsx:193`

### 7.9 Mark as Read Errors
**Static Messages:**
- `Failed to mark as read`
- `Failed to mark all as read`

**Locations:**
- `app/profile/messages/MessagesPageClient.tsx:76` (first)
- `app/profile/notifications/NotificationsPageClient.tsx:76` (first)
- `app/profile/notifications/NotificationsPageClient.tsx:94` (second)

### 7.10 Conversation Delete Errors
**Static Message:**
- `Failed to delete conversation`

**Location:** `app/profile/messages/MessagesPageClient.tsx:98`

---

## 8. Security & Account Settings

### 8.1 Password Update Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to update password'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to update password` (fallback)

**Location:** `app/profile/security/SecurityPageClient.tsx:130`

### 8.2 Session Update Errors
**Static Message:**
- `Failed to update session`

**Location:** `app/profile/security/SecurityPageClient.tsx:174`

### 8.3 Sign Out Errors
**Static Message:**
- `Failed to sign out`

**Location:** `app/profile/security/SecurityPageClient.tsx:189`

### 8.4 Account Delete Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to delete account'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to delete account` (fallback)

**Location:** `app/profile/security/SecurityPageClient.tsx:218`

---

## 9. Notifications Management

### 9.1 Notification Delete Errors
**Static Message:**
- `Failed to delete notification`

**Location:** `app/profile/notifications/NotificationsPageClient.tsx:116`

---

## 10. Favorites

### 10.1 Remove from Favorites Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to remove from favorites'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to remove from favorites` (fallback)

**Location:** `app/profile/favorites/FavoritesPageClient.tsx:75`

---

## 11. Bin Management

### 11.1 Item Restore Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to restore item'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to restore item` (fallback)

**Location:** `app/profile/bin/BinPageClient.tsx:102`

### 11.2 Item Delete Errors
**Base Pattern:** `error instanceof Error ? error.message : 'Failed to delete item'`

**Variations:**
- `[error.message]` (when error is Error instance)
- `Failed to delete item` (fallback)

**Location:** `app/profile/bin/BinPageClient.tsx:137`

---

## 12. Image Upload & Compression

### 12.1 Maximum Images Errors
**Base Pattern:** `Maximum ${maxImages} images allowed`

**Variations:**
- `Maximum [number] images allowed`
  - Example: `Maximum 10 images allowed`
  - Example: `Maximum 5 images allowed`

**Location:** `app/components/ImageUploadWithCompression.tsx:69`

### 12.2 Invalid File Errors
**Base Pattern:** `${file.name}: ${error}`

**Variations:**
- `[filename]: [error message]`
  - Example: `photo.jpg: File size exceeds limit`
  - Example: `image.png: Invalid file type`

**Location:** `app/components/ImageUploadWithCompression.tsx:85`

### 12.3 Compression Errors
**Static Message:**
- `Failed to compress images. Try again later.`

**Location:** `app/components/ImageUploadWithCompression.tsx:126`

---

## 13. General Error Handling (lib/errorHandling.ts)

### 13.1 API Error Handling
**Base Pattern:** `error.message` (from APIError instances)

**Variations:**
- Any error message from APIError instances
- Typically includes server-provided error messages

**Location:** `lib/errorHandling.ts:42`

### 13.2 Generic Error Handling
**Base Pattern:** `error.message` (from Error instances)

**Variations:**
- Any error message from Error instances

**Location:** `lib/errorHandling.ts:47`

### 13.3 Fallback Error Handling
**Base Pattern:** `fallbackMessage` (default: 'An unexpected error occurred')

**Variations:**
- `An unexpected error occurred` (default)
- Any custom fallback message passed to handleError()

**Location:** `lib/errorHandling.ts:51`

---

## Summary Statistics

### Total Unique Error Message Patterns: ~80

### Dynamic Content Patterns:
1. **Error Message Extraction:** `error instanceof Error ? error.message : 'fallback'` (~25 instances)
2. **Result Error Extraction:** `result.error || 'fallback'` (~15 instances)
3. **File Name Inclusion:** `${file.name}` (~5 instances)
4. **Action-Based Messages:** `Failed to ${action}` (~3 instances)
5. **Count-Based Messages:** `${errorCount} errors found` (~1 instance)
6. **Feature Name Inclusion:** `${featureNames}` (~1 instance)
7. **Generic Error Variables:** `errorMessage`, `fallbackMessage` (~3 instances)

### Most Common Fallback Messages:
1. `Try again later.` / `Please try again.` (~15 instances)
2. `Failed to [action]` (~20 instances)
3. `Error: [message]` (~5 instances)

### Error Message Categories:
- **Static Messages:** ~30 (no dynamic content)
- **Single Dynamic Element:** ~35 (one variable)
- **Multiple Dynamic Elements:** ~15 (two or more variables)

