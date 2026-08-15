/**
 * Idempotent replay of Phase 1 migrations on linked staging DB.
 */
import { spawnSync } from "node:child_process";

const ORDER = [
  "142_remove_internal_workspace_defaults.sql",
  "143_workspace_foundation_security.sql",
  "146_hr_workspace_uuid_normalization.sql",
  "147_procurement_workspace_uuid_inventory.sql",
  "145_storage_workspace_isolation.sql",
  "144_priority_tables_tenant_isolation_rls.sql",
];

const MIGRATION_DIR = "supabase/migrations";

const VERIFY_CHECKS = [
  {
    migration: "142",
    name: "Internal workspace_id defaults remaining",
    sql: "select count(*)::int as count from pg_attrdef d join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum join pg_class c on c.oid = a.attrelid join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and a.attname = 'workspace_id' and not a.attisdropped and pg_get_expr(d.adbin, d.adrelid) ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%'",
    ok: (r) => r?.count === 0,
  },
  {
    migration: "143",
    name: "Foundation tables RLS enabled",
    sql: "select count(*)::int as count from pg_class c join pg_namespace n on n.oid = c.relnamespace where n.nspname = 'public' and c.relname in ('workspaces','workspace_settings','workspace_modules','workspace_users','workspace_audit_log') and c.relrowsecurity = true",
    ok: (r) => r?.count === 5,
  },
  {
    migration: "147",
    name: "workspace_id_column_inventory view",
    sql: "select count(*)::int as count from information_schema.views where table_schema='public' and table_name='workspace_id_column_inventory'",
    ok: (r) => r?.count === 1,
  },
  {
    migration: "145",
    name: "internal-files storage deny policy",
    sql: "select count(*)::int as policies from pg_policies where schemaname='storage' and tablename='objects' and policyname='internal_files_deny_anon_authenticated'",
    ok: (r) => (r?.policies ?? 0) >= 1,
  },
  {
    migration: "144",
    name: "financial_expenses deny-all",
    sql: "select count(*)::int as deny_policies from pg_policy pol join pg_class cls on cls.oid = pol.polrelid join pg_namespace nsp on nsp.oid = cls.relnamespace where nsp.nspname='public' and cls.relname='financial_expenses' and pg_get_expr(pol.polqual, pol.polrelid) = 'false'",
    ok: (r) => (r?.deny_policies ?? 0) >= 1,
  },
];

const verifyOnly = process.argv.includes("--verify");

if (verifyOnly) {
  console.log("Phase 1 verify-only mode (linked staging DB)\n");
  let failures = 0;
  for (const check of VERIFY_CHECKS) {
    const escaped = check.sql.replace(/"/g, '\\"');
    const result = spawnSync(
      `npx supabase db query --linked "${escaped}" -o json`,
      { encoding: "utf8", shell: true },
    );
    const stdout = result.stdout ?? "";
    const jsonStart = stdout.indexOf("{");
    const parsed = jsonStart >= 0 ? JSON.parse(stdout.slice(jsonStart)) : null;
    const row = parsed?.rows?.[0];
    const pass = check.ok(row);
    console.log(`  [${pass ? "PASS" : "FAIL"}] ${check.migration} ${check.name}:`, row);
    if (!pass) failures += 1;
  }
  process.exit(failures > 0 ? 1 : 0);
}

let failures = 0;
for (const file of ORDER) {
  console.log(`\n=== REPLAY ${file} ===`);
  const result = spawnSync("npx", ["supabase", "db", "query", "--linked", "-f", `${MIGRATION_DIR}/${file}`], {
    stdio: "inherit",
    shell: true,
  });
  if ((result.status ?? 1) !== 0) {
    console.error(`FAILED: ${file}`);
    failures += 1;
    break;
  }
  console.log(`OK: ${file}`);
}

process.exit(failures > 0 ? 1 : 0);
