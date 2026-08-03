/**
 * Talanton Funds — illustrative demonstration data only.
 * All LP / investor records are fictional. No real Talanton investors are represented.
 */

import { TALANTON_PORTFOLIO_COMPANIES } from "@/lib/talanton/portfolio-data";

export const FUNDS_SAMPLE_DISCLAIMER =
  "Investor records displayed in this environment are illustrative sample data for demonstration purposes only and do not represent actual Talanton investors, LPs, commitments, ownership records, or fund participants.";

export type FundId = "impact" | "momentum" | "stewards";
export type FundStatus = "Investing" | "Deploying" | "Harvesting";
export type InvestorType =
  | "Family Office"
  | "Foundation"
  | "Faith-Based Investor"
  | "Donor Advised Fund"
  | "Private Investor"
  | "Institutional Investor";

export type FundInvestor = {
  id: string;
  name: string;
  type: InvestorType;
  country: string;
  commitmentUsd: number;
  capitalCalledUsd: number;
  remainingCommitmentUsd: number;
  joinedDate: string;
};

export type FundPortfolioCompany = {
  id: string;
  company: string;
  country: string;
  sector: string;
  investmentStatus: "Active" | "Follow-on" | "Exited" | "Pipeline";
  impactRating: "A" | "B" | "C";
};

export type FundDocument = {
  id: string;
  title: string;
  category: string;
  updatedAt: string;
};

export type FundDefinition = {
  id: FundId;
  name: string;
  shortName: string;
  fundSizeUsd: number;
  investorCount: number;
  portfolioCompanyCount: number;
  deploymentPct: number;
  capitalRaisedUsd: number;
  capitalDeployedUsd: number;
  availableCapitalUsd: number;
  countries: number;
  status: FundStatus;
  summary: string;
  impactMetrics: Array<{ label: string; value: string }>;
  investors: FundInvestor[];
  portfolio: FundPortfolioCompany[];
  documents: FundDocument[];
  sectorAllocation: Array<{ label: string; pct: number }>;
  countryAllocation: Array<{ label: string; pct: number }>;
  deploymentTrend: Array<{ period: string; deployedUsdM: number }>;
  fundGrowth: Array<{ period: string; navUsdM: number }>;
};

export type FundsPlatformOverview = {
  totalFunds: number;
  totalInvestors: number;
  capitalRaisedUsd: number;
  capitalDeployedUsd: number;
  availableCapitalUsd: number;
  portfolioCompanies: number;
  countriesRepresented: number;
};

export type FundAiBriefing = {
  performanceSummary: string;
  portfolioHighlights: string;
  impactHighlights: string;
  risks: string;
  recommendations: string;
  fullText: string;
};

