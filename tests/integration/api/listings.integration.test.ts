import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as createListing } from '../../../app/api/listings/route'
import { POST as deleteListing } from '../../../app/api/listings/delete/route'
import { POST as markAsSold } from '../../../app/api/listings/mark-sold/route'
import { POST as pauseListing } from '../../../app/api/listings/pause/route'
import { POST as renewListing } from '../../../app/api/listings/renew/route'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    order: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
}

// Mock createRouteHandlerClient
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('/api/listings Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockListing = {
    id: 'test-listing-id',
    user_id: 'test-user-id',
    title: 'Test Vehicle',
    status: 'active',
    price: 50000,
    views: 0,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('POST /api/listings/delete', () => {
    it('should successfully delete a listing', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockListing, status: 'deleted' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      // First call to check ownership
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await deleteListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('moved to bin')
    })

    it('should return 404 for non-existent listing', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'non-existent-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'non-existent-id' }),
      })

      const response = await deleteListing(request)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Listing not found')
    })

    it('should return 403 for unauthorized user', async () => {
      const otherUserListing = { ...mockListing, user_id: 'other-user-id' }
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: otherUserListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await deleteListing(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toContain('permission')
    })
  })

  describe('POST /api/listings/mark-sold', () => {
    it('should successfully mark listing as sold', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockListing, status: 'sold' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      // First call to check ownership
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await markAsSold(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('marked as sold')
    })

    it('should return 400 for already sold listing', async () => {
      const soldListing = { ...mockListing, status: 'sold' }
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: soldListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await markAsSold(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('already sold')
    })
  })

  describe('POST /api/listings/pause', () => {
    it('should successfully pause an active listing', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockListing, status: 'pending', isPaused: true },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      // First call to check ownership
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'pause' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'pause' }),
      })

      const response = await pauseListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('paused successfully')
    })

    it('should successfully resume a paused listing', async () => {
      const pausedListing = { ...mockListing, status: 'pending', isPaused: true }
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...pausedListing, status: 'active', isPaused: false },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      // First call to check ownership
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: pausedListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'resume' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'resume' }),
      })

      const response = await pauseListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('resumed successfully')
    })

    it('should return 400 for invalid action', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'invalid' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id', action: 'invalid' }),
      })

      const response = await pauseListing(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('valid action')
    })
  })

  describe('POST /api/listings/renew', () => {
    it('should successfully renew a listing', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockListing, renewed_at: new Date().toISOString() },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      // First call to check ownership
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockListing,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await renewListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('renewed successfully')
    })
  })

  describe('Unauthorized access', () => {
    it('should return 401 when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'User not found' },
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ listingId: 'test-listing-id' }),
      })

      const response = await deleteListing(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })
  })
})