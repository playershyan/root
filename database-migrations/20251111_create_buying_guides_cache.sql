-- Create buying guides cache table
-- Stores pre-generated AI buying guides for vehicle models

CREATE TABLE IF NOT EXISTS buying_guides_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cache_key TEXT NOT NULL UNIQUE,
  make TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER,
  generation TEXT, -- e.g., "2015-2019" for 5-year generations
  compact_html TEXT NOT NULL,
  detailed_html TEXT NOT NULL,
  specificity INTEGER NOT NULL DEFAULT 0, -- Higher = more specific (year > generation > general)
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_buying_guides_cache_key ON buying_guides_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_buying_guides_make_model ON buying_guides_cache(make, model);
CREATE INDEX IF NOT EXISTS idx_buying_guides_expires_at ON buying_guides_cache(expires_at);

-- Index for specificity ordering
CREATE INDEX IF NOT EXISTS idx_buying_guides_specificity ON buying_guides_cache(specificity DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_buying_guides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER buying_guides_updated_at_trigger
  BEFORE UPDATE ON buying_guides_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_buying_guides_updated_at();

-- Add comment
COMMENT ON TABLE buying_guides_cache IS 'Cached pre-generated buying guides for vehicle models. TTL: 30 days.';
COMMENT ON COLUMN buying_guides_cache.cache_key IS 'Unique cache key format: guide:{make}:{model}:{year|gen_{range}|general}';
COMMENT ON COLUMN buying_guides_cache.specificity IS 'Priority order: 2=specific year, 1=generation range, 0=general model';
COMMENT ON COLUMN buying_guides_cache.compact_html IS 'Short version for search results preview';
COMMENT ON COLUMN buying_guides_cache.detailed_html IS 'Full version with additional tips';
