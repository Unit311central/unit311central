/**
 * Talanton Quarterly Portfolio Update V2 — 12-page executive publication.
 * Assembled from real portfolio, impact, journey and opportunity data.
 * Not a board deck, governance pack, or dashboard export.
 */

import { buildPortfolioImpactBriefing, buildCompanyImpactProfile } from "@/lib/talanton/impact-intelligence";
import { listPublishedJourneyStories } from "@/lib/talanton/journey-stories-store";
import { listApprovedStoriesForNewsletter } from "@/lib/talanton/marketing-stories-store";
import { buildOpportunityBriefing } from "@/lib/talanton/opportunity-intelligence";
import {
  formatUsd,
  TALANTON_PORTFOLIO_COMPANIES,
} from "@/lib/talanton/portfolio-data";

type Listener = () => void;

export type QuarterlyUpdateStatus = "Draft" | "Generated" | "Published" | "Archived";

export type QuarterlyPeriod = {
  year: number;
  quarter: 1 | 2 | 3 | 4;
};

export type PortfolioOverviewRow = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  shortDescription: string;
  whatTheyDo: string;
};

export type ChartPoint = {
  label: string;
  value: number;
};

export type FeaturedImpactStory = {
  companyName: string;
  country: string;
  sector: string;
  narrative: string;
  imageUrl: string;
  metricLabel: string;
  metricValue: string;
};

export type JourneyHighlightBlock = {
  title: string;
  country: string;
  companies: string[];
  photoUrls: string[];
  observations: string;
  lessons: string;
};

export type HighlightCard = {
  companyName: string;
  country: string;
  sector: string;
  achievement: string;
  kind: "Milestone" | "Partnership" | "Award" | "Growth";
};

export type QuarterlyPortfolioUpdate = {
  id: string;
  title: string;
  period: QuarterlyPeriod;
  status: QuarterlyUpdateStatus;
  createdAt: string;
  updatedAt: string;
  reportDate: string;
  heroImageUrl: string;

  /** Page 2 — Executive Summary */
  executiveSummary: {
    quarterHighlights: string[];
    keyPortfolioDevelopments: string[];
    keyImpactAchievements: string[];
    portfolioFocusAreas: string[];
    lookingAhead: string[];
  };

  /** Page 3 — Portfolio Overview */
  portfolioOverview: {
    rows: PortfolioOverviewRow[];
  };

  /** Page 4 — Portfolio Performance (meaningful metrics only) */
  performance: {
    revenueGrowthPct: number;
    employmentGrowthPct: number;
    newCustomersServed: number;
    capitalRaisedByPortfolioUsd: number;
    revenueBySector: ChartPoint[];
    employmentByCountry: ChartPoint[];
  };

  /** Page 5 — New Investments & Portfolio Changes */
  portfolioChanges: {
    newInvestments: string[];
    additionalInvestments: string[];
    portfolioChanges: string[];
    summary: string;
  };

  /** Page 6 — Impact Overview */
  impact: {
    jobsCreated: number;
    jobsRetained: number;
    womenEmployed: number;
    youthEmployed: number;
    communitiesImpacted: number;
    jobsBySector: ChartPoint[];
  };

  /** Page 7 — Featured Impact Story */
  featuredStory: FeaturedImpactStory;

  /** Page 8 — Journey Highlights */
  journeys: {
    countriesVisited: string[];
    companiesVisited: string[];
    blocks: JourneyHighlightBlock[];
    gallery: Array<{ url: string; caption: string }>;
  };

  /** Page 9 — Portfolio Highlights */
  portfolioHighlights: HighlightCard[];

  /** Page 10 — Opportunity Intelligence */
  opportunity: {
    observations: string[];
    emerging: string[];
    recommendedFocus: string[];
  };

  /** Page 11 — Strategic Outlook */
  outlook: {
    management: string[];
    portfolio: string[];
    impact: string[];
  };

  /** Page 12 — Closing Summary */
  closing: {
    statement: string;
  };
};

export type QuarterlyPortfolioUpdateState = {
  reports: QuarterlyPortfolioUpdate[];
};

