/**
 * Ensure EVERY Demo workspace client has a unique Support Lounge URL.
 * Safe to re-run. Does not rotate existing tokens.
 *
 * Usage: node scripts/ensure-all-demo-lounge-urls.mjs
 */
import { createClient } from "@supabase/supabase-js";
import { randomBytes } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(resolve(process.cwd(), ".env.local.vercel"));
loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const DEMO_SITE = (process.env.DEMO_SITE_URL || "https://demo.unit311central.com").replace(
  /\/$/,
  "",
);
const supabase = createClient(url, key, { auth: { persistSession: false } });

function createLoungeToken() {
  return randomBytes(18).toString("base64url");
}

const { data: demoWs, error: wsError } = await supabase
  .from("workspaces")
  .select("id,slug")
  .eq("slug", "demo")
  .maybeSingle();

if (wsError) throw wsError;
if (!demoWs?.id) {
  console.error("Demo workspace not found");
  process.exit(1);
}

const { data: clients, error: listError } = await supabase
  .from("internal_clients")
  .select("id,company_name,support_lounge_token")
  .eq("workspace_id", demoWs.id)
  .order("company_name", { ascending: true });

if (listError) throw listError;

const rows = clients || [];
const results = [];
let created = 0;
let kept = 0;

for (const client of rows) {
  let token = (client.support_lounge_token || "").trim();
  if (!token) {
    token = createLoungeToken();
    // Prefer readable prefix for well-known demo clients when first minting.
    const slug = String(client.company_name || "client")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 24);
    if (slug) token = `${slug}-${token}`;

    const { error: updateError } = await supabase
      .from("internal_clients")
      .update({
        support_lounge_token: token,
        support_lounge_enabled: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", client.id)
      .eq("workspace_id", demoWs.id);
    if (updateError) throw updateError;
    created += 1;
  } else {
    kept += 1;
    await supabase
      .from("internal_clients")
      .update({ support_lounge_enabled: true })
      .eq("id", client.id)
      .eq("workspace_id", demoWs.id)
      .then(() => undefined);
  }

  results.push({
    id: client.id,
    companyName: client.company_name,
    url: `${DEMO_SITE}/s/${encodeURIComponent(token)}`,
    created: !(client.support_lounge_token || "").trim(),
  });
}

console.log(
  JSON.stringify(
    {
      workspace: demoWs.slug,
      total: results.length,
      created,
      kept,
      clients: results,
    },
    null,
    2,
  ),
);
