import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { TemplateGenerationService } from '@/lib/services/templateGenerationService'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  try {
    // Verify this is a legitimate cron request from Vercel
    const headersList = headers()
    const authHeader = headersList.get('authorization')

    // Vercel Cron jobs include this header
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if we should start generating templates (from Oct 30, 2025)
    const startDate = new Date('2025-10-30')
    const currentDate = new Date()

    if (currentDate < startDate) {
      logger.info('Template generation not yet active', { startDate: startDate.toISOString() })
      return NextResponse.json({
        message: 'Template generation not yet active',
        nextRunDate: startDate.toISOString()
      })
    }

    // Check if templates need regeneration
    const needsRegeneration = await TemplateGenerationService.needsRegeneration()

    if (!needsRegeneration) {
      logger.info('Templates are up to date, skipping generation')
      return NextResponse.json({
        message: 'Templates are up to date',
        skipped: true
      })
    }

    logger.info('Starting scheduled template generation')

    // Generate new template set
    const result = await TemplateGenerationService.generateTemplateSet()

    if (!result.success) {
      logger.error('Scheduled template generation failed', new Error(result.error || 'Unknown error'))
      return NextResponse.json({
        error: 'Template generation failed',
        details: result.error
      }, { status: 500 })
    }

    logger.info('Successfully generated templates', { totalGenerated: result.totalGenerated })

    return NextResponse.json({
      success: true,
      message: `Generated ${result.totalGenerated} new templates`,
      generationId: result.generationId,
      estimatedCost: result.estimatedCost,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    logger.error('Cron template generation error', error as Error)
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 })
}