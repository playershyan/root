/**
 * Backend script to generate and cache buying guides
 * Run via: node --loader ts-node/esm scripts/generate-buying-guides.ts
 *
 * This script:
 * 1. Generates buying guides for popular vehicle models
 * 2. Caches them in the database with 30-day TTL
 * 3. Should be run as a scheduled job (daily/weekly)
 */

import OpenAI from 'openai'
import { setCachedGuide } from '../lib/services/guideCache'
import { generateGuideCacheKey, getYearGeneration } from '../lib/utils/vehicleExtraction'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface VehicleModel {
  make: string
  model: string
  years?: number[] // Specific years to generate
  generations?: string[] // Or generation ranges
}

// Popular vehicles in Sri Lankan market
// This list should be maintained based on market data
const POPULAR_VEHICLES: VehicleModel[] = [
  { make: 'Toyota', model: 'Prius', generations: ['2015-2019', '2020-2024'] },
  { make: 'Toyota', model: 'Aqua', generations: ['2015-2019', '2020-2024'] },
  { make: 'Toyota', model: 'Axio', generations: ['2015-2019', '2020-2024'] },
  { make: 'Honda', model: 'Vezel', generations: ['2015-2019', '2020-2024'] },
  { make: 'Honda', model: 'Fit', generations: ['2015-2019', '2020-2024'] },
  { make: 'Nissan', model: 'Leaf', generations: ['2015-2019', '2020-2024'] },
  { make: 'Suzuki', model: 'Wagon R', generations: ['2015-2019', '2020-2024'] },
  { make: 'Suzuki', model: 'Alto', generations: ['2015-2019', '2020-2024'] },
  { make: 'BMW', model: '3 Series', generations: ['2015-2019', '2020-2024'] },
  { make: 'Mercedes-Benz', model: 'C-Class', generations: ['2015-2019', '2020-2024'] },
]

/**
 * Generate buying guide using OpenAI
 */
async function generateGuideContent(make: string, model: string, context: string): Promise<{ compact: string; detailed: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0.3, // Low temperature for consistent, factual output
      max_completion_tokens: 400,
      messages: [
        {
          role: 'system',
          content: `You are generating concise vehicle buying guides for Sri Lankan users.

Rules:
- Output format: valid HTML only
- Word limit: maximum 150 words
- Tone: completely neutral, factual, and technical
- Forbidden: hype language, sales talk, adjectives of persuasion, enthusiasm, filler words, exclamation marks, opinions, or emotion
- Sentences must be short, precise, and information-dense
- Contextualise to Sri Lankan conditions (roads, climate, resale, fuel quality) only when relevant
- Return the HTML snippet only. No headings, introductions, disclaimers, or commentary.`
        },
        {
          role: 'user',
          content: `Generate a buying guide for ${make} ${model} ${context} in Sri Lanka.

Structure:
<p>Two-line overview of the vehicle's general reputation and suitability for Sri Lanka.</p>
<ul>
  <li><strong>Engine:</strong> Specific mechanical checks or warning signs.</li>
  <li><strong>Body:</strong> Physical inspection points for wear, rust, or damage.</li>
  <li><strong>Documents:</strong> Papers to confirm authenticity and transferability.</li>
  <li><strong>Test Drive:</strong> Key aspects to observe while driving.</li>
</ul>`
        }
      ],
    })

    const text = completion.choices[0]?.message?.content || ''

    // Clean up markdown formatting
    let cleanedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '<em>$1</em>')

    // Generate detailed version
    const detailedContent = `
      ${cleanedText}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Additional verification steps:</strong></p>
        <ul style="font-size: 0.9rem; color: #666;">
          <li>Request independent mechanical inspection before finalizing purchase agreement.</li>
          <li>Cross-reference odometer reading with service records and wear indicators (pedal rubber, seat bolster, steering wheel).</li>
          <li>Confirm absence of finance liens or legal encumbrances via Department of Motor Traffic records.</li>
          <li>Compare asking price against recent market transactions for identical specification and condition.</li>
        </ul>
      </div>`

    return {
      compact: cleanedText,
      detailed: detailedContent
    }
  } catch (error) {
    console.error(`Error generating guide for ${make} ${model}:`, error)
    throw error
  }
}

/**
 * Generate and cache guide for a specific vehicle
 */
async function generateAndCacheGuide(
  make: string,
  model: string,
  year?: number,
  generation?: string
): Promise<boolean> {
  try {
    // Determine context and cache key
    let context = ''
    let cacheKey = ''
    let specificity = 0

    if (year) {
      context = `(${year} model)`
      cacheKey = generateGuideCacheKey(make, model, year)
      specificity = 2
    } else if (generation) {
      context = `(${generation} generation)`
      const makeKey = make.toLowerCase().replace(/[\s-]/g, '_')
      const modelKey = model.toLowerCase().replace(/[\s-]/g, '_')
      cacheKey = `guide:${makeKey}:${modelKey}:gen_${generation}`
      specificity = 1
    } else {
      context = ''
      cacheKey = generateGuideCacheKey(make, model)
      specificity = 0
    }

    console.log(`Generating guide: ${make} ${model} ${context}...`)

    // Generate content
    const { compact, detailed } = await generateGuideContent(make, model, context)

    // Cache in database
    const success = await setCachedGuide(
      cacheKey,
      {
        make,
        model,
        year,
        generation,
        compact,
        detailed
      },
      specificity
    )

    if (success) {
      console.log(`✅ Cached guide: ${cacheKey}`)
    } else {
      console.error(`❌ Failed to cache guide: ${cacheKey}`)
    }

    return success
  } catch (error) {
    console.error(`Error processing ${make} ${model}:`, error)
    return false
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('Starting buying guide generation...')
  console.log(`Generating guides for ${POPULAR_VEHICLES.length} vehicle models\n`)

  let successCount = 0
  let failCount = 0

  for (const vehicle of POPULAR_VEHICLES) {
    // Generate general guide
    const generalSuccess = await generateAndCacheGuide(
      vehicle.make,
      vehicle.model
    )
    if (generalSuccess) successCount++
    else failCount++

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000))

    // Generate generation-specific guides
    if (vehicle.generations) {
      for (const generation of vehicle.generations) {
        const genSuccess = await generateAndCacheGuide(
          vehicle.make,
          vehicle.model,
          undefined,
          generation
        )
        if (genSuccess) successCount++
        else failCount++

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    // Generate year-specific guides
    if (vehicle.years) {
      for (const year of vehicle.years) {
        const yearSuccess = await generateAndCacheGuide(
          vehicle.make,
          vehicle.model,
          year
        )
        if (yearSuccess) successCount++
        else failCount++

        // Delay between requests
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log(`Generation complete!`)
  console.log(`✅ Success: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log('='.repeat(50))
}

// Run the script
main().catch(console.error)
