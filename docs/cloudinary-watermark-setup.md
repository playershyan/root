# Cloudinary Watermark Implementation

## Overview

Every image uploaded to VERA.lk now automatically includes a watermark to protect against unauthorized use and provide brand attribution. The watermark system is built into the Cloudinary service layer and applies to all image display URLs.

## Features

### Automatic Watermarking
- **Text Watermark**: "VERA.lk" brand name
- **Position**: Bottom-right corner (south_east gravity)
- **Styling**: Arial font, 60px size, bold weight, white color, 60% opacity
- **Offset**: 30px from right edge, 30px from bottom edge

### Smart Application
- Watermarks are applied at **display time**, not upload time
- Original images remain unaltered in storage
- Watermarks scale appropriately with image size
- Can be disabled per image or globally via environment variable

### Environment Control
```bash
CLOUDINARY_WATERMARK_ENABLED=true  # Enable/disable watermarks globally
```

## Implementation Details

### CloudinaryService Updates

#### New Methods
- `isWatermarkEnabled()`: Check global watermark setting
- `extractPublicIdFromUrl()`: Extract public ID from Cloudinary URLs
- `getWatermarkTransformation()`: Get watermark transformation config
- `addWatermarkToTransformation()`: Add watermark to transformation chain

#### Updated Methods
All URL generation methods now support watermark parameter:
- `getOptimizedUrl(publicId, { watermark: boolean })`
- `getThumbnailUrl(publicId, size, watermark)`
- `getMobileUrl(publicId, watermark)`
- `getGalleryUrl(publicId, watermark)`

### Component Integration

#### OptimizedImage Component
- New `watermark` prop (defaults to `true`)
- Automatic public ID extraction from Cloudinary URLs
- Intelligent watermark application based on image source

#### Listing Components
- All listing image displays automatically include watermarks
- Preserves existing image optimization and responsive sizing

## Usage Examples

### Basic Usage (Automatic)
```tsx
// Watermark applied by default
<OptimizedImage src={cloudinaryUrl} alt="Vehicle" />
```

### Disable Watermark
```tsx
// Disable watermark for specific image
<OptimizedImage src={cloudinaryUrl} alt="Vehicle" watermark={false} />
```

### Manual URL Generation
```typescript
// With watermark (default)
const watermarkedUrl = CloudinaryService.getThumbnailUrl(publicId, 400);

// Without watermark
const cleanUrl = CloudinaryService.getThumbnailUrl(publicId, 400, false);
```

## Watermark Configuration

### Current Settings
- **Text**: "VERA.lk"
- **Font**: Arial, 60px, bold
- **Color**: White (#ffffff)
- **Opacity**: 60%
- **Position**: Bottom-right corner
- **Offset**: 30px from edges

### Customization
To modify watermark appearance, update `getWatermarkTransformation()` in `lib/cloudinary.ts`:

```typescript
static getWatermarkTransformation(): any {
  return {
    overlay: {
      font_family: "Arial",
      font_size: 60,           // Font size
      font_weight: "bold",     // Font weight
      text: "VERA.lk"         // Watermark text
    },
    gravity: "south_east",     // Position
    x: 30,                     // Right offset
    y: 30,                     // Bottom offset
    opacity: 60,               // Transparency (0-100)
    color: "white"             // Text color
  }
}
```

## URL Structure

### Watermarked URL Example
```
https://res.cloudinary.com/dpvcd0zdw/image/upload/
w_800,h_600,c_limit,q_auto:good,f_auto,
l_text:Arial_60_bold:VERA.lk,g_south_east,x_30,y_30,o_60,co_white/
vera-lk/listings/sample-image.jpg
```

### URL Parameters
- `w_800,h_600`: Dimensions
- `c_limit`: Crop mode
- `q_auto:good`: Quality
- `f_auto`: Format optimization
- `l_text:Arial_60_bold:VERA.lk`: Text overlay
- `g_south_east`: Gravity (position)
- `x_30,y_30`: Offset coordinates
- `o_60`: Opacity
- `co_white`: Color

## Performance Impact

### Minimal Overhead
- Watermarks are applied via URL parameters (no server processing)
- Cloudinary handles watermark rendering at edge locations
- Images are cached with watermarks applied
- No impact on upload speed or storage requirements

### Benefits
- **Brand Protection**: Clear attribution on all displayed images
- **Theft Deterrence**: Makes unauthorized use more difficult
- **Professional Appearance**: Consistent branding across all listings
- **Flexible Control**: Can be disabled when needed

## Testing

### Manual Testing
1. Upload an image through the platform
2. View the image in any listing or profile
3. Verify "VERA.lk" watermark appears in bottom-right corner
4. Test different image sizes to ensure proper scaling

### URL Testing
Use browser developer tools to inspect image URLs and verify watermark parameters are present.

## Troubleshooting

### Watermarks Not Appearing
1. Check `CLOUDINARY_WATERMARK_ENABLED=true` in environment
2. Verify Cloudinary configuration is correct
3. Ensure images are served from Cloudinary (not Supabase storage)

### Watermark Positioning Issues
- Adjust `x`, `y` offset values in `getWatermarkTransformation()`
- Change `gravity` setting for different positioning

### Performance Issues
- Watermarked images are cached by Cloudinary CDN
- First load may be slightly slower, subsequent loads are cached
- Monitor Cloudinary bandwidth usage for cost optimization