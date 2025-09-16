import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface VehicleData {
  make: string
  model: string
  trim?: string
  year: string
  registrationYear?: string
  previousOwners?: string
  mileage?: string
  interiorColor?: string
  vehicleConditionDetails?: string
  serviceRecordsAvailable?: boolean
}

export async function generateVehicleDescriptionWithOpenAI(
  vehicleData: VehicleData
): Promise<string> {
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error('OpenAI API key not configured')
  }

  // Format the input data for the prompt
  const inputData = `
Make: ${vehicleData.make || 'Not specified'}
Model: ${vehicleData.model || 'Not specified'}
Grade: ${vehicleData.trim || 'Not specified'}
Year: ${vehicleData.year || 'Not specified'}
Registration Year: ${vehicleData.registrationYear || vehicleData.year || 'Not specified'}
Previous Owners: ${vehicleData.previousOwners || 'Not specified'}
Mileage: ${vehicleData.mileage || 'Not specified'}
Interior Color: ${vehicleData.interiorColor || 'Not specified'}
Vehicle Condition: ${vehicleData.vehicleConditionDetails || 'Not specified'}
Service Records Available: ${vehicleData.serviceRecordsAvailable ? 'Yes' : 'No'}
  `.trim()

  const systemPrompt = `You are generating vehicle listing descriptions for a Sri Lankan vehicle classifieds website.
Use only the information provided in the input fields. Do not invent features, specs, or prices.
The output must follow these exact rules:

1. Format as plain text, no HTML, no Markdown.
2. Structure:
   - Line 1: <make> <model> <grade>
   - Line 2: Y.O.M: <year> | Y.O.R: <registration_year>
   - Line 3: <previous_owners> owner(s) - use "owner" for 1, "owners" for >1
   - Line 4: <mileage> km (verified)
   - Line 5: Interior: <interior_color>
   - Line 6: Condition: <vehicle_condition_details>
   - Line 7: Service Records: <service_records_available>
   - Line 8: Buyer filter line (choose randomly from: "Genuine buyers only" / "Serious inquiries only" / "Only interested buyers")

3. Wording must stay concise and factual. No hype language, no emojis, no all-caps, no marketing clichés.
4. Maintain Sri Lankan style of listings: direct, minimal, trust-oriented.
5. Slightly vary sentence phrasing across generations (for example: "Mileage: 85,000 km" vs. "85,000 km done (genuine mileage)").
6. If no value is present in any field, gracefully skip that line or use appropriate defaults.

Return only the description text, nothing else.`

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: systemPrompt
        },
        {
          role: "user",
          content: inputData
        }
      ],
      max_tokens: 200,
      temperature: 0.3, // Lower temperature for more consistent formatting
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