-- ABHI / multi-tenant Board of Directors (Corporate Information).
-- Scoped by workspace_id.

create extension if not exists pgcrypto;

create table if not exists public.board_directors (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  full_name text not null,
  role_title text not null default '',
  organisation text not null default '',
  email text,
  phone text,
  sort_order integer not null default 100,
  is_active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists board_directors_workspace_idx
  on public.board_directors (workspace_id, sort_order, full_name);

alter table public.board_directors enable row level security;

drop policy if exists "board_directors_service" on public.board_directors;
create policy "board_directors_service"
  on public.board_directors
  for all
  using (true)
  with check (true);
