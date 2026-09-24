import "server-only";

import type { SalesQuoteSellerProfile } from "@/lib/accounting/types";
import type { CompanyDetails } from "@/lib/company-details-data";
import { listCompanyDetails } from "@/lib/company-details-service";
import { isSupabaseConfigured } from "@/lib/supabase/server";
import { createTenancyServerClient } from "@/lib/supabase/tenancy-server";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createTenancyServerClient();
}

function entityLabel(row: CompanyDetails) {
  return `${row.tradingName} ${row.legalCompanyName}`.toLowerCase();
}

function pickBrandEntity(companies: CompanyDetails[]): CompanyDetails | null {
  const active = companies.filter((row) => !row.archivedAt);
  return (
    active.find((row) => /unit311|unit 311/.test(entityLabel(row))) ??
    active.find((row) => row.tradingName.trim()) ??
    null
  );
}

function pickLegalEntity(companies: CompanyDetails[]): CompanyDetails | null {
  const active = companies.filter((row) => !row.archivedAt);
  return (
    active.find((row) => /nakama/.test(entityLabel(row))) ??
    active.find((row) => /holdings/.test(entityLabel(row))) ??
    active[0] ??
    null
  );
}

function mapCompanyDetailsToSeller(
  brand: CompanyDetails | null,
  legal: CompanyDetails | null,
): SalesQuoteSellerProfile {
  const brandName =
    brand?.tradingName.trim() ||
    brand?.legalCompanyName.trim() ||
    "Unit311 Central";
  const addressSource = legal ?? brand;
  const address = addressSource
    ? addressSource.registeredOfficeAddress.trim() ||
      addressSource.principalBusinessAddress.trim() ||
      null
    : null;
  const email =
    legal?.primaryEmail.trim() ||
    brand?.primaryEmail.trim() ||
    null;
  return {
    brandName,
    legalCompanyName: legal?.legalCompanyName.trim() || null,
    tradingName: brand?.tradingName.trim() || null,
    companyNumber: legal?.companyNumber.trim() || brand?.companyNumber.trim() || null,
    vatTaxNumber: legal?.vatTaxNumber.trim() || brand?.vatTaxNumber.trim() || null,
    companyName: brandName,
    contactName: null,
    email,
    phone: legal?.primaryTelephone.trim() || brand?.primaryTelephone.trim() || null,
    address,
    city: null,
    region: null,
    country: legal?.countryOfRegistration.trim() || brand?.countryOfRegistration.trim() || null,
    website: brand?.website.trim() || legal?.website.trim() || null,
  };
}

/** Seller block for quote compose — no PDF or raster dependencies. */
export async function getSalesQuoteSellerProfile(
  workspaceId: string,
): Promise<SalesQuoteSellerProfile> {
  try {
    const companies = await listCompanyDetails({ workspaceId });
    const brand = pickBrandEntity(companies);
    const legal = pickLegalEntity(companies);
    if (brand || legal) return mapCompanyDetailsToSeller(brand, legal);
  } catch {
    // Fall through when Corporate Information schema is unavailable.
  }

  const supabase = requireSupabase();
  const { data: workspace } = await supabase
    .from("workspaces")
    .select("name")
    .eq("id", workspaceId)
    .maybeSingle();

  const fallback = workspace?.name?.trim() || "Unit311 Central";
  return {
    brandName: fallback,
    legalCompanyName: null,
    tradingName: null,
    companyNumber: null,
    vatTaxNumber: null,
    companyName: fallback,
    contactName: null,
    email: null,
    phone: null,
    address: null,
    city: null,
    region: null,
    country: null,
    website: null,
  };
}
