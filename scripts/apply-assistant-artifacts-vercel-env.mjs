/**
 * Apply migration 137 using credentials injected by `vercel env run`.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import pg from "pg";

const { Client } = pg;

const projectRef = process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";
const token = process.env.SUPABASE_ACCESS_TOKEN?.trim() ?? "";
const sql = readFileSync(
  join(process.cwd(), "supabase/migrations/137_assistant_artifacts_storage.sql"),
  "utf8",
);

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

async function verifyViaManagementApi() {
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

async function applyViaManagementApi() {
  if (!token || token.length < 20 || token === "[SENSITIVE]") {
    console.log("skip management API: token length", token.length);
    return false;
  }
  console.log("Applying via Management API…");
  const applied = await queryViaManagementApi(sql);
  console.log("apply", applied.status, JSON.stringify(applied.data).slice(0, 500));
  if (!applied.ok) return false;
  await queryViaManagementApi(`notify pgrst, 'reload schema'`);
  return verifyViaManagementApi();
}

async function applyViaPostgres() {
  const candidates = [
    process.env.SUPABASE_DB_URL,
    process.env.DATABASE_URL,
    process.env.POSTGRES_URL,
    process.env.POSTGRES_URL_NON_POOLING,
  ].filter((value) => typeof value === "string" && value.length > 20 && value !== "[SENSITIVE]");

  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (serviceRole && serviceRole.length >= 80 && serviceRole !== "[SENSITIVE]") {
    candidates.push(
      `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRole)}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`,
    );
  }

  for (const url of candidates) {
    const client = new Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
    try {
      console.log("Trying Postgres…");
      await client.connect();
      await client.query(sql);
      await client.query(`notify pgrst, 'reload schema'`);
      const result = await client.query(`
        select
          (select exists (
            select 1 from information_schema.tables
            where table_schema = 'public' and table_name = 'assistant_artifact_records'
          )) as table_exists,
          (select exists (
            select 1 from storage.buckets where id = 'assistant-artifacts'
          )) as bucket_exists
      `);
      console.log("verify", result.rows[0]);
      if (result.rows[0]?.table_exists && result.rows[0]?.bucket_exists) return true;
    } catch (error) {
      console.error("postgres failed", error instanceof Error ? error.message : error);
    } finally {
      await client.end().catch(() => undefined);
    }
  }

  return false;
}

const managementOk = await applyViaManagementApi();
if (managementOk) {
  console.log("DONE — migration 137 applied via Management API");
  process.exit(0);
}

const postgresOk = await applyViaPostgres();
if (postgresOk) {
  console.log("DONE — migration 137 applied via Postgres");
  process.exit(0);
}

console.error("FAIL — could not apply migration 137 with production env");
process.exit(1);
