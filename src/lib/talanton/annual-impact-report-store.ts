/**
 * Talanton Annual Impact Report — flagship investor/board-grade impact reporting.
 * Assembles sections from Impact Intelligence, Portfolio/Opportunity Intelligence,
 * Journey Stories, Portfolio Stories, Funds, and portfolio company holdings.
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
  capitalCommitmentsSummary,
  getTalantonFund,
  listTalantonFunds,
  type FundId,
} from "@/lib/talanton/funds-data";

type Listener = () => void;

export type ImpactReportKind =
  | "annual"
  | "quarterly"
  | "investor"
  | "board";

export type ImpactReportStatus =
  | "Draft"
  | "Generated"
  | "Published"
  | "Archived";

export type ImpactReportScope =
  | { mode: "portfolio" }
  | { mode: "fund"; fundId: FundId }
  | { mode: "country"; country: string }
  | { mode: "companies"; companyIds: string[] };

export type ImpactReportPeriod =
  | { mode: "year"; year: number }
  | { mode: "quarter"; year: number; quarter: 1 | 2 | 3 | 4 }
  | { mode: "custom"; startDate: string; endDate: string };

export type CountryImpactRow = {
  country: string;
  companies: number;
  jobsCreated: number;
  peopleServed: number;
  communities: number;
};

export type SectorImpactRow = {
  sector: string;
  companies: number;
  jobsCreated: number;
  peopleServed: number;
  summary: string;
};

export type JourneyHighlight = {
  id: string;
  title: string;
  country: string;
  date: string;
  author: string;
  summary: string;
  photoUrl: string | null;
};

export type PortfolioHighlight = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  achievement: string;
  impactMetric: string;
};

export type GeneratedSummaries = {
  executiveSummary: string;
  investorSummary: string;
  boardSummary: string;
  websiteSummary: string;
  pressSummary: string;
};

export type ImpactReportSections = {
  coverTitle: string;
  coverSubtitle: string;
  letterFromTalanton: string;
  overviewText: string;
  impactSummaryNarrative: string;
  portfolioHighlightsNarrative: string;
  journeyNarrative: string;
  countryNarrative: string;
  sectorNarrative: string;
  impactIntelligenceNarrative: string;
  opportunityNarrative: string;
  lookingForward: string;
  appendixNotes: string;
};

export type AnnualImpactReport = {
  id: string;
  title: string;
  kind: ImpactReportKind;
  period: ImpactReportPeriod;
  scope: ImpactReportScope;
  status: ImpactReportStatus;
  generatedAt: string;
  updatedAt: string;
  publishedToBoard: boolean;
  /** Snapshot metrics at generation time */
  metrics: {
    companiesIncluded: number;
    countriesActive: number;
    capitalRaisedUsd: number;
    peopleServed: number;
    jobsCreated: number;
    jobsRetained: number;
    womenEmployed: number;
    youthEmployed: number;
    communitiesReached: number;
    sectors: string[];
  };
  countryRows: CountryImpactRow[];
  sectorRows: SectorImpactRow[];
  portfolioHighlights: PortfolioHighlight[];
  journeyHighlights: JourneyHighlight[];
  sections: ImpactReportSections;
  summaries: GeneratedSummaries;
  dataSources: string[];
  exportFormats: Array<"pdf" | "board-deck" | "investor-report" | "website-report">;
};

export type AnnualImpactReportState = {
  reports: AnnualImpactReport[];
};

export const IMPACT_REPORT_KINDS: { id: ImpactReportKind; label: string }[] = [
  { id: "annual", label: "Annual Impact Report" },
  { id: "quarterly", label: "Quarterly Impact Report" },
  { id: "investor", label: "Investor Impact Report" },
  { id: "board", label: "Board Impact Report" },
];

function periodLabel(period: ImpactReportPeriod): string {
  if (period.mode === "year") return String(period.year);
  if (period.mode === "quarter") return `Q${period.quarter} ${period.year}`;
  return `${period.startDate} – ${period.endDate}`;
}

function scopeLabel(scope: ImpactReportScope): string {
  if (scope.mode === "portfolio") return "Entire Portfolio";
  if (scope.mode === "fund") {
    return getTalantonFund(scope.fundId).name;
  }
  if (scope.mode === "country") return scope.country;
  const names = scope.companyIds
    .map((id) => TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)?.name ?? id)
    .slice(0, 4);
  return names.join(", ") + (scope.companyIds.length > 4 ? "…" : "");
}

