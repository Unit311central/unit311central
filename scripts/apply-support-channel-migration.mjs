import { readFileSync } from "node:fs";
import { join } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "kkxtvzxqmbacjatkiupq";
const migrationPath =
  process.argv[2] ?? "supabase/migrations/027_support_channel_whatsapp.sql";

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

async function query(sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/query`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query: sql }),
  });

  const data = await res.json();
  return { status: res.status, data };
}

const sql = readFileSync(join(process.cwd(), migrationPath), "utf8");
const result = await query(sql);
console.log("migration", migrationPath, result.status, JSON.stringify(result.data).slice(0, 500));

const reload = await query(`notify pgrst, 'reload schema'`);
console.log("schema reload", reload.status, JSON.stringify(reload.data));

const check = await query(
  `select room, name, channel_type from public.internal_message_channels where room = 'support-desk'`,
);
console.log("support channel", check.status, JSON.stringify(check.data));
