-- Platform login users (internal operators and external client portals)
-- Run in Supabase SQL Editor or via supabase db push

create table public.platform_users (
  id uuid primary key default gen_random_uuid(),
  username text not null,
  display_name text not null,
  password_hash text not null,
  user_type text not null check (user_type in ('internal', 'external')),
  redirect_path text not null,
  client_name text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint platform_users_username_unique unique (username)
);

create index platform_users_username_idx on public.platform_users (username);
create index platform_users_user_type_idx on public.platform_users (user_type);

alter table public.platform_users enable row level security;

create policy "platform_users_all" on public.platform_users
  for all using (true) with check (true);

insert into public.platform_users (
  username,
  display_name,
  password_hash,
  user_type,
  redirect_path,
  client_name
) values
  (
    'westport',
    'Westport',
    'westport-salt-v1:85750c42e0d34f2a300f6966cda7b609ebdb66f75d77f8b6104c96f8af879d1ccfadd082a3eaba2a48e4c597589731ca132c4bc9603646dce5ad14dfe381b194',
    'external',
    '/test1',
    'Westport Logistics Hub'
  ),
  (
    'paul.fotheringham',
    'Paul Fotheringham',
    'paul.fotheringham-salt-v1:790332724b5b0d191e6ea87a43f4256b3663e71f5bfeb8e34cee220d6ff12fa8460bb744792bd3009e86087919251f3759c31332962e9b0bb94a2e913ca112d7',
    'internal',
    '/internaldashboard',
    null
  ),
  (
    'ashley.pursglove',
    'Ashley Pursglove',
    'ashley.pursglove-salt-v1:11b3ff4b3361f72ea31669553d9bad347a344472f776b3e91f8dde49f72470e69aaa70eceda8eb36901f7e347e5e9ab1638263f6a7a8b85fc5fe740a2f387918',
    'internal',
    '/internaldashboard',
    null
  ),
  (
    'daniel.houlton',
    'Daniel Houlton',
    'daniel.houlton-salt-v1:828d75dc19edf2784d943bc4040895018e749ca7ef18d64417be97bd61a012c87d643e8d6d75864534988031d828d9b06da023251c7fd9fd8622d14c258734b0',
    'internal',
    '/internaldashboard',
    null
  );
