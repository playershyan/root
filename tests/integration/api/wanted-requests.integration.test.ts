/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'
import { POST as closeWantedRequest } from '../../../app/api/wanted-requests/close/route'
import { POST as pauseWantedRequest } from '../../../app/api/wanted-requests/pause/route'

// Mock NextResponse.json to work in node environment
jest.mock('next/server', () => {
  const actual = jest.requireActual('next/server')
  return {
    ...actual,
    NextResponse: {
      json: (body: any, init?: any) => {
        return new Response(JSON.stringify(body), {
          ...init,
          headers: {
            'content-type': 'application/json',
            ...init?.headers,
          },
        })
      },
    },
  }
})

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    getUser: jest.fn(),
  },
  from: jest.fn(),
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
    min_budget: 20000,
    max_budget: 30000,
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
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({
          data: mockWantedRequest,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockWantedRequest, status: 'closed' },
          error: null,
        })

      const updateMock = jest.fn().mockReturnThis()

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            update: updateMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        if (table === 'wanted_request_actions') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
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
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST116' },
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
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
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: otherUserRequest,
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
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
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn().mockResolvedValue({
        data: closedRequest,
        error: null,
      })

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(400)
      expect(result.error).toContain('already closed')
    })
  })

  describe('POST /api/wanted-requests/pause', () => {
    it('should successfully pause an active wanted request', async () => {
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({
          data: mockWantedRequest,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...mockWantedRequest, status: 'paused' },
          error: null,
        })

      const updateMock = jest.fn().mockReturnThis()

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            update: updateMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        if (table === 'wanted_request_actions') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/pause', {
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
      const selectMock = jest.fn().mockReturnThis()
      const eqMock = jest.fn().mockReturnThis()
      const singleMock = jest.fn()
        .mockResolvedValueOnce({
          data: pausedRequest,
          error: null,
        })
        .mockResolvedValueOnce({
          data: { ...pausedRequest, status: 'active' },
          error: null,
        })

      const updateMock = jest.fn().mockReturnThis()

      mockSupabaseClient.from.mockImplementation((table: string) => {
        if (table === 'wanted_requests') {
          return {
            select: selectMock,
            update: updateMock,
            eq: eqMock,
            single: singleMock,
          }
        }
        if (table === 'wanted_request_actions') {
          return {
            insert: jest.fn().mockResolvedValue({ error: null }),
          }
        }
        return {}
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/pause', {
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

  describe('Error Handling', () => {
    it('should return 401 when no user is authenticated', async () => {
      mockSupabaseClient.auth.getUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
        method: 'POST',
        body: JSON.stringify({ requestId: 'test-request-id' }),
      })

      const response = await closeWantedRequest(request)
      const result = await response.json()

      expect(response.status).toBe(401)
      expect(result.error).toBe('Unauthorized')
    })

    it('should return 400 when requestId is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/wanted-requests/close', {
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
