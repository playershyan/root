-- Add soft delete tracking columns to listings table
ALTER TABLE listings 
ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deletion_reason TEXT,
ADD COLUMN IF NOT EXISTS permanently_deleted BOOLEAN DEFAULT false;

-- Create index for efficient cleanup queries
CREATE INDEX IF NOT EXISTS idx_listings_deleted_at ON listings(deleted_at) 
WHERE deleted_at IS NOT NULL AND permanently_deleted = false;

-- Create wanted_requests table for buy requests
CREATE TABLE IF NOT EXISTS wanted_requests (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Request information
  title VARCHAR(255) NOT NULL,
  description TEXT,
  budget DECIMAL(12, 2),
  location VARCHAR(255),
  
  -- Status tracking
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted', 'fulfilled')),
  
  -- Soft delete tracking
  deleted_at TIMESTAMP WITH TIME ZONE,
  deletion_reason TEXT,
  permanently_deleted BOOLEAN DEFAULT false,
  is_reported_takedown BOOLEAN DEFAULT false,
  rejection_reason TEXT,
  
  -- Timestamps
  posted_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
  
  -- Engagement metrics
  responses INTEGER DEFAULT 0,
  views INTEGER DEFAULT 0
);

-- Create indexes for wanted_requests
CREATE INDEX idx_wanted_requests_user_id ON wanted_requests(user_id);
CREATE INDEX idx_wanted_requests_status ON wanted_requests(status);
CREATE INDEX idx_wanted_requests_deleted_at ON wanted_requests(deleted_at) 
WHERE deleted_at IS NOT NULL AND permanently_deleted = false;

-- Enable RLS on wanted_requests
ALTER TABLE wanted_requests ENABLE ROW LEVEL SECURITY;

-- RLS policies for wanted_requests
CREATE POLICY "Users can view active wanted requests" ON wanted_requests
  FOR SELECT USING (status = 'active' OR auth.uid() = user_id);

CREATE POLICY "Users can insert own wanted requests" ON wanted_requests
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wanted requests" ON wanted_requests
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own wanted requests" ON wanted_requests
  FOR DELETE USING (auth.uid() = user_id);

-- Create a table to log permanent deletions
CREATE TABLE IF NOT EXISTS deletion_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  table_name VARCHAR(50) NOT NULL,
  record_id UUID NOT NULL,
  user_id UUID,
  deleted_at TIMESTAMP WITH TIME ZONE NOT NULL,
  permanently_deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  deletion_reason TEXT,
  record_data JSONB, -- Store the deleted record for audit purposes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_deletion_logs_table_record ON deletion_logs(table_name, record_id);
CREATE INDEX idx_deletion_logs_created_at ON deletion_logs(created_at);

-- Function to update deleted_at when status changes to 'deleted'
CREATE OR REPLACE FUNCTION update_deleted_at()
RETURNS TRIGGER AS $$
BEGIN
    -- When status changes to 'deleted', set deleted_at
    IF NEW.status = 'deleted' AND (OLD.status IS NULL OR OLD.status != 'deleted') THEN
        NEW.deleted_at = NOW();
    END IF;
    -- When status changes from 'deleted' to something else, clear deleted_at
    IF OLD.status = 'deleted' AND NEW.status != 'deleted' THEN
        NEW.deleted_at = NULL;
        NEW.deletion_reason = NULL;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply the trigger to listings table
CREATE TRIGGER update_listings_deleted_at
BEFORE INSERT OR UPDATE ON listings
FOR EACH ROW
EXECUTE FUNCTION update_deleted_at();

-- Apply the trigger to wanted_requests table
CREATE TRIGGER update_wanted_requests_deleted_at
BEFORE INSERT OR UPDATE ON wanted_requests
FOR EACH ROW
EXECUTE FUNCTION update_deleted_at();

-- Function to permanently delete old soft-deleted records
CREATE OR REPLACE FUNCTION permanently_delete_old_records()
RETURNS TABLE (
    deleted_listings INTEGER,
    deleted_wanted_requests INTEGER
) AS $$
DECLARE
    listings_count INTEGER;
    wanted_requests_count INTEGER;
    cutoff_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Calculate cutoff date (30 days ago)
    cutoff_date := NOW() - INTERVAL '30 days';
    
    -- Log and delete old listings
    WITH deleted_listings AS (
        DELETE FROM listings
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < cutoff_date
        AND permanently_deleted = false
        RETURNING *
    )
    INSERT INTO deletion_logs (table_name, record_id, user_id, deleted_at, deletion_reason, record_data)
    SELECT 'listings', id, user_id, deleted_at, deletion_reason, to_jsonb(deleted_listings.*)
    FROM deleted_listings;
    
    GET DIAGNOSTICS listings_count = ROW_COUNT;
    
    -- Log and delete old wanted_requests
    WITH deleted_wanted AS (
        DELETE FROM wanted_requests
        WHERE deleted_at IS NOT NULL 
        AND deleted_at < cutoff_date
        AND permanently_deleted = false
        RETURNING *
    )
    INSERT INTO deletion_logs (table_name, record_id, user_id, deleted_at, deletion_reason, record_data)
    SELECT 'wanted_requests', id, user_id, deleted_at, deletion_reason, to_jsonb(deleted_wanted.*)
    FROM deleted_wanted;
    
    GET DIAGNOSTICS wanted_requests_count = ROW_COUNT;
    
    RETURN QUERY SELECT listings_count, wanted_requests_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view to monitor items pending permanent deletion
CREATE OR REPLACE VIEW pending_permanent_deletion AS
SELECT 
    'listing' as type,
    id,
    user_id,
    title,
    deleted_at,
    deleted_at + INTERVAL '30 days' as scheduled_permanent_deletion,
    CASE 
        WHEN deleted_at + INTERVAL '30 days' < NOW() THEN 'overdue'
        WHEN deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day' THEN 'imminent'
        ELSE 'pending'
    END as deletion_status
FROM listings
WHERE deleted_at IS NOT NULL AND permanently_deleted = false
UNION ALL
SELECT 
    'wanted_request' as type,
    id,
    user_id,
    title,
    deleted_at,
    deleted_at + INTERVAL '30 days' as scheduled_permanent_deletion,
    CASE 
        WHEN deleted_at + INTERVAL '30 days' < NOW() THEN 'overdue'
        WHEN deleted_at + INTERVAL '30 days' < NOW() + INTERVAL '1 day' THEN 'imminent'
        ELSE 'pending'
    END as deletion_status
FROM wanted_requests
WHERE deleted_at IS NOT NULL AND permanently_deleted = false
ORDER BY scheduled_permanent_deletion ASC;

-- Grant necessary permissions
GRANT SELECT ON deletion_logs TO authenticated;
GRANT SELECT ON pending_permanent_deletion TO authenticated;