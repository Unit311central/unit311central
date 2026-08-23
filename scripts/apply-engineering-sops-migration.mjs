/**
 * Apply migration 155 (engineering SOP tables) to production Supabase.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const index = trimmed.indexOf("=");
      if (index === -1) continue;
      const key = trimmed.slice(0, index).trim();
      let value = trimmed.slice(index + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (!process.env[key] || process.env[key].length < 20) {
        process.env[key] = value;
      }
    }
  } catch {
    /* optional */
  }
}

for (const file of [
  ".env.deploy.pull",
  ".env.unit311central.prod",
  ".env.corporatecentre.runtime",
  ".env.bcn.pull",
  ".env.vercel.production",
  ".env.vercel.pull",
  ".env.unit311.live",
  ".env.migration.tmp",
  ".env.migration-live.tmp",
]) {
  loadEnv(file);
}

const projectRef = process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
const migrationPath = "supabase/migrations/155_engineering_sops.sql";
const sql = readFileSync(join(process.cwd(), migrationPath), "utf8");

const verifySql = `select
  (select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'engineering_sops'
  )) as engineering_sops,
  (select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'engineering_sop_runs'
  )) as engineering_sop_runs,
  (select exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'engineering_sop_events'
  )) as engineering_sop_events`;

async function queryViaManagementApi(query) {
  const response = await fetch(
    `https://api.supabase.com/v1/projects/${projectRef}/database/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query }),
    },
  );
  const data = await response.json();
  return { ok: response.ok, status: response.status, data };
}

async function verify() {
  const check = await queryViaManagementApi(verifySql);
  console.log("verify", check.status, JSON.stringify(check.data));
  const row = Array.isArray(check.data) ? check.data[0] : null;
  return (
    check.ok &&
    row?.engineering_sops === true &&
    row?.engineering_sop_runs === true &&
    row?.engineering_sop_events === true
  );
}

async function applyDirect() {
  if (!token || token.length < 20) {
    console.log("skip direct: no usable SUPABASE_ACCESS_TOKEN");
    return false;
  }

  if (await verify()) {
    console.log("already applied");
    return true;
  }

  console.log(`Applying ${migrationPath} via Management API…`);
  const applied = await queryViaManagementApi(sql);
  console.log("apply", applied.status, JSON.stringify(applied.data).slice(0, 500));
  if (!applied.ok) return false;

  await queryViaManagementApi(`notify pgrst, 'reload schema'`);
  return verify();
}

async function applyViaProductionApi() {
  if (!secret || secret.length < 8) {
    console.log("skip production API: no INTERNAL_FILES_SETUP_SECRET");
    return false;
  }

  const response = await fetch(
    "https://unit311central.com/api/internal/apply-unit311central-pending-migrations",
    {
      method: "POST",
      headers: {
        "x-setup-secret": secret,
        "Content-Type": "application/json",
      },
    },
  );

  const text = await response.text();
  console.log("production API", response.status, text.slice(0, 3000));
  if (!response.ok) return false;
  return verify();
}

async function applyViaSupabaseCli() {
  const { spawnSync } = await import("node:child_process");
  const verifyFirst = spawnSync(
    "npx",
    [
      "supabase",
      "db",
      "query",
      "--linked",
      verifySql,
    ],
    { encoding: "utf8", shell: true },
  );
  if (verifyFirst.stdout?.includes("true")) {
    console.log("already applied (supabase cli verify)");
    return true;
  }

  console.log(`Applying ${migrationPath} via Supabase CLI…`);
  const applied = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", "-f", migrationPath],
    { encoding: "utf8", shell: true },
  );
  console.log("supabase apply", applied.status, (applied.stderr || applied.stdout || "").slice(0, 500));
  if (applied.status !== 0) return false;

  spawnSync("npx", ["supabase", "db", "query", "--linked", "notify pgrst, 'reload schema';"], {
    encoding: "utf8",
    shell: true,
  });

  await queryViaManagementApi(
    `insert into public.unit311_applied_migrations (version, method) values ('155_engineering_sops.sql', 'management-api') on conflict (version) do update set method = excluded.method, applied_at = now()`,
  );

  const verifyAfter = spawnSync(
    "npx",
    ["supabase", "db", "query", "--linked", verifySql],
    { encoding: "utf8", shell: true },
  );
  console.log("supabase verify", verifyAfter.stdout?.slice(0, 300));
  return verifyAfter.stdout?.includes("true");
}

const cliOk = await applyViaSupabaseCli();
if (cliOk) {
  console.log("DONE — migration 155 engineering SOPs applied via Supabase CLI");
  process.exit(0);
}

const directOk = await applyDirect();
if (directOk) {
  console.log("DONE — migration 155 engineering SOPs applied");
  process.exit(0);
}

const apiOk = await applyViaProductionApi();
if (apiOk) {
  console.log("DONE — migration 155 applied via production pending-migrations API");
  process.exit(0);
}

console.error("FAIL — could not apply migration 155");
process.exit(1);
