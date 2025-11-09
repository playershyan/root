-- Messaging enriched views and helper functions
-- Provides flattened conversation/message rows with profile data
-- and batched wanted-request match updates.

-- Conversation details view with participant profile fields
CREATE OR REPLACE VIEW public.conversation_details AS
SELECT
  c.*,
  bp.name AS buyer_name,
  bp.avatar_url AS buyer_avatar_url,
  sp.name AS seller_name,
  sp.avatar_url AS seller_avatar_url
FROM public.conversations c
LEFT JOIN public.profiles bp ON bp.id = c.buyer_id
LEFT JOIN public.profiles sp ON sp.id = c.seller_id;

GRANT SELECT ON public.conversation_details TO authenticated;

-- Message details view with sender profile fields
CREATE OR REPLACE VIEW public.message_details AS
SELECT
  m.*,
  p.name AS sender_name,
  p.avatar_url AS sender_avatar_url
FROM public.messages m
LEFT JOIN public.profiles p ON p.id = m.sender_id;

GRANT SELECT ON public.message_details TO authenticated;

-- Helper to increment wanted-request match counters in batch
CREATE OR REPLACE FUNCTION public.increment_wanted_request_match_counts(ids uuid[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF ids IS NULL OR array_length(ids, 1) IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.wanted_requests
  SET
    new_matches_count = COALESCE(new_matches_count, 0) + 1,
    last_match_notification = TIMEZONE('utc', NOW())
  WHERE id = ANY(ids);
END;
$$;

GRANT EXECUTE ON FUNCTION public.increment_wanted_request_match_counts(uuid[]) TO service_role;

