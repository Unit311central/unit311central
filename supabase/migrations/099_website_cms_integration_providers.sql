-- MOD-610 — Website CMS providers on Integration Framework
-- Adds website category + WordPress registry entry (idempotent).

alter table public.integration_providers
  drop constraint if exists integration_providers_category_check;

alter table public.integration_providers
  add constraint integration_providers_category_check check (
    category in (
      'banking',
      'email',
      'calendar',
      'messaging',
      'payments',
      'shipping',
      'storage',
      'ai',
      'website'
    )
  );

alter table public.workspace_integration_connections
  drop constraint if exists workspace_integration_connections_category_check;

alter table public.workspace_integration_connections
  add constraint workspace_integration_connections_category_check check (
    category in (
      'banking',
      'email',
      'calendar',
      'messaging',
      'payments',
      'shipping',
      'storage',
      'ai',
      'website'
    )
  );

insert into public.integration_providers (
  code, category, display_name, auth_methods, default_capabilities
)
values
  (
    'cms.wordpress',
    'website',
    'WordPress',
    '["application_password","api_key","manual"]'::jsonb,
    '["pages","posts","media","plugins","themes","deploy"]'::jsonb
  ),
  (
    'cms.other',
    'website',
    'Other CMS',
    '["api_key","manual"]'::jsonb,
    '["pages","posts","media"]'::jsonb
  )
on conflict (code) do update
set
  category = excluded.category,
  display_name = excluded.display_name,
  auth_methods = excluded.auth_methods,
  default_capabilities = excluded.default_capabilities,
  is_active = true,
  updated_at = now();
