-- Migration: Update description templates to use structured format with bold titles
-- Date: 2025-01-17
-- Description: Update existing templates to use structured format with bold titles and colons

BEGIN;

-- Update existing templates to use the new structured format
UPDATE public.description_templates 
SET template_content = '{{Make}} {{Model}} {{Grade}}
Year of Manufacture: {{YoM}} | Year of Registration: {{YoR}}
Ownership: {{#if (gt No. of previous owners 1)}}{{No. of previous owners}} Owners{{else}}Single Owner{{/if}}
Mileage: {{Mileage}} km
Interior Colour: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not Available{{/if}}'
WHERE template_content LIKE '%Y.O.M: {{YoM}}%' AND vehicle_type = 'car';

-- Add new structured templates
INSERT INTO public.description_templates (template_content, vehicle_type) VALUES
(
    '{{Make}} {{Model}} {{Grade}}
Year of Manufacture: {{YoM}} | Year of Registration: {{YoR}}
Ownership: {{#if (gt No. of previous owners 1)}}{{No. of previous owners}} Owners{{else}}Single Owner{{/if}}
Mileage: {{Mileage}} km (verified)
Interior Colour: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not Available{{/if}}
Genuine buyers only',
    'car'
),
(
    '{{Make}} {{Model}} {{Grade}}
Year of Manufacture: {{YoM}} | Year of Registration: {{YoR}}
Ownership: {{#if (gt No. of previous owners 1)}}{{No. of previous owners}} Owners{{else}}Single Owner{{/if}}
Mileage: {{Mileage}} km
Interior Colour: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not Available{{/if}}
Serious inquiries only',
    'car'
),
(
    '{{Make}} {{Model}} {{Grade}}
Year of Manufacture: {{YoM}} | Year of Registration: {{YoR}}
Ownership: {{#if (gt No. of previous owners 1)}}{{No. of previous owners}} Owners{{else}}Single Owner{{/if}}
Mileage: {{Mileage}} km
Interior Colour: {{Interior color}}
Condition: {{Vehicle condition}}
Service Records: {{#if Service records available}}Available{{else}}Not Available{{/if}}
Well maintained vehicle',
    'car'
);

COMMIT;
