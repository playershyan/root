# Alert() Usage in Toast/Error Notifications

This document identifies all instances where `alert()` is used in contexts where toast notifications or error notifications should be used instead.

The codebase uses `sonner` toast library (`import { toast } from 'sonner'`) for notifications, as seen in `lib/errorHandling.ts`.

## Files with Alert() in Error Notification Contexts

### 1. **app/components/modals/ConversationModal.tsx**
- **Line 272**: `alert('Failed to send message. Please try again.')` - Error notification in catch block

### 2. **app/components/ContactProfile.tsx**
- **Line 226**: `alert('Unable to send message. Listing information is missing.')` - Error notification
- **Line 252**: `alert('You cannot send messages to your own listing.')` - Error notification
- **Line 266**: `alert('Failed to start conversation. Please try again.')` - Error notification in catch block

### 3. **app/components/messaging/EnhancedConversationModal.tsx**
- **Line 301**: `alert('Failed to send message. Please try again.')` - Error notification in catch block

### 4. **app/components/ImageUploadWithCompression.tsx**
- **Line 68**: `alert(\`Maximum ${maxImages} images allowed\`)` - Validation error notification
- **Line 84**: `alert(\`${file.name}: ${error}\`)` - File validation error notification
- **Line 125**: `alert('Failed to compress images. Please try again.')` - Error notification in catch block

### 5. **app/profile/account/page.tsx**
- **Line 116**: `alert('Profile updated successfully!')` - Success notification
- **Line 122**: `alert(\`Failed to update profile: ${error instanceof Error ? error.message : 'Please try again.'}\`)` - Error notification
- **Line 133**: `alert('Business profile created successfully!')` - Success notification
- **Line 135**: `alert(\`Error: ${result.error || 'Failed to create business profile'}\`)` - Error notification
- **Line 143**: `alert('Business profile paused successfully!')` - Success notification
- **Line 145**: `alert(\`Error: ${result.error || 'Failed to pause business profile'}\`)` - Error notification
- **Line 152**: `alert('Business profile resumed successfully!')` - Success notification
- **Line 154**: `alert(\`Error: ${result.error || 'Failed to resume business profile'}\`)` - Error notification
- **Line 165**: `alert('Business profile deleted successfully!')` - Success notification
- **Line 167**: `alert(\`Error: ${result.error || 'Failed to delete business profile'}\`)` - Error notification

### 6. **app/profile/wanted/page.tsx**
- **Line 129**: `alert(data.message || \`Wanted request ${action}d successfully\`)` - Success notification
- **Line 132**: `alert(error.message || \`Failed to ${action} wanted request\`)` - Error notification
- **Line 166**: `alert(data.message || 'Wanted request closed successfully')` - Success notification
- **Line 169**: `alert(error.message || 'Failed to close wanted request')` - Error notification
- **Line 199**: `alert(data.message || 'Wanted request renewed successfully')` - Success notification
- **Line 202**: `alert(error.message || 'Failed to renew wanted request')` - Error notification
- **Line 228**: `alert('Wanted request moved to bin')` - Success notification
- **Line 231**: `alert('Failed to move wanted request to bin')` - Error notification
- **Line 244**: `alert('Link copied to clipboard!')` - Success notification (could use toast.success)

### 7. **app/profile/bin/page.tsx**
- **Line 39**: `alert('Failed to load bin items')` - Error notification in catch block
- **Line 76**: `alert(\`${data.message}\n\n${data.next_steps}\`)` - Success notification
- **Line 82**: `alert(error instanceof Error ? error.message : 'Failed to restore item')` - Error notification

### 8. **app/admin/wanted-requests/page.tsx**
- **Line 116**: `alert('Wanted request approved successfully!')` - Success notification
- **Line 119**: `alert(\`Failed to approve: ${data.error}\`)` - Error notification
- **Line 123**: `alert('Failed to approve wanted request')` - Error notification
- **Line 140**: `alert('Wanted request rejected successfully!')` - Success notification
- **Line 143**: `alert(\`Failed to reject: ${data.error}\`)` - Error notification
- **Line 147**: `alert('Failed to reject wanted request')` - Error notification
- **Line 167**: `alert(\`Wanted request ${action}d successfully!\`)` - Success notification
- **Line 170**: `alert(\`Failed to ${action}: ${data.error}\`)` - Error notification
- **Line 174**: `alert(\`Failed to ${action} wanted request\`)` - Error notification

