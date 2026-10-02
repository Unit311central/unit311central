/**
 * Impact Intelligence — portfolio and company impact for Talanton leadership.
 * Aggregated metrics come from company portal impact submissions only (local persistence).
 */

import { getLatestImpactReportForIntelligence } from "@/lib/talanton/company-stories-impact";
import { UNAVAILABLE_LABEL } from "@/lib/talanton/intelligence-metric-types";
import { formatUsd, type PortfolioCompany } from "@/lib/talanton/portfolio-data";
import { resolveTalantonPortfolioCompanies } from "@/lib/talanton/portfolio-companies-runtime";
import { resolveTalantonIntelligenceContext } from "@/lib/talanton/talanton-intelligence-context";

export type ImpactTrend = "Improving" | "Stable" | "Declining";

export type CompanyImpactProfile = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  impactScore: number;
  trend: ImpactTrend;
  jobsCreated: number;
  jobsRetained: number;
  womenEmployed: number;
  womenEmployedPct: number;
  youthEmployed: number;
  youthEmployedPct: number;
  peopleServed: number;
  communitiesImpacted: number;
  economicContributionUsd: number | null;
  economicContributionUnavailable: boolean;
  keyImpactMetric: string;
  keyImpactMetricLabel: string;
  aiSummary: string;
  aiCommentary: string;
  risks: Array<{ id: string; title: string; severity: "Watch" | "Elevated" | "Critical"; detail: string }>;
  opportunities: Array<{ id: string; title: string; detail: string }>;
  summaryText: string;
  commentaryText: string;
  risksText: string;
  opportunitiesText: string;
  metricsText: string;
  /** True when metrics come from a company portal impact submission (not heuristics). */
  impactMetricsFromSubmission: boolean;
};

export type TopImpactCompany = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  impactScore: number;
  keyImpactMetric: string;
  keyImpactMetricLabel: string;
  trend: ImpactTrend;
  aiCommentary: string;
  cardText: string;
};

export type ImpactRisk = {
  id: string;
  title: string;
  severity: "Watch" | "Elevated" | "Critical";
  companyId: string | null;
  companyName: string | null;
  detail: string;
  cardText: string;
};

export type ImpactRecommendedAction = {
  id: string;
  title: string;
  rationale: string;
  owner: string;
  urgency: "Today" | "This week" | "This month";
  companyId: string | null;
  companyName: string | null;
  cardText: string;
};

export type PortfolioImpactSummary = {
  jobsCreated: number | null;
  jobsRetained: number | null;
  womenEmployed: number | null;
  youthEmployed: number | null;
  peopleServed: number | null;
  communitiesImpacted: number | null;
  countriesImpacted: number | null;
  economicContributionUsd: number | null;
  hasAggregatedSubmissionData: boolean;
};

export type ImpactHealth = {
  score: number | null;
  scoreUnavailable: boolean;
  band: "Strong" | "Healthy" | "Watch" | "At Risk" | "Unavailable";
  postureReason: string;
  healthText: string;
};

