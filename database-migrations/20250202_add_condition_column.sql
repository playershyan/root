-- Add condition column to listings table
ALTER TABLE public.listings
ADD COLUMN IF NOT EXISTS condition VARCHAR(50);

-- Add index for condition column
CREATE INDEX IF NOT EXISTS idx_listings_condition ON public.listings(condition);

-- Add comment
COMMENT ON COLUMN public.listings.condition IS 'Vehicle condition: new, used, or reconditioned';
