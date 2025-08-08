import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { searchContext } = await request.json()

    if (!searchContext) {
      return NextResponse.json({ error: 'Search context is required' }, { status: 400 })
    }

    const prompt = `Create a buyer-friendly car guide for ${searchContext} vehicles in Sri Lanka. Make it encouraging and helpful, not scary. Structure it EXACTLY as follows:

[COMPACT_START]
Write a positive 2-sentence overview about why this vehicle is a great choice, then list 4 simple things to check when buying:
<p style="color: #2563eb; font-weight: 500;">Why this vehicle is popular and what makes it a smart choice for Sri Lankan buyers.</p>
<ul style="margin-top: 0.5rem;">
<li style="margin-bottom: 0.3rem;"><strong>Engine:</strong> Key area to inspect and what good condition looks like</li>
<li style="margin-bottom: 0.3rem;"><strong>Transmission:</strong> Important system to check and signs of good maintenance</li>
<li style="margin-bottom: 0.3rem;"><strong>Air Conditioning:</strong> Critical component to verify and what to look for</li>
<li style="margin-bottom: 0.3rem;"><strong>Documents:</strong> Essential paperwork to check and why they matter</li>
</ul>
Keep it simple, positive, and under 100 words total.
[COMPACT_END]

[DETAILED_START]
Create well-formatted sections that are easy to read and encouraging:

<div style="margin-bottom: 2rem;">
<h3 style="color: #059669; font-size: 1.1rem; margin-bottom: 0.8rem; border-bottom: 2px solid #d1fae5; padding-bottom: 0.3rem;">Why This Vehicle Shines</h3>
<div style="background: #f0fdf4; padding: 1rem; border-radius: 0.5rem; margin-bottom: 1rem;">
<ul style="margin: 0; padding-left: 1.2rem;">
<li style="margin-bottom: 0.5rem;">Key benefit that makes ownership enjoyable</li>
<li style="margin-bottom: 0.5rem;">What Sri Lankan owners love about this vehicle</li>
<li style="margin-bottom: 0.5rem;">Why it holds its value well in our market</li>
</ul>
</div>
</div>

<div style="margin-bottom: 2rem;">
<h3 style="color: #0369a1; font-size: 1.1rem; margin-bottom: 0.8rem; border-bottom: 2px solid #dbeafe; padding-bottom: 0.3rem;">Smart Inspection Guide</h3>
<div style="background: #f8fafc; padding: 1rem; border-radius: 0.5rem;">
<p style="margin-bottom: 1rem; font-weight: 500;">Check these areas to make a confident purchase:</p>
<ul style="margin: 0; padding-left: 1.2rem;">
<li style="margin-bottom: 0.8rem;"><strong>Engine & Performance:</strong> What good running condition sounds and feels like</li>
<li style="margin-bottom: 0.8rem;"><strong>Body & Interior:</strong> Signs of proper care and maintenance</li>
<li style="margin-bottom: 0.8rem;"><strong>Electrical Systems:</strong> Simple checks to ensure everything works</li>
<li style="margin-bottom: 0.8rem;"><strong>Documentation:</strong> Papers that give you peace of mind</li>
</ul>
</div>
</div>

<div style="margin-bottom: 2rem;">
<h3 style="color: #7c2d12; font-size: 1.1rem; margin-bottom: 0.8rem; border-bottom: 2px solid #fed7aa; padding-bottom: 0.3rem;">Value & Negotiation</h3>
<div style="background: #fffbeb; padding: 1rem; border-radius: 0.5rem;">
<ul style="margin: 0; padding-left: 1.2rem;">
<li style="margin-bottom: 0.5rem;">Sweet spot for age and mileage combinations</li>
<li style="margin-bottom: 0.5rem;">Fair negotiation points based on condition</li>
<li style="margin-bottom: 0.5rem;">Features that add or preserve value</li>
</ul>
</div>
</div>

Use friendly language, avoid scary numbers, focus on positive outcomes and smart buying decisions.
[DETAILED_END]

Use the exact [COMPACT_START], [COMPACT_END], [DETAILED_START], [DETAILED_END] markers to separate the sections.`

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-goog-api-key': process.env.GEMINI_API_KEY || ''
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }]
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Gemini API error:', response.status, errorText)
      throw new Error(`Gemini API failed: ${response.status}`)
    }

    const data = await response.json()
    const aiContent = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    if (!aiContent) {
      throw new Error('No content received from AI')
    }

    // Parse compact and detailed sections
    const compactMatch = aiContent.match(/\[COMPACT_START\]([\s\S]*?)\[COMPACT_END\]/)
    const detailedMatch = aiContent.match(/\[DETAILED_START\]([\s\S]*?)\[DETAILED_END\]/)

    let compactContent = compactMatch ? compactMatch[1].trim() : ''
    let detailedContent = detailedMatch ? detailedMatch[1].trim() : ''

    // Fallback parsing if markers are missing
    if (!compactContent && !detailedContent) {
      // Try to extract first paragraph and list as compact
      const paragraphMatch = aiContent.match(/<p[^>]*>(.*?)<\/p>/)
      const listMatch = aiContent.match(/<ul[^>]*>([\s\S]*?)<\/ul>/)
      
      if (paragraphMatch && listMatch) {
        compactContent = `${paragraphMatch[0]}${listMatch[0]}`
        detailedContent = aiContent
      } else {
        // Ultimate fallback
        compactContent = aiContent.substring(0, 300) + '...'
        detailedContent = aiContent
      }
    }

    // Clean up formatting and remove duplications
    if (compactContent) {
      // Fix bold formatting in compact content
      compactContent = compactContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Remove disclaimer from compact if it appears
      compactContent = compactContent.replace(/<p[^>]*font-size:\s*0\.75rem[^>]*>.*?Disclaimer:.*?<\/p>/gi, '')
    }
    
    if (detailedContent) {
      // Fix bold formatting in detailed content  
      detailedContent = detailedContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      
      // Ensure detailed content doesn't duplicate compact content
      if (compactContent && detailedContent.includes(compactContent.replace(/<[^>]*>/g, ''))) {
        // Remove the compact portion from detailed to prevent duplication
        const compactText = compactContent.replace(/<[^>]*>/g, '').trim()
        detailedContent = detailedContent.replace(compactText, '').trim()
        // Clean up any remaining duplicate disclaimers
        detailedContent = detailedContent.replace(/(<p[^>]*font-size:\s*0\.75rem[^>]*>.*?Disclaimer:.*?<\/p>\s*){2,}/gi, 
          '<p style="font-size: 0.75rem; font-style: italic; color: #666; margin-bottom: 1.5rem;">Disclaimer: This is AI-generated content and may contain inaccuracies. Always verify information independently. Details may not apply to all grades, generations, or model variants. By using this information, you agree to our terms and conditions and acknowledge that all purchasing decisions are your responsibility.</p>')
      }
      
      // If detailed becomes too short after removal, use the full content
      if (detailedContent.length < 200) {
        detailedContent = aiContent.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      }
    }

    return NextResponse.json({ 
      compact: compactContent, 
      detailed: detailedContent 
    })
    
  } catch (error) {
    console.error('AI Guide generation failed:', error)
    return NextResponse.json(
      { error: 'Failed to generate AI guide', details: error instanceof Error ? error.message : 'Unknown error' }, 
      { status: 500 }
    )
  }
}