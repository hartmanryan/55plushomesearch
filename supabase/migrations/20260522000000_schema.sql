-- Setup UUID Generation Extension
create extension if not exists "uuid-ossp";

-- 1. REALTORS / TENANTS TABLE
create table realtors (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  email text unique not null,
  phone text not null,
  target_subdomain text unique not null, -- e.g., 'york' or 'tampa'
  default_area text,
  facebook_pixel_id text,
  ref_id integer unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. COMMUNITIES DATA ASSETS
create table communities (
  id uuid default gen_random_uuid() primary key,
  realtor_id uuid references realtors(id) on delete cascade not null,
  name text not null,
  region text not null,                  -- e.g., 'North York', 'South York'
  price_min integer,
  price_max integer,
  hoa_fee numeric,
  hoa_frequency text default 'monthly',  -- 'monthly', 'quarterly', 'annually'
  hoa_inclusions text[],                 -- ['Lawn care', 'Snow removal', 'Roof']
  amenities text[],                      -- ['Clubhouse', 'Pickleball', 'Pool']
  home_types text[],                     -- ['Single Family', 'Townhome', 'Villa']
  realtor_notes text,                    -- AI deep context injection
  community_url text,                    -- Link to active listings or neighborhood profile
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. LEADS & SURVEY SUBMISSIONS
create table leads (
  id uuid default gen_random_uuid() primary key,
  realtor_id uuid references realtors(id) on delete cascade not null,
  name text,
  email text,
  phone text,
  moving_timeline text,                  -- 'ASAP', '3-6 months', 'Browsing'
  budget_min integer,
  budget_max integer,
  preferred_style text,                  -- 'Single Family', 'Townhome', 'Condo'
  must_have_amenities text[],
  bedrooms integer default 2,
  bathrooms numeric default 2,
  is_live_takeover_requested boolean default false,
  current_residence text default 'Unknown',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. CHAT MESSAGES LOG
create table chat_messages (
  id uuid default gen_random_uuid() primary key,
  lead_id uuid references leads(id) on delete cascade not null,
  sender text not null,                  -- 'user', 'ai', 'realtor'
  message text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- PERFORMANCE INDICES FOR MULTI-TENANT QUERYING
create index idx_realtors_subdomain on realtors(target_subdomain);
create index idx_communities_realtor on communities(realtor_id);
create index idx_leads_realtor on leads(realtor_id);
create index idx_chat_messages_lead on chat_messages(lead_id);
