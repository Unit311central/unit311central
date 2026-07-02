-- Internal operations projects (live and upcoming)

create table if not exists public.internal_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client_id text,
  client_name text not null,
  site text,
  region text,
  operator text,
  phase text not null default 'upcoming',
  start_date date,
  end_date date,
  progress_pct numeric(5, 2) not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists internal_projects_phase_idx
  on public.internal_projects (phase, start_date asc nulls last);

alter table public.internal_projects enable row level security;

create policy "internal_projects_all" on public.internal_projects
  for all using (true) with check (true);

alter table public.internal_projects replica identity full;

do $$
begin
  if exists (select 1 from public.internal_projects limit 1) then
    return;
  end if;

  insert into public.internal_projects (name, client_id, client_name, site, region, operator, phase, start_date, progress_pct, notes)
  values
    (
      'Douro Berth Volumetrics',
      'client-2',
      'Douro Maritime Logistics',
      'Matosinhos Terminal Berth 4',
      'Porto, Portugal',
      'Daniel Houlton',
      'live',
      current_date - 3,
      62,
      'Weekly stockpile and berth survey — Matrice 4T + LiDAR.'
    ),
    (
      'Oxford Campus Envelope',
      'client-3',
      'Oxford Heritage Survey Ltd',
      'Central quad & chapel',
      'Oxfordshire, UK',
      'Ashley Pursglove',
      'live',
      current_date - 1,
      35,
      'Phase 2 orthomosaic capture for listed buildings.'
    ),
    (
      'Catalonia Substation Thermal',
      'client-1',
      'Catalonia Energy Partners',
      'Zaragoza substation yard',
      'Catalonia, Spain',
      'Paul Fotheringham',
      'live',
      current_date,
      18,
      'Radiometric inspection of transformer yard assets.'
    ),
    (
      'Iberia Corridor Pilot',
      'client-4',
      'Iberia Infrastructure Group',
      'Madrid–Valencia corridor',
      'Iberia',
      'Paul Fotheringham',
      'upcoming',
      current_date + 14,
      0,
      'Pilot corridor mapping — awaiting mobilisation sign-off.'
    ),
    (
      'Westport Warehouse Zones',
      'client-westport',
      'Westport Logistics Hub',
      'Perth industrial precinct',
      'Western Australia',
      'Paul Fotheringham',
      'upcoming',
      current_date + 45,
      0,
      'Earthworks and drainage monitoring programme.'
    ),
    (
      'Riells del Fai Corridor Survey',
      'client-1',
      'Catalonia Energy Partners',
      'Riells del Fai',
      'Catalonia, Spain',
      'Paul Fotheringham',
      'upcoming',
      current_date + 7,
      0,
      'Follow-on corridor LiDAR after substation thermal pass.'
    );
end $$;
