-- Demo Sales Management: expand team to six salespeople, distribute pipeline, populate targets.
-- Idempotent — stable UUIDs; safe to re-run.

do $$
declare
  v_demo_id uuid;
  v_team_id uuid;
  v_manager_id uuid;
  v_rep1 uuid := 'f7000001-0001-4001-8001-000000000001';
  v_rep2 uuid := 'f7000001-0001-4001-8001-000000000002';
  v_rep3 uuid := 'f7000001-0001-4001-8001-000000000003';
  v_rep4 uuid := 'f7000001-0001-4001-8001-000000000004';
  v_rep5 uuid := 'f7000001-0001-4001-8001-000000000005';
  v_q_start date := date_trunc('quarter', current_date)::date;
  v_q_end date := (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date;
  v_prev_q_start date := (date_trunc('quarter', current_date) - interval '3 months')::date;
  v_prev_q_end date := (date_trunc('quarter', current_date) - interval '1 day')::date;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '173_demo_sales_team_expansion: demo workspace missing — skipped';
    return;
  end if;

  select id into v_team_id
  from public.sales_teams
  where workspace_id = v_demo_id and name = 'Demo Enterprise Sales'
  limit 1;

  if v_team_id is null then
    raise notice '173_demo_sales_team_expansion: sales team missing — run 169 first';
    return;
  end if;

  select pu.id into v_manager_id
  from public.platform_users pu
  where pu.workspace_id = v_demo_id
    and lower(pu.username) = 'emily.hughes@northstar.demo'
  limit 1;

  if v_manager_id is null then
    insert into public.platform_users (
      id, workspace_id, username, email, display_name, user_type, is_active, password_hash
    )
    select
      'f7000001-0001-4001-8001-000000000000',
      v_demo_id,
      'emily.hughes@northstar.demo',
      'emily.hughes@northstar.demo',
      'Emily Hughes',
      'internal',
      true,
      pu.password_hash
    from public.platform_users pu
    where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com'
    limit 1
    on conflict (id) do update set display_name = excluded.display_name, email = excluded.email, username = excluded.username;

    v_manager_id := 'f7000001-0001-4001-8001-000000000000';
  end if;

  update public.platform_users
  set display_name = 'Emily Hughes', email = 'emily.hughes@northstar.demo'
  where id = v_manager_id;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash)
  select v_rep1, v_demo_id, 'elena.hughes@northstar.demo', 'elena.hughes@northstar.demo', 'Elena Hughes', 'internal', true, pu.password_hash
  from public.platform_users pu where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com' limit 1
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash)
  select v_rep2, v_demo_id, 'marcus.webb@northstar.demo', 'marcus.webb@northstar.demo', 'Marcus Webb', 'internal', true, pu.password_hash
  from public.platform_users pu where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com' limit 1
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash)
  select v_rep3, v_demo_id, 'sofia.mendez@northstar.demo', 'sofia.mendez@northstar.demo', 'Sofia Mendez', 'internal', true, pu.password_hash
  from public.platform_users pu where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com' limit 1
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash)
  select v_rep4, v_demo_id, 'connor.walsh@northstar.demo', 'connor.walsh@northstar.demo', 'Connor Walsh', 'internal', true, pu.password_hash
  from public.platform_users pu where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com' limit 1
  on conflict (id) do update set display_name = excluded.display_name;

  insert into public.platform_users (id, workspace_id, username, email, display_name, user_type, is_active, password_hash)
  select v_rep5, v_demo_id, 'ryan.oconnor@northstar.demo', 'ryan.oconnor@northstar.demo', 'Ryan O''Connor', 'internal', true, pu.password_hash
  from public.platform_users pu where pu.workspace_id = v_demo_id and lower(pu.username) = 'demo@unit311central.com' limit 1
  on conflict (id) do update set display_name = excluded.display_name;

  update public.sales_teams set manager_user_id = v_manager_id, updated_at = now() where id = v_team_id;

  insert into public.sales_team_members (workspace_id, team_id, user_id, role)
  values
    (v_demo_id, v_team_id, v_manager_id, 'manager'),
    (v_demo_id, v_team_id, v_rep1, 'member'),
    (v_demo_id, v_team_id, v_rep2, 'member'),
    (v_demo_id, v_team_id, v_rep3, 'member'),
    (v_demo_id, v_team_id, v_rep4, 'member'),
    (v_demo_id, v_team_id, v_rep5, 'member')
  on conflict do nothing;

  update public.crm_leads set owner_user_id = v_rep1, updated_at = now()
  where workspace_id = v_demo_id and id in (
    'a1000001-0001-4001-8001-000000000001',
    'a1000001-0001-4001-8001-000000000004',
    'a1000001-0001-4001-8001-000000000007'
  );

  update public.crm_leads set owner_user_id = v_rep2, updated_at = now()
  where workspace_id = v_demo_id and id in (
    'a1000001-0001-4001-8001-000000000002',
    'a1000001-0001-4001-8001-000000000005',
    'a1000001-0001-4001-8001-000000000008'
  );

  update public.crm_leads set owner_user_id = v_rep3, updated_at = now()
  where workspace_id = v_demo_id and id in (
    'a1000001-0001-4001-8001-000000000003',
    'a1000001-0001-4001-8001-000000000006',
    'a1000001-0001-4001-8001-000000000009'
  );

  update public.crm_leads set owner_user_id = v_rep4, updated_at = now()
  where workspace_id = v_demo_id and id in (
    'a1000001-0001-4001-8001-000000000010',
    'a1000001-0001-4001-8001-000000000011',
    'a1000001-0001-4001-8001-000000000016'
  );

  update public.crm_leads set owner_user_id = v_rep5, updated_at = now()
  where workspace_id = v_demo_id and id in (
    'a1000001-0001-4001-8001-000000000012',
    'a1000001-0001-4001-8001-000000000013',
    'a1000001-0001-4001-8001-000000000014',
    'a1000001-0001-4001-8001-000000000015',
    'a1000001-0001-4001-8001-000000000017'
  );

  delete from public.sales_targets where workspace_id = v_demo_id;

  insert into public.sales_targets (
    id, workspace_id, owner_user_id, period_type, period_start, period_end, target_value, currency, notes
  ) values
    ('d4000001-0001-4001-8001-000000000010', v_demo_id, v_rep1, 'quarter', v_q_start, v_q_end, 180000, 'GBP', 'Q target — Elena Hughes'),
    ('d4000001-0001-4001-8001-000000000011', v_demo_id, v_rep2, 'quarter', v_q_start, v_q_end, 165000, 'GBP', 'Q target — Marcus Webb'),
    ('d4000001-0001-4001-8001-000000000012', v_demo_id, v_rep3, 'quarter', v_q_start, v_q_end, 150000, 'GBP', 'Q target — Sofia Mendez'),
    ('d4000001-0001-4001-8001-000000000013', v_demo_id, v_rep4, 'quarter', v_q_start, v_q_end, 140000, 'GBP', 'Q target — Connor Walsh'),
    ('d4000001-0001-4001-8001-000000000014', v_demo_id, v_rep5, 'quarter', v_q_start, v_q_end, 125000, 'GBP', 'Q target — Ryan O''Connor'),
    ('d4000001-0001-4001-8001-000000000015', v_demo_id, v_manager_id, 'quarter', v_q_start, v_q_end, 760000, 'GBP', 'Team Q target — Demo Enterprise Sales'),
    ('d4000001-0001-4001-8001-000000000016', v_demo_id, v_rep1, 'quarter', v_prev_q_start, v_prev_q_end, 175000, 'GBP', 'Previous quarter — Elena Hughes'),
    ('d4000001-0001-4001-8001-000000000017', v_demo_id, v_rep2, 'quarter', v_prev_q_start, v_prev_q_end, 160000, 'GBP', 'Previous quarter — Marcus Webb'),
    ('d4000001-0001-4001-8001-000000000018', v_demo_id, v_rep3, 'quarter', v_prev_q_start, v_prev_q_end, 145000, 'GBP', 'Previous quarter — Sofia Mendez')
  on conflict (id) do nothing;
end $$;
