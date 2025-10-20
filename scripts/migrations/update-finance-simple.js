const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function updateListingsToFinance() {
  try {
    // First, let's fetch some existing listings
    const { data: listings, error: fetchError } = await supabase
      .from('listings')
      .select('id, title, price, make, model')
      .limit(6)
    
    if (fetchError) {
      console.error('Error fetching listings:', fetchError)
      return
    }

    if (!listings || listings.length === 0) {
      console.log('No listings found to update')
      return
    }

    console.log(`Found ${listings.length} listings`)
    console.log('Current listings:')
    listings.forEach(l => {
      console.log(`  - ${l.title} (ID: ${l.id.substring(0, 8)}...)`)
    })

    // Let's try updating with only basic fields that should exist
    // First, let's check what columns are available by trying a minimal update
    console.log('\nTrying to update listings with finance type...')

    // Update first 3 listings to show as finance
    for (let i = 0; i < Math.min(3, listings.length); i++) {
      const listing = listings[i]
      
      // Try updating with minimal fields first
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          // Update the title to indicate it's a finance takeover
          title: listing.title + ' - Finance Takeover',
          // These fields might not exist, but let's try
          pricing_type: 'finance'
        })
        .eq('id', listing.id)

      if (updateError) {
        console.error(`Error updating listing ${i + 1}:`, updateError.message)
        
        // If pricing_type doesn't exist, just update the title
        if (updateError.message.includes('pricing_type')) {
          console.log('Pricing_type column not found, updating only title...')
          const { error: titleError } = await supabase
            .from('listings')
            .update({
              title: listing.title + ' - Finance Takeover',
              description: `FINANCE TAKEOVER AVAILABLE\n\nOutstanding Balance: Rs. ${(listing.price * 0.7).toLocaleString()}\nMonthly Payment: Rs. ${Math.round(listing.price / 60).toLocaleString()}\nRemaining Term: 36 months\nFinance Provider: Commercial Bank\n\nOriginal loan amount was Rs. ${listing.price.toLocaleString()}. Take over this existing finance and save on initial costs!\n\n` + (listing.description || '')
            })
            .eq('id', listing.id)
          
          if (titleError) {
            console.error('Error updating title:', titleError.message)
          } else {
            console.log(`✓ Updated listing ${i + 1} title and description to show finance details`)
          }
        }
      } else {
        console.log(`✓ Updated listing ${i + 1} to finance type`)
      }
    }

    console.log('\n✅ Update complete!')
    console.log('Visit http://localhost:3001/listings to see the changes')
    console.log('\nNote: The finance details are added to the title/description since the database')
    console.log('may not have the new finance columns yet. To fully utilize the feature,')
    console.log('the database schema needs to be updated with the finance-related columns.')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the update
updateListingsToFinance()