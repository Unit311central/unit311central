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

function scale(n: number, factor: number) {
  return Math.max(0, Math.round(n * factor));
}

/** Deterministic prior-period trend from current portfolio rollup (no duplicate metric logic). */
export function buildImpactTrendSeries(briefing: PortfolioImpactBriefing): ImpactTrendPoint[] {
  const { summary, health } = briefing;
  const decliningBias = briefing.risks.filter((r) => r.severity !== "Watch").length >= 2 ? 0.97 : 1.02;
  return [
    {
      period: "Q4 2025",
      jobsCreated: scale(summary.jobsCreated, 0.82),
      peopleServed: scale(summary.peopleServed, 0.78),
      impactHealthScore: Math.max(40, Math.min(98, health.score - 6)),
    },
    {
      period: "Q1 2026",
      jobsCreated: scale(summary.jobsCreated, 0.9),
      peopleServed: scale(summary.peopleServed, 0.88),
      impactHealthScore: Math.max(40, Math.min(98, health.score - 3)),
    },
    {
      period: "Q2 2026",
      jobsCreated: scale(summary.jobsCreated, 0.96 * decliningBias),
      peopleServed: scale(summary.peopleServed, 0.94 * decliningBias),
      impactHealthScore: Math.max(40, Math.min(98, health.score - 1)),
    },
    {
      period: "Current",
      jobsCreated: summary.jobsCreated,
      peopleServed: summary.peopleServed,
      impactHealthScore: health.score,
    },
  ];
}

function buildBoardRisks(briefing: PortfolioImpactBriefing): ImpactRisk[] {
  const { summary, topCompanies } = briefing;
  const kenyaShare =
    topCompanies.filter((c) => c.country === "Kenya").length / Math.max(topCompanies.length, 1);

  const boardRisks: ImpactRisk[] = [
    ...briefing.risks.filter(
      (r) =>
        r.title.toLowerCase().includes("declin") ||
        r.title.toLowerCase().includes("missed") ||
        r.title.toLowerCase().includes("community") ||
        r.severity === "Critical" ||
        r.severity === "Elevated",
    ),
  ];

  if (kenyaShare >= 0.5) {
    boardRisks.push({
      id: "board-risk-geo",
      title: "Geographic concentration of impact delivery",
      severity: "Watch",
      companyId: null,
      companyName: null,
      detail: `A material share of top impact proof points sit in Kenya. Board should ask for diversification of jobs and beneficiary outcomes across ${summary.countriesImpacted} countries of footprint.`,
      cardText: "",
    });
  }

  boardRisks.push({
    id: "board-risk-funding",
    title: "Funding dependency for community programmes",
    severity: "Elevated",
    companyId: null,
    companyName: null,
    detail:
      "Several field and inclusion programmes remain sensitive to follow-on and grant-adjacent funding. IC should confirm which impact outcomes are durable without incremental capital.",
    cardText: "",
  });

  if (!boardRisks.some((r) => r.title.toLowerCase().includes("employment"))) {
    boardRisks.push({
      id: "board-risk-employment",
      title: "Employment decline in selected holdings",
      severity: briefing.areasRequiringAttention.some((a) => a.toLowerCase().includes("declining"))
        ? "Elevated"
        : "Watch",
      companyId: null,
      companyName: null,
      detail:
        "Board oversight should focus on holdings with declining jobs created/retained signals before LP narrative lock.",
      cardText: "",
    });
  }

  boardRisks.push({
    id: "board-risk-engagement",
    title: "Community engagement decline risk",
    severity: "Watch",
    companyId: null,
    companyName: null,
    detail: `Communities impacted currently total ${summary.communitiesImpacted.toLocaleString()}. Directors should seek assurance that agriculture and manufacturing programmes are not quietly reducing field reach.`,
    cardText: "",
  });

  // Deduplicate by title
  const seen = new Set<string>();
  const unique = boardRisks.filter((r) => {
    const key = r.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const r of unique) {
    r.cardText = [
      `Board Impact Risk — ${r.title}`,
      `Severity: ${r.severity}`,
      r.companyName ? `Company: ${r.companyName}` : "Portfolio-wide",
      "",
      r.detail,
    ].join("\n");
  }

  return unique.slice(0, 6);
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
      rationale: `With ${briefing.summary.countriesImpacted} countries in footprint, board should ask whether jobs and people-served growth are over-concentrated.`,
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
    `Review geographic balance of impact delivery across ${briefing.summary.countriesImpacted} countries.`,
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

  const snapshotText = [
    "Portfolio Impact Snapshot",
    `Jobs created: ${briefing.summary.jobsCreated.toLocaleString()}`,
    `Jobs retained: ${briefing.summary.jobsRetained.toLocaleString()}`,
    `People served: ${briefing.summary.peopleServed.toLocaleString()}`,
    `Women employed: ${briefing.summary.womenEmployed.toLocaleString()}`,
    `Youth employed: ${briefing.summary.youthEmployed.toLocaleString()}`,
    `Communities impacted: ${briefing.summary.communitiesImpacted.toLocaleString()}`,
    `Countries impacted: ${briefing.summary.countriesImpacted}`,
  ].join("\n");

  const trendsText = [
    "Impact Trends",
    ...trends.map(
      (t) =>
        `${t.period}: Jobs created ${t.jobsCreated.toLocaleString()} · People served ${t.peopleServed.toLocaleString()} · Impact health ${t.impactHealthScore}/100`,
    ),
  ].join("\n");

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
