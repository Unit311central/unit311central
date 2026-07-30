/**
 * CorpCentre-only: replace Client Directory + Software & SaaS with Australian fixtures.
 * Does NOT touch Internal (unit311) or Demo workspaces.
 *
 * Usage: node scripts/seed-corpcentre-au-business.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createClient } from "@supabase/supabase-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtimeEnvPath = path.join(root, ".env.corporatecentre.runtime");
const envText = fs.existsSync(runtimeEnvPath)
  ? fs.readFileSync(runtimeEnvPath, "utf8")
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

const SLUG = "corpcentre";
const WORKSPACE_ID = "aa2f6f5f-bbf1-41bb-bda4-e2ead6c917da";

const AU_CLIENTS = [
  {
    company: "Harbourline Fibre Pty Ltd",
    industry: "Infrastructure",
    contact: "Sophie Nguyen",
    email: "sophie.nguyen@harbourline.example",
    phone: "+61 2 9012 4401",
    region: "Sydney, NSW",
    city: "Sydney",
    postcode: "2000",
    address: "120 Clarence Street, Sydney NSW 2000",
    contract: "Framework Agreement",
    projects: 3,
  },
  {
    company: "Outback Grid Solutions",
    industry: "Energy & Utilities",
    contact: "Marcus Blake",
    email: "m.blake@outbackgrid.example",
    phone: "+61 8 9221 1188",
    region: "Perth, WA",
    city: "Perth",
    postcode: "6000",
    address: "45 St Georges Terrace, Perth WA 6000",
    contract: "Project-based",
    projects: 2,
  },
  {
    company: "Yarra Digital Services",
    industry: "Other",
    contact: "Priya Raman",
    email: "priya.raman@yarradigital.example",
    phone: "+61 3 9650 2210",
    region: "Melbourne, VIC",
    city: "Melbourne",
    postcode: "3000",
    address: "222 Collins Street, Melbourne VIC 3000",
    contract: "Retainer",
    projects: 4,
  },
  {
    company: "Brisbane Port Logistics Co",
    industry: "Logistics & Ports",
    contact: "Tom Whitaker",
    email: "tom.whitaker@bplco.example",
    phone: "+61 7 3003 5520",
    region: "Brisbane, QLD",
    city: "Brisbane",
    postcode: "4000",
    address: "88 Eagle Street, Brisbane QLD 4000",
    contract: "Framework Agreement",
    projects: 2,
  },
  {
    company: "Adelaide Civic Works",
    industry: "Government & Public",
    contact: "Helen Carter",
    email: "helen.carter@adelaidecivic.example",
    phone: "+61 8 8212 3099",
    region: "Adelaide, SA",
    city: "Adelaide",
    postcode: "5000",
    address: "12 King William Street, Adelaide SA 5000",
    contract: "Project-based",
    projects: 1,
  },
  {
    company: "Blue Mountains Property Trust",
    industry: "Property & Heritage",
    contact: "James Okonkwo",
    email: "j.okonkwo@bmpt.example",
    phone: "+61 2 4757 8800",
    region: "Sydney, NSW",
    city: "Katoomba",
    postcode: "2780",
    address: "5 Parke Street, Katoomba NSW 2780",
    contract: "Retainer",
    projects: 1,
  },
  {
    company: "Hunter Valley Mining Partners",
    industry: "Mining & Resources",
    contact: "Claire Duggan",
    email: "claire.duggan@hvmp.example",
    phone: "+61 2 4932 1144",
    region: "Newcastle, NSW",
    city: "Newcastle",
    postcode: "2300",
    address: "30 Hunter Street, Newcastle NSW 2300",
    contract: "Framework Agreement",
    projects: 5,
  },
  {
    company: "Tasman Coastal Survey",
    industry: "Infrastructure",
    contact: "Ben McLeod",
    email: "ben.mcleod@tasmancoastal.example",
    phone: "+61 3 6234 7711",
    region: "Hobart, TAS",
    city: "Hobart",
    postcode: "7000",
    address: "19 Davey Street, Hobart TAS 7000",
    contract: "Project-based",
    projects: 2,
  },
  {
    company: "Canberra Secure Networks",
    industry: "Government & Public",
    contact: "Amelia Frost",
    email: "amelia.frost@csn.example",
    phone: "+61 2 6247 6601",
    region: "Canberra, ACT",
    city: "Canberra",
    postcode: "2601",
    address: "1 Constitution Avenue, Canberra ACT 2601",
    contract: "Retainer",
    projects: 3,
  },
  {
    company: "Gold Coast Build Group",
    industry: "Construction",
    contact: "Ryan Patel",
    email: "ryan.patel@gcbuild.example",
    phone: "+61 7 5538 2200",
    region: "Gold Coast, QLD",
    city: "Surfers Paradise",
    postcode: "4217",
    address: "50 Cavill Avenue, Surfers Paradise QLD 4217",
    contract: "Project-based",
    projects: 4,
  },
  {
    company: "Darwin Telecom Hub",
    industry: "Other",
    contact: "Lisa Ahmat",
    email: "lisa.ahmat@darwintelecom.example",
    phone: "+61 8 8981 3344",
    region: "Darwin, NT",
    city: "Darwin",
    postcode: "0800",
    address: "9 Smith Street, Darwin NT 0800",
    contract: "Trial",
    projects: 0,
  },
  {
    company: "Illawarra Steel Logistics",
    industry: "Logistics & Ports",
    contact: "Noah Greaves",
    email: "noah.greaves@illawarrasteel.example",
    phone: "+61 2 4228 9100",
    region: "Wollongong, NSW",
    city: "Wollongong",
    postcode: "2500",
    address: "70 Crown Street, Wollongong NSW 2500",
    contract: "Framework Agreement",
    projects: 2,
  },
  {
    company: "Barossa Energy Co-op",
    industry: "Energy & Utilities",
    contact: "Grace Muller",
    email: "grace.muller@barossaenergy.example",
    phone: "+61 8 8562 4410",
    region: "Adelaide, SA",
    city: "Tanunda",
    postcode: "5352",
    address: "18 Murray Street, Tanunda SA 5352",
    contract: "Retainer",
    projects: 1,
  },
  {
    company: "Sunshine Coast Civic Assets",
    industry: "Government & Public",
    contact: "Owen Fraser",
    email: "owen.fraser@sccassets.example",
    phone: "+61 7 5475 8800",
    region: "Sunshine Coast, QLD",
    city: "Maroochydore",
    postcode: "4558",
    address: "1 Ocean Street, Maroochydore QLD 4558",
    contract: "Project-based",
    projects: 2,
  },
  {
    company: "Fremantle Marine Services",
    industry: "Logistics & Ports",
    contact: "Kate O'Brien",
    email: "kate.obrien@fremantlemarine.example",
    phone: "+61 8 9335 2201",
    region: "Perth, WA",
    city: "Fremantle",
    postcode: "6160",
    address: "22 High Street, Fremantle WA 6160",
    contract: "Framework Agreement",
    projects: 3,
  },
  {
    company: "Parramatta Civic Tech",
    industry: "Other",
    contact: "Daniel Cho",
    email: "daniel.cho@parramattatech.example",
    phone: "+61 2 9635 4412",
    region: "Sydney, NSW",
    city: "Parramatta",
    postcode: "2150",
    address: "160 Church Street, Parramatta NSW 2150",
    contract: "Retainer",
    projects: 2,
  },
  {
    company: "Geelong Infrastructure Group",
    industry: "Infrastructure",
    contact: "Sarah Quinn",
    email: "sarah.quinn@geelonginfra.example",
    phone: "+61 3 5222 1180",
    region: "Geelong, VIC",
    city: "Geelong",
    postcode: "3220",
    address: "40 Malop Street, Geelong VIC 3220",
    contract: "Project-based",
    projects: 3,
  },
  {
    company: "Cairns Regional Estates",
    industry: "Property & Heritage",
    contact: "Mitch Andrews",
    email: "mitch.andrews@cairnsestates.example",
    phone: "+61 7 4051 9900",
    region: "Cairns, QLD",
    city: "Cairns",
    postcode: "4870",
    address: "65 Abbott Street, Cairns QLD 4870",
    contract: "Trial",
    projects: 0,
  },
  {
    company: "Broken Hill Resources NL",
    industry: "Mining & Resources",
    contact: "Ava Singh",
    email: "ava.singh@bhrnl.example",
    phone: "+61 8 8087 3311",
    region: "Broken Hill, NSW",
    city: "Broken Hill",
    postcode: "2880",
    address: "100 Argent Street, Broken Hill NSW 2880",
    contract: "Framework Agreement",
    projects: 4,
  },
  {
    company: "Alexandria Data Centres",
    industry: "Other",
    contact: "Luke Harding",
    email: "luke.harding@alexdc.example",
    phone: "+61 2 8399 1200",
    region: "Sydney, NSW",
    city: "Alexandria",
    postcode: "2015",
    address: "15 O'Riordan Street, Alexandria NSW 2015",
    contract: "Retainer",
    projects: 5,
  },
];

const SOFTWARE_ASSETS = [
  {
    name: "Microsoft 365 Business Premium",
    vendor: "Microsoft",
    purpose: "Email, Teams, and productivity suite",
    category: "Productivity",
    status: "Active",
    licences_purchased: 45,
    licences_allocated: 38,
    licence_type: "Per user",
    monthly_cost: 990,
    annual_cost: 11880,
    currency: "AUD",
    next_renewal_date: "2026-09-15",
    renewal_frequency: "Annually",
    business_owner: "Peter",
    technical_owner: "Daniel",
    department: "IT",
    supplier_company: "Microsoft Australia",
    cost_centre: "IT-OPS",
    budget_owner: "Peter",
  },
  {
    name: "Atlassian Cloud Premium",
    vendor: "Atlassian",
    purpose: "Jira and Confluence for delivery teams",
    category: "DevOps",
    status: "Active",
    licences_purchased: 30,
    licences_allocated: 24,
    licence_type: "Named",
    monthly_cost: 420,
    annual_cost: 5040,
    currency: "AUD",
    next_renewal_date: "2026-08-01",
    renewal_frequency: "Annually",
    business_owner: "Daniel",
    technical_owner: "John",
    department: "Engineering",
    supplier_company: "Atlassian Pty Ltd",
    cost_centre: "ENG",
    budget_owner: "Daniel",
  },
  {
    name: "Salesforce Sales Cloud",
    vendor: "Salesforce",
    purpose: "CRM for enterprise accounts",
    category: "CRM",
    status: "Active",
    licences_purchased: 18,
    licences_allocated: 15,
    licence_type: "Named",
    monthly_cost: 1620,
    annual_cost: 19440,
    currency: "AUD",
    next_renewal_date: "2026-11-30",
    renewal_frequency: "Annually",
    business_owner: "Peter",
    technical_owner: "Elias",
    department: "Sales",
    supplier_company: "Salesforce.com Australia",
    cost_centre: "SALES",
    budget_owner: "Peter",
  },
  {
    name: "AWS Business Support",
    vendor: "Amazon Web Services",
    purpose: "Cloud hosting and support for customer platforms",
    category: "Infrastructure",
    status: "Active",
    licences_purchased: 1,
    licences_allocated: 1,
    licence_type: "Unlimited",
    monthly_cost: 2100,
    annual_cost: 25200,
    currency: "AUD",
    next_renewal_date: "2026-07-31",
    renewal_frequency: "Monthly",
    business_owner: "Daniel",
    technical_owner: "Mick",
    department: "Platform",
    supplier_company: "Amazon Web Services Australia",
    cost_centre: "CLOUD",
    budget_owner: "Daniel",
  },
  {
    name: "Xero Organisations",
    vendor: "Xero",
    purpose: "Finance and bookkeeping",
    category: "Finance",
    status: "Active",
    licences_purchased: 5,
    licences_allocated: 4,
    licence_type: "Named",
    monthly_cost: 175,
    annual_cost: 2100,
    currency: "AUD",
    next_renewal_date: "2026-10-01",
    renewal_frequency: "Monthly",
    business_owner: "Peter",
    technical_owner: "Peter",
    department: "Finance",
    supplier_company: "Xero Australia Pty Ltd",
    cost_centre: "FIN",
    budget_owner: "Peter",
  },
  {
    name: "Zoom Workplace Pro",
    vendor: "Zoom",
    purpose: "Customer and board meetings",
    category: "Communications",
    status: "Trial",
    licences_purchased: 20,
    licences_allocated: 12,
    licence_type: "Named",
    monthly_cost: 320,
    annual_cost: 3840,
    currency: "AUD",
    next_renewal_date: "2026-08-20",
    renewal_frequency: "Annually",
    business_owner: "John",
    technical_owner: "Elias",
    department: "Operations",
    supplier_company: "Zoom Video Communications",
    cost_centre: "OPS",
    budget_owner: "John",
  },
];

function splitName(full) {
  const parts = String(full).trim().split(/\s+/);
  return {
    first: parts[0] || "",
    surname: parts.slice(1).join(" ") || "",
  };
}

async function main() {
  const { data: ws, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr || !ws) throw new Error(`corpcentre workspace: ${wsErr?.message || "missing"}`);
  if (ws.id !== WORKSPACE_ID) {
    throw new Error(`Unexpected corpcentre id ${ws.id} (expected ${WORKSPACE_ID})`);
  }

  const { count: beforeClients } = await admin
    .from("internal_clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WORKSPACE_ID);

  const { error: delClientsErr } = await admin
    .from("internal_clients")
    .delete()
    .eq("workspace_id", WORKSPACE_ID);
  if (delClientsErr) throw new Error(`delete clients: ${delClientsErr.message}`);

  const clientRows = AU_CLIENTS.map((c, index) => {
    const names = splitName(c.contact);
    const n = String(index + 1).padStart(3, "0");
    const abn = `51${String(100000000 + index * 137).slice(0, 9)}`;
    return {
      id: `corpcentre-au-${n}`,
      workspace_id: WORKSPACE_ID,
      company_name: c.company,
      industry: c.industry,
      primary_contact: c.contact,
      primary_contact_first_name: names.first,
      primary_contact_surname: names.surname,
      email: c.email,
      phone: c.phone,
      region: c.region,
      account_status: index % 9 === 0 ? "Onboarding" : index % 7 === 0 ? "Dormant" : "Active",
      contract_type: c.contract,
      tax_id: `ABN ${abn}`,
      billing_address: c.address,
      company_address: c.address,
      company_city: c.city,
      company_postcode: c.postcode,
      company_country: "Australia",
      billing_same_as_company: true,
      job_title: "Account Lead",
      invoice_email: c.email,
      active_projects: c.projects,
      notes: "CorpCentre Australian customer (seeded).",
      subscription_status: "active",
      billing_frequency: "monthly",
      platform_url: null,
    };
  });

  const { error: insClientsErr } = await admin.from("internal_clients").insert(clientRows);
  if (insClientsErr) throw new Error(`insert clients: ${insClientsErr.message}`);

  // Child tables cascade / restrict — delete credentials/files first if present.
  await admin.from("software_asset_credentials").delete().eq("workspace_id", WORKSPACE_ID);
  await admin.from("software_asset_files").delete().eq("workspace_id", WORKSPACE_ID);
  await admin.from("software_asset_audit_events").delete().eq("workspace_id", WORKSPACE_ID);
  const { error: delSoftErr } = await admin
    .from("software_assets")
    .delete()
    .eq("workspace_id", WORKSPACE_ID);
  if (delSoftErr) throw new Error(`delete software_assets: ${delSoftErr.message}`);

  const softRows = SOFTWARE_ASSETS.map((row) => ({
    ...row,
    workspace_id: WORKSPACE_ID,
    website_url: "",
    support_url: "",
    documentation_url: "",
    last_payment_amount: row.monthly_cost,
    last_payment_date: "2026-07-01",
    contract_length: "12 months",
    supplier_name: row.supplier_company,
    invoice_reference: `INV-AUD-${row.name.slice(0, 8).replace(/\s/g, "").toUpperCase()}`,
    financial_account_code: "5010",
    approver: "Peter",
    account_manager: "Sydney Account Team",
    support_email: "support@example.com.au",
    support_phone: "+61 2 9000 0000",
    customer_number: `AU-${Math.floor(100000 + Math.random() * 899999)}`,
    integration_connected: false,
    integration_api_key_set: false,
    integration_webhook_url: "",
    integration_oauth_status: "",
    integration_sync_status: "",
  }));

  const { error: insSoftErr } = await admin.from("software_assets").insert(softRows);
  if (insSoftErr) throw new Error(`insert software_assets: ${insSoftErr.message}`);

  const { count: afterClients } = await admin
    .from("internal_clients")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WORKSPACE_ID);
  const { count: afterSoft } = await admin
    .from("software_assets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", WORKSPACE_ID);

  // Safety: confirm Internal/Demo untouched
  const { data: others } = await admin
    .from("workspaces")
    .select("id, slug")
    .in("slug", ["unit311", "demo"]);
  for (const other of others || []) {
    const { count } = await admin
      .from("internal_clients")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", other.id);
    console.log(`safety ${other.slug} clients still: ${count}`);
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        clientsRemoved: beforeClients,
        clientsNow: afterClients,
        softwareAssets: afterSoft,
      },
      null,
      2,
    ),
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
