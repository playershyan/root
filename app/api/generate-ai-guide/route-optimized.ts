import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { logger } from '@/lib/utils/logger'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_TTL = 3600000 // 1 hour

export async function POST(request: Request) {
  try {
    const { searchContext } = await request.json()

    if (!searchContext) {
      return NextResponse.json({ error: 'Search context is required' }, { status: 400 })
    }

    // Check cache first
    const cacheKey = searchContext.toLowerCase().trim()
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return NextResponse.json(cached.data)
    }

    // Use OpenAI for generation
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You generate concise HTML buying guides for vehicles in Sri Lanka. Be factual and technical.'
        },
        {
          role: 'user',
          content: `Create a quick buying guide for ${searchContext} vehicles in Sri Lanka.

Format as HTML with these sections only:
1. A 2-line overview
2. Four key inspection points (Engine, Body, Documents, Test Drive)

Keep it under 150 words total. Use <strong> tags for emphasis.
Example format:
<p>Overview sentence about the vehicle.</p>
<ul>
<li><strong>Engine:</strong> What to check</li>
<li><strong>Body:</strong> What to inspect</li>
<li><strong>Documents:</strong> What to verify</li>
<li><strong>Test Drive:</strong> What to test</li>
</ul>`
        }
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    // Extract generated text
    const text = completion.choices[0]?.message?.content || ''
    
    // Simple response without complex parsing
    const responseData = { 
      compact: text.substring(0, 500), // Quick truncation
      detailed: text // Full content for expansion
    }

    // Cache the result
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (cache.size > 100) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_TTL) {
          cache.delete(key)
        }
      }
    }

    return NextResponse.json(responseData)
    
  } catch (error) {
    logger.error('AI Guide generation failed', error as Error)

    // Return cached fallback instantly
    const fallback = {
      compact: `
        <p style="color: #2563eb;">Essential points for buying this vehicle:</p>
        <ul>
          <li><strong>Engine:</strong> Check for smooth idle and no unusual noises</li>
          <li><strong>Body:</strong> Inspect for rust, dents, and paint consistency</li>
          <li><strong>Documents:</strong> Verify ownership and service history</li>
          <li><strong>Test Drive:</strong> Test all gears and braking system</li>
        </ul>`,
      detailed: ''
    }
    
    return NextResponse.json(fallback)
  }
}

// Optional: Implement streaming response for real-time generation
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const searchContext = searchParams.get('context') || 'vehicles'
  
  // Check cache
  const cacheKey = searchContext.toLowerCase().trim()
  const cached = cache.get(cacheKey)
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json(cached.data)
  }

  const encoder = new TextEncoder()
  
  // Return streaming response
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: 'gemini-1.5-flash',
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300,
          }
        })
        
        const prompt = `Quick ${searchContext} buying tips (4 bullet points):`
        
        // Stream the response
        const result = await model.generateContentStream(prompt)
        
        for await (const chunk of result.stream) {
          const text = chunk.text()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text })}\n\n`))
        }
        
        controller.close()
      } catch (error) {
        controller.error(error)
      }
    }
  })
  
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}