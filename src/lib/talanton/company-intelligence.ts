/**
 * Portfolio Intelligence — Company Intelligence for a single Talanton holding.
 */

import {
  companyTrainingDetail,
  formatUsd,
  TALANTON_ACTIONS,
  TALANTON_MY_TRAINING,
  TALANTON_PORTFOLIO_COMPANIES,
  TALANTON_QUARTERLY_REPORTS,
  TALANTON_RISKS,
  type PortfolioCompany,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";

export type CompanyHealthSnapshot = {
  healthScore: number;
  riskRating: RiskRating;
  complianceStatus: string;
  reportingStatus: string;
  lastReviewDate: string;
};

export type CompanyPerformanceOverview = {
  revenueTrend: string;
  growthTrend: string;
  headcount: number;
  cashPosition: string;
  keyKpis: Array<{ label: string; value: string; note: string }>;
};

export type CompanyRiskItem = {
  id: string;
  title: string;
  severity: RiskRating;
  description: string;
  mitigationStatus: string;
  owner: string;
  dueDate: string;
};

export type CompanyComplianceSnapshot = {
  trainingCompletionPct: number;
  policyCompliance: string;
  outstandingRequirements: string[];
};

export type CompanyActivityItem = {
  id: string;
  kind: "report" | "document" | "training" | "review" | "risk";
  title: string;
  detail: string;
  occurredAt: string;
};

export type CompanyRecommendedAction = {
  id: string;
  title: string;
  rationale: string;
  owner: string;
  urgency: "Today" | "This week" | "This month";
};

export type CompanyExecutiveSummary = {
  currentStatus: string;
  performanceTrend: string;
  riskProfile: string;
  compliancePosition: string;
  keyDevelopments: string[];
  recommendedFocusAreas: string[];
};

export type CompanyIntelligence = {
  company: PortfolioCompany;
  asOf: string;
  health: CompanyHealthSnapshot;
  summary: CompanyExecutiveSummary;
  performance: CompanyPerformanceOverview;
  risks: CompanyRiskItem[];
  compliance: CompanyComplianceSnapshot;
  recentActivity: CompanyActivityItem[];
  recommendedActions: CompanyRecommendedAction[];
  summaryText: string;
  healthText: string;
  performanceText: string;
  risksText: string;
  complianceText: string;
  activityText: string;
  actionsText: string;
};

function formatDisplayDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function riskPenalty(rating: RiskRating): number {
  switch (rating) {
    case "Low":
      return 0;
    case "Medium":
      return 8;
    case "High":
      return 18;
    case "Critical":
      return 28;
    default:
      return 8;
  }
}

export function companyHealthScore(company: PortfolioCompany): number {
  const report = TALANTON_QUARTERLY_REPORTS.find((r) => r.companyId === company.id);
  const reportScore =
    report?.status === "Submitted"
      ? 95
      : report?.status === "Due Soon"
        ? 70
        : report?.status === "Overdue"
          ? 35
          : 45;
  const raw =
    company.compliancePct * 0.5 + reportScore * 0.3 + (100 - riskPenalty(company.riskRating)) * 0.2;
  return Math.max(28, Math.min(98, Math.round(raw)));
}

function cashMonths(company: PortfolioCompany): number {
  // Implied working capital runway for briefing purposes (not audited cash).
  const impliedCash = Math.max(company.burnRateUsdMonthly * 4.5, company.annualRevenueUsd * 0.08);
  return Math.max(2, Math.round((impliedCash / Math.max(company.burnRateUsdMonthly, 1)) * 10) / 10);
}

function buildRisks(company: PortfolioCompany): CompanyRiskItem[] {
  const companyRisks = TALANTON_RISKS.filter(
    (r) => r.companyId === company.id && r.status !== "Closed",
  ).map((r) => ({
    id: r.id,
    title: r.title,
    severity: r.rating,
    description: `${r.category} risk owned by ${r.owner}. Likelihood ${r.likelihood}, impact ${r.impact}.`,
    mitigationStatus:
      r.status === "Mitigating"
        ? `Mitigating — controls advancing; due ${formatDisplayDate(r.dueDate)}.`
        : `Open — requires active follow-up; due ${formatDisplayDate(r.dueDate)}.`,
    owner: r.owner,
    dueDate: r.dueDate,
  }));

  if (companyRisks.length > 0) return companyRisks;

  // Synthetic residual risk so every company has an executive risk view.
  return [
    {
      id: `ti-synth-risk-${company.id}`,
      title:
        company.riskRating === "Low"
          ? "Routine portfolio monitoring"
          : `${company.riskRating} residual operating risk`,
      severity: company.riskRating,
      description:
        company.riskRating === "Low" || company.riskRating === "Medium"
          ? `${company.name} has no escalated register items. Residual risk is monitored through quarterly reporting and compliance cadence.`
          : `${company.name} carries an elevated risk rating without a closed mitigation plan on the register — leadership visibility required.`,
      mitigationStatus:
        company.riskRating === "Low"
          ? "On track — standard portfolio monitoring."
          : "Watch — confirm mitigation owner and next checkpoint.",
      owner: "Portfolio Ops",
      dueDate: company.lastReview,
    },
  ];
}

function buildActivity(company: PortfolioCompany): CompanyActivityItem[] {
  const report = TALANTON_QUARTERLY_REPORTS.find((r) => r.companyId === company.id);
  const training = TALANTON_MY_TRAINING.filter((t) => t.companyId === company.id);
  const items: CompanyActivityItem[] = [];

  if (report?.status === "Submitted" && report.lastSubmitted) {
    items.push({
      id: `act-report-${report.id}`,
      kind: "report",
      title: "Quarterly report submitted",
      detail: `${report.period} pack received and scored ${report.score}/100.`,
      occurredAt: report.lastSubmitted,
    });
  }

  for (const row of training.filter((t) => t.status === "Completed").slice(0, 2)) {
    items.push({
      id: `act-train-${row.id}`,
      kind: "training",
      title: "Training completed",
      detail: `${row.learnerName} completed assigned compliance module (${row.progress}%).`,
      occurredAt: company.lastReview,
    });
  }

  items.push({
    id: `act-doc-${company.id}`,
    kind: "document",
    title: "Documents uploaded",
    detail: `Investment memo and compliance certificate refreshed in the company file.`,
    occurredAt: company.lastQuarterlyReportDate,
  });

  items.push({
    id: `act-review-${company.id}`,
    kind: "review",
    title: "Portfolio review conducted",
    detail: `Last formal review with ${company.primaryContact} recorded.`,
    occurredAt: company.lastReview,
  });

  const riskProgress = TALANTON_RISKS.find(
    (r) => r.companyId === company.id && r.status === "Mitigating",
  );
  if (riskProgress) {
    items.push({
      id: `act-risk-${riskProgress.id}`,
      kind: "risk",
      title: "Risk mitigation progress",
      detail: `${riskProgress.title} — ${riskProgress.owner} advancing controls.`,
      occurredAt: riskProgress.dueDate,
    });
  }

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8);
}

