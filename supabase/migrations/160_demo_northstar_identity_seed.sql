-- Demo workspace identity + representative Sales Management seed (Northstar Demo tenancy).
-- Idempotent: safe to re-run on provisioned demo workspace.

do $$
declare
  v_demo_id uuid;
  v_owner_id uuid;
  v_team_id uuid;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '160_demo_northstar_identity_seed: demo workspace missing — skipped';
    return;
  end if;

  select pu.id
  into v_owner_id
  from public.platform_users pu
  where lower(pu.username) = 'demo@unit311central.com'
  limit 1;

  -- Align primary company record with Northstar Demo branding (not Meridian Atlas placeholder).
  update public.company_details
  set
    legal_company_name = 'Northstar Industrial Technologies Ltd',
    trading_name = 'Northstar Industrial Technologies',
    company_number = 'NST-UK-104882',
    vat_tax_number = 'GB104882901',
    registered_office_address = 'Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom',
    principal_business_address = 'Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom',
    country_of_registration = 'United Kingdom',
    company_status = 'Active',
    general_company_description =
      'Northstar Industrial Technologies designs and deploys industrial IoT edge controllers and remote monitoring platforms for mid-market manufacturers.',
    website = 'https://northstar.demo',
    primary_email = 'hello@northstar.demo',
    primary_telephone = '+44 161 555 0100',
    archived_at = null,
    updated_at = now()
  where workspace_id = v_demo_id
    and archived_at is null
    and display_order = (
      select min(cd.display_order)
      from public.company_details cd
      where cd.workspace_id = v_demo_id
        and cd.archived_at is null
    );

  if not found then
    insert into public.company_details (
      workspace_id,
      legal_company_name,
      trading_name,
      company_number,
      vat_tax_number,
      registered_office_address,
      principal_business_address,
      country_of_registration,
      company_status,
      general_company_description,
      website,
      primary_email,
      primary_telephone,
      display_order
    )
    values (
      v_demo_id,
      'Northstar Industrial Technologies Ltd',
      'Northstar Industrial Technologies',
      'NST-UK-104882',
      'GB104882901',
      'Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom',
      'Unit 4, Trafford Park Industrial Estate, Manchester M17 1HH, United Kingdom',
      'United Kingdom',
      'Active',
      'Northstar Industrial Technologies designs and deploys industrial IoT edge controllers and remote monitoring platforms for mid-market manufacturers.',
      'https://northstar.demo',
      'hello@northstar.demo',
      '+44 161 555 0100',
      0
    );
  end if;

  if to_regclass('public.sales_teams') is null then
    raise notice '160_demo_northstar_identity_seed: sales tables missing — skipped sales seed';
    return;
  end if;

  select id into v_team_id
  from public.sales_teams
  where workspace_id = v_demo_id
    and name = 'Northstar Enterprise Sales'
  limit 1;

  if v_team_id is null then
    insert into public.sales_teams (workspace_id, name, manager_user_id)
    values (v_demo_id, 'Northstar Enterprise Sales', v_owner_id)
    returning id into v_team_id;
  end if;

  if v_owner_id is not null and v_team_id is not null then
    insert into public.sales_team_members (workspace_id, team_id, user_id, hr_employee_id, role)
    select v_demo_id, v_team_id, v_owner_id, null, 'manager'
    where not exists (
      select 1 from public.sales_team_members stm
      where stm.workspace_id = v_demo_id
        and stm.team_id = v_team_id
        and stm.user_id = v_owner_id
    );
  end if;

  insert into public.sales_commission_rules (
    workspace_id,
    name,
    rate_pct,
    applies_to,
    is_active
  )
  select v_demo_id, 'Enterprise Won Deal', 8.0, 'won_deal', true
  where not exists (
    select 1 from public.sales_commission_rules r
    where r.workspace_id = v_demo_id
      and r.name = 'Enterprise Won Deal'
  );

  insert into public.sales_commission_rules (
    workspace_id,
    name,
    rate_pct,
    applies_to,
    is_active
  )
  select v_demo_id, 'Accepted Quote', 5.0, 'accepted_quote', true
  where not exists (
    select 1 from public.sales_commission_rules r
    where r.workspace_id = v_demo_id
      and r.name = 'Accepted Quote'
  );
end $$;
