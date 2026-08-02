/**
 * Impact Intelligence — portfolio and company impact for Talanton leadership.
 * Metrics are executive fixtures derived from holdings (not audited impact statements).
 */

import {
  formatUsd,
  TALANTON_PORTFOLIO_COMPANIES,
  type PortfolioCompany,
} from "@/lib/talanton/portfolio-data";

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
  economicContributionUsd: number;
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
  jobsCreated: number;
  jobsRetained: number;
  womenEmployed: number;
  youthEmployed: number;
  peopleServed: number;
  communitiesImpacted: number;
  countriesImpacted: number;
  economicContributionUsd: number;
};

export type ImpactHealth = {
  score: number;
  band: "Strong" | "Healthy" | "Watch" | "At Risk";
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

function womenShare(company: PortfolioCompany): number {
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

function youthShare(company: PortfolioCompany): number {
  const seed = hashSeed(`${company.id}-y`) % 15;
  const base = company.sector.toLowerCase().includes("fintech") ||
    company.sector.toLowerCase().includes("connectivity")
      ? 0.52
      : 0.41;
  return clamp(base + (seed - 7) * 0.01, 0.28, 0.65);
}

function jobsCreatedFor(company: PortfolioCompany): number {
  const growthFactor = clamp(company.revenueGrowthPct / 100, 0.04, 0.4);
  const created = Math.round(company.employeeCount * (0.12 + growthFactor * 0.55));
  return Math.max(8, created);
}

function jobsRetainedFor(company: PortfolioCompany): number {
  const retention = company.revenueGrowthPct < 10 ? 0.88 : 0.94;
  return Math.round(company.employeeCount * retention);
}

function peopleServedFor(company: PortfolioCompany): number {
  return Math.round(company.employeeCount * sectorPeopleMultiplier(company.sector) * (1 + company.revenueGrowthPct / 200));
}

function communitiesFor(company: PortfolioCompany): number {
  const base = sectorCommunityBase(company.sector);
  const scale = Math.round(Math.sqrt(company.employeeCount) / 2);
  return Math.max(3, base + scale + (hashSeed(company.id) % 5));
}

function economicContributionFor(company: PortfolioCompany): number {
  // Local wages, supplier spend, and taxes proxy — not audited GDP contribution.
  return Math.round(company.annualRevenueUsd * 0.62 + company.employeeCount * 4200);
}

function impactTrend(company: PortfolioCompany): ImpactTrend {
  if (company.revenueGrowthPct >= 18 && company.riskRating !== "Critical") return "Improving";
  if (company.revenueGrowthPct < 10 || company.riskRating === "High" || company.riskRating === "Critical") {
    return "Declining";
  }
  return "Stable";
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

function buildCompanyRisks(company: PortfolioCompany, trend: ImpactTrend): CompanyImpactProfile["risks"] {
  const risks: CompanyImpactProfile["risks"] = [];
  if (trend === "Declining") {
    risks.push({
      id: `${company.id}-emp`,
      title: "Declining employment momentum",
      severity: company.riskRating === "Critical" ? "Critical" : "Elevated",
      detail: `${company.name} shows softer hiring and retention signals versus prior period. Headcount leverage is not keeping pace with mission targets in ${company.country}.`,
    });
  }
  if (company.compliancePct < 80) {
    risks.push({
      id: `${company.id}-target`,
      title: "Missed impact reporting cadence",
      severity: "Watch",
      detail: `Impact data quality is uneven (compliance ${company.compliancePct}%). Community and jobs figures need a cleaner Q3 submission before board pack lock.`,
    });
  }
  if (
    company.sector.toLowerCase().includes("agriculture") ||
    company.sector.toLowerCase().includes("apparel")
  ) {
    risks.push({
      id: `${company.id}-reach`,
      title: "Reduced community reach risk",
      severity: "Watch",
      detail: `Seasonality and supply constraints could compress communities reached in the next two quarters if offtake or farmgate programmes slip.`,
    });
  }
  if (risks.length === 0) {
    risks.push({
      id: `${company.id}-watch`,
      title: "Maintain impact measurement discipline",
      severity: "Watch",
      detail: `No acute impact deterioration detected. Continue monthly jobs and beneficiary tracking so Talanton can defend impact claims in LP reporting.`,
    });
  }
  return risks.slice(0, 3);
}

function buildCompanyOpportunities(company: PortfolioCompany): CompanyImpactProfile["opportunities"] {
  const opportunities: CompanyImpactProfile["opportunities"] = [
    {
      id: `${company.id}-opp-1`,
      title: "Deepen youth pathways",
      detail: `Partner with local TVET / apprenticeship programmes in ${company.city} to lift youth employment share while supporting ${company.sector.toLowerCase()} skills.`,
    },
    {
      id: `${company.id}-opp-2`,
      title: "Women’s economic participation",
      detail: `Structured advancement and supplier inclusion for women-owned MSMEs can raise both impact score and operational resilience.`,
    },
  ];
  if (
    company.sector.toLowerCase().includes("agriculture") ||
    company.sector.toLowerCase().includes("food") ||
    company.sector.toLowerCase().includes("forestry")
  ) {
    opportunities.push({
      id: `${company.id}-opp-3`,
      title: "Expand smallholder / community programmes",
      detail: `Incremental offtake or agroforestry packages could add communities impacted without proportional opex if designed with existing field teams.`,
    });
  } else if (
    company.sector.toLowerCase().includes("fintech") ||
    company.sector.toLowerCase().includes("connectivity")
  ) {
    opportunities.push({
      id: `${company.id}-opp-3`,
      title: "Scale last-mile access",
      detail: `Target under-served counties/districts to grow people served while reinforcing Talanton’s inclusion thesis.`,
    });
  } else {
    opportunities.push({
      id: `${company.id}-opp-3`,
      title: "Local supplier development",
      detail: `Increase domestic procurement share to amplify economic contribution in ${company.country} and reduce FX exposure.`,
    });
  }
  return opportunities.slice(0, 3);
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

export function buildCompanyImpactProfile(companyId: string): CompanyImpactProfile {
  const company =
    TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === companyId) ?? TALANTON_PORTFOLIO_COMPANIES[0];
  const womenPct = womenShare(company);
  const youthPct = youthShare(company);
  const jobsCreated = jobsCreatedFor(company);
  const jobsRetained = jobsRetainedFor(company);
  const womenEmployed = Math.round(company.employeeCount * womenPct);
  const youthEmployed = Math.round(company.employeeCount * youthPct);
  const peopleServed = peopleServedFor(company);
  const communitiesImpacted = communitiesFor(company);
  const economicContributionUsd = economicContributionFor(company);
  const trend = impactTrend(company);

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
  };

  const impactScore = impactScoreFor(company, base);
  const metric = keyMetric({ ...base, sector: company.sector });
  const risks = buildCompanyRisks(company, trend);
  const opportunities = buildCompanyOpportunities(company);
  const aiSummary = buildAiSummary(company, impactScore, trend, jobsCreated, peopleServed, communitiesImpacted);
  const aiCommentary = buildAiCommentary(company, impactScore, trend, womenPct, youthPct);

  const metricsText = [
    `${company.name} — Impact Metrics`,
    `Impact score: ${impactScore}/100 (${trend})`,
    `Jobs created: ${jobsCreated.toLocaleString()}`,
    `Jobs retained: ${jobsRetained.toLocaleString()}`,
    `Women employed: ${womenEmployed.toLocaleString()} (${Math.round(womenPct * 100)}%)`,
    `Youth employed: ${youthEmployed.toLocaleString()} (${Math.round(youthPct * 100)}%)`,
    `People served: ${peopleServed.toLocaleString()}`,
    `Communities impacted: ${communitiesImpacted}`,
    `Economic contribution: ${formatUsd(economicContributionUsd)}`,
  ].join("\n");

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
    summaryText: `AI Impact Summary — ${company.name}\n\n${aiSummary}`,
    commentaryText: `AI Impact Commentary — ${company.name}\n\n${aiCommentary}`,
    risksText,
    opportunitiesText,
    metricsText,
  };
}

export function listCompanyImpactOptions() {
  return TALANTON_PORTFOLIO_COMPANIES.map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    sector: c.sector,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export function resolveCompanyImpactId(requested: string | null | undefined): string {
  if (requested && TALANTON_PORTFOLIO_COMPANIES.some((c) => c.id === requested)) return requested;
  return TALANTON_PORTFOLIO_COMPANIES[0]?.id ?? "";
}

export function buildPortfolioImpactBriefing(): PortfolioImpactBriefing {
  const profiles = TALANTON_PORTFOLIO_COMPANIES.map((c) => buildCompanyImpactProfile(c.id));
  const countries = new Set(profiles.map((p) => p.country));

  const summary: PortfolioImpactSummary = {
    jobsCreated: profiles.reduce((s, p) => s + p.jobsCreated, 0),
    jobsRetained: profiles.reduce((s, p) => s + p.jobsRetained, 0),
    womenEmployed: profiles.reduce((s, p) => s + p.womenEmployed, 0),
    youthEmployed: profiles.reduce((s, p) => s + p.youthEmployed, 0),
    peopleServed: profiles.reduce((s, p) => s + p.peopleServed, 0),
    communitiesImpacted: profiles.reduce((s, p) => s + p.communitiesImpacted, 0),
    countriesImpacted: countries.size,
    economicContributionUsd: profiles.reduce((s, p) => s + p.economicContributionUsd, 0),
  };

  const avgScore = Math.round(profiles.reduce((s, p) => s + p.impactScore, 0) / Math.max(profiles.length, 1));
  const declining = profiles.filter((p) => p.trend === "Declining");
  const improving = profiles.filter((p) => p.trend === "Improving");

  const band: ImpactHealth["band"] =
    avgScore >= 80 && declining.length <= 2
      ? "Strong"
      : avgScore >= 68 && declining.length <= 4
        ? "Healthy"
        : avgScore >= 55
          ? "Watch"
          : "At Risk";

  const health: ImpactHealth = {
    score: avgScore,
    band,
    postureReason:
      band === "Strong"
        ? "Portfolio impact delivery is broad-based across jobs, inclusion, and community reach, with limited declining holdings."
        : band === "Healthy"
          ? "Impact outcomes remain solid, but a subset of holdings needs tighter employment or community follow-up before the next LP cycle."
          : band === "Watch"
            ? "Impact momentum is uneven. Several companies show declining employment or reach signals that require executive attention."
            : "Impact performance is below Talanton’s expected standard. Stabilise declining holdings and restore measurement discipline immediately.",
    healthText: "",
  };
  health.healthText = [
    "Impact Health Score",
    `Score: ${health.score}/100 · ${health.band}`,
    health.postureReason,
    `Improving: ${improving.length} · Declining: ${declining.length} · Holdings: ${profiles.length}`,
  ].join("\n");

  const topCompanies: TopImpactCompany[] = [...profiles]
    .sort((a, b) => b.impactScore - a.impactScore)
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
  for (const p of declining.slice(0, 4)) {
    risks.push({
      id: `port-risk-${p.companyId}`,
      title: `Declining employment / impact momentum — ${p.companyName}`,
      severity: p.impactScore < 55 ? "Critical" : "Elevated",
      companyId: p.companyId,
      companyName: p.companyName,
      detail: `${p.companyName} (${p.country}) is on a declining impact trajectory (score ${p.impactScore}/100). Jobs created ${p.jobsCreated.toLocaleString()}; communities ${p.communitiesImpacted}. Requires Impact Director follow-up.`,
      cardText: "",
    });
  }
  if (summary.communitiesImpacted < profiles.length * 12) {
    risks.push({
      id: "port-risk-community",
      title: "Reduced community reach versus portfolio plan",
      severity: "Watch",
      companyId: null,
      companyName: null,
      detail:
        "Aggregate communities impacted sits below the internal stretch plan. Agriculture and manufacturing holdings should confirm field programme continuity for Q3.",
      cardText: "",
    });
  }
  risks.push({
    id: "port-risk-targets",
    title: "Missed impact targets risk on LP reporting",
    severity: declining.length >= 3 ? "Elevated" : "Watch",
    companyId: null,
    companyName: null,
    detail: `${declining.length} holdings show declining trends. Without remediation, jobs and beneficiary narratives for the next investor update will look soft versus Seed/Series peers.`,
    cardText: "",
  });
  for (const r of risks) {
    r.cardText = [`Impact Risk — ${r.title}`, `Severity: ${r.severity}`, r.companyName ? `Company: ${r.companyName}` : "Portfolio-wide", "", r.detail].join("\n");
  }

  const recommendedActions: ImpactRecommendedAction[] = [
    {
      id: "imp-act-1",
      title: "Stabilise declining-impact holdings",
      rationale: `${declining
        .slice(0, 3)
        .map((p) => p.companyName)
        .join(", ") || "Priority holdings"} need 30-day retention and community programme plans before board pack freeze.`,
      owner: "Impact Director",
      urgency: declining.length >= 3 ? "Today" : "This week",
      companyId: declining[0]?.companyId ?? null,
      companyName: declining[0]?.companyName ?? null,
      cardText: "",
    },
    {
      id: "imp-act-2",
      title: "Lock Q3 jobs & beneficiary submissions",
      rationale:
        "Standardise jobs created/retained and people served definitions across all 19 holdings so LP impact pages reconcile to the Impact Dashboard.",
      owner: "Portfolio Ops",
      urgency: "This week",
      companyId: null,
      companyName: null,
      cardText: "",
    },
    {
      id: "imp-act-3",
      title: "Showcase top impact companies in LP update",
      rationale: `${topCompanies
        .slice(0, 3)
        .map((c) => c.companyName)
        .join(", ")} are strongest proof points — package commentary for the next investor communication.`,
      owner: "Harry Turner",
      urgency: "This month",
      companyId: topCompanies[0]?.companyId ?? null,
      companyName: topCompanies[0]?.companyName ?? null,
      cardText: "",
    },
    {
      id: "imp-act-4",
      title: "Advance women & youth employment programmes",
      rationale:
        "Portfolio women and youth shares are solid but uneven. Target manufacturing and energy holdings for structured advancement plans.",
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

  const overallImpact = `Across ${profiles.length} holdings in ${summary.countriesImpacted} countries, Talanton’s portfolio supports approximately ${summary.jobsCreated.toLocaleString()} jobs created and ${summary.jobsRetained.toLocaleString()} jobs retained, with ${summary.womenEmployed.toLocaleString()} women and ${summary.youthEmployed.toLocaleString()} youth in paid roles. Reach extends to roughly ${summary.peopleServed.toLocaleString()} people and ${summary.communitiesImpacted.toLocaleString()} communities, with estimated economic contribution of ${formatUsd(summary.economicContributionUsd)}. Impact Health stands at ${health.score}/100 (${health.band}).`;

  const keyAchievements = [
    `${improving.length} holdings are on an improving impact trajectory, led by ${topCompanies[0]?.companyName ?? "top performers"} on jobs and community reach.`,
    `Women employed across the portfolio: ${summary.womenEmployed.toLocaleString()} — a credible inclusion signal for LP reporting.`,
    `People served exceeds ${summary.peopleServed.toLocaleString()}, concentrated in fintech, connectivity, and healthcare holdings.`,
    `Geographic footprint spans ${summary.countriesImpacted} countries across Sub-Saharan Africa without over-concentration in a single market.`,
  ];

  const highestImpactCompanies = topCompanies.slice(0, 4).map(
    (c) =>
      `${c.companyName} (${c.country}) — score ${c.impactScore}/100; ${c.keyImpactMetricLabel.toLowerCase()} ${c.keyImpactMetric}; trend ${c.trend}.`,
  );

  const areasRequiringAttention = [
    ...declining.slice(0, 3).map(
      (p) =>
        `${p.companyName}: declining impact trend (score ${p.impactScore}/100) — verify employment and community programme continuity.`,
    ),
    "Harmonise impact definitions before the next investor update so jobs and beneficiary figures do not drift between company packs.",
    declining.length >= 3
      ? "Multiple declining holdings elevate LP narrative risk — treat Impact Dashboard remediation as a leadership priority this week."
      : "Keep stretch community-reach targets visible so agriculture and manufacturing do not quietly under-deliver.",
  ];

  const recommendedActionsNarrative = recommendedActions.map(
    (a) => `${a.title} (${a.owner}, ${a.urgency}) — ${a.rationale}`,
  );

  const briefingText = [
    "AI Impact Executive Briefing — Talanton Impact",
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
    `Jobs created: ${summary.jobsCreated.toLocaleString()}`,
    `Jobs retained: ${summary.jobsRetained.toLocaleString()}`,
    `Women employed: ${summary.womenEmployed.toLocaleString()}`,
    `Youth employed: ${summary.youthEmployed.toLocaleString()}`,
    `People served: ${summary.peopleServed.toLocaleString()}`,
    `Communities impacted: ${summary.communitiesImpacted.toLocaleString()}`,
    `Countries impacted: ${summary.countriesImpacted}`,
    `Economic contribution (est.): ${formatUsd(summary.economicContributionUsd)}`,
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