function buildActions(
  company: PortfolioCompany,
  risks: CompanyRiskItem[],
  reportStatus: string,
): CompanyRecommendedAction[] {
  const actions: CompanyRecommendedAction[] = [];
  const openAction = TALANTON_ACTIONS.find(
    (a) => a.companyId === company.id && a.status !== "Done",
  );

  if (reportStatus === "Overdue" || reportStatus === "Not Started") {
    actions.push({
      id: `rec-report-${company.id}`,
      title: `Follow up ${company.name} quarterly report with ${company.primaryContact}`,
      rationale: `Reporting status is ${reportStatus}; IC visibility depends on a complete pack.`,
      owner: "Harry Turner",
      urgency: reportStatus === "Overdue" ? "This week" : "This month",
    });
  }

  for (const risk of risks.slice(0, 2)) {
    if (risk.severity === "High" || risk.severity === "Critical") {
      actions.push({
        id: `rec-risk-${risk.id}`,
        title: `Review ${risk.title} mitigation with ${risk.owner}`,
        rationale: risk.mitigationStatus,
        owner: risk.owner === "Portfolio Ops" ? "Portfolio Ops" : "Harry Turner",
        urgency: risk.severity === "Critical" ? "Today" : "This week",
      });
    }
  }

  if (company.compliancePct < 75 || company.outstandingTraining >= 6) {
    actions.push({
      id: `rec-comp-${company.id}`,
      title: `Schedule ${company.name} compliance review`,
      rationale: `Compliance at ${company.compliancePct}% with ${company.outstandingTraining} outstanding training items.`,
      owner: "Head of Compliance",
      urgency: "This week",
    });
  }

  if (openAction) {
    actions.push({
      id: `rec-act-${openAction.id}`,
      title: openAction.title,
      rationale: `Open ${openAction.priority} priority action due ${formatDisplayDate(openAction.dueDate)} (${openAction.source}).`,
      owner: openAction.owner,
      urgency: openAction.priority === "High" ? "This week" : "This month",
    });
  }

  if (company.revenueGrowthPct < 12 && company.burnRateUsdMonthly > 100_000) {
    actions.push({
      id: `rec-perf-${company.id}`,
      title: `Review ${company.name} performance trajectory`,
      rationale: `Growth at ${company.revenueGrowthPct}% with elevated burn warrants a focused operating review.`,
      owner: "Portfolio Ops",
      urgency: "This month",
    });
  }

  if (actions.length === 0) {
    actions.push({
      id: `rec-maintain-${company.id}`,
      title: `Confirm next review checkpoint with ${company.primaryContact}`,
      rationale: `${company.name} is currently stable — keep the cadence tight ahead of the next board materials cycle.`,
      owner: "Portfolio Ops",
      urgency: "This month",
    });
  }

  const seen = new Set<string>();
  return actions.filter((a) => {
    const key = a.title.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 6);
}

export function listCompanyIntelligenceOptions() {
  return TALANTON_PORTFOLIO_COMPANIES.map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    sector: c.sector,
  }));
}

