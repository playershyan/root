import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'

export const runtime = 'nodejs'

// GET favorited listings with full details for profile page
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's favorited listings with full details
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select(`
        listing_id,
        created_at,
        listings (
          id,
          title,
          price,
          location,
          make,
          model,
          year,
          mileage,
          fuel_type,
          transmission,
          image_url,
          image_urls,
          created_at,
          views,
          is_featured,
          is_sold
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      logger.error('Error fetching favorite listings', error, { userId: user.id })
      return NextResponse.json({ error: 'Failed to fetch favorite listings' }, { status: 500 })
    }

    // Transform the data to match the expected format
    const favoritedListings = favorites?.map(f => ({
      ...f.listings,
      favorited_at: f.created_at
    })).filter(Boolean) || []

    return NextResponse.json({ listings: favoritedListings })

  } catch (error) {
    logger.error('Favorite listings GET error', error as Error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}