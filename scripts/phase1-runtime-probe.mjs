import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

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

const env = loadEnv(".env.corporatecentre.runtime");
const url = env.SUPABASE_URL;
const anon = env.SUPABASE_ANON_KEY ?? env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anon || !service) {
  console.error("Missing Supabase REST credentials in .env.corporatecentre.runtime");
  process.exit(2);
}

process.env.SUPABASE_URL = url;
process.env.SUPABASE_ANON_KEY = anon;
process.env.SUPABASE_SERVICE_ROLE_KEY = service;

const slugs = ["unit311", "demo", "onwardair", "talantonimpact", "abhi"];
const serviceClient = createClient(url, service, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const anonClient = createClient(url, anon);

const { data: workspaces, error } = await serviceClient
  .from("workspaces")
  .select("id, slug")
  .in("slug", slugs);
if (error) throw error;

console.log("Connected:", new URL(url).host);
console.log("Workspaces:", workspaces?.map((w) => w.slug).join(", "));

const tables = [
  "financial_expenses",
  "crm_leads",
  "internal_projects",
  "hr_employees",
  "file_objects",
  "software_provider_connections",
  "platform_users",
  "partners",
];

console.log("\nCross-workspace anon read probe (pre-migration = may LEAK):");
for (const a of workspaces ?? []) {
  for (const b of workspaces ?? []) {
    if (a.id === b.id) continue;
    for (const table of tables) {
      const { data, error: readError } = await anonClient
        .from(table)
        .select("id")
        .eq("workspace_id", b.id)
        .limit(3);
      const status = readError
        ? "blocked"
        : (data?.length ?? 0) === 0
          ? "empty"
          : `LEAK(${data.length})`;
      if (status !== "empty") {
        console.log(`${a.slug} -> ${b.slug} ${table}: ${status}`);
      }
    }
  }
}

console.log("\nSame-workspace service-role reads:");
for (const ws of workspaces ?? []) {
  for (const table of tables.slice(0, 4)) {
    const { error: svcError } = await serviceClient
      .from(table)
      .select("id")
      .eq("workspace_id", ws.id)
      .limit(1);
    console.log(`  ${ws.slug}/${table}: ${svcError ? "error" : "ok"}`);
  }
}