export function resolveCompanyIntelligenceId(companyId?: string | null): string {
  if (companyId && TALANTON_PORTFOLIO_COMPANIES.some((c) => c.id === companyId)) {
    return companyId;
  }
  return TALANTON_PORTFOLIO_COMPANIES[0]!.id;
}

export function buildCompanyIntelligence(companyId?: string | null): CompanyIntelligence {
  const id = resolveCompanyIntelligenceId(companyId);
  const company = TALANTON_PORTFOLIO_COMPANIES.find((c) => c.id === id)!;
  const report = TALANTON_QUARTERLY_REPORTS.find((r) => r.companyId === company.id);
  const training = companyTrainingDetail(company);
  const healthScore = companyHealthScore(company);
  const reportingStatus = report?.status ?? "Not Started";
  const complianceStatus =
    company.compliancePct >= 90
      ? "On track"
      : company.compliancePct >= 75
        ? "Watch"
        : "At risk";

  const health: CompanyHealthSnapshot = {
    healthScore,
    riskRating: company.riskRating,
    complianceStatus: `${complianceStatus} (${company.compliancePct}%)`,
    reportingStatus: report
      ? `${reportingStatus}${report.period ? ` · ${report.period}` : ""}`
      : "Not Started",
    lastReviewDate: company.lastReview,
  };

  const risks = buildRisks(company);
  const monthsCash = cashMonths(company);
  const growthLabel =
    company.revenueGrowthPct >= 20
      ? "Accelerating"
      : company.revenueGrowthPct >= 12
        ? "Solid"
        : company.revenueGrowthPct >= 8
          ? "Softening"
          : "Under pressure";

  const performance: CompanyPerformanceOverview = {
    revenueTrend: `${formatUsd(company.annualRevenueUsd)} annual · ${growthLabel.toLowerCase()} trajectory`,
    growthTrend: `${company.revenueGrowthPct}% revenue growth · ${growthLabel}`,
    headcount: company.employeeCount,
    cashPosition: `~${monthsCash} months implied runway at ${formatUsd(company.burnRateUsdMonthly)}/mo burn`,
    keyKpis: [
      {
        label: "Invested capital",
        value: formatUsd(company.investmentAmountUsd),
        note: `${company.ownershipPct}% ownership`,
      },
      {
        label: "MOIC",
        value: `${company.roiMoic.toFixed(1)}x`,
        note: "Current mark",
      },
      {
        label: "Annual revenue",
        value: formatUsd(company.annualRevenueUsd),
        note: `${company.revenueGrowthPct}% growth`,
      },
      {
        label: "Monthly burn",
        value: formatUsd(company.burnRateUsdMonthly),
        note: `${monthsCash} mo runway signal`,
      },
    ],
  };

  const outstandingRequirements: string[] = [];
  if (reportingStatus === "Overdue" || reportingStatus === "Not Started") {
    outstandingRequirements.push(`Complete and submit ${report?.period ?? "current"} quarterly pack.`);
  } else if (reportingStatus === "Due Soon") {
    outstandingRequirements.push(`${report?.period ?? "Current"} quarterly pack due ${formatDisplayDate(report?.nextDue ?? company.lastReview)}.`);
  }
  if (company.outstandingTraining > 0) {
    outstandingRequirements.push(
      `Clear ${company.outstandingTraining} outstanding training assignments (${training.outstandingUsers} learners incomplete).`,
    );
  }
  for (const risk of risks.filter((r) => r.severity === "High" || r.severity === "Critical").slice(0, 2)) {
    outstandingRequirements.push(`Advance mitigation on: ${risk.title}.`);
  }
  if (outstandingRequirements.length === 0) {
    outstandingRequirements.push("No material outstanding requirements this cycle.");
  }

  const compliance: CompanyComplianceSnapshot = {
    trainingCompletionPct: company.compliancePct,
    policyCompliance:
      company.compliancePct >= 85
        ? "Policy acknowledgement and mandatory modules largely complete."
        : company.compliancePct >= 70
          ? "Policy coverage acceptable with residual module gaps."
          : "Policy and training coverage below Talanton threshold — escalate.",
    outstandingRequirements,
  };

  const recentActivity = buildActivity(company);
  const recommendedActions = buildActions(company, risks, reportingStatus);

  const topRisk = risks[0];
  const summary: CompanyExecutiveSummary = {
    currentStatus: [
      `${company.name} (${company.sector}, ${company.city}) is in a ${complianceStatus.toLowerCase()} operating posture with health score ${healthScore}/100.`,
      `Risk rating ${company.riskRating}; quarterly reporting is ${reportingStatus.toLowerCase()}.`,
      `Primary contact ${company.primaryContact}.`,
    ].join(" "),
    performanceTrend: [
      `Revenue run-rate ${formatUsd(company.annualRevenueUsd)} with ${company.revenueGrowthPct}% growth (${growthLabel.toLowerCase()}).`,
      `Headcount ${company.employeeCount}; burn ${formatUsd(company.burnRateUsdMonthly)}/mo implies roughly ${monthsCash} months of runway signal.`,
      `Investment mark ${company.roiMoic.toFixed(1)}x MOIC on ${formatUsd(company.investmentAmountUsd)} deployed (${company.ownershipPct}% ownership).`,
    ].join(" "),
    riskProfile: topRisk
      ? `${company.riskRating} overall. Lead concern: ${topRisk.title} — ${topRisk.mitigationStatus}`
      : `${company.riskRating} overall with no escalated register items.`,
    compliancePosition: [
      `Training completion ${company.compliancePct}% (${training.status}).`,
      compliance.policyCompliance,
      `${company.outstandingTraining} outstanding training items across enrolled users.`,
    ].join(" "),
    keyDevelopments: [
      report?.status === "Submitted"
        ? `${report.period} quarterly pack submitted (score ${report.score}/100).`
        : `${report?.period ?? "Q2 2026"} reporting is ${reportingStatus.toLowerCase()}.`,
      topRisk
        ? `${topRisk.title} remains ${topRisk.mitigationStatus.split("—")[0]?.trim().toLowerCase() ?? "open"}.`
        : "No critical risk escalations on the current register.",
      `Last portfolio review ${formatDisplayDate(company.lastReview)} with ${company.primaryContact}.`,
    ],
    recommendedFocusAreas: recommendedActions.slice(0, 3).map((a) => a.title),
  };

  const summaryText = [
    `${company.name} — Executive Summary`,
    `As of ${formatDisplayDate(new Date().toISOString().slice(0, 10))}`,
    "",
    "Current company status",
    summary.currentStatus,
    "",
    "Performance trend",
    summary.performanceTrend,
    "",
    "Risk profile",
    summary.riskProfile,
    "",
    "Compliance position",
    summary.compliancePosition,
    "",
    "Key developments",
    ...summary.keyDevelopments.map((d) => `• ${d}`),
    "",
    "Recommended focus areas",
    ...summary.recommendedFocusAreas.map((d, i) => `${i + 1}. ${d}`),
  ].join("\n");

  const healthText = [
    `${company.name} — Company Health`,
    `Health Score: ${health.healthScore}/100`,
    `Risk Rating: ${health.riskRating}`,
    `Compliance Status: ${health.complianceStatus}`,
    `Reporting Status: ${health.reportingStatus}`,
    `Last Review Date: ${formatDisplayDate(health.lastReviewDate)}`,
  ].join("\n");

  const performanceText = [
    `${company.name} — Performance Overview`,
    `Revenue Trend: ${performance.revenueTrend}`,
    `Growth Trend: ${performance.growthTrend}`,
    `Headcount: ${performance.headcount}`,
    `Cash Position: ${performance.cashPosition}`,
    "",
    "Key KPIs",
    ...performance.keyKpis.map((k) => `• ${k.label}: ${k.value} (${k.note})`),
  ].join("\n");

  const risksText = [
    `${company.name} — Risks & Concerns`,
    ...risks.map(
      (r, i) =>
        `${i + 1}. [${r.severity}] ${r.title}\n${r.description}\nMitigation: ${r.mitigationStatus}\nOwner: ${r.owner} · Due ${formatDisplayDate(r.dueDate)}`,
    ),
  ].join("\n\n");

  const complianceText = [
    `${company.name} — Compliance & Assurance`,
    `Training Completion: ${compliance.trainingCompletionPct}%`,
    `Policy Compliance: ${compliance.policyCompliance}`,
    "",
    "Outstanding Requirements",
    ...compliance.outstandingRequirements.map((r) => `• ${r}`),
  ].join("\n");

  const activityText = [
    `${company.name} — Recent Activity`,
    ...recentActivity.map(
      (a) => `${formatDisplayDate(a.occurredAt)} — ${a.title}. ${a.detail}`,
    ),
  ].join("\n");

  const actionsText = [
    `${company.name} — Recommended Actions`,
    ...recommendedActions.map(
      (a, i) =>
        `${i + 1}. [${a.urgency}] ${a.title}\n${a.rationale}\nOwner: ${a.owner}`,
    ),
  ].join("\n\n");

  return {
    company,
    asOf: new Date().toISOString().slice(0, 10),
    health,
    summary,
    performance,
    risks,
    compliance,
    recentActivity,
    recommendedActions,
    summaryText,
    healthText,
    performanceText,
    risksText,
    complianceText,
    activityText,
    actionsText,
  };
}

export function formatCompanyRiskText(risk: CompanyRiskItem, companyName: string): string {
  return [
    `${companyName} — ${risk.title}`,
    `Severity: ${risk.severity}`,
    risk.description,
    `Mitigation: ${risk.mitigationStatus}`,
    `Owner: ${risk.owner}`,
    `Due: ${formatDisplayDate(risk.dueDate)}`,
  ].join("\n");
}

export function formatCompanyActionText(action: CompanyRecommendedAction): string {
  return [
    action.title,
    `Urgency: ${action.urgency}`,
    `Owner: ${action.owner}`,
    action.rationale,
  ].join("\n");
}
