import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { searchContext } = await request.json()

    if (!searchContext) {
      return NextResponse.json({ error: 'Search context is required' }, { status: 400 })
    }

    const prompt = `Create a car buying guide for ${searchContext} vehicles in Sri Lanka. Structure it EXACTLY as follows:

[COMPACT_START]
Write a brief 2-sentence overview in a <p> tag, then create 3-4 key inspection points in a proper <ul> with <li> tags. Each inspection point should be complete and specific. Format exactly like this example:
<p>Brief overview here.</p>
<ul>
<li>Specific thing to check with details</li>
<li>Another specific check with details</li>
</ul>
Keep under 100 words total.
[COMPACT_END]

[DETAILED_START]
Create a guide with these EXACT sections. Use proper HTML formatting with <ul> and <li> tags for all bullet points. Each bullet point must provide specific, actionable information that could save the buyer money or prevent problems:

<h3>Why Choose This Vehicle in Sri Lanka</h3>
<ul>
<li>Write exactly 3 bullet points in proper <li> tags</li>
</ul>
Each must explain a specific advantage relevant to Sri Lankan conditions (climate, roads, parts availability, resale value, fuel costs, etc.). Include specific details like "fuel consumption of X km/L" or "parts readily available at Y locations" when applicable.

<h3>Critical Things to Inspect</h3>
<ul>
<li>Write exactly 5 bullet points in proper <li> tags</li>
</ul>
Focus on the most expensive potential problems specific to this vehicle model. Each point must include: what to check, what warning signs look like, and why it matters financially. Example: "Check air conditioning compressor - listen for grinding noises or weak cooling, as replacement costs LKR 80,000+"

<h3>Known Issues to Watch For</h3>
<ul>
<li>Write exactly 4 bullet points in proper <li> tags</li>
</ul>
List the most common expensive problems this specific vehicle model faces in Sri Lankan conditions. Include approximate repair costs when relevant and explain how to spot early warning signs.

<h3>Price & Value Insights</h3>
<ul>
<li>Write exactly 3 bullet points in proper <li> tags</li>
</ul>
Cover: typical price range for different years/conditions, what affects resale value most, and one key factor that makes this vehicle a good or poor investment in Sri Lanka.

Total word count should be 250-300 words. Be specific with numbers, costs, and actionable details. Use proper HTML structure with <ul> and <li> tags for all sections.
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
    const compactMatch = aiContent.match(/\[COMPACT_START\](.*?)\[COMPACT_END\]/s)
    const detailedMatch = aiContent.match(/\[DETAILED_START\](.*?)\[DETAILED_END\]/s)

    const compactContent = compactMatch ? compactMatch[1].trim() : ''
    const detailedContent = detailedMatch ? detailedMatch[1].trim() : ''

    // Fallback if parsing fails
    if (!compactContent && !detailedContent) {
      return NextResponse.json({ 
        compact: aiContent.substring(0, 200) + '...', 
        detailed: aiContent 
      })
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