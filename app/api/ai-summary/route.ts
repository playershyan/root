import { NextResponse } from 'next/server'
import { generateVehicleSummary } from '@/lib/gemini'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { title, description } = body

    if (!title || !description) {
      return NextResponse.json(
        { error: 'Title and description are required' },
        { status: 400 }
      )
    }

    const summary = await generateVehicleSummary(title, description)

    return NextResponse.json({ summary })
  } catch (error) {
    console.error('AI Summary Error:', error)
    return NextResponse.json(
      { error: 'Failed to generate summary' },
      { status: 500 }
    )
  }
}
