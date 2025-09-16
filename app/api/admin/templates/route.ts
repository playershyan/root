import { NextResponse } from 'next/server'
import { TemplateGenerationService } from '@/lib/services/templateGenerationService'
import { TemplateProcessor } from '@/lib/services/templateProcessor'
import { supabase } from '@/lib/supabase'

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
          .select('*')
          .eq('is_active', true)
          .order('style', { ascending: true })
          .order('usage_count', { ascending: false })

        return NextResponse.json({ templates: templates || [] })

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Template admin error:', error)
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
        console.log('Starting template generation...')
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
          .select('template_content')
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
    console.error('Template generation error:', error)
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
      .select()
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
    console.error('Template update error:', error)
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
    console.error('Template deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete template' },
      { status: 500 }
    )
  }
}