/**
 * Replace OnwardAir Client Directory with 3 appropriate demo accounts.
 * Deletes existing internal_clients for the onwardair workspace, then inserts:
 *   - Gulf Defense Logistics
 *   - MediReach Aerial Network
 *   - Coastal Freight Partners
 *
 *   node scripts/seed-onwardair-clients.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
  : fs.existsSync(path.join(root, ".env.unit311central.prod"))
    ? fs.readFileSync(path.join(root, ".env.unit311central.prod"), "utf8")
    : "";

function env(k) {
  const m = envText.match(new RegExp(`^${k}=(.*)$`, "m"));
  if (!m) return process.env[k] || "";
  return m[1].trim().replace(/^["']|["']$/g, "");
}

const SUPABASE_URL = env("SUPABASE_URL") || env("NEXT_PUBLIC_SUPABASE_URL");
const SERVICE_KEY = env("SUPABASE_SERVICE_ROLE_KEY");
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const SLUG = "onwardair";
const WS_ID = "3b479f90-d063-421b-ae93-542a508129f5";

function loungeToken(companyName) {
  const slug = companyName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 24);
  return `${slug}-${randomBytes(12).toString("base64url")}`;
}

const CLIENTS = [
  {
    id: "oa-cli-gulf-defense",
    company_name: "Gulf Defense Logistics",
    industry: "Government & Public",
    primary_contact: "Colonel Marcus Hale",
    primary_contact_first_name: "Marcus",
    primary_contact_surname: "Hale",
    email: "m.hale@gulfdefenselogistics.example",
    phone: "+1 703 555 0142",
    region: "United States",
    company_country: "United States",
    company_city: "Arlington",
    company_address: "2100 Crystal Drive, Arlington, VA 22202, USA",
    billing_address: "2100 Crystal Drive, Arlington, VA 22202, USA",
    account_status: "Active",
    contract_type: "Framework Agreement",
    tax_id: "US-82-4471903",
    active_projects: 2,
    notes:
      "Evaluating Vertex VTOL for tactical middle-mile resupply. FLEX Pod interest for contested logistics and island sustainment trials.",
  },
  {
    id: "oa-cli-medireach",
    company_name: "MediReach Aerial Network",
    industry: "Other",
    primary_contact: "Dr. Priya Nair",
    primary_contact_first_name: "Priya",
    primary_contact_surname: "Nair",
    email: "priya.nair@medireach.example",
    phone: "+1 214 555 0198",
    region: "United States",
    company_country: "United States",
    company_city: "Dallas",
    company_address: "5000 Legacy Drive, Plano, TX 75024, USA",
    billing_address: "5000 Legacy Drive, Plano, TX 75024, USA",
    account_status: "Active",
    contract_type: "Project-based",
    tax_id: "US-47-9912044",
    active_projects: 1,
    notes:
      "Regional hospital network exploring medical FLEX Pod missions — organ transport, blood products, and emergency pharmacy resupply.",
  },
  {
    id: "oa-cli-coastal-freight",
    company_name: "Coastal Freight Partners",
    industry: "Logistics & Ports",
    primary_contact: "Elena Vargas",
    primary_contact_first_name: "Elena",
    primary_contact_surname: "Vargas",
    email: "demo@coastalfreightpartners.com",
    phone: "+1 713 555 0176",
    region: "United States",
    company_country: "United States",
    company_city: "Houston",
    company_address: "1200 Port of Houston Blvd, Houston, TX 77029, USA",
    billing_address: "1200 Port of Houston Blvd, Houston, TX 77029, USA",
    account_status: "Active",
    contract_type: "Trial",
    tax_id: "US-26-5588120",
    active_projects: 2,
    notes:
      "Gulf Coast middle-mile cargo operator. Pilot corridor Houston–Galveston–Corpus Christi for Vertex multi-mission utilization. Client portal: https://onwardair.unit311central.com/coastalfreightpartners.com",
  },
];

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw wsErr;
  const workspaceId = ws?.id || WS_ID;
  if (!ws) console.warn("Workspace slug lookup missed; using known OnwardAir id:", workspaceId);
  else console.log("Workspace:", ws);

  const { data: existing, error: listErr } = await admin
    .from("internal_clients")
    .select("id, company_name")
    .eq("workspace_id", workspaceId);
  if (listErr) throw listErr;
  console.log("Existing clients:", existing?.length ?? 0, existing);

  const { error: delErr } = await admin
    .from("internal_clients")
    .delete()
    .eq("workspace_id", workspaceId);
  if (delErr) throw delErr;
  console.log("Deleted existing OnwardAir clients.");

  const rows = CLIENTS.map((c) => ({
    ...c,
    workspace_id: workspaceId,
    billing_same_as_company: true,
    job_title: "",
    company_postcode: "",
    invoice_email: c.email,
    support_lounge_token: loungeToken(c.company_name),
    support_lounge_enabled: true,
  }));

  const { data: inserted, error: insErr } = await admin
    .from("internal_clients")
    .insert(rows)
    .select("id, company_name, support_lounge_token, account_status");
  if (insErr) throw insErr;

  console.log("Inserted:", inserted);
  console.log("Done. Support Lounge URLs will use https://onwardair.unit311central.com/s/{token}");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
