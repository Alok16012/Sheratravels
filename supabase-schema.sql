-- ═══════════════════════════════════════
-- SHERA TRAVELS — ITINERARY MAKER
-- Supabase SQL Schema
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════

-- 1. PACKAGES TABLE
create table if not exists packages (
  id uuid primary key default gen_random_uuid(),
  title text,
  sub_title text,
  nights int default 5,
  days int default 6,
  start_location text,
  hero_photo_url text,
  inclusions text[] default '{}',
  exclusions text[] default '{}',
  tc_payment text,
  tc_cancel text,
  tc_notes text,
  company_name text default 'Shera Travels',
  company_addr text default 'Radio Colony, Srinagar, Lawaypora, Srinagar, Jammu and Kashmir 190017',
  company_email text default 'sheratravels21@gmail.com',
  company_phone text default '+91-9149406965, 9858966518',
  company_gst text default '01KODPS7232P1ZE',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 2. PRICES TABLE
create table if not exists prices (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references packages(id) on delete cascade,
  pax_type text,
  age_limit text,
  price numeric default 0,
  sort_order int default 0
);

-- 3. DAYS TABLE
create table if not exists days (
  id uuid primary key default gen_random_uuid(),
  package_id uuid references packages(id) on delete cascade,
  day_number int default 1,
  title text,
  description text,
  distance text,
  hotspots text[] default '{}',
  themes text[] default '{}',
  meals text[] default '{"Stay","Breakfast","Dinner"}',
  accommodation text,
  accom_star int default 3,
  hotel_photo_url text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- 4. DAY PHOTOS TABLE
create table if not exists day_photos (
  id uuid primary key default gen_random_uuid(),
  day_id uuid references days(id) on delete cascade,
  photo_url text not null,
  tag_name text,
  tag_type text,
  slot_index int default 0,
  created_at timestamptz default now()
);

-- 5. PHOTO LIBRARY TABLE
create table if not exists photo_library (
  id uuid primary key default gen_random_uuid(),
  photo_url text not null,
  file_name text,
  tag_name text,
  tag_type text,  -- 'hotel' | 'location'
  created_at timestamptz default now()
);

-- ═══════════════════════════════════════
-- CRM TABLES
-- ═══════════════════════════════════════

-- 6. LEADS TABLE
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  whatsapp text,
  email text,
  destination text,
  travel_date date,
  return_date date,
  adults int default 1,
  children int default 0,
  infants int default 0,
  budget_min numeric,
  budget_max numeric,
  stage text default 'new_inquiry',
  source text default 'whatsapp',
  package_id uuid references packages(id) on delete set null,
  assigned_to text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 7. LEAD NOTES / TIMELINE TABLE
create table if not exists lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  content text not null,
  type text default 'note',   -- 'note' | 'call' | 'whatsapp' | 'email' | 'stage_change'
  created_at timestamptz default now()
);

alter table leads disable row level security;
alter table lead_notes disable row level security;

-- 8. BOOKINGS TABLE
create table if not exists bookings (
  id uuid primary key default gen_random_uuid(),
  booking_ref text unique,                        -- e.g. ST-2026-0001
  lead_id uuid references leads(id) on delete set null,
  package_id uuid references packages(id) on delete set null,

  -- Customer details (copied from lead at booking time)
  customer_name text not null,
  customer_email text,
  customer_phone text,
  customer_whatsapp text,

  -- Trip details
  destination text,
  travel_date date,
  return_date date,
  adults int default 1,
  children int default 0,
  infants int default 0,
  nights int default 0,

  -- Amounts
  total_amount numeric default 0,
  advance_percent numeric default 20,
  advance_amount numeric default 0,
  balance_amount numeric default 0,
  paid_amount numeric default 0,

  -- Status: draft | confirmed | advance_paid | balance_due | fully_paid | completed | cancelled
  status text default 'confirmed',

  -- Public form token (for customer self-fill)
  booking_token text unique default gen_random_uuid()::text,

  -- Razorpay
  razorpay_order_id text,
  razorpay_payment_link_id text,
  razorpay_payment_link_url text,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- 9. PAYMENTS TABLE
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid references bookings(id) on delete cascade,
  amount numeric not null,
  type text default 'advance',           -- 'advance' | 'balance' | 'full'
  method text default 'razorpay',        -- 'razorpay' | 'cash' | 'bank_transfer' | 'upi'
  razorpay_payment_id text,
  razorpay_order_id text,
  status text default 'success',         -- 'pending' | 'success' | 'failed'
  notes text,
  paid_at timestamptz default now(),
  created_at timestamptz default now()
);

alter table bookings disable row level security;
alter table payments disable row level security;

-- ═══════════════════════════════════════
-- RLS POLICIES (Disable for personal use, or set up properly)
-- For a personal tool, you can disable RLS:
-- ═══════════════════════════════════════

-- Option A: Disable RLS (simplest for personal use)
alter table packages disable row level security;
alter table prices disable row level security;
alter table days disable row level security;
alter table day_photos disable row level security;
alter table photo_library disable row level security;

-- ═══════════════════════════════════════
-- MIGRATION: Add company_gst if not already present
-- Run this if you already have the packages table from an older schema
-- ═══════════════════════════════════════
alter table packages add column if not exists company_gst text default '01KODPS7232P1ZE';

-- Update existing rows with the correct address and GST (run only if needed)
-- update packages set company_gst = '01KODPS7232P1ZE' where company_gst is null;
-- update packages set company_addr = 'Radio Colony, Srinagar, Lawaypora, Srinagar, Jammu and Kashmir 190017' where company_addr = 'Budgam, Jammu & Kashmir, India';

-- ═══════════════════════════════════════
-- STORAGE BUCKET
-- Create manually in Supabase Dashboard:
-- Storage → New Bucket → Name: "itinerary-photos" → Public: YES
-- ═══════════════════════════════════════
