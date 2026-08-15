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

const env = loadEnv(".env.staging-validation.tmp");
const service = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const { data, error } = await service
  .from("workspaces")
  .select("slug, name, workspace_type, status")
  .order("slug");

if (error) throw error;
console.log("Staging URL host:", new URL(env.SUPABASE_URL).host);
console.log("Workspaces:", JSON.stringify(data, null, 2));

const required = ["unit311", "demo", "onwardair", "talantonimpact", "abhi"];
const slugs = new Set((data ?? []).map((w) => w.slug));
for (const slug of required) {
  console.log(slug, slugs.has(slug) ? "PRESENT" : "MISSING");
}
for (const row of data ?? []) {
  if (row.slug.includes("corp")) console.log("CORPCENTRE_PRESENT", row.slug);
}
