import crypto from 'crypto'
import { PromotionService, PromotionType } from '@/lib/services/promotionService'

export interface PayHerePaymentData {
  listingId: string
  promotionTypes: PromotionType[]
  customerEmail: string
  customerName: string
  customerPhone: string
  returnUrl?: string
  cancelUrl?: string
  notifyUrl?: string
}

export interface PayHereConfig {
  merchantId: string
  merchantSecret: string
  currency: string
  sandbox?: boolean
}

export class PayHereService {
  private static config: PayHereConfig = {
    merchantId: process.env.PAYHERE_MERCHANT_ID!,
    merchantSecret: process.env.PAYHERE_MERCHANT_SECRET!,
    currency: process.env.PAYHERE_CURRENCY || 'LKR',
    sandbox: process.env.NODE_ENV !== 'production',
  }

  /**
   * Generate PayHere payment form data
   */
  static generatePaymentForm(data: PayHerePaymentData): Record<string, string> {
    const orderId = `PROMO-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const amount = PromotionService.calculateBundlePrice(data.promotionTypes)
    
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    
    const formData = {
      merchant_id: this.config.merchantId,
      return_url: data.returnUrl || `${baseUrl}/payment/success`,
      cancel_url: data.cancelUrl || `${baseUrl}/payment/cancel`,
      notify_url: data.notifyUrl || `${baseUrl}/api/payments/payhere/notify`,
      order_id: orderId,
      items: `AutoTrader.lk Promotion - ${data.promotionTypes.join(', ')}`,
      currency: this.config.currency,
      amount: amount.toString(),
      first_name: data.customerName.split(' ')[0] || data.customerName,
      last_name: data.customerName.split(' ').slice(1).join(' ') || '',
      email: data.customerEmail,
      phone: data.customerPhone,
      address: '',
      city: 'Colombo',
      country: 'Sri Lanka',
      // Custom fields to track our data
      custom_1: data.listingId,
      custom_2: data.promotionTypes.join(','),
    }

    // Generate hash
    const hash = this.generateHash(formData)
    
    return {
      ...formData,
      hash,
    }
  }

  /**
   * Generate PayHere hash for security
   */
  private static generateHash(data: Record<string, string>): string {
    const {
      merchant_id,
      order_id,
      amount,
      currency,
      merchant_secret = this.config.merchantSecret,
    } = data

    const hashString = `${merchant_id}${order_id}${amount}${currency}${crypto
      .createHash('md5')
      .update(merchant_secret)
      .digest('hex')
      .toUpperCase()}`

    return crypto.createHash('md5').update(hashString).digest('hex').toUpperCase()
  }

  /**
   * Verify PayHere notification
   */
  static verifyNotification(notificationData: Record<string, string>): boolean {
    const {
      merchant_id,
      order_id,
      amount,
      currency,
      status_code,
      md5sig,
    } = notificationData

    const localHash = crypto
      .createHash('md5')
      .update(
        `${merchant_id}${order_id}${amount}${currency}${status_code}${crypto
          .createHash('md5')
          .update(this.config.merchantSecret)
          .digest('hex')
          .toUpperCase()}`
      )
      .digest('hex')
      .toUpperCase()

    return localHash === md5sig
  }

  /**
   * Handle successful PayHere payment
   */
  static async handlePaymentSuccess(notificationData: Record<string, string>): Promise<void> {
    try {
      if (!this.verifyNotification(notificationData)) {
        throw new Error('Payment notification verification failed')
      }

      const { status_code, custom_1: listingId, custom_2: promotionTypesStr, order_id } = notificationData

      // PayHere status codes: 2 = success, others = failure
      if (status_code === '2') {
        const promotionTypes = promotionTypesStr.split(',') as PromotionType[]

        // Create promotions for the listing
        await PromotionService.createPromotionBundle(
          listingId,
          promotionTypes,
          order_id
        )

        // Log successful payment
        console.log(`PayHere payment successful: ${order_id} for listing ${listingId}`)
      } else {
        console.log(`PayHere payment failed with status: ${status_code}`)
      }
    } catch (error) {
      console.error('Error handling PayHere payment success:', error)
      throw error
    }
  }

  /**
   * Get PayHere payment URL
   */
  static getPaymentUrl(): string {
    return this.config.sandbox
      ? 'https://sandbox.payhere.lk/pay/checkout'
      : 'https://www.payhere.lk/pay/checkout'
  }
}

// React component for PayHere payment form
export const PayHerePaymentForm = ({ 
  paymentData, 
  onSubmit, 
  className = '' 
}: {
  paymentData: PayHerePaymentData
  onSubmit?: () => void
  className?: string
}) => {
  const formData = PayHereService.generatePaymentForm(paymentData)
  
  const handleSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      e.preventDefault()
      onSubmit()
    }
    // Form will submit to PayHere automatically
  }

  return (
    <form
      method="POST"
      action={PayHereService.getPaymentUrl()}
      onSubmit={handleSubmit}
      className={className}
    >
      {Object.entries(formData).map(([key, value]) => (
        <input
          key={key}
          type="hidden"
          name={key}
          value={value}
        />
      ))}
      <button
        type="submit"
        className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        Pay with PayHere
      </button>
    </form>
  )
}