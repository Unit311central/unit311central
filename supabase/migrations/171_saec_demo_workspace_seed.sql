-- SAEC demo workspace: coherent Sales Management + Support Desk seed (ZAR).
-- Purges legacy Northstar/ABHI-style rows scoped to the SAEC workspace only.

alter table public.crm_leads
  add column if not exists win_probability numeric(5, 2)
    check (win_probability is null or (win_probability >= 0 and win_probability <= 100));

do $$
declare
  v_saec_id uuid;
  v_owner_id uuid;
  v_team_id uuid;
  v_rule_install uuid;
  v_rule_maint uuid;
  v_rule_quote uuid;
begin
  select id into v_saec_id from public.workspaces where slug = 'saec' limit 1;
  if v_saec_id is null then
    raise notice '171_saec_demo_workspace_seed: saec workspace missing — skipped';
    return;
  end if;

  select pu.id into v_owner_id
  from public.platform_users pu
  where lower(pu.username) in ('admin@saec.biz', 'dewald.lassen@saec.biz')
  order by case when lower(pu.username) = 'admin@saec.biz' then 0 else 1 end
  limit 1;

  -- Remove legacy starter rows for SAEC only.
  delete from public.sales_commissions where workspace_id = v_saec_id;
  delete from public.crm_activities where workspace_id = v_saec_id;
  delete from public.sales_quote_line_items
  where quote_id in (select id from public.sales_quotes where workspace_id = v_saec_id);
  delete from public.sales_quotes where workspace_id = v_saec_id;
  delete from public.sales_targets where workspace_id = v_saec_id;
  delete from public.founder_session_bookings where workspace_id = v_saec_id;
  delete from public.crm_leads where workspace_id = v_saec_id;
  delete from public.support_tickets where workspace_id = v_saec_id;

  if to_regclass('public.sales_teams') is null then
    raise notice '171_saec_demo_workspace_seed: sales tables missing — skipped sales portion';
  else
    select id into v_team_id
    from public.sales_teams
    where workspace_id = v_saec_id
      and name = 'SAEC National Sales'
    limit 1;

    if v_team_id is null then
      insert into public.sales_teams (workspace_id, name, manager_user_id)
      values (v_saec_id, 'SAEC National Sales', v_owner_id)
      returning id into v_team_id;
    end if;

    if v_owner_id is not null and v_team_id is not null then
      insert into public.sales_team_members (workspace_id, team_id, user_id, role)
      select v_saec_id, v_team_id, v_owner_id, 'manager'
      where not exists (
        select 1 from public.sales_team_members stm
        where stm.workspace_id = v_saec_id and stm.team_id = v_team_id and stm.user_id = v_owner_id
      );
    end if;

    insert into public.sales_commission_rules (workspace_id, name, rate_pct, applies_to, is_active)
    select v_saec_id, 'New installation won', 7.5, 'won_deal', true
    where not exists (
      select 1 from public.sales_commission_rules r
      where r.workspace_id = v_saec_id and r.name = 'New installation won'
    );

    insert into public.sales_commission_rules (workspace_id, name, rate_pct, applies_to, is_active)
    select v_saec_id, 'Maintenance contract won', 4.0, 'won_deal', true
    where not exists (
      select 1 from public.sales_commission_rules r
      where r.workspace_id = v_saec_id and r.name = 'Maintenance contract won'
    );

    insert into public.sales_commission_rules (workspace_id, name, rate_pct, applies_to, is_active)
    select v_saec_id, 'Accepted quote', 3.5, 'accepted_quote', true
    where not exists (
      select 1 from public.sales_commission_rules r
      where r.workspace_id = v_saec_id and r.name = 'Accepted quote'
    );

    insert into public.crm_leads (
      id, workspace_id, company_name, contact_name, email, status, source,
      estimated_value, win_probability, owner_user_id, next_action, next_action_date,
      created_at, updated_at
    ) values
      ('b1000001-0001-4001-8001-000000000001', v_saec_id, 'Hyprop Investments', 'Annelize Fourie', 'annelize.fourie@hyprop.demo', 'Hot', 'Existing client', 8600000, 70, v_owner_id, 'Finalise KLK proposal', (current_date + 4), now() - interval '38 days', now()),
      ('b1000001-0001-4001-8001-000000000002', v_saec_id, 'Growthpoint Properties', 'Thabo Mokoena', 'thabo.mokoena@growthpoint.demo', 'Hot', 'Referral', 6800000, 62, v_owner_id, 'Ponte City scope review', (current_date + 6), now() - interval '32 days', now()),
      ('b1000001-0001-4001-8001-000000000003', v_saec_id, 'V&A Waterfront', 'Nadia Govender', 'n.govender@vawaterfront.demo', 'Warm', 'Tender', 5100000, 48, v_owner_id, 'Escalator spec meeting', (current_date + 8), now() - interval '25 days', now()),
      ('b1000001-0001-4001-8001-000000000004', v_saec_id, 'Redefine Properties', 'Sipho Ndlovu', 'sipho.ndlovu@redefine.demo', 'Warm', 'Portfolio review', 4200000, 40, v_owner_id, 'Maintenance renewal pricing', (current_date - 1), now() - interval '20 days', now()),
      ('b1000001-0001-4001-8001-000000000005', v_saec_id, 'Netcare Hospital Cluster', 'Dr Lerato Khumalo', 'l.khumalo@netcare.demo', 'Warm', 'Healthcare tender', 3900000, 35, v_owner_id, 'Submit compliance pack', (current_date + 12), now() - interval '18 days', now()),
      ('b1000001-0001-4001-8001-000000000006', v_saec_id, 'Pick n Pay Regional', 'Chris Naidoo', 'chris.naidoo@pnp.demo', 'Cold', 'Cold outreach', 2400000, 18, v_owner_id, 'Qualify store rollout', (current_date + 14), now() - interval '12 days', now()),
      ('b1000001-0001-4001-8001-000000000007', v_saec_id, 'Killarney Mall', 'Elaine Fourie', 'e.fourie@killarneymall.demo', 'Won', 'Existing client', 4200000, 100, v_owner_id, 'Commissioning sign-off', null, now() - interval '80 days', now() - interval '16 days'),
      ('b1000001-0001-4001-8001-000000000008', v_saec_id, 'Brooklyn Mall', 'Pieter van der Merwe', 'pieter.vdm@brooklynmall.demo', 'Won', 'Referral', 3100000, 100, v_owner_id, 'Handover complete', null, now() - interval '70 days', now() - interval '22 days'),
      ('b1000001-0001-4001-8001-000000000009', v_saec_id, 'Eastgate Shopping Centre', 'Bongani Cele', 'b.cele@eastgate.demo', 'Won', 'Trade show', 2800000, 100, v_owner_id, 'SLA kick-off', null, now() - interval '55 days', now() - interval '28 days'),
      ('b1000001-0001-4001-8001-000000000010', v_saec_id, 'Centurion Mall', 'Lerato Nkosi', 'lerato.nkosi@centurionmall.demo', 'Won', 'Installation', 5400000, 100, v_owner_id, 'Phase 2 planning', null, now() - interval '48 days', now() - interval '30 days'),
      ('b1000001-0001-4001-8001-000000000011', v_saec_id, 'Sandton City Holdings', 'Tshepo Modise', 't.modise@sandtoncity.demo', 'Lost', 'Tender', 6200000, 0, v_owner_id, null, null, now() - interval '35 days', now() - interval '14 days'),
      ('b1000001-0001-4001-8001-000000000012', v_saec_id, 'Durban Point Mall', 'Aisha Khan', 'a.khan@durbanpoint.demo', 'Lost', 'Website', 1800000, 0, v_owner_id, null, null, now() - interval '28 days', now() - interval '10 days'),
      ('b1000001-0001-4001-8001-000000000013', v_saec_id, 'Momentum Head Office', 'James Okonkwo', 'j.okonkwo@momentum.demo', 'Active Customer', 'Won deal', 0, 100, v_owner_id, 'Annual SLA review', (current_date + 25), now() - interval '110 days', now()),
      ('b1000001-0001-4001-8001-000000000014', v_saec_id, 'Woolworths Head Office', 'Helen Marsh', 'h.marsh@woolworths.demo', 'Active Customer', 'Won deal', 0, 100, v_owner_id, 'Portfolio walkthrough', (current_date + 40), now() - interval '95 days', now())
    on conflict (id) do nothing;

    insert into public.crm_activities (
      id, workspace_id, crm_lead_id, activity_type, title, subject, message, occurred_at, created_by
    ) values
      ('c2000001-0001-4001-8001-000000000001', v_saec_id, 'b1000001-0001-4001-8001-000000000001', 'sales_meeting', 'Site walkthrough', 'Centurion Mall KLK', 'Confirmed hoist beam measurements with client engineer.', now() - interval '2 days', v_owner_id::text),
      ('c2000001-0001-4001-8001-000000000002', v_saec_id, 'b1000001-0001-4001-8001-000000000002', 'sales_call', 'Modernisation discovery', 'Ponte City', 'Discussed machine room constraints and timeline.', now() - interval '1 day', v_owner_id::text),
      ('c2000001-0001-4001-8001-000000000003', v_saec_id, 'b1000001-0001-4001-8001-000000000004', 'sales_email', 'Overdue follow-up', 'SLA renewal', 'Client requested revised pricing breakdown.', now() - interval '4 days', v_owner_id::text)
    on conflict (id) do nothing;

    insert into public.founder_session_bookings (
      id, workspace_id, name, organization, role, email, starts_at, ends_at, video_link, meeting_slug, status, client_timezone
    ) values
      (
        'd3000001-0001-4001-8001-000000000001',
        v_saec_id,
        'Annelize Fourie',
        'Hyprop Investments',
        'Development Manager',
        'annelize.fourie@hyprop.demo',
        (current_date + interval '5 days' + time '09:30') at time zone 'Africa/Johannesburg',
        (current_date + interval '5 days' + time '10:15') at time zone 'Africa/Johannesburg',
        'https://meet.saec.demo/hyprop-kLK-review',
        'hyprop-klk-review',
        'scheduled',
        'Africa/Johannesburg'
      ),
      (
        'd3000001-0001-4001-8001-000000000002',
        v_saec_id,
        'Nadia Govender',
        'V&A Waterfront',
        'Facilities Director',
        'n.govender@vawaterfront.demo',
        (current_date + interval '7 days' + time '11:00') at time zone 'Africa/Johannesburg',
        (current_date + interval '7 days' + time '11:45') at time zone 'Africa/Johannesburg',
        'https://meet.saec.demo/va-escalator-spec',
        'va-escalator-spec',
        'confirmed',
        'Africa/Johannesburg'
      )
    on conflict (id) do nothing;

    insert into public.sales_targets (
      id, workspace_id, owner_user_id, period_type, period_start, period_end, target_value, currency, notes
    ) values
      (
        'e4000001-0001-4001-8001-000000000001',
        v_saec_id,
        v_owner_id,
        'quarter',
        date_trunc('quarter', current_date)::date,
        (date_trunc('quarter', current_date) + interval '3 months' - interval '1 day')::date,
        18500000,
        'ZAR',
        'Q3 FY26 national sales target'
      )
    on conflict (id) do nothing;

    insert into public.sales_quotes (
      id, workspace_id, quote_number, crm_lead_id, company_name, contact_name, contact_email,
      title, currency, subtotal, tax_amount, total_amount, status, valid_until
    ) values
      (
        'f5000001-0001-4001-8001-000000000001',
        v_saec_id,
        'Q-2026-SAEC-0088',
        'b1000001-0001-4001-8001-000000000001',
        'Hyprop Investments',
        'Annelize Fourie',
        'annelize.fourie@hyprop.demo',
        'Centurion Mall KLK installation',
        'ZAR',
        7200000,
        1080000,
        8280000,
        'sent',
        (current_date + 45)::date
      ),
      (
        'f5000001-0001-4001-8001-000000000002',
        v_saec_id,
        'Q-2026-SAEC-0089',
        'b1000001-0001-4001-8001-000000000002',
        'Growthpoint Properties',
        'Thabo Mokoena',
        'thabo.mokoena@growthpoint.demo',
        'Ponte City modernisation phase 1',
        'ZAR',
        5800000,
        870000,
        6670000,
        'draft',
        (current_date + 30)::date
      ),
      (
        'f5000001-0001-4001-8001-000000000003',
        v_saec_id,
        'Q-2026-SAEC-0076',
        'b1000001-0001-4001-8001-000000000007',
        'Killarney Mall',
        'Elaine Fourie',
        'e.fourie@killarneymall.demo',
        'Escalator engineering package — accepted',
        'ZAR',
        4200000,
        630000,
        4830000,
        'accepted',
        (current_date - 25)::date
      )
    on conflict (id) do nothing;

    select id into v_rule_install from public.sales_commission_rules
    where workspace_id = v_saec_id and name = 'New installation won' limit 1;
    select id into v_rule_quote from public.sales_commission_rules
    where workspace_id = v_saec_id and name = 'Accepted quote' limit 1;

    if v_owner_id is not null and v_rule_install is not null then
      insert into public.sales_commissions (
        workspace_id, user_id, crm_lead_id, rule_id, commissionable_value, rate_pct, earned_amount, status
      )
      select v_saec_id, v_owner_id, 'b1000001-0001-4001-8001-000000000010', v_rule_install, 5400000, 7.5, 405000, 'approved'
      where not exists (
        select 1 from public.sales_commissions c
        where c.workspace_id = v_saec_id and c.crm_lead_id = 'b1000001-0001-4001-8001-000000000010'
      );
    end if;

    if v_owner_id is not null and v_rule_quote is not null then
      insert into public.sales_commissions (
        workspace_id, user_id, quote_id, rule_id, commissionable_value, rate_pct, earned_amount, status
      )
      select v_saec_id, v_owner_id, 'f5000001-0001-4001-8001-000000000003', v_rule_quote, 4830000, 3.5, 169050, 'pending'
      where not exists (
        select 1 from public.sales_commissions c
        where c.workspace_id = v_saec_id and c.quote_id = 'f5000001-0001-4001-8001-000000000003'
      );
    end if;
  end if;

  insert into public.support_tickets (
    id, workspace_id, name, organisation, priority, description, user_assigned, archived
  ) values
    ('SAEC-SUP-001', v_saec_id, 'Reception lift not operating', 'Momentum Head Office', 'urgent', 'Passenger lift stuck between floors · emergency release required.', 'Tshepo Modise', false),
    ('SAEC-SUP-002', v_saec_id, 'Escalator fault — step misalignment', 'Killarney Mall', 'high', 'Public escalator stopped after step chain alarm.', 'Bongani Cele', false),
    ('SAEC-SUP-003', v_saec_id, 'Door fault on service lift', 'Brooklyn Mall', 'medium', 'Door operator re-open fault on goods lift.', 'Elaine Fourie', false),
    ('SAEC-SUP-004', v_saec_id, 'Preventive maintenance overdue', 'Woolworths Head Office', 'medium', 'Quarterly PM visit scheduling for two passenger lifts.', 'Nadia Govender', false),
    ('SAEC-SUP-005', v_saec_id, 'Emergency call — trapped passenger', 'Eastgate Shopping Centre', 'urgent', 'Passenger assistance completed · follow-up inspection booked.', 'Pieter van der Merwe', false),
    ('SAEC-SUP-006', v_saec_id, 'Service request — lift levelling', 'Netcare Hospital Cluster', 'high', 'Levelling deviation reported on ICU wing lift.', 'Lerato Nkosi', false)
  on conflict (id) do nothing;
end $$;
