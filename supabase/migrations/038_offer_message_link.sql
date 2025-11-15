-- Link offers table rows to their originating message records
-- Enables fast status propagation to conversation threads
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'offers' AND column_name = 'message_id'
  ) THEN
    ALTER TABLE offers
      ADD COLUMN message_id UUID REFERENCES messages(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_offers_message_id ON offers(message_id);

