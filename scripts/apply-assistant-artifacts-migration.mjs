/**
 * Apply migration 137 (assistant artifact storage) to production Supabase.
 * Loads .env.migration.tmp from `vercel env pull` when present.
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
  ".env.corporatecentre.runtime",
  ".env.deploy.pull",
  ".env.unit311central.prod",
]) {
  loadEnv(file);
}

const projectRef = process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim();
const secret = process.env.INTERNAL_FILES_SETUP_SECRET?.trim();
const migrationPath = "supabase/migrations/137_assistant_artifacts_storage.sql";
const sql = readFileSync(join(process.cwd(), migrationPath), "utf8");

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
  const check = await queryViaManagementApi(`
    select
      (select exists (
        select 1 from information_schema.tables
        where table_schema = 'public' and table_name = 'assistant_artifact_records'
      )) as table_exists,
      (select exists (
        select 1 from storage.buckets where id = 'assistant-artifacts'
      )) as bucket_exists
  `);
  console.log("verify", check.status, JSON.stringify(check.data));
  return check.ok;
}

async function applyDirect() {
  if (!token || token.length < 20) {
    console.log("skip direct: no usable SUPABASE_ACCESS_TOKEN");
    return false;
  }

  console.log(`Applying ${migrationPath} via Management API…`);
  const applied = await queryViaManagementApi(sql);
  console.log("apply", applied.status, JSON.stringify(applied.data).slice(0, 500));
  if (!applied.ok) return false;

  await queryViaManagementApi(`notify pgrst, 'reload schema'`);
  return verify();
}

async function applyViaProductionApi() {
  if (!secret || secret.length < 8 || secret === "[SENSITIVE]") {
    console.log("skip production API: no INTERNAL_FILES_SETUP_SECRET");
    return false;
  }

  const response = await fetch(
    "https://unit311central.com/api/internal/apply-assistant-artifacts-migration",
    {
      method: "POST",
      headers: {
        "x-setup-secret": secret,
        "Content-Type": "application/json",
      },
    },
  );

  const text = await response.text();
  console.log("production API", response.status, text.slice(0, 2000));
  return response.ok;
}

const directOk = await applyDirect();
if (directOk) {
  console.log("DONE — migration 137 applied via Management API");
  process.exit(0);
}

const apiOk = await applyViaProductionApi();
if (apiOk) {
  console.log("DONE — migration 137 applied via production API");
  process.exit(0);
}

console.error("FAIL — could not apply migration 137");
process.exit(1);
