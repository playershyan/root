import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function generateVehicleDescriptionWithOpenAI(
  make: string,
  model: string,
  year: string | number,
  mileage?: string | number,
  fuelType?: string,
  transmission?: string,
  condition?: string,
  style: 'professional' | 'personal' | 'detailed' | 'urgent' = 'professional'
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('OpenAI API key not configured')
  }

  const stylePrompts = {
    professional: 'Write a professional, business-like description that highlights the vehicle\'s value proposition and reliability.',
    personal: 'Write a friendly, personal description as if the owner is talking directly to a potential buyer.',
    detailed: 'Write a comprehensive, detailed description covering all aspects of the vehicle, specifications, and features.',
    urgent: 'Write an urgent, compelling description that creates a sense of urgency and highlights why this is a great deal.'
  }

  const prompt = `Write a compelling vehicle listing description for a ${year} ${make} ${model}.

Vehicle Details:
- Make: ${make}
- Model: ${model}
- Year: ${year}
- Mileage: ${mileage ? `${mileage} km` : 'Not specified'}
- Fuel Type: ${fuelType || 'Not specified'}
- Transmission: ${transmission || 'Not specified'}
- Condition: ${condition || 'Not specified'}

Style: ${stylePrompts[style]}

Requirements:
- Write 2-3 paragraphs (150-250 words)
- Include key selling points
- Mention fuel efficiency if applicable
- Use attractive language that appeals to buyers
- End with a call to action
- Write for the Sri Lankan market
- Be honest but compelling
- Focus on value and benefits

Do not include price information, contact details, or location details as these will be added separately.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are an expert automotive copywriter specializing in vehicle listings for the Sri Lankan market. Write compelling, honest descriptions that help vehicles sell."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    })

    const description = completion.choices[0]?.message?.content?.trim()

    if (!description) {
      throw new Error('No description generated')
    }

    return description
  } catch (error) {
    console.error('OpenAI API Error:', error)
    throw new Error('Failed to generate description with OpenAI')
  }
}