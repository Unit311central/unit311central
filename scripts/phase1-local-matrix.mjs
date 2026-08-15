import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const anonKey = process.env.SUPABASE_ANON_KEY;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !anonKey || !serviceKey) {
  console.error("Set SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(2);
}

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

const MARKETING_TABLES = [
  "marketing_contacts",
  "marketing_campaigns",
  "marketing_newsletters",
];

const anon = createClient(url, anonKey);
const service = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data: workspaces, error } = await service
  .from("workspaces")
  .select("id, slug")
  .in("slug", ["unit311", "demo", "onwardair", "talantonimpact", "abhi"]);
if (error) throw error;

const bySlug = Object.fromEntries((workspaces ?? []).map((w) => [w.slug, w]));

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
  const { error: svcError } = await service
    .from(table)
    .select("id")
    .eq("workspace_id", workspace.id)
    .limit(1);
  return svcError ? `error:${svcError.message}` : "ok";
}

console.log("Phase 1 local cross-workspace matrix\n");
console.log("| A | B | Table | Read | Write | Delete |");
console.log("|---|---|---|---|---|---|");

let leaks = 0;
for (const [aSlug, bSlug] of PAIRS) {
  const a = bySlug[aSlug];
  const b = bySlug[bSlug];
  if (!a || !b) {
    console.log(`MISSING workspace pair ${aSlug} -> ${bSlug}`);
    continue;
  }
  for (const table of TABLES) {
    const r = await probeAnon(table, b);
    console.log(`| ${aSlug} | ${bSlug} | ${table} | ${r.read} | ${r.write} | ${r.delete} |`);
    if (r.read === "LEAK" || r.write === "LEAK" || r.delete === "LEAK") leaks += 1;
  }
}

console.log("\nSame-workspace service-role reads:");
for (const slug of ["unit311", "demo", "onwardair", "talantonimpact", "abhi"]) {
  const ws = bySlug[slug];
  if (!ws) continue;
  for (const table of TABLES) {
    const status = await probeService(table, ws);
    console.log(`  ${slug} / ${table}: ${status}`);
  }
}

console.log("\nMarketing 141 deny-all probe:");
for (const table of MARKETING_TABLES) {
  const anonRead = await anon.from(table).select("id").limit(1);
  const serviceRead = await service.from(table).select("id").limit(1);
  console.log(
    table,
    "anon:",
    anonRead.error ? `blocked (${anonRead.error.code})` : `rows=${anonRead.data?.length ?? 0}`,
    "| service:",
    serviceRead.error ? `error (${serviceRead.error.message})` : `rows=${serviceRead.data?.length ?? 0}`,
  );
}

console.log(`\nLeaks: ${leaks}`);
process.exit(leaks > 0 ? 1 : 0);
