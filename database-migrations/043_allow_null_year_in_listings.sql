-- Migration: Allow NULL year in listings table
-- Date: 2025-12-03
-- Description: Remove NOT NULL constraint from year column to allow listings without year

ALTER TABLE listings
ALTER COLUMN year DROP NOT NULL;

COMMENT ON COLUMN listings.year IS 'Vehicle manufacturing year. NULL indicates year not specified';
