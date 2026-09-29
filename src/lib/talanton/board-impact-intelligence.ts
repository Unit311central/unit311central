/**
 * Board Portal — Impact Intelligence view model.
 * Reuses portfolio impact calculations; adds board/IC-facing narrative only.
 */

import {
  buildPortfolioImpactBriefing,
  type ImpactRecommendedAction,
  type ImpactRisk,
  type ImpactTrend,
  type PortfolioImpactBriefing,
  type TopImpactCompany,
} from "@/lib/talanton/impact-intelligence";
import { UNAVAILABLE_LABEL } from "@/lib/talanton/intelligence-metric-types";

export type ImpactTrendPoint = {
  period: string;
  jobsCreated: number;
  peopleServed: number;
  impactHealthScore: number;
};

export type BoardImpactIntelligence = {
  asOf: string;
  preparedFor: string;
  health: PortfolioImpactBriefing["health"];
  summary: PortfolioImpactBriefing["summary"];
  topCompanies: TopImpactCompany[];
  /** Board-level impact risks (governance / oversight). */
  risks: ImpactRisk[];
  /** Recommendations for directors and the investment committee. */
  boardRecommendations: ImpactRecommendedAction[];
  trends: ImpactTrendPoint[];
  overallImpact: string;
  keyAchievements: string[];
  strongestPerformers: string[];
  emergingConcerns: string[];
  areasRequiringBoardAttention: string[];
  boardBriefingText: string;
  snapshotText: string;
  risksText: string;
  recommendationsText: string;
  trendsText: string;
  healthText: string;
};

/** Trend series only when submitted impact data exists (no scaled historical fabrication). */
export function buildImpactTrendSeries(briefing: PortfolioImpactBriefing): ImpactTrendPoint[] {
  const { summary, health } = briefing;
  if (!summary.hasAggregatedSubmissionData || summary.jobsCreated === null || summary.peopleServed === null) {
    return [];
  }
  const score = health.score ?? 0;
  return [
    {
      period: "Current",
      jobsCreated: summary.jobsCreated,
      peopleServed: summary.peopleServed,
      impactHealthScore: health.scoreUnavailable ? 0 : score,
    },
  ];
}

function buildBoardRisks(briefing: PortfolioImpactBriefing): ImpactRisk[] {
  const boardRisks: ImpactRisk[] = [...briefing.risks];
  for (const r of boardRisks) {
    r.cardText = [
      `Board Impact Risk — ${r.title}`,
      `Severity: ${r.severity}`,
      r.companyName ? `Company: ${r.companyName}` : "Portfolio-wide",
      "",
      r.detail,
    ].join("\n");
  }
  return boardRisks.slice(0, 6);
}

function buildBoardRecommendations(briefing: PortfolioImpactBriefing): ImpactRecommendedAction[] {
  const actions: ImpactRecommendedAction[] = [
    {
      id: "board-rec-1",
      title: "Request Impact Director assurance on declining holdings",
      rationale:
        "Directors should receive a 30-day remediation note covering employment and community programmes before the next LP update.",
      owner: "Board / Impact Director",
      urgency: "This week",
      companyId: briefing.recommendedActions[0]?.companyId ?? null,
      companyName: briefing.recommendedActions[0]?.companyName ?? null,
      cardText: "",
    },
    {
      id: "board-rec-2",
      title: "IC: validate durability of impact outcomes vs follow-on capital",
      rationale:
        "Investment Committee should separate impact that scales with growth from programmes dependent on incremental funding.",
      owner: "Investment Committee",
      urgency: "This month",
      companyId: null,
      companyName: null,
      cardText: "",
    },
    {
      id: "board-rec-3",
      title: "Endorse top impact companies for LP / board pack narrative",
      rationale: `${briefing.topCompanies
        .slice(0, 3)
        .map((c) => c.companyName)
        .join(", ")} are the strongest proof points — approve inclusion in the next board pack impact section.`,
      owner: "Board Chair / Harry Turner",
      urgency: "This month",
      companyId: briefing.topCompanies[0]?.companyId ?? null,
      companyName: briefing.topCompanies[0]?.companyName ?? null,
      cardText: "",
    },
    {
      id: "board-rec-4",
      title: "Commission geographic diversification check on impact delivery",
      rationale:
        briefing.summary.countriesImpacted === null
          ? "Impact geography is unavailable until portal submissions exist — board should ask for submission coverage."
          : `With ${briefing.summary.countriesImpacted} countries in footprint, board should ask whether jobs and people-served growth are over-concentrated.`,
      owner: "Board / Portfolio Ops",
      urgency: "This month",
      companyId: null,
      companyName: null,
      cardText: "",
    },
  ];

  for (const a of actions) {
    a.cardText = [
      `Board Recommendation — ${a.title}`,
      `Owner: ${a.owner}`,
      `Urgency: ${a.urgency}`,
      a.companyName ? `Focus: ${a.companyName}` : "Portfolio-wide",
      "",
      a.rationale,
    ].join("\n");
  }
  return actions;
}

