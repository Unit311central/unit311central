-- Editable content for demo.unit311central.com/portals (major modules column)

create table if not exists public.demo_portals_page_content (
  id text primary key,
  major_modules jsonb not null default '[]'::jsonb,
  custom_modules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.demo_portals_page_content enable row level security;

drop policy if exists "demo_portals_page_content_all" on public.demo_portals_page_content;
create policy "demo_portals_page_content_all" on public.demo_portals_page_content
  for all using (true) with check (true);
