import { readFileSync } from "node:fs";
import { join } from "node:path";

const token = process.env.SUPABASE_ACCESS_TOKEN;
const projectRef = process.env.SUPABASE_PROJECT_REF ?? "kkxtvzxqmbacjatkiupq";

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

const migrations = [
  "supabase/migrations/012_competitors_drone_tech_spain_portugal.sql",
  "supabase/migrations/025_competitors_africa_regions.sql",
];

for (const path of migrations) {
  const sql = readFileSync(join(process.cwd(), path), "utf8");
  const result = await query(sql);
  console.log("seed", path, result.status, JSON.stringify(result.data).slice(0, 400));
}

for (const region of ["uk", "spain", "portugal", "kenya", "namibia", "southafrica", "congo"]) {
  const count = await query(
    `select count(*)::int as count from public.competitors where region = '${region}'`,
  );
  console.log(`${region}_count`, count.status, JSON.stringify(count.data));
}

await query(`notify pgrst, 'reload schema'`);
