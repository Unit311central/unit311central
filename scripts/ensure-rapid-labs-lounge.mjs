/**
 * Ensure Rapid Labs Inc exists in Demo workspace with a stable Support Lounge token.
 * Safe to re-run. Does not wipe other demo data.
 *
 * Usage: node scripts/ensure-rapid-labs-lounge.mjs
 */
import { createClient } from "@supabase/supabase-js";
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

loadEnvFile(resolve(process.cwd(), ".env.local"));
loadEnvFile(resolve(process.cwd(), ".env"));

const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const key =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error("Missing SUPABASE_URL / service role or anon key.");
  process.exit(1);
}

const supabase = createClient(url, key, { auth: { persistSession: false } });
const LOUNGE_TOKEN = "demo-rapid-labs-lounge";
const CLIENT_ID = "dme-cli-001";

const { data: demoWs, error: wsError } = await supabase
  .from("workspaces")
  .select("id,slug")
  .eq("slug", "demo")
  .maybeSingle();

if (wsError) throw wsError;
if (!demoWs?.id) {
  console.error("Demo workspace not found (slug=demo).");
  process.exit(1);
}

const { data: existing } = await supabase
  .from("internal_clients")
  .select("id,company_name,support_lounge_token")
  .eq("workspace_id", demoWs.id)
  .or(`id.eq.${CLIENT_ID},company_name.eq.Rapid Labs Inc,support_lounge_token.eq.${LOUNGE_TOKEN}`)
  .limit(5);

const hit = existing?.[0];
if (hit) {
  const { error } = await supabase
    .from("internal_clients")
    .update({
      company_name: "Rapid Labs Inc",
      support_lounge_token: LOUNGE_TOKEN,
      support_lounge_enabled: true,
      account_status: "Active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", hit.id)
    .eq("workspace_id", demoWs.id);
  if (error) throw error;
  console.log(`Updated ${hit.id} → Rapid Labs Inc`);
} else {
  const { error } = await supabase.from("internal_clients").insert({
    id: CLIENT_ID,
    workspace_id: demoWs.id,
    company_name: "Rapid Labs Inc",
    industry: "Enterprise Technology",
    primary_contact: "Alex Chen",
    email: "alex.chen@rapidlabs.example",
    phone: "+1 555 1000001",
    region: "United Kingdom",
    account_status: "Active",
    contract_type: "Retainer",
    tax_id: "TAX-DME-1",
    billing_address: "10 Commerce Street",
    active_projects: 0,
    notes: "[demo-enterprise] Flagship Support Lounge demo client.",
    support_lounge_token: LOUNGE_TOKEN,
    support_lounge_enabled: true,
  });
  if (error) throw error;
  console.log(`Created ${CLIENT_ID} Rapid Labs Inc`);
}

console.log(`Lounge URL: https://demo.unit311central.com/s/${LOUNGE_TOKEN}`);
