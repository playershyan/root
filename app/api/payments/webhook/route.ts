import { NextRequest, NextResponse } from 'next/server'
import { StripePaymentService } from '@/lib/payments/stripeService'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing Stripe signature' },
      { status: 400 }
    )
  }

  try {
    // Verify webhook signature
    const event = StripePaymentService.verifyWebhookSignature(body, signature)
    
    if (!event) {
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object as any
        await StripePaymentService.handlePaymentSuccess(paymentIntent.id)
        console.log(`Payment succeeded: ${paymentIntent.id}`)
        break

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object as any
        console.log(`Payment failed: ${failedPayment.id}`)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export const runtime = 'edge'
export const dynamic = 'force-dynamic'