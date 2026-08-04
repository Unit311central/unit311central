/**
 * Update OnwardAir company_details to Houston registered address + support email.
 * Usage: node scripts/update-onwardair-company-details.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";
import { randomUUID } from "node:crypto";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

function loadEnvFile(filePath) {
  const out = {};
  try {
    for (const line of fs.readFileSync(filePath, "utf8").split(/\r?\n/)) {
      const t = line.trim();
      if (!t || t.startsWith("#")) continue;
      const i = t.indexOf("=");
      if (i < 0) continue;
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
        v = v.slice(1, -1);
      }
      if (v && !v.startsWith("[SENSITI")) out[k] = v;
    }
  } catch {
    /* optional */
  }
  return out;
}

const env = loadEnvFile(path.join(root, ".env.corporatecentre.runtime"));

const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
const key =
  env.SUPABASE_SERVICE_ROLE_KEY || env.SUPABASE_SERVICE_ROLE || env.SUPABASE_SECRET_KEY;

if (!url || !key) {
  console.error("Missing Supabase URL or service role key");
  process.exit(1);
}

const ADDRESS = "5207 Morningside Drive\nHouston, TX 77005\nUnited States";
const DESCRIPTION =
  "OnwardAir is developing the Vertex VTOL™ and modular FLEX Pods™ — a patented multi-mission aviation platform designed to maximize aircraft utilization, reduce cost per mile, and unlock new logistics and operational capabilities across middle-mile and specialty missions.";

const admin = createClient(url, key, { auth: { persistSession: false } });

const { data: ws, error: wsErr } = await admin
  .from("workspaces")
  .select("id, slug")
  .eq("slug", "onwardair")
  .maybeSingle();

if (wsErr || !ws) {
  console.error("OnwardAir workspace not found", wsErr);
  process.exit(1);
}

const payload = {
  legal_company_name: "OnwardAir",
  trading_name: "OnwardAir",
  registered_office_address: ADDRESS,
  principal_business_address: ADDRESS,
  country_of_registration: "United States",
  website: "https://onwardair.tech",
  primary_email: "support@onwardair.tech",
  general_company_description: DESCRIPTION,
  company_status: "Active",
  updated_at: new Date().toISOString(),
};

const { data: existing } = await admin
  .from("company_details")
  .select("id")
  .eq("workspace_id", ws.id)
  .maybeSingle();

const result = existing?.id
  ? await admin.from("company_details").update(payload).eq("id", existing.id).select("*").single()
  : await admin
      .from("company_details")
      .insert({ ...payload, workspace_id: ws.id, id: randomUUID() })
      .select("*")
      .single();

if (result.error) {
  console.error(result.error);
  process.exit(1);
}

console.log("Updated OnwardAir company_details:", {
  id: result.data.id,
  email: result.data.primary_email,
  country: result.data.country_of_registration,
  address: result.data.registered_office_address,
});
