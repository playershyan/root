import OpenAI from 'openai'
import { logger } from '@/lib/utils/logger'

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function generateVehicleDescription(
  make: string,
  model_name: string,
  year: number,
  mileage: number,
  fuel_type: string,
  transmission: string,
  additionalInfo?: string
): Promise<string> {
  const prompt = `Generate a compelling and honest vehicle listing description for:
    - Make: ${make}
    - Model: ${model_name}
    - Year: ${year}
    - Mileage: ${mileage} km
    - Fuel Type: ${fuel_type}
    - Transmission: ${transmission}
    ${additionalInfo ? `- Additional Info: ${additionalInfo}` : ''}
    
    Write a 3-4 sentence description that highlights the vehicle's key features and benefits.
    Be factual but engaging. Focus on practical benefits for Sri Lankan buyers.
    Do not include price or contact information.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You generate compelling and honest vehicle listing descriptions for Sri Lankan buyers. Be factual but engaging.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 200,
    })

    const text = completion.choices[0]?.message?.content || 'Unable to generate description.'
    return text
  } catch (error: any) {
    logger.error('Error generating description', error as Error)

    // More detailed error logging
    if (error.message?.includes('API key') || error.message?.includes('Unauthorized')) {
      return 'API key error. Please check your OpenAI API key.'
    }
    if (error.message?.includes('model')) {
      return 'Model error. The AI model may have changed.'
    }

    return 'Unable to generate description. Please try again.'
  }
}

export async function generateVehicleSummary(
  title: string,
  description: string
): Promise<string> {
  const prompt = `Create a brief 1-2 sentence summary of this vehicle listing:
    Title: ${title}
    Description: ${description}
    
    Make it concise and highlight the most important selling points.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'system',
          content: 'You create brief, concise vehicle listing summaries highlighting the most important selling points.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 100,
    })

    const text = completion.choices[0]?.message?.content || title
    return text
  } catch (error: any) {
    logger.error('Error generating summary', error as Error)
    return title // Fallback to title if generation fails
  }
}