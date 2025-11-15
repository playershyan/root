import { PromotionService, PromotionType } from '@/lib/services/promotionService'
import { logger } from '@/lib/utils/logger'
import { randomUUID } from 'crypto'
import type { SupabaseClient } from '@supabase/supabase-js'

export interface SandboxPaymentData {
  listingId: string
  promotionTypes: PromotionType[]
  customerEmail: string
  customerName: string
  customerPhone: string
  scenario?: 'success' | 'failure' | 'delayed' | 'partial'
  delay?: number // Delay in milliseconds for delayed scenario
  entityType?: 'listing' | 'wanted' // Support both listings and wanted requests
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
  static async processPayment(data: SandboxPaymentData, supabaseClient?: SupabaseClient): Promise<SandboxPaymentResponse> {
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
        return await this.handleSuccessPayment(data, orderId, transactionId, supabaseClient)
      
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
        return await this.handleSuccessPayment(data, orderId, transactionId, supabaseClient)
      
      case 'partial':
        return {
          success: false,
          orderId,
          transactionId,
          message: 'Payment partially processed (Sandbox)'
        }
      
      default:
        return await this.handleSuccessPayment(data, orderId, transactionId, supabaseClient)
    }
  }

  /**
   * Handle successful payment
   */
  private static async handleSuccessPayment(
    data: SandboxPaymentData,
    orderId: string,
    transactionId: string,
    supabaseClient?: SupabaseClient
  ): Promise<SandboxPaymentResponse> {
    try {
      if (!supabaseClient) {
        throw new Error('Supabase client is required for payment processing')
      }

      // Handle wanted requests differently (they use is_high_priority instead of promotions table)
      if (data.entityType === 'wanted') {
        // For wanted requests, "urgent" promotion sets high priority
        const hasUrgent = data.promotionTypes.includes('urgent')
        
        if (hasUrgent) {
          // Set high priority for 5 days (urgent promotion duration)
          const expiresAt = new Date()
          expiresAt.setDate(expiresAt.getDate() + 5)
          
          const { error: updateError } = await supabaseClient
            .from('wanted_requests')
            .update({
              is_high_priority: true,
              high_priority_until: expiresAt.toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('id', data.listingId)

          if (updateError) {
            logger.error('Failed to set high priority for wanted request', updateError as Error)
            return {
              success: false,
              orderId,
              transactionId,
              message: `Payment succeeded but high priority activation failed: ${updateError.message}`
            }
          }

          logger.info('Sandbox payment successful for wanted request', { 
            orderId, 
            transactionId, 
            requestId: data.listingId,
            highPriorityUntil: expiresAt.toISOString()
          })

          return {
            success: true,
            orderId,
            transactionId,
            message: 'Payment processed successfully (Sandbox)',
            paymentData: {
              amount: PromotionService.calculateBundlePrice(data.promotionTypes),
              promotionTypes: data.promotionTypes,
              listingId: data.listingId,
              entityType: 'wanted'
            }
          }
        } else {
          // For wanted requests without urgent, just log success (other promotions not yet implemented)
          logger.info('Sandbox payment successful for wanted request (no urgent)', { 
            orderId, 
            transactionId, 
            requestId: data.listingId 
          })

          return {
            success: true,
            orderId,
            transactionId,
            message: 'Payment processed successfully (Sandbox)',
            paymentData: {
              amount: PromotionService.calculateBundlePrice(data.promotionTypes),
              promotionTypes: data.promotionTypes,
              listingId: data.listingId,
              entityType: 'wanted'
            }
          }
        }
      } else {
        // Handle listings (existing logic)
        // Check for existing active promotions before creating new ones
        const { data: activePromotions, error: checkError } = await supabaseClient
          .from('promotions')
          .select('id, promotion_type')
          .eq('listing_id', data.listingId)
          .eq('is_active', true)
          .gt('expires_at', new Date().toISOString())

        if (checkError) {
          logger.error('Failed to check active promotions', checkError as Error)
          return {
            success: false,
            orderId,
            transactionId,
            message: `Failed to check existing promotions: ${checkError.message}`
          }
        }

        if (activePromotions && activePromotions.length > 0) {
          const activeFeatureNames = activePromotions.map(p => p.promotion_type).join(', ')
          logger.warn('Attempted to add promotion to listing with active features', {
            listingId: data.listingId,
            activeFeatures: activeFeatureNames
          })
          return {
            success: false,
            orderId,
            transactionId,
            message: `This listing already has active paid features (${activeFeatureNames}). Only one paid feature can be active at a time.`
          }
        }

        // Create promotions for the listing with authenticated client
        const { error } = await PromotionService.createPromotionBundle(
          data.listingId,
          data.promotionTypes,
          transactionId,
          supabaseClient
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

