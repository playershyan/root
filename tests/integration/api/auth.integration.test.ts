import { createMocks } from 'node-mocks-http'
import { NextRequest, NextResponse } from 'next/server'
import { POST as handler } from '../../../app/api/auth/google-signin/route'

// Mock Supabase client
const mockSupabaseClient = {
  auth: {
    signInWithIdToken: jest.fn(),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
  })),
}

// Mock Google OAuth client
const mockGoogleClient = {
  verifyIdToken: jest.fn(),
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}))

jest.mock('google-auth-library', () => ({
  OAuth2Client: jest.fn(() => mockGoogleClient),
}))

describe('/api/auth/google-signin', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should successfully sign in with valid Google credential', async () => {
    // Mock successful auth
    mockSupabaseClient.auth.signInWithIdToken.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })

    // Mock Google token verification
    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      }),
    })

    // Mock profile query - user doesn't exist
    mockSupabaseClient.from().single.mockResolvedValue({
      data: null,
      error: { code: 'PGRST116' },
    })

    // Mock profile insertion
    mockSupabaseClient.from().insert.mockResolvedValue({
      data: {},
      error: null,
    })

    const { req } = createMocks({
      method: 'POST',
      body: { credential: 'valid-google-token' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ credential: 'valid-google-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
    expect(responseData.user).toBeDefined()
    expect(mockSupabaseClient.auth.signInWithIdToken).toHaveBeenCalledWith({
      provider: 'google',
      token: 'valid-google-token',
    })
  })

  it('should return 400 for missing credential', async () => {
    const { req } = createMocks({
      method: 'POST',
      body: {},
    })

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('No credential provided')
  })

  it('should return 400 for Supabase auth error', async () => {
    mockSupabaseClient.auth.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'Invalid token' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ credential: 'invalid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toBe('Invalid token')
  })

  it('should handle provider not enabled error', async () => {
    mockSupabaseClient.auth.signInWithIdToken.mockResolvedValue({
      data: null,
      error: { message: 'provider is not enabled' },
    })

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ credential: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(400)
    expect(responseData.error).toContain('Google provider not enabled')
    expect(responseData.details).toContain('supabase.com/dashboard')
  })

  it('should handle existing user profile', async () => {
    mockSupabaseClient.auth.signInWithIdToken.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })

    mockGoogleClient.verifyIdToken.mockResolvedValue({
      getPayload: () => ({
        email: 'test@example.com',
        name: 'Test User',
        picture: 'https://example.com/photo.jpg',
      }),
    })

    // Mock existing profile
    mockSupabaseClient.from().single.mockResolvedValue({
      data: { id: 'test-user-id', email: 'test@example.com' },
      error: null,
    })

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ credential: 'valid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.success).toBe(true)
    // Should not attempt to insert profile since it exists
    expect(mockSupabaseClient.from().insert).not.toHaveBeenCalled()
  })

  it('should handle Google token verification error', async () => {
    mockSupabaseClient.auth.signInWithIdToken.mockResolvedValue({
      data: { user: { id: 'test-user-id', email: 'test@example.com' } },
      error: null,
    })

    mockGoogleClient.verifyIdToken.mockRejectedValue(new Error('Invalid token'))

    const request = new NextRequest('http://localhost:3000/api/auth/google-signin', {
      method: 'POST',
      body: JSON.stringify({ credential: 'invalid-token' }),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const response = await handler.POST(request)
    const responseData = await response.json()

    expect(response.status).toBe(500)
    expect(responseData.error).toBe('Internal server error')
  })
})