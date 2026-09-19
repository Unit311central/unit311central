-- Persist SHARK in workspace_sidebar_modules for wolf-central (whoami reads this table).

do $$
declare
  v_wolf_id uuid;
  v_order integer;
begin
  select id into v_wolf_id from public.workspaces where slug = 'wolf-central' limit 1;
  if v_wolf_id is null then
    raise notice '210_wolf_shark_sidebar_module: wolf-central missing — skipped';
    return;
  end if;

  select coalesce(max(display_order), 2600) + 100
  into v_order
  from public.workspace_sidebar_modules
  where workspace_id = v_wolf_id;

  insert into public.workspace_sidebar_modules (workspace_id, module_id, enabled, display_order)
  values (v_wolf_id, 'wolf-shark', true, v_order)
  on conflict (workspace_id, module_id) do update
    set enabled = true;

  raise notice '210_wolf_shark_sidebar_module: wolf-shark sidebar row enabled for wolf-central';
end $$;
