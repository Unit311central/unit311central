-- Add notes field to competitors
-- Run in Supabase SQL Editor or via supabase db push

alter table public.competitors
  add column if not exists notes text;
