import { readFileSync } from "node:fs";
import { join } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const refs = [
  "luvqotlljbfmnfwhoypz",
  "nnrlwysdonuutrwuadzi",
  "dowomlnsxwxslpydtitw",
  "zjrcshsrotzorexkundd",
];

async function query(ref, sql) {
  const res = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, {
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

for (const ref of refs) {
  const result = await query(
    ref,
    `select table_name from information_schema.tables
     where table_schema = 'public'
       and table_name in ('telemetry', 'file_folders')
     order by table_name`,
  );
  console.log(ref, result.status, JSON.stringify(result.data));
}

const targetRef = process.argv[2];
if (targetRef) {
  const sql = readFileSync(
    join(process.cwd(), "supabase/migrations/002_create_internal_files.sql"),
    "utf8",
  );
  const result = await query(targetRef, sql);
  console.log("migration", targetRef, result.status, JSON.stringify(result.data).slice(0, 500));
}
