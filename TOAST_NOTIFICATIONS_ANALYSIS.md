# Toast Notifications Analysis

This document provides a comprehensive list of all user-facing toast notifications in the codebase, organized by category and including all variations.

## Toast Notification Systems

The codebase uses three notification systems (though only two are actively used):
1. **Sonner Library** (`toast` from 'sonner') - Most commonly used throughout the application
2. **Custom useToast Hook** (`useToast` from '@/app/components/notifications/useToast') - Used in some pages (post/page.tsx, wanted/post/page.tsx, etc.)
3. **NotificationSystem Component** (`NotificationProvider` from '@/app/components/NotificationSystem') - Defined but not actively used in the codebase

---

## 1. Authentication & Registration

### Success Messages
- `'Profile created successfully. Please log in.'` (AuthModal.tsx)
- `'Profile updated successfully!'` (AccountPageClient.tsx)

### Error Messages
- `'Failed to update profile: ${error.message || 'Try again later.'}'` (AccountPageClient.tsx)

---

## 2. Account & Profile Management

### Success Messages
- `'Profile updated successfully!'` (AccountPageClient.tsx)
- `'Phone number verified and updated!'` (AccountPageClient.tsx, post/page.tsx, wanted/post/page.tsx)
- `'WhatsApp number verified and updated!'` (AccountPageClient.tsx, post/page.tsx, wanted/post/page.tsx)

### Error Messages
- `'Failed to update profile: ${error.message || 'Try again later.'}'` (AccountPageClient.tsx)

---

## 3. Business Profile Management

### Success Messages
- `'Business profile created successfully!'` (AccountPageClient.tsx, BusinessPageClient.tsx)
- `'Business profile updated successfully'` (BusinessPageClient.tsx)
- `'Business profile paused successfully!'` (AccountPageClient.tsx)
- `'Business profile paused successfully'` (BusinessPageClient.tsx)
- `'Business profile resumed successfully!'` (AccountPageClient.tsx)
- `'Business profile resumed successfully'` (BusinessPageClient.tsx)
- `'Business profile deleted successfully!'` (AccountPageClient.tsx)
- `'Business profile deleted successfully'` (BusinessPageClient.tsx)

### Error Messages
- `'Error: ${result.error || 'Failed to create business profile'}'` (AccountPageClient.tsx)
- `'Failed to create business profile'` (BusinessPageClient.tsx)
- `'Error: ${result.error || 'Failed to pause business profile'}'` (AccountPageClient.tsx)
- `'Failed to pause business profile'` (BusinessPageClient.tsx)
- `'Error: ${result.error || 'Failed to resume business profile'}'` (AccountPageClient.tsx)
- `'Failed to resume business profile'` (BusinessPageClient.tsx)
- `'Error: ${result.error || 'Failed to delete business profile'}'` (AccountPageClient.tsx)
- `'Failed to delete business profile'` (BusinessPageClient.tsx)

---

## 4. Listings Management

### Success Messages
- `'Listing paused successfully'` (ListingsPageClient.tsx)
- `'Listing resumed successfully'` (ListingsPageClient.tsx)
- `'Listing marked as sold'` (ListingsPageClient.tsx)
- `'Listing moved to bin'` (ListingsPageClient.tsx)
- `'Listing updated successfully!'` (post/page.tsx - useToast)
- `'Listing created successfully! Redirecting...'` (post/page.tsx - useToast)

### Error Messages
- `'Payment failed. Please try again.'` (ListingsPageClient.tsx)
- `'Failed to pause listing'` (ListingsPageClient.tsx)
- `'Failed to resume listing'` (ListingsPageClient.tsx)
- `'Failed to mark as sold'` (ListingsPageClient.tsx)
- `'Failed to move listing to bin'` (ListingsPageClient.tsx)
- `'Listing not found or you do not have permission to edit it'` (post/page.tsx - useToast)
- `'Failed to load listing data'` (post/page.tsx - useToast)

### Warning Messages
- `'Fill in make, model, and year first'` (post/page.tsx - useToast)
- `'Sign in required to post a listing.'` (post/page.tsx - useToast)
- `'Wait for all image uploads to finish or retry failed uploads before submitting.'` (post/page.tsx - useToast)

### Info Messages
- `'Description generated successfully!'` (post/page.tsx - useToast)

---

## 5. Listing Creation & Editing

### Success Messages
- `'Listing created successfully! Redirecting...'` (post/page.tsx - useToast)
- `'Listing updated successfully!'` (post/page.tsx - useToast)

