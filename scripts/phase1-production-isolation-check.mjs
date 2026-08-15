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

const prod = loadEnv(".env.corporatecentre.runtime");
const staging = loadEnv(".env.staging-validation.tmp");

const prodClient = createClient(prod.SUPABASE_URL, prod.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log("Production isolation check");
console.log("Production host:", new URL(prod.SUPABASE_URL).host);
console.log("Staging host:", new URL(staging.SUPABASE_URL).host);

const { data: prodWs } = await prodClient.from("workspaces").select("slug").eq("slug", "unit311").limit(1);
console.log("Production unit311 reachable:", (prodWs?.length ?? 0) === 1 ? "yes" : "no");

// Staging-only marker: inventory view from migration 147
const stagingClient = createClient(staging.SUPABASE_URL, staging.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const inv = await stagingClient.from("workspace_id_column_inventory").select("table_name").limit(1);
console.log("Staging inventory view present:", inv.error ? `no (${inv.error.message})` : "yes");

// Production should NOT have inventory view until migrations applied
const prodInv = await prodClient.from("workspace_id_column_inventory").select("table_name").limit(1);
console.log(
  "Production inventory view present (should be no):",
  prodInv.error ? `no (${prodInv.error.code})` : "YES-UNEXPECTED",
);
