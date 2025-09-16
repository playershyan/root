import { NextResponse } from 'next/server'
import { TemplateGenerationService } from '@/lib/services/templateGenerationService'

export async function GET(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    const cronSecret = process.env.CRON_SECRET

    if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    console.log('Starting monthly template regeneration...')

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
      console.log(`Template regeneration completed: ${result.totalGenerated} templates generated`)
      return NextResponse.json({
        success: true,
        message: `Successfully regenerated ${result.totalGenerated} templates`,
        regenerated: true,
        data: result
      })
    } else {
      console.error('Template regeneration failed:', result.error)
      return NextResponse.json({
        success: false,
        message: `Template regeneration failed: ${result.error}`,
        regenerated: false,
        error: result.error
      }, { status: 500 })
    }

  } catch (error) {
    console.error('Cron job error:', error)
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