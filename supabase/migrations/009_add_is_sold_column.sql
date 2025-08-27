-- Add is_sold column if it doesn't exist
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS is_sold BOOLEAN DEFAULT false;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_listings_is_sold ON listings(is_sold);

-- Update any listings with status='sold' to have is_sold=true for consistency
UPDATE listings 
SET is_sold = true 
WHERE status = 'sold' AND is_sold = false;