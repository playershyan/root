-- Migration: Add additional information columns and remove features
-- Date: 2025-09-16
-- Description: Replace features with additional information fields for vehicle listings

BEGIN;

-- Add new columns for additional information
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS interior_color TEXT,
ADD COLUMN IF NOT EXISTS registration_year INTEGER,
ADD COLUMN IF NOT EXISTS vehicle_condition_details TEXT CHECK (vehicle_condition_details IN ('pristine', 'mint', NULL)),
ADD COLUMN IF NOT EXISTS previous_owners INTEGER,
ADD COLUMN IF NOT EXISTS including_finance_companies BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS service_records_available BOOLEAN DEFAULT FALSE;

-- Create indexes for the new columns (for performance)
CREATE INDEX IF NOT EXISTS idx_listings_registration_year ON public.listings(registration_year);
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_condition_details ON public.listings(vehicle_condition_details);
CREATE INDEX IF NOT EXISTS idx_listings_previous_owners ON public.listings(previous_owners);
CREATE INDEX IF NOT EXISTS idx_listings_service_records ON public.listings(service_records_available);

-- Add comments for documentation
COMMENT ON COLUMN public.listings.interior_color IS 'Interior color of the vehicle (e.g., Black Leather, Beige Fabric)';
COMMENT ON COLUMN public.listings.registration_year IS 'Year the vehicle was first registered';
COMMENT ON COLUMN public.listings.vehicle_condition_details IS 'Detailed condition status - pristine or mint';
COMMENT ON COLUMN public.listings.previous_owners IS 'Number of previous owners of the vehicle';
COMMENT ON COLUMN public.listings.including_finance_companies IS 'Whether the owner count includes finance companies';
COMMENT ON COLUMN public.listings.service_records_available IS 'Whether service records are available for the vehicle';

-- Note: We're not dropping the features column immediately to avoid data loss
-- You can drop it later with: ALTER TABLE public.listings DROP COLUMN IF EXISTS features;
-- For now, we'll just stop using it in the application

COMMIT;