-- Fix wanted requests approval flow
-- Add missing vehicle_type column and fix related issues

-- Add missing vehicle_type column
ALTER TABLE wanted_requests ADD COLUMN IF NOT EXISTS vehicle_type TEXT;

-- Create index for vehicle_type for better query performance
CREATE INDEX IF NOT EXISTS idx_wanted_requests_vehicle_type ON wanted_requests(vehicle_type);

-- Update RLS policies to allow admins to view pending requests
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Users can view active wanted requests or their own" ON wanted_requests;

-- Create new policy that allows public to view active requests and users to view their own
CREATE POLICY "Users can view active wanted requests or their own" ON wanted_requests
    FOR SELECT USING (
        (status = 'active' AND is_active = true) OR
        (auth.uid() = user_id)
    );

-- Create admin policy for viewing all requests including pending ones
CREATE POLICY IF NOT EXISTS "Admins can view all wanted requests" ON wanted_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users au
            WHERE au.user_id = auth.uid()
            AND au.is_active = true
        )
    );

-- Update comment
COMMENT ON COLUMN wanted_requests.vehicle_type IS 'Type of vehicle requested (car, van, suv, etc.)';