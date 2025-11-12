import { NextResponse } from 'next/server'
import { TemplateGenerationService } from '@/lib/services/templateGenerationService'
import { TemplateProcessor } from '@/lib/services/templateProcessor'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/utils/logger'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const action = url.searchParams.get('action')

    switch (action) {
      case 'stats':
        const [generationStats, templateStats] = await Promise.all([
          TemplateGenerationService.getGenerationStats(),
          TemplateProcessor.getTemplateStats()
        ])

        return NextResponse.json({
          generation: generationStats,
          usage: templateStats
        })

      case 'check-regeneration':
        const needsRegeneration = await TemplateGenerationService.needsRegeneration()
        return NextResponse.json({ needsRegeneration })

      case 'templates':
        const { data: templates } = await supabase
          .from('description_templates')
          .select(`
            id, style, vehicle_type, template_content, usage_count,
            success_rate, avg_generation_time_ms, is_active,
            created_at, updated_at
          `)
          .eq('is_active', true)
          .order('style', { ascending: true })
          .order('usage_count', { ascending: false })

        return NextResponse.json({ templates: templates || [] })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Template admin error', error as Error)
    return NextResponse.json(
      { error: 'Failed to fetch template data' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { action } = body

    switch (action) {
      case 'generate':
        logger.info('Starting template generation')
        const result = await TemplateGenerationService.generateTemplateSet()

        return NextResponse.json({
          success: result.success,
          message: result.success
            ? `Successfully generated ${result.totalGenerated} templates`
            : `Generation failed: ${result.error}`,
          data: result
        })

      case 'validate':
        const { templateContent } = body
        if (!templateContent) {
          return NextResponse.json(
            { error: 'Template content is required' },
            { status: 400 }
          )
        }

        const validation = TemplateProcessor.validateTemplate(templateContent)
        return NextResponse.json(validation)

      case 'test':
        const { templateId, testData } = body
        if (!templateId || !testData) {
          return NextResponse.json(
            { error: 'Template ID and test data are required' },
            { status: 400 }
          )
        }

        // Get specific template
        const { data: template } = await supabase
          .from('description_templates')
          .select('id, template_content, style, vehicle_type')
          .eq('id', templateId)
          .single()

        if (!template) {
          return NextResponse.json(
            { error: 'Template not found' },
            { status: 404 }
          )
        }

        // Process template with test data (without updating usage count)
        const testResult = TemplateProcessor.processTemplate(
          template.template_content,
          testData
        )

        return NextResponse.json({ result: testResult })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    logger.error('Template generation error', error as Error)
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Template generation failed'
      },
      { status: 500 }
    )
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { templateId, updates } = body

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Update template
    const { data, error } = await supabase
      .from('description_templates')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', templateId)
      .select(`
        id, style, vehicle_type, template_content, usage_count,
        success_rate, avg_generation_time_ms, is_active,
        created_at, updated_at
      `)
      .single()

    if (error) {
      return NextResponse.json(
        { error: 'Failed to update template' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      template: data
    })
  } catch (error) {
    logger.error('Template update error', error as Error)
    return NextResponse.json(
      { error: 'Failed to update template' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request) {
  try {
    const url = new URL(request.url)
    const templateId = url.searchParams.get('id')

    if (!templateId) {
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    const { error } = await supabase
      .from('description_templates')
      .update({ is_active: false })
      .eq('id', templateId)

    if (error) {
      return NextResponse.json(
        { error: 'Failed to delete template' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Template deletion error', error as Error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}