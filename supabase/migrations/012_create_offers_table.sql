-- Create offers table for managing offers on listings
CREATE TABLE IF NOT EXISTS offers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  amount DECIMAL(12, 2) NOT NULL,
  message TEXT,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'expired')),
  response_message TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better query performance
CREATE INDEX idx_offers_conversation_id ON offers(conversation_id);
CREATE INDEX idx_offers_sender_id ON offers(sender_id);
CREATE INDEX idx_offers_listing_id ON offers(listing_id);
CREATE INDEX idx_offers_status ON offers(status);

-- Add new columns to messages table to support offer messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS message_type VARCHAR(50) DEFAULT 'text' CHECK (message_type IN ('text', 'offer', 'image', 'file')),
ADD COLUMN IF NOT EXISTS offer_data JSONB;

-- Create index for message types
CREATE INDEX IF NOT EXISTS idx_messages_type ON messages(message_type);

-- Enable Row Level Security
ALTER TABLE offers ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for offers
-- Users can view offers in conversations they are part of
CREATE POLICY "Users can view offers in their conversations" ON offers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND (c.buyer_id = auth.uid() OR c.seller_id = auth.uid())
    )
  );

-- Users can insert offers in conversations where they are the buyer
CREATE POLICY "Buyers can create offers" ON offers
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND c.buyer_id = auth.uid()
    )
  );

-- Users can update offers they created (for editing before response)
-- or listing owners can update to respond to offers
CREATE POLICY "Users can update relevant offers" ON offers
  FOR UPDATE USING (
    (sender_id = auth.uid() AND status = 'pending') OR
    EXISTS (
      SELECT 1 FROM conversations c 
      WHERE c.id = conversation_id 
      AND c.seller_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_offers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_offers_timestamp
BEFORE UPDATE ON offers
FOR EACH ROW
EXECUTE FUNCTION update_offers_updated_at();