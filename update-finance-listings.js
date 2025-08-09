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
      .select('id, title, price')
      .limit(5)
    
    if (fetchError) {
      console.error('Error fetching listings:', fetchError)
      return
    }

    if (!listings || listings.length === 0) {
      console.log('No listings found to update')
      return
    }

    console.log(`Found ${listings.length} listings to update`)

    // Update the first 3 listings to be finance/lease takeovers
    const financeExamples = [
      {
        pricing_type: 'finance',
        finance_type: 'Bank Loan',
        finance_provider: 'Commercial Bank',
        original_amount: 5500000,
        outstanding_balance: 3200000,
        monthly_payment: 85000,
        remaining_term: '36 months',
        early_settlement: 'Allowed with 2% penalty',
        negotiable: false
      },
      {
        pricing_type: 'finance',
        finance_type: 'Lease',
        finance_provider: 'People\'s Leasing',
        original_amount: 4800000,
        outstanding_balance: 2800000,
        monthly_payment: 72000,
        remaining_term: '24 months',
        early_settlement: 'Allowed after 12 months',
        negotiable: true
      },
      {
        pricing_type: 'finance',
        finance_type: 'Hire Purchase',
        finance_provider: 'LB Finance',
        original_amount: 3900000,
        outstanding_balance: 1950000,
        monthly_payment: 65000,
        remaining_term: '18 months',
        early_settlement: 'No penalty after 6 months',
        negotiable: false
      }
    ]

    // Update listings with finance details
    for (let i = 0; i < Math.min(3, listings.length); i++) {
      const listing = listings[i]
      const financeData = financeExamples[i]
      
      // Set the price to the outstanding balance for finance listings
      const updateData = {
        ...financeData,
        price: financeData.outstanding_balance
      }

      const { error: updateError } = await supabase
        .from('listings')
        .update(updateData)
        .eq('id', listing.id)

      if (updateError) {
        console.error(`Error updating listing ${listing.id}:`, updateError)
      } else {
        console.log(`✓ Updated listing ${listing.id} to finance/lease takeover`)
        console.log(`  - Type: ${financeData.finance_type}`)
        console.log(`  - Provider: ${financeData.finance_provider}`)
        console.log(`  - Outstanding: Rs. ${financeData.outstanding_balance.toLocaleString()}`)
        console.log(`  - Monthly: Rs. ${financeData.monthly_payment.toLocaleString()}`)
      }
    }

    // Keep the remaining listings as cash sales but add negotiable flag
    for (let i = 3; i < listings.length; i++) {
      const listing = listings[i]
      
      const { error: updateError } = await supabase
        .from('listings')
        .update({
          pricing_type: 'cash',
          negotiable: true,
          // Clear any finance fields
          finance_type: null,
          finance_provider: null,
          original_amount: null,
          outstanding_balance: null,
          monthly_payment: null,
          remaining_term: null,
          early_settlement: null
        })
        .eq('id', listing.id)

      if (updateError) {
        console.error(`Error updating listing ${listing.id}:`, updateError)
      } else {
        console.log(`✓ Updated listing ${listing.id} to cash sale (negotiable)`)
      }
    }

    console.log('\n✅ Successfully updated listings!')
    console.log('Visit http://localhost:3001/listings to see the changes')

  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the update
updateListingsToFinance()