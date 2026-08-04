/**
 * OnwardAir-only Technology Management software assets seed (USD).
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact, abhi.
 *
 *   node scripts/seed-onwardair-software-assets.mjs
 */
import fs from "node:fs";
import path from "node:path";
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
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
  "abhi",
]);

function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildAssets(fteCount) {
  const seats = Math.max(fteCount, 12);
  const m365PerUserMonthly = 36.0;
  const m365Monthly = round2(seats * m365PerUserMonthly);
  const m365Annual = round2(m365Monthly * 12);

  return [
    {
      name: "Microsoft 365 Business Premium",
      vendor: "Microsoft",
      purpose: "Email, Teams, SharePoint, and productivity suite for Houston staff",
      category: "Productivity",
      website_url: "https://www.microsoft.com/microsoft-365",
      status: "Active",
      licences_purchased: seats,
      licences_allocated: seats,
      licence_type: "Per user",
      monthly_cost: m365Monthly,
      annual_cost: m365Annual,
      next_renewal_date: "2026-10-01",
      renewal_frequency: "Annually",
      business_owner: "Monte Mann",
      technical_owner: "Justin Dodrill",
      department: "Technology",
      supplier_company: "Microsoft Corporation",
      cost_centre: "IT-OPS",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "SolidWorks Premium",
      vendor: "Dassault Systèmes",
      purpose: "CAD for FLEX Pod airframe and mechanical design (5 seats)",
      category: "Engineering",
      website_url: "https://www.solidworks.com",
      status: "Active",
      licences_purchased: 5,
      licences_allocated: 5,
      licence_type: "Named",
      monthly_cost: round2(18500 / 12),
      annual_cost: 18500,
      next_renewal_date: "2026-09-15",
      renewal_frequency: "Annually",
      business_owner: "Mike Teeter",
      technical_owner: "David Colling",
      department: "Engineering",
      supplier_company: "Dassault Systèmes SolidWorks Corp",
      cost_centre: "ENG",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "MATLAB + Simulink",
      vendor: "MathWorks",
      purpose: "Flight controls / GNC modelling (3 seats)",
      category: "Engineering",
      website_url: "https://www.mathworks.com",
      status: "Active",
      licences_purchased: 3,
      licences_allocated: 3,
      licence_type: "Named",
      monthly_cost: round2(9600 / 12),
      annual_cost: 9600,
      next_renewal_date: "2026-12-01",
      renewal_frequency: "Annually",
      business_owner: "Keven Coates",
      technical_owner: "Justin Dodrill",
      department: "Engineering",
      supplier_company: "The MathWorks Inc.",
      cost_centre: "ENG",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "Slack Business+",
      vendor: "Salesforce",
      purpose: "Team messaging for Houston HQ, lab, and remote partners",
      category: "Collaboration",
      website_url: "https://slack.com",
      status: "Active",
      licences_purchased: seats,
      licences_allocated: seats,
      licence_type: "Per user",
      monthly_cost: round2(seats * 12.5),
      annual_cost: round2(seats * 12.5 * 12),
      next_renewal_date: "2027-01-15",
      renewal_frequency: "Annually",
      business_owner: "Carolyn Scott",
      technical_owner: "Justin Dodrill",
      department: "Operations",
      supplier_company: "Salesforce Inc.",
      cost_centre: "OPS",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "GitHub Team",
      vendor: "GitHub",
      purpose: "Source control for flight software and tooling repos",
      category: "Development",
      website_url: "https://github.com",
      status: "Active",
      licences_purchased: 8,
      licences_allocated: 6,
      licence_type: "Named",
      monthly_cost: 32,
      annual_cost: 384,
      next_renewal_date: "2026-11-01",
      renewal_frequency: "Monthly",
      business_owner: "Justin Dodrill",
      technical_owner: "Justin Dodrill",
      department: "Engineering",
      supplier_company: "GitHub Inc.",
      cost_centre: "ENG",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "AWS Organization",
      vendor: "Amazon Web Services",
      purpose: "Cloud compute for telemetry pipelines and CI",
      category: "Infrastructure",
      website_url: "https://aws.amazon.com",
      status: "Active",
      licences_purchased: 1,
      licences_allocated: 1,
      licence_type: "Unlimited",
      monthly_cost: 420,
      annual_cost: 5040,
      next_renewal_date: "2026-08-31",
      renewal_frequency: "Monthly",
      business_owner: "Justin Dodrill",
      technical_owner: "Anuj Kumar",
      department: "Technology",
      supplier_company: "Amazon Web Services Inc.",
      cost_centre: "IT-OPS",
      budget_owner: "Monte Mann",
    },
    {
      name: "QuickBooks Online Plus",
      vendor: "Intuit",
      purpose: "US accounting, AP/AR, and payroll feeds",
      category: "Finance",
      website_url: "https://quickbooks.intuit.com",
      status: "Active",
      licences_purchased: 4,
      licences_allocated: 3,
      licence_type: "Named",
      monthly_cost: 90,
      annual_cost: 1080,
      next_renewal_date: "2026-09-01",
      renewal_frequency: "Monthly",
      business_owner: "Monte Mann",
      technical_owner: "Monte Mann",
      department: "Finance",
      supplier_company: "Intuit Inc.",
      cost_centre: "FIN",
      budget_owner: "Monte Mann",
    },
    {
      name: "Expensify",
      vendor: "Expensify",
      purpose: "Staff T&E and Houston travel reimbursements",
      category: "Finance",
      website_url: "https://www.expensify.com",
      status: "Active",
      licences_purchased: seats,
      licences_allocated: Math.max(seats - 1, 1),
      licence_type: "Per user",
      monthly_cost: round2(seats * 5),
      annual_cost: round2(seats * 5 * 12),
      next_renewal_date: "2026-12-01",
      renewal_frequency: "Annually",
      business_owner: "Monte Mann",
      technical_owner: "Justin Dodrill",
      department: "Finance",
      supplier_company: "Expensify Inc.",
      cost_centre: "FIN",
      budget_owner: "Monte Mann",
    },
    {
      name: "DocuSign eSignature",
      vendor: "DocuSign",
      purpose: "Supplier MSAs, NDAs, and board pack signatures",
      category: "Operations",
      website_url: "https://www.docusign.com",
      status: "Active",
      licences_purchased: 6,
      licences_allocated: 5,
      licence_type: "Named",
      monthly_cost: 180,
      annual_cost: 2160,
      next_renewal_date: "2026-11-20",
      renewal_frequency: "Annually",
      business_owner: "Brian Whiteside",
      technical_owner: "Monte Mann",
      department: "Leadership",
      supplier_company: "DocuSign Inc.",
      cost_centre: "OPS",
      budget_owner: "Brian Whiteside",
    },
    {
      name: "Domain — onwardair.tech",
      vendor: "GoDaddy / Cloudflare",
      purpose: "Primary domain, DNS, and email authentication for OnwardAir",
      category: "Infrastructure",
      website_url: "https://onwardair.tech",
      status: "Active",
      licences_purchased: 1,
      licences_allocated: 1,
      licence_type: "Unlimited",
      monthly_cost: 8,
      annual_cost: 96,
      next_renewal_date: "2027-03-01",
      renewal_frequency: "Annually",
      business_owner: "Carolyn Scott",
      technical_owner: "Justin Dodrill",
      department: "Marketing",
      supplier_company: "GoDaddy LLC",
      cost_centre: "MKT",
      budget_owner: "Carolyn Scott",
    },
  ];
}

