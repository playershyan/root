-- Migration: Enhance Bin Functions for Full Feature Support
-- Date: 2025-10-17
-- Description: Update get_user_bin_items and restore_user_item functions to return complete data

-- Drop old functions first due to signature changes
DROP FUNCTION IF EXISTS public.get_user_bin_items(uuid);
DROP FUNCTION IF EXISTS public.restore_user_item(uuid, text, uuid);

-- ============================================
-- 1. Enhanced get_user_bin_items Function
-- ============================================

CREATE FUNCTION public.get_user_bin_items(p_user_id uuid)
RETURNS TABLE(
    id text,
    item_type text,
    item_id uuid,
    title text,
    deleted_at timestamptz,
    deletion_reason text,
    can_restore boolean,
    days_until_permanent_deletion integer,
    original_data jsonb
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
    RETURN QUERY
    -- Listings
    SELECT
        ('listing-' || l.id::text)::text as id,
        'listing'::text as item_type,
        l.id as item_id,
        l.title,
        l.deleted_at,
        'User deleted'::text as deletion_reason,
        (l.deleted_at > NOW() - INTERVAL '30 days') as can_restore,
        GREATEST(0, 30 - EXTRACT(day FROM NOW() - l.deleted_at)::integer) as days_until_permanent_deletion,
        jsonb_build_object(
            'price', l.price,
            'location', l.location,
            'mileage', l.mileage,
            'year', l.year,
            'make', l.make,
            'model', l.model,
            'status', l.status
        ) as original_data
    FROM public.listings l
    WHERE l.user_id = p_user_id
    AND l.deleted_at IS NOT NULL

    UNION ALL

    -- Wanted Requests
    SELECT
        ('wanted-' || w.id::text)::text as id,
        'wanted_request'::text as item_type,
        w.id as item_id,
        w.title,
        w.deleted_at,
        'User deleted'::text as deletion_reason,
        (w.deleted_at > NOW() - INTERVAL '30 days') as can_restore,
        GREATEST(0, 30 - EXTRACT(day FROM NOW() - w.deleted_at)::integer) as days_until_permanent_deletion,
        jsonb_build_object(
            'budget', w.budget,
            'preferences', w.preferences,
            'status', w.status
        ) as original_data
    FROM public.wanted_requests w
    WHERE w.user_id = p_user_id
    AND w.deleted_at IS NOT NULL

    ORDER BY deleted_at DESC;
END;
$$;

-- ============================================
-- 2. Enhanced restore_user_item Function
-- ============================================

CREATE FUNCTION public.restore_user_item(
    p_user_id uuid,
    p_item_type text,
    p_item_id uuid
)
RETURNS TABLE(
    success boolean,
    message text,
    restored_status text
)
LANGUAGE plpgsql
SET search_path = ''
AS $$
DECLARE
    v_success boolean := false;
    v_message text;
    v_restored_status text;
    v_affected_rows integer;
BEGIN
    IF p_item_type = 'listing' THEN
        UPDATE public.listings
        SET
            deleted_at = NULL,
            permanently_deleted = false,
            status = 'pending',  -- Restore as pending for review
            updated_at = NOW()
        WHERE id = p_item_id
        AND user_id = p_user_id
        AND deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days';

        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
        v_success := v_affected_rows > 0;
        v_restored_status := 'pending';
        v_message := CASE
            WHEN v_success THEN 'Listing restored successfully'
            ELSE 'Unable to restore listing - it may have been permanently deleted or does not exist'
        END;

    ELSIF p_item_type = 'wanted_request' THEN
        UPDATE public.wanted_requests
        SET
            deleted_at = NULL,
            permanently_deleted = false,
            status = 'paused',  -- Restore as paused for review
            updated_at = NOW()
        WHERE id = p_item_id
        AND user_id = p_user_id
        AND deleted_at IS NOT NULL
        AND deleted_at > NOW() - INTERVAL '30 days';

        GET DIAGNOSTICS v_affected_rows = ROW_COUNT;
        v_success := v_affected_rows > 0;
        v_restored_status := 'paused';
        v_message := CASE
            WHEN v_success THEN 'Wanted request restored successfully'
            ELSE 'Unable to restore wanted request - it may have been permanently deleted or does not exist'
        END;

    ELSE
        v_success := false;
        v_message := 'Invalid item type';
        v_restored_status := 'error';
    END IF;

    -- Log the restoration if successful
    IF v_success THEN
        BEGIN
            INSERT INTO public.deletion_logs (table_name, record_id, user_id, deletion_reason, created_at)
            VALUES (p_item_type, p_item_id, p_user_id, 'User restored item', NOW());
        EXCEPTION WHEN OTHERS THEN
            -- Ignore logging errors, don't fail the restore
            NULL;
        END;
    END IF;

    RETURN QUERY SELECT v_success, v_message, v_restored_status;
END;
$$;

-- ============================================
-- 3. Grant Permissions
-- ============================================

GRANT EXECUTE ON FUNCTION public.get_user_bin_items(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.restore_user_item(uuid, text, uuid) TO authenticated;

-- ============================================
-- 4. Test the Functions
-- ============================================

-- Test query (commented out - uncomment to test manually):
-- SELECT * FROM public.get_user_bin_items('YOUR_USER_ID_HERE');
-- SELECT * FROM public.restore_user_item('YOUR_USER_ID_HERE', 'listing', 'LISTING_ID_HERE');
