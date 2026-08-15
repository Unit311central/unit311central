/**
 * Apply Phase 1 migrations to staging branch via Management API.
 * Usage: SUPABASE_PROJECT_REF=jbcyewdsoerdiiokhpin node scripts/phase1-staging-apply.mjs
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnv(path) {
  const env = { ...process.env };
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      env[t.slice(0, i).trim()] = v;
    }
  } catch {
    /* optional */
  }
  return env;
}

const env = loadEnv(".env.corporatecentre.runtime");
const token = env.SUPABASE_ACCESS_TOKEN ?? process.env.SUPABASE_ACCESS_TOKEN;
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  env.SUPABASE_PROJECT_REF ??
  "jbcyewdsoerdiiokhpin";

if (!token || token.length < 20) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(2);
}

const ORDER = [
  "142_remove_internal_workspace_defaults.sql",
  "143_workspace_foundation_security.sql",
  "146_hr_workspace_uuid_normalization.sql",
  "147_procurement_workspace_uuid_inventory.sql",
  "145_storage_workspace_isolation.sql",
  "144_priority_tables_tenant_isolation_rls.sql",
];

const CHECKS = [
  {
    migration: "142",
    name: "Internal workspace_id defaults remaining",
    sql: `select count(*)::int as count from pg_attrdef d
      join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and a.attname = 'workspace_id' and not a.attisdropped
      and pg_get_expr(d.adbin, d.adrelid) ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%'`,
    ok: (r) => r?.count === 0,
  },
  {
    migration: "143",
    name: "Foundation tables RLS enabled",
    sql: `select count(*)::int as count from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in (
        'workspaces','workspace_settings','workspace_modules','workspace_users','workspace_audit_log'
      ) and c.relrowsecurity = true`,
    ok: (r) => r?.count === 5,
  },
  {
    migration: "147",
    name: "workspace_id_column_inventory view",
    sql: `select count(*)::int as count from information_schema.views
      where table_schema='public' and table_name='workspace_id_column_inventory'`,
    ok: (r) => r?.count === 1,
  },
  {
    migration: "145",
    name: "internal-files storage deny policy",
    sql: `select count(*)::int as policies from pg_policies
      where schemaname='storage' and tablename='objects' and policyname='internal_files_deny_anon_authenticated'`,
    ok: (r) => (r?.policies ?? 0) >= 1,
  },
  {
    migration: "144",
    name: "financial_expenses deny-all",
    sql: `select count(*)::int as deny_policies from pg_policy pol
      join pg_class cls on cls.oid = pol.polrelid
      join pg_namespace nsp on nsp.oid = cls.relnamespace
      where nsp.nspname='public' and cls.relname='financial_expenses'
      and pg_get_expr(pol.polqual, pol.polrelid) = 'false'`,
    ok: (r) => (r?.deny_policies ?? 0) >= 1,
  },
];

async function mgmtQuery(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`mgmt ${res.status}: ${JSON.stringify(data).slice(0, 500)}`);
  }
  return data;
}

async function applyMigration(file) {
  const sql = readFileSync(
    join(process.cwd(), "supabase", "migrations", file),
    "utf8",
  );
  console.log(`\n=== Applying ${file} ===`);
  const result = await mgmtQuery(sql);
  if (result?.error) throw new Error(JSON.stringify(result));
  await mgmtQuery(`notify pgrst, 'reload schema'`);
  console.log(`OK: ${file}`);
}

console.log("Staging project ref:", projectRef);
console.log("Production ref (must differ): kkxtvzxqmbacjatkiupq");
if (projectRef === "kkxtvzxqmbacjatkiupq") {
  console.error("REFUSING to apply on production project ref");
  process.exit(3);
}

const workspaces = await mgmtQuery(
  `select slug, name, workspace_type, status::text as status
   from public.workspaces
   where slug in ('unit311','demo','onwardair','talantonimpact','abhi','corpcentre','corporatecentre')
   order by slug`,
);
console.log("\nWorkspaces on staging:", JSON.stringify(workspaces));

for (const file of ORDER) {
  await applyMigration(file);
  const num = file.slice(0, 3);
  for (const check of CHECKS.filter((c) => c.migration === num)) {
    const rows = await mgmtQuery(check.sql);
    const row = Array.isArray(rows) ? rows[0] : rows;
    console.log(`  verify ${check.migration}: ${check.name} =>`, row, check.ok(row) ? "PASS" : "FAIL");
  }
}

console.log("\nFinal migration state:");
for (const check of CHECKS) {
  const rows = await mgmtQuery(check.sql);
  const row = Array.isArray(rows) ? rows[0] : rows;
  console.log(`  [${check.ok(row) ? "PASS" : "FAIL"}] ${check.migration} ${check.name}:`, row);
}
