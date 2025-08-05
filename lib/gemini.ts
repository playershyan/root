import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI with the correct model
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Use the correct model name for the new API
const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })

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
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    return text
  } catch (error: any) {
    console.error('Error generating description:', error)
    
    // More detailed error logging
    if (error.message?.includes('API key')) {
      return 'API key error. Please check your Gemini API key.'
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
    const result = await model.generateContent(prompt)
    const response = result.response
    const text = response.text()
    return text
  } catch (error: any) {
    console.error('Error generating summary:', error)
    return title // Fallback to title if generation fails
  }
}