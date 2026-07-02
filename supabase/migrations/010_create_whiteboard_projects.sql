-- Named whiteboard projects with owner and scene data
-- Run in Supabase SQL Editor or via supabase db push

create table if not exists public.whiteboard_projects (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'New project',
  owner_user_id uuid,
  owner_name text not null default 'Unknown',
  scene jsonb not null default '{"elements":[],"appState":{"theme":"dark"},"files":{}}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whiteboard_projects_updated_idx
  on public.whiteboard_projects (updated_at desc);

create index if not exists whiteboard_projects_owner_idx
  on public.whiteboard_projects (owner_user_id);

alter table public.whiteboard_projects enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'whiteboard_projects'
      and policyname = 'whiteboard_projects_all'
  ) then
    create policy "whiteboard_projects_all" on public.whiteboard_projects
      for all using (true) with check (true);
  end if;
end $$;

insert into public.whiteboard_projects (name, owner_name, scene)
select 'Team whiteboard', 'Shared', scene
from public.internal_whiteboard
where id = 'shared'
  and not exists (select 1 from public.whiteboard_projects limit 1);
