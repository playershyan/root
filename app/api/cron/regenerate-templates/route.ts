import { NextResponse } from 'next/server'
import { TemplateGenerationService } from '@/lib/services/templateGenerationService'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    logger.info('Starting monthly template regeneration')

    // Check if regeneration is needed
    const needsRegeneration = await TemplateGenerationService.needsRegeneration()

    if (!needsRegeneration) {
      return NextResponse.json({
        success: true,
        message: 'Templates are up to date, no regeneration needed',
        regenerated: false
      })
    }

    // Generate new templates
    const result = await TemplateGenerationService.generateTemplateSet()

    if (result.success) {
      logger.info('Template regeneration completed', { totalGenerated: result.totalGenerated })
      return NextResponse.json({
        success: true,
        message: `Successfully regenerated ${result.totalGenerated} templates`,
        regenerated: true,
        data: result
      })
    } else {
      logger.error('Template regeneration failed', new Error(result.error || 'Unknown error'))
      return NextResponse.json({
        success: false,
        message: `Template regeneration failed: ${result.error}`,
        regenerated: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    logger.error('Cron job error', error as Error)
    return NextResponse.json({
      success: false,
      message: 'Template regeneration cron job failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  // Same logic as GET for manual trigger
  return GET(request)
}