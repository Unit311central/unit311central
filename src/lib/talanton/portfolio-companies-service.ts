import {
  createSupabaseServiceRoleClient,
  isSupabaseServiceRoleConfigured,
} from "@/lib/supabase/server";
import {
  TALANTON_PORTFOLIO_COMPANIES,
  type PortfolioCompany,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";
import { TALANTON_IMPACT_SLUG } from "@/lib/talanton-surface";

function db() {
  if (!isSupabaseServiceRoleConfigured()) {
    throw new Error("Portfolio companies require SUPABASE_SERVICE_ROLE_KEY.");
  }
  return createSupabaseServiceRoleClient();
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 48);
}

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10);
}

function toNumber(value: unknown, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function mapRow(row: Record<string, unknown>): PortfolioCompany {
  const risk = String(row.risk_rating ?? "Medium");
  const riskRating = (["Low", "Medium", "High", "Critical"].includes(risk)
    ? risk
    : "Medium") as RiskRating;
  return {
    id: String(row.id),
    clientId: String(row.client_id),
    name: String(row.name ?? ""),
    country: String(row.country ?? ""),
    sector: String(row.sector ?? ""),
    region: String(row.region ?? ""),
    employeeCount: toNumber(row.employee_count),
    investmentAmountUsd: toNumber(row.investment_amount_usd),
    ownershipPct: toNumber(row.ownership_pct),
    annualRevenueUsd: toNumber(row.annual_revenue_usd),
    revenueGrowthPct: toNumber(row.revenue_growth_pct),
    burnRateUsdMonthly: toNumber(row.burn_rate_usd_monthly),
    compliancePct: Math.round(toNumber(row.compliance_pct)),
    riskRating,
    roiMoic: toNumber(row.roi_moic, 1),
    lastQuarterlyReportDate: String(row.last_quarterly_report_date ?? ""),
    outstandingTraining: Math.round(toNumber(row.outstanding_training)),
    usersEnrolled: Math.round(toNumber(row.users_enrolled)),
    coursesAssigned: Math.round(toNumber(row.courses_assigned)),
    overview: String(row.overview ?? ""),
    primaryContact: String(row.primary_contact ?? ""),
    email: String(row.email ?? ""),
    phone: String(row.phone ?? ""),
    city: String(row.city ?? ""),
    lastReview: String(row.last_review ?? ""),
  };
}

function toDbRow(company: PortfolioCompany, workspaceId: string, sortOrder: number) {
  return {
    id: company.id,
    workspace_id: workspaceId,
    client_id: company.clientId,
    name: company.name,
    country: company.country,
    sector: company.sector,
    region: company.region,
    city: company.city,
    employee_count: company.employeeCount,
    investment_amount_usd: company.investmentAmountUsd,
    ownership_pct: company.ownershipPct,
    annual_revenue_usd: company.annualRevenueUsd,
    revenue_growth_pct: company.revenueGrowthPct,
    burn_rate_usd_monthly: company.burnRateUsdMonthly,
    compliance_pct: company.compliancePct,
    risk_rating: company.riskRating,
    roi_moic: company.roiMoic,
    last_quarterly_report_date: company.lastQuarterlyReportDate,
    outstanding_training: company.outstandingTraining,
    users_enrolled: company.usersEnrolled,
    courses_assigned: company.coursesAssigned,
    overview: company.overview,
    primary_contact: company.primaryContact,
    email: company.email,
    phone: company.phone,
    last_review: company.lastReview,
    sort_order: sortOrder,
    is_active: true,
    updated_at: new Date().toISOString(),
  };
}

async function syncInternalClientMirror(
  workspaceId: string,
  company: PortfolioCompany,
): Promise<void> {
  const supabase = db();
  const row = {
    id: company.clientId,
    workspace_id: workspaceId,
    company_name: company.name,
    industry: "Other",
    primary_contact: company.primaryContact,
    email: company.email,
    phone: company.phone,
    region: company.country || "Europe-wide",
    account_status: "Client Created",
    contract_type: "Investment",
    tax_id: "",
    billing_address: `${company.city}, ${company.country}`.replace(/^, |, $/g, ""),
    active_projects: 0,
    notes: `Talanton Impact portfolio company · ${company.sector}`,
    company_address: `${company.city}, ${company.country}`.replace(/^, |, $/g, ""),
    company_city: company.city,
    company_country: company.country,
    invoice_email: company.email,
  };

  const { data: existing } = await supabase
    .from("internal_clients")
    .select("id")
    .eq("id", company.clientId)
    .eq("workspace_id", workspaceId)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await supabase
      .from("internal_clients")
      .update({
        company_name: row.company_name,
        industry: row.industry,
        primary_contact: row.primary_contact,
        email: row.email,
        phone: row.phone,
        region: row.region,
        notes: row.notes,
        company_address: row.company_address,
        company_city: row.company_city,
        company_country: row.company_country,
        invoice_email: row.invoice_email,
        billing_address: row.billing_address,
      })
      .eq("id", company.clientId)
      .eq("workspace_id", workspaceId);
    if (error) throw new Error(`internal_clients update: ${error.message}`);
    return;
  }

  const { error } = await supabase.from("internal_clients").insert(row);
  if (error) throw new Error(`internal_clients insert: ${error.message}`);
}

