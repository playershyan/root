import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { logger } from '@/lib/utils/logger'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export interface TemplateGenerationResult {
  success: boolean
  totalGenerated: number
  generationId: number
  error?: string
  estimatedCost: number
}

export interface VehicleTemplate {
  content: string
  vehicleType?: string
}

export class TemplateGenerationService {
  private static readonly TOTAL_TEMPLATES = 100
  private static readonly ESTIMATED_COST_PER_REQUEST = 0.002 // Rough estimate for GPT-3.5-turbo

  /**
   * Generate 100 vehicle description templates using OpenAI
   */
  static async generateTemplateSet(): Promise<TemplateGenerationResult> {
    if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
      throw new Error('OpenAI API key not configured')
    }

    // Create generation log entry
    const { data: logEntry, error: logError } = await supabase
      .from('template_generation_logs')
      .insert([{
        generation_status: 'in_progress',
        total_templates_generated: 0,
        openai_cost_estimate: 0
      }])
      .select()
      .single()

    if (logError || !logEntry) {
      throw new Error('Failed to create generation log entry')
    }

    const generationId = logEntry.id
    let totalGenerated = 0
    let estimatedCost = 0

    try {
      logger.info(`Generating ${this.TOTAL_TEMPLATES} templates`)

      const allTemplates = await this.generateTemplates(this.TOTAL_TEMPLATES)
      estimatedCost = this.ESTIMATED_COST_PER_REQUEST

      // Log progress
      await supabase
        .from('template_generation_logs')
        .update({
          total_templates_generated: allTemplates.length,
          openai_cost_estimate: estimatedCost
        })
        .eq('id', generationId)

      // Deactivate old templates
      await supabase
        .from('description_templates')
        .update({ is_active: false })
        .eq('is_active', true)

      // Insert new templates
      const templatesToInsert = allTemplates.map(template => ({
        template_content: template.content,
        vehicle_type: template.vehicleType,
        version: this.getCurrentVersion(),
        is_active: true,
        usage_count: 0
      }))

      const { error: insertError } = await supabase
        .from('description_templates')
        .insert(templatesToInsert)

      if (insertError) {
        throw new Error(`Failed to insert templates: ${insertError.message}`)
      }

      totalGenerated = allTemplates.length

      // Update generation log with success
      await supabase
        .from('template_generation_logs')
        .update({
          generation_status: 'completed',
          total_templates_generated: totalGenerated,
          openai_cost_estimate: estimatedCost
        })
        .eq('id', generationId)

      return {
        success: true,
        totalGenerated,
        generationId,
        estimatedCost
      }

    } catch (error) {
      logger.error('Template generation failed', error as Error)

      // Update generation log with failure
      await supabase
        .from('template_generation_logs')
        .update({
          generation_status: 'failed',
          error_message: error instanceof Error ? error.message : 'Unknown error',
          total_templates_generated: totalGenerated,
          openai_cost_estimate: estimatedCost
        })
        .eq('id', generationId)

      return {
        success: false,
        totalGenerated,
        generationId,
        estimatedCost,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  /**
   * Generate vehicle description templates
   */
  private static async generateTemplates(count: number): Promise<VehicleTemplate[]> {
    const prompt = `You are generating vehicle listing description templates for a Sri Lankan vehicle classifieds website.
Generate exactly ${count} unique templates that follow this EXACT structure:

REQUIRED FORMAT for each template:
Line 1: {{Make}} {{Model}} {{Grade}}
Line 2: Y.O.M: {{YoM}} | Y.O.R: {{YoR}}
Line 3: {{No. of previous owners}} owner{{#if (gt No. of previous owners 1)}}s{{/if}}
Line 4: {{Mileage}} km 
Line 5: Interior: {{Interior color}}
Line 6: Condition: {{Vehicle condition}}
Line 7: {{#if Service records available}}Service Records available{{/if}}
Line 8: [Buyer filter - choose randomly from: "Genuine buyers only" / "Serious inquiries only" / "Only interested buyers"]

RULES:
1. Use EXACTLY this 8-line structure for every template
2. Only vary the buyer filter line (Line 8) and slight phrasing variations
3. Keep wording concise and factual - no hype language, no emojis, no marketing clichés
4. Maintain Sri Lankan style: direct, minimal, trust-oriented
5. For Line 4, you can vary slightly: "{{Mileage}} km (verified)" OR "{{Mileage}} km done" OR "Mileage: {{Mileage}} km"
6. Variables must use exact names: {{Make}}, {{Model}}, {{Grade}}, {{YoM}}, {{YoR}}, {{No. of previous owners}}, {{Mileage}}, {{Interior color}}, {{Vehicle condition}}, {{Service records available}}

Return only the templates, each separated by "---TEMPLATE---" on a new line.

Generate ${count} templates now:`

    try {
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert automotive copywriter specializing in vehicle listings for the Sri Lankan market. Generate compelling, unique description templates with proper variable placeholders."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 4000,
        temperature: 0.8, // Higher creativity for template variety
      })

      const content = completion.choices[0]?.message?.content?.trim()
      if (!content) {
        throw new Error('No content generated by OpenAI')
      }

      // Parse templates from response
      const templates = content
        .split('---TEMPLATE---')
        .map(template => template.trim())
        .filter(template => template.length > 50) // Filter out very short/empty templates
        .map(template => ({
          content: template,
          vehicleType: undefined // Generic templates for all vehicle types
        }))

      logger.info(`Generated ${templates.length} templates`)
      return templates

    } catch (error) {
      logger.error('Failed to generate templates', error as Error)
      throw new Error(`OpenAI template generation failed: ${error}`)
    }
  }

  /**
   * Get current template version (year + month)
   */
  private static getCurrentVersion(): number {
    const now = new Date()
    return parseInt(`${now.getFullYear()}${(now.getMonth() + 1).toString().padStart(2, '0')}`)
  }

  /**
   * Check if templates need regeneration (monthly)
   */
  static async needsRegeneration(): Promise<boolean> {
    const currentVersion = this.getCurrentVersion()

    const { data: latestTemplates } = await supabase
      .from('description_templates')
      .select('version')
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)

    if (!latestTemplates || latestTemplates.length === 0) {
      return true // No templates exist
    }

    return latestTemplates[0].version < currentVersion
  }

  /**
   * Get template generation statistics
   */
  static async getGenerationStats() {
    const { data: logs } = await supabase
      .from('template_generation_logs')
      .select('*')
      .order('generation_date', { ascending: false })
      .limit(10)

    const { data: templateCounts } = await supabase
      .from('description_templates')
      .select('is_active')
      .eq('is_active', true)

    return {
      recentGenerations: logs || [],
      totalActiveTemplates: templateCounts?.length || 0
    }
  }
}