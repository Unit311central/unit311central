-- DroneCatalyst FlightHub sandbox: telemetry storage
-- Run in Supabase SQL Editor or via supabase db push

create table public.telemetry (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  drone_id text not null,
  "timestamp" timestamptz not null,
  latitude double precision not null,
  longitude double precision not null,
  altitude double precision,
  speed double precision,
  battery double precision,
  status text
);

create index telemetry_drone_id_idx on public.telemetry (drone_id);
create index telemetry_timestamp_idx on public.telemetry ("timestamp");