export async function listPortfolioCompanies(
  workspaceId: string,
): Promise<PortfolioCompany[]> {
  const supabase = db();
  const { data, error } = await supabase
    .from("portfolio_companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("is_active", true)
    .order("sort_order", { ascending: true })
    .order("name", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>));
}

export async function ensurePortfolioCompaniesSeeded(args: {
  workspaceId: string;
  workspaceSlug: string;
}): Promise<PortfolioCompany[]> {
  const existing = await listPortfolioCompanies(args.workspaceId);
  if (existing.length > 0) return existing;
  if (args.workspaceSlug !== TALANTON_IMPACT_SLUG) return existing;

  const supabase = db();
  for (let i = 0; i < TALANTON_PORTFOLIO_COMPANIES.length; i++) {
    const company = TALANTON_PORTFOLIO_COMPANIES[i]!;
    const { error } = await supabase
      .from("portfolio_companies")
      .upsert(toDbRow(company, args.workspaceId, (i + 1) * 10), { onConflict: "id" });
    if (error) throw new Error(`seed portfolio_companies: ${error.message}`);
    await syncInternalClientMirror(args.workspaceId, company);
  }
  return listPortfolioCompanies(args.workspaceId);
}

export type PortfolioCompanyInput = Partial<PortfolioCompany> & {
  name: string;
};