function companiesForScope(scope: ImpactReportScope): PortfolioCompany[] {
  if (scope.mode === "portfolio") return [...TALANTON_PORTFOLIO_COMPANIES];
  if (scope.mode === "country") {
    return TALANTON_PORTFOLIO_COMPANIES.filter((c) => c.country === scope.country);
  }
  if (scope.mode === "companies") {
    return TALANTON_PORTFOLIO_COMPANIES.filter((c) => scope.companyIds.includes(c.id));
  }
  const fund = getTalantonFund(scope.fundId);
  const names = new Set(fund.portfolio.map((p) => p.company.toLowerCase()));
  const ids = new Set(fund.portfolio.map((p) => p.id));
  const matched = TALANTON_PORTFOLIO_COMPANIES.filter(
    (c) => ids.has(c.id) || names.has(c.name.toLowerCase()),
  );
  return matched.length
    ? matched
    : TALANTON_PORTFOLIO_COMPANIES.slice(0, fund.portfolioCompanyCount);
}

function kindTitle(kind: ImpactReportKind, period: ImpactReportPeriod): string {
  const p = periodLabel(period);
  if (kind === "annual") return `Talanton Annual Impact Report ${p}`;
  if (kind === "quarterly") return `Talanton Quarterly Impact Report — ${p}`;
  if (kind === "investor") return `Talanton Investor Impact Report — ${p}`;
  return `Talanton Board Impact Report — ${p}`;
}