function usd(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

export function formatFundUsd(n: number) {
  return usd(n);
}

const INVESTOR_SEED: Array<Omit<FundInvestor, "id" | "remainingCommitmentUsd">> = [
  { name: "Northbridge Family Office", type: "Family Office", country: "United Kingdom", commitmentUsd: 4_200_000, capitalCalledUsd: 3_360_000, joinedDate: "2019-03-12" },
  { name: "Kingdom Capital Partners", type: "Faith-Based Investor", country: "United States", commitmentUsd: 3_800_000, capitalCalledUsd: 2_850_000, joinedDate: "2019-06-04" },
  { name: "Stewardship Impact Foundation", type: "Foundation", country: "Netherlands", commitmentUsd: 2_500_000, capitalCalledUsd: 2_000_000, joinedDate: "2019-09-18" },
  { name: "Covenant Growth Fund", type: "Faith-Based Investor", country: "Canada", commitmentUsd: 2_100_000, capitalCalledUsd: 1_680_000, joinedDate: "2020-01-22" },
  { name: "Oakridge DAF", type: "Donor Advised Fund", country: "United States", commitmentUsd: 1_250_000, capitalCalledUsd: 875_000, joinedDate: "2020-04-09" },
  { name: "Evergreen Family Partners", type: "Family Office", country: "Switzerland", commitmentUsd: 5_000_000, capitalCalledUsd: 4_000_000, joinedDate: "2020-07-15" },
  { name: "Meridian Faith Ventures", type: "Faith-Based Investor", country: "Australia", commitmentUsd: 1_800_000, capitalCalledUsd: 1_440_000, joinedDate: "2020-10-01" },
  { name: "Harbourlight Foundation", type: "Foundation", country: "United Kingdom", commitmentUsd: 3_200_000, capitalCalledUsd: 2_560_000, joinedDate: "2021-02-11" },
  { name: "Cedar & Oak Family Office", type: "Family Office", country: "Singapore", commitmentUsd: 2_750_000, capitalCalledUsd: 2_062_500, joinedDate: "2021-05-20" },
  { name: "Gracefield Institutional Trust", type: "Institutional Investor", country: "Germany", commitmentUsd: 6_500_000, capitalCalledUsd: 5_200_000, joinedDate: "2021-08-03" },
  { name: "Beacon Donor Advised Fund", type: "Donor Advised Fund", country: "United States", commitmentUsd: 900_000, capitalCalledUsd: 720_000, joinedDate: "2021-11-16" },
  { name: "Horizon Private Capital LLC", type: "Private Investor", country: "United States", commitmentUsd: 1_100_000, capitalCalledUsd: 770_000, joinedDate: "2022-01-28" },
  { name: "Silverstream Family Holdings", type: "Family Office", country: "United Arab Emirates", commitmentUsd: 2_400_000, capitalCalledUsd: 1_920_000, joinedDate: "2022-03-14" },
  { name: "Pathway Impact Foundation", type: "Foundation", country: "Sweden", commitmentUsd: 1_600_000, capitalCalledUsd: 1_280_000, joinedDate: "2022-06-07" },
  { name: "Cornerstone Faith Investors", type: "Faith-Based Investor", country: "South Africa", commitmentUsd: 1_350_000, capitalCalledUsd: 1_080_000, joinedDate: "2022-09-21" },
  { name: "Lakeshore DAF Collective", type: "Donor Advised Fund", country: "Canada", commitmentUsd: 750_000, capitalCalledUsd: 525_000, joinedDate: "2022-12-05" },
  { name: "Atlas Institutional Partners", type: "Institutional Investor", country: "France", commitmentUsd: 4_800_000, capitalCalledUsd: 3_840_000, joinedDate: "2023-02-17" },
  { name: "Willowbrook Private Office", type: "Private Investor", country: "United Kingdom", commitmentUsd: 650_000, capitalCalledUsd: 455_000, joinedDate: "2023-04-30" },
  { name: "Summitridge Family Office", type: "Family Office", country: "Norway", commitmentUsd: 2_900_000, capitalCalledUsd: 2_320_000, joinedDate: "2023-07-12" },
  { name: "Newday Stewardship Trust", type: "Faith-Based Investor", country: "New Zealand", commitmentUsd: 1_050_000, capitalCalledUsd: 840_000, joinedDate: "2023-09-25" },
  { name: "Riverstone Impact Foundation", type: "Foundation", country: "Denmark", commitmentUsd: 2_200_000, capitalCalledUsd: 1_760_000, joinedDate: "2023-11-08" },
  { name: "Clearwater DAF", type: "Donor Advised Fund", country: "United States", commitmentUsd: 580_000, capitalCalledUsd: 406_000, joinedDate: "2024-01-19" },
  { name: "Pinnacle Private Investors", type: "Private Investor", country: "Ireland", commitmentUsd: 820_000, capitalCalledUsd: 574_000, joinedDate: "2024-03-06" },
  { name: "Ironwood Institutional Fund", type: "Institutional Investor", country: "Japan", commitmentUsd: 3_600_000, capitalCalledUsd: 2_520_000, joinedDate: "2024-05-22" },
  { name: "Fairhaven Family Partners", type: "Family Office", country: "Belgium", commitmentUsd: 1_950_000, capitalCalledUsd: 1_365_000, joinedDate: "2024-08-14" },
];

function buildInvestors(prefix: string, count: number, scale: number): FundInvestor[] {
  return INVESTOR_SEED.slice(0, count).map((row, index) => {
    const commitmentUsd = Math.round(row.commitmentUsd * scale);
    const capitalCalledUsd = Math.round(row.capitalCalledUsd * scale);
    return {
      id: `${prefix}-lp-${index + 1}`,
      name: row.name,
      type: row.type,
      country: row.country,
      commitmentUsd,
      capitalCalledUsd,
      remainingCommitmentUsd: Math.max(0, commitmentUsd - capitalCalledUsd),
      joinedDate: row.joinedDate,
    };
  });
}

function portfolioSlice(start: number, count: number, statusCycle: FundPortfolioCompany["investmentStatus"][]): FundPortfolioCompany[] {
  const companies = TALANTON_PORTFOLIO_COMPANIES;
  const ratings: Array<"A" | "B" | "C"> = ["A", "A", "B", "A", "B", "C"];
  const out: FundPortfolioCompany[] = [];
  for (let i = 0; i < count; i += 1) {
    const company = companies[(start + i) % companies.length]!;
    out.push({
      id: `${company.id}-slot-${i}`,
      company: company.name,
      country: company.country,
      sector: company.sector,
      investmentStatus: statusCycle[i % statusCycle.length]!,
      impactRating: ratings[i % ratings.length]!,
    });
  }
  return out;
}

function docs(prefix: string): FundDocument[] {
  return [
    { id: `${prefix}-d1`, title: "Limited Partnership Agreement (Sample)", category: "Legal", updatedAt: "2025-11-02" },
    { id: `${prefix}-d2`, title: "Quarterly Investor Report — Q1 2026", category: "Reporting", updatedAt: "2026-04-18" },
    { id: `${prefix}-d3`, title: "ESG & Impact Policy Pack", category: "Impact", updatedAt: "2026-02-09" },
    { id: `${prefix}-d4`, title: "Capital Call Notice — Illustrative", category: "Capital", updatedAt: "2026-03-21" },
    { id: `${prefix}-d5`, title: "Portfolio Valuation Memo (Sample)", category: "Valuation", updatedAt: "2026-05-12" },
  ];
}

export const FUNDS_PLATFORM_OVERVIEW: FundsPlatformOverview = {
  totalFunds: 3,
  totalInvestors: 127,
  capitalRaisedUsd: 60_800_000,
  capitalDeployedUsd: 47_200_000,
  availableCapitalUsd: 13_600_000,
  portfolioCompanies: 18,
  countriesRepresented: 12,
};

export const TALANTON_FUNDS: Record<FundId, FundDefinition> = {
  impact: {
    id: "impact",
    name: "Impact Fund",
    shortName: "Impact",
    fundSizeUsd: 60_800_000,
    investorCount: 103,
    portfolioCompanyCount: 18,
    deploymentPct: 78,
    capitalRaisedUsd: 60_800_000,
    capitalDeployedUsd: 47_424_000,
    availableCapitalUsd: 13_376_000,
    countries: 12,
    status: "Investing",
    summary:
      "Flagship faith-aligned impact vehicle focused on East African growth companies across agriculture, healthcare, clean energy, fintech inclusion, and manufacturing. Illustrative demonstration portfolio only.",
    impactMetrics: [
      { label: "Jobs Supported", value: "4,820" },
      { label: "Smallholders Reached", value: "128K" },
      { label: "tCO₂e Avoided (est.)", value: "62K" },
      { label: "Women in Leadership", value: "41%" },
    ],
    investors: buildInvestors("impact", 25, 1),
    portfolio: portfolioSlice(0, 18, ["Active", "Active", "Follow-on", "Active", "Pipeline"]),
    documents: docs("impact"),
    sectorAllocation: [
      { label: "Agriculture & Food", pct: 22 },
      { label: "Healthcare & Pharma", pct: 16 },
      { label: "Clean Energy", pct: 14 },
      { label: "Fintech & Inclusion", pct: 12 },
      { label: "Manufacturing", pct: 18 },
      { label: "Other", pct: 18 },
    ],
    countryAllocation: [
      { label: "Kenya", pct: 38 },
      { label: "Uganda", pct: 16 },
      { label: "Ethiopia", pct: 10 },
      { label: "Rwanda", pct: 8 },
      { label: "Ghana", pct: 8 },
      { label: "Other", pct: 20 },
    ],
    deploymentTrend: [
      { period: "2023", deployedUsdM: 28.4 },
      { period: "2024", deployedUsdM: 36.1 },
      { period: "2025", deployedUsdM: 42.8 },
      { period: "2026 YTD", deployedUsdM: 47.4 },
    ],
    fundGrowth: [
      { period: "2023", navUsdM: 41.2 },
      { period: "2024", navUsdM: 49.6 },
      { period: "2025", navUsdM: 56.3 },
      { period: "2026 YTD", navUsdM: 60.8 },
    ],
  },
  momentum: {
    id: "momentum",
    name: "Momentum Fund",
    shortName: "Momentum",
    fundSizeUsd: 35_000_000,
    investorCount: 54,
    portfolioCompanyCount: 11,
    deploymentPct: 71,
    capitalRaisedUsd: 35_000_000,
    capitalDeployedUsd: 24_850_000,
    availableCapitalUsd: 10_150_000,
    countries: 8,
    status: "Deploying",
    summary:
      "Growth-oriented companion fund targeting later-stage portfolio companies with proven commercial traction and measurable impact outcomes. Sample data for demonstration.",
    impactMetrics: [
      { label: "Jobs Supported", value: "2,140" },
      { label: "Customers Served", value: "910K" },
      { label: "Revenue Growth (median)", value: "19%" },
      { label: "Follow-on Ready", value: "6 cos" },
    ],
    investors: buildInvestors("momentum", 20, 0.55),
    portfolio: portfolioSlice(3, 11, ["Active", "Follow-on", "Active", "Active"]),
    documents: docs("momentum"),
    sectorAllocation: [
      { label: "Fintech & Inclusion", pct: 24 },
      { label: "Connectivity", pct: 18 },
      { label: "Healthcare", pct: 16 },
      { label: "Mobility", pct: 14 },
      { label: "Manufacturing", pct: 14 },
      { label: "Other", pct: 14 },
    ],
    countryAllocation: [
      { label: "Kenya", pct: 42 },
      { label: "Uganda", pct: 18 },
      { label: "Tanzania", pct: 12 },
      { label: "Ethiopia", pct: 10 },
      { label: "Other", pct: 18 },
    ],
    deploymentTrend: [
      { period: "2023", deployedUsdM: 12.1 },
      { period: "2024", deployedUsdM: 17.6 },
      { period: "2025", deployedUsdM: 22.4 },
      { period: "2026 YTD", deployedUsdM: 24.9 },
    ],
    fundGrowth: [
      { period: "2023", navUsdM: 18.4 },
      { period: "2024", navUsdM: 25.2 },
      { period: "2025", navUsdM: 31.1 },
      { period: "2026 YTD", navUsdM: 35.0 },
    ],
  },
  stewards: {
    id: "stewards",
    name: "Stewards Fund",
    shortName: "Stewards",
    fundSizeUsd: 18_000_000,
    investorCount: 29,
    portfolioCompanyCount: 8,
    deploymentPct: 63,
    capitalRaisedUsd: 18_000_000,
    capitalDeployedUsd: 11_340_000,
    availableCapitalUsd: 6_660_000,
    countries: 6,
    status: "Deploying",
    summary:
      "Stewardship-focused vehicle designed for mission-aligned LPs seeking disciplined capital deployment into values-driven African enterprises. Illustrative only.",
    impactMetrics: [
      { label: "Jobs Supported", value: "980" },
      { label: "Community Programmes", value: "34" },
      { label: "Governance Score", value: "B+" },
      { label: "Training Completion", value: "76%" },
    ],
    investors: buildInvestors("stewards", 15, 0.32),
    portfolio: portfolioSlice(8, 8, ["Active", "Active", "Pipeline", "Follow-on"]),
    documents: docs("stewards"),
    sectorAllocation: [
      { label: "Agriculture & Food", pct: 28 },
      { label: "Forestry & Climate", pct: 16 },
      { label: "Healthcare", pct: 14 },
      { label: "Apparel", pct: 14 },
      { label: "Energy", pct: 12 },
      { label: "Other", pct: 16 },
    ],
    countryAllocation: [
      { label: "Kenya", pct: 34 },
      { label: "Uganda", pct: 22 },
      { label: "Burundi", pct: 12 },
      { label: "Rwanda", pct: 12 },
      { label: "Other", pct: 20 },
    ],
    deploymentTrend: [
      { period: "2023", deployedUsdM: 4.8 },
      { period: "2024", deployedUsdM: 7.6 },
      { period: "2025", deployedUsdM: 9.9 },
      { period: "2026 YTD", deployedUsdM: 11.3 },
    ],
    fundGrowth: [
      { period: "2023", navUsdM: 9.2 },
      { period: "2024", navUsdM: 12.8 },
      { period: "2025", navUsdM: 15.6 },
      { period: "2026 YTD", navUsdM: 18.0 },
    ],
  },
};

export const FUND_VIEW_TO_ID: Record<string, FundId> = {
  "funds-impact": "impact",
  "funds-momentum": "momentum",
  "funds-stewards": "stewards",
};

export function getTalantonFund(id: FundId): FundDefinition {
  return TALANTON_FUNDS[id];
}

export function listTalantonFunds(): FundDefinition[] {
  return [TALANTON_FUNDS.impact, TALANTON_FUNDS.momentum, TALANTON_FUNDS.stewards];
}

export function buildFundAiBriefing(fund: FundDefinition): FundAiBriefing {
  const topSectors = fund.sectorAllocation
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((s) => `${s.label} (${s.pct}%)`)
    .join(", ");
  const topCountries = fund.countryAllocation
    .slice()
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 3)
    .map((c) => `${c.label} (${c.pct}%)`)
    .join(", ");
  const highlights = fund.portfolio
    .filter((p) => p.impactRating === "A")
    .slice(0, 3)
    .map((p) => p.company)
    .join(", ");

  const performanceSummary = `${fund.name} is an illustrative ${formatFundUsd(fund.fundSizeUsd)} vehicle with ${fund.deploymentPct}% capital deployed (${formatFundUsd(fund.capitalDeployedUsd)} of ${formatFundUsd(fund.capitalRaisedUsd)} raised). Available dry powder stands at ${formatFundUsd(fund.availableCapitalUsd)}. Status: ${fund.status}. This summary is demonstration content only.`;

  const portfolioHighlights = `Portfolio coverage spans ${fund.portfolioCompanyCount} companies across ${fund.countries} countries. Leading sector exposures: ${topSectors}. Geographic concentration leaders: ${topCountries}. Stand-out impact-rated holdings in this sample set include ${highlights || "selected active positions"}.`;

  const impactHighlights = fund.impactMetrics.map((m) => `${m.label}: ${m.value}`).join(" · ");

  const risks = [
    `FX and macro volatility across East African operating markets could pressure portfolio valuations in the near term.`,
    `Deployment at ${fund.deploymentPct}% leaves ${formatFundUsd(fund.availableCapitalUsd)} undeployed — pacing risk if quality pipeline slows.`,
    `Concentration in Kenya (${fund.countryAllocation.find((c) => c.label === "Kenya")?.pct ?? "—"}% of sample allocation) warrants active diversification monitoring.`,
    `Illustrative governance and reporting cadence must remain disciplined as the sample portfolio matures.`,
  ].join(" ");

  const recommendations = [
    `Prioritise follow-on diligence on A-rated holdings with clear commercial traction.`,
    `Advance 1–2 diversification opportunities outside the top country concentration over the next two quarters.`,
    `Maintain LP reporting cadence with impact KPIs alongside financials for steward-aligned capital.`,
    `Use remaining dry powder selectively for resilience and governance upgrades rather than purely opportunistic expansion.`,
  ].join(" ");

  const fullText = [
    `${fund.name} — AI Fund Briefing (Sample)`,
    "",
    "Performance summary",
    performanceSummary,
    "",
    "Portfolio highlights",
    portfolioHighlights,
    "",
    "Impact highlights",
    impactHighlights,
    "",
    "Risks",
    risks,
    "",
    "Recommendations",
    recommendations,
    "",
    FUNDS_SAMPLE_DISCLAIMER,
  ].join("\n");

  return {
    performanceSummary,
    portfolioHighlights,
    impactHighlights,
    risks,
    recommendations,
    fullText,
  };
}
