/**
 * Talanton Impact — Technology Management Software & SaaS register (USD).
 */

import type { SoftwareAsset } from "@/lib/software-assets-data";
import {
  createSoftwareAsset,
  listSoftwareAssets,
} from "@/lib/software-assets-service";
import { ensureSoftwareAssetRegisterTables } from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

const SEED_MARKER_NAME = "Salesforce Nonprofit Cloud";

type SeedRow = Partial<SoftwareAsset> & {
  name: string;
  supplierCompany: string;
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function buildTalantonSoftwareSeeds(seats: number): SeedRow[] {
  const teamSeats = Math.max(seats, 12);
  const m365Monthly = round2(teamSeats * 22);
  const m365Annual = round2(m365Monthly * 12);

  return [
    {
      name: "Microsoft 365 Business Premium",
      vendor: "Microsoft",
      purpose: "Email, Teams, and SharePoint for Nairobi and US investment team",
      category: "Productivity",
      websiteUrl: "https://www.microsoft.com/microsoft-365",
      status: "Active",
      licencesPurchased: teamSeats,
      licencesAllocated: teamSeats,
      licenceType: "Per user",
      monthlyCost: m365Monthly,
      annualCost: m365Annual,
      currency: "USD",
      nextRenewalDate: "2026-10-01",
      renewalFrequency: "Annually",
      businessOwner: "Andy Moore",
      technicalOwner: "David Simms",
      department: "Finance",
      supplierCompany: "Microsoft Corporation",
      costCentre: "FUND-OPS",
      budgetOwner: "Andy Moore",
    },
    {
      name: SEED_MARKER_NAME,
      vendor: "Salesforce",
      purpose: "LP CRM, pipeline, and investor relations workflows",
      category: "CRM",
      websiteUrl: "https://www.salesforce.com/nonprofit",
      status: "Active",
      licencesPurchased: 15,
      licencesAllocated: 12,
      licenceType: "Named",
      monthlyCost: round2(14_400 / 12),
      annualCost: 14_400,
      currency: "USD",
      nextRenewalDate: "2026-09-20",
      renewalFrequency: "Annually",
      businessOwner: "Michelle Ochieng",
      technicalOwner: "Desiree Latu",
      department: "Investor Relations",
      supplierCompany: "Salesforce Inc.",
      costCentre: "IR",
      budgetOwner: "David Simms",
    },
    {
      name: "DocuSign + Zoom Business",
      vendor: "DocuSign / Zoom",
      purpose: "Fund document signing and LP / board video conferencing",
      category: "Collaboration",
      websiteUrl: "https://www.docusign.com",
      status: "Active",
      licencesPurchased: teamSeats,
      licencesAllocated: teamSeats,
      licenceType: "Per user",
      monthlyCost: round2(4_800 / 12),
      annualCost: 4_800,
      currency: "USD",
      nextRenewalDate: "2026-12-01",
      renewalFrequency: "Annually",
      businessOwner: "Brooke Wyman",
      technicalOwner: "Andy Moore",
      department: "Operations",
      supplierCompany: "DocuSign Inc.",
      costCentre: "OPS",
      budgetOwner: "Andy Moore",
    },
    {
      name: "Xero",
      vendor: "Xero",
      purpose: "Fund accounting and multi-entity bookkeeping",
      category: "Finance",
      websiteUrl: "https://www.xero.com",
      status: "Active",
      licencesPurchased: 8,
      licencesAllocated: 6,
      licenceType: "Named",
      monthlyCost: 186,
      annualCost: 2_232,
      currency: "USD",
      nextRenewalDate: "2026-11-15",
      renewalFrequency: "Annually",
      businessOwner: "Mercy Nelima",
      technicalOwner: "Carol Rubiro",
      department: "Finance",
      supplierCompany: "Xero Ltd",
      costCentre: "FUND-OPS",
      budgetOwner: "Andy Moore",
    },
    {
      name: "Carta",
      vendor: "Carta",
      purpose: "Cap table and portfolio company equity tracking",
      category: "Fund operations",
      websiteUrl: "https://carta.com",
      status: "Active",
      licencesPurchased: 5,
      licencesAllocated: 4,
      licenceType: "Named",
      monthlyCost: round2(6_600 / 12),
      annualCost: 6_600,
      currency: "USD",
      nextRenewalDate: "2027-02-01",
      renewalFrequency: "Annually",
      businessOwner: "Iris Liang",
      technicalOwner: "Cynthia Omondi",
      department: "Investments",
      supplierCompany: "Carta Inc.",
      costCentre: "INVEST",
      budgetOwner: "David Simms",
    },
    {
      name: "Dropbox Business",
      vendor: "Dropbox",
      purpose: "Secure file sync for diligence and board materials",
      category: "Storage",
      websiteUrl: "https://www.dropbox.com/business",
      status: "Active",
      licencesPurchased: teamSeats,
      licencesAllocated: teamSeats - 2,
      licenceType: "Per user",
      monthlyCost: round2(teamSeats * 15),
      annualCost: round2(teamSeats * 15 * 12),
      currency: "USD",
      nextRenewalDate: "2027-01-10",
      renewalFrequency: "Annually",
      businessOwner: "Carol Rubiro",
      technicalOwner: "Andy Moore",
      department: "Fund Operations",
      supplierCompany: "Dropbox Inc.",
      costCentre: "FUND-OPS",
      budgetOwner: "Andy Moore",
    },
    {
      name: "Slack Business+",
      vendor: "Salesforce",
      purpose: "Internal channels for investments, IR, and portfolio updates",
      category: "Collaboration",
      websiteUrl: "https://slack.com",
      status: "Active",
      licencesPurchased: teamSeats,
      licencesAllocated: teamSeats,
      licenceType: "Per user",
      monthlyCost: round2(teamSeats * 12.5),
      annualCost: round2(teamSeats * 12.5 * 12),
      currency: "USD",
      nextRenewalDate: "2027-01-15",
      renewalFrequency: "Annually",
      businessOwner: "Desiree Latu",
      technicalOwner: "Andy Moore",
      department: "Marketing",
      supplierCompany: "Salesforce Inc.",
      costCentre: "MKT",
      budgetOwner: "Desiree Latu",
    },
    {
      name: "AWS Organization",
      vendor: "Amazon Web Services",
      purpose: "Cloud storage for portfolio reporting and backup",
      category: "Infrastructure",
      websiteUrl: "https://aws.amazon.com",
      status: "Active",
      licencesPurchased: 1,
      licencesAllocated: 1,
      licenceType: "Unlimited",
      monthlyCost: 285,
      annualCost: 3_420,
      currency: "USD",
      nextRenewalDate: "2026-08-31",
      renewalFrequency: "Monthly",
      businessOwner: "Andy Moore",
      technicalOwner: "David Simms",
      department: "Technology",
      supplierCompany: "Amazon Web Services",
      costCentre: "IT",
      budgetOwner: "Andy Moore",
    },
  ];
}

async function countTalantonActiveEmployees(workspaceId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 23;
  const supabase = createSupabaseServerClient();
  const { count, error } = await supabase
    .from("hr_employees")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .not("employment_status", "eq", "former_employee")
    .not("employment_status", "eq", "archived");
  if (error) return 23;
  return count ?? 23;
}

function talantonSoftwareSeedReady(assets: SoftwareAsset[]): boolean {
  const marker = assets.find((row) => row.name === SEED_MARKER_NAME);
  if (!marker) return false;
  if (String(marker.currency).toUpperCase() !== "USD") return false;
  return assets.every((row) => String(row.currency).toUpperCase() === "USD");
}

async function clearWorkspaceSoftwareAssets(workspaceId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createSupabaseServerClient();
  await supabase.from("software_asset_credentials").delete().eq("workspace_id", workspaceId);
  await supabase.from("software_asset_files").delete().eq("workspace_id", workspaceId);
  await supabase.from("software_asset_audit_events").delete().eq("workspace_id", workspaceId);
  const { error } = await supabase.from("software_assets").delete().eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Idempotent Talanton software register — all rows USD. */
export async function ensureTalantonSoftwareAssetsSeeded(workspaceId: string): Promise<void> {
  await ensureSoftwareAssetRegisterTables();
  const existing = await listSoftwareAssets({ workspaceId });
  if (talantonSoftwareSeedReady(existing)) return;

  if (existing.length > 0) {
    await clearWorkspaceSoftwareAssets(workspaceId);
  }

  const seats = await countTalantonActiveEmployees(workspaceId);
  const seeds = buildTalantonSoftwareSeeds(seats);

  for (const [index, seed] of seeds.entries()) {
    await createSoftwareAsset(
      {
        ...seed,
        invoiceReference: `TI-SW-${String(index + 1).padStart(3, "0")}`,
        contractLength: "12 months",
        lastPaymentDate: "2026-07-01",
        lastPaymentAmount: seed.monthlyCost ?? null,
        approver: "David Simms",
        accountManager: "US Account Team",
        supportEmail: "support@vendor.example",
        supportPhone: "+1 610 555 0100",
        customerNumber: `TI-${String(2000 + index)}`,
      },
      { workspaceId },
    );
  }
}