/** Assemble a full report from live Talanton platform fixtures. */
export function assembleImpactReport(input: {
  id?: string;
  kind: ImpactReportKind;
  period: ImpactReportPeriod;
  scope: ImpactReportScope;
  status?: ImpactReportStatus;
}): AnnualImpactReport {
  const companies = companiesForScope(input.scope);
  const briefing = buildPortfolioImpactBriefing();
  const opportunity = buildOpportunityBriefing();
  const capital = capitalCommitmentsSummary();
  const journeys = listPublishedJourneyStories().slice(0, 6);
  const stories = listApprovedStoriesForNewsletter().slice(0, 6);

  // Scale portfolio briefing to scoped company share
  const share = Math.max(companies.length / Math.max(TALANTON_PORTFOLIO_COMPANIES.length, 1), 0.15);
  const scale = (n: number) => Math.max(0, Math.round(n * share));

  const jobsCreated = scale(briefing.summary.jobsCreated);
  const jobsRetained = scale(briefing.summary.jobsRetained);
  const peopleServed = scale(briefing.summary.peopleServed);
  const womenEmployed = scale(briefing.summary.womenEmployed);
  const youthEmployed = scale(briefing.summary.youthEmployed);
  const communitiesReached = scale(briefing.summary.communitiesImpacted);

  const countries = [...new Set(companies.map((c) => c.country))].sort();
  const sectors = [...new Set(companies.map((c) => c.sector))].sort();

  const countryRows: CountryImpactRow[] = countries.map((country) => {
    const subset = companies.filter((c) => c.country === country);
    const w = subset.length / Math.max(companies.length, 1);
    return {
      country,
      companies: subset.length,
      jobsCreated: Math.round(jobsCreated * w),
      peopleServed: Math.round(peopleServed * w),
      communities: Math.max(1, Math.round(communitiesReached * w)),
    };
  });

  const sectorRows: SectorImpactRow[] = sectors.map((sector) => {
    const subset = companies.filter((c) => c.sector === sector);
    const w = subset.length / Math.max(companies.length, 1);
    return {
      sector,
      companies: subset.length,
      jobsCreated: Math.round(jobsCreated * w),
      peopleServed: Math.round(peopleServed * w),
      summary: `${subset.length} holdings in ${sector.toLowerCase()} advancing dignified work and community outcomes across ${[...new Set(subset.map((c) => c.country))].join(", ")}.`,
    };
  });

  const top = briefing.topCompanies.filter((t) =>
    companies.some((c) => c.id === t.companyId),
  );
  const portfolioHighlights: PortfolioHighlight[] = (top.length ? top : briefing.topCompanies)
    .slice(0, 5)
    .map((t) => ({
      companyId: t.companyId,
      companyName: t.companyName,
      country: t.country,
      sector: t.sector,
      achievement: t.aiCommentary.slice(0, 180) + (t.aiCommentary.length > 180 ? "…" : ""),
      impactMetric: `${t.keyImpactMetricLabel}: ${t.keyImpactMetric}`,
    }));

  const journeyHighlights: JourneyHighlight[] = journeys.map((j) => ({
    id: j.id,
    title: j.title,
    country: j.country,
    date: j.startDate,
    author: j.author,
    summary: j.generated.executiveSummary || j.answers.impactWitnessed,
    photoUrl: j.media.find((m) => m.kind === "photo")?.url ?? null,
  }));

  const period = periodLabel(input.period);
  const scopeText = scopeLabel(input.scope);
  const title = kindTitle(input.kind, input.period);
  const now = new Date().toISOString();

  const letterFromTalanton = [
    `Dear partners in stewardship,`,
    ``,
    `This ${input.kind === "annual" ? "annual" : input.kind} impact report covers ${period} for ${scopeText}. It gathers evidence already living across Talanton — Impact Intelligence scorecards, Journey Stories from the field, Portfolio Stories from founders, Opportunity Intelligence, and board governance materials — into one investor- and board-grade narrative.`,
    ``,
    `We remain convinced that faith-driven enterprise, patient capital, and honest measurement belong together. The pages that follow show jobs created and retained, communities reached, women and youth in paid work, and the journeys Harry and the investment team undertook to witness impact first-hand.`,
    ``,
    `With gratitude for your partnership,`,
    `Talanton Impact`,
  ].join("\n");

  const sections: ImpactReportSections = {
    coverTitle: title,
    coverSubtitle: `${scopeText} · Generated for investors, board members, and stewardship partners`,
    letterFromTalanton,
    overviewText: [
      `Talanton’s active footprint in this report includes ${companies.length} portfolio companies across ${countries.length} countries and ${sectors.length} sectors.`,
      `Illustrative capital commitments associated with this scope total approximately ${formatUsd(Math.round(capital.totalCommitted * share))}.`,
      `Communities reached (modelled): ${communitiesReached.toLocaleString()}.`,
    ].join(" "),
    impactSummaryNarrative: [
      `People served ≈ ${peopleServed.toLocaleString()}; jobs created ≈ ${jobsCreated.toLocaleString()}; jobs retained ≈ ${jobsRetained.toLocaleString()}.`,
      `Women in paid roles ≈ ${womenEmployed.toLocaleString()}; youth ≈ ${youthEmployed.toLocaleString()}.`,
      `Impact Health stands at ${briefing.health.score}/100 (${briefing.health.band}).`,
    ].join(" "),
    portfolioHighlightsNarrative:
      briefing.keyAchievements.slice(0, 4).join(" ") ||
      "Portfolio companies continue to deepen jobs, inclusion, and community reach.",
    journeyNarrative:
      journeyHighlights.length > 0
        ? `Field journeys in this period include ${journeyHighlights.map((j) => j.title).join("; ")}. These visits ground LP and board narratives in first-hand stewardship.`
        : "Journey Stories from portfolio visits will appear here as they are published.",
    countryNarrative: `Active countries: ${countries.join(", ")}. Impact concentration and diversification remain standing board topics.`,
    sectorNarrative: sectorRows
      .slice(0, 4)
      .map((s) => `${s.sector}: ${s.summary}`)
      .join(" "),
    impactIntelligenceNarrative: [
      briefing.overallImpact,
      ...briefing.keyAchievements.slice(0, 2),
      ...briefing.areasRequiringAttention.slice(0, 2),
    ].join(" "),
    opportunityNarrative: [
      ...opportunity.emergingOpportunities.slice(0, 2),
      ...opportunity.recommendedActions.slice(0, 3).map((a) => a.title),
    ].join(" · "),
    lookingForward: [
      "Deepen youth and women pathways across mobility, manufacturing, and agriculture holdings.",
      "Lock quarterly impact reporting cadence before LP pack close.",
      "Continue Journey Stories capture so board and investors see field truth, not only dashboards.",
      "Pursue geographic diversification of impact delivery while protecting Kenyan proof points.",
    ].join("\n"),
    appendixNotes: [
      `Directory: ${companies.map((c) => c.name).join("; ")}.`,
      `Supporting sources: Impact Intelligence, Portfolio Intelligence, Opportunity Intelligence, Journey Stories, Portfolio Stories, Funds commitments, Board governance fixtures.`,
      stories.length
        ? `Portfolio Stories referenced: ${stories.map((s) => s.title).slice(0, 4).join("; ")}.`
        : "",
    ]
      .filter(Boolean)
      .join("\n"),
  };

  const summaries: GeneratedSummaries = {
    executiveSummary: [
      `${title} — Executive Summary`,
      `Scope: ${scopeText} · Period: ${period}`,
      `Holdings: ${companies.length} · Countries: ${countries.length} · People served ≈ ${peopleServed.toLocaleString()} · Jobs created ≈ ${jobsCreated.toLocaleString()}`,
      `Impact Health ${briefing.health.score}/100 (${briefing.health.band}).`,
      briefing.keyAchievements[0] ?? "Stewardship of jobs and communities remains the centre of Talanton’s impact posture.",
    ].join("\n"),
    investorSummary: [
      `Investor Impact Brief — ${period}`,
      `Dear partners, capital stewarded across ${scopeText} continues to support livelihoods and community flourishing.`,
      `Headline reach: ~${peopleServed.toLocaleString()} people served; ~${jobsCreated.toLocaleString()} jobs created; ${communitiesReached} communities.`,
      `Field journeys and founder stories in this pack are cleared for LP communications where marked Published/Approved.`,
      `With gratitude — Talanton Impact`,
    ].join("\n"),
    boardSummary: [
      `Board Impact Pack — ${period}`,
      `Ask: note Impact Health ${briefing.health.score}/100; review declining holdings listed in Impact Intelligence; endorse Journey Story media for the next board pack.`,
      `Risks: ${briefing.risks
        .slice(0, 2)
        .map((r) => r.title)
        .join("; ")}`,
      `Opportunities: ${opportunity.recommendedActions
        .slice(0, 2)
        .map((a) => a.title)
        .join("; ")}`,
    ].join("\n"),
    websiteSummary: [
      `Talanton Impact — ${period} highlights`,
      `Across ${countries.length} countries, our portfolio companies are creating jobs, serving communities, and practising dignity of work.`,
      `Explore Journey Stories and Portfolio Stories for field evidence behind these numbers.`,
    ].join("\n"),
    pressSummary: [
      `FOR STEWARDSHIP COMMUNICATIONS — ${title}`,
      `Talanton Impact reports approximately ${peopleServed.toLocaleString()} people served and ${jobsCreated.toLocaleString()} jobs created within the ${period} reporting window for ${scopeText}.`,
      `Quotes and photos available via Marketing & Stories / Media Library subject to consent.`,
    ].join("\n"),
  };

  return {
    id: input.id ?? `air-${Date.now().toString(36)}`,
    title,
    kind: input.kind,
    period: input.period,
    scope: input.scope,
    status: input.status ?? "Generated",
    generatedAt: now,
    updatedAt: now,
    publishedToBoard: input.kind === "board" || input.kind === "annual",
    metrics: {
      companiesIncluded: companies.length,
      countriesActive: countries.length,
      capitalRaisedUsd: Math.round(capital.totalCommitted * share),
      peopleServed,
      jobsCreated,
      jobsRetained,
      womenEmployed,
      youthEmployed,
      communitiesReached,
      sectors,
    },
    countryRows,
    sectorRows,
    portfolioHighlights,
    journeyHighlights,
    sections,
    summaries,
    dataSources: [
      "Impact Intelligence",
      "Portfolio Intelligence",
      "Opportunity Intelligence",
      "Journey Stories",
      "Portfolio Stories",
      "Board Decks / governance",
      "Portfolio Company Data",
      "Funds & Capital Commitments",
      "Training & Development (portfolio context)",
      "Minutes & Decisions (governance context)",
      "Projects (stewardship programmes)",
    ],
    exportFormats: ["pdf", "board-deck", "investor-report", "website-report"],
  };
}

