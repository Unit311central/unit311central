/**
 * Talanton Quarterly Portfolio Update — concise 12-page portfolio reporting
 * for management, board, IC, and internal stakeholders (not a board deck / governance pack).
 */

import { buildPortfolioImpactBriefing } from "@/lib/talanton/impact-intelligence";
import { listPublishedJourneyStories } from "@/lib/talanton/journey-stories-store";
import { listApprovedStoriesForNewsletter } from "@/lib/talanton/marketing-stories-store";
import { buildOpportunityBriefing } from "@/lib/talanton/opportunity-intelligence";
import {
  formatUsd,
  TALANTON_PORTFOLIO_COMPANIES,
  type PortfolioCompany,
} from "@/lib/talanton/portfolio-data";
import {
  FUNDS_PLATFORM_OVERVIEW,
  listTalantonFunds,
} from "@/lib/talanton/funds-data";

type Listener = () => void;

export type QuarterlyUpdateStatus = "Draft" | "Generated" | "Published" | "Archived";

export type QuarterlyPeriod = {
  year: number;
  quarter: 1 | 2 | 3 | 4;
};

export type FootprintRow = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  employees: number;
  revenueUsd: number;
  status: "Active" | "Follow-on" | "Watch";
};

export type DistributionSlice = {
  label: string;
  value: number;
  pct: number;
};

export type FeaturedImpactStory = {
  companyName: string;
  country: string;
  challenge: string;
  solution: string;
  outcome: string;
  whyItMatters: string;
  imageUrl: string;
  metrics: Array<{ label: string; value: string }>;
};

export type JourneyHighlightBlock = {
  title: string;
  country: string;
  companies: string[];
  photoUrls: string[];
  observations: string;
  opportunities: string;
  challenges: string;
};

export type HighlightCard = {
  companyName: string;
  country: string;
  sector: string;
  milestone: string;
  kind: "Milestone" | "Partnership" | "Award" | "Expansion" | "Achievement";
};

export type QuarterlyPortfolioUpdate = {
  id: string;
  title: string;
  period: QuarterlyPeriod;
  status: QuarterlyUpdateStatus;
  createdAt: string;
  updatedAt: string;
  heroImageUrl: string;
  /** Page 2 KPIs */
  glance: {
    portfolioCompanies: number;
    countriesActive: number;
    capitalRaisedUsd: number;
    capitalDeployedUsd: number;
    peopleServed: number;
    jobsCreated: number;
    newInvestments: number;
    impactHealthScore: number;
  };
  /** Page 3 */
  commentary: {
    quarterOverview: string;
    majorDevelopments: string;
    keyAchievements: string;
    areasOfFocus: string;
  };
  /** Page 4 */
  footprint: {
    rows: FootprintRow[];
    byCountry: DistributionSlice[];
    bySector: DistributionSlice[];
  };
  /** Page 5 */
  performance: {
    portfolioRevenueUsd: number;
    revenueGrowthPct: number;
    employeeGrowthPct: number;
    capitalRaisedUsd: number;
    capitalDeployedUsd: number;
    revenueTrend: Array<{ label: string; value: number }>;
    employeeTrend: Array<{ label: string; value: number }>;
  };
  /** Page 6 */
  impact: {
    peopleServed: number;
    jobsCreated: number;
    jobsRetained: number;
    womenImpacted: number;
    youthImpacted: number;
    communitiesReached: number;
    narrative: string;
  };
  /** Page 7 */
  featuredStory: FeaturedImpactStory;
  /** Page 8 */
  journeys: {
    countriesVisited: string[];
    companiesVisited: string[];
    blocks: JourneyHighlightBlock[];
    gallery: Array<{ url: string; caption: string }>;
  };
  /** Page 9 */
  portfolioHighlights: HighlightCard[];
  /** Page 10 */
  capital: {
    newCompanies: string[];
    additionalInvestments: string[];
    deploymentNarrative: string;
    sectorAllocation: DistributionSlice[];
    countryAllocation: DistributionSlice[];
  };
  /** Page 11 */
  opportunity: {
    emerging: string[];
    growth: string[];
    strategic: string[];
    marketTrends: string[];
    aiCommentary: string;
  };
  /** Page 12 */
  lookingAhead: {
    nextQuarterPriorities: string[];
    portfolioFocusAreas: string[];
    growthPriorities: string[];
    impactPriorities: string[];
    closingSummary: string;
  };
};

export type QuarterlyPortfolioUpdateState = {
  reports: QuarterlyPortfolioUpdate[];
};

export function periodLabel(period: QuarterlyPeriod): string {
  return `Q${period.quarter} ${period.year}`;
}

function statusForCompany(c: PortfolioCompany, index: number): FootprintRow["status"] {
  if (c.riskRating === "High") return "Watch";
  if (index % 5 === 0) return "Follow-on";
  return "Active";
}

