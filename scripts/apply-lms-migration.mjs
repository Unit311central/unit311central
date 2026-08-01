import { readFileSync } from "node:fs";
import pg from "pg";

function loadEnv(path) {
  try {
    for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  } catch {
    /* missing */
  }
}

loadEnv(".env.deploy.pull");
loadEnv(".env.local");
loadEnv(".env.vercel.lms");
loadEnv(".env.corporatecentre.runtime");

const projectRef = process.env.SUPABASE_PROJECT_REF || "kkxtvzxqmbacjatkiupq";
const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
if (!serviceRole) {
  console.error("Missing SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sql = readFileSync("supabase/migrations/128_unit311_lms.sql", "utf8");
const urls = [
  `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRole)}@aws-1-eu-west-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRole)}@aws-0-eu-west-2.pooler.supabase.com:5432/postgres`,
  `postgresql://postgres.${projectRef}:${encodeURIComponent(serviceRole)}@aws-1-eu-west-2.pooler.supabase.com:6543/postgres`,
];

let lastError = null;
for (const url of urls) {
  const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
  try {
    await client.connect();
    await client.query(sql);
    const check = await client.query(
      `select table_name from information_schema.tables where table_schema='public' and table_name like 'lms_%' order by 1`,
    );
    console.log("OK via", url.includes("aws-0") ? "aws-0" : url.includes("6543") ? "tx" : "session");
    console.log(
      "tables",
      check.rows.map((r) => r.table_name),
    );
    await client.end();
    process.exit(0);
  } catch (error) {
    lastError = error;
    try {
      await client.end();
    } catch {
      /* */
    }
    console.log("failed", error.message?.slice(0, 120));
  }
}

console.error("All connection attempts failed", lastError?.message);
process.exit(1);
