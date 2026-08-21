/**
 * Unit311 Central pending migration runner — ledger + satisfaction probe checks.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

import {
  fetchRecordedMigrationVersions,
  migrationVersion,
  recordMigrationApplied,
  type MigrationLedgerMethod,
  type MigrationQueryClient,
} from "@/lib/migration-ledger";
import {
  computePendingMigrations,
  planMigrationActions,
  runPendingMigrations,
} from "@/lib/migration-runner";
import {
  MIGRATION_SATISFACTION_PROBES,
  migrationsMissingSatisfactionProbes,
} from "@/lib/migration-satisfaction-probes";
import {
  SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  UNIT311_PENDING_MIGRATIONS,
} from "@/lib/unit311-pending-migrations";

class MockMigrationClient implements MigrationQueryClient {
  ledger = new Map<string, MigrationLedgerMethod>();
  probeResults = new Map<string, boolean>();
  queries: string[] = [];

  async query<T extends Record<string, unknown> = Record<string, unknown>>(
    sql: string,
    params?: unknown[],
  ): Promise<{ rows: T[] }> {
    this.queries.push(sql);

    if (sql.includes("create table if not exists public.unit311_applied_migrations")) {
      return { rows: [] as T[] };
    }

    if (sql.startsWith("select version, method from public.unit311_applied_migrations")) {
      return {
        rows: [...this.ledger.entries()].map(([version, method]) => ({ version, method })) as T[],
      };
    }

    if (sql.startsWith("insert into public.unit311_applied_migrations")) {
      const version = params?.[0];
      const method = params?.[1];
      if (typeof version === "string" && typeof method === "string") {
        this.ledger.set(version, method as MigrationLedgerMethod);
      }
      return { rows: [] as T[] };
    }

    for (const [migration, probeSql] of Object.entries(MIGRATION_SATISFACTION_PROBES)) {
      if (sql === probeSql) {
        return {
          rows: [{ satisfied: this.probeResults.get(migration) ?? false }] as T[],
        };
      }
    }

    throw new Error(`Unexpected SQL in mock client: ${sql.slice(0, 120)}`);
  }
}

assert.deepEqual(
  migrationsMissingSatisfactionProbes(UNIT311_PENDING_MIGRATIONS),
  [],
  "every allowlisted migration must have a satisfaction probe",
);

const satisfied053To148 = new Map<string, boolean>(
  UNIT311_PENDING_MIGRATIONS.map((migration) => [
    migration,
    migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  ]),
);

const historicalActions = planMigrationActions({
  migrations: UNIT311_PENDING_MIGRATIONS,
  recordedMethods: new Map<string, MigrationLedgerMethod>(),
  satisfied: satisfied053To148,
});

assert.equal(
  historicalActions.filter((action) => action.kind === "skip" && action.method === "verified_skip")
    .length,
  UNIT311_PENDING_MIGRATIONS.length - 1,
  "053–148 should be verified_skip when schema probes pass",
);

const pending149Action = historicalActions.find(
  (action) => action.kind === "apply" && action.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION,
);
assert.ok(pending149Action, "149 must remain genuinely pending when its probe fails");

const ledgerSkipActions = planMigrationActions({
  migrations: UNIT311_PENDING_MIGRATIONS,
  recordedMethods: new Map([
    [migrationVersion("supabase/migrations/059_email_mailbox_admin_account.sql"), "postgres"],
  ]),
  satisfied: new Map([
    ["supabase/migrations/059_email_mailbox_admin_account.sql", false],
  ]),
});
assert.equal(
  ledgerSkipActions.find(
    (action) =>
      action.kind === "skip" &&
      action.method === "ledger" &&
      action.migration === "supabase/migrations/059_email_mailbox_admin_account.sql",
  )?.method,
  "ledger",
  "postgres ledger entries must skip without re-running SQL",
);

const staleVerifiedSkipActions = planMigrationActions({
  migrations: UNIT311_PENDING_MIGRATIONS,
  recordedMethods: new Map([
    [migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION), "verified_skip"],
  ]),
  satisfied: satisfied053To148,
});
assert.ok(
  staleVerifiedSkipActions.find(
    (action) => action.kind === "apply" && action.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  ),
  "149 must stay pending until runner-confirmed apply even when schema probes pass",
);

const satisfiedIncluding149 = new Map(satisfied053To148);
satisfiedIncluding149.set(SALES_MANAGEMENT_FOUNDATION_MIGRATION, true);

const ledgerConfirmed149Actions = planMigrationActions({
  migrations: UNIT311_PENDING_MIGRATIONS,
  recordedMethods: new Map([
    [migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION), "management-api"],
  ]),
  satisfied: satisfiedIncluding149,
});
assert.ok(
  ledgerConfirmed149Actions.find(
    (action) =>
      action.kind === "skip" &&
      action.method === "verified_skip" &&
      action.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION,
  ),
  "149 can verified_skip once ledger records a runner apply method",
);

const migration149Sql = readFileSync(
  join(process.cwd(), "supabase/migrations/149_sales_management_foundation.sql"),
  "utf8",
);
assert.match(
  migration149Sql,
  /hr_employee_id text references public\.hr_employees \(id\) on delete set null/,
  "migration 149 must keep hr_employee_id as text FK",
);

void (async () => {
  const client = new MockMigrationClient();
  for (const migration of UNIT311_PENDING_MIGRATIONS) {
    client.probeResults.set(
      migration,
      migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION,
    );
  }

  let applyAttempts = 0;
  const result = await runPendingMigrations({
    migrations: UNIT311_PENDING_MIGRATIONS,
    client,
    applyMigrationFile: async (migration) => {
      applyAttempts += 1;
      assert.equal(migration, SALES_MANAGEMENT_FOUNDATION_MIGRATION);
      return { ok: true, method: "postgres" };
    },
  });

  assert.equal(applyAttempts, 1, "only migration 149 SQL should execute");
  assert.equal(result.ok, true);
  assert.equal(result.skipped.length, UNIT311_PENDING_MIGRATIONS.length - 1);
  assert.equal(result.applied.length, 1);
  assert.equal(result.applied[0]?.migration, SALES_MANAGEMENT_FOUNDATION_MIGRATION);
  assert.deepEqual(result.pending, []);
  assert.equal(result.errors.length, 0);

  const failureClient = new MockMigrationClient();
  failureClient.probeResults.set(
    "supabase/migrations/059_email_mailbox_admin_account.sql",
    false,
  );

  const failure = await runPendingMigrations({
    migrations: ["supabase/migrations/059_email_mailbox_admin_account.sql"],
    client: failureClient,
    applyMigrationFile: async () => ({
      ok: false,
      method: "management-api",
      status: 400,
      data: { message: "23514 check constraint violation" },
    }),
  });

  assert.equal(failure.ok, false, "real SQL failures must fail the workflow");
  assert.equal(failure.errors.length, 1);
  assert.equal(failure.errors[0]?.status, 400);
  assert.deepEqual(failure.errors[0]?.data, { message: "23514 check constraint violation" });
  assert.deepEqual(failure.pending, ["supabase/migrations/059_email_mailbox_admin_account.sql"]);

  const recordedAfterSuccess = await fetchRecordedMigrationVersions(client);
  assert.ok(recordedAfterSuccess.has("149_sales_management_foundation.sql"));
  assert.ok(recordedAfterSuccess.has("059_email_mailbox_admin_account.sql"));

  const failureRecorded = await fetchRecordedMigrationVersions(failureClient);
  assert.ok(!failureRecorded.has("059_email_mailbox_admin_account.sql"));

  const pendingOnly149 = computePendingMigrations({
    migrations: UNIT311_PENDING_MIGRATIONS,
    recordedMethods: client.ledger,
    satisfied: satisfied053To148,
    appliedMigrations: [SALES_MANAGEMENT_FOUNDATION_MIGRATION],
  });
  assert.deepEqual(pendingOnly149, []);

  await recordMigrationApplied(
    client,
    "supabase/migrations/060_crm_leads_discovery_notes.sql",
    "verified_skip",
  );
  const afterManualRecord = await fetchRecordedMigrationVersions(client);
  assert.ok(afterManualRecord.has("060_crm_leads_discovery_notes.sql"));

  console.log("ok  pending-migrations-runner checks passed\n");
})();
