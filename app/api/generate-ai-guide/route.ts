import { NextResponse } from 'next/server'
import { incr } from '@/lib/security/metrics'
import { logger } from '@/lib/utils/logger'
import { extractVehicleInfo, getGuideCacheKeys } from '@/lib/utils/vehicleExtraction'
import { getCachedGuide } from '@/lib/services/guideCache'

export async function POST(request: Request) {
  try {
    // Basic payload guard
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 25_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const { searchContext } = await request.json()

    if (!searchContext) {
      return NextResponse.json({
        available: false,
        message: 'AI overview not available'
      })
    }

    // Extract vehicle information from search query
    const extracted = extractVehicleInfo(searchContext)

    // If no make matched, return not available
    if (!extracted.make) {
      logger.debug('No make matched in query', { searchContext })
      incr('ai.guide.no_make_match')
      return NextResponse.json({
        available: false,
        message: 'AI overview not available'
      })
    }

    // If make matched but no model, return not available
    if (!extracted.model) {
      logger.debug('Make matched but no model', {
        searchContext,
        make: extracted.make
      })
      incr('ai.guide.no_model_match')
      return NextResponse.json({
        available: false,
        message: 'AI overview not available'
      })
    }

    // Get cache keys in priority order
    const cacheKeys = getGuideCacheKeys(
      extracted.make,
      extracted.model,
      extracted.year
    )

    logger.debug('Checking cache keys for guide', {
      make: extracted.make,
      model: extracted.model,
      year: extracted.year,
      cacheKeys
    })

    // Try to retrieve from cache
    const cachedGuide = await getCachedGuide(cacheKeys)

    if (!cachedGuide) {
      // No cached guide available - return not available
      logger.debug('No cached guide found', {
        make: extracted.make,
        model: extracted.model,
        year: extracted.year,
        cacheKeys
      })
      incr('ai.guide.cache_miss')
      return NextResponse.json({
        available: false,
        message: 'AI overview not available'
      })
    }

    // Return cached guide
    logger.debug('Returning cached guide', {
      make: cachedGuide.make,
      model: cachedGuide.model,
      year: cachedGuide.year,
      generation: cachedGuide.generation
    })
    incr('ai.guide.cache_hit')

    return NextResponse.json({
      available: true,
      make: cachedGuide.make,
      model: cachedGuide.model,
      year: cachedGuide.year,
      generation: cachedGuide.generation,
      compact: cachedGuide.compact,
      detailed: cachedGuide.detailed
    })

  } catch (error) {
    logger.error('AI Guide retrieval failed', error as Error)
    incr('ai.guide.error')

    // Return not available on error
    return NextResponse.json({
      available: false,
      message: 'AI overview not available'
    })
  }
}
