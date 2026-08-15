/**
 * Read-only preflight for Supabase Phase 1 staging validation.
 * Does NOT apply migrations.
 */
import { readFileSync } from "node:fs";

function loadEnv(path) {
  const env = {};
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
  return env;
}

const envFiles = [
  ".env.corporatecentre.runtime",
  ".env.prod-validation.tmp",
  ".env.staging-validation.tmp",
];

for (const file of envFiles) {
  try {
    const env = loadEnv(file);
    for (const k of ["SUPABASE_URL", "SUPABASE_ACCESS_TOKEN", "SUPABASE_SERVICE_ROLE_KEY"]) {
      const v = env[k] ?? "";
      if (v.length > 20) {
        if (!process.env[k]) process.env[k] = v;
      }
    }
    if (env.SUPABASE_PROJECT_REF && !process.env.SUPABASE_PROJECT_REF) {
      process.env.SUPABASE_PROJECT_REF = env.SUPABASE_PROJECT_REF;
    }
  } catch {
    /* optional */
  }
}

const url = process.env.SUPABASE_URL ?? "";
const token = process.env.SUPABASE_ACCESS_TOKEN ?? "";
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
const projectRef =
  process.env.SUPABASE_PROJECT_REF ??
  (url.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ?? "");

console.log("=== Supabase Phase 1 staging preflight (read-only) ===\n");
console.log("SUPABASE_URL host:", url ? new URL(url).host : "MISSING");
console.log("SUPABASE_PROJECT_REF:", projectRef || "MISSING");
console.log(
  "Credentials:",
  `access_token=${token.length > 20 ? "present" : "missing"}`,
  `service_role=${serviceKey.length > 40 ? "present" : "missing"}`,
);

if (!token || token.length < 20) {
  console.error("\nBLOCKED: No usable SUPABASE_ACCESS_TOKEN for management API queries.");
  process.exit(2);
}

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
    throw new Error(`mgmt query failed ${res.status}: ${JSON.stringify(data).slice(0, 300)}`);
  }
  return data;
}

const checks = [
  {
    name: "Internal workspace_id defaults remaining",
    sql: `select count(*)::int as count from pg_attrdef d
      join pg_attribute a on a.attrelid = d.adrelid and a.attnum = d.adnum
      join pg_class c on c.oid = a.attrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and a.attname = 'workspace_id' and not a.attisdropped
      and pg_get_expr(d.adbin, d.adrelid) ilike '%cd5c37a5-add4-4a8b-830c-6d26b775f62c%'`,
    expect: (row) => row?.count === 0,
    migration: "142",
  },
  {
    name: "Foundation tables RLS enabled",
    sql: `select count(*)::int as count from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public' and c.relname in (
        'workspaces','workspace_settings','workspace_modules','workspace_users','workspace_audit_log'
      ) and c.relrowsecurity = true`,
    expect: (row) => row?.count === 5,
    migration: "143",
  },
  {
    name: "workspace_id_column_inventory view exists",
    sql: `select count(*)::int as count from information_schema.views
      where table_schema='public' and table_name='workspace_id_column_inventory'`,
    expect: (row) => row?.count === 1,
    migration: "147",
  },
  {
    name: "financial_expenses deny-all policy",
    sql: `select count(*)::int as deny_policies from pg_policy pol
      join pg_class cls on cls.oid = pol.polrelid
      join pg_namespace nsp on nsp.oid = cls.relnamespace
      where nsp.nspname='public' and cls.relname='financial_expenses'
      and pg_get_expr(pol.polqual, pol.polrelid) = 'false'`,
    expect: (row) => (row?.deny_policies ?? 0) >= 1,
    migration: "144",
  },
  {
    name: "internal-files storage deny anon/authenticated",
    sql: `select count(*)::int as policies from pg_policies
      where schemaname='storage' and tablename='objects' and policyname='internal_files_deny_anon_authenticated'`,
    expect: (row) => (row?.policies ?? 0) >= 1,
    migration: "145",
  },
];

try {
  const workspaces = await mgmtQuery(
    `select slug, id::text from public.workspaces where slug in ('unit311','demo','onwardair','talantonimpact','abhi') order by slug`,
  );
  console.log("\nWorkspaces present:", JSON.stringify(workspaces));

  console.log("\nMigration state (on connected database):");
  for (const check of checks) {
    const rows = await mgmtQuery(check.sql);
    const row = Array.isArray(rows) ? rows[0] : rows;
    const ok = check.expect(row);
    console.log(`  [${ok ? "APPLIED?" : "NOT APPLIED"}] ${check.migration} — ${check.name}:`, row);
  }

  const isProduction = projectRef === "kkxtvzxqmbacjatkiupq";
  console.log(
    "\nEnvironment classification:",
    isProduction
      ? "CONNECTED DATABASE IS PRODUCTION (kkxtvzxqmbacjatkiupq) — no separate staging project detected"
      : `NON-PRODUCTION REF: ${projectRef}`,
  );
} catch (error) {
  console.error("\nPreflight failed:", error);
  process.exit(1);
}
