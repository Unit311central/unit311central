import {
  TALANTON_PORTFOLIO_COMPANIES,
  type PortfolioCompany,
} from "@/lib/talanton/portfolio-data";

/** Optional in-memory override (EA tool handlers, tests). */
let runtimeOverride: PortfolioCompany[] | null = null;
let runtimeOverrideActive = false;

/** Client-fetched snapshot; falls back to seed data until API load completes. */
let clientSnapshot: PortfolioCompany[] = TALANTON_PORTFOLIO_COMPANIES;

export function resolveTalantonPortfolioCompanies(): PortfolioCompany[] {
  if (runtimeOverrideActive) return runtimeOverride ?? [];
  if (clientSnapshot.length) return clientSnapshot;
  return TALANTON_PORTFOLIO_COMPANIES;
}

export function setTalantonPortfolioCompaniesClientSnapshot(companies: PortfolioCompany[]): void {
  clientSnapshot = companies.length ? companies : TALANTON_PORTFOLIO_COMPANIES;
}

export function withTalantonPortfolioCompaniesOverride<T>(
  companies: PortfolioCompany[],
  fn: () => T,
): T {
  const prev = runtimeOverride;
  const prevActive = runtimeOverrideActive;
  runtimeOverride = companies;
  runtimeOverrideActive = true;
  try {
    return fn();
  } finally {
    runtimeOverride = prev;
    runtimeOverrideActive = prevActive;
  }
}

export async function withTalantonPortfolioCompaniesOverrideAsync<T>(
  companies: PortfolioCompany[],
  fn: () => Promise<T>,
): Promise<T> {
  const prev = runtimeOverride;
  const prevActive = runtimeOverrideActive;
  runtimeOverride = companies;
  runtimeOverrideActive = true;
  try {
    return await fn();
  } finally {
    runtimeOverride = prev;
    runtimeOverrideActive = prevActive;
  }
}