### Error Messages
- `'At least one image required'` (post/page.tsx - useToast)
- `'Maximum 10 images allowed'` (post/page.tsx - useToast - appears twice)
- `'Image exceeds 10MB'` (post/page.tsx - useToast)
- `'Image exceeds 10MB: ${file.name}'` (post/page.tsx - useToast)
- `'Invalid file type: ${file.name}. Allowed: JPEG, JPG, PNG, TIFF, WebP'` (post/page.tsx - useToast)
- `'Failed to upload ${file.name}: ${errorMessage}'` (post/page.tsx - useToast)
- `'Failed to upload ${file.name}: ${error?.message || 'Unknown error'}'` (post/page.tsx - useToast)
- `'Could not build the description. Try again later.'` (post/page.tsx - useToast)
- `'Validation failed: ${firstError}'` (post/page.tsx - useToast)
- `'Validation failed: ${errorCount} errors found. ${firstError}'` (post/page.tsx - useToast)
- `'You have already posted a similar listing recently.'` (post/page.tsx - useToast)
- `'Server error: ${result.details}'` (post/page.tsx - useToast)
- `'Failed to create listing'` (post/page.tsx - useToast)
- `'Error posting request. Please try again.'` (post/page.tsx - useToast - dynamic error message)

---

## 6. Wanted Requests

### Success Messages
- `'Wanted request updated successfully!'` (wanted/post/page.tsx - useToast)
- `'Wanted request created successfully! Redirecting...'` (wanted/post/page.tsx - useToast)
- `'Wanted request ${action === 'pause' ? 'paused' : 'resumed'} successfully'` (WantedPageClient.tsx - dynamic)
- `'Wanted request closed successfully'` (WantedPageClient.tsx)
- `'Wanted request closed successfully'` (wanted/post/page.tsx - useToast)
- `'Wanted request moved to bin'` (WantedPageClient.tsx)

### Error Messages
- `'Error loading wanted request. Try again later.'` (wanted/post/page.tsx - sonner)
- `'Error loading wanted request. Please try again.'` (wanted/post/page.tsx - useToast)
- `'High priority payments are coming soon. Your request is live as a regular post.'` (wanted/post/page.tsx - useToast)
- `'Validation failed. Please check your input.'` (wanted/post/page.tsx - useToast)
- `'Failed to update wanted request'` (wanted/post/page.tsx - useToast)
- `'You have already posted a similar request recently.'` (wanted/post/page.tsx - useToast)
- `'Too many requests. Please try again later.'` (wanted/post/page.tsx - useToast)
- `'Failed to ${action} wanted request'` (WantedPageClient.tsx - dynamic)
- `'Failed to close wanted request'` (WantedPageClient.tsx)
- `'Failed to move wanted request to bin'` (WantedPageClient.tsx)

---

## 7. Paid Features & Promotions

### Success Messages
- `'Payment completed successfully!'` (post/paid-features/page.tsx)
- `'Promotions activated! ${featureNames}'` (PaymentModal.tsx - dynamic)
- `'Payment processed successfully (Sandbox)'` (payment-sandbox/page.tsx)

### Error Messages
- `'This listing already has active paid features'` (post/paid-features/page.tsx, PaymentModal.tsx)
- `'No listing ID provided'` (post/paid-features/page.tsx)
- `'No wanted request ID provided'` (wanted/paid-features/page.tsx)
- `'Please select at least one promotion feature'` (post/paid-features/page.tsx, wanted/paid-features/page.tsx, payment-sandbox/page.tsx)
- `'Cannot add promotions to a listing with active features'` (post/paid-features/page.tsx, PaymentModal.tsx - appears twice)
- `'Payment failed (Sandbox)'` (PaymentModal.tsx, payment-sandbox/page.tsx)
- `'Error processing sandbox payment'` (PaymentModal.tsx)
- `'Error processing payment test'` (payment-sandbox/page.tsx)
- `'Please enter a listing ID'` (payment-sandbox/page.tsx)

---

## 8. Messaging & Conversations

### Success Messages
- `'Offer sent successfully'` (ConversationThreadClient.tsx)
- `'Offer sent successfully! The seller will be notified.'` (ListingDetailClient.tsx - useToast)
- `'Offer ${action === 'accepted' ? 'accepted' : 'declined'}'` (ConversationThreadClient.tsx - dynamic)
- `'Marked as read'` (MessagesPageClient.tsx)
- `'Conversation deleted'` (MessagesPageClient.tsx)

### Error Messages
- `'Failed to send message. Please try again.'` (ConversationThreadClient.tsx)
- `'Failed to send message. Try again later.'` (ConversationModal.tsx, EnhancedConversationModal.tsx)
- `'Failed to send offer'` (ConversationThreadClient.tsx)
- `'Failed to update offer'` (ConversationThreadClient.tsx)
- `'Failed to load messages'` (ConversationThreadClient.tsx)
- `'Failed to mark as read'` (MessagesPageClient.tsx)
- `'Failed to delete conversation'` (MessagesPageClient.tsx)
- `'Unable to send message. Listing information is missing.'` (ContactProfile.tsx)
- `'You cannot send messages to your own listing.'` (ContactProfile.tsx)
- `'Failed to start conversation. Try again later.'` (ContactProfile.tsx)
- `'You cannot make an offer on your own listing'` (ListingDetailClient.tsx - useToast)
- `'An unexpected error occurred. Please try again.'` (ListingDetailClient.tsx - useToast)

---

## 9. Security & Account Settings

