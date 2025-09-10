# AI Buying Guide Performance Optimization

## Current Issues (4-5 seconds delay)

1. **Large prompt size**: 66 lines of instructions
2. **No caching**: Regenerates for every search
3. **Direct API calls**: No streaming or SDK optimization
4. **Heavy post-processing**: Complex regex and string operations
5. **Model selection**: Using newer model without speed optimization

## Optimization Solutions

### 1. Implement Caching (Biggest Impact)
```typescript
// In-memory cache with 1-hour TTL
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

// Check cache before API call
const cached = cache.get(searchKey)
if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
  return cached.data // Instant response
}
```

### 2. Use Faster Model Configuration
```typescript
// Switch to optimized model
const model = genAI.getGenerativeModel({ 
  model: 'gemini-1.5-flash', // Faster than 2.0
  generationConfig: {
    temperature: 0.7,
    maxOutputTokens: 500, // Limit output length
  }
})
```

### 3. Simplify Prompt (Reduce by 80%)
```typescript
// Before: 66 lines
// After: 10 lines
const prompt = `Quick buying guide for ${searchContext}:
Format as HTML list with 4 key points.
Keep under 150 words.`
```

### 4. Implement Streaming Response
```typescript
// Stream chunks as they generate
const result = await model.generateContentStream(prompt)
for await (const chunk of result.stream) {
  // Send chunk immediately to client
  controller.enqueue(chunk.text())
}
```

### 5. Add Edge Caching
```typescript
// Use Vercel Edge Config or Redis
import { get } from '@vercel/edge-config'

const cached = await get(cacheKey)
if (cached) return cached // <50ms response
```

### 6. Implement Debouncing on Frontend
```typescript
// Only call API after user stops typing
const debouncedSearch = useMemo(
  () => debounce(generateAIGuide, 500),
  []
)
```

### 7. Pre-generate Common Searches
```typescript
// Pre-cache popular searches
const POPULAR_SEARCHES = [
  'Toyota Prius',
  'Honda Vezel',
  'Nissan Leaf'
]

// Generate during build or cron job
for (const search of POPULAR_SEARCHES) {
  await generateAndCache(search)
}
```

## Expected Performance Improvements

| Optimization | Response Time | Impact |
|-------------|--------------|--------|
| Current | 4-5 seconds | Baseline |
| With caching | <50ms (cached) | 100x faster for repeats |
| Simplified prompt | 1-2 seconds | 2-3x faster |
| Streaming | 500ms first byte | Better perceived speed |
| Edge caching | <100ms | Near instant |
| Combined optimizations | 200-500ms | 10-20x faster |

## Quick Implementation Steps

1. **Immediate fix** (5 minutes):
   - Add simple in-memory cache
   - Reduce prompt size

2. **Better fix** (30 minutes):
   - Switch to gemini-1.5-flash
   - Implement debouncing
   - Add streaming response

3. **Best fix** (2 hours):
   - Add Redis/Edge caching
   - Pre-generate popular searches
   - Implement progressive enhancement

## Alternative: Remove AI Guide
If speed is critical and AI adds limited value:
- Replace with static buying tips
- Use pre-written guides per vehicle type
- Load tips from database instead of generating

## Testing Performance
```bash
# Measure API response time
curl -w "@curl-format.txt" -X POST \
  https://vera.lk/api/generate-ai-guide \
  -H "Content-Type: application/json" \
  -d '{"searchContext":"Toyota Prius"}'
```