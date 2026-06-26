-- Migration: Add facebook_pixel_id to realtors table
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS facebook_pixel_id text;
