/**
 * Text.lk SMS Gateway Service for Sri Lanka
 * Documentation: https://www.text.lk/
 */

import { logger } from '@/lib/utils/logger'

interface SMSOptions {
  to: string
  message: string
  senderId?: string
  scheduleTime?: string
}

interface SMSResponse {
  success: boolean
  messageId?: string
  error?: string
  data?: any
}

interface TextLKResponse {
  status: 'success' | 'error'
  data?: any
  message?: string
}

export class TextLKService {
  private apiKey: string
  private senderId: string
  private baseUrl: string = 'https://app.text.lk/api/v3'

  constructor() {
    this.apiKey = process.env.TEXTLK_API_KEY || ''
    this.senderId = process.env.TEXTLK_SENDER_ID || 'vera.lk'

    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      logger.warn('Text.lk API key not configured. SMS will not be sent.', new Error('Missing API key'))
    }
  }

  /**
   * Send OTP via SMS
   */
  async sendOTP(phoneNumber: string, otp: string): Promise<SMSResponse> {
    const message = `Your vera.lk verification code is: ${otp}\n\nValid for 10 minutes.\n\nDo not share this code with anyone.`

    return this.sendSMS({
      to: phoneNumber,
      message,
      senderId: this.senderId
    })
  }

  /**
   * Send general SMS
   */
  async sendSMS(options: SMSOptions): Promise<SMSResponse> {
    try {
      // Check if Text.lk is configured
      if (!this.apiKey) {
        // In development, log the message
        if (process.env.NODE_ENV === 'development') {
          logger.debug('SMS (Dev Mode - Text.lk)', {
            to: options.to,
            message: options.message,
            senderId: options.senderId || this.senderId
          })
          return { success: true, messageId: 'dev-mode-' + Date.now() }
        }

        return {
          success: false,
          error: 'SMS service not configured'
        }
      }

      // Format phone number for Sri Lanka
      let formattedPhone = this.formatPhoneNumber(options.to)

      // Prepare request body
      const requestBody = {
        recipient: formattedPhone,
        sender_id: options.senderId || this.senderId,
        type: 'plain',
        message: options.message,
        ...(options.scheduleTime && { schedule_time: options.scheduleTime })
      }

      // Send SMS via Text.lk API
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success') {
        logger.info('SMS sent successfully', { phone: formattedPhone, messageId: result.data?.uid })

        // Extract message ID from response if available
        const messageId = result.data?.uid || result.data?.message_id || 'unknown'

        return {
          success: true,
          messageId,
          data: result.data
        }
      } else {
        logger.error('Text.lk SMS error', new Error(result.message || 'SMS send failed'))
        return {
          success: false,
          error: result.message || 'Failed to send SMS'
        }
      }
    } catch (error) {
      logger.error('Text.lk SMS error', error as Error)

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: false,
        error: 'Failed to send SMS'
      }
    }
  }

  /**
   * Format phone number for Sri Lankan format
   */
  private formatPhoneNumber(phoneNumber: string): string {
    // Remove any spaces, dashes, or parentheses
    let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Remove leading + if exists
    if (formatted.startsWith('+')) {
      formatted = formatted.substring(1)
    }

    // Handle Sri Lankan numbers
    if (formatted.startsWith('0')) {
      // Local Sri Lankan number (e.g., 0771234567 -> 94771234567)
      formatted = '94' + formatted.substring(1)
    } else if (!formatted.startsWith('94')) {
      // Assume Sri Lankan number without country code
      formatted = '94' + formatted
    }

    return formatted
  }

  /**
   * Validate Sri Lankan phone number
   */
  validatePhoneNumber(phoneNumber: string): boolean {
    // Remove formatting characters
    const cleaned = phoneNumber.replace(/[\s\-\(\)]/g, '')

    // Sri Lankan phone number patterns:
    // - Local: 0xxxxxxxxx (10 digits starting with 0)
    // - International: 94xxxxxxxxx (11 digits starting with 94)
    // - With +: +94xxxxxxxxx (12 chars starting with +94)

    const sriLankanPatterns = [
      /^0[0-9]{9}$/,           // Local format: 0771234567
      /^94[0-9]{9}$/,          // Without +: 94771234567
      /^\+94[0-9]{9}$/,        // With +: +94771234567
    ]

    return sriLankanPatterns.some(pattern => pattern.test(cleaned))
  }

  /**
   * Get SMS delivery status
   */
  async getMessageStatus(messageId: string): Promise<string | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      const response = await fetch(`${this.baseUrl}/sms/${messageId}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data.status || 'unknown'
      }

      return null
    } catch (error) {
      logger.error('Error fetching message status', error as Error)
      return null
    }
  }

  /**
   * Get account balance (useful for monitoring)
   */
  async getBalance(): Promise<number | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // Note: Text.lk API endpoint for balance might vary
      // This is a placeholder - check their documentation for the actual endpoint
      const response = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data.balance || 0
      }

      return null
    } catch (error) {
      logger.error('Error fetching balance', error as Error)
      return null
    }
  }
}

// Export singleton instance
export const textlkService = new TextLKService()