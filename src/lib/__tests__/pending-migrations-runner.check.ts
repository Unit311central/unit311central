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
  describePendingMigrationPlan,
  inferSatisfiedFromLedgerForPost,
  planMigrationActions,
  runPendingMigrations,
  shouldPersistVerifiedSkipLedger,
  shouldSkipPostSatisfactionProbe,
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
        rows: [...this.ledger.entries()].map(([version, method]) => ({ version, method })) as unknown as T[],
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
          rows: [{ satisfied: this.probeResults.get(migration) ?? false }] as unknown as T[],
        };
      }
    }

    throw new Error(`Unexpected SQL in mock client: ${sql.slice(0, 120)}`);
  }
}

function countProbeQueries(client: MockMigrationClient): number {
  const probeSqlSet = new Set(Object.values(MIGRATION_SATISFACTION_PROBES));
  return client.queries.filter((sql) => probeSqlSet.has(sql)).length;
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

const satisfied059 = new Map([
  ["supabase/migrations/059_email_mailbox_admin_account.sql", true],
]);
assert.equal(
  shouldPersistVerifiedSkipLedger({
    migration: "supabase/migrations/059_email_mailbox_admin_account.sql",
    satisfied: satisfied059,
    ledgerMethod: "verified_skip",
  }),
  false,
  "existing verified_skip + satisfied probe must not rewrite ledger on POST",
);
assert.equal(
  shouldPersistVerifiedSkipLedger({
    migration: "supabase/migrations/059_email_mailbox_admin_account.sql",
    satisfied: satisfied059,
    ledgerMethod: undefined,
  }),
  true,
  "first-time satisfied probe should persist verified_skip ledger on POST",
);
assert.equal(
  shouldPersistVerifiedSkipLedger({
    migration: SALES_MANAGEMENT_FOUNDATION_MIGRATION,
    satisfied: satisfied053To148,
    ledgerMethod: "verified_skip",
  }),
  false,
  "stale verified_skip + satisfied 149 probe must not persist ledger",
);
assert.ok(
  planMigrationActions({
    migrations: UNIT311_PENDING_MIGRATIONS,
    recordedMethods: new Map([
      [migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION), "verified_skip"],
    ]),
    satisfied: satisfied053To148,
  }).find((action) => action.kind === "apply" && action.migration === SALES_MANAGEMENT_FOUNDATION_MIGRATION),
  "stale verified_skip + satisfied 149 probe remains eligible for apply",
);

