-- Add finance-related columns to the listings table
-- Run this in your Supabase SQL Editor

-- Add pricing type column (cash or finance)
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS pricing_type VARCHAR(20) DEFAULT 'cash' CHECK (pricing_type IN ('cash', 'finance'));

-- Add negotiable flag
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS negotiable BOOLEAN DEFAULT false;

-- Add finance-specific columns
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS finance_type VARCHAR(100);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS finance_provider VARCHAR(200);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS original_amount DECIMAL(12, 2);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS outstanding_balance DECIMAL(12, 2);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS monthly_payment DECIMAL(10, 2);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS remaining_term VARCHAR(100);

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS early_settlement TEXT;

ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS asking_price DECIMAL(12, 2);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_listings_pricing_type ON listings(pricing_type);
CREATE INDEX IF NOT EXISTS idx_listings_negotiable ON listings(negotiable);

-- Update some existing listings to demonstrate finance features
-- (Only run this part if you want sample data)
WITH sample_listings AS (
  SELECT id, price, ROW_NUMBER() OVER (ORDER BY created_at DESC) as rn
  FROM listings
  LIMIT 3
)
UPDATE listings 
SET 
  pricing_type = 'finance',
  finance_type = CASE 
    WHEN sl.rn = 1 THEN 'Bank Loan'
    WHEN sl.rn = 2 THEN 'Lease'
    ELSE 'Hire Purchase'
  END,
  finance_provider = CASE 
    WHEN sl.rn = 1 THEN 'Commercial Bank'
    WHEN sl.rn = 2 THEN 'People''s Leasing'
    ELSE 'LB Finance'
  END,
  original_amount = listings.price,
  outstanding_balance = listings.price * 0.6,
  asking_price = listings.price * 0.55,
  monthly_payment = ROUND(listings.price / 60),
  remaining_term = CASE 
    WHEN sl.rn = 1 THEN '36 months'
    WHEN sl.rn = 2 THEN '24 months'
    ELSE '18 months'
  END,
  early_settlement = CASE 
    WHEN sl.rn = 1 THEN 'Allowed with 2% penalty'
    WHEN sl.rn = 2 THEN 'Allowed after 12 months'
    ELSE 'No penalty after 6 months'
  END,
  price = listings.price * 0.55 -- Set price to asking price
FROM sample_listings sl
WHERE listings.id = sl.id;

-- Update remaining listings to be cash sales with negotiable flag
UPDATE listings 
SET 
  pricing_type = 'cash',
  negotiable = true
WHERE pricing_type IS NULL OR pricing_type = 'cash';

-- Verify the changes
SELECT 
  id,
  title,
  pricing_type,
  price,
  asking_price,
  outstanding_balance,
  monthly_payment,
  finance_provider,
  negotiable
FROM listings
ORDER BY pricing_type DESC, created_at DESC
LIMIT 10;