create table if not exists public.whatsapp_inbound_log (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'textmebot',
  from_phone text,
  from_name text,
  message text not null default '',
  result text,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_inbound_log_created_idx
  on public.whatsapp_inbound_log (created_at desc);

alter table public.whatsapp_inbound_log enable row level security;

drop policy if exists "whatsapp_inbound_log_all" on public.whatsapp_inbound_log;
create policy "whatsapp_inbound_log_all" on public.whatsapp_inbound_log
  for all using (true) with check (true);