export function buildBoardImpactIntelligence(): BoardImpactIntelligence {
  const briefing = buildPortfolioImpactBriefing();
  const trends = buildImpactTrendSeries(briefing);
  const risks = buildBoardRisks(briefing);
  const boardRecommendations = buildBoardRecommendations(briefing);

  const strongestPerformers = briefing.highestImpactCompanies;
  const emergingConcerns = [
    ...briefing.areasRequiringAttention.slice(0, 3),
    ...risks
      .filter((r) => r.id.startsWith("board-risk"))
      .slice(0, 2)
      .map((r) => `${r.title}: ${r.detail}`),
  ].slice(0, 5);

  const areasRequiringBoardAttention = [
    "Confirm remediation plans for declining-impact holdings ahead of LP reporting.",
    "Seek IC assurance that community and inclusion outcomes are resilient without incremental capital.",
    "Approve which impact proof points appear in the next board pack.",
    briefing.summary.countriesImpacted === null
      ? "Collect company portal impact submissions before geographic impact review."
      : `Review geographic balance of impact delivery across ${briefing.summary.countriesImpacted} countries.`,
  ];

  const boardBriefingText = [
    "Board Impact Briefing — Talanton Impact",
    `As of ${briefing.asOf} · Prepared for the Board of Advisors and Investment Committee`,
    "",
    "Overall portfolio impact",
    briefing.overallImpact,
    "",
    "Key achievements",
    ...briefing.keyAchievements.map((x) => `• ${x}`),
    "",
    "Strongest performing companies",
    ...strongestPerformers.map((x) => `• ${x}`),
    "",
    "Emerging concerns",
    ...emergingConcerns.map((x) => `• ${x}`),
    "",
    "Areas requiring board attention",
    ...areasRequiringBoardAttention.map((x) => `• ${x}`),
  ].join("\n");

  const snapshotText = briefing.summaryText;

  const trendsText =
    trends.length > 0
      ? [
          "Impact Trends",
          ...trends.map(
            (t) =>
              `${t.period}: Jobs created ${t.jobsCreated.toLocaleString()} · People served ${t.peopleServed.toLocaleString()} · Impact health ${t.impactHealthScore || UNAVAILABLE_LABEL}`,
          ),
        ].join("\n")
      : `Impact Trends\n${UNAVAILABLE_LABEL} — no historical submission series persisted.`;

  return {
    asOf: briefing.asOf,
    preparedFor: "Board of Advisors and Investment Committee",
    health: briefing.health,
    summary: briefing.summary,
    topCompanies: briefing.topCompanies,
    risks,
    boardRecommendations,
    trends,
    overallImpact: briefing.overallImpact,
    keyAchievements: briefing.keyAchievements,
    strongestPerformers,
    emergingConcerns,
    areasRequiringBoardAttention,
    boardBriefingText,
    snapshotText,
    risksText: ["Board Impact Risks", ...risks.map((r) => `• [${r.severity}] ${r.title}: ${r.detail}`)].join(
      "\n",
    ),
    recommendationsText: [
      "Board Recommendations",
      ...boardRecommendations.map(
        (a) => `• ${a.title} — ${a.owner} (${a.urgency}): ${a.rationale}`,
      ),
    ].join("\n"),
    trendsText,
    healthText: briefing.health.healthText,
  };
}

export function impactTrendLabel(trend: ImpactTrend): string {
  return trend;
}
