import { NextRequest, NextResponse } from 'next/server'
import { PayHereService } from '@/lib/payments/payhereService'
import { logger } from '@/lib/utils/logger'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const formData = new URLSearchParams(body)
    const notificationData: Record<string, string> = {}
    
    // Convert form data to object
    formData.forEach((value, key) => {
      notificationData[key] = value
    })

    logger.info('PayHere notification received', { hasData: !!notificationData })

    // Handle payment success
    await PayHereService.handlePaymentSuccess(notificationData)

    return NextResponse.json({ status: 'OK' })
  } catch (error: any) {
    logger.error('PayHere notification error', error as Error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'