async function main() {
  const { data: workspace, error: wsErr } = await admin
    .from("workspaces")
    .select("id, slug, name")
    .eq("slug", SLUG)
    .maybeSingle();
  if (wsErr) throw new Error(wsErr.message);
  if (!workspace?.id) throw new Error(`Workspace not found: ${SLUG}`);
  if (FORBIDDEN.has(String(workspace.slug).toLowerCase())) {
    throw new Error(`Refusing to seed forbidden workspace: ${workspace.slug}`);
  }

  const { count: fteCount, error: empErr } = await admin
    .from("hr_employees")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id)
    .eq("employment_status", "active")
    .eq("employment_type", "full_time");
  if (empErr) throw new Error(`hr_employees count: ${empErr.message}`);

  const seats = fteCount ?? 12;
  console.log(`OnwardAir workspace ${workspace.id} — active full-time employees: ${seats}`);

  await admin.from("software_asset_credentials").delete().eq("workspace_id", workspace.id);
  await admin.from("software_asset_files").delete().eq("workspace_id", workspace.id);
  await admin.from("software_asset_audit_events").delete().eq("workspace_id", workspace.id);
  const { error: delErr } = await admin
    .from("software_assets")
    .delete()
    .eq("workspace_id", workspace.id);
  if (delErr) throw new Error(`delete software_assets: ${delErr.message}`);

  const assets = buildAssets(seats);
  const rows = assets.map((row, index) => ({
    ...row,
    workspace_id: workspace.id,
    support_url: "",
    documentation_url: "",
    currency: "USD",
    last_payment_amount: row.monthly_cost,
    last_payment_date: "2026-07-01",
    contract_length: "12 months",
    supplier_name: row.supplier_company,
    invoice_reference: `OA-SW-${String(index + 1).padStart(3, "0")}`,
    financial_account_code: "5010",
    approver: "Brian Whiteside",
    account_manager: "US Account Team",
    support_email: "support@vendor.example",
    support_phone: "+1 800 555 0100",
    customer_number: `OA-${String(1000 + index)}`,
    integration_connected: false,
    integration_api_key_set: false,
    integration_webhook_url: "",
    integration_oauth_status: "",
    integration_sync_status: "",
  }));

  const { error: insErr } = await admin.from("software_assets").insert(rows);
  if (insErr) throw new Error(`insert software_assets: ${insErr.message}`);

  const { count: after } = await admin
    .from("software_assets")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspace.id);

  const annualSpend = rows.reduce((sum, row) => sum + Number(row.annual_cost || 0), 0);

  const { data: others } = await admin
    .from("workspaces")
    .select("id, slug")
    .in("slug", ["unit311", "demo", "corpcentre", "abhi", "talantonimpact"]);
  const safety = {};
  for (const other of others || []) {
    const { count } = await admin
      .from("software_assets")
      .select("id", { count: "exact", head: true })
      .eq("workspace_id", other.id);
    safety[other.slug] = count;
  }

  console.log(
    JSON.stringify(
      {
        ok: true,
        workspace: SLUG,
        fullTimeEmployees: seats,
        softwareAssets: after,
        annualSpendUsd: round2(annualSpend),
        products: rows.map((r) => r.name),
        otherWorkspacesUntouched: safety,
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
