-- Internal competitor tracking by region
-- Run in Supabase SQL Editor or via supabase db push

create table public.competitors (
  id uuid primary key default gen_random_uuid(),
  region text not null check (region in ('uk', 'spain', 'portugal')),
  company_name text not null default 'New Company',
  website text,
  services text,
  last_revenue text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index competitors_region_idx on public.competitors (region);
create index competitors_sort_order_idx on public.competitors (region, sort_order);

alter table public.competitors enable row level security;

create policy "competitors_all" on public.competitors
  for all using (true) with check (true);
