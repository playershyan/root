import { NextResponse } from 'next/server'
import { incr, incrTrend } from './metrics'

export interface RecaptchaResult {
  success: boolean
  score?: number
  action?: string
  errorCodes?: string[]
}

// Verifies Google reCAPTCHA token server-side.
// Supports v2 (checkbox) and v3 (score-based). For Enterprise, use siteverify endpoint similarly.
export async function verifyRecaptcha(token: string | undefined | null, remoteip?: string): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY
  const enabled = (process.env.RECAPTCHA_ENABLED || '').toLowerCase() === 'true'

  if (!enabled) {
    return { success: true, score: 1 }
  }

  if (!secret) {
    return { success: false, errorCodes: ['missing-secret'] }
  }

  if (!token) {
    return { success: false, errorCodes: ['missing-input-response'] }
  }

  try {
    const params = new URLSearchParams()
    params.append('secret', secret)
    params.append('response', token)
    if (remoteip) params.append('remoteip', remoteip)

    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
      // Avoid hanging too long
      cache: 'no-store'
    })

    const data = await res.json()
    if (data.success) {
      incr('recaptcha.success')
    } else {
      incr('recaptcha.failure')
      await incrTrend('recaptcha.failure')
    }
    return {
      success: !!data.success,
      score: typeof data.score === 'number' ? data.score : undefined,
      action: typeof data.action === 'string' ? data.action : undefined,
      errorCodes: Array.isArray(data['error-codes']) ? data['error-codes'] : undefined,
    }
  } catch (e) {
    incr('recaptcha.failure')
    await incrTrend('recaptcha.failure')
    return { success: false, errorCodes: ['verify-error'] }
  }
}

// Small helper for API routes to reject when captcha fails
export function captchaGuardFailJson(minScore = 0.3) {
  return NextResponse.json(
    { error: 'reCAPTCHA verification failed', minScore },
    { status: 400 }
  )
}
