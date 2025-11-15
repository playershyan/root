import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { logger } from '@/lib/utils/logger'
import {
  sanitizeWantedRequest,
  validateWantedRequest,
  formatPhoneNumber,
  generateWantedRequestTitle
} from '@/lib/validation/wantedRequest'

export async function PUT(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // Get the authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get wanted request data from request body
    const { requestId, ...updateData } = await request.json()
    
    if (!requestId) {
      return NextResponse.json(
        { error: 'Wanted request ID is required' },
        { status: 400 }
      )
    }

    // First, check if the wanted request belongs to the user
    const { data: existingRequest, error: fetchError } = await supabase
      .from('wanted_requests')
      .select('user_id, status')
      .eq('id', requestId)
      .single()
    
    if (fetchError || !existingRequest) {
      return NextResponse.json(
        { error: 'Wanted request not found' },
        { status: 404 }
      )
    }

    // Verify ownership
    if (existingRequest.user_id !== user.id) {
      return NextResponse.json(
        { error: 'You do not have permission to edit this wanted request' },
        { status: 403 }
      )
    }

    const sanitizedInput = sanitizeWantedRequest(updateData)
    const validation = validateWantedRequest(sanitizedInput)

    if (!validation.isValid) {
      return NextResponse.json(
        {
          error: 'Validation failed',
          errors: validation.errors
        },
        { status: 400 }
      )
    }

    const now = new Date()

    // Get existing wanted request to check if phone changed
    const { data: existingWantedRequest, error: fetchWantedError } = await supabase
      .from('wanted_requests')
      .select('phone')
      .eq('id', requestId)
      .single()

    if (fetchWantedError) {
      logger.error('Error fetching wanted request', fetchWantedError as Error)
    }

    // Check if phone number changed
    const phoneChanged = sanitizedInput.phone && existingWantedRequest?.phone && sanitizedInput.phone !== existingWantedRequest.phone

    // If phone changed, require OTP verification
    if (phoneChanged && !updateData.phoneOtpCode) {
      return NextResponse.json({
        error: 'OTP verification required for phone number change',
        requiresOTP: true
      }, { status: 400 })
    }

    // If phone changed, verify OTP
    if (phoneChanged && updateData.phoneOtpCode) {
      const { data: otpRecord, error: otpError } = await supabase
        .from('phone_verifications')
        .select('*')
        .eq('phone_number', sanitizedInput.phone)
        .eq('otp_code', updateData.phoneOtpCode)
        .eq('verified', false)
        .eq('user_id', user.id)
        .gte('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .single()

      if (otpError || !otpRecord) {
        logger.error('OTP verification failed for wanted request update', otpError as Error, {
          phone: sanitizedInput.phone,
          userId: user.id
        })
        return NextResponse.json({
          error: 'Invalid or expired verification code. Please request a new code.',
          requiresOTP: true
        }, { status: 400 })
      }

      // Check attempt limit
      if (otpRecord.attempts >= 3) {
        return NextResponse.json({
          error: 'Too many verification attempts. Please request a new code.',
          requiresOTP: true
        }, { status: 400 })
      }

      // Increment attempt counter and mark as verified
      await supabase
        .from('phone_verifications')
        .update({
          attempts: (otpRecord.attempts || 0) + 1,
          verified: true,
          verified_at: new Date().toISOString()
        })
        .eq('id', otpRecord.id)

      logger.info('Phone OTP verified for wanted request update', { userId: user.id, phone: sanitizedInput.phone })
    }

    const formattedPhone = formatPhoneNumber(sanitizedInput.phone || '')
    // Format WhatsApp number (use phone if whatsapp not provided)
    const formattedWhatsApp = sanitizedInput.whatsapp 
      ? formatPhoneNumber(sanitizedInput.whatsapp, '94')
      : formattedPhone
    const generatedTitle = generateWantedRequestTitle(sanitizedInput)

    // Prepare update data
    const updatePayload: Record<string, any> = {
      title: (updateData.title && updateData.title.trim()) || generatedTitle,
      description: sanitizedInput.description || null,
      min_budget: sanitizedInput.min_budget ? parseFloat(String(sanitizedInput.min_budget)) : null,
      max_budget: sanitizedInput.max_budget ? parseFloat(String(sanitizedInput.max_budget)) : null,
      make: sanitizedInput.make === 'Other'
        ? (sanitizedInput.customMake || 'Other')
        : (sanitizedInput.make || null),
      model: sanitizedInput.model === 'Other'
        ? (sanitizedInput.customModel || 'Other')
        : (sanitizedInput.model || null),
      min_year: sanitizedInput.min_year ? parseInt(String(sanitizedInput.min_year), 10) : null,
      max_year: sanitizedInput.max_year ? parseInt(String(sanitizedInput.max_year), 10) : null,
      location: sanitizedInput.location || '',
      phone: formattedPhone,
      whatsapp: formattedWhatsApp || null,
      fuel_type: sanitizedInput.fuel_type || null,
      transmission: sanitizedInput.transmission || null,
      max_mileage: sanitizedInput.max_mileage ? parseInt(String(sanitizedInput.max_mileage), 10) : null,
      updated_at: now.toISOString()
    }

    if (existingRequest.status === 'deleted') {
      updatePayload.status = 'pending'
      updatePayload.resubmitted_at = now.toISOString()
    }

    // If this is a resubmission (from deleted status), set to pending
    if (existingRequest.status === 'deleted') {
      updatePayload.status = 'pending'
      updatePayload.resubmitted_at = now.toISOString()
    }

    // Update the wanted request
    const { data: updatedRequest, error: updateError } = await supabase
      .from('wanted_requests')
      .update(updatePayload)
      .eq('id', requestId)
      .eq('user_id', user.id)
      .select()
      .single()
    
    if (updateError) {
      logger.error('Error updating wanted request', updateError as Error)
      return NextResponse.json(
        { error: 'Failed to update wanted request' },
        { status: 500 }
      )
    }

    // Log the action
    const actionType = existingRequest.status === 'deleted' ? 'resubmitted' : 'updated'
    const { error: logError } = await supabase
      .from('wanted_request_actions')
      .insert({
        wanted_request_id: requestId,
        user_id: user.id,
        action: actionType,
        created_at: now.toISOString()
      })
    
    if (logError) {
      logger.error('Failed to log update action', logError as Error)
    }

    return NextResponse.json({
      success: true,
      wantedRequest: updatedRequest,
      message: existingRequest.status === 'deleted' 
        ? 'Wanted request resubmitted successfully! It will be reviewed by our team.'
        : 'Wanted request updated successfully!'
    })
    
  } catch (error) {
    logger.error('Error in update wanted request endpoint', error as Error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}