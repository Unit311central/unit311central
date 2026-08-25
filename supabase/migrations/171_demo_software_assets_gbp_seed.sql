-- Demo workspace Software & SaaS register — Northstar GBP seed (idempotent).
-- Demo-only: targets workspace slug 'demo' only.

do $$
declare
  v_demo_id uuid;
begin
  select id into v_demo_id from public.workspaces where slug = 'demo' limit 1;
  if v_demo_id is null then
    raise notice '171_demo_software_assets_gbp_seed: demo workspace missing — skipped';
    return;
  end if;

  if exists (
    select 1
    from public.software_assets sa
    where sa.workspace_id = v_demo_id
      and sa.name = 'HubSpot CRM'
      and upper(sa.currency) = 'GBP'
  ) then
    raise notice '171_demo_software_assets_gbp_seed: GBP register already seeded — skipped';
    return;
  end if;

  delete from public.software_asset_credentials where workspace_id = v_demo_id;
  delete from public.software_asset_files where workspace_id = v_demo_id;
  delete from public.software_asset_audit_events where workspace_id = v_demo_id;
  delete from public.software_assets where workspace_id = v_demo_id;

  insert into public.software_assets (
    workspace_id,
    name,
    vendor,
    purpose,
    category,
    website_url,
    status,
    licences_purchased,
    licences_allocated,
    licence_type,
    monthly_cost,
    annual_cost,
    currency,
    last_payment_amount,
    last_payment_date,
    next_renewal_date,
    renewal_frequency,
    contract_length,
    cost_centre,
    budget_owner,
    supplier_name,
    invoice_reference,
    financial_account_code,
    business_owner,
    technical_owner,
    department,
    approver,
    supplier_company,
    integration_connected,
    integration_api_key_set,
    integration_oauth_status,
    integration_sync_status,
    provider_slug
  )
  values
    (
      v_demo_id,
      'AWS Production',
      'Amazon Web Services',
      'Cloud infrastructure for Atlas monitoring platform',
      'Cloud',
      'https://aws.amazon.com',
      'Active',
      1,
      1,
      'Unlimited',
      845.30,
      10143.60,
      'GBP',
      845.30,
      '2026-08-01',
      '2026-09-01',
      'Monthly',
      'Rolling',
      'Engineering',
      'James Okonkwo',
      'Amazon Web Services',
      'AWS-AUG-2026',
      '5010',
      'James Okonkwo',
      'Sophie Barker',
      'Engineering',
      'Elena Hart',
      'Amazon Web Services',
      true,
      true,
      'connected',
      'healthy',
      'aws'
    ),
    (
      v_demo_id,
      'GitHub Enterprise',
      'GitHub',
      'Source control and CI/CD',
      'Development',
      'https://github.com',
      'Active',
      25,
      22,
      'Per user',
      703.10,
      8437.20,
      'GBP',
      703.10,
      '2026-08-01',
      '2026-09-01',
      'Monthly',
      'Annual',
      'Engineering',
      'James Okonkwo',
      'GitHub',
      'GH-ENT-AUG',
      '5010',
      'James Okonkwo',
      'James Okonkwo',
      'Engineering',
      'Elena Hart',
      'GitHub',
      true,
      true,
      'connected',
      'healthy',
      'github'
    ),
    (
      v_demo_id,
      'HubSpot CRM',
      'HubSpot',
      'Sales pipeline and marketing automation',
      'CRM',
      'https://hubspot.com',
      'Active',
      10,
      8,
      'Named',
      489.80,
      5877.60,
      'GBP',
      489.80,
      '2026-08-01',
      '2027-08-01',
      'Annually',
      '12 months',
      'Sales',
      'Marcus Reed',
      'HubSpot',
      'HS-2026',
      '5030',
      'Marcus Reed',
      'Marcus Reed',
      'Sales',
      'Elena Hart',
      'HubSpot',
      true,
      false,
      'connected',
      'healthy',
      'hubspot'
    );

  raise notice '171_demo_software_assets_gbp_seed: seeded 3 GBP software assets for demo workspace';
end $$;
