import { NextResponse } from 'next/server'
import { generateVehicleDescription } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { make, model, year, mileage, fuel_type, transmission, additionalInfo } = body

    if (!make || !model || !year) {
      return NextResponse.json(
        { error: 'Make, model, and year are required' },
        { status: 400 }
      )
    }

    const description = await generateVehicleDescription(
      make,
      model,
      year,
      mileage || 0,
      fuel_type || 'Unknown',
      transmission || 'Unknown',
      additionalInfo
    )

    return NextResponse.json({ description })
  } catch (error) {
    console.error('AI Description Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate description' },
      { status: 500 }
    )
  }
}
