-- Add missing contact fields to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS phone VARCHAR(20),
ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS vehicle_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'cash',
ADD COLUMN IF NOT EXISTS finance_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS finance_provider VARCHAR(100),
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(12, 2),
ADD COLUMN IF NOT EXISTS remaining_term VARCHAR(50),
ADD COLUMN IF NOT EXISTS early_settlement VARCHAR(255),
ADD COLUMN IF NOT EXISTS asking_price DECIMAL(12, 2);

-- Add indexes for new fields
CREATE INDEX IF NOT EXISTS idx_listings_vehicle_type ON listings(vehicle_type);
CREATE INDEX IF NOT EXISTS idx_listings_pricing_type ON listings(pricing_type);

-- Add comment to document the contact fields
COMMENT ON COLUMN listings.phone IS 'Contact phone number in format: country code + number without zero';
COMMENT ON COLUMN listings.whatsapp IS 'WhatsApp number in format: country code + number without zero';
COMMENT ON COLUMN listings.email IS 'Contact email address';