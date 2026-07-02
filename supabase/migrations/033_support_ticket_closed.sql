alter table public.support_tickets
  add column if not exists closed boolean not null default false;

create index if not exists support_tickets_closed_idx on public.support_tickets (closed);
