import { readFileSync } from "node:fs";
import { join } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "luvqotlljbfmnfwhoypz";

if (!token) {
  console.error("Missing SUPABASE_ACCESS_TOKEN");
  process.exit(1);
}

const migrations = [
  { table: "competitors", path: "supabase/migrations/007_create_competitors.sql" },
  { table: "internal_whiteboard", path: "supabase/migrations/008_create_internal_whiteboard.sql" },
];

const alterMigrations = [
  "supabase/migrations/009_add_competitors_notes.sql",
  "supabase/migrations/010_create_whiteboard_projects.sql",
  "supabase/migrations/011_seed_uk_competitors.sql",
  "supabase/migrations/012_competitors_drone_tech_spain_portugal.sql",
  "supabase/migrations/013_messaging_channels_calls.sql",
];

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

async function tableExists(tableName) {
  const result = await query(
    `select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = '${tableName}'
    ) as exists`,
  );
  return result.status === 201 && result.data?.[0]?.exists === true;
}

for (const migration of migrations) {
  if (await tableExists(migration.table)) {
    console.log(`Already exists: ${migration.table}`);
    continue;
  }

  const sql = readFileSync(join(process.cwd(), migration.path), "utf8");
  const result = await query(sql);
  console.log(migration.path, result.status, JSON.stringify(result.data).slice(0, 300));
}

for (const migrationPath of alterMigrations) {
  const sql = readFileSync(join(process.cwd(), migrationPath), "utf8");
  const result = await query(sql);
  console.log(migrationPath, result.status, JSON.stringify(result.data).slice(0, 300));
}

const check = await query(
  `select table_name
   from information_schema.tables
   where table_schema = 'public'
     and table_name in ('competitors', 'internal_whiteboard', 'whiteboard_projects')
   order by table_name`,
);

console.log("tables", check.status, JSON.stringify(check.data));

await query(`notify pgrst, 'reload schema'`);
console.log("schema reload notified");
