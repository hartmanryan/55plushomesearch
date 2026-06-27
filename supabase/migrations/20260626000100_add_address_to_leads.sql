-- Add columns for mailing address info to leads table for market analysis & gift card delivery
alter table leads 
add column street_address text,
add column city text,
add column state text,
add column zip text;
