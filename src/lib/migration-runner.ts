import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  fetchRecordedMigrationVersions,
  migrationVersion,
  recordMigrationApplied,
  type MigrationLedgerMethod,
  type MigrationQueryClient,
} from "@/lib/migration-ledger";
import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";

export type MigrationSkipMethod = "ledger" | MigrationLedgerMethod;

export type MigrationAction =
  | { kind: "skip"; migration: string; method: MigrationSkipMethod }
  | { kind: "apply"; migration: string };

export interface MigrationRunEntry {
  migration: string;
  method: string;
}

export interface MigrationErrorEntry {
  migration: string;
  method: string;
  status?: number;
  data: unknown;
}

export interface MigrationRunResult {
  ok: boolean;
  applied: MigrationRunEntry[];
  skipped: MigrationRunEntry[];
  errors: MigrationErrorEntry[];
  pending: string[];
}

export interface MigrationDryRunStatus {
  recorded: string[];
  satisfied: string[];
  pending: string[];
  actions: MigrationAction[];
}

export interface MigrationApplyResult {
  ok: boolean;
  method: "management-api" | "postgres";
  status?: number;
  data?: unknown;
}

export interface PendingMigrationRunnerDeps {
  migrations: readonly string[];
  client: MigrationQueryClient;
  applyMigrationFile: (migration: string) => Promise<MigrationApplyResult>;
}

export function planMigrationActions(input: {
  migrations: readonly string[];
  recordedVersions: Set<string>;
  satisfied: ReadonlyMap<string, boolean>;
}): MigrationAction[] {
  const actions: MigrationAction[] = [];

  for (const migration of input.migrations) {
    const version = migrationVersion(migration);
    if (input.recordedVersions.has(version)) {
      actions.push({ kind: "skip", migration, method: "ledger" });
      continue;
    }

    if (input.satisfied.get(migration) === true) {
      actions.push({ kind: "skip", migration, method: "verified_skip" });
      continue;
    }

    actions.push({ kind: "apply", migration });
  }

  return actions;
}

export async function checkMigrationSatisfied(
  migration: string,
  client: MigrationQueryClient,
): Promise<boolean> {
  const probeSql = MIGRATION_SATISFACTION_PROBES[migration];
  if (!probeSql) return false;

  const result = await client.query<{ satisfied: boolean }>(probeSql);
  return Boolean(result.rows[0]?.satisfied);
}

export async function collectMigrationSatisfaction(
  migrations: readonly string[],
  client: MigrationQueryClient,
): Promise<Map<string, boolean>> {
  const satisfied = new Map<string, boolean>();
  for (const migration of migrations) {
    satisfied.set(migration, await checkMigrationSatisfied(migration, client));
  }
  return satisfied;
}

export function computePendingMigrations(input: {
  migrations: readonly string[];
  recordedVersions: Set<string>;
  satisfied: ReadonlyMap<string, boolean>;
  appliedMigrations: readonly string[];
}): string[] {
  const applied = new Set(input.appliedMigrations);
  return input.migrations.filter((migration) => {
    if (applied.has(migration)) return false;
    const version = migrationVersion(migration);
    if (input.recordedVersions.has(version)) return false;
    return input.satisfied.get(migration) !== true;
  });
}

export async function describePendingMigrationPlan(
  migrations: readonly string[],
  client: MigrationQueryClient,
): Promise<MigrationDryRunStatus> {
  const recordedVersions = await fetchRecordedMigrationVersions(client);
  const satisfiedMap = await collectMigrationSatisfaction(migrations, client);
  const actions = planMigrationActions({
    migrations,
    recordedVersions,
    satisfied: satisfiedMap,
  });

  const recorded = migrations
    .map(migrationVersion)
    .filter((version) => recordedVersions.has(version));
  const satisfied = migrations.filter((migration) => satisfiedMap.get(migration) === true);
  const pending = computePendingMigrations({
    migrations,
    recordedVersions,
    satisfied: satisfiedMap,
    appliedMigrations: [],
  });

  return { recorded, satisfied, pending, actions };
}

export async function runPendingMigrations(
  deps: PendingMigrationRunnerDeps,
): Promise<MigrationRunResult> {
  const recordedVersions = await fetchRecordedMigrationVersions(deps.client);
  const satisfiedMap = await collectMigrationSatisfaction(deps.migrations, deps.client);
  const actions = planMigrationActions({
    migrations: deps.migrations,
    recordedVersions,
    satisfied: satisfiedMap,
  });

  const applied: MigrationRunEntry[] = [];
  const skipped: MigrationRunEntry[] = [];
  const errors: MigrationErrorEntry[] = [];

  for (const action of actions) {
    if (action.kind === "skip") {
      if (action.method === "verified_skip") {
        await recordMigrationApplied(deps.client, action.migration, "verified_skip");
        recordedVersions.add(migrationVersion(action.migration));
      }
      skipped.push({ migration: action.migration, method: action.method });
      continue;
    }

    const result = await deps.applyMigrationFile(action.migration);
    if (!result.ok) {
      errors.push({
        migration: action.migration,
        method: result.method,
        status: result.status,
        data: result.data ?? "Migration failed.",
      });
      continue;
    }

    await recordMigrationApplied(deps.client, action.migration, result.method);
    recordedVersions.add(migrationVersion(action.migration));
    applied.push({ migration: action.migration, method: result.method });
  }

  const pending = computePendingMigrations({
    migrations: deps.migrations,
    recordedVersions,
    satisfied: satisfiedMap,
    appliedMigrations: applied.map((entry) => entry.migration),
  });

  return {
    ok: errors.length === 0,
    applied,
    skipped,
    errors,
    pending,
  };
}

export function readMigrationSql(migrationPath: string): string {
  const fileName = migrationPath.replace(/^supabase\/migrations\//, "");
  return readFileSync(join(process.cwd(), "supabase", "migrations", fileName), "utf8");
}

export async function applyMigrationSqlViaClient(
  client: MigrationQueryClient,
  sql: string,
): Promise<void> {
  await client.query(sql);
}
