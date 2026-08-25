/**
 * Demo (Northstar) — Technology Management Software & SaaS register (GBP, workspace-scoped).
 */

import type { SoftwareAsset } from "@/lib/software-assets-data";
import { getNorthstarSoftwareAssets } from "@/lib/demo/northstar-api-fixtures";
import {
  createSoftwareAsset,
  listSoftwareAssets,
} from "@/lib/software-assets-service";
import { ensureSoftwareAssetRegisterTables } from "@/lib/internal-db-migrations";
import { DEMO_REPORTING_CURRENCY } from "@/lib/demo/read-only";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

const SEED_MARKER_NAME = "HubSpot CRM";
const USD_TO_GBP = 0.79;

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

function convertUsdToGbp(amount: number | null | undefined): number | undefined {
  if (amount == null || Number.isNaN(amount)) return undefined;
  return round2(amount * USD_TO_GBP);
}

function buildDemoSoftwareSeeds(): Array<
  Partial<SoftwareAsset> & { name: string; supplierCompany: string }
> {
  const { assets } = getNorthstarSoftwareAssets();
  return assets.map((row) => ({
    name: row.name,
    vendor: row.vendor,
    purpose: row.purpose,
    category: row.category,
    websiteUrl: row.websiteUrl,
    supportUrl: row.supportUrl,
    documentationUrl: row.documentationUrl,
    status: row.status,
    licencesPurchased: row.licencesPurchased,
    licencesAllocated: row.licencesAllocated,
    licenceType: row.licenceType,
    monthlyCost: convertUsdToGbp(row.monthlyCost),
    annualCost: convertUsdToGbp(row.annualCost),
    currency: DEMO_REPORTING_CURRENCY,
        lastPaymentAmount: convertUsdToGbp(row.lastPaymentAmount) ?? undefined,
    lastPaymentDate: row.lastPaymentDate,
    nextRenewalDate: row.nextRenewalDate,
    renewalFrequency: row.renewalFrequency,
    contractLength: row.contractLength,
    costCentre: row.costCentre,
    budgetOwner: row.budgetOwner,
    supplierName: row.supplierName,
    invoiceReference: row.invoiceReference,
    financialAccountCode: row.financialAccountCode,
    businessOwner: row.businessOwner,
    technicalOwner: row.technicalOwner,
    department: row.department,
    approver: row.approver,
    supplierCompany: row.supplierCompany,
    accountManager: row.accountManager,
    supportEmail: row.supportEmail,
    supportPhone: row.supportPhone,
    customerNumber: row.customerNumber,
    integrationConnected: row.integrationConnected,
    integrationApiKeySet: row.integrationApiKeySet,
    integrationWebhookUrl: row.integrationWebhookUrl,
    integrationOauthStatus: row.integrationOauthStatus,
    integrationSyncStatus: row.integrationSyncStatus,
    providerSlug: row.providerSlug,
  }));
}

async function countDemoActiveEmployees(workspaceId: string): Promise<number> {
  if (!isSupabaseConfigured()) return 25;
  const supabase = createTenancyServerClient();
  const { count, error } = await supabase
    .from("hr_employees")
    .select("id", { count: "exact", head: true })
    .eq("workspace_id", workspaceId)
    .not("employment_status", "eq", "former_employee")
    .not("employment_status", "eq", "archived");
  if (error) return 25;
  return count ?? 25;
}

function demoSoftwareSeedReady(assets: SoftwareAsset[]): boolean {
  const marker = assets.find((row) => row.name === SEED_MARKER_NAME);
  if (!marker) return false;
  return assets.every((row) => String(row.currency).toUpperCase() === DEMO_REPORTING_CURRENCY);
}

async function clearWorkspaceSoftwareAssets(workspaceId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;
  const supabase = createTenancyServerClient();
  await supabase.from("software_asset_credentials").delete().eq("workspace_id", workspaceId);
  await supabase.from("software_asset_files").delete().eq("workspace_id", workspaceId);
  await supabase.from("software_asset_audit_events").delete().eq("workspace_id", workspaceId);
  const { error } = await supabase.from("software_assets").delete().eq("workspace_id", workspaceId);
  if (error) throw new Error(error.message);
}

/** Idempotent Demo software register — all rows GBP. */
export async function ensureDemoSoftwareAssetsSeeded(workspaceId: string): Promise<void> {
  await ensureSoftwareAssetRegisterTables();
  const existing = await listSoftwareAssets({ workspaceId });
  if (demoSoftwareSeedReady(existing)) return;

  if (existing.length > 0) {
    await clearWorkspaceSoftwareAssets(workspaceId);
  }

  const seats = await countDemoActiveEmployees(workspaceId);
  const seeds = buildDemoSoftwareSeeds();

  for (const [index, seed] of seeds.entries()) {
    await createSoftwareAsset(
      {
        ...seed,
        licencesPurchased:
          seed.licenceType === "Per user" && seed.licencesPurchased
            ? Math.max(seats, seed.licencesPurchased)
            : seed.licencesPurchased,
        licencesAllocated:
          seed.licenceType === "Per user" && seed.licencesAllocated
            ? Math.min(Math.max(seats - 3, 1), seed.licencesPurchased ?? seats)
            : seed.licencesAllocated,
        invoiceReference: seed.invoiceReference || `NST-SW-${String(index + 1).padStart(3, "0")}`,
        contractLength: seed.contractLength || "12 months",
        lastPaymentDate: seed.lastPaymentDate || "2026-08-01",
        lastPaymentAmount: seed.monthlyCost,
        approver: seed.approver || "Elena Hart",
        accountManager: seed.accountManager || "UK Account Team",
        supportEmail: seed.supportEmail || "support@vendor.example",
        supportPhone: seed.supportPhone || "+44 161 555 0100",
        customerNumber: seed.customerNumber || `NST-${String(3000 + index)}`,
      },
      { workspaceId },
    );
  }
}
