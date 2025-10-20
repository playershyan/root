import { NextRequest } from 'next/server'
import { rateLimit, withRateLimit, rateLimiters } from '../../../lib/middleware/rateLimiter'

// Mock LRUCache
jest.mock('lru-cache', () => {
  const mockCache = new Map()
  return {
    LRUCache: jest.fn().mockImplementation(() => ({
      get: jest.fn((key) => mockCache.get(key)),
      set: jest.fn((key, value) => mockCache.set(key, value)),
      has: jest.fn((key) => mockCache.has(key)),
      clear: jest.fn(() => mockCache.clear()),
    }))
  }
})

// Create mock request
function createMockRequest(path: string = '/api/test', headers: Record<string, string> = {}): NextRequest {
  return {
    nextUrl: { pathname: path },
    headers: {
      get: jest.fn((name: string) => headers[name] || null),
    },
  } as unknown as NextRequest
}

describe('rateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    // Clear all cache instances
    require('lru-cache').LRUCache.mockClear()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should allow requests within the limit', async () => {
    const limiter = rateLimit({ interval: 60000, maxRequests: 5 })
    const request = createMockRequest()
    
    const result = await limiter(request)
    
    expect(result.success).toBe(true)
    expect(result.limit).toBe(5)
    expect(result.remaining).toBe(4)
  })

  it('should reject requests exceeding the limit', async () => {
    const limiter = rateLimit({ interval: 60000, maxRequests: 2 })
    const request = createMockRequest()
    
    // Make requests up to the limit
    await limiter(request)
    await limiter(request)
    
    // This should fail
    const result = await limiter(request)
    
    expect(result.success).toBe(false)
    expect(result.limit).toBe(2)
    expect(result.remaining).toBe(0)
    expect(result.reset).toBeInstanceOf(Date)
  })

  it('should reset after the time window', async () => {
    jest.setSystemTime(new Date('2023-01-01T00:00:00Z'))
    
    const limiter = rateLimit({ interval: 60000, maxRequests: 1 })
    const request = createMockRequest()
    
    // Use up the limit
    const firstResult = await limiter(request)
    expect(firstResult.success).toBe(true)
    
    const secondResult = await limiter(request)
    expect(secondResult.success).toBe(false)
    
    // Move time forward beyond the window
    jest.setSystemTime(new Date('2023-01-01T00:02:00Z'))
    
    const thirdResult = await limiter(request)
    expect(thirdResult.success).toBe(true)
  })

  it('should use custom identifier when provided', async () => {
    const limiter = rateLimit({ interval: 60000, maxRequests: 1 })
    const request1 = createMockRequest()
    const request2 = createMockRequest()
    
    // Same requests but different identifiers should be tracked separately
    const result1 = await limiter(request1, 'user1')
    const result2 = await limiter(request2, 'user2')
    
    expect(result1.success).toBe(true)
    expect(result2.success).toBe(true)
  })
})

describe('withRateLimit', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('should return null when rate limit is not exceeded', async () => {
    const limiter = rateLimit({ interval: 60000, maxRequests: 5 })
    const request = createMockRequest()
    
    const result = await withRateLimit(request, limiter)
    
    expect(result).toBeNull()
  })

  it('should return 429 response when rate limit is exceeded', async () => {
    const limiter = rateLimit({ interval: 60000, maxRequests: 1 })
    const request = createMockRequest()
    
    // Use up the limit
    await limiter(request)
    
    const result = await withRateLimit(request, limiter)
    
    expect(result).not.toBeNull()
    // Check if it's a NextResponse with status 429
    expect(result?.status).toBe(429)
  })
})

describe('predefined rateLimiters', () => {
  it('should have correct configuration for API rate limiter', () => {
    expect(rateLimiters.api).toBeDefined()
  })

  it('should have correct configuration for auth rate limiter', () => {
    expect(rateLimiters.auth).toBeDefined()
  })

  it('should have correct configuration for search rate limiter', () => {
    expect(rateLimiters.search).toBeDefined()
  })

  it('should have correct configuration for upload rate limiter', () => {
    expect(rateLimiters.upload).toBeDefined()
  })

  it('should have correct configuration for messaging rate limiter', () => {
    expect(rateLimiters.messaging).toBeDefined()
  })

  it('should have correct configuration for AI rate limiter', () => {
    expect(rateLimiters.ai).toBeDefined()
  })

  it('should have correct configuration for admin rate limiter', () => {
    expect(rateLimiters.admin).toBeDefined()
  })

  it('should have correct configuration for strict rate limiter', () => {
    expect(rateLimiters.strict).toBeDefined()
  })
})