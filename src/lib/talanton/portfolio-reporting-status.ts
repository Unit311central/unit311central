import type { PortfolioCompany } from "@/lib/talanton/portfolio-data";

export type CompanyReportingStatus = "Submitted" | "Due soon" | "Overdue" | "Not started";

const REPORTING_CYCLE_DAYS = 92;

function parseReportDate(raw: string): Date | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const iso = trimmed.includes("T") ? trimmed : `${trimmed}T12:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Reporting cadence from portfolio_companies.last_quarterly_report_date (Supabase). */
export function companyReportingStatus(company: PortfolioCompany): CompanyReportingStatus {
  const parsed = parseReportDate(company.lastQuarterlyReportDate);
  if (!parsed) return "Not started";

  const ageMs = Date.now() - parsed.getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);

  if (ageDays <= REPORTING_CYCLE_DAYS) return "Submitted";
  if (ageDays <= REPORTING_CYCLE_DAYS + 21) return "Due soon";
  return "Overdue";
}

export function isReportingOutstanding(status: CompanyReportingStatus): boolean {
  return status === "Overdue" || status === "Due soon" || status === "Not started";
}

export function countPortfolioReportsOutstanding(companies: PortfolioCompany[]): number {
  return companies.filter((c) => isReportingOutstanding(companyReportingStatus(c))).length;
}