export function periodLabel(period: QuarterlyPeriod): string {
  return `Q${period.quarter} ${period.year}`;
}

function formatReportDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso.slice(0, 10);
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function shortWhatTheyDo(overview: string, sector: string, city: string, country: string): string {
  const first = overview.split(/(?<=[.!?])\s+/)[0]?.trim();
  if (first && first.length > 40 && first.length < 180) return first;
  return `${sector} operator based in ${city}, ${country}.`;
}

function shortDescription(sector: string, country: string): string {
  return `${sector} · ${country}`;
}

const HERO = {
  q1: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1800&q=80",
  q2: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1800&q=80",
  q3: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1800&q=80",
  q4: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?auto=format&fit=crop&w=1800&q=80",
};

export function assembleQuarterlyPortfolioUpdate(input: {
  id?: string;
  period: QuarterlyPeriod;
  status?: QuarterlyUpdateStatus;
}): QuarterlyPortfolioUpdate {
  const companies = [...TALANTON_PORTFOLIO_COMPANIES];
  const briefing = buildPortfolioImpactBriefing();
  const opportunity = buildOpportunityBriefing();
  const journeys = listPublishedJourneyStories().slice(0, 4);
  const stories = listApprovedStoriesForNewsletter();
  const period = periodLabel(input.period);
  const now = new Date().toISOString();
  const q = input.period.quarter;

  const heroImageUrl =
    q === 1 ? HERO.q1 : q === 2 ? HERO.q2 : q === 3 ? HERO.q3 : HERO.q4;

  const countries = [...new Set(companies.map((c) => c.country))].sort();
  const avgGrowth =
    companies.reduce((s, c) => s + c.revenueGrowthPct, 0) / Math.max(companies.length, 1);
  const totalEmployees = companies.reduce((s, c) => s + c.employeeCount, 0);
  const priorEmployees = Math.max(1, totalEmployees - briefing.summary.jobsCreated);
  const employmentGrowthPct = Math.round(
    ((totalEmployees - priorEmployees) / priorEmployees) * 100,
  );

  const capitalRaisedByPortfolioUsd = companies.reduce(
    (s, c) => s + c.investmentAmountUsd,
    0,
  );

  const revenueBySectorMap = new Map<string, number>();
  for (const c of companies) {
    revenueBySectorMap.set(
      c.sector,
      (revenueBySectorMap.get(c.sector) ?? 0) + c.annualRevenueUsd,
    );
  }
  const revenueBySector = [...revenueBySectorMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const employmentByCountryMap = new Map<string, number>();
  for (const c of companies) {
    employmentByCountryMap.set(
      c.country,
      (employmentByCountryMap.get(c.country) ?? 0) + c.employeeCount,
    );
  }
  const employmentByCountry = [...employmentByCountryMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const jobsBySectorMap = new Map<string, number>();
  for (const c of companies) {
    const profile = buildCompanyImpactProfile(c.id);
    jobsBySectorMap.set(
      c.sector,
      (jobsBySectorMap.get(c.sector) ?? 0) + profile.jobsCreated,
    );
  }
  const jobsBySector = [...jobsBySectorMap.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  const overviewRows: PortfolioOverviewRow[] = companies.map((c) => ({
    companyId: c.id,
    companyName: c.name,
    country: c.country,
    sector: c.sector,
    shortDescription: shortDescription(c.sector, c.country),
    whatTheyDo: shortWhatTheyDo(c.overview, c.sector, c.city, c.country),
  }));

  const growthLeaders = [...companies]
    .sort((a, b) => b.revenueGrowthPct - a.revenueGrowthPct)
    .slice(0, 3);
  const watchHoldings = companies.filter((c) => c.riskRating === "High" || c.riskRating === "Critical");

  const featuredSource = stories[0] ?? null;
  const featuredCompany =
    companies.find((c) => c.id === featuredSource?.companyId) ??
    companies.find((c) => c.name === briefing.topCompanies[0]?.companyName) ??
    companies[0]!;
  const featuredProfile = buildCompanyImpactProfile(featuredCompany.id);
  const featuredPhoto =
    journeys.flatMap((j) => j.media).find((m) => m.kind === "photo")?.url ?? HERO.q2;

  const journeyBlocks: JourneyHighlightBlock[] = journeys.map((j) => ({
    title: j.title,
    country: j.country,
    companies: j.companyNames,
    photoUrls: j.media.filter((m) => m.kind === "photo").map((m) => m.url).slice(0, 3),
    observations:
      j.answers.impactWitnessed ||
      j.generated.impactHighlights ||
      "Field visit confirmed operating progress and community outcomes.",
    lessons:
      j.answers.companyProgress ||
      j.answers.encouragedMost ||
      "Founder partnership and measured impact remain the strongest stewardship signals.",
  }));

  const gallery = journeys
    .flatMap((j) =>
      j.media
        .filter((m) => m.kind === "photo")
        .map((m) => ({ url: m.url, caption: `${m.caption} · ${j.country}` })),
    )
    .slice(0, 6);

  const kinds: HighlightCard["kind"][] = ["Milestone", "Partnership", "Award", "Growth"];
  const portfolioHighlights: HighlightCard[] = briefing.topCompanies.slice(0, 6).map((t, i) => {
    const co = companies.find((c) => c.name === t.companyName);
    return {
      companyName: t.companyName,
      country: t.country,
      sector: t.sector,
      achievement:
        co
          ? `${co.revenueGrowthPct}% revenue growth · ${co.employeeCount.toLocaleString()} employees · ${t.keyImpactMetricLabel}: ${t.keyImpactMetric}`
          : `${t.keyImpactMetricLabel}: ${t.keyImpactMetric}`,
      kind: kinds[i % kinds.length]!,
    };
  });

  return {
    id: input.id ?? `qpu-${Date.now().toString(36)}`,
    title: `Talanton Quarterly Portfolio Update — ${period}`,
    period: input.period,
    status: input.status ?? "Generated",
    createdAt: now,
    updatedAt: now,
    reportDate: formatReportDate(now),
    heroImageUrl,
    executiveSummary: {
      quarterHighlights: [
        `${companies.length} active portfolio companies across ${countries.length} countries.`,
        `Blended portfolio revenue growth of approximately ${Math.round(avgGrowth)}%.`,
        `Portfolio employment base of ${totalEmployees.toLocaleString()} people, with ${briefing.summary.jobsCreated.toLocaleString()} jobs created across holdings.`,
      ],
      keyPortfolioDevelopments: [
        growthLeaders.length
          ? `Strongest commercial momentum: ${growthLeaders.map((c) => `${c.name} (${c.revenueGrowthPct}%)`).join("; ")}.`
          : "Portfolio companies continued measured commercial progress.",
        journeys[0]
          ? `Field stewardship deepened through “${journeys[0].title}” (${journeys[0].country}).`
          : "Investment team maintained active founder engagement across core corridors.",
        featuredSource
          ? `Portfolio storytelling advanced with “${featuredSource.title}” (${featuredSource.companyName}).`
          : "Portfolio Stories continued to evidence community outcomes for stakeholders.",
      ],
      keyImpactAchievements: [
        `${briefing.summary.jobsCreated.toLocaleString()} jobs created and ${briefing.summary.jobsRetained.toLocaleString()} jobs retained.`,
        `${briefing.summary.womenEmployed.toLocaleString()} women and ${briefing.summary.youthEmployed.toLocaleString()} youth in paid employment across the portfolio.`,
        `${briefing.summary.communitiesImpacted.toLocaleString()} communities impacted · ${briefing.summary.peopleServed.toLocaleString()} people served.`,
      ],
      portfolioFocusAreas: [
        ...(watchHoldings.length
          ? [
              `Watch-list attention: ${watchHoldings
                .slice(0, 3)
                .map((c) => c.name)
                .join(", ")}.`,
            ]
          : ["Maintain operating cadence across all holdings."]),
        "Deepen impact measurement discipline ahead of the next reporting cycle.",
        "Continue Journey Stories capture so stakeholders see field evidence.",
      ],
      lookingAhead: [
        "Support top-quartile growth holdings with disciplined follow-on dialogue.",
        "Protect improving employment and community outcomes into the next quarter.",
        "Advance corridor diversification while strengthening founder partnership.",
      ],
    },
    portfolioOverview: {
      rows: overviewRows,
    },
    performance: {
      revenueGrowthPct: Math.round(avgGrowth),
      employmentGrowthPct: Math.max(0, employmentGrowthPct),
      newCustomersServed: briefing.summary.peopleServed,
      capitalRaisedByPortfolioUsd,
      revenueBySector,
      employmentByCountry,
    },
    portfolioChanges: {
      newInvestments: growthLeaders.map(
        (c) => `${c.name} (${c.country}) — priority growth holding · ${c.revenueGrowthPct}% revenue growth`,
      ),
      additionalInvestments: briefing.topCompanies.slice(0, 3).map(
        (t) =>
          `${t.companyName} (${t.country}) — continued stewardship support · ${t.keyImpactMetricLabel}: ${t.keyImpactMetric}`,
      ),
      portfolioChanges: [
        watchHoldings.length
          ? `${watchHoldings.length} holding${watchHoldings.length === 1 ? "" : "s"} on elevated risk watch this quarter.`
          : "No elevated risk exits or restructurings recorded this quarter.",
        `Active portfolio remains ${companies.length} companies across ${countries.join(", ")}.`,
      ],
      summary: `${period} portfolio activity centred on strengthening growth holdings, maintaining founder partnership, and addressing watch-list companies. Capital stewardship remained focused on operating quality and measurable community outcomes rather than speculative expansion.`,
    },
    impact: {
      jobsCreated: briefing.summary.jobsCreated,
      jobsRetained: briefing.summary.jobsRetained,
      womenEmployed: briefing.summary.womenEmployed,
      youthEmployed: briefing.summary.youthEmployed,
      communitiesImpacted: briefing.summary.communitiesImpacted,
      jobsBySector,
    },
    featuredStory: {
      companyName: featuredSource?.companyName ?? featuredCompany.name,
      country: featuredSource?.country ?? featuredCompany.country,
      sector: featuredCompany.sector,
      narrative:
        featuredSource?.fullStory?.slice(0, 720) ||
        featuredSource?.summary ||
        `${featuredCompany.name} continues to demonstrate how patient capital and founder partnership translate into dignified work and community outcomes in ${featuredCompany.country}. ${featuredProfile.aiSummary}`,
      imageUrl: featuredPhoto,
      metricLabel: featuredProfile.keyImpactMetricLabel,
      metricValue: featuredProfile.keyImpactMetric,
    },
    journeys: {
      countriesVisited: [...new Set(journeys.map((j) => j.country))],
      companiesVisited: [...new Set(journeys.flatMap((j) => j.companyNames))],
      blocks: journeyBlocks,
      gallery,
    },
    portfolioHighlights,
    opportunity: {
      observations: opportunity.emergingOpportunities.slice(0, 4),
      emerging: opportunity.sectors.slice(0, 4).map((s) => `${s.sector}: ${s.growthOutlook}`),
      recommendedFocus: opportunity.recommendedActions
        .slice(0, 4)
        .map((a) => `${a.title} — ${a.owner}`),
    },
    outlook: {
      management: [
        "Maintain disciplined founder engagement and reporting cadence.",
        "Prioritise holdings where commercial traction and community outcomes reinforce each other.",
      ],
      portfolio: [
        `Support ${growthLeaders[0]?.name ?? "leading holdings"} and peers with the strongest growth trajectories.`,
        watchHoldings.length
          ? `Stabilise watch-list companies before expanding new commitments.`
          : "Protect portfolio quality while assessing selective growth opportunities.",
      ],
      impact: [
        "Keep jobs, women and youth employment, and community reach at the centre of portfolio reviews.",
        "Use Journey Stories to evidence impact for investors and board stakeholders.",
      ],
    },
    closing: {
      statement: [
        `${period} confirms Talanton’s stewardship of ${companies.length} portfolio companies across ${countries.length} countries.`,
        `The portfolio continues to advance dignified work and community flourishing — ${briefing.summary.jobsCreated.toLocaleString()} jobs created, ${briefing.summary.communitiesImpacted.toLocaleString()} communities impacted, and ${briefing.summary.peopleServed.toLocaleString()} people served.`,
        `We close this quarter grateful for our founders, investors and partners, and committed to patient capital that serves communities first.`,
        `Talanton Impact`,
      ].join("\n\n"),
    },
  };
}

function seedReports(): QuarterlyPortfolioUpdate[] {
  const dates = [
    ["2026-04-08T10:00:00.000Z", "2026-04-10T10:00:00.000Z"],
    ["2026-07-09T10:00:00.000Z", "2026-07-12T10:00:00.000Z"],
    ["2026-10-07T10:00:00.000Z", "2026-10-09T10:00:00.000Z"],
  ] as const;
  const statuses: QuarterlyUpdateStatus[] = ["Published", "Published", "Generated"];
  return ([1, 2, 3] as const).map((quarter, i) => {
    const report = assembleQuarterlyPortfolioUpdate({
      id: `qpu-2026-q${quarter}`,
      period: { year: 2026, quarter },
      status: statuses[i],
    });
    return {
      ...report,
      createdAt: dates[i]![0],
      updatedAt: dates[i]![1],
      reportDate: formatReportDate(dates[i]![1]),
    };
  });
}

const listeners = new Set<Listener>();
let state: QuarterlyPortfolioUpdateState = { reports: seedReports() };

function emit() {
  for (const l of listeners) l();
}

export function subscribeQuarterlyPortfolioUpdates(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getQuarterlyPortfolioUpdatesSnapshot(): QuarterlyPortfolioUpdateState {
  return state;
}

export function listQuarterlyPortfolioUpdates(): QuarterlyPortfolioUpdate[] {
  return state.reports
    .slice()
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function getQuarterlyPortfolioUpdate(id: string): QuarterlyPortfolioUpdate | undefined {
  return state.reports.find((r) => r.id === id);
}

export function upsertQuarterlyPortfolioUpdate(
  report: QuarterlyPortfolioUpdate,
): QuarterlyPortfolioUpdate {
  const next = { ...report, updatedAt: new Date().toISOString() };
  const existing = state.reports.find((r) => r.id === next.id);
  state = {
    reports: existing
      ? state.reports.map((r) => (r.id === next.id ? next : r))
      : [next, ...state.reports],
  };
  emit();
  return next;
}

export function createQuarterlyPortfolioUpdate(period: QuarterlyPeriod): QuarterlyPortfolioUpdate {
  return upsertQuarterlyPortfolioUpdate(
    assembleQuarterlyPortfolioUpdate({ period, status: "Generated" }),
  );
}

export function duplicateQuarterlyPortfolioUpdate(id: string): QuarterlyPortfolioUpdate | null {
  const src = getQuarterlyPortfolioUpdate(id);
  if (!src) return null;
  const copy: QuarterlyPortfolioUpdate = {
    ...src,
    id: `qpu-${Date.now().toString(36)}`,
    title: `${src.title} (Copy)`,
    status: "Draft",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return upsertQuarterlyPortfolioUpdate(copy);
}

export function deleteQuarterlyPortfolioUpdate(id: string) {
  state = { reports: state.reports.filter((r) => r.id !== id) };
  emit();
}

export function archiveQuarterlyPortfolioUpdate(id: string): QuarterlyPortfolioUpdate | null {
  const src = getQuarterlyPortfolioUpdate(id);
  if (!src) return null;
  return upsertQuarterlyPortfolioUpdate({ ...src, status: "Archived" });
}

export function regenerateQuarterlyPortfolioUpdate(id: string): QuarterlyPortfolioUpdate | null {
  const src = getQuarterlyPortfolioUpdate(id);
  if (!src) return null;
  const next = assembleQuarterlyPortfolioUpdate({
    id: src.id,
    period: src.period,
    status: src.status === "Archived" ? "Generated" : src.status,
  });
  return upsertQuarterlyPortfolioUpdate({
    ...next,
    createdAt: src.createdAt,
    reportDate: src.reportDate,
  });
}
