# Featured Listings Component

## Overview

The `FeaturedListings` component provides a sophisticated system for displaying featured vehicle listings on the homepage with fair exposure rotation. This ensures that all featured listings get equal visibility over time, preventing any single listing from monopolizing the featured spots.

## Features

### 🔄 Fair Exposure Rotation
- **Time-based rotation**: Listings rotate automatically every 5 minutes (configurable)
- **Smart scoring**: Combines boost scores, listing age, and exposure history
- **Equal opportunity**: Newer listings get periodic boosts to compete with established ones
- **Anti-monopolization**: Recently shown listings receive lower priority temporarily

### 🎯 Intelligent Display Logic
- **Configurable display count**: Show 3-12 listings simultaneously (default: 6)
- **Responsive design**: Adapts to different screen sizes
- **Loading states**: Smooth loading animations while fetching data
- **Error handling**: Graceful degradation when data is unavailable

### 📊 Analytics & Tracking
- **Exposure tracking**: Records when and how often listings are displayed
- **Performance metrics**: Tracks views, age, and engagement
- **Local storage**: Maintains rotation history for consistent behavior
- **Statistics API**: Provides exposure analytics for each listing

## Usage

### Basic Implementation
```tsx
import FeaturedListings from '@/app/components/homepage/FeaturedListings'

// Simple usage with defaults
<FeaturedListings />

// With custom configuration
<FeaturedListings 
  displayCount={8} 
  rotationInterval={3 * 60 * 1000} // 3 minutes
/>
```

### Configuration Options

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `displayCount` | number | 6 | Number of listings to display simultaneously |
| `rotationInterval` | number | 300000 | Rotation interval in milliseconds (5 minutes) |

## Fair Exposure Algorithm

The rotation system uses a sophisticated scoring algorithm that considers:

1. **Boost Score** (30% weight): Premium boost purchased by the seller
2. **Age Balancing** (40% weight): Newer listings get periodic priority boosts
3. **Time Rotation**: Deterministic but rotating hash based on time of day
4. **Exposure History**: Recent exposure reduces immediate re-selection probability
5. **Performance Metrics**: View count contributes to selection likelihood

### Scoring Formula
```
rotationScore = 
  (boostScore × 0.3) + 
  (fairExposureBonus × 0.4) + 
  (rotationBonus) + 
  (viewsBonus) - 
  (exposurePenalty)
```

## Technical Architecture

### Components Structure
```
app/components/homepage/
├── FeaturedListings.tsx          # Main component
└── README.md                     # This documentation

lib/utils/
└── featuredRotation.ts           # Rotation management logic
```

### Dependencies
- **React**: State management and lifecycle hooks
- **Next.js**: Dynamic imports and SSR handling  
- **Supabase**: Database queries for featured listings
- **Lucide React**: Icons for UI elements
- **Local Storage**: Rotation history persistence

### Database Requirements

The component expects the following database schema:

```sql
-- Required columns in listings table
ALTER TABLE listings ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS boost_score INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS featured_until TIMESTAMP WITH TIME ZONE;
ALTER TABLE listings ADD COLUMN IF NOT EXISTS views INTEGER DEFAULT 0;
```

## Performance Considerations

### Optimization Features
- **Dynamic loading**: Component loads only when needed
- **Memoized calculations**: Rotation scores cached per session
- **Efficient queries**: Fetches only active, non-expired featured listings
- **Background rotation**: Rotation happens without blocking UI
- **Minimal re-renders**: State updates are batched and optimized

### Memory Management
- **History pruning**: Keeps only 24 hours of exposure history
- **Automatic cleanup**: Removes expired tracking data
- **Storage limits**: Prevents unlimited localStorage growth

## Customization Guide

### Styling Customization
The component uses Tailwind CSS classes that can be customized:

```tsx
// Custom styling example
const customStyles = {
  container: "py-20 bg-gradient-to-br from-purple-50 to-pink-100",
  card: "bg-white rounded-2xl shadow-xl hover:shadow-2xl",
  badge: "bg-gradient-to-r from-purple-500 to-purple-600"
}
```

### Rotation Logic Customization
Modify the rotation manager configuration:

```tsx
import { FeaturedListingsRotationManager } from '@/lib/utils/featuredRotation'

const customConfig = {
  rotationIntervalMinutes: 10,
  maxDisplayCount: 9,
  fairExposureWeight: 0.5,
  boostScoreWeight: 0.2,
  ageBalancingEnabled: true
}

const customManager = new FeaturedListingsRotationManager(customConfig)
```

## Analytics & Monitoring

### Exposure Statistics
```tsx
import { getListingExposureStats } from '@/lib/utils/featuredRotation'

const stats = getListingExposureStats('listing-id')
console.log({
  totalExposures: stats.totalExposures,
  lastExposure: stats.lastExposure,
  exposuresLast24h: stats.exposuresLast24h
})
```

### Performance Monitoring
- Monitor rotation frequency and fairness
- Track user engagement with featured listings
- Analyze conversion rates by position and timing
- Measure the effectiveness of fair exposure algorithm

## Best Practices

### For Developers
1. **Test rotation behavior**: Verify fair exposure over extended periods
2. **Monitor performance**: Check for memory leaks in long-running sessions
3. **Handle edge cases**: Empty results, network failures, invalid data
4. **Maintain accessibility**: Ensure proper ARIA labels and keyboard navigation

### For Content Managers
1. **Balance featured listings**: Don't over-saturate with too many featured items
2. **Monitor engagement**: Track which rotations perform best
3. **Update boost scores**: Regularly review and adjust boost scoring
4. **Quality control**: Ensure all featured listings meet quality standards

## Troubleshooting

### Common Issues

**Listings not rotating**
- Check `rotationInterval` setting
- Verify sufficient featured listings in database
- Confirm component is mounted and active

**Unfair exposure distribution**
- Review boost scores and listing ages
- Check for localStorage data corruption
- Verify rotation history tracking

**Performance problems**
- Reduce `displayCount` for better performance
- Increase `rotationInterval` to reduce CPU usage
- Clear rotation history periodically

### Debug Mode
Enable debug logging:
```tsx
// Add to component
useEffect(() => {
  console.log('Featured listings:', featuredListings)
  console.log('Displayed listings:', displayedListings)
  console.log('Rotation index:', currentRotationIndex)
}, [featuredListings, displayedListings, currentRotationIndex])
```

## Future Enhancements

### Planned Features
- **A/B testing**: Compare different rotation strategies
- **Machine learning**: AI-powered optimization based on user behavior
- **Real-time updates**: WebSocket-based live rotation updates
- **Geographic rotation**: Location-based fair exposure
- **Time-zone awareness**: Rotation timing based on user location

### Integration Opportunities
- **Admin dashboard**: Rotation management interface
- **Analytics reporting**: Comprehensive exposure reports
- **API endpoints**: External access to rotation data
- **Webhook notifications**: Real-time rotation events