function seedReports(): AnnualImpactReport[] {
  return [
    assembleImpactReport({
      id: "air-2025-annual",
      kind: "annual",
      period: { mode: "year", year: 2025 },
      scope: { mode: "portfolio" },
      status: "Published",
    }),
    assembleImpactReport({
      id: "air-2026-annual",
      kind: "annual",
      period: { mode: "year", year: 2026 },
      scope: { mode: "portfolio" },
      status: "Published",
    }),
    assembleImpactReport({
      id: "air-2026-q2",
      kind: "quarterly",
      period: { mode: "quarter", year: 2026, quarter: 2 },
      scope: { mode: "portfolio" },
      status: "Generated",
    }),
    assembleImpactReport({
      id: "air-2026-impact-fund",
      kind: "investor",
      period: { mode: "year", year: 2026 },
      scope: { mode: "fund", fundId: "impact" },
      status: "Draft",
    }),
  ].map((r, i) => ({
    ...r,
    generatedAt: ["2026-01-20T10:00:00.000Z", "2026-07-15T10:00:00.000Z", "2026-07-08T10:00:00.000Z", "2026-07-28T10:00:00.000Z"][i]!,
    updatedAt: ["2026-01-22T10:00:00.000Z", "2026-07-18T10:00:00.000Z", "2026-07-10T10:00:00.000Z", "2026-07-28T10:00:00.000Z"][i]!,
    publishedToBoard: r.status === "Published",
  }));
}