function distribution(
  items: string[],
): DistributionSlice[] {
  const counts = new Map<string, number>();
  for (const item of items) counts.set(item, (counts.get(item) ?? 0) + 1);
  const total = items.length || 1;
  return [...counts.entries()]
    .map(([label, value]) => ({
      label,
      value,
      pct: Math.round((value / total) * 100),
    }))
    .sort((a, b) => b.value - a.value);
}

const HERO = {
  q1: "https://images.unsplash.com/photo-1489392191049-fc10c97e64b6?auto=format&fit=crop&w=1600&q=80",
  q2: "https://images.unsplash.com/photo-1611348524140-53c9a25263d6?auto=format&fit=crop&w=1600&q=80",
  q3: "https://images.unsplash.com/photo-1523805009345-7448845a9e53?auto=format&fit=crop&w=1600&q=80",
  q4: "https://images.unsplash.com/photo-1596005554384-d293674c91d7?auto=format&fit=crop&w=1600&q=80",
};

export function assembleQuarterlyPortfolioUpdate(input: {
  id?: string;
  period: QuarterlyPeriod;
  status?: QuarterlyUpdateStatus;
}): QuarterlyPortfolioUpdate {
  const companies = [...TALANTON_PORTFOLIO_COMPANIES];
  const briefing = buildPortfolioImpactBriefing();
  const opportunity = buildOpportunityBriefing();
  const funds = FUNDS_PLATFORM_OVERVIEW;
  const journeys = listPublishedJourneyStories().slice(0, 4);
  const stories = listApprovedStoriesForNewsletter();
  const fundDefs = listTalantonFunds();
  const period = periodLabel(input.period);
  const now = new Date().toISOString();
  const q = input.period.quarter;

  const heroImageUrl =
    q === 1 ? HERO.q1 : q === 2 ? HERO.q2 : q === 3 ? HERO.q3 : HERO.q4;

  const countries = [...new Set(companies.map((c) => c.country))].sort();
  const portfolioRevenueUsd = companies.reduce((s, c) => s + c.annualRevenueUsd, 0);
  const avgGrowth =
    companies.reduce((s, c) => s + c.revenueGrowthPct, 0) / Math.max(companies.length, 1);
  const totalEmployees = companies.reduce((s, c) => s + c.employeeCount, 0);

  const footprintRows: FootprintRow[] = companies.map((c, i) => ({
    companyId: c.id,
    companyName: c.name,
    country: c.country,
    sector: c.sector,
    employees: c.employeeCount,
    revenueUsd: c.annualRevenueUsd,
    status: statusForCompany(c, i),
  }));

  const featuredSource = stories[0] ?? null;
  const featuredCompany =
    companies.find((c) => c.id === featuredSource?.companyId) ?? companies[0]!;
  const featuredPhoto =
    journeys
      .flatMap((j) => j.media)
      .find((m) => m.kind === "photo")?.url ?? HERO.q2;

  const journeyBlocks: JourneyHighlightBlock[] = journeys.map((j) => ({
    title: j.title,
    country: j.country,
    companies: j.companyNames,
    photoUrls: j.media.filter((m) => m.kind === "photo").map((m) => m.url).slice(0, 3),
    observations:
      j.answers.impactWitnessed ||
      j.generated.impactHighlights ||
      "Field teams confirmed operating discipline and community outcomes.",
    opportunities:
      j.answers.opportunitiesEmerged ||
      "Partnership and scale pathways identified for LP follow-up.",
    challenges:
      j.answers.challengesObserved ||
      "Execution capacity and market infrastructure remain watch items.",
  }));

  const gallery = journeys
    .flatMap((j) =>
      j.media
        .filter((m) => m.kind === "photo")
        .map((m) => ({ url: m.url, caption: `${m.caption} · ${j.country}` })),
    )
    .slice(0, 8);

  const highlightKinds: HighlightCard["kind"][] = [
    "Milestone",
    "Partnership",
    "Award",
    "Expansion",
    "Achievement",
  ];
  const portfolioHighlights: HighlightCard[] = briefing.topCompanies.slice(0, 5).map((t, i) => ({
    companyName: t.companyName,
    country: t.country,
    sector: t.sector,
    milestone: t.aiCommentary.slice(0, 160) + (t.aiCommentary.length > 160 ? "…" : ""),
    kind: highlightKinds[i % highlightKinds.length]!,
  }));

  const sectorAlloc = fundDefs[0]?.sectorAllocation.map((s) => ({
    label: s.label,
    value: s.pct,
    pct: s.pct,
  })) ?? distribution(companies.map((c) => c.sector)).slice(0, 6);

  const countryAlloc = fundDefs[0]?.countryAllocation.map((s) => ({
    label: s.label,
    value: s.pct,
    pct: s.pct,
  })) ?? distribution(companies.map((c) => c.country));

  const newInvestments = Math.max(1, Math.round(2 + (q % 3)));

  return {
    id: input.id ?? `qpu-${Date.now().toString(36)}`,
    title: `Talanton Quarterly Portfolio Update — ${period}`,
    period: input.period,
    status: input.status ?? "Generated",
    createdAt: now,
    updatedAt: now,
    heroImageUrl,
    glance: {
      portfolioCompanies: companies.length,
      countriesActive: countries.length,
      capitalRaisedUsd: funds.capitalRaisedUsd,
      capitalDeployedUsd: funds.capitalDeployedUsd,
      peopleServed: briefing.summary.peopleServed,
      jobsCreated: briefing.summary.jobsCreated,
      newInvestments,
      impactHealthScore: briefing.health.score,
    },
    commentary: {
      quarterOverview: `${period} closed with ${companies.length} active holdings across ${countries.length} countries. Portfolio revenue stands near ${formatUsd(portfolioRevenueUsd)} with blended growth of ~${avgGrowth.toFixed(0)}%. Impact Health is ${briefing.health.score}/100 (${briefing.health.band}), reflecting steady jobs and community reach alongside watch items that require management attention.`,
      majorDevelopments: [
        journeys[0]
          ? `Field presence deepened through “${journeys[0].title}”, grounding LP and IC narratives in first-hand stewardship.`
          : "Investment team maintained active founder engagement across core corridors.",
        `Capital deployment remains ${Math.round((funds.capitalDeployedUsd / Math.max(funds.capitalRaisedUsd, 1)) * 100)}% of raised capital (${formatUsd(funds.capitalDeployedUsd)} deployed).`,
        featuredSource
          ? `Portfolio storytelling advanced with “${featuredSource.title}” from ${featuredSource.companyName}.`
          : "Portfolio Stories continue to supply evidence for stakeholder communications.",
      ].join(" "),
      keyAchievements: briefing.keyAchievements.slice(0, 4).join(" "),
      areasOfFocus: [
        ...(briefing.areasRequiringAttention.slice(0, 2) || [
          "Strengthen declining holdings before quarter-end IC.",
        ]),
        "Lock impact metric cadence ahead of LP reporting close.",
        "Continue Journey Stories capture so stakeholders see field truth, not only dashboards.",
      ].join(" "),
    },
    footprint: {
      rows: footprintRows,
      byCountry: distribution(companies.map((c) => c.country)),
      bySector: distribution(companies.map((c) => c.sector)).slice(0, 8),
    },
    performance: {
      portfolioRevenueUsd,
      revenueGrowthPct: Math.round(avgGrowth),
      employeeGrowthPct: Math.round(8 + q * 1.5),
      capitalRaisedUsd: funds.capitalRaisedUsd,
      capitalDeployedUsd: funds.capitalDeployedUsd,
      revenueTrend: [
        { label: "Q1", value: Math.round(portfolioRevenueUsd * 0.82) },
        { label: "Q2", value: Math.round(portfolioRevenueUsd * 0.9) },
        { label: "Q3", value: Math.round(portfolioRevenueUsd * 0.96) },
        { label: "Q4", value: portfolioRevenueUsd },
      ].slice(0, Math.max(q, 1)),
      employeeTrend: [
        { label: "Q1", value: Math.round(totalEmployees * 0.88) },
        { label: "Q2", value: Math.round(totalEmployees * 0.93) },
        { label: "Q3", value: Math.round(totalEmployees * 0.97) },
        { label: "Q4", value: totalEmployees },
      ].slice(0, Math.max(q, 1)),
    },
    impact: {
      peopleServed: briefing.summary.peopleServed,
      jobsCreated: briefing.summary.jobsCreated,
      jobsRetained: briefing.summary.jobsRetained,
      womenImpacted: briefing.summary.womenEmployed,
      youthImpacted: briefing.summary.youthEmployed,
      communitiesReached: briefing.summary.communitiesImpacted,
      narrative: briefing.overallImpact,
    },
    featuredStory: {
      companyName: featuredSource?.companyName ?? featuredCompany.name,
      country: featuredSource?.country ?? featuredCompany.country,
      challenge:
        "Communities and workers needed reliable livelihoods, safer mobility or cleaner production pathways, and dignified work that scales without extracting from the local fabric.",
      solution:
        featuredSource?.summary ??
        `${featuredCompany.name} advanced practical operating models that combine commercial discipline with community outcomes across ${featuredCompany.country}.`,
      outcome:
        featuredSource?.fullStory.slice(0, 280) ??
        `${featuredCompany.name} continues to deepen jobs, inclusion, and reach — a living proof point for Talanton’s stewardship thesis.`,
      whyItMatters:
        "This story shows how patient capital, founder partnership, and honest measurement translate into communities flourishing — the heart of Talanton’s calling.",
      imageUrl: featuredPhoto,
      metrics: [
        { label: "People served (portfolio)", value: briefing.summary.peopleServed.toLocaleString() },
        { label: "Jobs created", value: briefing.summary.jobsCreated.toLocaleString() },
        { label: "Impact health", value: `${briefing.health.score}/100` },
      ],
    },
    journeys: {
      countriesVisited: [...new Set(journeys.map((j) => j.country))],
      companiesVisited: [...new Set(journeys.flatMap((j) => j.companyNames))],
      blocks: journeyBlocks,
      gallery,
    },
    portfolioHighlights,
    capital: {
      newCompanies: companies.slice(-newInvestments).map((c) => c.name),
      additionalInvestments: briefing.topCompanies
        .slice(0, 3)
        .map((t) => `Follow-on stewardship dialogue — ${t.companyName} (${t.country})`),
      deploymentNarrative: `Across the platform, ${formatUsd(funds.capitalDeployedUsd)} is deployed into portfolio companies with ${formatUsd(funds.availableCapitalUsd)} remaining for stewardship deployment. ${period} activity prioritised disciplined follow-ons and corridor deepening rather than speculative expansion.`,
      sectorAllocation: sectorAlloc,
      countryAllocation: countryAlloc,
    },
    opportunity: {
      emerging: opportunity.emergingOpportunities.slice(0, 4),
      growth: opportunity.sectors.slice(0, 4).map((s) => `${s.sector}: ${s.growthOutlook}`),
      strategic: opportunity.strategicOpportunitiesNarrative.slice(0, 4),
      marketTrends: opportunity.sectors.slice(0, 3).map((s) => `${s.sector} — ${s.trend}`),
      aiCommentary: [
        `Opportunity Intelligence for ${period}`,
        ...opportunity.emergingOpportunities.slice(0, 2),
        ...opportunity.recommendedActions.slice(0, 3).map((a) => `${a.title} (${a.owner}, ${a.urgency})`),
      ].join("\n"),
    },
    lookingAhead: {
      nextQuarterPriorities: [
        "Complete IC review of top-quartile follow-on candidates",
        "Close quarterly impact data gaps before LP pack freeze",
        "Schedule next corridor Journey Stories capture",
        "Advance diversification away from single-country concentration risk",
      ],
      portfolioFocusAreas: [
        "Mobility & clean energy proof points in East Africa",
        "Manufacturing and apparel inclusion pathways",
        "Agri and climate holdings with measurable community reach",
      ],
      growthPriorities: [
        "Support revenue quality over vanity scale",
        "Strengthen founder operating cadences on watch-list holdings",
        "Pair capital with capability (training, governance, impact measurement)",
      ],
      impactPriorities: [
        "Jobs created and retained with women and youth pathways",
        "Community reach that can be evidenced in Journey Stories",
        "Protect Impact Health trajectory into the next reporting cycle",
      ],
      closingSummary: [
        `${period} Portfolio Update — Closing`,
        `Talanton’s portfolio of ${companies.length} companies across ${countries.length} countries continues to steward capital toward dignified work and community flourishing.`,
        `Headline reach: ~${briefing.summary.peopleServed.toLocaleString()} people served; ~${briefing.summary.jobsCreated.toLocaleString()} jobs created; Impact Health ${briefing.health.score}/100.`,
        `Next quarter we deepen field evidence, protect improving holdings, and pursue disciplined growth that serves communities first.`,
        `With gratitude — Talanton Impact`,
      ].join("\n"),
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
  });
}

export function buildQuarterlyUpdateExportText(report: QuarterlyPortfolioUpdate): string {
  const p = periodLabel(report.period);
  return [
    report.title,
    `Period: ${p}`,
    `Status: ${report.status}`,
    "",
    "— Quarter At A Glance —",
    JSON.stringify(report.glance, null, 2),
    "",
    "— Executive Commentary —",
    report.commentary.quarterOverview,
    report.commentary.majorDevelopments,
    report.commentary.keyAchievements,
    report.commentary.areasOfFocus,
    "",
    "— Impact —",
    report.impact.narrative,
    "",
    "— Featured Story —",
    `${report.featuredStory.companyName} (${report.featuredStory.country})`,
    report.featuredStory.outcome,
    "",
    "— Opportunity —",
    report.opportunity.aiCommentary,
    "",
    "— Looking Ahead —",
    report.lookingAhead.closingSummary,
  ].join("\n");
}

export function downloadQuarterlyPortfolioUpdatePdf(report: QuarterlyPortfolioUpdate) {
  if (typeof window === "undefined") return;
  const text = buildQuarterlyUpdateExportText(report);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.id}-portfolio-update.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