assert.equal(shouldSkipPostSatisfactionProbe("verified_skip"), true);
assert.equal(shouldSkipPostSatisfactionProbe(undefined), false);
assert.equal(
  inferSatisfiedFromLedgerForPost("supabase/migrations/059_email_mailbox_admin_account.sql", "verified_skip"),
  true,
);
assert.equal(
  inferSatisfiedFromLedgerForPost("supabase/migrations/059_email_mailbox_admin_account.sql", "postgres"),
  false,
);
assert.equal(
  inferSatisfiedFromLedgerForPost(SALES_MANAGEMENT_FOUNDATION_MIGRATION, "verified_skip"),
  false,
);
assert.equal(
  inferSatisfiedFromLedgerForPost(SALES_MANAGEMENT_FOUNDATION_MIGRATION, "management-api"),
  true,
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

const migration149Policies = [
  { table: "sales_teams", policy: "sales_teams_all" },
  { table: "sales_team_members", policy: "sales_team_members_all" },
  { table: "sales_targets", policy: "sales_targets_all" },
  { table: "sales_commission_rules", policy: "sales_commission_rules_all" },
  { table: "sales_commissions", policy: "sales_commissions_all" },
] as const;

for (const { table, policy } of migration149Policies) {
  assert.match(
    migration149Sql,
    new RegExp(
      `drop policy if exists "${policy}" on public\\.${table};[\\s\\S]*create policy "${policy}" on public\\.${table}`,
    ),
    `migration 149 must drop-then-create policy ${policy} for partial-apply recovery`,
  );
}

assert.equal(
  (migration149Sql.match(/drop policy if exists/g) ?? []).length,
  migration149Policies.length,
  "migration 149 must drop every RLS policy before recreate",
);
assert.equal(
  (migration149Sql.match(/create policy "/g) ?? []).length,
  migration149Policies.length,
  "migration 149 must create exactly five RLS policies",
);

assert.match(migration149Sql, /add column if not exists owner_user_id/, "crm_leads owner column must stay idempotent");
assert.match(migration149Sql, /create table if not exists public\.sales_teams/, "sales tables must stay idempotent");
assert.match(migration149Sql, /create index if not exists sales_teams_workspace_idx/, "indexes must stay idempotent");

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

  const preseededClient = new MockMigrationClient();
  for (const migration of UNIT311_PENDING_MIGRATIONS) {
    preseededClient.probeResults.set(
      migration,
      migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION,
    );
    if (migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION) {
      preseededClient.ledger.set(migrationVersion(migration), "verified_skip");
    }
  }
  preseededClient.ledger.set(
    migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION),
    "verified_skip",
  );

  const insertQueriesBefore = preseededClient.queries.filter((sql) =>
    sql.startsWith("insert into public.unit311_applied_migrations"),
  ).length;
  const probeQueriesBefore = countProbeQueries(preseededClient);

  let preseededApplyAttempts = 0;
  const preseededResult = await runPendingMigrations({
    migrations: UNIT311_PENDING_MIGRATIONS,
    client: preseededClient,
    applyMigrationFile: async (migration) => {
      preseededApplyAttempts += 1;
      assert.equal(migration, SALES_MANAGEMENT_FOUNDATION_MIGRATION);
      // Simulates idempotent re-apply after partial production apply (tables/policies already exist).
      return { ok: true, method: "management-api" };
    },
  });

  const insertQueriesAfter = preseededClient.queries.filter((sql) =>
    sql.startsWith("insert into public.unit311_applied_migrations"),
  ).length;
  const probeQueriesAfter = countProbeQueries(preseededClient);

  assert.equal(
    probeQueriesAfter - probeQueriesBefore,
    0,
    "POST must not probe migrations that already have ledger rows",
  );
  assert.equal(
    insertQueriesAfter - insertQueriesBefore,
    1,
    "POST should only write one new ledger row for runner-confirmed 149 apply",
  );
  assert.equal(
    preseededClient.ledger.get(migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION)),
    "management-api",
  );
  assert.equal(
    preseededClient.ledger.get(migrationVersion("supabase/migrations/053_founder_session_client_timezone.sql")),
    "verified_skip",
    "existing verified_skip rows must remain read-only skips",
  );
  assert.equal(preseededApplyAttempts, 1, "only migration 149 should attempt apply SQL");
  assert.equal(preseededResult.applied.length, 1);
  assert.equal(preseededResult.applied[0]?.migration, SALES_MANAGEMENT_FOUNDATION_MIGRATION);
  assert.equal(preseededResult.applied[0]?.method, "management-api");
  assert.deepEqual(preseededResult.pending, []);

  const confirmed149Client = new MockMigrationClient();
  for (const migration of UNIT311_PENDING_MIGRATIONS) {
    if (migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION) {
      confirmed149Client.ledger.set(migrationVersion(migration), "verified_skip");
    }
  }
  confirmed149Client.ledger.set(
    migrationVersion(SALES_MANAGEMENT_FOUNDATION_MIGRATION),
    "management-api",
  );
  const confirmedProbeQueriesBefore = countProbeQueries(confirmed149Client);
  let confirmedApplyAttempts = 0;
  const confirmedResult = await runPendingMigrations({
    migrations: UNIT311_PENDING_MIGRATIONS,
    client: confirmed149Client,
    applyMigrationFile: async () => {
      confirmedApplyAttempts += 1;
      return { ok: true, method: "management-api" };
    },
  });
  assert.equal(
    countProbeQueries(confirmed149Client) - confirmedProbeQueriesBefore,
    0,
    "POST must not probe runner-confirmed ledger rows",
  );
  assert.equal(confirmedApplyAttempts, 0, "149 with management-api ledger must not apply again");
  assert.equal(confirmedResult.applied.length, 0);
  assert.deepEqual(confirmedResult.pending, []);

  const dryRunClient = new MockMigrationClient();
  for (const migration of UNIT311_PENDING_MIGRATIONS) {
    dryRunClient.probeResults.set(
      migration,
      migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION,
    );
    dryRunClient.ledger.set(migrationVersion(migration), "verified_skip");
  }

  const dryRunPlan = await describePendingMigrationPlan(UNIT311_PENDING_MIGRATIONS, dryRunClient);
  const dryRunActions = planMigrationActions({
    migrations: UNIT311_PENDING_MIGRATIONS,
    recordedMethods: dryRunClient.ledger,
    satisfied: new Map(
      UNIT311_PENDING_MIGRATIONS.map((migration) => [
        migration,
        migration !== SALES_MANAGEMENT_FOUNDATION_MIGRATION,
      ]),
    ),
  });

  assert.equal(
    countProbeQueries(dryRunClient),
    UNIT311_PENDING_MIGRATIONS.length,
    "GET dry-run must still probe every allowlisted migration",
  );
  assert.deepEqual(dryRunPlan.actions, dryRunActions, "GET dry-run plan must stay unchanged");
  assert.ok(
    dryRunPlan.pending.includes(SALES_MANAGEMENT_FOUNDATION_MIGRATION),
    "149 remains pending on GET dry-run until runner-confirmed apply",
  );
  assert.equal(
    dryRunClient.queries.filter((sql) => sql.startsWith("insert into public.unit311_applied_migrations"))
      .length,
    0,
    "GET dry-run must not execute migration SQL or ledger writes",
  );

  console.log("ok  pending-migrations-runner checks passed\n");
})();