### Success Messages
- `'Password updated successfully'` (SecurityPageClient.tsx)
- `'Signed out from all other devices'` (SecurityPageClient.tsx)
- `'Signed out successfully'` (SecurityPageClient.tsx)
- `'Account deleted successfully'` (SecurityPageClient.tsx)

### Error Messages
- `'Failed to update password'` (SecurityPageClient.tsx)
- `'Failed to update session'` (SecurityPageClient.tsx)
- `'Failed to sign out'` (SecurityPageClient.tsx)
- `'Failed to delete account'` (SecurityPageClient.tsx)

### Info Messages
- `'Email update functionality coming soon'` (SecurityPageClient.tsx)
- `'Two-factor authentication coming soon'` (SecurityPageClient.tsx)

---

## 10. Notifications Management

### Success Messages
- `'All notifications marked as read'` (NotificationsPageClient.tsx)
- `'Notification deleted'` (NotificationsPageClient.tsx)
- `'Notification preferences updated successfully!'` (NotificationsTab.tsx - inline message, not toast)

### Error Messages
- `'Failed to mark as read'` (NotificationsPageClient.tsx)
- `'Failed to mark all as read'` (NotificationsPageClient.tsx)
- `'Failed to delete notification'` (NotificationsPageClient.tsx)
- `'Failed to update notification preferences'` (NotificationsTab.tsx - inline message, not toast)

---

## 11. Favorites

### Success Messages
- `'Added to favorites'` (FavoriteButton.tsx - useToast)
- `'Removed from favorites'` (FavoriteButton.tsx - useToast, FavoritesPageClient.tsx)
- `'Link copied to clipboard!'` (FavoritesPageClient.tsx - appears twice, ListingsPageClient.tsx, WantedPageClient.tsx)

### Error Messages
- `'Failed to remove from favorites'` (FavoritesPageClient.tsx)

---

## 12. Bin Management

### Success Messages
- `'Item restored successfully'` (BinPageClient.tsx - with fallback: `data.message || 'Item restored successfully'`)
- `'Item permanently deleted'` (BinPageClient.tsx)

### Error Messages
- `'Failed to restore item'` (BinPageClient.tsx)
- `'Failed to delete item'` (BinPageClient.tsx)

### Info Messages
- `'${data.next_steps}'` (BinPageClient.tsx - dynamic, duration: 5000ms)

---

## 13. Image Upload & Compression

### Error Messages
- `'Maximum ${maxImages} images allowed'` (ImageUploadWithCompression.tsx - dynamic)
- `'${file.name}: ${error}'` (ImageUploadWithCompression.tsx - dynamic)
- `'Failed to compress images. Try again later.'` (ImageUploadWithCompression.tsx)
- `'Image exceeds 10MB'` (BusinessPageTab.tsx - useToast)

---

## 14. General Error Handling

### Error Messages (from lib/errorHandling.ts)
- `'${error.message}'` (APIError instances)
- `'${error.message}'` (Error instances)
- `'An unexpected error occurred'` (fallback message)

---

## 15. Listing Details & Offers

### Success Messages
- `'Offer sent successfully! The seller will be notified.'` (ListingDetailClient.tsx - useToast)

### Error Messages
- `'You cannot make an offer on your own listing'` (ListingDetailClient.tsx - useToast)
- `'An unexpected error occurred. Please try again.'` (ListingDetailClient.tsx - useToast)
- Dynamic error messages from API responses (ListingDetailClient.tsx - useToast)

---

## Summary Statistics

### By Type:
- **Success Messages**: ~50 unique messages
- **Error Messages**: ~80 unique messages (many with dynamic content)
- **Warning Messages**: ~5 unique messages
- **Info Messages**: ~5 unique messages

### By System:
- **Sonner Library**: ~100+ usages
- **Custom useToast Hook**: ~50+ usages

### Common Patterns:
1. **Dynamic Messages**: Many error messages include dynamic content like `${error.message}`, `${file.name}`, `${action}`, etc.
2. **Fallback Messages**: Many error handlers include fallback messages like `'Try again later.'`, `'Failed to...'`, etc.
3. **Action-Specific Messages**: Messages often vary based on the action (pause/resume, accept/decline, etc.)
4. **Duration Variations**: Custom useToast allows duration specification (2000ms, 3000ms, 4000ms, 5000ms, 6000ms, 7000ms)

---

## Notes

1. **Two Toast Systems**: The codebase uses both Sonner and a custom useToast hook, which may cause inconsistency in user experience.

2. **Dynamic Content**: Many messages include dynamic content that changes based on context, making exact message matching difficult.

3. **Error Message Variations**: Error messages often have multiple variations:
   - Generic: `'Failed to...'`
   - With error details: `'Failed to...: ${error.message}'`
   - With custom messages: `'Error: ${result.error || 'Failed to...'}'`

4. **Duration Settings**: Custom useToast allows custom durations, while Sonner uses default durations (typically 3-5 seconds).

5. **Localization**: All messages are currently in English only.

