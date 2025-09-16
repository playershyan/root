-- Migration: Create description templates table for template-based AI system
-- Date: 2025-09-16
-- Description: Replace real-time AI calls with pre-generated template system

BEGIN;

-- Create description templates table
CREATE TABLE IF NOT EXISTS public.description_templates (
    id SERIAL PRIMARY KEY,
    template_content TEXT NOT NULL,
    vehicle_type VARCHAR(30),
    version INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    generated_by VARCHAR(20) DEFAULT 'openai',
    metadata JSONB DEFAULT '{}'
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_templates_vehicle_type ON public.description_templates(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_templates_active ON public.description_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_templates_version ON public.description_templates(version);
CREATE INDEX IF NOT EXISTS idx_templates_created_at ON public.description_templates(created_at);

-- Create template generation tracking table
CREATE TABLE IF NOT EXISTS public.template_generation_logs (
    id SERIAL PRIMARY KEY,
    generation_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_templates_generated INTEGER DEFAULT 0,
    generation_status VARCHAR(20) DEFAULT 'pending' CHECK (generation_status IN ('pending', 'in_progress', 'completed', 'failed')),
    openai_cost_estimate DECIMAL(10,4),
    error_message TEXT,
    templates_by_style JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}'
);

-- Create RLS policies for security
ALTER TABLE public.description_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.template_generation_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active templates
CREATE POLICY "Allow public read access to active templates" ON public.description_templates
    FOR SELECT USING (is_active = true);

-- Allow service role full access
CREATE POLICY "Allow service role full access to templates" ON public.description_templates
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to generation logs" ON public.template_generation_logs
    FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read generation logs
CREATE POLICY "Allow authenticated users read generation logs" ON public.template_generation_logs
    FOR SELECT USING (auth.role() = 'authenticated');

-- Add comments for documentation
COMMENT ON TABLE public.description_templates IS 'Pre-generated vehicle description templates for AI-assisted listings';
COMMENT ON TABLE public.template_generation_logs IS 'Tracking table for OpenAI template generation runs';

COMMENT ON COLUMN public.description_templates.template_content IS 'Template with {{variable}} placeholders for dynamic content';
COMMENT ON COLUMN public.description_templates.vehicle_type IS 'Optional vehicle type filter (car, van, motorcycle, etc.)';
COMMENT ON COLUMN public.description_templates.version IS 'Template set version for monthly regeneration tracking';
COMMENT ON COLUMN public.description_templates.usage_count IS 'Number of times this template has been used';

-- Insert some initial sample templates
INSERT INTO public.description_templates (template_content, vehicle_type) VALUES
(
    '{{Make}} {{Model}} {{Grade}}
Y.O.M: {{YoM}} | Y.O.R: {{YoR}}
{{No. of previous owners}} owner{{#if (gt No. of previous owners 1)}}s{{/if}}
{{Mileage}} km (verified)
Interior: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not available{{/if}}
Genuine buyers only',
    'car'
),
(
    '{{Make}} {{Model}} {{Grade}}
Y.O.M: {{YoM}} | Y.O.R: {{YoR}}
{{No. of previous owners}} owner{{#if (gt No. of previous owners 1)}}s{{/if}}
{{Mileage}} km done
Interior: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not available{{/if}}
Serious inquiries only',
    'car'
),
(
    '{{Make}} {{Model}} {{Grade}}
Y.O.M: {{YoM}} | Y.O.R: {{YoR}}
{{No. of previous owners}} owner{{#if (gt No. of previous owners 1)}}s{{/if}}
Mileage: {{Mileage}} km
Interior: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not available{{/if}}
Only interested buyers',
    'car'
);

COMMIT;