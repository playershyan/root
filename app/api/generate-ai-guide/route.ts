import { NextResponse } from 'next/server'
import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini with optimized settings
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

export async function POST(request: Request) {
  try {
    const { searchContext } = await request.json()

    if (!searchContext) {
      return NextResponse.json({ error: 'Search context is required' }, { status: 400 })
    }

    // Check cache first for instant response
    const cacheKey = searchContext.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      console.log('Returning cached AI guide for:', cacheKey)
      return NextResponse.json(cached.data)
    }

    // Use faster model with optimized configuration
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-1.5-flash', // Faster than 2.0
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 400, // Limit output for faster response
      }
    })

    // Simplified, focused prompt for faster generation
    const prompt = `Create a concise buying guide for ${searchContext} vehicles in Sri Lanka.

Return HTML format with:
1. A 2-line overview paragraph about why this vehicle is a good choice
2. A list with exactly 4 inspection points

Format:
<p style="color: #2563eb; font-weight: 500;">[Brief overview of the vehicle's strengths and value]</p>
<ul style="margin-top: 0.5rem;">
<li><strong>Engine:</strong> [What to check - keep it positive and simple]</li>
<li><strong>Body & Interior:</strong> [Inspection tips]</li>
<li><strong>Documents:</strong> [What papers to verify]</li>
<li><strong>Test Drive:</strong> [What to test during driving]</li>
</ul>

Keep total under 150 words. Be encouraging and practical.`

    // Generate content
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    
    // Clean up any markdown formatting
    let cleanedText = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    cleanedText = cleanedText.replace(/\*(.*?)\*/g, '<em>$1</em>')
    
    // For detailed view, add some extra helpful content
    const detailedContent = `
      ${cleanedText}
      <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
        <p style="color: #666; font-size: 0.9rem; margin-bottom: 0.5rem;"><strong>Pro Tips:</strong></p>
        <ul style="font-size: 0.9rem; color: #666;">
          <li>Best time to negotiate is end of month when dealers have targets</li>
          <li>Always get a pre-purchase inspection from a trusted mechanic</li>
          <li>Check online reviews and owner forums for common issues</li>
          <li>Compare prices across multiple listings before making an offer</li>
        </ul>
      </div>`
    
    const responseData = { 
      compact: cleanedText,
      detailed: detailedContent
    }

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
    
    // Get searchContext from request body for fallback
    const { searchContext } = await request.json().catch(() => ({ searchContext: '' }))
    
    // Return a helpful fallback instantly instead of error
    const fallbackContent = `
      <p style="color: #2563eb; font-weight: 500;">Smart buying tips for ${searchContext || 'this vehicle'}:</p>
      <ul style="margin-top: 0.5rem;">
        <li><strong>Engine:</strong> Check for smooth idle, no unusual noises or smoke</li>
        <li><strong>Body & Interior:</strong> Inspect for rust, check seat wear and dashboard condition</li>
        <li><strong>Documents:</strong> Verify ownership papers, service records, and insurance</li>
        <li><strong>Test Drive:</strong> Test all gears, brakes, steering, and AC system</li>
      </ul>`
    
    const fallbackResponse = {
      compact: fallbackContent,
      detailed: `${fallbackContent}
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #e5e5e5;">
          <p style="color: #666; font-size: 0.9rem;"><em>AI guide temporarily unavailable. These are general inspection points.</em></p>
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