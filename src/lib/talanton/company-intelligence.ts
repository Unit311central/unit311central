/**
 * Portfolio Intelligence — Company Intelligence for a single Talanton holding.
 */

import {
  companyTrainingDetail,
  formatUsd,
  type PortfolioCompany,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";
import { companyReportingStatus } from "@/lib/talanton/portfolio-reporting-status";
import { resolveTalantonPortfolioCompanies } from "@/lib/talanton/portfolio-companies-runtime";
import {
  openGovernanceActions,
  openGovernanceRisks,
  resolveTalantonIntelligenceContext,
} from "@/lib/talanton/talanton-intelligence-context";
import type { TiRiskRegisterEntry } from "@/lib/talanton/risk-register-store";

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

function tiRiskSeverity(r: TiRiskRegisterEntry): RiskRating {
  if (r.rating >= 20) return "Critical";
  if (r.rating >= 12) return "High";
  if (r.rating >= 6) return "Medium";
  return "Low";
}

export function companyHealthScore(company: PortfolioCompany): number {
  const reporting = companyReportingStatus(company);
  const reportScore =
    reporting === "Submitted"
      ? 95
      : reporting === "Due soon"
        ? 70
        : reporting === "Overdue"
          ? 35
          : 45;
  const raw =
    company.compliancePct * 0.5 + reportScore * 0.3 + (100 - riskPenalty(company.riskRating)) * 0.2;
  return Math.max(28, Math.min(98, Math.round(raw)));
}

function cashMonths(company: PortfolioCompany): number {
  const impliedCash = Math.max(company.burnRateUsdMonthly * 4.5, company.annualRevenueUsd * 0.08);
  return Math.max(2, Math.round((impliedCash / Math.max(company.burnRateUsdMonthly, 1)) * 10) / 10);
}

function reportingStatusLabel(status: ReturnType<typeof companyReportingStatus>): string {
  switch (status) {
    case "Submitted":
      return "Submitted";
    case "Due soon":
      return "Due soon";
    case "Overdue":
      return "Overdue";
    default:
      return "Not started";
  }
}

function governanceRiskMentionsCompany(r: TiRiskRegisterEntry, company: PortfolioCompany): boolean {
  const hay = `${r.description} ${r.mitigation}`.toLowerCase();
  const name = company.name.toLowerCase();
  return hay.includes(name);
}

function buildRisks(company: PortfolioCompany): CompanyRiskItem[] {
  const ctx = resolveTalantonIntelligenceContext();
  const registerRisks = openGovernanceRisks(ctx.governanceRisks)
    .filter((r) => governanceRiskMentionsCompany(r, company))
    .map((r) => ({
      id: r.id,
      title: r.description.slice(0, 80) + (r.description.length > 80 ? "…" : ""),
      severity: tiRiskSeverity(r),
      description: r.description,
      mitigationStatus: r.mitigation
        ? `${r.status} — ${r.mitigation}`
        : `${r.status} — review ${formatDisplayDate(r.reviewDate)}.`,
      owner: r.owner,
      dueDate: r.reviewDate || r.dateAdded,
    }));

  if (registerRisks.length > 0) return registerRisks;

  if (company.riskRating === "High" || company.riskRating === "Critical") {
    return [
      {
        id: `pc-risk-${company.id}`,
        title: `${company.riskRating} portfolio risk rating`,
        severity: company.riskRating,
        description: `${company.name} is rated ${company.riskRating} on the portfolio company record (Supabase portfolio_companies.risk_rating).`,
        mitigationStatus: "Confirm mitigation owner and next checkpoint with portfolio leadership.",
        owner: "Portfolio Ops",
        dueDate: company.lastReview,
      },
    ];
  }

  return [];
}

function buildActivity(company: PortfolioCompany): CompanyActivityItem[] {
  const items: CompanyActivityItem[] = [];
  const reporting = companyReportingStatus(company);

  if (reporting === "Submitted" && company.lastQuarterlyReportDate) {
    items.push({
      id: `act-report-${company.id}`,
      kind: "report",
      title: "Quarterly reporting on file",
      detail: `Last quarterly submission date ${company.lastQuarterlyReportDate} (portfolio_companies.last_quarterly_report_date).`,
      occurredAt: company.lastQuarterlyReportDate,
    });
  }

  if (company.lastReview) {
    items.push({
      id: `act-review-${company.id}`,
      kind: "review",
      title: "Portfolio review recorded",
      detail: `Last formal review with ${company.primaryContact} on file.`,
      occurredAt: company.lastReview,
    });
  }

  const ctx = resolveTalantonIntelligenceContext();
  for (const r of openGovernanceRisks(ctx.governanceRisks)
    .filter((row) => governanceRiskMentionsCompany(row, company))
    .slice(0, 2)) {
    items.push({
      id: `act-risk-${r.id}`,
      kind: "risk",
      title: "Governance risk register item",
      detail: r.description.slice(0, 160) + (r.description.length > 160 ? "…" : ""),
      occurredAt: r.reviewDate || r.dateAdded,
    });
  }

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 8);
}

