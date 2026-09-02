-- WOLF Central: enable Engineering module (including SOPs) without legacy SOP seed data.
-- Metadata + workspace_modules only. Idempotent.

do $$
declare
  v_wolf_id uuid;
  v_enabled_modules jsonb := '[
    "home","wolf-animals","wolf-containment","wolf-environment","wolf-drone-operations",
    "wolf-fleet","wolf-tools","executive-assistant","business-productivity","support-desk",
    "operations","training","project-management","engineering","tools","settings"
  ]'::jsonb;
  v_enabled_sub_modules jsonb := '[
    "business-productivity:calendar","business-productivity:communications",
    "business-productivity:content-studio","business-productivity:files-external",
    "business-productivity:files-internal","business-productivity:internal-work-packages",
    "business-productivity:messaging","business-productivity:productivity-dashboard",
    "business-productivity:whiteboard","engineering:engineering-capacity",
    "engineering:engineering-dashboard","engineering:engineering-programs",
    "engineering:engineering-risks","engineering:engineering-sops-dashboard",
    "engineering:engineering-sops-library","engineering:engineering-sops-reports",
    "engineering:engineering-sops-reviews","engineering:engineering-sops-runs",
    "engineering:engineering-sops-tasks","engineering:engineering-sops-templates",
    "engineering:engineering-technical-files","executive-assistant:executive-assistant",
    "home:home","home:wolf-estate","home:wolf-safari-parks","operations:assets",
    "operations:inventory-management","operations:logistics","operations:operations-dashboard",
    "operations:procurement","project-management:projects-dashboard",
    "project-management:projects-external","project-management:projects-internal",
    "settings:appearance","settings:billing","settings:profile","settings:settings",
    "support-desk:support","support-desk:support-mine","support-desk:support-overview",
    "support-desk:whatsapp-integration","tools:users","training:course-builder",
    "training:qms-training","training:training","training:training-dashboard",
    "training:training-external","wolf-animals:wolf-animals","wolf-containment:wolf-containment",
    "wolf-drone-operations:wolf-drone-operations","wolf-environment:wolf-environment",
    "wolf-fleet:wolf-fleet","wolf-tools:wolf-ai-wildlife-vision"
  ]'::jsonb;
  v_module_key text;
  v_module_keys text[] := array[
    'assets-inventory','email-calendar-messaging','engineering-rnd','executive-assistant',
    'file-explorer','logistics','profiles','projects','strategy','support','training','users',
    'wolf-animals','wolf-containment','wolf-drone-operations','wolf-environment','wolf-fleet'
  ];
  v_now timestamptz := now();
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '196_wolf_central_engineering_module: wolf-central workspace missing — skipped';
    return;
  end if;

  update public.workspace_admin_metadata
  set
    enabled_modules = v_enabled_modules,
    enabled_sub_modules = v_enabled_sub_modules,
    updated_at = v_now
  where workspace_id = v_wolf_id;

  foreach v_module_key in array v_module_keys loop
    insert into public.workspace_modules (workspace_id, module_key, enabled, created_at, updated_at)
    values (v_wolf_id, v_module_key, true, v_now, v_now)
    on conflict (workspace_id, module_key) do update set
      enabled = true,
      updated_at = v_now;
  end loop;

  raise notice '196_wolf_central_engineering_module: enabled engineering for wolf-central';
end $$;
