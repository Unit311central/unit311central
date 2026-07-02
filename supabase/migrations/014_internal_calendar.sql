-- Internal operations calendar (meetings, onsite visits, etc.)

create table if not exists public.internal_calendar_events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  event_type text not null default 'meeting',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  client_name text,
  location text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_calendar_events_starts_at_idx
  on public.internal_calendar_events (starts_at asc);

alter table public.internal_calendar_events enable row level security;

create policy "internal_calendar_events_all" on public.internal_calendar_events
  for all using (true) with check (true);

alter table public.internal_calendar_events replica identity full;

-- Sample events for the current month
insert into public.internal_calendar_events (title, event_type, starts_at, ends_at, client_name, location, notes)
select
  'Team standup',
  'meeting',
  date_trunc('week', now()) + interval '1 day 9 hours',
  date_trunc('week', now()) + interval '1 day 9 hours 30 minutes',
  null,
  'Google Meet',
  'Weekly ops sync'
where not exists (select 1 from public.internal_calendar_events limit 1);

insert into public.internal_calendar_events (title, event_type, starts_at, ends_at, client_name, location, notes)
select
  'Site survey — Iberdrola',
  'onsite',
  date_trunc('week', now()) + interval '3 days 8 hours',
  date_trunc('week', now()) + interval '3 days 16 hours',
  'Iberdrola Renewables',
  'Zaragoza substation',
  'Thermal inspection of transformer yard'
where (select count(*) from public.internal_calendar_events) < 2;