export type PortfolioImpactBriefing = {
  asOf: string;
  preparedFor: string;
  health: ImpactHealth;
  summary: PortfolioImpactSummary;
  overallImpact: string;
  keyAchievements: string[];
  highestImpactCompanies: string[];
  areasRequiringAttention: string[];
  recommendedActionsNarrative: string[];
  topCompanies: TopImpactCompany[];
  risks: ImpactRisk[];
  recommendedActions: ImpactRecommendedAction[];
  briefingText: string;
  summaryText: string;
  risksText: string;
  actionsText: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function impactScoreFor(company: PortfolioCompany, profile: Omit<CompanyImpactProfile, "impactScore" | "aiSummary" | "aiCommentary" | "risks" | "opportunities" | "summaryText" | "commentaryText" | "risksText" | "opportunitiesText" | "metricsText" | "keyImpactMetric" | "keyImpactMetricLabel">): number {
  const jobsComponent = clamp((profile.jobsCreated / 80) * 22, 8, 22);
  const inclusion = clamp(((profile.womenEmployedPct + profile.youthEmployedPct) / 2) * 0.28, 8, 22);
  const reach = clamp(Math.log10(Math.max(profile.peopleServed, 10)) * 7, 8, 22);
  const community = clamp(profile.communitiesImpacted * 0.9, 6, 16);
  const growthBoost = clamp(company.revenueGrowthPct * 0.35, 0, 12);
  const riskPenalty =
    company.riskRating === "Critical" ? 18 : company.riskRating === "High" ? 10 : company.riskRating === "Medium" ? 4 : 0;
  return Math.round(clamp(jobsComponent + inclusion + reach + community + growthBoost - riskPenalty + 18, 38, 96));
}

function keyMetric(profile: {
  jobsCreated: number;
  peopleServed: number;
  communitiesImpacted: number;
  womenEmployedPct: number;
  sector: string;
}): { label: string; value: string } {
  const s = profile.sector.toLowerCase();
  if (s.includes("fintech") || s.includes("connectivity") || s.includes("healthcare")) {
    return { label: "People served", value: profile.peopleServed.toLocaleString() };
  }
  if (s.includes("agriculture") || s.includes("forestry") || s.includes("food")) {
    return { label: "Communities impacted", value: String(profile.communitiesImpacted) };
  }
  if (profile.womenEmployedPct >= 0.45) {
    return { label: "Women employed", value: `${Math.round(profile.womenEmployedPct * 100)}%` };
  }
  return { label: "Jobs created", value: profile.jobsCreated.toLocaleString() };
}

function buildCompanyRisks(
  company: PortfolioCompany,
  hasSubmission: boolean,
): CompanyImpactProfile["risks"] {
  if (!hasSubmission) return [];
  const risks: CompanyImpactProfile["risks"] = [];
  if (company.compliancePct < 80) {
    risks.push({
      id: `${company.id}-target`,
      title: "Impact reporting compliance gap",
      severity: "Watch",
      detail: `Portfolio compliance is ${company.compliancePct}%. Ensure impact submissions stay aligned with Talanton reporting standards.`,
    });
  }
  return risks.slice(0, 3);
}

function buildCompanyOpportunities(
  _company: PortfolioCompany,
  hasSubmission: boolean,
): CompanyImpactProfile["opportunities"] {
  if (!hasSubmission) return [];
  return [];
}

function buildAiSummary(company: PortfolioCompany, score: number, trend: ImpactTrend, jobsCreated: number, peopleServed: number, communities: number): string {
  return `${company.name} (${company.country}) is delivering a ${score}/100 impact score with a ${trend.toLowerCase()} trajectory. The holding supports ${jobsCreated.toLocaleString()} jobs created on a rolling basis, reaches approximately ${peopleServed.toLocaleString()} people, and touches ${communities} communities through ${company.sector.toLowerCase()} activity. Talanton’s stake (${company.ownershipPct}%) means impact outcomes should remain a standing agenda item in portfolio reviews with ${company.primaryContact}.`;
}

function buildAiCommentary(company: PortfolioCompany, score: number, trend: ImpactTrend, womenPct: number, youthPct: number): string {
  const inclusion = `Women represent ~${Math.round(womenPct * 100)}% of the workforce and youth ~${Math.round(youthPct * 100)}%.`;
  if (trend === "Improving") {
    return `${inclusion} Momentum is positive: revenue growth of ${company.revenueGrowthPct}% is coinciding with stronger jobs and reach signals. Protect this by locking Q3 impact metrics early and showcasing ${company.name} in LP impact narratives. Score ${score}/100 warrants continued support capital for scaling inclusive hiring—not only commercial expansion.`;
  }
  if (trend === "Declining") {
    return `${inclusion} Impact momentum is under pressure relative to peers. Prioritise retention plans and community programme continuity before the next board cycle. Score ${score}/100 should trigger a focused Impact Director check-in with ${company.primaryContact} within two weeks.`;
  }
  return `${inclusion} Delivery is steady but not yet distinctive versus the portfolio median. A clear 90-day plan on youth hiring and community reach would lift the score without distracting from commercial milestones. Keep ${company.name} on the watchlist for Impact Dashboard trending.`;
}

function resolveSubmittedImpactReport(companyId: string) {
  const ctx = resolveTalantonIntelligenceContext();
  return ctx.impactReportsByCompanyId[companyId] ?? getLatestImpactReportForIntelligence(companyId);
}

function buildUnavailableCompanyImpactProfile(companyId: string): CompanyImpactProfile {
  const label = companyId.trim() || "portfolio";
  const unavailable = `${UNAVAILABLE_LABEL} — no portfolio holdings loaded`;
  return {
    companyId: label,
    companyName: UNAVAILABLE_LABEL,
    country: UNAVAILABLE_LABEL,
    sector: UNAVAILABLE_LABEL,
    impactScore: 0,
    trend: "Stable",
    jobsCreated: 0,
    jobsRetained: 0,
    womenEmployed: 0,
    womenEmployedPct: 0,
    youthEmployed: 0,
    youthEmployedPct: 0,
    peopleServed: 0,
    communitiesImpacted: 0,
    economicContributionUsd: null,
    economicContributionUnavailable: true,
    keyImpactMetric: UNAVAILABLE_LABEL,
    keyImpactMetricLabel: "Impact data",
    aiSummary: unavailable,
    aiCommentary: "",
    risks: [],
    opportunities: [],
    summaryText: unavailable,
    commentaryText: "",
    risksText: unavailable,
    opportunitiesText: unavailable,
    metricsText: unavailable,
    impactMetricsFromSubmission: false,
  };
}

export function buildCompanyImpactProfile(companyId: string): CompanyImpactProfile {
  const companies = resolveTalantonPortfolioCompanies();
  const company = companies.find((c) => c.id === companyId) ?? companies[0];
  if (!company) {
    return buildUnavailableCompanyImpactProfile(companyId);
  }
  const submitted = resolveSubmittedImpactReport(company.id);
  const impactMetricsFromSubmission = Boolean(submitted);

  const womenPct = submitted
    ? clamp(submitted.womenEmployed / Math.max(company.employeeCount, 1), 0.15, 0.75)
    : 0;
  const youthPct = submitted
    ? clamp(submitted.youthEmployed / Math.max(company.employeeCount, 1), 0.12, 0.7)
    : 0;
  const jobsCreated = submitted?.jobsCreated ?? 0;
  const jobsRetained = submitted?.jobsRetained ?? 0;
  const womenEmployed = submitted?.womenEmployed ?? 0;
  const youthEmployed = submitted?.youthEmployed ?? 0;
  const peopleServed = submitted?.peopleServed ?? 0;
  const communitiesImpacted = submitted?.communitiesImpacted ?? 0;
  const economicContributionUsd = null;
  const economicContributionUnavailable = true;
  const trend: ImpactTrend = "Stable";

  const base = {
    companyId: company.id,
    companyName: company.name,
    country: company.country,
    sector: company.sector,
    trend,
    jobsCreated,
    jobsRetained,
    womenEmployed,
    womenEmployedPct: womenPct,
    youthEmployed,
    youthEmployedPct: youthPct,
    peopleServed,
    communitiesImpacted,
    economicContributionUsd,
    economicContributionUnavailable,
    impactMetricsFromSubmission,
  };

  const impactScore = impactMetricsFromSubmission ? impactScoreFor(company, base) : 0;
  const metric = impactMetricsFromSubmission
    ? keyMetric({ ...base, sector: company.sector })
    : { label: "Impact data", value: UNAVAILABLE_LABEL };
  const risks = buildCompanyRisks(company, impactMetricsFromSubmission);
  const opportunities = buildCompanyOpportunities(company, impactMetricsFromSubmission);
  const aiSummary = impactMetricsFromSubmission
    ? buildAiSummary(company, impactScore, trend, jobsCreated, peopleServed, communitiesImpacted)
    : `${company.name} (${company.country}): no submitted company portal impact report is on file. Impact metrics are ${UNAVAILABLE_LABEL.toLowerCase()} until a report is submitted and approved.`;
  const aiCommentary = "";

  const metricsText = impactMetricsFromSubmission
    ? [
        `${company.name} — Impact Metrics`,
        `Jobs created: ${jobsCreated.toLocaleString()}`,
        `Jobs retained: ${jobsRetained.toLocaleString()}`,
        `Women employed: ${womenEmployed.toLocaleString()} (${Math.round(womenPct * 100)}%)`,
        `Youth employed: ${youthEmployed.toLocaleString()} (${Math.round(youthPct * 100)}%)`,
        `People served: ${peopleServed.toLocaleString()}`,
        `Communities impacted: ${communitiesImpacted}`,
        `Economic contribution: ${UNAVAILABLE_LABEL} (not captured in portal submission schema)`,
        `Source: Company portal impact report (${submitted!.reportingPeriod}, ${submitted!.status})`,
      ].join("\n")
    : [`${company.name} — Impact Metrics`, UNAVAILABLE_LABEL, "Source: company portal impact submissions (local persistence)"].join(
        "\n",
      );

  const risksText = [
    `${company.name} — Impact Risks`,
    ...risks.map((r) => `• [${r.severity}] ${r.title}: ${r.detail}`),
  ].join("\n");

  const opportunitiesText = [
    `${company.name} — Impact Opportunities`,
    ...opportunities.map((o) => `• ${o.title}: ${o.detail}`),
  ].join("\n");

  return {
    ...base,
    impactScore,
    keyImpactMetric: metric.value,
    keyImpactMetricLabel: metric.label,
    aiSummary,
    aiCommentary,
    risks,
    opportunities,
    summaryText: `Impact Summary — ${company.name}\n\n${aiSummary}`,
    commentaryText: "",
    risksText,
    opportunitiesText,
    metricsText,
    impactMetricsFromSubmission,
    economicContributionUnavailable,
  };
}

export function impactCountOrZero(n: number | null): number {
  return n ?? 0;
}

export function displayImpactCount(n: number | null): string {
  return n === null ? UNAVAILABLE_LABEL : n.toLocaleString();
}

export function listCompanyImpactOptions() {
  return resolveTalantonPortfolioCompanies().map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    sector: c.sector,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveCompanyImpactId(requested: string | null | undefined): string {
  if (requested && resolveTalantonPortfolioCompanies().some((c) => c.id === requested)) return requested;
  return resolveTalantonPortfolioCompanies()[0]?.id ?? "";
}

export function buildPortfolioImpactBriefing(): PortfolioImpactBriefing {
  const profiles = resolveTalantonPortfolioCompanies().map((c) => buildCompanyImpactProfile(c.id));
  const liveProfiles = profiles.filter((p) => p.impactMetricsFromSubmission);
  const countries = new Set(liveProfiles.map((p) => p.country));

  const sum = (pick: (p: CompanyImpactProfile) => number) =>
    liveProfiles.length ? liveProfiles.reduce((s, p) => s + pick(p), 0) : null;

  const summary: PortfolioImpactSummary = {
    jobsCreated: sum((p) => p.jobsCreated),
    jobsRetained: sum((p) => p.jobsRetained),
    womenEmployed: sum((p) => p.womenEmployed),
    youthEmployed: sum((p) => p.youthEmployed),
    peopleServed: sum((p) => p.peopleServed),
    communitiesImpacted: sum((p) => p.communitiesImpacted),
    countriesImpacted: liveProfiles.length ? countries.size : null,
    economicContributionUsd: null,
    hasAggregatedSubmissionData: liveProfiles.length > 0,
  };

  const health: ImpactHealth = summary.hasAggregatedSubmissionData
    ? {
        score: null,
        scoreUnavailable: true,
        band: "Unavailable",
        postureReason: `${liveProfiles.length} of ${profiles.length} holdings have submitted impact reports. Portfolio impact health score is not computed without a defined methodology on live submissions.`,
        healthText: "",
      }
    : {
        score: null,
        scoreUnavailable: true,
        band: "Unavailable",
        postureReason:
          "No company portal impact submissions are on file. Portfolio impact totals and health score are unavailable.",
        healthText: "",
      };
  health.healthText = [
    "Portfolio impact",
    health.scoreUnavailable ? "Score: Data unavailable" : `Score: ${health.score}/100 · ${health.band}`,
    health.postureReason,
    `Holdings with submissions: ${liveProfiles.length} / ${profiles.length}`,
  ].join("\n");

  const topCompanies: TopImpactCompany[] = [...liveProfiles]
    .sort((a, b) => b.peopleServed - a.peopleServed)
    .slice(0, 6)
    .map((p) => ({
      companyId: p.companyId,
      companyName: p.companyName,
      country: p.country,
      sector: p.sector,
      impactScore: p.impactScore,
      keyImpactMetric: p.keyImpactMetric,
      keyImpactMetricLabel: p.keyImpactMetricLabel,
      trend: p.trend,
      aiCommentary: p.aiCommentary,
      cardText: [
        `${p.companyName} — Top Impact Company`,
        `Impact score: ${p.impactScore}/100`,
        `Key metric: ${p.keyImpactMetricLabel} — ${p.keyImpactMetric}`,
        `Trend: ${p.trend}`,
        "",
        p.aiCommentary,
      ].join("\n"),
    }));

  const risks: ImpactRisk[] = [];
  const recommendedActions: ImpactRecommendedAction[] = summary.hasAggregatedSubmissionData
    ? [
        {
          id: "imp-act-submit",
          title: "Collect impact reports from remaining holdings",
          rationale: `${profiles.length - liveProfiles.length} portfolio companies have no submitted impact report on file.`,
          owner: "Portfolio Ops",
          urgency: "This month",
          companyId: null,
          companyName: null,
          cardText: "",
        },
      ]
    : [
        {
          id: "imp-act-none",
          title: "Establish company portal impact reporting",
          rationale:
            "No submitted impact reports are available. Impact intelligence will remain unavailable until companies submit portal impact data.",
          owner: "Impact Director",
          urgency: "This month",
          companyId: null,
          companyName: null,
          cardText: "",
        },
      ];

  for (const a of recommendedActions) {
    a.cardText = [
      `Recommended Action — ${a.title}`,
      `Owner: ${a.owner}`,
      `Urgency: ${a.urgency}`,
      a.companyName ? `Company: ${a.companyName}` : "Portfolio-wide",
      "",
      a.rationale,
    ].join("\n");
  }

  const fmt = (n: number | null) => (n === null ? UNAVAILABLE_LABEL : n.toLocaleString());
  const fmtUsd = (n: number | null) => (n === null ? UNAVAILABLE_LABEL : formatUsd(n));

  const overallImpact = summary.hasAggregatedSubmissionData
    ? `Aggregated from ${liveProfiles.length} submitted company impact report(s): ${fmt(summary.jobsCreated)} jobs created, ${fmt(summary.peopleServed)} people served, ${fmt(summary.communitiesImpacted)} communities impacted across ${fmt(summary.countriesImpacted)} countries.`
    : `No submitted company portal impact reports are on file for this portfolio. Portfolio impact totals are ${UNAVAILABLE_LABEL.toLowerCase()}.`;

  const keyAchievements = summary.hasAggregatedSubmissionData
    ? [
        `${liveProfiles.length} holdings have submitted impact reports on file.`,
        `People served (reported): ${fmt(summary.peopleServed)}.`,
        `Jobs created (reported): ${fmt(summary.jobsCreated)}.`,
      ]
    : [`Collect company portal impact submissions to populate portfolio impact intelligence.`];

  const highestImpactCompanies = topCompanies.slice(0, 4).map(
    (c) =>
      `${c.companyName} (${c.country}) — ${c.keyImpactMetricLabel}: ${c.keyImpactMetric}.`,
  );

  const areasRequiringAttention = [
    `${profiles.length - liveProfiles.length} holdings lack submitted impact reports.`,
    "Harmonise impact definitions in portal submissions before LP reporting.",
  ];

  const recommendedActionsNarrative = recommendedActions.map(
    (a) => `${a.title} (${a.owner}, ${a.urgency}) — ${a.rationale}`,
  );

  const briefingText = [
    "Impact Executive Briefing — Talanton Impact",
    `As of ${todayIso()} · Prepared for Harry Turner / Talanton leadership`,
    "",
    "Overall portfolio impact",
    overallImpact,
    "",
    "Key achievements",
    ...keyAchievements.map((x) => `• ${x}`),
    "",
    "Highest-impact companies",
    ...highestImpactCompanies.map((x) => `• ${x}`),
    "",
    "Areas requiring attention",
    ...areasRequiringAttention.map((x) => `• ${x}`),
    "",
    "Recommended actions",
    ...recommendedActionsNarrative.map((x, i) => `${i + 1}. ${x}`),
  ].join("\n");

  const summaryText = [
    "Portfolio Impact Summary",
    `Jobs created: ${fmt(summary.jobsCreated)}`,
    `Jobs retained: ${fmt(summary.jobsRetained)}`,
    `Women employed: ${fmt(summary.womenEmployed)}`,
    `Youth employed: ${fmt(summary.youthEmployed)}`,
    `People served: ${fmt(summary.peopleServed)}`,
    `Communities impacted: ${fmt(summary.communitiesImpacted)}`,
    `Countries impacted: ${fmt(summary.countriesImpacted)}`,
    `Economic contribution: ${fmtUsd(summary.economicContributionUsd)}`,
    `Source: company portal impact submissions (${liveProfiles.length} companies)`,
  ].join("\n");

  return {
    asOf: todayIso(),
    preparedFor: "Harry Turner and Talanton leadership",
    health,
    summary,
    overallImpact,
    keyAchievements,
    highestImpactCompanies,
    areasRequiringAttention,
    recommendedActionsNarrative,
    topCompanies,
    risks,
    recommendedActions,
    briefingText,
    summaryText,
    risksText: ["Impact Risks", ...risks.map((r) => `• [${r.severity}] ${r.title}: ${r.detail}`)].join("\n"),
    actionsText: [
      "Recommended Impact Actions",
      ...recommendedActions.map((a) => `• ${a.title} — ${a.owner} (${a.urgency}): ${a.rationale}`),
    ].join("\n"),
  };
}
