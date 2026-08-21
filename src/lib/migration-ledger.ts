export const UNIT311_MIGRATION_LEDGER_TABLE = "unit311_applied_migrations";

export const LEDGER_BOOTSTRAP_SQL = `
create table if not exists public.${UNIT311_MIGRATION_LEDGER_TABLE} (
  version text primary key,
  applied_at timestamptz not null default now(),
  method text not null check (method in ('management-api', 'postgres', 'verified_skip'))
);
`.trim();

export type MigrationLedgerMethod = "management-api" | "postgres" | "verified_skip";

export interface MigrationQueryClient {
  query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }>;
}

export function migrationVersion(migrationPath: string): string {
  return migrationPath.replace(/^supabase\/migrations\//, "");
}

export async function ensureMigrationLedger(client: MigrationQueryClient): Promise<void> {
  await client.query(LEDGER_BOOTSTRAP_SQL);
}

export async function fetchRecordedMigrationEntries(
  client: MigrationQueryClient,
): Promise<Map<string, MigrationLedgerMethod>> {
  await ensureMigrationLedger(client);
  const result = await client.query<{ version: string; method: MigrationLedgerMethod }>(
    `select version, method from public.${UNIT311_MIGRATION_LEDGER_TABLE}`,
  );
  return new Map(result.rows.map((row) => [row.version, row.method]));
}

export async function fetchRecordedMigrationVersions(
  client: MigrationQueryClient,
): Promise<Set<string>> {
  const entries = await fetchRecordedMigrationEntries(client);
  return new Set(entries.keys());
}

export function isLedgerAppliedMethod(method: MigrationLedgerMethod | undefined): boolean {
  return method === "management-api" || method === "postgres";
}

export const RECORD_MIGRATION_APPLIED_SQL = `insert into public.${UNIT311_MIGRATION_LEDGER_TABLE} (version, method)
     values ($1, $2)
     on conflict (version) do update
     set method = excluded.method,
         applied_at = now()
     where public.${UNIT311_MIGRATION_LEDGER_TABLE}.method = 'verified_skip'
       and excluded.method in ('management-api', 'postgres')`;

export function shouldUpgradeVerifiedSkipLedgerOnConflict(
  existingMethod: MigrationLedgerMethod | undefined,
  incomingMethod: MigrationLedgerMethod,
): boolean {
  return (
    existingMethod === "verified_skip" &&
    isLedgerAppliedMethod(incomingMethod)
  );
}

export async function recordMigrationApplied(
  client: MigrationQueryClient,
  migrationPath: string,
  method: MigrationLedgerMethod,
): Promise<void> {
  await ensureMigrationLedger(client);
  await client.query(RECORD_MIGRATION_APPLIED_SQL, [
    migrationVersion(migrationPath),
    method,
  ]);
}
