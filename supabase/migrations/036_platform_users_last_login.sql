-- Track last login for platform users (internal + external portals)

alter table public.platform_users
  add column if not exists last_login_at timestamptz;

create index if not exists platform_users_last_login_idx
  on public.platform_users (last_login_at desc nulls last);
