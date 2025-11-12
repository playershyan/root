import { NextRequest, NextResponse } from 'next/server'
import citiesData from '@/data/cities.json'

// Load cities once on server startup
const CITIES = Object.values(citiesData).flat()

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')?.toLowerCase() || ''
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)

    if (!query) {
      return NextResponse.json([])
    }

    // Fuzzy search on name and postcode
    const results = CITIES
      .filter(city =>
        city.name.toLowerCase().includes(query) ||
        city.postcode?.includes(query)
      )
      .slice(0, limit)
      .map(({ id, name, district_id, postcode }) => ({
        id,
        name,
        district_id,
        postcode
      }))

    return NextResponse.json(results)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to search locations' },
      { status: 500 }
    )
  }
}
