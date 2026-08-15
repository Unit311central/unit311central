import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

const SLUGS = ["unit311", "demo", "onwardair", "talantonimpact", "abhi"];
const PAIRS = [
  ["unit311", "demo"],
  ["demo", "unit311"],
  ["demo", "onwardair"],
  ["onwardair", "demo"],
  ["onwardair", "talantonimpact"],
  ["talantonimpact", "onwardair"],
  ["talantonimpact", "abhi"],
  ["abhi", "talantonimpact"],
];

const TABLES = [
  "financial_expenses",
  "crm_leads",
  "internal_projects",
  "hr_employees",
  "file_objects",
  "software_provider_connections",
  "platform_users",
  "partners",
];

const anon = createClient(url, anonKey);
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: workspaces, error } = await service.from("workspaces").select("id, slug").in("slug", SLUGS);
if (error) throw error;

const bySlug = Object.fromEntries((workspaces ?? []).map((w) => [w.slug, w]));
console.log("Staging host:", new URL(url).host);
console.log("Workspaces loaded:", (workspaces ?? []).map((w) => w.slug).join(", "));

async function probeAnon(table, workspaceB) {
  const read = await anon.from(table).select("id").eq("workspace_id", workspaceB.id).limit(5);
  const readStatus = read.error ? "blocked" : (read.data?.length ?? 0) === 0 ? "empty" : "LEAK";

  const write = await anon
    .from(table)
    .update({ updated_at: new Date().toISOString() })
    .eq("workspace_id", workspaceB.id)
    .select("id")
    .limit(1);
  const writeStatus = write.error ? "blocked" : (write.data?.length ?? 0) === 0 ? "no-op" : "LEAK";

  const del = await anon.from(table).delete().eq("workspace_id", workspaceB.id).select("id").limit(1);
  const deleteStatus = del.error ? "blocked" : (del.data?.length ?? 0) === 0 ? "no-op" : "LEAK";

  return { read: readStatus, write: writeStatus, delete: deleteStatus };
}

async function probeService(table, workspace) {
  const { data, error: svcError } = await service
    .from(table)
    .select("id")
    .eq("workspace_id", workspace.id)
    .limit(1);
  if (svcError) return `error:${svcError.message}`;
  return `ok(rows=${data?.length ?? 0})`;
}

console.log("\n| A | B | Table | Read | Write | Delete |");
console.log("|---|---|---|---|---|---|");

let leaks = 0;
for (const [aSlug, bSlug] of PAIRS) {
  const a = bySlug[aSlug];
  const b = bySlug[bSlug];
  if (!a || !b) {
    console.log(`MISSING ${aSlug} -> ${bSlug}`);
    leaks += 1;
    continue;
  }
  for (const table of TABLES) {
    const r = await probeAnon(table, b);
    console.log(`| ${aSlug} | ${bSlug} | ${table} | ${r.read} | ${r.write} | ${r.delete} |`);
    if (r.read === "LEAK" || r.write === "LEAK" || r.delete === "LEAK") leaks += 1;
  }
}

console.log("\nSame-workspace service-role reads:");
for (const slug of SLUGS) {
  const ws = bySlug[slug];
  if (!ws) {
    console.log(`  MISSING ${slug}`);
    leaks += 1;
    continue;
  }
  for (const table of TABLES) {
    console.log(`  ${slug} / ${table}: ${await probeService(table, ws)}`);
  }
}

console.log(`\nMatrix leaks: ${leaks}`);
process.exit(leaks > 0 ? 1 : 0);
