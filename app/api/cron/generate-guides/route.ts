/**
 * Vercel Cron endpoint for generating buying guides
 * Scheduled to run weekly
 *
 * Configure in vercel.json:
 * "crons": [{
 *   "path": "/api/cron/generate-guides",
 *   "schedule": "0 0 * * 0"
 * }]
 */

import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { setCachedGuide } from '@/lib/services/guideCache'
import { generateGuideCacheKey } from '@/lib/utils/vehicleExtraction'

// Verify cron secret to prevent unauthorized access
function verifyCronAuth(request: Request): boolean {
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret) {
    console.warn('CRON_SECRET not configured')
    return true // Allow in development
  }

  return authHeader === `Bearer ${cronSecret}`
}

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

interface VehicleModel {
  make: string
  model: string
  generations?: string[]
}

const POPULAR_VEHICLES: VehicleModel[] = [
  { make: 'Toyota', model: 'Prius', generations: ['2015-2019', '2020-2024'] },
  { make: 'Toyota', model: 'Aqua', generations: ['2015-2019', '2020-2024'] },
  { make: 'Toyota', model: 'Axio', generations: ['2015-2019', '2020-2024'] },
  { make: 'Honda', model: 'Vezel', generations: ['2015-2019', '2020-2024'] },
  { make: 'Honda', model: 'Fit', generations: ['2015-2019', '2020-2024'] },
  { make: 'Nissan', model: 'Leaf', generations: ['2015-2019', '2020-2024'] },
  { make: 'Suzuki', model: 'Wagon R', generations: ['2015-2019', '2020-2024'] },
  { make: 'Suzuki', model: 'Alto', generations: ['2015-2019', '2020-2024'] },
]

async function generateGuideContent(make: string, model: string, context: string) {
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.3,
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
  let cleanedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  cleanedText = cleanedText.replace(/\*(.*?)\*/g, '<em>$1</em>')

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

  return { compact: cleanedText, detailed: detailedContent }
}

export async function GET(request: Request) {
  // Verify authorization
  if (!verifyCronAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  console.log('Starting scheduled guide generation...')

  let successCount = 0
  let failCount = 0

  try {
    for (const vehicle of POPULAR_VEHICLES) {
      // Generate general guide
      try {
        const cacheKey = generateGuideCacheKey(vehicle.make, vehicle.model)
        const { compact, detailed } = await generateGuideContent(
          vehicle.make,
          vehicle.model,
          ''
        )

        await setCachedGuide(
          cacheKey,
          {
            make: vehicle.make,
            model: vehicle.model,
            compact,
            detailed
          },
          0
        )
        successCount++
      } catch (error) {
        console.error(`Failed to generate guide for ${vehicle.make} ${vehicle.model}:`, error)
        failCount++
      }

      // Generate generation-specific guides
      if (vehicle.generations) {
        for (const generation of vehicle.generations) {
          try {
            const makeKey = vehicle.make.toLowerCase().replace(/[\s-]/g, '_')
            const modelKey = vehicle.model.toLowerCase().replace(/[\s-]/g, '_')
            const cacheKey = `guide:${makeKey}:${modelKey}:gen_${generation}`

            const { compact, detailed } = await generateGuideContent(
              vehicle.make,
              vehicle.model,
              `(${generation} generation)`
            )

            await setCachedGuide(
              cacheKey,
              {
                make: vehicle.make,
                model: vehicle.model,
                generation,
                compact,
                detailed
              },
              1
            )
            successCount++
          } catch (error) {
            console.error(`Failed to generate guide for ${vehicle.make} ${vehicle.model} ${generation}:`, error)
            failCount++
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      generated: successCount,
      failed: failCount,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Guide generation cron failed:', error)
    return NextResponse.json(
      { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
