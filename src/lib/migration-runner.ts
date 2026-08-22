import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  fetchRecordedMigrationEntries,
  isLedgerAppliedMethod,
  migrationVersion,
  recordMigrationApplied,
  type MigrationLedgerMethod,
  type MigrationQueryClient,
} from "@/lib/migration-ledger";
import { MIGRATION_SATISFACTION_PROBES } from "@/lib/migration-satisfaction-probes";
import {
  SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  WORKSPACE_ADMIN_METADATA_MIGRATION,
} from "@/lib/unit311-pending-migrations";

const RUNNER_CONFIRMED_MIGRATIONS = new Set([
  SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  WORKSPACE_ADMIN_METADATA_MIGRATION,
]);

function requiresRunnerLedgerConfirmation(migration: string): boolean {
  return RUNNER_CONFIRMED_MIGRATIONS.has(migration);
}

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

export function migrationSatisfiedForPlanning(input: {
  migration: string;
  satisfied: ReadonlyMap<string, boolean>;
  ledgerMethod: MigrationLedgerMethod | undefined;
}): boolean {
  const isSatisfied = input.satisfied.get(input.migration) === true;
  if (!isSatisfied) return false;
  if (requiresRunnerLedgerConfirmation(input.migration)) {
    return isLedgerAppliedMethod(input.ledgerMethod);
  }
  return true;
}

export function shouldPersistVerifiedSkipLedger(input: {
  migration: string;
  satisfied: ReadonlyMap<string, boolean>;
  ledgerMethod: MigrationLedgerMethod | undefined;
}): boolean {
  if (!migrationSatisfiedForPlanning(input)) return false;
  return input.ledgerMethod === undefined;
}

export function shouldSkipPostSatisfactionProbe(
  ledgerMethod: MigrationLedgerMethod | undefined,
): boolean {
  return ledgerMethod !== undefined;
}

export function inferSatisfiedFromLedgerForPost(
  migration: string,
  ledgerMethod: MigrationLedgerMethod,
): boolean {
  if (requiresRunnerLedgerConfirmation(migration)) {
    return isLedgerAppliedMethod(ledgerMethod);
  }
  return ledgerMethod === "verified_skip";
}

export function planMigrationActions(input: {
  migrations: readonly string[];
  recordedMethods: ReadonlyMap<string, MigrationLedgerMethod>;
  satisfied: ReadonlyMap<string, boolean>;
}): MigrationAction[] {
  const actions: MigrationAction[] = [];

  for (const migration of input.migrations) {
    const version = migrationVersion(migration);
    const ledgerMethod = input.recordedMethods.get(version);

    if (
      migrationSatisfiedForPlanning({
        migration,
        satisfied: input.satisfied,
        ledgerMethod,
      })
    ) {
      actions.push({ kind: "skip", migration, method: "verified_skip" });
      continue;
    }

    if (isLedgerAppliedMethod(ledgerMethod)) {
      actions.push({ kind: "skip", migration, method: "ledger" });
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

export async function collectMigrationSatisfactionForPost(
  migrations: readonly string[],
  recordedMethods: ReadonlyMap<string, MigrationLedgerMethod>,
  client: MigrationQueryClient,
): Promise<Map<string, boolean>> {
  const satisfied = new Map<string, boolean>();
  for (const migration of migrations) {
    const ledgerMethod = recordedMethods.get(migrationVersion(migration));
    if (shouldSkipPostSatisfactionProbe(ledgerMethod)) {
      satisfied.set(migration, inferSatisfiedFromLedgerForPost(migration, ledgerMethod!));
      continue;
    }
    satisfied.set(migration, await checkMigrationSatisfied(migration, client));
  }
  return satisfied;
}

/** Repair stale verified_skip ledger rows after a successful runner apply. */
async function reconcileStaleVerifiedSkipRunnerConfirmation(
  migrations: readonly string[],
  client: MigrationQueryClient,
  recordedMethods: Map<string, MigrationLedgerMethod>,
  satisfiedMap: Map<string, boolean>,
): Promise<void> {
  for (const migration of migrations) {
    if (!requiresRunnerLedgerConfirmation(migration)) continue;
    const version = migrationVersion(migration);
    if (recordedMethods.get(version) !== "verified_skip") continue;
    if (satisfiedMap.get(migration) !== true) continue;
    await recordMigrationApplied(client, migration, "management-api");
    recordedMethods.set(version, "management-api");
  }
}

export function computePendingMigrations(input: {
  migrations: readonly string[];
  recordedMethods: ReadonlyMap<string, MigrationLedgerMethod>;
  satisfied: ReadonlyMap<string, boolean>;
  appliedMigrations: readonly string[];
}): string[] {
  const applied = new Set(input.appliedMigrations);
  return input.migrations.filter((migration) => {
    if (applied.has(migration)) return false;
    const version = migrationVersion(migration);
    const ledgerMethod = input.recordedMethods.get(version);
    if (
      migrationSatisfiedForPlanning({
        migration,
        satisfied: input.satisfied,
        ledgerMethod,
      })
    ) {
      return false;
    }
    if (isLedgerAppliedMethod(ledgerMethod)) return false;
    return true;
  });
}

export async function describePendingMigrationPlan(
  migrations: readonly string[],
  client: MigrationQueryClient,
): Promise<MigrationDryRunStatus> {
  const recordedMethods = await fetchRecordedMigrationEntries(client);
  const satisfiedMap = await collectMigrationSatisfaction(migrations, client);
  await reconcileStaleVerifiedSkipRunnerConfirmation(migrations, client, recordedMethods, satisfiedMap);
  const actions = planMigrationActions({
    migrations,
    recordedMethods,
    satisfied: satisfiedMap,
  });

  const recorded = migrations
    .map(migrationVersion)
    .filter((version) => recordedMethods.has(version));
  const satisfied = migrations.filter((migration) => satisfiedMap.get(migration) === true);
  const pending = computePendingMigrations({
    migrations,
    recordedMethods,
    satisfied: satisfiedMap,
    appliedMigrations: [],
  });

  return { recorded, satisfied, pending, actions };
}

export async function runPendingMigrations(
  deps: PendingMigrationRunnerDeps,
): Promise<MigrationRunResult> {
  const recordedMethods = await fetchRecordedMigrationEntries(deps.client);
  const satisfiedMap = await collectMigrationSatisfactionForPost(
    deps.migrations,
    recordedMethods,
    deps.client,
  );
  const actions = planMigrationActions({
    migrations: deps.migrations,
    recordedMethods,
    satisfied: satisfiedMap,
  });

  const applied: MigrationRunEntry[] = [];
  const skipped: MigrationRunEntry[] = [];
  const errors: MigrationErrorEntry[] = [];

  for (const action of actions) {
    if (action.kind === "skip") {
      if (action.method === "verified_skip") {
        const version = migrationVersion(action.migration);
        const ledgerMethod = recordedMethods.get(version);
        if (
          shouldPersistVerifiedSkipLedger({
            migration: action.migration,
            satisfied: satisfiedMap,
            ledgerMethod,
          })
        ) {
          await recordMigrationApplied(deps.client, action.migration, "verified_skip");
          recordedMethods.set(version, "verified_skip");
        }
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
    recordedMethods.set(migrationVersion(action.migration), result.method);
    applied.push({ migration: action.migration, method: result.method });
  }

  const pending = computePendingMigrations({
    migrations: deps.migrations,
    recordedMethods,
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
