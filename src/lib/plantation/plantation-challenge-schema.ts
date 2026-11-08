import "server-only";

import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";
import { applyMigrationSqlViaClient, readMigrationSql } from "@/lib/migration-runner";
import { withMigrationQueryClient } from "@/lib/migration-query-client";

export const PLANTATION_CHALLENGE_MIGRATION =
  "supabase/migrations/223_plantation_challenge_responses.sql";

type SchemaCheckRow = {
  satisfied: boolean | string | null;
  service_select: boolean | null;
  service_insert: boolean | null;
  service_delete: boolean | null;
};

const SCHEMA_CHECK_SQL = `
select
  (
    (select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'plantation_challenge_responses'
    ))
    and (select relrowsecurity and relforcerowsecurity from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname = 'plantation_challenge_responses')
    and (select exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = 'plantation_challenge_responses'
        and policyname = 'plantation_challenge_responses_deny_all'
    ))
    and (select exists (
      select 1 from pg_constraint
      where conname = 'plantation_challenge_responses_normalized_name_key'
    ))
    and (select exists (
      select 1 from pg_trigger
      where tgname = 'plantation_challenge_responses_prepare' and not tgisinternal
    ))
    and (select exists (
      select 1 from pg_trigger
      where tgname = 'plantation_challenge_responses_block_update' and not tgisinternal
    ))
  ) as satisfied,
  has_table_privilege('service_role', 'public.plantation_challenge_responses', 'select') as service_select,
  has_table_privilege('service_role', 'public.plantation_challenge_responses', 'insert') as service_insert,
  has_table_privilege('service_role', 'public.plantation_challenge_responses', 'delete') as service_delete
`;

function isTrue(value: unknown): boolean {
  return value === true || value === "true" || value === "t";
}

/** Apply migration 223 if the plantation challenge table is not ready yet. */
export async function ensurePlantationChallengeSchema(): Promise<boolean> {
  const probeSql = MIGRATION_SATISFACTION_PROBES[PLANTATION_CHALLENGE_MIGRATION];
  if (!probeSql) return false;

  try {
    const resolved = await withMigrationQueryClient(async (client) => {
      const before = await client.query<{ satisfied: boolean | string }>(probeSql);
      const already = isTrue(before.rows[0]?.satisfied);
      if (!already) {
        await applyMigrationSqlViaClient(client, readMigrationSql(PLANTATION_CHALLENGE_MIGRATION));
      }
      const check = await client.query<SchemaCheckRow>(SCHEMA_CHECK_SQL);
      return { already, check: check.rows[0] ?? null };
    });

    if (!resolved?.result.check) {
      console.error("Plantation challenge schema could not be checked.");
      return false;
    }

    const check = resolved.result.check;
    return (
      isTrue(check.satisfied) &&
      isTrue(check.service_select) &&
      isTrue(check.service_insert) &&
      isTrue(check.service_delete)
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "schema apply failed";
    console.error("Plantation challenge schema apply failed", message.slice(0, 500));
    return false;
  }
}
