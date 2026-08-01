/**
 * ABHI-only Technology Management software assets seed.
 *
 * Seeds MS 365 (one seat per full-time employee), domain hosting, CMS,
 * HR, CRM, Xero, expense management, and related SaaS.
 *
 * Hard-refuses: demo, unit311, corpcentre, corporatecentre, internal, talantonimpact.
 *
 *   node scripts/seed-abhi-software-assets.mjs
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

const SLUG = "abhi";
const FORBIDDEN = new Set([
  "demo",
  "unit311",
  "corpcentre",
  "corporatecentre",
  "internal",
  "talantonimpact",
]);

function round2(n) {
  return Math.round(n * 100) / 100;
}

function buildAssets(fteCount) {
  const seats = Math.max(fteCount, 1);
  const m365PerUserMonthly = 36.0; // ~Business Premium GBP
  const m365Monthly = round2(seats * m365PerUserMonthly);
  const m365Annual = round2(m365Monthly * 12);

  return [
    {
      name: "Microsoft 365 Business Premium",
      vendor: "Microsoft",
      purpose: "Email, Teams, SharePoint, and productivity suite for all full-time staff",
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
      business_owner: "Sarah Chen",
      technical_owner: "Richard Phillips",
      department: "IT",
      supplier_company: "Microsoft Ltd",
      cost_centre: "IT-OPS",
      budget_owner: "Jane Lewis",
    },
    {
      name: "Domain hosting — abhi.org.uk",
      vendor: "Nominet / Fasthosts",
      purpose: "Primary domain registration and DNS for abhi.org.uk and related records",
      category: "Infrastructure",
      website_url: "https://www.abhi.org.uk",
      status: "Active",
      licences_purchased: 1,
      licences_allocated: 1,
      licence_type: "Unlimited",
      monthly_cost: 12,
      annual_cost: 144,
      next_renewal_date: "2027-03-15",
      renewal_frequency: "Annually",
      business_owner: "Sarah Chen",
      technical_owner: "Richard Phillips",
      department: "Marketing",
      supplier_company: "Fasthosts Internet Ltd",
      cost_centre: "MKT",
      budget_owner: "Michelle Michelucci",
    },
    {
      name: "Website CMS — WordPress VIP",
      vendor: "Automattic",
      purpose: "Content management for abhi.org.uk member and public pages",
      category: "Content management",
      website_url: "https://wpvip.com",
      status: "Active",
      licences_purchased: 5,
      licences_allocated: 4,
      licence_type: "Named",
      monthly_cost: 750,
      annual_cost: 9000,
      next_renewal_date: "2026-11-01",
      renewal_frequency: "Annually",
      business_owner: "Michelle Michelucci",
      technical_owner: "Sarah Chen",
      department: "Marketing",
      supplier_company: "Automattic Inc.",
      cost_centre: "MKT",
      budget_owner: "Michelle Michelucci",
    },
    {
      name: "BambooHR",
      vendor: "BambooHR",
      purpose: "HRIS for employee records, leave, and onboarding",
      category: "HR",
      website_url: "https://www.bamboohr.com",
      status: "Active",
      licences_purchased: seats,
      licences_allocated: seats,
      licence_type: "Per user",
      monthly_cost: round2(seats * 8.5),
      annual_cost: round2(seats * 8.5 * 12),
      next_renewal_date: "2027-01-12",
      renewal_frequency: "Annually",
      business_owner: "Jane Lewis",
      technical_owner: "Sarah Chen",
      department: "Human Resources",
      supplier_company: "BambooHR LLC",
      cost_centre: "HR",
      budget_owner: "Jane Lewis",
    },
    {
      name: "HubSpot CRM Professional",
      vendor: "HubSpot",
      purpose: "Member and prospect CRM for membership and commercial teams",
      category: "CRM",
      website_url: "https://www.hubspot.com",
      status: "Active",
      licences_purchased: 12,
      licences_allocated: 10,
      licence_type: "Named",
      monthly_cost: 890,
      annual_cost: 10680,
      next_renewal_date: "2026-09-20",
      renewal_frequency: "Annually",
      business_owner: "Paul Benton",
      technical_owner: "Sarah Chen",
      department: "Membership",
      supplier_company: "HubSpot Inc.",
      cost_centre: "MEM",
      budget_owner: "Paul Benton",
    },
    {
      name: "Xero",
      vendor: "Xero",
      purpose: "Cloud accounting, bank feeds, and management reporting",
      category: "Finance",
      website_url: "https://www.xero.com",
      status: "Active",
      licences_purchased: 6,
      licences_allocated: 5,
      licence_type: "Named",
      monthly_cost: 60,
      annual_cost: 720,
      next_renewal_date: "2026-08-15",
      renewal_frequency: "Monthly",
      business_owner: "Richard Phillips",
      technical_owner: "Richard Phillips",
      department: "Finance",
      supplier_company: "Xero Limited",
      cost_centre: "FIN",
      budget_owner: "Jane Lewis",
    },
    {
      name: "Expensify",
      vendor: "Expensify",
      purpose: "Expense management, receipts, and staff reimbursement workflows",
      category: "Finance",
      website_url: "https://www.expensify.com",
      status: "Active",
      licences_purchased: seats,
      licences_allocated: Math.max(seats - 2, 1),
      licence_type: "Per user",
      monthly_cost: round2(seats * 5),
      annual_cost: round2(seats * 5 * 12),
      next_renewal_date: "2026-12-01",
      renewal_frequency: "Annually",
      business_owner: "Richard Phillips",
      technical_owner: "Sarah Chen",
      department: "Finance",
      supplier_company: "Expensify Inc.",
      cost_centre: "FIN",
      budget_owner: "Jane Lewis",
    },
    {
      name: "Zoom Workplace",
      vendor: "Zoom",
      purpose: "Video meetings for staff, members, and working groups",
      category: "Collaboration",
      website_url: "https://zoom.us",
      status: "Active",
      licences_purchased: 15,
      licences_allocated: 12,
      licence_type: "Named",
      monthly_cost: 225,
      annual_cost: 2700,
      next_renewal_date: "2027-02-01",
      renewal_frequency: "Annually",
      business_owner: "Michelle Michelucci",
      technical_owner: "Sarah Chen",
      department: "Operations",
      supplier_company: "Zoom Video Communications",
      cost_centre: "OPS",
      budget_owner: "Jane Lewis",
    },
    {
      name: "Mailchimp Standard",
      vendor: "Intuit Mailchimp",
      purpose: "Member newsletters and mailing list campaigns",
      category: "Marketing",
      website_url: "https://mailchimp.com",
      status: "Active",
      licences_purchased: 4,
      licences_allocated: 3,
      licence_type: "Named",
      monthly_cost: 115,
      annual_cost: 1380,
      next_renewal_date: "2026-10-10",
      renewal_frequency: "Monthly",
      business_owner: "Michelle Michelucci",
      technical_owner: "Lauren Hayes",
      department: "Marketing",
      supplier_company: "Intuit Inc.",
      cost_centre: "MKT",
      budget_owner: "Michelle Michelucci",
    },
    {
      name: "DocuSign eSignature",
      vendor: "DocuSign",
      purpose: "Contracts, board papers, and member agreements",
      category: "Operations",
      website_url: "https://www.docusign.com",
      status: "Active",
      licences_purchased: 8,
      licences_allocated: 6,
      licence_type: "Named",
      monthly_cost: 200,
      annual_cost: 2400,
      next_renewal_date: "2026-11-20",
      renewal_frequency: "Annually",
      business_owner: "Jane Lewis",
      technical_owner: "Sarah Chen",
      department: "Legal / Governance",
      supplier_company: "DocuSign Inc.",
      cost_centre: "GOV",
      budget_owner: "Jane Lewis",
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

  const seats = fteCount ?? 0;
  console.log(`ABHI workspace ${workspace.id} — active full-time employees: ${seats}`);

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
    currency: "GBP",
    last_payment_amount: row.monthly_cost,
    last_payment_date: "2026-07-01",
    contract_length: "12 months",
    supplier_name: row.supplier_company,
    invoice_reference: `ABHI-SW-${String(index + 1).padStart(3, "0")}`,
    financial_account_code: "5010",
    approver: "Jane Lewis",
    account_manager: "UK Account Team",
    support_email: "support@vendor.example",
    support_phone: "+44 20 7000 0000",
    customer_number: `ABHI-${String(1000 + index)}`,
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
  const m365 = rows.find((row) => /microsoft 365/i.test(row.name));

  // Safety: confirm other tenants untouched
  const { data: others } = await admin
    .from("workspaces")
    .select("id, slug")
    .in("slug", ["unit311", "demo", "corpcentre", "corporatecentre", "talantonimpact"]);
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
        microsoft365Seats: m365?.licences_purchased ?? null,
        softwareAssets: after,
        annualSpendGbp: round2(annualSpend),
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
