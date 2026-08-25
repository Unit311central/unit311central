-- Demo Sales Management: coherent workspace-scoped CRM + sales data (replaces legacy Northstar fixture reliance).
-- Idempotent: uses stable UUIDs and ON CONFLICT / WHERE NOT EXISTS guards.

alter table public.crm_leads
  add column if not exists win_probability numeric(5, 2)
    check (win_probability is null or (win_probability >= 0 and win_probability <= 100));

do $$
declare
  v_demo_id uuid;
  v_owner_id uuid;
  v_team_id uuid;
  v_rule_won uuid;
  v_rule_quote uuid;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '169_demo_sales_management_coherent_seed: demo workspace missing — skipped';
    return;
  end if;

  select pu.id into v_owner_id
  from public.platform_users pu
  where lower(pu.username) = 'demo@unit311central.com'
  limit 1;

  -- Replace legacy demo CRM/sales rows so all Sales pages share one dataset.
  delete from public.sales_commissions where workspace_id = v_demo_id;
  delete from public.crm_activities where workspace_id = v_demo_id;
  delete from public.sales_quote_line_items
  where quote_id in (select id from public.sales_quotes where workspace_id = v_demo_id);
  delete from public.sales_quotes where workspace_id = v_demo_id;
  delete from public.sales_targets where workspace_id = v_demo_id;
  delete from public.founder_session_bookings where workspace_id = v_demo_id;
  delete from public.crm_leads where workspace_id = v_demo_id;

  -- Rename sales team away from Northstar branding.
  update public.sales_teams
  set name = 'Demo Enterprise Sales', updated_at = now()
  where workspace_id = v_demo_id
    and name = 'Northstar Enterprise Sales';

  select id into v_team_id
  from public.sales_teams
  where workspace_id = v_demo_id
    and name = 'Demo Enterprise Sales'
  limit 1;

  if v_team_id is null then
    insert into public.sales_teams (workspace_id, name, manager_user_id)
    values (v_demo_id, 'Demo Enterprise Sales', v_owner_id)
    returning id into v_team_id;
  end if;

  if v_owner_id is not null and v_team_id is not null then
    insert into public.sales_team_members (workspace_id, team_id, user_id, role)
    select v_demo_id, v_team_id, v_owner_id, 'manager'
    where not exists (
      select 1 from public.sales_team_members stm
      where stm.workspace_id = v_demo_id and stm.team_id = v_team_id and stm.user_id = v_owner_id
    );
  end if;

  insert into public.crm_leads (
    id, workspace_id, company_name, contact_name, email, status, source,
    estimated_value, win_probability, owner_user_id, next_action, next_action_date,
    created_at, updated_at
  ) values
    ('a1000001-0001-4001-8001-000000000001', v_demo_id, 'Manchester Digital Works', 'Sarah Chen', 's.chen@manchesterdigital.demo', 'Hot', 'Referral', 185000, 65, v_owner_id, 'Send platform proposal', (current_date + 3), now() - interval '42 days', now()),
    ('a1000001-0001-4001-8001-000000000002', v_demo_id, 'Bristol Automation Systems', 'James Okonkwo', 'j.okonkwo@bristolauto.demo', 'Hot', 'Trade show', 128000, 55, v_owner_id, 'Technical discovery follow-up', (current_date + 5), now() - interval '35 days', now()),
    ('a1000001-0001-4001-8001-000000000003', v_demo_id, 'Cotswold Logistics Group', 'Helen Marsh', 'h.marsh@cotswoldlogistics.demo', 'Warm', 'LinkedIn', 92000, 40, v_owner_id, 'Schedule pricing review', (current_date + 7), now() - interval '28 days', now()),
    ('a1000001-0001-4001-8001-000000000004', v_demo_id, 'Thames Valley Packaging', 'Oliver Grant', 'o.grant@thamespackaging.demo', 'Warm', 'Website', 78000, 35, v_owner_id, 'Share case study', (current_date - 2), now() - interval '21 days', now()),
    ('a1000001-0001-4001-8001-000000000005', v_demo_id, 'Leeds Precision Components', 'Amelia Hughes', 'a.hughes@leedsprecision.demo', 'Cold', 'Cold outreach', 64000, 15, v_owner_id, 'Qualify budget holder', (current_date + 10), now() - interval '14 days', now()),
    ('a1000001-0001-4001-8001-000000000006', v_demo_id, 'Surrey MedTech Solutions', 'Daniel Wright', 'd.wright@surreymedtech.demo', 'Cold', 'Conference', 48000, 10, v_owner_id, 'Intro call', (current_date + 12), now() - interval '10 days', now()),
    ('a1000001-0001-4001-8001-000000000007', v_demo_id, 'Derbyshire Food Co', 'Priya Shah', 'p.shah@derbyshirefood.demo', 'Won', 'Referral', 210000, 100, v_owner_id, 'Kick-off workshop', null, now() - interval '90 days', now() - interval '14 days'),
    ('a1000001-0001-4001-8001-000000000008', v_demo_id, 'Lincolnshire Agri-Tech', 'Marcus Reed', 'm.reed@lincsagri.demo', 'Won', 'Existing client', 95000, 100, v_owner_id, 'Quarterly review', null, now() - interval '75 days', now() - interval '20 days'),
    ('a1000001-0001-4001-8001-000000000009', v_demo_id, 'Kent Construction Group', 'Elena Vasquez', 'e.vasquez@kentconstruction.demo', 'Won', 'Trade show', 156000, 100, v_owner_id, 'Expansion planning', null, now() - interval '60 days', now() - interval '25 days'),
    ('a1000001-0001-4001-8001-000000000010', v_demo_id, 'Wales Renewable Energy', 'Tom Bradley', 't.bradley@walesrenewable.demo', 'Won', 'Website', 88000, 100, v_owner_id, 'Renewal discussion', null, now() - interval '50 days', now() - interval '30 days'),
    ('a1000001-0001-4001-8001-000000000011', v_demo_id, 'Cornwall Maritime Ltd', 'Siân Evans', 's.evans@cornwallmaritime.demo', 'Won', 'Partner referral', 72000, 100, v_owner_id, 'Support check-in', null, now() - interval '45 days', now() - interval '32 days'),
    ('a1000001-0001-4001-8001-000000000012', v_demo_id, 'Nottingham Textiles Ltd', 'John Okafor', 'j.okafor@nottinghamtextiles.demo', 'Lost', 'Cold outreach', 68000, 0, v_owner_id, null, null, now() - interval '40 days', now() - interval '18 days'),
    ('a1000001-0001-4001-8001-000000000013', v_demo_id, 'Hampshire Marine Services', 'Rachel Green', 'r.green@hampshiremarine.demo', 'Lost', 'LinkedIn', 120000, 0, v_owner_id, null, null, now() - interval '38 days', now() - interval '16 days'),
    ('a1000001-0001-4001-8001-000000000014', v_demo_id, 'Newcastle Retail Group', 'Chris Morgan', 'c.morgan@newcastleretail.demo', 'Lost', 'Website', 45000, 0, v_owner_id, null, null, now() - interval '30 days', now() - interval '12 days'),
    ('a1000001-0001-4001-8001-000000000015', v_demo_id, 'Glasgow FinTech Hub', 'Aisha Khan', 'a.khan@glasgowfintech.demo', 'Lost', 'Referral', 92000, 0, v_owner_id, null, null, now() - interval '25 days', now() - interval '8 days'),
    ('a1000001-0001-4001-8001-000000000016', v_demo_id, 'Oxford Biotech Labs', 'Dr Fiona Clarke', 'f.clarke@oxfordbiotech.demo', 'Active Customer', 'Won deal', 0, 100, v_owner_id, 'Annual review', (current_date + 30), now() - interval '120 days', now()),
    ('a1000001-0001-4001-8001-000000000017', v_demo_id, 'Cambridge Research Partners', 'Dr Neil Patel', 'n.patel@cambridgeresearch.demo', 'Active Customer', 'Won deal', 0, 100, v_owner_id, 'Upsell workshop', (current_date + 45), now() - interval '100 days', now())
  on conflict (id) do nothing;

  insert into public.crm_activities (
    id, workspace_id, crm_lead_id, activity_type, title, subject, message, occurred_at, created_by
  ) values
    ('b2000001-0001-4001-8001-000000000001', v_demo_id, 'a1000001-0001-4001-8001-000000000001', 'sales_call', 'Discovery call completed', 'Platform requirements', 'Confirmed integration scope and timeline.', now() - interval '3 days', v_owner_id::text),
    ('b2000001-0001-4001-8001-000000000002', v_demo_id, 'a1000001-0001-4001-8001-000000000002', 'sales_email', 'Proposal sent', 'Automation platform proposal', 'Shared draft proposal and pricing options.', now() - interval '1 day', v_owner_id::text),
    ('b2000001-0001-4001-8001-000000000003', v_demo_id, 'a1000001-0001-4001-8001-000000000004', 'sales_meeting', 'Overdue follow-up', 'Case study review', 'Client asked to reschedule — follow up required.', now() - interval '5 days', v_owner_id::text)
  on conflict (id) do nothing;

  insert into public.founder_session_bookings (
    id, workspace_id, name, organization, role, email, starts_at, ends_at, video_link, meeting_slug, status, client_timezone
  ) values
    (
      'c3000001-0001-4001-8001-000000000001',
      v_demo_id,
      'Sarah Chen',
      'Manchester Digital Works',
      'Operations Director',
      's.chen@manchesterdigital.demo',
      (current_date + interval '4 days' + time '10:00') at time zone 'Europe/London',
      (current_date + interval '4 days' + time '10:45') at time zone 'Europe/London',
      'https://meet.demo.unit311central.com/manchester-digital-discovery',
      'manchester-digital-discovery',
      'scheduled',
      'Europe/London'
    ),
    (
      'c3000001-0001-4001-8001-000000000002',
      v_demo_id,
      'Helen Marsh',
      'Cotswold Logistics Group',
      'Head of Operations',
      'h.marsh@cotswoldlogistics.demo',
      (current_date + interval '6 days' + time '14:00') at time zone 'Europe/London',
      (current_date + interval '6 days' + time '14:30') at time zone 'Europe/London',
      'https://meet.demo.unit311central.com/cotswold-logistics-discovery',
      'cotswold-logistics-discovery',
      'confirmed',
      'Europe/London'
    )
  on conflict (id) do nothing;

  insert into public.sales_targets (
    id, workspace_id, owner_user_id, period_type, period_start, period_end, target_value, currency, notes
  ) values
    (
      'd4000001-0001-4001-8001-000000000001',
      v_demo_id,
      v_owner_id,
      'quarter',
      date_trunc('quarter', current_date)::date,
      (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date,
      500000,
      'GBP',
      'Q target for Demo enterprise sales'
    )
  on conflict (id) do nothing;

  insert into public.sales_quotes (
    id, workspace_id, quote_number, crm_lead_id, company_name, contact_name, contact_email,
    title, currency, subtotal, tax_amount, total_amount, status, valid_until
  ) values
    (
      'e5000001-0001-4001-8001-000000000001',
      v_demo_id,
      'Q-2026-DEMO-0142',
      'a1000001-0001-4001-8001-000000000001',
      'Manchester Digital Works',
      'Sarah Chen',
      's.chen@manchesterdigital.demo',
      'Operations platform — annual licence',
      'GBP',
      84000,
      16800,
      100800,
      'sent',
      (current_date + 45)::date
    ),
    (
      'e5000001-0001-4001-8001-000000000002',
      v_demo_id,
      'Q-2026-DEMO-0143',
      'a1000001-0001-4001-8001-000000000002',
      'Bristol Automation Systems',
      'James Okonkwo',
      'j.okonkwo@bristolauto.demo',
      'Pilot deployment — 60-day proof of value',
      'GBP',
      18500,
      3700,
      22200,
      'draft',
      (current_date + 30)::date
    ),
    (
      'e5000001-0001-4001-8001-000000000003',
      v_demo_id,
      'Q-2026-DEMO-0144',
      'a1000001-0001-4001-8001-000000000007',
      'Derbyshire Food Co',
      'Priya Shah',
      'p.shah@derbyshirefood.demo',
      'Enterprise rollout — accepted',
      'GBP',
  175000,
      35000,
      210000,
      'accepted',
      (current_date - 30)::date
    )
  on conflict (id) do nothing;

  insert into public.sales_quote_line_items (quote_id, line_number, description, quantity, unit_price, amount)
  select 'e5000001-0001-4001-8001-000000000001', 1, 'Platform licence (250 seats)', 1, 72000, 72000
  where not exists (select 1 from public.sales_quote_line_items where quote_id = 'e5000001-0001-4001-8001-000000000001');

  insert into public.sales_quote_line_items (quote_id, line_number, description, quantity, unit_price, amount)
  select 'e5000001-0001-4001-8001-000000000001', 2, 'Implementation & onboarding', 1, 12000, 12000
  where not exists (select 1 from public.sales_quote_line_items where quote_id = 'e5000001-0001-4001-8001-000000000001' and line_number = 2);

  insert into public.sales_quote_line_items (quote_id, line_number, description, quantity, unit_price, amount)
  select 'e5000001-0001-4001-8001-000000000002', 1, 'Pilot edge kit', 1, 14000, 14000
  where not exists (select 1 from public.sales_quote_line_items where quote_id = 'e5000001-0001-4001-8001-000000000002');

  insert into public.sales_quote_line_items (quote_id, line_number, description, quantity, unit_price, amount)
  select 'e5000001-0001-4001-8001-000000000002', 2, 'Professional services', 1, 4500, 4500
  where not exists (select 1 from public.sales_quote_line_items where quote_id = 'e5000001-0001-4001-8001-000000000002' and line_number = 2);

  insert into public.sales_quote_line_items (quote_id, line_number, description, quantity, unit_price, amount)
  select 'e5000001-0001-4001-8001-000000000003', 1, 'Enterprise platform rollout', 1, 175000, 175000
  where not exists (select 1 from public.sales_quote_line_items where quote_id = 'e5000001-0001-4001-8001-000000000003');

  select id into v_rule_won from public.sales_commission_rules
  where workspace_id = v_demo_id and name = 'Enterprise Won Deal' limit 1;
  select id into v_rule_quote from public.sales_commission_rules
  where workspace_id = v_demo_id and name = 'Accepted Quote' limit 1;

  if v_owner_id is not null and v_rule_won is not null then
    insert into public.sales_commissions (
      workspace_id, user_id, crm_lead_id, rule_id, commissionable_value, rate_pct, earned_amount, status
    )
    select
      v_demo_id,
      v_owner_id,
      'a1000001-0001-4001-8001-000000000007',
      v_rule_won,
      210000,
      8.0,
      16800,
      'approved'
    where not exists (
      select 1 from public.sales_commissions c
      where c.workspace_id = v_demo_id and c.crm_lead_id = 'a1000001-0001-4001-8001-000000000007'
    );
  end if;

  if v_owner_id is not null and v_rule_quote is not null then
    insert into public.sales_commissions (
      workspace_id, user_id, quote_id, rule_id, commissionable_value, rate_pct, earned_amount, status
    )
    select
      v_demo_id,
      v_owner_id,
      'e5000001-0001-4001-8001-000000000003',
      v_rule_quote,
      210000,
      5.0,
      10500,
      'pending'
    where not exists (
      select 1 from public.sales_commissions c
      where c.workspace_id = v_demo_id and c.quote_id = 'e5000001-0001-4001-8001-000000000003'
    );
  end if;
end $$;
