/**
 * Holdings-derived impact estimates for Talanton when company portal
 * submissions are not on file. Executive fixtures from portfolio SSOT — not audited impact statements.
 */

import type { PortfolioCompany } from "@/lib/talanton/portfolio-data";

type HoldingsImpactTrend = "Improving" | "Stable" | "Declining";

function hashSeed(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i += 1) h = (h * 31 + input.charCodeAt(i)) >>> 0;
  return h;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function sectorPeopleMultiplier(sector: string): number {
  const s = sector.toLowerCase();
  if (s.includes("healthcare") || s.includes("pharma")) return 420;
  if (s.includes("fintech") || s.includes("inclusion")) return 890;
  if (s.includes("connectivity") || s.includes("telecom")) return 1100;
  if (s.includes("apparel") || s.includes("manufacturing")) return 38;
  if (s.includes("agriculture") || s.includes("food") || s.includes("aquaculture")) return 95;
  if (s.includes("clean energy") || s.includes("energy") || s.includes("forestry")) return 160;
  if (s.includes("mobility") || s.includes("logistics")) return 220;
  return 70;
}

function sectorCommunityBase(sector: string): number {
  const s = sector.toLowerCase();
  if (s.includes("agriculture") || s.includes("food") || s.includes("forestry")) return 18;
  if (s.includes("healthcare") || s.includes("pharma")) return 14;
  if (s.includes("connectivity") || s.includes("fintech")) return 22;
  if (s.includes("apparel") || s.includes("manufacturing")) return 9;
  return 11;
}

export function womenShareEstimate(company: PortfolioCompany): number {
  const seed = hashSeed(company.id) % 17;
  const base =
    company.sector.toLowerCase().includes("apparel") ||
    company.sector.toLowerCase().includes("healthcare")
      ? 0.48
      : company.sector.toLowerCase().includes("energy") ||
          company.sector.toLowerCase().includes("automotive")
        ? 0.28
        : 0.38;
  return clamp(base + (seed - 8) * 0.012, 0.22, 0.62);
}

export function youthShareEstimate(company: PortfolioCompany): number {
  const seed = hashSeed(`${company.id}-y`) % 15;
  const base =
    company.sector.toLowerCase().includes("fintech") ||
    company.sector.toLowerCase().includes("connectivity")
      ? 0.52
      : 0.41;
  return clamp(base + (seed - 7) * 0.01, 0.28, 0.65);
}

export function jobsCreatedEstimate(company: PortfolioCompany): number {
  const growthFactor = clamp(company.revenueGrowthPct / 100, 0.04, 0.4);
  const created = Math.round(company.employeeCount * (0.12 + growthFactor * 0.55));
  return Math.max(8, created);
}

export function jobsRetainedEstimate(company: PortfolioCompany): number {
  const retention = company.revenueGrowthPct < 10 ? 0.88 : 0.94;
  return Math.round(company.employeeCount * retention);
}

export function peopleServedEstimate(company: PortfolioCompany): number {
  return Math.round(
    company.employeeCount * sectorPeopleMultiplier(company.sector) * (1 + company.revenueGrowthPct / 200),
  );
}

export function communitiesImpactedEstimate(company: PortfolioCompany): number {
  const base = sectorCommunityBase(company.sector);
  const scale = Math.round(Math.sqrt(company.employeeCount) / 2);
  return Math.max(3, base + scale + (hashSeed(company.id) % 5));
}

export function economicContributionEstimate(company: PortfolioCompany): number {
  return Math.round(company.annualRevenueUsd * 0.62 + company.employeeCount * 4200);
}

export function impactTrendEstimate(company: PortfolioCompany): HoldingsImpactTrend {
  if (company.revenueGrowthPct >= 18 && company.riskRating !== "Critical") return "Improving";
  if (
    company.revenueGrowthPct < 10 ||
    company.riskRating === "High" ||
    company.riskRating === "Critical"
  ) {
    return "Declining";
  }
  return "Stable";
}

export function buildHoldingsImpactRisks(
  company: PortfolioCompany,
  trend: HoldingsImpactTrend,
): Array<{ id: string; title: string; severity: "Watch" | "Elevated" | "Critical"; detail: string }> {
  const risks: Array<{ id: string; title: string; severity: "Watch" | "Elevated" | "Critical"; detail: string }> =
    [];
  if (trend === "Declining") {
    risks.push({
      id: `${company.id}-emp`,
      title: "Declining employment momentum",
      severity: company.riskRating === "Critical" ? "Critical" : "Elevated",
      detail: `${company.name} shows softer hiring and retention signals versus prior period.`,
    });
  }
  if (company.compliancePct < 80) {
    risks.push({
      id: `${company.id}-target`,
      title: "Missed impact reporting cadence",
      severity: "Watch",
      detail: `Impact data quality is uneven (compliance ${company.compliancePct}%). Community and jobs figures need a cleaner quarterly submission before board pack lock.`,
    });
  }
  if (risks.length === 0) {
    risks.push({
      id: `${company.id}-watch`,
      title: "Maintain impact measurement discipline",
      severity: "Watch",
      detail: `Continue monthly jobs and beneficiary tracking so Talanton can defend impact claims in LP reporting.`,
    });
  }
  return risks.slice(0, 3);
}

export function buildHoldingsImpactOpportunities(
  company: PortfolioCompany,
): Array<{ id: string; title: string; detail: string }> {
  const opportunities = [
    {
      id: `${company.id}-opp-1`,
      title: "Deepen youth pathways",
      detail: `Partner with local TVET programmes in ${company.city} to lift youth employment while supporting ${company.sector.toLowerCase()} skills.`,
    },
    {
      id: `${company.id}-opp-2`,
      title: "Women’s economic participation",
      detail: `Structured advancement and supplier inclusion for women-owned MSMEs can raise both impact score and operational resilience.`,
    },
  ];
  return opportunities.slice(0, 3);
}