function normalizeInput(
  input: PortfolioCompanyInput,
  existing?: PortfolioCompany,
): PortfolioCompany {
  const name = input.name.trim();
  if (!name) throw new Error("Company name is required.");
  const slug = slugify(name) || `company-${Date.now().toString(36)}`;
  const id = existing?.id ?? `ti-co-${slug}`;
  const clientId = existing?.clientId ?? `ti-cli-${slug}`;
  const today = todayIsoDate();

  return {
    id,
    clientId,
    name,
    country: (input.country ?? existing?.country ?? "").trim(),
    sector: (input.sector ?? existing?.sector ?? "").trim(),
    region: (input.region ?? existing?.region ?? "").trim(),
    city: (input.city ?? existing?.city ?? "").trim(),
    employeeCount: toNumber(input.employeeCount ?? existing?.employeeCount, 0),
    investmentAmountUsd: toNumber(
      input.investmentAmountUsd ?? existing?.investmentAmountUsd,
      0,
    ),
    ownershipPct: toNumber(input.ownershipPct ?? existing?.ownershipPct, 0),
    annualRevenueUsd: toNumber(
      input.annualRevenueUsd ?? existing?.annualRevenueUsd,
      0,
    ),
    revenueGrowthPct: toNumber(
      input.revenueGrowthPct ?? existing?.revenueGrowthPct,
      0,
    ),
    burnRateUsdMonthly: toNumber(
      input.burnRateUsdMonthly ?? existing?.burnRateUsdMonthly,
      0,
    ),
    compliancePct: Math.round(
      toNumber(input.compliancePct ?? existing?.compliancePct, 0),
    ),
    riskRating: (input.riskRating ?? existing?.riskRating ?? "Medium") as RiskRating,
    roiMoic: toNumber(input.roiMoic ?? existing?.roiMoic, 1),
    lastQuarterlyReportDate:
      (input.lastQuarterlyReportDate ?? existing?.lastQuarterlyReportDate ?? today).trim(),
    outstandingTraining: Math.round(
      toNumber(input.outstandingTraining ?? existing?.outstandingTraining, 0),
    ),
    usersEnrolled: Math.round(
      toNumber(input.usersEnrolled ?? existing?.usersEnrolled, 0),
    ),
    coursesAssigned: Math.round(
      toNumber(input.coursesAssigned ?? existing?.coursesAssigned, 11),
    ),
    overview: (
      input.overview ??
      existing?.overview ??
      `${name} is a Talanton Impact portfolio company.`
    ).trim(),
    primaryContact: (input.primaryContact ?? existing?.primaryContact ?? "").trim(),
    email: (input.email ?? existing?.email ?? "").trim(),
    phone: (input.phone ?? existing?.phone ?? "").trim(),
    lastReview: (input.lastReview ?? existing?.lastReview ?? today).trim(),
  };
}

export async function createPortfolioCompany(
  workspaceId: string,
  input: PortfolioCompanyInput,
): Promise<PortfolioCompany> {
  const company = normalizeInput(input);
  const supabase = db();

  const { data: byId } = await supabase
    .from("portfolio_companies")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("id", company.id)
    .maybeSingle();
  const { data: byClient } = await supabase
    .from("portfolio_companies")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("client_id", company.clientId)
    .maybeSingle();
  if (byId?.id || byClient?.id) {
    const suffix = Date.now().toString(36).slice(-4);
    company.id = `${company.id}-${suffix}`;
    company.clientId = `${company.clientId}-${suffix}`;
  }

  const existing = await listPortfolioCompanies(workspaceId);
  const sortOrder = (existing.length + 1) * 10;
  const { error } = await supabase
    .from("portfolio_companies")
    .insert(toDbRow(company, workspaceId, sortOrder));
  if (error) throw new Error(error.message);
  await syncInternalClientMirror(workspaceId, company);
  return company;
}

export async function updatePortfolioCompany(
  workspaceId: string,
  id: string,
  input: PortfolioCompanyInput,
): Promise<PortfolioCompany> {
  const supabase = db();
  const { data, error } = await supabase
    .from("portfolio_companies")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Portfolio company not found.");

  const existing = mapRow(data as Record<string, unknown>);
  const company = normalizeInput({ ...input, name: input.name || existing.name }, existing);
  // Keep stable ids on update
  company.id = existing.id;
  company.clientId = existing.clientId;

  const { error: updErr } = await supabase
    .from("portfolio_companies")
    .update(toDbRow(company, workspaceId, toNumber((data as { sort_order?: number }).sort_order, 100)))
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (updErr) throw new Error(updErr.message);
  await syncInternalClientMirror(workspaceId, company);
  return company;
}

export async function deletePortfolioCompany(
  workspaceId: string,
  id: string,
): Promise<void> {
  const supabase = db();
  const { data, error } = await supabase
    .from("portfolio_companies")
    .select("id, client_id")
    .eq("workspace_id", workspaceId)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Portfolio company not found.");

  const { error: delErr } = await supabase
    .from("portfolio_companies")
    .delete()
    .eq("workspace_id", workspaceId)
    .eq("id", id);
  if (delErr) throw new Error(delErr.message);

  const clientId = String((data as { client_id: string }).client_id);
  if (clientId.startsWith("ti-cli-")) {
    await supabase
      .from("internal_clients")
      .delete()
      .eq("workspace_id", workspaceId)
      .eq("id", clientId);
  }
}