const listeners = new Set<Listener>();
let state: AnnualImpactReportState = { reports: seedReports() };

function emit() {
  for (const l of listeners) l();
}

export function subscribeAnnualImpactReports(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function getAnnualImpactReportsSnapshot(): AnnualImpactReportState {
  return state;
}

export function listAnnualImpactReports(): AnnualImpactReport[] {
  return state.reports
    .slice()
    .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export function listImpactReportsForBoard(): AnnualImpactReport[] {
  return listAnnualImpactReports().filter(
    (r) => r.publishedToBoard && (r.status === "Published" || r.status === "Generated"),
  );
}

export function annualImpactReportDashboardMetrics() {
  const reports = listAnnualImpactReports().filter((r) => r.status !== "Archived");
  const years = new Set(
    reports.map((r) =>
      r.period.mode === "custom" ? r.period.startDate.slice(0, 4) : String(r.period.year),
    ),
  );
  const latest = reports[0];
  return {
    reportsGenerated: reports.length,
    reportingYears: years.size,
    companiesIncluded: latest?.metrics.companiesIncluded ?? TALANTON_PORTFOLIO_COMPANIES.length,
    countriesActive: latest?.metrics.countriesActive ?? 0,
    capitalRaisedUsd: latest?.metrics.capitalRaisedUsd ?? 0,
    peopleServed: latest?.metrics.peopleServed ?? 0,
    jobsCreated: latest?.metrics.jobsCreated ?? 0,
  };
}

export function getAnnualImpactReport(id: string): AnnualImpactReport | undefined {
  return state.reports.find((r) => r.id === id);
}

export function upsertAnnualImpactReport(report: AnnualImpactReport): AnnualImpactReport {
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

export function createAnnualImpactReport(input: {
  kind: ImpactReportKind;
  period: ImpactReportPeriod;
  scope: ImpactReportScope;
}): AnnualImpactReport {
  const report = assembleImpactReport({ ...input, status: "Generated" });
  return upsertAnnualImpactReport(report);
}

export function duplicateAnnualImpactReport(id: string): AnnualImpactReport | null {
  const src = getAnnualImpactReport(id);
  if (!src) return null;
  const copy: AnnualImpactReport = {
    ...src,
    id: `air-${Date.now().toString(36)}`,
    title: `${src.title} (Copy)`,
    status: "Draft",
    publishedToBoard: false,
    generatedAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  return upsertAnnualImpactReport(copy);
}

export function deleteAnnualImpactReport(id: string) {
  state = { reports: state.reports.filter((r) => r.id !== id) };
  emit();
}

export function archiveAnnualImpactReport(id: string): AnnualImpactReport | null {
  const src = getAnnualImpactReport(id);
  if (!src) return null;
  return upsertAnnualImpactReport({ ...src, status: "Archived", publishedToBoard: false });
}

export function publishImpactReportToBoard(id: string): AnnualImpactReport | null {
  const src = getAnnualImpactReport(id);
  if (!src) return null;
  return upsertAnnualImpactReport({
    ...src,
    status: "Published",
    publishedToBoard: true,
  });
}

export function regenerateAnnualImpactReport(id: string): AnnualImpactReport | null {
  const src = getAnnualImpactReport(id);
  if (!src) return null;
  const next = assembleImpactReport({
    id: src.id,
    kind: src.kind,
    period: src.period,
    scope: src.scope,
    status: src.status === "Archived" ? "Generated" : src.status,
  });
  return upsertAnnualImpactReport({
    ...next,
    publishedToBoard: src.publishedToBoard,
    generatedAt: src.generatedAt,
  });
}

/** Board Portal / Board Decks projection for published impact reports. */
export function impactReportsAsBoardPackRows(): Array<{
  id: string;
  packName: string;
  meetingDate: string;
  status: "Final";
  createdAt: string;
  pdfOpenUrl: string;
  pptxDownloadUrl: string;
  executiveSummary: string;
  reportingPeriod: string;
}> {
  return listImpactReportsForBoard().map((r) => ({
    id: `air-pack-${r.id}`,
    packName: r.title,
    meetingDate: r.generatedAt.slice(0, 10),
    status: "Final" as const,
    createdAt: r.generatedAt,
    pdfOpenUrl: "#",
    pptxDownloadUrl: "#",
    executiveSummary: r.summaries.executiveSummary,
    reportingPeriod: periodLabel(r.period),
  }));
}

export function buildExportText(
  report: AnnualImpactReport,
  format: "pdf" | "board-deck" | "investor-report" | "website-report",
): string {
  const s = report.sections;
  const base = [
    s.coverTitle,
    s.coverSubtitle,
    `Generated: ${report.generatedAt.slice(0, 10)}`,
    "",
    "— Letter From Talanton —",
    s.letterFromTalanton,
    "",
    "— Overview —",
    s.overviewText,
    "",
    "— Impact Summary —",
    s.impactSummaryNarrative,
    `People served: ${report.metrics.peopleServed.toLocaleString()}`,
    `Jobs created: ${report.metrics.jobsCreated.toLocaleString()}`,
    `Jobs retained: ${report.metrics.jobsRetained.toLocaleString()}`,
    `Women employed: ${report.metrics.womenEmployed.toLocaleString()}`,
    `Youth employed: ${report.metrics.youthEmployed.toLocaleString()}`,
    `Communities: ${report.metrics.communitiesReached.toLocaleString()}`,
    "",
    "— Portfolio Highlights —",
    ...report.portfolioHighlights.map(
      (h) => `• ${h.companyName} (${h.country}): ${h.impactMetric} — ${h.achievement}`,
    ),
    "",
    "— Journey Stories —",
    s.journeyNarrative,
    ...report.journeyHighlights.map((j) => `• ${j.title} — ${j.country} (${j.date})`),
    "",
    "— Country Impact —",
    ...report.countryRows.map(
      (c) =>
        `• ${c.country}: ${c.companies} cos · jobs ${c.jobsCreated} · people ${c.peopleServed.toLocaleString()}`,
    ),
    "",
    "— Sector Impact —",
    ...report.sectorRows.map((x) => `• ${x.sector}: ${x.summary}`),
    "",
    "— Impact Intelligence —",
    s.impactIntelligenceNarrative,
    "",
    "— Opportunity Intelligence —",
    s.opportunityNarrative,
    "",
    "— Looking Forward —",
    s.lookingForward,
    "",
    "— Appendix —",
    s.appendixNotes,
    "",
    "Data sources: " + report.dataSources.join(", "),
  ].join("\n");

  if (format === "investor-report") {
    return `${report.summaries.investorSummary}\n\n${base}`;
  }
  if (format === "board-deck") {
    return `${report.summaries.boardSummary}\n\n${base}`;
  }
  if (format === "website-report") {
    return `${report.summaries.websiteSummary}\n\n${base}`;
  }
  return `${report.summaries.executiveSummary}\n\n${base}`;
}

export function downloadImpactReport(
  report: AnnualImpactReport,
  format: "pdf" | "board-deck" | "investor-report" | "website-report",
) {
  if (typeof window === "undefined") return;
  const text = buildExportText(report, format);
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${report.id}-${format}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

export { periodLabel, scopeLabel, listTalantonFunds };
