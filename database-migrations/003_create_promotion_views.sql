-- Migration: Create Promotion Analytics Views
-- Run this after 002_create_promotion_functions.sql

-- Create view for promotion rotation statistics
CREATE OR REPLACE VIEW promotion_rotation_stats AS
SELECT 
  p.id,
  p.listing_id,
  p.promotion_type,
  p.impressions,
  p.rotation_score,
  p.last_shown_at,
  p.amount,
  p.created_at,
  p.expires_at,
  l.title,
  l.vehicle_type,
  l.make,
  l.model,
  l.price,
  CASE 
    WHEN p.last_shown_at IS NULL THEN 'Never shown'
    WHEN p.last_shown_at > NOW() - INTERVAL '1 hour' THEN 'Shown recently'
    WHEN p.last_shown_at > NOW() - INTERVAL '6 hours' THEN 'Shown today'
    WHEN p.last_shown_at > NOW() - INTERVAL '24 hours' THEN 'Shown yesterday'
    ELSE 'Not shown recently'
  END as show_status,
  CASE
    WHEN EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400 > 0 THEN
      p.impressions::FLOAT / GREATEST(EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 86400, 1)
    ELSE 0
  END as avg_daily_impressions,
  EXTRACT(EPOCH FROM (p.expires_at - NOW())) / 86400 as days_remaining
FROM promotions p
JOIN listings l ON l.id = p.listing_id
WHERE p.is_active = true
  AND p.expires_at > NOW()
ORDER BY p.promotion_type, p.impressions ASC;

-- Create view for promotion performance summary
CREATE OR REPLACE VIEW promotion_performance_summary AS
SELECT 
  promotion_type,
  COUNT(*) as total_active_promotions,
  SUM(impressions) as total_impressions,
  AVG(impressions) as avg_impressions_per_promotion,
  MIN(impressions) as min_impressions,
  MAX(impressions) as max_impressions,
  COUNT(CASE WHEN last_shown_at > NOW() - INTERVAL '1 hour' THEN 1 END) as shown_recently,
  COUNT(CASE WHEN last_shown_at IS NULL THEN 1 END) as never_shown,
  SUM(amount) as total_revenue,
  AVG(amount) as avg_price
FROM promotions
WHERE is_active = true AND expires_at > NOW()
GROUP BY promotion_type
ORDER BY 
  CASE promotion_type 
    WHEN 'featured' THEN 1
    WHEN 'top_spot' THEN 2
    WHEN 'boost' THEN 3
    WHEN 'urgent' THEN 4
  END;

-- Create view for fair share analysis
CREATE OR REPLACE VIEW promotion_fair_share AS
SELECT 
  p.id,
  p.listing_id,
  p.promotion_type,
  p.impressions,
  l.title,
  -- Calculate theoretical fair share
  CASE p.promotion_type
    WHEN 'featured' THEN 
      LEAST(100, (2.0 / COUNT(*) OVER (PARTITION BY p.promotion_type)) * 100)
    WHEN 'top_spot' THEN 
      LEAST(100, (2.0 / COUNT(*) OVER (PARTITION BY p.promotion_type)) * 100)
    ELSE 
      (100.0 / COUNT(*) OVER (PARTITION BY p.promotion_type))
  END as theoretical_fair_share_percent,
  -- Calculate actual share based on impressions
  CASE 
    WHEN SUM(p.impressions) OVER (PARTITION BY p.promotion_type) > 0 THEN
      (p.impressions::FLOAT / SUM(p.impressions) OVER (PARTITION BY p.promotion_type)) * 100
    ELSE 0
  END as actual_share_percent,
  COUNT(*) OVER (PARTITION BY p.promotion_type) as competing_ads,
  CASE p.promotion_type
    WHEN 'featured' THEN 2
    WHEN 'top_spot' THEN 2
    ELSE 999 -- Unlimited for boost and urgent
  END as available_slots
FROM promotions p
JOIN listings l ON l.id = p.listing_id
WHERE p.is_active = true AND p.expires_at > NOW();

-- Create view for daily rotation cycles
CREATE OR REPLACE VIEW daily_rotation_cycles AS
SELECT 
  DATE(created_at) as rotation_date,
  promotion_type,
  rotation_cycle,
  COUNT(*) as ads_rotated,
  AVG(impressions_in_cycle) as avg_impressions_per_cycle,
  MAX(last_rotated_at) as last_rotation_time
FROM promotion_rotations
GROUP BY DATE(created_at), promotion_type, rotation_cycle
ORDER BY rotation_date DESC, promotion_type;

-- Create view for listing promotion status
CREATE OR REPLACE VIEW listing_promotion_status AS
SELECT 
  l.id,
  l.title,
  l.vehicle_type,
  l.make,
  l.model,
  l.price,
  l.created_at,
  l.is_featured,
  l.is_top_spot,
  l.is_boosted,
  l.is_urgent,
  l.featured_until,
  l.top_spot_until,
  l.boosted_until,
  l.urgent_until,
  -- Count active promotions
  (SELECT COUNT(*) FROM promotions p WHERE p.listing_id = l.id AND p.is_active = true AND p.expires_at > NOW()) as active_promotion_count,
  -- Calculate total promotion spend
  (SELECT SUM(amount) FROM promotions p WHERE p.listing_id = l.id AND p.is_active = true AND p.expires_at > NOW()) as total_promotion_spend,
  -- Get promotion types
  (SELECT string_agg(promotion_type, ', ') FROM promotions p WHERE p.listing_id = l.id AND p.is_active = true AND p.expires_at > NOW()) as active_promotions
FROM listings l
WHERE EXISTS (
  SELECT 1 FROM promotions p 
  WHERE p.listing_id = l.id 
  AND p.is_active = true 
  AND p.expires_at > NOW()
)
ORDER BY active_promotion_count DESC, total_promotion_spend DESC;