-- Messaging tenant isolation: deny-all RLS on messaging tables.
-- Server paths must use SUPABASE_SERVICE_ROLE_KEY (createTenancyServerClient) with explicit workspace_id filters.
-- Closes direct anon/authenticated Supabase access that bypassed API tenant checks.

create or replace function public.messaging_replace_open_rls(
  p_table text,
  p_legacy_policy_names text[] default '{}'::text[]
)
returns void
language plpgsql
as $$
declare
  policy_name text;
  qualified text := p_table;
  bare_name text := split_part(qualified, '.', 2);
  deny_policy text := bare_name || '_deny_all';
begin
  if to_regclass(qualified) is null then
    raise notice 'messaging_replace_open_rls: skipping missing table %', qualified;
    return;
  end if;

  execute format('alter table %s enable row level security', qualified);

  if array_length(p_legacy_policy_names, 1) is not null then
    foreach policy_name in array p_legacy_policy_names
    loop
      execute format('drop policy if exists %I on %s', policy_name, qualified);
    end loop;
  end if;

  for policy_name in
    select pol.polname
    from pg_policy pol
    join pg_class cls on cls.oid = pol.polrelid
    join pg_namespace nsp on nsp.oid = cls.relnamespace
    where nsp.nspname = 'public'
      and cls.relname = bare_name
      and (
        pg_get_expr(pol.polqual, pol.polrelid) = 'true'
        or pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true'
      )
  loop
    execute format('drop policy if exists %I on %s', policy_name, qualified);
  end loop;

  execute format('drop policy if exists %I on %s', deny_policy, qualified);
  execute format(
    'create policy %I on %s for all using (false)',
    deny_policy,
    qualified
  );
end;
$$;

select public.messaging_replace_open_rls('public.internal_messages', array['internal_messages_all']);
select public.messaging_replace_open_rls('public.internal_message_channels', array['internal_message_channels_all']);
select public.messaging_replace_open_rls('public.internal_message_read_state', array['internal_message_read_state_all']);
select public.messaging_replace_open_rls('public.internal_scheduled_calls', array['internal_scheduled_calls_all']);
select public.messaging_replace_open_rls('public.internal_message_saves', array['internal_message_saves_all']);
select public.messaging_replace_open_rls('public.messaging_call_rooms', array[]::text[]);

drop function public.messaging_replace_open_rls(text, text[]);
