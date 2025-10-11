/**
 * @jest-environment node
 */
import { NextRequest, NextResponse } from 'next/server'
import { POST as trackClick } from '../../../app/api/wanted-requests/track-click/route'

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
  rpc: jest.fn(),
}

// Mock createServiceSupabaseClient
jest.mock('@/lib/supabase-server', () => ({
  createServiceSupabaseClient: () => mockSupabaseClient,
}))

describe('POST /api/wanted-requests/track-click Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully track click with valid requestId', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/wanted-requests/track-click', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'test-request-id' }),
    })

    const response = await trackClick(request)
    const result = await response.json()

    expect(response.status).toBe(200)
    expect(result.success).toBe(true)
    expect(mockSupabaseClient.rpc).toHaveBeenCalledWith('increment_wanted_request_clicks', {
      request_id: 'test-request-id'
    })
  })

  it('should return 400 when requestId is missing', async () => {
    const request = new NextRequest('http://localhost:3000/api/wanted-requests/track-click', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await trackClick(request)
    const result = await response.json()

    expect(response.status).toBe(400)
    expect(result.error).toBe('Request ID is required')
    expect(mockSupabaseClient.rpc).not.toHaveBeenCalled()
  })

  it('should return 500 when RPC function fails', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Database error', code: 'PGRST301' },
    })

    const request = new NextRequest('http://localhost:3000/api/wanted-requests/track-click', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'test-request-id' }),
    })

    const response = await trackClick(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Failed to track click')
    expect(result.details).toBe('Database error')
  })

  it('should handle invalid requestId gracefully', async () => {
    mockSupabaseClient.rpc.mockResolvedValue({
      data: null,
      error: { message: 'Invalid UUID format', code: '22P02' },
    })

    const request = new NextRequest('http://localhost:3000/api/wanted-requests/track-click', {
      method: 'POST',
      body: JSON.stringify({ requestId: 'invalid-uuid' }),
    })

    const response = await trackClick(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Failed to track click')
    expect(result.details).toBe('Invalid UUID format')
  })

  it('should handle malformed JSON gracefully', async () => {
    const request = new NextRequest('http://localhost:3000/api/wanted-requests/track-click', {
      method: 'POST',
      body: 'not-valid-json',
    })

    const response = await trackClick(request)
    const result = await response.json()

    expect(response.status).toBe(500)
    expect(result.error).toBe('Internal server error')
  })
})
