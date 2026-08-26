-- OmniTransit polish: purge legacy UK/US telecom rows for SAEC workspace.
-- Marketing and technical files are upserted at runtime via application seed helpers.

do $$
declare
  v_saec_id uuid;
begin
  select id into v_saec_id from public.workspaces where slug = 'saec' limit 1;
  if v_saec_id is null then
    raise notice '180_saec_omnitransit_polish_seed: saec workspace missing — skipped';
    return;
  end if;

  delete from public.technology_telecom_services where workspace_id = v_saec_id;

  raise notice '180_saec_omnitransit_polish_seed: purged SAEC telecom rows for ZAR SA catalogue reseed';
end $$;
