-- Support Lounge: anonymous client-facing intake into a tenant workspace.
-- Entry is a per-client lounge token; requesters are cookie-scoped (no login gate).

alter table public.internal_clients
  add column if not exists support_lounge_token text,
  add column if not exists support_lounge_enabled boolean not null default true;

create unique index if not exists internal_clients_support_lounge_token_uidx
  on public.internal_clients (support_lounge_token)
  where support_lounge_token is not null;

alter table public.support_tickets
  add column if not exists client_id text,
  add column if not exists requester_anon_id text,
  add column if not exists requester_email text,
  add column if not exists ticket_public_token text,
  add column if not exists status text not null default 'open',
  add column if not exists escalated boolean not null default false,
  add column if not exists source text not null default 'manual';

update public.support_tickets
set status = 'closed'
where closed is true
  and coalesce(status, 'open') = 'open';

create unique index if not exists support_tickets_ticket_public_token_uidx
  on public.support_tickets (ticket_public_token)
  where ticket_public_token is not null;

create index if not exists support_tickets_client_id_idx
  on public.support_tickets (client_id);

create index if not exists support_tickets_requester_anon_id_idx
  on public.support_tickets (requester_anon_id);

create index if not exists support_tickets_lounge_lookup_idx
  on public.support_tickets (workspace_id, client_id, requester_anon_id);

create table if not exists public.support_lounge_messages (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  ticket_id text not null references public.support_tickets (id) on delete cascade,
  role text not null check (role in ('user', 'assistant', 'operator', 'system')),
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists support_lounge_messages_ticket_idx
  on public.support_lounge_messages (ticket_id, created_at);

alter table public.support_lounge_messages enable row level security;

drop policy if exists "support_lounge_messages_all" on public.support_lounge_messages;
create policy "support_lounge_messages_all" on public.support_lounge_messages
  for all using (true) with check (true);
