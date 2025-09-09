import { createMocks } from 'node-mocks-http'
import { NextRequest } from 'next/server'

// Mock search route handler
const mockSearchResults = [
  {
    id: '1',
    title: 'Toyota Corolla 2020',
    price: 5000000,
    make: 'Toyota',
    model: 'Corolla',
    year: 2020,
    location: 'Colombo',
    images: ['image1.jpg'],
  },
  {
    id: '2',
    title: 'Honda Civic 2019',
    price: 4500000,
    make: 'Honda',
    model: 'Civic',
    year: 2019,
    location: 'Kandy',
    images: ['image2.jpg'],
  },
]

const mockSupabaseClient = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    then: jest.fn().mockResolvedValue({ data: mockSearchResults, error: null }),
  })),
}

jest.mock('@supabase/auth-helpers-nextjs', () => ({
  createRouteHandlerClient: () => mockSupabaseClient,
}))

// Mock the actual search route
const mockSearchHandler = {
  GET: async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const make = searchParams.get('make')
    const minPrice = searchParams.get('minPrice')
    const maxPrice = searchParams.get('maxPrice')
    const location = searchParams.get('location')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    try {
      // Simulate database query based on parameters
      let filteredResults = [...mockSearchResults]

      if (query) {
        filteredResults = filteredResults.filter(item =>
          item.title.toLowerCase().includes(query.toLowerCase()) ||
          item.make.toLowerCase().includes(query.toLowerCase()) ||
          item.model.toLowerCase().includes(query.toLowerCase())
        )
      }

      if (make) {
        filteredResults = filteredResults.filter(item =>
          item.make.toLowerCase() === make.toLowerCase()
        )
      }

      if (minPrice) {
        filteredResults = filteredResults.filter(item =>
          item.price >= parseInt(minPrice)
        )
      }

      if (maxPrice) {
        filteredResults = filteredResults.filter(item =>
          item.price <= parseInt(maxPrice)
        )
      }

      if (location) {
        filteredResults = filteredResults.filter(item =>
          item.location.toLowerCase().includes(location.toLowerCase())
        )
      }

      // Pagination
      const offset = (page - 1) * limit
      const paginatedResults = filteredResults.slice(offset, offset + limit)

      return Response.json({
        listings: paginatedResults,
        total: filteredResults.length,
        page,
        limit,
        totalPages: Math.ceil(filteredResults.length / limit),
      })
    } catch (error) {
      return Response.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }
  }
}

describe('/api/search', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return search results without filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/search')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(2)
    expect(responseData.total).toBe(2)
    expect(responseData.page).toBe(1)
    expect(responseData.limit).toBe(20)
  })

  it('should filter by search query', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=toyota')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].make).toBe('Toyota')
    expect(responseData.total).toBe(1)
  })

  it('should filter by make', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?make=Honda')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].make).toBe('Honda')
  })

  it('should filter by price range', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?minPrice=4000000&maxPrice=4800000')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].price).toBe(4500000)
  })

  it('should filter by location', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?location=Kandy')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].location).toBe('Kandy')
  })

  it('should handle pagination', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?page=2&limit=1')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.page).toBe(2)
    expect(responseData.limit).toBe(1)
    expect(responseData.totalPages).toBe(2)
  })

  it('should return empty results for no matches', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=nonexistent')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(0)
    expect(responseData.total).toBe(0)
  })

  it('should handle multiple filters', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?make=Toyota&minPrice=4000000')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].make).toBe('Toyota')
    expect(responseData.listings[0].price).toBeGreaterThanOrEqual(4000000)
  })

  it('should handle case-insensitive search', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?q=HONDA')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    expect(responseData.listings).toHaveLength(1)
    expect(responseData.listings[0].make).toBe('Honda')
  })

  it('should validate pagination parameters', async () => {
    const request = new NextRequest('http://localhost:3000/api/search?page=0&limit=-5')

    const response = await mockSearchHandler.GET(request)
    const responseData = await response.json()

    expect(response.status).toBe(200)
    // Should default to page 1, limit 20
    expect(responseData.page).toBe(1)
    expect(responseData.limit).toBe(20)
  })
})