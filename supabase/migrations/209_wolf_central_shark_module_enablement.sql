-- Enable SHARK module for wolf-central workspace (idempotent).

do $$
declare
  v_wolf_id uuid;
  v_now timestamptz := now();
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '209_wolf_central_shark_module_enablement: wolf-central missing — skipped';
    return;
  end if;

  insert into public.workspace_modules (workspace_id, module_key, enabled, created_at, updated_at)
  values (v_wolf_id, 'wolf-shark', true, v_now, v_now)
  on conflict (workspace_id, module_key) do update set enabled = true, updated_at = v_now;

  update public.workspace_admin_metadata
  set
    enabled_modules = (
      select jsonb_agg(distinct elem)
      from jsonb_array_elements(
        coalesce(enabled_modules, '[]'::jsonb) || '["wolf-shark"]'::jsonb
      ) elem
    ),
    enabled_sub_modules = (
      select jsonb_agg(distinct elem)
      from jsonb_array_elements(
        coalesce(enabled_sub_modules, '[]'::jsonb) || '[
          "wolf-shark:wolf-shark-dashboard",
          "wolf-shark:wolf-shark-video-analysis",
          "wolf-shark:wolf-shark-ai-detection",
          "wolf-shark:wolf-shark-tracking",
          "wolf-shark:wolf-shark-test-results",
          "wolf-shark:wolf-shark-settings"
        ]'::jsonb
      ) elem
    ),
    updated_at = v_now
  where workspace_id = v_wolf_id;

  raise notice '209_wolf_central_shark_module_enablement: SHARK enabled for wolf-central';
end $$;
