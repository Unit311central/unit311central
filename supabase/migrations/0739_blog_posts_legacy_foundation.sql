-- Legacy CMS table present on production (kkxtvzxqmbacjatkiupq); original CREATE migration was never committed.
-- Runs before 076_workspace_id_phase1.sql (which adds workspace_id to blog_posts).
-- Safe no-op when the table already exists on production.

create table if not exists public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
