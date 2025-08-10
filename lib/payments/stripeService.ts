import Stripe from 'stripe'
import { PromotionService, PromotionType, PROMOTION_PRICING } from '@/lib/services/promotionService'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-06-20',
})

export interface PaymentData {
  listingId: string
  promotionTypes: PromotionType[]
  customerEmail: string
  customerName?: string
  returnUrl?: string
}

export interface PaymentResult {
  success: boolean
  paymentIntentId?: string
  clientSecret?: string
  error?: string
}

export class StripePaymentService {
  /**
   * Create payment intent for promotion purchase
   */
  static async createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
    try {
      const totalAmount = PromotionService.calculateBundlePrice(data.promotionTypes)
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: totalAmount * 100, // Convert to cents
        currency: 'lkr',
        metadata: {
          listingId: data.listingId,
          promotionTypes: data.promotionTypes.join(','),
          customerEmail: data.customerEmail,
        },
        receipt_email: data.customerEmail,
        description: `AutoTrader.lk Promotion - ${data.promotionTypes.join(', ')}`,
      })

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret!,
      }
    } catch (error: any) {
      console.error('Stripe payment intent creation failed:', error)
      return {
        success: false,
        error: error.message,
      }
    }
  }

  /**
   * Handle successful payment webhook
   */
  static async handlePaymentSuccess(paymentIntentId: string): Promise<void> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
      
      if (paymentIntent.status === 'succeeded') {
        const { listingId, promotionTypes } = paymentIntent.metadata
        const promotionTypeArray = promotionTypes.split(',') as PromotionType[]

        // Create promotions for the listing
        await PromotionService.createPromotionBundle(
          listingId,
          promotionTypeArray,
          paymentIntentId
        )

        // Send confirmation email (implement as needed)
        // await EmailService.sendPromotionConfirmation(paymentIntent.receipt_email, ...)
      }
    } catch (error) {
      console.error('Error handling payment success:', error)
      throw error
    }
  }

  /**
   * Verify webhook signature
   */
  static verifyWebhookSignature(body: string, signature: string): Stripe.Event | null {
    try {
      return stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (error) {
      console.error('Webhook signature verification failed:', error)
      return null
    }
  }
}

// React hook for Stripe payment on the frontend
export const useStripePayment = () => {
  const initiatePayment = async (data: PaymentData) => {
    try {
      const response = await fetch('/api/payments/create-intent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error)
      }

      return result
    } catch (error) {
      console.error('Payment initiation failed:', error)
      throw error
    }
  }

  return { initiatePayment }
}