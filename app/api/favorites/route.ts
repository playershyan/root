import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

// GET favorites for current user
export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's favorites
    const { data: favorites, error } = await supabase
      .from('favorites')
      .select('listing_id')
      .eq('user_id', user.id)

    if (error) {
      console.error('Error fetching favorites:', error)
      return NextResponse.json({ error: 'Failed to fetch favorites' }, { status: 500 })
    }

    // Return array of listing IDs
    const favoriteIds = favorites?.map(f => f.listing_id) || []
    
    return NextResponse.json({ favorites: favoriteIds })

  } catch (error) {
    console.error('Favorites GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST to add/remove favorite
export async function POST(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { listingId, action } = await request.json()

    if (!listingId || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (action === 'add') {
      // Check if already favorited
      const { data: existing } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('listing_id', listingId)
        .single()

      if (existing) {
        return NextResponse.json({ message: 'Already favorited' })
      }

      // Add to favorites
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          user_id: user.id,
          listing_id: listingId
        })

      if (insertError) {
        console.error('Error adding favorite:', insertError)
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Added to favorites' })

    } else if (action === 'remove') {
      // Remove from favorites
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('listing_id', listingId)

      if (deleteError) {
        console.error('Error removing favorite:', deleteError)
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
      }

      return NextResponse.json({ message: 'Removed from favorites' })

    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

  } catch (error) {
    console.error('Favorites POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}