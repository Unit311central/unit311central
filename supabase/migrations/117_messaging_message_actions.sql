-- Soft-delete / archive on messages + per-user saves
alter table public.internal_messages
  add column if not exists deleted_at timestamptz;

alter table public.internal_messages
  add column if not exists archived_at timestamptz;

create index if not exists internal_messages_room_active_idx
  on public.internal_messages (workspace_id, room, created_at)
  where deleted_at is null and archived_at is null;

create table if not exists public.internal_message_saves (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid,
  message_id uuid not null references public.internal_messages(id) on delete cascade,
  operator_id text not null,
  created_at timestamptz not null default now(),
  unique (message_id, operator_id)
);

create index if not exists internal_message_saves_operator_idx
  on public.internal_message_saves (workspace_id, operator_id, created_at desc);

alter table public.internal_message_saves enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'internal_message_saves'
      and policyname = 'internal_message_saves_all'
  ) then
    create policy "internal_message_saves_all" on public.internal_message_saves
      for all using (true) with check (true);
  end if;
end $$;
