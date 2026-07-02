create table if not exists public.whatsapp_support_sessions (
  phone text primary key,
  ticket_id text not null references public.support_tickets (id) on delete cascade,
  step text not null check (
    step in (
      'awaiting_name',
      'awaiting_organisation',
      'awaiting_priority',
      'awaiting_description',
      'awaiting_assignment'
    )
  ),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_support_sessions_ticket_idx
  on public.whatsapp_support_sessions (ticket_id);

alter table public.whatsapp_support_sessions enable row level security;

drop policy if exists "whatsapp_support_sessions_all" on public.whatsapp_support_sessions;
create policy "whatsapp_support_sessions_all" on public.whatsapp_support_sessions
  for all using (true) with check (true);
