-- Customer workspace provisioning: stop cloning workspace_modules from unit311 template.
-- Module enablement for new customer workspaces is set by the application from the
-- authoritative 22-module customer catalogue (see module-catalogue.ts).

create or replace function public.ensure_workspace_foundation(
  p_workspace_id uuid,
  p_source_slug text default 'unit311'
)
returns uuid
language plpgsql
as $$
declare
  v_source_workspace_id uuid;
begin
  if p_workspace_id is null then
    raise exception 'ensure_workspace_foundation: workspace_id is required';
  end if;

  select w.id
  into v_source_workspace_id
  from public.workspaces w
  where w.slug = lower(trim(p_source_slug))
  limit 1;

  if v_source_workspace_id is null then
    raise exception
      'ensure_workspace_foundation: source workspace slug % not found',
      p_source_slug;
  end if;

  if v_source_workspace_id = p_workspace_id then
    return p_workspace_id;
  end if;

  -- Settings (insert only when missing — never overwrite live branding edits)
  insert into public.workspace_settings (
    workspace_id,
    timezone,
    currency,
    language,
    date_format,
    time_format,
    logo_url,
    primary_colour,
    secondary_colour
  )
  select
    p_workspace_id,
    coalesce(s.timezone, 'Europe/London'),
    coalesce(s.currency, 'USD'),
    coalesce(s.language, 'en-GB'),
    coalesce(s.date_format, 'DD/MM/YYYY'),
    coalesce(s.time_format, '24h'),
    null,
    coalesce(s.primary_colour, '#0b2d63'),
    coalesce(s.secondary_colour, '#2563eb')
  from (select 1) as _
  left join public.workspace_settings s
    on s.workspace_id = v_source_workspace_id
  where not exists (
    select 1 from public.workspace_settings existing
    where existing.workspace_id = p_workspace_id
  );

  -- workspace_modules: NOT copied from template. Application writes catalogue keys only.

  -- Empty file categories (structural only) when target has none
  if not exists (
    select 1 from public.file_categories where workspace_id = p_workspace_id
  ) then
    insert into public.file_categories (name, color, workspace_id)
    select c.name, c.color, p_workspace_id
    from public.file_categories c
    where c.workspace_id = v_source_workspace_id
    order by c.name;
  end if;

  if not exists (
    select 1 from public.file_folders where workspace_id = p_workspace_id
  ) then
    insert into public.file_folders (
      name,
      parent_id,
      category_id,
      external_scope,
      workspace_id
    )
    values
      ('External Files', null, null, true, p_workspace_id),
      ('Client Invoices', null, null, false, p_workspace_id);
  end if;

  return p_workspace_id;
end;
$$;

comment on function public.ensure_workspace_foundation(uuid, text) is
  'Clone structural workspace foundation (settings, file folders) from source slug. Does NOT copy workspace_modules — customer module enablement comes from the application 22-module catalogue.';
