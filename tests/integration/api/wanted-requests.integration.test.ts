import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'
import { POST as closeWantedRequest } from '../../../app/api/wanted-requests/close/route'
import { POST as deleteWantedRequest } from '../../../app/api/wanted-requests/delete/route'
import { POST as pauseWantedRequest } from '../../../app/api/wanted-requests/pause/route'
import { POST as renewWantedRequest } from '../../../app/api/wanted-requests/renew/route'
import { POST as updateWantedRequest } from '../../../app/api/wanted-requests/update/route'

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

describe('/api/wanted-requests Integration Tests', () => {
  const mockUser = {
    id: 'test-user-id',
    email: 'test@example.com',
  }

  const mockWantedRequest = {
    id: 'test-request-id',
    user_id: 'test-user-id',
    title: 'Looking for Honda Civic',
    status: 'active',
    budget_min: 20000,
    budget_max: 30000,
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockSupabaseClient.auth.getUser.mockResolvedValue({
      data: { user: mockUser },
      error: null,
    })
  })

  describe('POST /api/wanted-requests/close', () => {
    it('should successfully close a wanted request', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWantedRequest, status: 'closed' },
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
        data: mockWantedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('closed successfully')
    })

    it('should return 404 for non-existent wanted request', async () => {
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: null,
        error: { code: 'PGRST116' },
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'non-existent-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'non-existent-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(404)
      expect(result.error).toBe('Wanted request not found')
    })

    it('should return 403 for unauthorized user', async () => {
      const otherUserRequest = { ...mockWantedRequest, user_id: 'other-user-id' }
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: otherUserRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(403)
      expect(result.error).toContain('permission')
    })

    it('should return 400 for already closed request', async () => {
      const closedRequest = { ...mockWantedRequest, status: 'closed' }
      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: closedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('already closed')
    })
  })

  describe('POST /api/wanted-requests/delete', () => {
    it('should successfully delete a wanted request', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWantedRequest, status: 'deleted' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWantedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await deleteWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('moved to bin')
    })
  })

  describe('POST /api/wanted-requests/pause', () => {
    it('should successfully pause an active wanted request', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWantedRequest, status: 'paused' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWantedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id', action: 'pause' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id', action: 'pause' }),
      })

      const response = await pauseWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('paused successfully')
    })

    it('should successfully resume a paused wanted request', async () => {
      const pausedRequest = { ...mockWantedRequest, status: 'paused' }
      
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...pausedRequest, status: 'active' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: pausedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id', action: 'resume' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id', action: 'resume' }),
      })

      const response = await pauseWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('resumed successfully')
    })
  })

  describe('POST /api/wanted-requests/renew', () => {
    it('should successfully renew a wanted request', async () => {
      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWantedRequest, renewed_at: new Date().toISOString() },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWantedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await renewWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('renewed successfully')
    })
  })

  describe('POST /api/wanted-requests/update', () => {
    it('should successfully update a wanted request', async () => {
      const updateData = {
        title: 'Updated: Looking for Honda Civic',
        budget_min: 25000,
        budget_max: 35000,
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...mockWantedRequest, ...updateData },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: mockWantedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({
          requestId: 'test-request-id',
          ...updateData,
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({
          requestId: 'test-request-id',
          ...updateData,
        }),
      })

      const response = await updateWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('updated successfully')
    })

    it('should resubmit deleted wanted request', async () => {
      const deletedRequest = { ...mockWantedRequest, status: 'deleted' }
      const updateData = {
        title: 'Resubmitted: Looking for Honda Civic',
        budget_min: 25000,
        budget_max: 35000,
      }

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn().mockResolvedValue({
              data: { ...deletedRequest, ...updateData, status: 'pending' },
              error: null,
            }),
          }
        }
        return {
          insert: jest.fn().mockResolvedValue({ error: null }),
        }
      })

      mockSupabaseClient.from().select().eq().single.mockResolvedValueOnce({
        data: deletedRequest,
        error: null,
      })

      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({
          requestId: 'test-request-id',
          ...updateData,
        }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({
          requestId: 'test-request-id',
          ...updateData,
        }),
      })

      const response = await updateWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(200)
      expect(result.success).toBe(true)
      expect(result.message).toContain('resubmitted successfully')
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
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })
  })

  describe('Missing required fields', () => {
    it('should return 400 when requestId is missing', async () => {
      const { req } = createMocks({
        method: 'POST',
        body: JSON.stringify({}),
      })

      const request = new NextRequest(req.url!, {
        method: 'POST',
        body: JSON.stringify({}),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('required')
    })
  })
})