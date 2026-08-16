/**
 * Cross-workspace tenancy security checks for Supabase Phase 1.
 * Run: npm run prove:workspace-tenancy
 *
 * Requires SUPABASE_URL + SUPABASE_ANON_KEY.
 * Schema checks use SUPABASE_ACCESS_TOKEN (Management API) when set, else DATABASE_URL/POSTGRES_URL (pg).
 * Runtime isolation tests require SUPABASE_SERVICE_ROLE_KEY.
 */
import assert from "node:assert/strict";
import { createClient } from "@supabase/supabase-js";

import {
  querySchemaScalar,
  resolveSchemaQueryBackend,
  type SchemaQueryBackend,
} from "@/lib/internal-db-migrations";

const PHASE1_WORKSPACE_SLUGS = ["unit311", "demo", "onwardair", "talantonimpact", "abhi"] as const;

const PRIORITY_TABLES = [
  "financial_expenses",
  "crm_leads",
  "internal_projects",
  "hr_employees",
  "file_objects",
  "software_provider_connections",
  "platform_users",
  "partners",
] as const;

type WorkspaceRef = { slug: string; id: string };

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

function anonClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_ANON_KEY"));
}

function serviceClient() {
  return createClient(requireEnv("SUPABASE_URL"), requireEnv("SUPABASE_SERVICE_ROLE_KEY"), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadWorkspaces(): Promise<WorkspaceRef[]> {
  const supabase = serviceClient();
  const { data, error } = await supabase
    .from("workspaces")
    .select("id, slug")
    .in("slug", [...PHASE1_WORKSPACE_SLUGS]);

  if (error) throw new Error(`workspaces load failed: ${error.message}`);
  return (data ?? []).map((row) => ({
    slug: String(row.slug),
    id: String(row.id),
  }));
}

async function schemaScalar<T>(sql: string, backend: SchemaQueryBackend): Promise<T> {
  const result = await querySchemaScalar<T>(sql, backend);
  return result.row;
}

async function checkInternalDefaultsRemoved(backend: SchemaQueryBackend): Promise<void> {
  const row = await schemaScalar<{ count: number }>(
    "select count(*)::int as count from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and a.attname = 'workspace_id' and not a.attisdropped and pg_get_expr(d.adbin, d.adrelid) ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%'",
    backend,
  );

  console.log(`[schema] Internal workspace_id defaults remaining: ${row.count}`);
  assert.equal(row.count, 0, "Internal workspace_id defaults must be removed (migration 142)");
}

async function checkFoundationRls(backend: SchemaQueryBackend): Promise<void> {
  const row = await schemaScalar<{ count: number }>(
    "select count(*)::int as count from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('workspaces','workspace_settings','workspace_modules','workspace_users','workspace_audit_log') and c.relrowsecurity = true",
    backend,
  );

  console.log(`[schema] Foundation tables with RLS enabled: ${row.count}/5`);
  assert.equal(row.count, 5, "All foundation tables must have RLS enabled (migration 143)");
}

async function checkPriorityDenyAll(table: string, backend: SchemaQueryBackend): Promise<void> {
  const row = await schemaScalar<{ table_exists: boolean; deny_policies: number; open_policies: number }>(
    `select to_regclass('public.${table}') is not null as table_exists, coalesce((select count(*) filter (where pg_get_expr(pol.polqual, pol.polrelid) = 'false') from pg_policy pol join pg_class cls on cls.oid = pol.polrelid join pg_namespace nsp on nsp.oid = cls.relnamespace where nsp.nspname = 'public' and cls.relname = '${table}'), 0)::int as deny_policies, coalesce((select count(*) filter (where pg_get_expr(pol.polqual, pol.polrelid) = 'true' or pg_get_expr(pol.polwithcheck, pol.polrelid) = 'true') from pg_policy pol join pg_class cls on cls.oid = pol.polrelid join pg_namespace nsp on nsp.oid = cls.relnamespace where nsp.nspname = 'public' and cls.relname = '${table}'), 0)::int as open_policies`,
    backend,
  );

  if (!row.table_exists) {
    console.log(`[schema] ${table}: absent (skipped — not deployed in this environment)`);
    return;
  }

  const deny = row.deny_policies ?? 0;
  const open = row.open_policies ?? 0;
  console.log(`[schema] ${table}: deny=${deny} open=${open}`);
  if (open > 0) {
    throw new Error(`${table} still has permissive RLS policies`);
  }
  assert.ok(deny >= 1, `${table} must have deny-all policy after migration 144`);
}

async function testAnonCrossWorkspaceBlocked(
  table: string,
  workspaceA: WorkspaceRef,
  workspaceB: WorkspaceRef,
): Promise<{ read: string; write: string; delete: string }> {
  const anon = anonClient();

  const read = await anon.from(table).select("id").eq("workspace_id", workspaceB.id).limit(5);
  const readStatus =
    read.error ? "blocked" : (read.data?.length ?? 0) === 0 ? "empty" : "LEAK";

  const write = await anon
    .from(table)
    .update({ updated_at: new Date().toISOString() } as never)
    .eq("workspace_id", workspaceB.id)
    .select("id")
    .limit(1);
  const writeStatus =
    write.error ? "blocked" : (write.data?.length ?? 0) === 0 ? "no-op" : "LEAK";

  const del = await anon
    .from(table)
    .delete()
    .eq("workspace_id", workspaceB.id)
    .select("id")
    .limit(1);
  const deleteStatus =
    del.error ? "blocked" : (del.data?.length ?? 0) === 0 ? "no-op" : "LEAK";

  void workspaceA;
  return { read: readStatus, write: writeStatus, delete: deleteStatus };
}

async function testServiceRoleSameWorkspace(
  table: string,
  workspace: WorkspaceRef,
): Promise<string> {
  const service = serviceClient();
  const { error } = await service
    .from(table)
    .select("id")
    .eq("workspace_id", workspace.id)
    .limit(1);

  return error ? `error:${error.message}` : "ok";
}

async function main() {
  const hasServiceRole = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY?.trim());
  const schemaBackend = resolveSchemaQueryBackend();

  console.log("Supabase Phase 1 — workspace tenancy security checks\n");

  if (schemaBackend) {
    const backendLabel =
      schemaBackend === "management-api" ? "Supabase Management API" : "pg (DATABASE_URL/POSTGRES_URL)";
    console.log(`[schema] Using ${backendLabel}`);
    await checkInternalDefaultsRemoved(schemaBackend);
    await checkFoundationRls(schemaBackend);
    for (const table of PRIORITY_TABLES) {
      await checkPriorityDenyAll(table, schemaBackend);
    }
  } else {
    console.warn(
      "[schema] Skipped — set SUPABASE_ACCESS_TOKEN (Management API) or DATABASE_URL/POSTGRES_URL (pg) to run schema validation",
    );
  }

  if (!hasServiceRole) {
    console.warn("\n[runtime] Skipped cross-workspace tests — SUPABASE_SERVICE_ROLE_KEY required");
    console.log("\nPhase 1 checks complete (partial).");
    return;
  }

  const workspaces = await loadWorkspaces();
  assert.ok(workspaces.length >= 2, "Need at least two Phase 1 workspaces in DB");

  console.log("\n[runtime] Cross-workspace matrix (anon client — must not leak):\n");
  console.log("| Workspace A | Workspace B | Table | Read | Write | Delete |");
  console.log("|---|---|---|---|---|---|");

  const pairs: Array<[WorkspaceRef, WorkspaceRef]> = [];
  for (let i = 0; i < workspaces.length; i++) {
    for (let j = 0; j < workspaces.length; j++) {
      if (i !== j) pairs.push([workspaces[i], workspaces[j]]);
    }
  }

  let leaks = 0;

  for (const [a, b] of pairs.slice(0, 12)) {
    for (const table of PRIORITY_TABLES) {
      const result = await testAnonCrossWorkspaceBlocked(table, a, b);
      console.log(
        `| ${a.slug} | ${b.slug} | ${table} | ${result.read} | ${result.write} | ${result.delete} |`,
      );
      if (result.read === "LEAK" || result.write === "LEAK" || result.delete === "LEAK") {
        leaks += 1;
      }
    }
  }

  console.log("\n[runtime] Same-workspace service-role reads:");
  for (const ws of workspaces) {
    for (const table of PRIORITY_TABLES) {
      const status = await testServiceRoleSameWorkspace(table, ws);
      console.log(`  ${ws.slug} / ${table}: ${status}`);
      assert.ok(!status.startsWith("error:"), `${ws.slug} ${table} service read failed`);
    }
  }

  assert.equal(leaks, 0, "Cross-workspace anon access leaks detected");
  console.log("\nAll Phase 1 workspace tenancy checks passed.");
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
