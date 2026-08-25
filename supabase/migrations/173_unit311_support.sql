-- Central Unit311 Support tickets (customer org ↔ Unit311 platform).
-- Separate from workspace-scoped support_tickets (customer Support Desk).

create table if not exists public.unit311_support_tickets (
  id text primary key,
  organisation_id uuid not null references public.platform_organisations (id) on delete restrict,
  workspace_id uuid not null references public.workspaces (id) on delete restrict,
  submitted_by_user_id text not null default '',
  submitted_by_name text not null default '',
  submitted_by_email text not null default '',
  subject text not null default '',
  description text not null default '',
  category text not null default 'other',
  affected_module text not null default '',
  severity text,
  status text not null default 'open',
  assigned_to text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint unit311_support_tickets_status_check check (
    status in ('open', 'in_progress', 'awaiting_customer', 'resolved', 'closed')
  ),
  constraint unit311_support_tickets_severity_check check (
    severity is null or severity in ('p1', 'p2', 'p3', 'p4')
  )
);

create index if not exists unit311_support_tickets_org_updated_idx
  on public.unit311_support_tickets (organisation_id, updated_at desc);

create index if not exists unit311_support_tickets_workspace_idx
  on public.unit311_support_tickets (workspace_id, updated_at desc);

create index if not exists unit311_support_tickets_status_idx
  on public.unit311_support_tickets (status, updated_at desc);

create table if not exists public.unit311_support_messages (
  id uuid primary key default gen_random_uuid(),
  ticket_id text not null references public.unit311_support_tickets (id) on delete cascade,
  author_kind text not null,
  author_user_id text not null default '',
  author_name text not null default '',
  body text not null default '',
  created_at timestamptz not null default now(),
  constraint unit311_support_messages_author_kind_check check (
    author_kind in ('customer', 'internal')
  )
);

create index if not exists unit311_support_messages_ticket_idx
  on public.unit311_support_messages (ticket_id, created_at asc);

alter table public.unit311_support_tickets enable row level security;
alter table public.unit311_support_messages enable row level security;

drop policy if exists unit311_support_tickets_all on public.unit311_support_tickets;
create policy unit311_support_tickets_all on public.unit311_support_tickets
  for all using (true) with check (true);

drop policy if exists unit311_support_messages_all on public.unit311_support_messages;
create policy unit311_support_messages_all on public.unit311_support_messages
  for all using (true) with check (true);

comment on table public.unit311_support_tickets is
  'Central Unit311 platform support tickets from customer workspaces (Tools → Unit311 Support).';

comment on table public.unit311_support_messages is
  'Conversation thread for central Unit311 Support tickets.';
