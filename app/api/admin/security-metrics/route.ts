import { NextRequest, NextResponse } from 'next/server'
import { getSnapshot as getMetricSnapshot, reset as resetMetrics, getClusterSnapshot, logAdminAction, getAdminAuditLog, getClusterTrend } from '@/lib/security/metrics'
import { getQuarantineSnapshot, unblockIp, resetQuarantineCaches, getTopOffenders } from '@/lib/middleware/rateLimiter'

export async function GET() {
  const config = {
    recaptchaEnabled: (process.env.RECAPTCHA_ENABLED || '').toLowerCase() === 'true',
    recaptchaUploadRequired: (process.env.RECAPTCHA_UPLOAD_REQUIRED || '').toLowerCase() === 'true',
    aiRatePerMinute: Number(process.env.AI_RATE_LIMIT_PER_MINUTE || 10),
    aiDailyLimit: Number(process.env.AI_DAILY_LIMIT || 100),
    useUpstash: (process.env.USE_UPSTASH || '').toLowerCase() === 'true',
    quarantineEnabled: (process.env.QUARANTINE_ENABLED || '').toLowerCase() === 'true',
    quarantineThreshold: Number(process.env.QUARANTINE_THRESHOLD || 5),
    quarantineWindowSeconds: Number(process.env.QUARANTINE_WINDOW_SECONDS || 120),
    quarantineBanSeconds: Number(process.env.QUARANTINE_BAN_SECONDS || 600),
  }

  const metrics = getMetricSnapshot()
  const clusterMetrics = await getClusterSnapshot()
  const quarantine = getQuarantineSnapshot()
  const offenders = await getTopOffenders(10)
  const audit = await getAdminAuditLog(50)
  // Build trends for last 60 minutes
  const minutes = 60
  const descErr = await getClusterTrend('ai.description.error', minutes)
  const guideErr = await getClusterTrend('ai.guide.error', minutes)
  const recaptchaFail = await getClusterTrend('recaptcha.failure', minutes)
  // Merge AI errors into a single series by summing per-minute
  const aiErrors = descErr.map((p, i) => ({ t: p.t, v: (p.v || 0) + (guideErr[i]?.v || 0) }))

  return NextResponse.json({ config, metrics, clusterMetrics, quarantine, offenders, audit, trends: { aiErrors, recaptchaFailures: recaptchaFail } })
}

export async function POST(request: NextRequest) {
  try {
    const { action, ip } = await request.json()
    if (action === 'reset-counters') {
      resetMetrics()
      await logAdminAction('reset-counters')
      return NextResponse.json({ success: true })
    }
    if (action === 'reset-quarantine') {
      resetQuarantineCaches()
      await logAdminAction('reset-quarantine')
      return NextResponse.json({ success: true })
    }
    if (action === 'unblock-ip' && ip) {
      await unblockIp(ip)
      await logAdminAction('unblock-ip', { ip })
      return NextResponse.json({ success: true })
    }
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (e) {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 })
  }
}
