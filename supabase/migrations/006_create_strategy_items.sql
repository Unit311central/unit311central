-- Internal strategy capability matrix
-- Run in Supabase SQL Editor or via supabase db push

create table public.strategy_items (
  id uuid primary key default gen_random_uuid(),
  category text not null check (category in ('surveying', 'inspection', 'media')),
  label text not null,
  sort_order integer not null,
  notes text not null default '',
  priority integer check (priority between 1 and 5),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint strategy_items_category_label_unique unique (category, label)
);

create index strategy_items_category_sort_idx on public.strategy_items (category, sort_order);

alter table public.strategy_items enable row level security;

create policy "strategy_items_all" on public.strategy_items
  for all using (true) with check (true);

insert into public.strategy_items (category, label, sort_order) values
  ('surveying', 'Stockpile & volume Analytics', 1),
  ('surveying', 'Construction & volume Surveying', 2),
  ('surveying', 'Site measurements', 3),
  ('surveying', 'Earthworks monitoring', 4),
  ('surveying', 'Construction progress intelligence', 5),
  ('surveying', 'Point clouds', 6),
  ('surveying', 'Orthomosaics', 7),
  ('surveying', 'DSM/DTM models', 8),
  ('surveying', 'Volumetrics', 9),
  ('surveying', 'Progress comparison', 10),
  ('inspection', 'Building & roof inspections', 1),
  ('inspection', 'Solar inspections (thermal)', 2),
  ('inspection', 'Industrial inspections', 3),
  ('inspection', 'Warehouses', 4),
  ('inspection', 'Logistics parks', 5),
  ('inspection', 'Rail inspections', 6),
  ('inspection', 'Road inspections', 7),
  ('inspection', 'Pipeline inspections', 8),
  ('inspection', 'Utility inspections', 9),
  ('inspection', 'Asset condition reporting', 10),
  ('media', 'Real estate', 1),
  ('media', 'Hospitality', 2),
  ('media', 'Tourism', 3),
  ('media', 'Construction marketing', 4),
  ('media', 'Marinas', 5),
  ('media', 'Ports', 6),
  ('media', 'Yacht marketing', 7),
  ('media', 'Corporate content', 8),
  ('media', 'Event coverage', 9);
