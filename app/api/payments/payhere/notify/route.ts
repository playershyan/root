import { NextRequest, NextResponse } from 'next/server'
import { PayHereService } from '@/lib/payments/payhereService'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const formData = new URLSearchParams(body)
    const notificationData: Record<string, string> = {}
    
    // Convert form data to object
    for (const [key, value] of formData.entries()) {
      notificationData[key] = value
    }

    console.log('PayHere notification received:', notificationData)

    // Handle payment success
    await PayHereService.handlePaymentSuccess(notificationData)

    return NextResponse.json({ status: 'OK' })
  } catch (error: any) {
    console.error('PayHere notification error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'