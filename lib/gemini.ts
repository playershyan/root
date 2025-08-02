import { GoogleGenerativeAI } from '@google/generative-ai'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)

// Get the model
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

export async function generateVehicleDescription(
  make: string,
  model: string,
  year: number,
  mileage: number,
  fuel_type: string,
  transmission: string,
  additionalInfo?: string
): Promise<string> {
  const prompt = `Generate a compelling and honest vehicle listing description for:
    - Make: ${make}
    - Model: ${model}
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
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating description:', error)
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
    const response = await result.response
    return response.text()
  } catch (error) {
    console.error('Error generating summary:', error)
    return title // Fallback to title if generation fails
  }
}
