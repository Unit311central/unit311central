-- Shared internal whiteboard scene (Excalidraw JSON)
-- Run in Supabase SQL Editor or via supabase db push

create table public.internal_whiteboard (
  id text primary key default 'shared',
  scene jsonb not null default '{"elements":[],"appState":{"theme":"dark"},"files":{}}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.internal_whiteboard (id)
values ('shared')
on conflict (id) do nothing;

alter table public.internal_whiteboard enable row level security;

create policy "internal_whiteboard_all" on public.internal_whiteboard
  for all using (true) with check (true);
