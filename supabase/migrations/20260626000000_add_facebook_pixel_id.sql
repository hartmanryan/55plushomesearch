-- Migration: Add facebook_pixel_id and ref_id to realtors table
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS facebook_pixel_id text;
ALTER TABLE realtors ADD COLUMN IF NOT EXISTS ref_id integer unique;

