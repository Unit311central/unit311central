import {
  createBlankCompanyDetailsFields,
  isCompanyDetailsEmpty,
  isCompanyStatus,
  sanitizeCompanyDetailsFields,
  validateCompanyDetailsFields,
  type CompanyDetails,
  type CompanyDetailsFields,
  type CompanyStatus,
} from "@/lib/company-details-data";
import { isMissingTableError } from "@/lib/internal-db-migrations";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { requireCurrentWorkspace } from "@/lib/workspace-context";

type CompanyDetailsScope = {
  workspaceId?: string | null;
};

export const COMPANY_DETAILS_MIGRATION_REQUIRED =
  "Company Details schema is missing. Apply Supabase migration 092_company_details.sql before using this module.";

export const COMPANY_DETAILS_MULTI_ENTITY_MIGRATION_FILE = "156_company_details_multi_entity.sql";

export const COMPANY_DETAILS_MIGRATION_FILE = "092_company_details.sql";

function requireSupabase() {
  if (!isSupabaseConfigured()) {
    throw new Error("Supabase is not configured.");
  }
  return createSupabaseServerClient();
}

function throwIfCompanyDetailsSchemaMissing(error: { message: string }) {
  if (isMissingTableError(error, "company_details")) {
    throw new Error(COMPANY_DETAILS_MIGRATION_REQUIRED);
  }
  throw new Error(error.message);
}

/**
 * Read-only schema probe. Does not create or alter tables.
 * Returns false when migration 092 has not been applied.
 */
export async function isCompanyDetailsSchemaReady(): Promise<boolean> {
  const supabase = requireSupabase();
  const { error } = await supabase.from("company_details").select("id").limit(1);
  if (!error) return true;
  if (isMissingTableError(error, "company_details")) return false;
  throw new Error(error.message);
}

async function resolveWorkspaceId(scope?: CompanyDetailsScope) {
  const explicit = scope?.workspaceId?.trim();
  if (explicit) return explicit;
  const workspace = await requireCurrentWorkspace();
  return workspace.id;
}

function mapRow(row: Record<string, unknown>): CompanyDetails {
  const status = String(row.company_status ?? "Active");
  return {
    id: String(row.id),
    workspaceId: String(row.workspace_id),
    legalCompanyName: String(row.legal_company_name ?? ""),
    tradingName: String(row.trading_name ?? ""),
    companyNumber: String(row.company_number ?? ""),
    vatTaxNumber: String(row.vat_tax_number ?? ""),
    registeredOfficeAddress: String(row.registered_office_address ?? ""),
    principalBusinessAddress: String(row.principal_business_address ?? ""),
    countryOfRegistration: String(row.country_of_registration ?? ""),
    dateOfIncorporation: row.date_of_incorporation
      ? String(row.date_of_incorporation).slice(0, 10)
      : "",
    companyStatus: isCompanyStatus(status) ? status : "Active",
    sicIndustryClassification: String(row.sic_industry_classification ?? ""),
    website: String(row.website ?? ""),
    primaryEmail: String(row.primary_email ?? ""),
    primaryTelephone: String(row.primary_telephone ?? ""),
    generalCompanyDescription: String(row.general_company_description ?? ""),
    displayOrder: Number(row.display_order ?? 0),
    archivedAt: row.archived_at ? String(row.archived_at) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
  };
}

function toDbPayload(fields: CompanyDetailsFields, workspaceId: string, displayOrder?: number) {
  const clean = sanitizeCompanyDetailsFields(fields);
  return {
    workspace_id: workspaceId,
    legal_company_name: clean.legalCompanyName,
    trading_name: clean.tradingName,
    company_number: clean.companyNumber,
    vat_tax_number: clean.vatTaxNumber,
    registered_office_address: clean.registeredOfficeAddress,
    principal_business_address: clean.principalBusinessAddress,
    country_of_registration: clean.countryOfRegistration,
    date_of_incorporation: clean.dateOfIncorporation || null,
    company_status: clean.companyStatus,
    sic_industry_classification: clean.sicIndustryClassification,
    website: clean.website,
    primary_email: clean.primaryEmail,
    primary_telephone: clean.primaryTelephone,
    general_company_description: clean.generalCompanyDescription,
    ...(displayOrder !== undefined ? { display_order: displayOrder } : {}),
    updated_at: new Date().toISOString(),
  };
}

function assertValidFields(fields: CompanyDetailsFields) {
  const validation = validateCompanyDetailsFields(fields);
  const firstError = Object.values(validation)[0];
  if (firstError) {
    throw new Error(firstError);
  }
}

export type ListCompanyDetailsOptions = {
  includeArchived?: boolean;
};

