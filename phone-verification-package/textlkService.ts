/**
 * Text.lk SMS Gateway Service for Sri Lanka
 * Documentation: https://www.text.lk/
 */

import { logger } from '@/lib/utils/logger'

interface SMSOptions {
  to: string | string[] // Single number or comma-separated string, or array of numbers
  message: string
  senderId?: string
  scheduleTime?: string // RFC3339 format (Y-m-d H:i)
  dltTemplateId?: string
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
  private baseUrl: string = 'https://app.text.lk/api/http'

  constructor() {
    this.apiKey = process.env.TEXTLK_API_KEY || ''
    this.senderId = process.env.TEXTLK_SENDER_ID || 'VERAVERIFY1'

    if (!this.apiKey && process.env.NODE_ENV === 'production') {
      logger.warn('Text.lk API key not configured. SMS will not be sent.', new Error('Missing API key'))
    }

    // Validate sender ID length (Text.lk maximum 11 characters)
    if (this.senderId.length > 11 && process.env.NODE_ENV === 'production') {
      logger.warn('Sender ID must be maximum 11 characters for Text.lk', new Error('Invalid sender ID'))
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

      // Format phone number(s) for Sri Lanka
      let formattedRecipients: string
      
      if (Array.isArray(options.to)) {
        // If array, format each and join with comma
        formattedRecipients = options.to.map(num => this.formatPhoneNumber(num)).join(',')
      } else if (typeof options.to === 'string' && options.to.includes(',')) {
        // If already comma-separated string, format each number
        formattedRecipients = options.to.split(',').map(num => this.formatPhoneNumber(num.trim())).join(',')
      } else {
        // Single number
        formattedRecipients = this.formatPhoneNumber(options.to as string)
      }

      // Prepare request body (HTTP API uses api_token in body, not Authorization header)
      const requestBody: any = {
        api_token: this.apiKey,
        recipient: formattedRecipients,
        sender_id: options.senderId || this.senderId,
        type: 'plain',
        message: options.message
      }

      // Add optional parameters
      if (options.scheduleTime) {
        requestBody.schedule_time = options.scheduleTime
      }
      if (options.dltTemplateId) {
        requestBody.dlt_template_id = options.dltTemplateId
      }

      // Send SMS via Text.lk HTTP API
      const response = await fetch(`${this.baseUrl}/sms/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success') {
        logger.info('SMS sent successfully', { recipients: formattedRecipients, messageId: result.data?.uid })

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

      // HTTP API: api_token in request body for GET requests
      const response = await fetch(`${this.baseUrl}/sms/${messageId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ api_token: this.apiKey })
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
   * Get message details by UID
   */
  async getMessage(uid: string): Promise<any | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // HTTP API: api_token in request body for GET requests
      const response = await fetch(`${this.baseUrl}/sms/${uid}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ api_token: this.apiKey })
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data
      }

      return null
    } catch (error) {
      logger.error('Error fetching message', error as Error)
      return null
    }
  }

  /**
   * Get all messages with optional pagination
   */
  async getAllMessages(page: number = 1): Promise<any | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // HTTP API: api_token in query params for GET requests with query params
      const response = await fetch(`${this.baseUrl}/sms?page=${page}&api_token=${encodeURIComponent(this.apiKey)}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data
      }

      return null
    } catch (error) {
      logger.error('Error fetching messages', error as Error)
      return null
    }
  }

  /**
   * Get messages with filters (date range, type, direction, timezone)
   */
  async getMessagesFiltered(filters: {
    startDate: string // YYYY-MM-DD HH:MM:SS
    endDate: string // YYYY-MM-DD HH:MM:SS
    smsType?: 'plain' | 'unicode' | 'voice' | 'mms' | 'whatsapp' | 'otp' | 'viber'
    direction?: 'outgoing' | 'incoming' | 'api'
    timezone?: string // IANA timezone, e.g., Asia/Hong_Kong
    page?: number
  }): Promise<any | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // Build query parameters
      const params = new URLSearchParams({
        start_date: filters.startDate,
        end_date: filters.endDate
      })

