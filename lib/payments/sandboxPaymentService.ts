import { PromotionService, PromotionType } from '@/lib/services/promotionService'
import { logger } from '@/lib/utils/logger'
import { randomUUID } from 'crypto'

export interface SandboxPaymentData {
  listingId: string
  promotionTypes: PromotionType[]
  customerEmail: string
  customerName: string
  customerPhone: string
  scenario?: 'success' | 'failure' | 'delayed' | 'partial'
  delay?: number // Delay in milliseconds for delayed scenario
}

export interface SandboxPaymentResponse {
  success: boolean
  orderId: string
  transactionId: string
  message: string
  paymentData?: any
}

export class SandboxPaymentService {
  /**
   * Check if sandbox mode is enabled
   * In production, only enabled if PAYMENT_SANDBOX_MODE=true is explicitly set
   * In development, enabled by default
   */
  static isSandboxMode(): boolean {
    // Explicitly check for production environment
    const isProduction = process.env.NODE_ENV === 'production'
    
    // In production, only enable if explicitly set
    if (isProduction) {
      return process.env.PAYMENT_SANDBOX_MODE === 'true'
    }
    
    // In development, enable by default or if explicitly set
    return process.env.PAYMENT_SANDBOX_MODE !== 'false'
  }

  /**
   * Process a sandbox payment
   */
  static async processPayment(data: SandboxPaymentData): Promise<SandboxPaymentResponse> {
    // Generate a readable order ID for logging/tracking
    const orderId = `SANDBOX-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`
    // Generate a proper UUID for payment_id (required by database)
    const transactionId = randomUUID()
    
    const scenario = data.scenario || 'success'
    
    logger.info('Sandbox payment processing', { 
      orderId, 
      listingId: data.listingId, 
      scenario,
      promotionTypes: data.promotionTypes 
    })

    // Simulate delay if specified
    if (data.delay) {
      await this.delay(data.delay)
    }

    // Handle different payment scenarios
    switch (scenario) {
      case 'success':
        return await this.handleSuccessPayment(data, orderId, transactionId)
      
      case 'failure':
        return {
          success: false,
          orderId,
          transactionId,
          message: 'Payment failed: Insufficient funds (Sandbox)'
        }
      
      case 'delayed':
        // Simulate delayed payment processing
        await this.delay(3000)
        return await this.handleSuccessPayment(data, orderId, transactionId)
      
      case 'partial':
        return {
          success: false,
          orderId,
          transactionId,
          message: 'Payment partially processed (Sandbox)'
        }
      
      default:
        return await this.handleSuccessPayment(data, orderId, transactionId)
    }
  }

  /**
   * Handle successful payment
   */
  private static async handleSuccessPayment(
    data: SandboxPaymentData,
    orderId: string,
    transactionId: string
  ): Promise<SandboxPaymentResponse> {
    try {
      // Create promotions for the listing
      const { error } = await PromotionService.createPromotionBundle(
        data.listingId,
        data.promotionTypes,
        transactionId
      )

      if (error) {
        logger.error('Failed to create promotions in sandbox', error as Error)
        return {
          success: false,
          orderId,
          transactionId,
          message: `Payment succeeded but promotion activation failed: ${error.message}`
        }
      }

      logger.info('Sandbox payment successful', { 
        orderId, 
        transactionId, 
        listingId: data.listingId 
      })

      return {
        success: true,
        orderId,
        transactionId,
        message: 'Payment processed successfully (Sandbox)',
        paymentData: {
          amount: PromotionService.calculateBundlePrice(data.promotionTypes),
          promotionTypes: data.promotionTypes,
          listingId: data.listingId
        }
      }
    } catch (error) {
      logger.error('Error processing sandbox payment', error as Error)
      return {
        success: false,
        orderId,
        transactionId,
        message: `Payment processing error: ${(error as Error).message}`
      }
    }
  }

  /**
   * Simulate payment delay
   */
  private static delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get test scenarios
   */
  static getTestScenarios(): Array<{
    id: string
    name: string
    description: string
    icon: string
  }> {
    return [
      {
        id: 'success',
        name: 'Successful Payment',
        description: 'Simulates a successful payment and promotion activation',
        icon: '✅'
      },
      {
        id: 'failure',
        name: 'Payment Failure',
        description: 'Simulates a failed payment (e.g., insufficient funds)',
        icon: '❌'
      },
      {
        id: 'delayed',
        name: 'Delayed Processing',
        description: 'Simulates a delayed payment processing (3 seconds)',
        icon: '⏳'
      },
      {
        id: 'partial',
        name: 'Partial Processing',
        description: 'Simulates a partially processed payment',
        icon: '⚠️'
      }
    ]
  }
}

