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

export async function fetchRecordedMigrationVersions(
  client: MigrationQueryClient,
): Promise<Set<string>> {
  await ensureMigrationLedger(client);
  const result = await client.query<{ version: string }>(
    `select version from public.${UNIT311_MIGRATION_LEDGER_TABLE}`,
  );
  return new Set(result.rows.map((row) => row.version));
}

export async function recordMigrationApplied(
  client: MigrationQueryClient,
  migrationPath: string,
  method: MigrationLedgerMethod,
): Promise<void> {
  await ensureMigrationLedger(client);
  await client.query(
    `insert into public.${UNIT311_MIGRATION_LEDGER_TABLE} (version, method)
     values ($1, $2)
     on conflict (version) do nothing`,
    [migrationVersion(migrationPath), method],
  );
}