      if (filters.smsType) {
        params.append('sms_type', filters.smsType)
      }
      if (filters.direction) {
        params.append('direction', filters.direction)
      }
      if (filters.timezone) {
        params.append('timezone', filters.timezone)
      }
      if (filters.page) {
        params.append('page', filters.page.toString())
      }

      // HTTP API: api_token in query params for GET requests with query params
      params.append('api_token', this.apiKey)
      const response = await fetch(`${this.baseUrl}/sms?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data
      }

      return null
    } catch (error) {
      logger.error('Error fetching filtered messages', error as Error)
      return null
    }
  }

  /**
   * Send campaign using contact list
   */
  async sendCampaign(options: {
    contactListId: string | string[] // Single ID or comma-separated string, or array of IDs
    message: string
    senderId?: string
    scheduleTime?: string // RFC3339 format (Y-m-d H:i)
    dltTemplateId?: string
  }): Promise<SMSResponse> {
    try {
      // Check if Text.lk is configured
      if (!this.apiKey) {
        // In development, log the message
        if (process.env.NODE_ENV === 'development') {
          logger.debug('Campaign (Dev Mode - Text.lk)', {
            contactListId: options.contactListId,
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

      // Format contact list ID(s)
      let formattedContactLists: string
      
      if (Array.isArray(options.contactListId)) {
        formattedContactLists = options.contactListId.join(',')
      } else if (typeof options.contactListId === 'string' && options.contactListId.includes(',')) {
        // Already comma-separated, just trim
        formattedContactLists = options.contactListId.split(',').map(id => id.trim()).join(',')
      } else {
        formattedContactLists = options.contactListId as string
      }

      // Prepare request body (HTTP API uses api_token in body, not Authorization header)
      const requestBody: any = {
        api_token: this.apiKey,
        contact_list_id: formattedContactLists,
        sender_id: options.senderId || this.senderId,
        type: 'plain',
        message: options.message
      }

      // Add optional parameters
      if (options.scheduleTime) {
        requestBody.schedule_time = options.scheduleTime
      }
      if (options.dltTemplateId) {
        requestBody.dlt_template_id = options.dltTemplateId
      }

      // Send campaign via Text.lk HTTP API
      const response = await fetch(`${this.baseUrl}/sms/campaign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success') {
        logger.info('Campaign sent successfully', { contactLists: formattedContactLists, data: result.data })

        // Extract campaign ID from response if available
        const campaignId = result.data?.uid || result.data?.campaign_id || 'unknown'

        return {
          success: true,
          messageId: campaignId,
          data: result.data
        }
      } else {
        logger.error('Text.lk Campaign error', new Error(result.message || 'Campaign send failed'))
        return {
          success: false,
          error: result.message || 'Failed to send campaign'
        }
      }
    } catch (error) {
      logger.error('Text.lk Campaign error', error as Error)

      if (error instanceof Error) {
        return {
          success: false,
          error: error.message
        }
      }

      return {
        success: false,
        error: 'Failed to send campaign'
      }
    }
  }

  /**
   * Get campaign details by UID
   */
  async getCampaign(uid: string): Promise<any | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // HTTP API: api_token in request body for GET requests
      const response = await fetch(`${this.baseUrl}/campaign/${uid}/view`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ api_token: this.apiKey })
      })

      const result: TextLKResponse = await response.json()

      if (result.status === 'success' && result.data) {
        return result.data
      }

      return null
    } catch (error) {
      logger.error('Error fetching campaign', error as Error)
      return null
    }
  }

  /**
   * Get account balance (useful for monitoring)
   * Note: This endpoint might not be available in the API - placeholder implementation
   */
  async getBalance(): Promise<number | null> {
    try {
      if (!this.apiKey) {
        return null
      }

      // Note: Text.lk API endpoint for balance might vary
      // This is a placeholder - check their documentation for the actual endpoint
      // HTTP API: api_token in request body for GET requests
      const response = await fetch(`${this.baseUrl}/balance`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ api_token: this.apiKey })
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

