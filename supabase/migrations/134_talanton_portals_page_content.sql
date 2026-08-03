-- Editable content for talanton.unit311central.com/portals (columns 2 and 3)

create table if not exists public.talanton_portals_page_content (
  id text primary key,
  major_modules jsonb not null default '[]'::jsonb,
  custom_modules jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.talanton_portals_page_content enable row level security;

drop policy if exists "talanton_portals_page_content_all" on public.talanton_portals_page_content;
create policy "talanton_portals_page_content_all" on public.talanton_portals_page_content
  for all using (true) with check (true);
