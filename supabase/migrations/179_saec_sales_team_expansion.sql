-- OmniTransit (SAEC workspace): expand sales team to six reps and distribute pipeline ownership.
-- Idempotent — stable UUIDs.

do $$
declare
  v_saec_id uuid;
  v_team_id uuid;
  v_demo_id uuid;
  v_admin_id uuid;
  v_rep1 uuid := 'a8000001-0001-4001-8001-000000000001';
  v_rep2 uuid := 'a8000001-0001-4001-8001-000000000002';
  v_rep3 uuid := 'a8000001-0001-4001-8001-000000000003';
  v_rep4 uuid := 'a8000001-0001-4001-8001-000000000004';
  v_rep5 uuid := 'a8000001-0001-4001-8001-000000000005';
  v_manager_id uuid;
  v_password_hash text;
begin
  select id into v_saec_id from public.workspaces where slug = 'saec' limit 1;
  if v_saec_id is null then
    raise notice '179_saec_sales_team_expansion: saec workspace missing — skipped';
    return;
  end if;

  select id into v_demo_id
  from public.platform_users
  where workspace_id = v_saec_id and lower(username) = 'demo@omnitransit.com'
  limit 1;

  select id into v_admin_id
  from public.platform_users
  where workspace_id = v_saec_id and lower(username) = 'admin@omnitransit.com'
  limit 1;

  select password_hash into v_password_hash
  from public.platform_users
  where workspace_id = v_saec_id and password_hash is not null
  limit 1;

  v_manager_id := coalesce(v_admin_id, v_demo_id);

  if v_password_hash is null then
    raise notice '179_saec_sales_team_expansion: no password hash template — skipped user inserts';
    return;
  end if;

  select id into v_team_id
  from public.sales_teams
  where workspace_id = v_saec_id
    and name in ('OmniTransit National Sales', 'SAEC National Sales')
  limit 1;

  if v_team_id is null then
    insert into public.sales_teams (workspace_id, name, manager_user_id)
    values (v_saec_id, 'OmniTransit National Sales', v_manager_id)
    returning id into v_team_id;
  else
    update public.sales_teams
    set manager_user_id = coalesce(v_manager_id, manager_user_id),
        name = 'OmniTransit National Sales',
        updated_at = now()
    where id = v_team_id;
  end if;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash, redirect_path)
  values
    (v_rep1, v_saec_id, 'sipho.ndlovu@omnitransit.com', 'sipho.ndlovu@omnitransit.com', 'Sipho Ndlovu', 'internal', true, v_password_hash, '/'),
    (v_rep2, v_saec_id, 'lerato.nkosi@omnitransit.com', 'lerato.nkosi@omnitransit.com', 'Lerato Nkosi', 'internal', true, v_password_hash, '/'),
    (v_rep3, v_saec_id, 'thabo.mokoena@omnitransit.com', 'thabo.mokoena@omnitransit.com', 'Thabo Mokoena', 'internal', true, v_password_hash, '/'),
    (v_rep4, v_saec_id, 'nadia.govender@omnitransit.com', 'nadia.govender@omnitransit.com', 'Nadia Govender', 'internal', true, v_password_hash, '/'),
    (v_rep5, v_saec_id, 'pieter.vdm@omnitransit.com', 'pieter.vdm@omnitransit.com', 'Pieter van der Merwe', 'internal', true, v_password_hash, '/')
  on conflict (id) do update set
    display_name = excluded.display_name,
    email = excluded.email,
    username = excluded.username,
    is_active = true,
    updated_at = now();

  if v_manager_id is not null then
    insert into public.sales_team_members (workspace_id, team_id, user_id, role)
    select v_saec_id, v_team_id, v_manager_id, 'manager'
    where not exists (
      select 1 from public.sales_team_members stm
      where stm.workspace_id = v_saec_id and stm.team_id = v_team_id and stm.user_id = v_manager_id
    );

    insert into public.sales_team_members (workspace_id, team_id, user_id, role)
    select v_saec_id, v_team_id, v_demo_id, 'member'
    where v_demo_id is not null
      and not exists (
        select 1 from public.sales_team_members stm
        where stm.workspace_id = v_saec_id and stm.team_id = v_team_id and stm.user_id = v_demo_id
      );
  end if;

  insert into public.sales_team_members (workspace_id, team_id, user_id, role)
  select v_saec_id, v_team_id, rep_id, 'member'
  from (values (v_rep1), (v_rep2), (v_rep3), (v_rep4), (v_rep5)) as reps(rep_id)
  where not exists (
    select 1 from public.sales_team_members stm
    where stm.workspace_id = v_saec_id and stm.team_id = v_team_id and stm.user_id = reps.rep_id
  );

  -- Distribute open pipeline across the expanded team.
  update public.crm_leads
  set owner_user_id = v_rep1, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000001';

  update public.crm_leads
  set owner_user_id = v_rep2, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000002';

  update public.crm_leads
  set owner_user_id = v_rep3, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000003';

  update public.crm_leads
  set owner_user_id = v_rep4, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000004';

  update public.crm_leads
  set owner_user_id = v_rep5, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000005';

  update public.crm_leads
  set owner_user_id = v_rep1, updated_at = now()
  where workspace_id = v_saec_id and id = 'b1000001-0001-4001-8001-000000000006';

  -- Per-rep quarterly targets (ZAR).
  insert into public.sales_targets (
    id, workspace_id, owner_user_id, period_type, period_start, period_end, target_value, currency, notes
  )
  select
    gen_id,
    v_saec_id,
    owner_id,
    'quarter',
    date_trunc('quarter', current_date)::date,
    (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date,
    target_val,
    'ZAR',
    'Q3 FY26 individual target'
  from (
    values
      ('e4000001-0001-4001-8001-000000000002', v_rep1, 4200000),
      ('e4000001-0001-4001-8001-000000000003', v_rep2, 3800000),
      ('e4000001-0001-4001-8001-000000000004', v_rep3, 3600000),
      ('e4000001-0001-4001-8001-000000000005', v_rep4, 3200000),
      ('e4000001-0001-4001-8001-000000000006', v_rep5, 3000000)
  ) as t(gen_id, owner_id, target_val)
  on conflict (id) do update set
    owner_user_id = excluded.owner_user_id,
    target_value = excluded.target_value,
    currency = excluded.currency,
    updated_at = now();
end $$;
