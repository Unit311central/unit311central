create table if not exists public.support_tickets (
  id text primary key,
  name text not null,
  organisation text not null default '',
  priority text not null default 'low' check (priority in ('low', 'medium', 'high', 'urgent')),
  description text not null default '',
  user_assigned text,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists support_tickets_archived_idx on public.support_tickets (archived);
create index if not exists support_tickets_priority_idx on public.support_tickets (priority);
create index if not exists support_tickets_organisation_idx on public.support_tickets (organisation);

alter table public.support_tickets enable row level security;

drop policy if exists "support_tickets_all" on public.support_tickets;
create policy "support_tickets_all" on public.support_tickets
  for all using (true) with check (true);

insert into public.support_tickets (
  id, name, organisation, priority, description, user_assigned, archived
) values
  (
    'SUP-001',
    'James O''Sullivan',
    'Westport Mining',
    'low',
    'Request for orthophoto delivery timeline update for Q2 survey block.',
    null,
    false
  ),
  (
    'SUP-002',
    'Laura Méndez',
    'Venturi Energy',
    'medium',
    'Fleet calibration certificate renewal — Matrice 4T unit #3 due end of month.',
    'fortp0',
    false
  )
on conflict (id) do nothing;
