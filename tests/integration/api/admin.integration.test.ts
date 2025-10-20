import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as rejectListing } from '../../../app/api/admin/listings/reject/route'
import { GET as getListings } from '../../../app/api/admin/listings/route'

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
    limit: jest.fn().mockReturnThis(),
  })),
  rpc: jest.fn(),
}

// Mock admin auth
const mockAdminAuth = {
  user: { id: 'admin-user-id' },
  adminUser: { 
    user_id: 'admin-user-id',
    role: 'admin', 
    permissions: ['moderate_listings'] 
  },
  hasPermission: jest.fn(() => true),
}

jest.mock('@/lib/middleware/adminAuth', () => ({
  verifyAdminAccess: jest.fn(() => mockAdminAuth),
}))

// Mock createRouteHandlerClient
jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}))

// Mock cookies
jest.mock('next/headers', () => ({
  cookies: jest.fn(),
}))

describe('/api/admin Integration Tests', () => {
  const mockUser = {
    id: 'admin-user-id',
    email: 'admin@example.com',
  }

  const mockListing = {
    id: 'test-listing-id',
    user_id: 'user-id',
    title: 'Test Vehicle',
    status: 'pending',
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

  describe('GET /api/admin/listings', () => {
    it('should successfully fetch admin listings', async () => {
      const mockListings = [
        mockListing,
        { ...mockListing, id: 'listing-2', title: 'Another Vehicle' },
      ]

      mockSupabaseClient.from().select().order().limit.mockResolvedValue({
        data: mockListings,
        error: null,
        count: 2,
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/listings?page=1&limit=10',
      })

      const request = new NextRequest('http://localhost:3000/api/admin/listings?page=1&limit=10', {
        method: 'GET',
      })

      const response = await getListings(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.listings).toHaveLength(2)
      expect(result.listings[0].title).toBe('Test Vehicle')
    })

    it('should filter listings by status', async () => {
      const pendingListings = [
        { ...mockListing, status: 'pending' },
      ]

      mockSupabaseClient.from.mockImplementation(() => ({
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue({
          data: pendingListings,
          error: null,
          count: 1,
        }),
      }))

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/listings?status=pending',
      })

      const request = new NextRequest('http://localhost:3000/api/admin/listings?status=pending', {
        method: 'GET',
      })

      const response = await getListings(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.listings).toHaveLength(1)
      expect(result.listings[0].status).toBe('pending')
    })

    it('should handle database errors gracefully', async () => {
      mockSupabaseClient.from().select().order().limit.mockResolvedValue({
        data: null,
        error: { message: 'Database connection failed' },
      })

      const { req } = createMocks({
        method: 'GET',
        url: '/api/admin/listings',
      })

      const request = new NextRequest('http://localhost:3000/api/admin/listings', {
        method: 'GET',
      })

      const response = await getListings(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to fetch listings')
    })
  })

  describe('POST /api/admin/listings/reject', () => {
    it('should successfully reject a listing', async () => {
      const rejectionReason = 'Inappropriate content'

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                user_id: 'user-id', 
                title: 'Test Vehicle',
              },
              error: null,
            }),
          }
        }
        if (table === 'notifications') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason,
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason,
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('rejected successfully')
    })

    it('should return 400 when listingId is missing', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          rejectionReason: 'Test reason',
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          rejectionReason: 'Test reason',
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('required')
    })

    it('should return 400 when rejectionReason is missing', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('required')
    })

    it('should return 403 when admin lacks permissions', async () => {
      // Mock admin without moderate_listings permission
      const mockRestrictedAdmin = {
        ...mockAdminAuth,
        hasPermission: jest.fn(() => false),
      }

      const { verifyAdminAccess } = require('@/lib/middleware/adminAuth')
      verifyAdminAccess.mockReturnValueOnce(mockRestrictedAdmin)

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toBe('Permission denied')
    })

    it('should handle database update errors', async () => {
      mockSupabaseClient.from().update().eq().select().single.mockResolvedValue({
        data: null,
        error: { message: 'Update failed' },
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(500)
      expect(result.error).toBe('Failed to reject listing')
    })

    it('should create notification for user after rejection', async () => {
      const rejectionReason = 'Inappropriate content'
      const mockNotificationInsert = jest.fn().mockResolvedValue({ error: null })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'listings') {
          return {
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { 
                user_id: 'user-id', 
                title: 'Test Vehicle',
              },
              error: null,
            }),
          }
        }
        if (table === 'notifications') {
          return {
            insert: mockNotificationInsert,
          }
        }
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason,
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason,
        }),
      })

      const response = await rejectListing(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(mockNotificationInsert).toHaveBeenCalledWith({
        user_id: 'user-id',
        type: 'listing_rejected',
        title: 'Listing Rejected',
        message: expect.stringContaining(rejectionReason),
        listing_id: 'test-listing-id',
      })
    })
  })

  describe('Admin access control', () => {
    it('should return error when verifyAdminAccess returns NextResponse', async () => {
      const { verifyAdminAccess } = require('@/lib/middleware/adminAuth')
      const mockErrorResponse = {
        json: jest.fn(() => ({ error: 'Unauthorized' })),
        status: 401,
      }
      verifyAdminAccess.mockReturnValueOnce(mockErrorResponse)

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ 
          listingId: 'test-listing-id',
          rejectionReason: 'Test reason',
        }),
      })

      const response = await rejectListing(request)

      expect(response).toBe(mockErrorResponse)
    })
  })
})