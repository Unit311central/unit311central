-- WOLF Central: purge engineering SOP legacy data, refresh enablement (BC + ECA).
-- Idempotent.

do $$
declare
  v_wolf_id uuid;
  v_enabled_modules jsonb := '[
    "home","wolf-animals","wolf-containment","wolf-environment","wolf-drone-operations",
    "wolf-fleet","wolf-tools","executive-assistant","business-central","business-productivity",
    "support-desk","operations","training","project-management","engineering","analytics",
    "external-client-access","tools","settings"
  ]'::jsonb;
  v_enabled_sub_modules jsonb := '[
    "analytics:realtime-video-pipeline","analytics:system-health",
    "business-central:business-central-dashboard","business-central:clients",
    "business-central:clients-dashboard","business-central:information-repository",
    "business-central:management","business-productivity:calendar",
    "business-productivity:communications","business-productivity:content-studio",
    "business-productivity:files-external","business-productivity:files-internal",
    "business-productivity:internal-work-packages","business-productivity:messaging",
    "business-productivity:productivity-dashboard","business-productivity:whiteboard",
    "engineering:engineering-capacity","engineering:engineering-dashboard",
    "engineering:engineering-programs","engineering:engineering-risks",
    "engineering:engineering-sops-dashboard","engineering:engineering-sops-library",
    "engineering:engineering-sops-reports","engineering:engineering-sops-reviews",
    "engineering:engineering-sops-runs","engineering:engineering-sops-tasks",
    "engineering:engineering-sops-templates","engineering:engineering-technical-files",
    "executive-assistant:executive-assistant","external-client-access:external-client-access",
    "external-client-access:users-external","home:home","home:wolf-estate",
    "home:wolf-safari-parks","operations:assets","operations:inventory-management",
    "operations:logistics","operations:operations-dashboard","operations:procurement",
    "project-management:projects-dashboard","project-management:projects-external",
    "project-management:projects-internal","settings:appearance","settings:billing",
    "settings:profile","settings:settings","support-desk:support","support-desk:support-mine",
    "support-desk:support-overview","support-desk:whatsapp-integration","tools:users",
    "training:course-builder","training:qms-training","training:training",
    "training:training-dashboard","training:training-external","wolf-animals:wolf-animals",
    "wolf-containment:wolf-containment","wolf-drone-operations:wolf-drone-operations",
    "wolf-environment:wolf-environment","wolf-fleet:wolf-fleet",
    "wolf-tools:wolf-ai-wildlife-vision"
  ]'::jsonb;
  v_now timestamptz := now();
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '199_wolf_central_bc_pailex: wolf-central workspace missing — skipped';
    return;
  end if;

  delete from public.engineering_sop_run_steps rs
  using public.engineering_sop_runs r
  where rs.run_id = r.id and r.workspace_id = v_wolf_id;

  delete from public.engineering_sop_events where workspace_id = v_wolf_id;
  delete from public.engineering_sop_runs where workspace_id = v_wolf_id;
  delete from public.engineering_sops where workspace_id = v_wolf_id;

  delete from public.internal_projects where workspace_id = v_wolf_id;
  delete from public.internal_clients where workspace_id = v_wolf_id;

  update public.workspace_admin_metadata
  set
    enabled_modules = v_enabled_modules,
    enabled_sub_modules = v_enabled_sub_modules,
    updated_at = v_now
  where workspace_id = v_wolf_id;

  raise notice '199_wolf_central_bc_pailex: purged engineering/projects/clients for wolf-central';
end $$;