### 9. **app/admin-old/page.tsx**
- **Line 260**: `alert('Listing approved successfully')` - Success notification
- **Line 263**: `alert(data.error || 'Failed to approve listing')` - Error notification
- **Line 267**: `alert('Network error')` - Error notification
- **Line 285**: `alert('Listing rejected successfully')` - Success notification
- **Line 288**: `alert(data.error || 'Failed to reject listing')` - Error notification
- **Line 292**: `alert('Network error')` - Error notification
- **Line 305**: `alert('Business profile verified successfully!')` - Success notification
- **Line 310**: `alert(data.error || 'Failed to verify business profile')` - Error notification
- **Line 314**: `alert('Network error')` - Error notification
- **Line 330**: `alert('Business profile rejected successfully!')` - Success notification
- **Line 335**: `alert(data.error || 'Failed to reject business profile')` - Error notification
- **Line 339**: `alert('Network error')` - Error notification

### 10. **app/wanted/post/page.tsx**
- **Line 165**: `alert('Error loading wanted request. Please try again.')` - Error notification

### 11. **app/profile/business/page.tsx**
- **Line 46**: `alert('Business profile updated successfully')` - Success notification

### 12. **app/profile/favorites/page.tsx**
- **Line 25**: `alert(result.error || 'Failed to remove from favorites')` - Error notification
- **Line 38**: `alert(result.error || 'Failed to remove from favorites')` - Error notification
- **Line 53**: `alert('Link copied to clipboard!')` - Success notification
- **Line 67**: `alert('Link copied to clipboard!')` - Success notification

### 13. **app/profile/listings/page.tsx**
- **Line 52**: `alert(result.error || 'Failed to mark listing as sold')` - Error notification
- **Line 61**: `alert(result.error || 'Failed to pause listing')` - Error notification
- **Line 70**: `alert(result.error || 'Failed to resume listing')` - Error notification
- **Line 81**: `alert(result.error || 'Failed to delete listing')` - Error notification
- **Line 88**: `alert('Link copied to clipboard!')` - Success notification
- **Line 90**: `alert('Failed to copy link')` - Error notification

### 14. **app/components/admin/CleanupMonitoringWidget.tsx**
- **Line 128**: `alert(\`${cleanupType} cleanup completed successfully!\n\nItems cleaned: ${resultData?.items_cleaned || 0}\nStorage freed: ${resultData?.storage_freed_mb || 0} MB\`)` - Success notification
- **Line 130**: `alert(\`${cleanupType} cleanup completed successfully!\n\nRecords deleted: ${resultData?.total_deleted || 0}\nBin items cleaned: ${resultData?.bin_items_cleaned || 0}\nStorage freed: ${resultData?.storage_freed_mb || 0} MB\`)` - Success notification
- **Line 140**: `alert(\`Failed to trigger ${type} cleanup: \` + (err instanceof Error ? err.message : 'Unknown error'))` - Error notification

### 15. **app/components/admin/AlertsWidget.tsx**
- **Line 92**: `alert('Failed to trigger alert check: ' + (err instanceof Error ? err.message : 'Unknown error'))` - Error notification

### 16. **app/post/paid-features/page.tsx**
- **Line 104**: `alert('No listing ID provided')` - Error notification

## Additional Files (Backup/Client Files)

### 17. **app/wanted/page.client-backup.tsx**
- **Line 419**: `alert('Link copied to clipboard!')` - Success notification
- **Line 430**: `alert('Report functionality coming soon!')` - Info notification

### 18. **app/listings/[id]/ListingDetailClient.tsx**
- **Line 227**: `alert('Link copied to clipboard!')` - Success notification

### 19. **app/wanted/[id]/page.tsx**
- **Line 169**: `alert('Link copied to clipboard!')` - Success notification

### 20. **app/components/ContactProfileOriginal.tsx**
- **Line 157**: `alert('Unable to send message. Listing information is missing.')` - Error notification
- **Line 183**: `alert('You cannot send messages to your own listing.')` - Error notification
- **Line 197**: `alert('Failed to start conversation. Please try again.')` - Error notification

### 21. **app/components/modals/ConversationModal.tsx.backup**
- **Line 207**: `alert('Failed to send message. Please try again.')` - Error notification

## Summary

**Total files with alert() in notification contexts: 21 files**
**Total alert() calls: ~80+ instances**

### Categories:
- **Error notifications**: ~50+ instances
- **Success notifications**: ~25+ instances  
- **Info/validation notifications**: ~5+ instances

### Recommended Action:
Replace all `alert()` calls with `toast.error()`, `toast.success()`, `toast.info()`, or `toast.warning()` from `sonner` library, following the pattern established in `lib/errorHandling.ts`.

### Example Replacement:
```typescript
// Before
alert('Failed to send message. Please try again.')

// After
import { toast } from 'sonner'
toast.error('Failed to send message. Please try again.')
```

