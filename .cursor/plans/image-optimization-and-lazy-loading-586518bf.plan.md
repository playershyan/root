<!-- 586518bf-60e2-49c2-91f9-66703bfda0ab b912c015-2459-467b-b019-4de547110fd2 -->
# Image Optimization and Lazy Loading Implementation Plan

## Problem Analysis

1. **Large image files (3.6MB vs competitor 36KB)**: Images uploaded without compression/resizing
2. **Slow form submission**: Images uploaded synchronously during submit, blocking the UI
3. **Slow listing loading**: Large original images served instead of optimized versions
4. **Missing lazy loading**: Some images load eagerly even when not in viewport

## Current State

- **Upload endpoint**: `app/api/upload/cloudinary/route.ts` - accepts raw images up to 10MB
- **Upload flow**: `app/post/page.tsx` lines 671-704 - uploads images during form submission
- **Image display**: `components/ui/OptimizedImage.tsx` - uses Cloudinary transformations but original uploads are large
- **Display components**: 
- `app/components/listings/ListingCard.tsx` - uses OptimizedImage (good)
- `app/lk/cars/[make]/[model]/page.tsx` - uses regular img tags (needs fixing)

## Solution Components

### 1. Client-Side Image Compression (Before Upload)

**File**: `lib/utils/image-compression.ts` (new)

- Compress images using Canvas API before upload
- Target: ~100-200KB per image (similar to competitors)
- Max dimensions: 1920x1440 (from `lib/config/images.ts`)
- Quality: 0.85 (85% JPEG quality or WebP equivalent)
- Format conversion: Convert to WebP when possible (better compression)

**Implementation**:

- Create `compressImage()` function that:
- Resizes if dimensions exceed 1920x1440
- Compresses to target file size (~150KB average)
- Maintains aspect ratio
- Preserves EXIF orientation
- Integrate into upload flow before sending to API

### 2. Async Image Upload (Background Processing)

**File**: `app/post/page.tsx`

- **Change**: Upload images in background as user fills form, not during submit
- **Implementation**:
- Add `uploadImagesInBackground()` function
- Trigger upload when images are selected (line ~392-425 area)
- Store upload status and URLs in state
- On submit, use already-uploaded URLs (skip upload step)
- Show upload progress indicator

**Benefits**:

- Form submission becomes instant (images already uploaded)
- Better UX with progress feedback
- Can handle upload failures before submit

### 3. Enhanced Cloudinary Upload Settings

**File**: `app/api/upload/cloudinary/route.ts`

- **Line 131**: Change `quality: 'auto:good'` to `quality: 'auto:eco'` for uploads
- Add explicit format conversion: `fetch_format: 'auto'` 
- Add transformation during upload:
- `max_width: 1920`
- `max_height: 1440`
- `c_limit` (maintain aspect, don't crop)

**Note**: Even with client compression, server-side transformation ensures consistent sizes

### 4. Optimized Cloudinary URLs for All Images

**Files to update**:

- `app/lk/cars/[make]/[model]/page.tsx` (line 183-187): Replace `<img>` with OptimizedImage or add Cloudinary transformations
- `app/components/listings/RegularAdCard.tsx`: Verify uses optimized URLs
- Any other components using raw image URLs

**Ensure all image URLs use**:

- `getThumbnailUrl()` for thumbnails (400px width)
- `getMobileUrl()` for mobile views (800px width)
- `getGalleryUrl()` for full-size (1920px width)
- Quality preset: 'thumbnail' or 'listing' based on context

### 5. Lazy Loading Implementation

**Files to update**:

- `components/ui/OptimizedImage.tsx`: Already has `loading={priority ? 'eager' : 'lazy'}` (line 158), verify it's working
- `app/lk/cars/[make]/[model]/page.tsx`: Add `loading="lazy"` to img tags or convert to OptimizedImage
- `app/components/listings/ListingCard.tsx`: Verify `priority={false}` (line 79) ensures lazy loading
- `components/ui/ImageCarousel.tsx`: Check for lazy loading on thumbnails

**Add intersection observer** for better lazy loading control:

- Create `hooks/useLazyImage.ts` hook
- Only load images when they're about to enter viewport

### 6. Image Upload Progress UI

**File**: `app/post/page.tsx`

- Add upload progress state: `[uploadProgress, setUploadProgress]`
- Show progress bar during background uploads
- Display per-image upload status
- Show errors immediately (not just on submit)

## Implementation Steps

1. **Create image compression utility** (`lib/utils/image-compression.ts`)

- Implement resize and compress functions
- Handle different image formats
- Maintain aspect ratio and orientation

2. **Update upload function** (`app/post/page.tsx` lines 671-704)

- Add compression before upload
- Convert to async background upload
- Add progress tracking
- Store URLs in state

3. **Update form submission** (`app/post/page.tsx` line 706+)

- Remove synchronous image upload from handleSubmit
- Use pre-uploaded URLs from state
- Show error if images haven't uploaded yet

4. **Enhance Cloudinary upload API** (`app/api/upload/cloudinary/route.ts`)

- Adjust quality and add transformations
- Ensure format conversion

5. **Fix unoptimized image displays**

- Update `app/lk/cars/[make]/[model]/page.tsx` to use OptimizedImage
- Audit other components for raw image URLs
- Ensure all use Cloudinary transformation URLs

6. **Verify lazy loading**

- Test OptimizedImage lazy loading behavior
- Add lazy loading to any remaining img tags
- Test viewport-based loading

7. **Add progress UI**

- Create upload progress component
- Integrate into listing creation form
- Show real-time upload status

## Expected Outcomes

- **Image file sizes**: Reduced from 3.6MB to ~100-200KB (18-36x smaller)
- **Form submission speed**: Instant (images pre-uploaded)
- **Listing page load**: Faster (optimized thumbnail URLs)
- **User experience**: Better with progress feedback and instant submissions