function buildActions(
  company: PortfolioCompany,
  risks: CompanyRiskItem[],
  reportingLabel: string,
): CompanyRecommendedAction[] {
  const actions: CompanyRecommendedAction[] = [];
  const reporting = companyReportingStatus(company);
  const ctx = resolveTalantonIntelligenceContext();
  const openAction = openGovernanceActions(ctx.governanceActions)[0];

  if (reporting === "Overdue" || reporting === "Not started") {
    actions.push({
      id: `rec-report-${company.id}`,
      title: `Follow up ${company.name} quarterly report with ${company.primaryContact}`,
      rationale: `Reporting status is ${reportingLabel}; visibility depends on an up-to-date submission date on the portfolio record.`,
      owner: "Harry Turner",
      urgency: reporting === "Overdue" ? "This week" : "This month",
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
      rationale: `Compliance at ${company.compliancePct}% with ${company.outstandingTraining} outstanding training items (portfolio_companies).`,
      owner: "Head of Compliance",
      urgency: "This week",
    });
  }

  if (openAction) {
    actions.push({
      id: `rec-act-${openAction.id}`,
      title: openAction.title,
      rationale: `Open governance action due ${formatDisplayDate(openAction.dueDate)} (${openAction.status}).`,
      owner: openAction.owner,
      urgency: openAction.status === "Overdue" ? "This week" : "This month",
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
      rationale: `${company.name} has no escalated items on current Supabase-backed signals — maintain review cadence.`,
      owner: "Portfolio Ops",
      urgency: "This month",
    });
  }

  const seen = new Set<string>();
  return actions
    .filter((a) => {
      const key = a.title.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 6);
}

export function listCompanyIntelligenceOptions() {
  return resolveTalantonPortfolioCompanies().map((c) => ({
    id: c.id,
    name: c.name,
    country: c.country,
    sector: c.sector,
  }));
}

export function resolveCompanyIntelligenceId(companyId?: string | null): string {
  if (companyId && resolveTalantonPortfolioCompanies().some((c) => c.id === companyId)) {
    return companyId;
  }
  return resolveTalantonPortfolioCompanies()[0]!.id;
}

export function buildCompanyIntelligence(companyId?: string | null): CompanyIntelligence {
  const id = resolveCompanyIntelligenceId(companyId);
  const company = resolveTalantonPortfolioCompanies().find((c) => c.id === id)!;
  const training = companyTrainingDetail(company);
  const healthScore = companyHealthScore(company);
  const reporting = companyReportingStatus(company);
  const reportingStatus = reportingStatusLabel(reporting);
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
    reportingStatus: company.lastQuarterlyReportDate
      ? `${reportingStatus} · last ${company.lastQuarterlyReportDate}`
      : reportingStatus,
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
  if (reporting === "Overdue" || reporting === "Not started") {
    outstandingRequirements.push("Update portfolio quarterly reporting (last_quarterly_report_date).");
  } else if (reporting === "Due soon") {
    outstandingRequirements.push("Quarterly reporting due soon based on last submission date.");
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
    outstandingRequirements.push("No material outstanding requirements on Supabase portfolio signals.");
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
      : `${company.riskRating} overall — no matching governance register items; profile rating from portfolio_companies.`,
    compliancePosition: [
      `Training completion ${company.compliancePct}% (${training.status}).`,
      compliance.policyCompliance,
      `${company.outstandingTraining} outstanding training items across enrolled users.`,
    ].join(" "),
    keyDevelopments: [
      reporting === "Submitted"
        ? `Quarterly reporting current (last ${company.lastQuarterlyReportDate}).`
        : `Quarterly reporting is ${reportingStatus.toLowerCase()}.`,
      topRisk
        ? `${topRisk.title} — ${topRisk.mitigationStatus.split("—")[0]?.trim().toLowerCase() ?? "open"}.`
        : "No company-specific governance risk register matches.",
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

  const risksText =
    risks.length > 0
      ? [
          `${company.name} — Risks & Concerns`,
          ...risks.map(
            (r, i) =>
              `${i + 1}. [${r.severity}] ${r.title}\n${r.description}\nMitigation: ${r.mitigationStatus}\nOwner: ${r.owner} · Due ${formatDisplayDate(r.dueDate)}`,
          ),
        ].join("\n\n")
      : `${company.name} — Risks & Concerns\nNo company-specific governance risks on file. Portfolio risk rating: ${company.riskRating}.`;

  const complianceText = [
    `${company.name} — Compliance & Assurance`,
    `Training Completion: ${compliance.trainingCompletionPct}%`,
    `Policy Compliance: ${compliance.policyCompliance}`,
    "",
    "Outstanding Requirements",
    ...compliance.outstandingRequirements.map((r) => `• ${r}`),
  ].join("\n");

  const activityText =
    recentActivity.length > 0
      ? [
          `${company.name} — Recent Activity`,
          ...recentActivity.map(
            (a) => `${formatDisplayDate(a.occurredAt)} — ${a.title}. ${a.detail}`,
          ),
        ].join("\n")
      : `${company.name} — Recent Activity\nNo dated activity on file from portfolio or governance records.`;

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
