-- Internal operations real-time messaging
-- Run in Supabase SQL Editor or via supabase db push

create table public.internal_messages (
  id uuid primary key default gen_random_uuid(),
  room text not null default 'internal-ops',
  operator_id text not null,
  operator_name text not null,
  username text not null,
  content text not null,
  created_at timestamptz not null default now()
);

create index internal_messages_room_created_idx
  on public.internal_messages (room, created_at desc);

alter table public.internal_messages enable row level security;

create policy "internal_messages_all" on public.internal_messages
  for all using (true) with check (true);

alter table public.internal_messages replica identity full;

alter publication supabase_realtime add table public.internal_messages;
