-- Migration: Fix listing constraints to match form values
-- Description: Update fuel_type and condition constraints to match allowed form values

-- 1. Drop existing fuel_type constraint and recreate with additional values
ALTER TABLE public.listings 
DROP CONSTRAINT IF EXISTS listings_fuel_type_check;

ALTER TABLE public.listings
ADD CONSTRAINT listings_fuel_type_check 
CHECK (
  fuel_type IS NULL OR 
  fuel_type = ANY (ARRAY[
    'Petrol'::text, 
    'Diesel'::text, 
    'Hybrid'::text, 
    'Electric'::text, 
    'CNG'::text,
    'LPG'::text,
    'Plug-in Hybrid'::text,
    'Other'::text
  ])
);

-- 2. Add CHECK constraint for condition field
-- First check if constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_condition_check' 
    AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
    ADD CONSTRAINT listings_condition_check 
    CHECK (
      condition IS NULL OR 
      condition = ANY (ARRAY[
        'New'::character varying,
        'Used'::character varying,
        'Reconditioned'::character varying
      ])
    );
  END IF;
END $$;

-- 3. Add CHECK constraint for finance_type field (optional but recommended for data integrity)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'listings_finance_type_check' 
    AND conrelid = 'public.listings'::regclass
  ) THEN
    ALTER TABLE public.listings
    ADD CONSTRAINT listings_finance_type_check 
    CHECK (
      finance_type IS NULL OR 
      finance_type = ANY (ARRAY[
        'Bank Loan'::character varying,
        'Lease'::character varying,
        'Hire Purchase'::character varying
      ])
    );
  END IF;
END $$;

-- 4. Verify constraints are in place
COMMENT ON CONSTRAINT listings_fuel_type_check ON public.listings IS 
  'Ensures fuel_type matches form allowed values: Petrol, Diesel, Hybrid, Electric, CNG, LPG, Plug-in Hybrid, Other';

COMMENT ON CONSTRAINT listings_condition_check ON public.listings IS 
  'Ensures condition matches form allowed values: New, Used, Reconditioned';

COMMENT ON CONSTRAINT listings_finance_type_check ON public.listings IS 
  'Ensures finance_type matches form allowed values: Bank Loan, Lease, Hire Purchase';