export async function listCompanyDetails(
  scope?: CompanyDetailsScope,
  options?: ListCompanyDetailsOptions,
): Promise<CompanyDetails[]> {
  const workspaceId = await resolveWorkspaceId(scope);
  const supabase = requireSupabase();
  let query = supabase
    .from("company_details")
    .select("*")
    .eq("workspace_id", workspaceId)
    .order("display_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (!options?.includeArchived) {
    query = query.is("archived_at", null);
  }

  const { data, error } = await query;
  if (error) throwIfCompanyDetailsSchemaMissing(error);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

/** @deprecated Prefer listCompanyDetails — returns the first active company for legacy callers. */
export async function getCompanyDetails(
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails | null> {
  const companies = await listCompanyDetails(scope);
  return companies[0] ?? null;
}

export async function getCompanyDetailsById(
  companyId: string,
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails | null> {
  const workspaceId = await resolveWorkspaceId(scope);
  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("company_details")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", companyId)
    .maybeSingle();

  if (error) throwIfCompanyDetailsSchemaMissing(error);
  if (!data) return null;
  return mapRow(data as Record<string, unknown>);
}

export async function createCompanyDetails(
  input: CompanyDetailsFields,
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails> {
  const workspaceId = await resolveWorkspaceId(scope);
  if (input.companyStatus !== undefined && !isCompanyStatus(input.companyStatus)) {
    throw new Error("Invalid company status.");
  }

  const fields = sanitizeCompanyDetailsFields({
    ...createBlankCompanyDetailsFields(),
    ...input,
  });
  assertValidFields(fields);

  const existing = await listCompanyDetails({ workspaceId }, { includeArchived: true });
  const displayOrder =
    existing.length === 0 ? 0 : Math.max(...existing.map((row) => row.displayOrder)) + 1;

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("company_details")
    .insert({
      ...toDbPayload(fields, workspaceId, displayOrder),
      archived_at: null,
    })
    .select("*")
    .single();

  if (error) throwIfCompanyDetailsSchemaMissing(error);
  return mapRow(data as Record<string, unknown>);
}

export async function updateCompanyDetails(
  companyId: string,
  input: Partial<CompanyDetailsFields>,
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails> {
  const workspaceId = await resolveWorkspaceId(scope);
  const current = await getCompanyDetailsById(companyId, { workspaceId });
  if (!current) {
    throw new Error("Company not found.");
  }
  if (current.archivedAt) {
    throw new Error("Archived companies cannot be edited.");
  }

  const merged: CompanyDetailsFields = {
    legalCompanyName: current.legalCompanyName,
    tradingName: current.tradingName,
    companyNumber: current.companyNumber,
    vatTaxNumber: current.vatTaxNumber,
    registeredOfficeAddress: current.registeredOfficeAddress,
    principalBusinessAddress: current.principalBusinessAddress,
    countryOfRegistration: current.countryOfRegistration,
    dateOfIncorporation: current.dateOfIncorporation,
    companyStatus: current.companyStatus,
    sicIndustryClassification: current.sicIndustryClassification,
    website: current.website,
    primaryEmail: current.primaryEmail,
    primaryTelephone: current.primaryTelephone,
    generalCompanyDescription: current.generalCompanyDescription,
    ...Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ),
  } as CompanyDetailsFields;

  if (input.companyStatus !== undefined && !isCompanyStatus(input.companyStatus)) {
    throw new Error("Invalid company status.");
  }

  assertValidFields(merged);

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("company_details")
    .update(toDbPayload(merged, workspaceId))
    .eq("id", companyId)
    .eq("workspace_id", workspaceId)
    .is("archived_at", null)
    .select("*")
    .single();

  if (error) throwIfCompanyDetailsSchemaMissing(error);
  return mapRow(data as Record<string, unknown>);
}

/** Soft-archive — retained for history and future module references. */
export async function archiveCompanyDetails(
  companyId: string,
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails> {
  const workspaceId = await resolveWorkspaceId(scope);
  const current = await getCompanyDetailsById(companyId, { workspaceId });
  if (!current) {
    throw new Error("Company not found.");
  }
  if (current.archivedAt) {
    return current;
  }

  const supabase = requireSupabase();
  const { data, error } = await supabase
    .from("company_details")
    .update({
      archived_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", companyId)
    .eq("workspace_id", workspaceId)
    .select("*")
    .single();

  if (error) throwIfCompanyDetailsSchemaMissing(error);
  return mapRow(data as Record<string, unknown>);
}

/**
 * Legacy upsert — updates the first active company or creates one when none exist.
 * Prefer createCompanyDetails / updateCompanyDetails for multi-entity workspaces.
 */
export async function upsertCompanyDetails(
  input: Partial<CompanyDetailsFields>,
  scope?: CompanyDetailsScope,
): Promise<CompanyDetails> {
  const workspaceId = await resolveWorkspaceId(scope);
  const companies = await listCompanyDetails({ workspaceId });
  const current = companies[0] ?? null;

  const merged: CompanyDetailsFields = {
    ...createBlankCompanyDetailsFields(),
    ...(current
      ? {
          legalCompanyName: current.legalCompanyName,
          tradingName: current.tradingName,
          companyNumber: current.companyNumber,
          vatTaxNumber: current.vatTaxNumber,
          registeredOfficeAddress: current.registeredOfficeAddress,
          principalBusinessAddress: current.principalBusinessAddress,
          countryOfRegistration: current.countryOfRegistration,
          dateOfIncorporation: current.dateOfIncorporation,
          companyStatus: current.companyStatus,
          sicIndustryClassification: current.sicIndustryClassification,
          website: current.website,
          primaryEmail: current.primaryEmail,
          primaryTelephone: current.primaryTelephone,
          generalCompanyDescription: current.generalCompanyDescription,
        }
      : {}),
    ...Object.fromEntries(
      Object.entries(input).filter(([, value]) => value !== undefined),
    ),
  } as CompanyDetailsFields;

  if (input.companyStatus !== undefined && !isCompanyStatus(input.companyStatus)) {
    throw new Error("Invalid company status.");
  }

  if (current) {
    return updateCompanyDetails(current.id, merged, { workspaceId });
  }

  if (isCompanyDetailsEmpty(merged)) {
    assertValidFields(merged);
  } else {
    assertValidFields(merged);
  }

  return createCompanyDetails(merged, { workspaceId });
}

export type { CompanyStatus };
