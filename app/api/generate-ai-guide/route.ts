import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { verifyRecaptcha, captchaGuardFailJson } from '@/lib/security/recaptcha'
import { incr, incrTrend } from '@/lib/security/metrics'

// Initialize OpenAI with API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

export async function POST(request: Request) {
  try {
    // Basic payload guard
    const contentLength = Number(request.headers.get('content-length') || '0')
    if (contentLength > 25_000) {
      return NextResponse.json({ error: 'Payload too large' }, { status: 413 })
    }

    const { searchContext, recaptchaToken } = await request.json()

    if (!searchContext) {
      return NextResponse.json({ error: 'Search context is required' }, { status: 400 })
    }

    // Verify reCAPTCHA (enable via RECAPTCHA_ENABLED=true)
    const forwarded = request.headers.get('x-forwarded-for')
    const ipHeader = forwarded ? forwarded.split(',')[0].trim() : request.headers.get('x-real-ip') || undefined
    const captcha = await verifyRecaptcha(recaptchaToken, ipHeader)
    if (!captcha.success || (typeof captcha.score === 'number' && captcha.score < 0.3)) {
      return captchaGuardFailJson(0.3)
    }

    // Check cache first for instant response
    const cacheKey = searchContext.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached AI guide for:', cacheKey)
      return NextResponse.json(cached.data)
    }

    // Use GPT model for fast, cost-effective generation
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
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
          content: `Generate a buying guide for ${searchContext}.

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
      temperature: 0.7,
      max_completion_tokens: 400, // Limit output for faster response
    })

    // Extract generated text
    const text = completion.choices[0]?.message?.content || ''
    
    // Clean up any markdown formatting
    let cleanedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // For detailed view, add factual procedural notes
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
    
    const responseData = { 
      compact: cleanedText,
      detailed: detailedContent
    }
    incr('ai.guide.request')

    // Cache the result for future requests
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Clean old cache entries if cache gets too large
    if (cache.size > 100) {
      const now = Date.now()
      // Convert to array for iteration to avoid TypeScript error
      Array.from(cache.entries()).forEach(([key, value]) => {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key)
        }
      })
    }

    return NextResponse.json(responseData)
    
  } catch (error) {
    console.error('AI Guide generation failed:', error)
    incr('ai.guide.error')
    await incrTrend('ai.guide.error')
    
    // Get searchContext from request body for fallback
    const { searchContext } = await request.json().catch(() => ({ searchContext: '' }))
    
    // Return neutral fallback content with technical inspection protocol
    const fallbackContent = `
      <p>Standard pre-purchase inspection protocol for ${searchContext || 'used vehicles'}. Applicable to most vehicles in Sri Lankan market conditions.</p>
      <ul>
        <li><strong>Engine:</strong> Verify compression uniformity. Check oil condition, coolant level, exhaust smoke color. Listen for irregular idle or metal-on-metal sounds.</li>
        <li><strong>Body:</strong> Inspect wheel arches, underbody, door sills for rust perforation. Check panel gaps, paint thickness variation, frame alignment.</li>
        <li><strong>Documents:</strong> Confirm vehicle registration certificate, revenue license validity, insurance coverage, service book stamps matching odometer.</li>
        <li><strong>Test Drive:</strong> Evaluate clutch bite point, gear synchronization, brake pedal feel, steering play, suspension noise over uneven surfaces.</li>
      </ul>`

    const fallbackResponse = {
      compact: fallbackContent,
      detailed: `${fallbackContent}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
          <p style="color: #666; font-size: 0.9rem;">AI guide unavailable. Generic inspection checklist provided.</p>
        </div>`
    }
    
    // Still cache the fallback to prevent repeated API failures
    const cacheKey = searchContext?.toLowerCase().trim() || 'fallback'
    cache.set(cacheKey, {
      data: fallbackResponse,
      timestamp: Date.now() - (CACHE_TTL - 300000) // Cache for 5 minutes only
    })
    
    return NextResponse.json(fallbackResponse)
  }
}
