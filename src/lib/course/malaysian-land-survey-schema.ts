import "server-only";

import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";
import {
  applyMigrationSqlViaClient,
  readMigrationSql,
} from "@/lib/migration-runner";
import { withMigrationQueryClient } from "@/lib/migration-query-client";

export const COURSE_RESPONSES_MIGRATION =
  "supabase/migrations/222_malaysian_land_survey_course_responses.sql";

type SchemaCheckRow = {
  satisfied: boolean | string | null;
  relrowsecurity: boolean | null;
  relforcerowsecurity: boolean | null;
  deny_policy: boolean | null;
  unique_name: boolean | null;
  prepare_trigger: boolean | null;
  block_update_trigger: boolean | null;
  anon_select: boolean | null;
  anon_insert: boolean | null;
  authenticated_insert: boolean | null;
  service_select: boolean | null;
  service_insert: boolean | null;
};

const SCHEMA_CHECK_SQL = `
select
  (
    (select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'malaysian_land_survey_course_responses'
    ))
    and (select relrowsecurity and relforcerowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'malaysian_land_survey_course_responses')
    and (select exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'malaysian_land_survey_course_responses'
        and policyname = 'malaysian_land_survey_course_responses_deny_all'
    ))
    and (select exists (
      select 1 from pg_constraint
      where conname = 'malaysian_land_survey_course_responses_normalized_name_key'
    ))
    and (select exists (
      select 1 from pg_trigger
      where tgname = 'malaysian_land_survey_course_responses_prepare' and not tgisinternal
    ))
    and (select exists (
      select 1 from pg_trigger
      where tgname = 'malaysian_land_survey_course_responses_block_update' and not tgisinternal
    ))
  ) as satisfied,
  (select relrowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'malaysian_land_survey_course_responses') as relrowsecurity,
  (select relforcerowsecurity from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relname = 'malaysian_land_survey_course_responses') as relforcerowsecurity,
  (select exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'malaysian_land_survey_course_responses'
      and policyname = 'malaysian_land_survey_course_responses_deny_all'
      and qual = 'false'
      and with_check = 'false'
  )) as deny_policy,
  (select exists (
    select 1 from pg_constraint
    where conname = 'malaysian_land_survey_course_responses_normalized_name_key'
  )) as unique_name,
  (select exists (
    select 1 from pg_trigger
    where tgname = 'malaysian_land_survey_course_responses_prepare' and not tgisinternal
  )) as prepare_trigger,
  (select exists (
    select 1 from pg_trigger
    where tgname = 'malaysian_land_survey_course_responses_block_update' and not tgisinternal
  )) as block_update_trigger,
  has_table_privilege('anon', 'public.malaysian_land_survey_course_responses', 'select') as anon_select,
  has_table_privilege('anon', 'public.malaysian_land_survey_course_responses', 'insert') as anon_insert,
  has_table_privilege('authenticated', 'public.malaysian_land_survey_course_responses', 'insert') as authenticated_insert,
  has_table_privilege('service_role', 'public.malaysian_land_survey_course_responses', 'select') as service_select,
  has_table_privilege('service_role', 'public.malaysian_land_survey_course_responses', 'insert') as service_insert
`;

function isTrue(value: unknown): boolean {
  return value === true || value === "true" || value === "t";
}

/**
 * Apply migration 222 through the same server-side Supabase client the pending
 * migration runner uses. The access token stays on the server.
 */
export async function ensureCourseResponseSchema(): Promise<boolean> {
  const probeSql = MIGRATION_SATISFACTION_PROBES[COURSE_RESPONSES_MIGRATION];
  if (!probeSql) return false;

  try {
    const resolved = await withMigrationQueryClient(async (client) => {
      const before = await client.query<{ satisfied: boolean | string }>(probeSql);
      const already = isTrue(before.rows[0]?.satisfied);
      if (!already) {
        await applyMigrationSqlViaClient(client, readMigrationSql(COURSE_RESPONSES_MIGRATION));
      }
      const check = await client.query<SchemaCheckRow>(SCHEMA_CHECK_SQL);
      return { already, check: check.rows[0] ?? null };
    });

    if (!resolved?.result.check) {
      console.error("Course questionnaire schema could not be checked.");
      return false;
    }

    const check = resolved.result.check;
    console.info(
      "Course questionnaire schema",
      JSON.stringify({
        backend: resolved.backend,
        applied: !resolved.result.already,
        satisfied: isTrue(check.satisfied),
        rowLevelSecurity: isTrue(check.relrowsecurity),
        forcedRowLevelSecurity: isTrue(check.relforcerowsecurity),
        denyPolicy: isTrue(check.deny_policy),
        uniqueName: isTrue(check.unique_name),
        prepareTrigger: isTrue(check.prepare_trigger),
        blockUpdateTrigger: isTrue(check.block_update_trigger),
        anonSelect: isTrue(check.anon_select),
        anonInsert: isTrue(check.anon_insert),
        authenticatedInsert: isTrue(check.authenticated_insert),
        serviceSelect: isTrue(check.service_select),
        serviceInsert: isTrue(check.service_insert),
      }),
    );

    return (
      isTrue(check.satisfied) &&
      isTrue(check.service_select) &&
      isTrue(check.service_insert)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "schema apply failed";
    console.error("Course questionnaire schema apply failed", message.slice(0, 500));
    return false;
  }
}
