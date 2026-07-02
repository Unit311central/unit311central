alter table public.support_tickets
  add column if not exists client_phone text;

create index if not exists support_tickets_client_phone_idx on public.support_tickets (client_phone);
