/**
 * Portfolio Intelligence — Executive Briefing for Talanton leadership.
 * Answers: "What requires our attention across the portfolio right now?"
 */

import {
  companyNameById,
  TALANTON_ACTIONS,
  TALANTON_MY_TRAINING,
  TALANTON_PORTFOLIO_COMPANIES,
  TALANTON_QUARTERLY_REPORTS,
  TALANTON_RISKS,
  type PortfolioCompany,
  type RiskRating,
} from "@/lib/talanton/portfolio-data";

export type PortfolioAttentionReason =
  | "Quarterly report overdue"
  | "Compliance training incomplete"
  | "High risk status"
  | "Missing documentation"
  | "Performance concerns"
  | "Open compliance action";

export type PortfolioAttentionCompany = {
  companyId: string;
  companyName: string;
  country: string;
  sector: string;
  healthScore: number;
  riskRating: RiskRating;
  reason: PortfolioAttentionReason;
  detail: string;
  recommendedAction: string;
  priority: "Critical" | "High" | "Medium";
};

export type PortfolioActivityKind =
  | "report"
  | "training"
  | "document"
  | "compliance"
  | "risk"
  | "other";

export type PortfolioActivityItem = {
  id: string;
  kind: PortfolioActivityKind;
  title: string;
  detail: string;
  companyName: string | null;
  occurredAt: string;
};

export type PortfolioRecommendedAction = {
  id: string;
  title: string;
  rationale: string;
  owner: string;
  urgency: "Today" | "This week" | "This month";
  companyId: string | null;
  companyName: string | null;
};

export type PortfolioHealthSummary = {
  portfolioHealthScore: number;
  companiesRequiringAttention: number;
  reportsOutstanding: number;
  complianceIssues: number;
  highRiskCompanies: number;
  totalPortfolioCompanies: number;
  posture: "Stable" | "Watch" | "Elevated";
  postureReason: string;
};

export type BriefingChangeItem = {
  title: string;
  detail: string;
};

export type PortfolioExecutiveBriefing = {
  asOf: string;
  preparedFor: string;
  health: PortfolioHealthSummary;
  overallStatus: string;
  overallStatusBullets: string[];
  significantChanges: string[];
  significantChangeItems: BriefingChangeItem[];
  companiesRequiringAttentionNarrative: string[];
  complianceConcerns: string[];
  reportingConcerns: string[];
  recommendedActionsNarrative: string[];
  attentionCompanies: PortfolioAttentionCompany[];
  recentActivity: PortfolioActivityItem[];
  recommendedActions: PortfolioRecommendedAction[];
  briefingText: string;
  healthSummaryText: string;
  activityText: string;
  actionsText: string;
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

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

function companyHealthScore(company: PortfolioCompany): number {
  const report = TALANTON_QUARTERLY_REPORTS.find((r) => r.companyId === company.id);
  const reportScore =
    report?.status === "Submitted"
      ? 95
      : report?.status === "Due Soon"
        ? 70
        : report?.status === "Overdue"
          ? 35
          : 45;
  const raw = company.compliancePct * 0.5 + reportScore * 0.3 + (100 - riskPenalty(company.riskRating)) * 0.2;
  return Math.max(28, Math.min(98, Math.round(raw)));
}

function primaryAttentionReason(
  company: PortfolioCompany,
): { reason: PortfolioAttentionReason; detail: string; action: string; priority: PortfolioAttentionCompany["priority"] } | null {
  const report = TALANTON_QUARTERLY_REPORTS.find((r) => r.companyId === company.id);
  const openRisk = TALANTON_RISKS.find(
    (r) => r.companyId === company.id && r.status !== "Closed" && (r.rating === "High" || r.rating === "Critical"),
  );
  const openAction = TALANTON_ACTIONS.find(
    (a) => a.companyId === company.id && a.status !== "Done" && a.priority === "High",
  );
  const overdueTraining = TALANTON_MY_TRAINING.find(
    (t) => t.companyId === company.id && (t.status === "Overdue" || t.status === "Not Started"),
  );

  if (company.riskRating === "Critical" || (company.riskRating === "High" && openRisk)) {
    return {
      reason: "High risk status",
      detail: openRisk
        ? `${openRisk.title} remains open (${openRisk.rating}; owner ${openRisk.owner}).`
        : `${company.name} is rated ${company.riskRating} and requires active portfolio oversight.`,
      action: openRisk
        ? `Review ${company.name} risk mitigation with ${openRisk.owner} before ${formatDisplayDate(openRisk.dueDate)}.`
        : `Schedule a portfolio risk review with ${company.primaryContact}.`,
      priority: company.riskRating === "Critical" ? "Critical" : "High",
    };
  }

  if (report?.status === "Overdue") {
    return {
      reason: "Quarterly report overdue",
      detail: `Q2 2026 quarterly report is overdue (due ${formatDisplayDate(report.nextDue)}). Last pack not received.`,
      action: `Follow up ${company.name} quarterly report with ${company.primaryContact}.`,
      priority: "High",
    };
  }

  if (company.outstandingTraining >= 8 || company.compliancePct < 72 || overdueTraining) {
    return {
      reason: "Compliance training incomplete",
      detail: `${company.outstandingTraining} outstanding training items; compliance at ${company.compliancePct}%.`,
      action: `Schedule ${company.name} compliance review and clear overdue modules.`,
      priority: company.compliancePct < 70 ? "High" : "Medium",
    };
  }

  if (openAction) {
    return {
      reason: "Open compliance action",
      detail: `${openAction.title} (${openAction.owner}; due ${formatDisplayDate(openAction.dueDate)}).`,
      action: openAction.title,
      priority: "High",
    };
  }

  if (report?.status === "Not Started") {
    return {
      reason: "Missing documentation",
      detail: `Q2 2026 reporting pack has not been started; governance documentation incomplete.`,
      action: `Request missing documentation from ${company.primaryContact} this week.`,
      priority: "Medium",
    };
  }

  if (company.revenueGrowthPct < 10 && company.burnRateUsdMonthly > 100_000) {
    return {
      reason: "Performance concerns",
      detail: `Growth at ${company.revenueGrowthPct}% with elevated monthly burn — performance watch warranted.`,
      action: `Review ${company.name} performance with Portfolio Ops before the next IC touchpoint.`,
      priority: "Medium",
    };
  }

  return null;
}

function buildAttentionCompanies(): PortfolioAttentionCompany[] {
  const rows: PortfolioAttentionCompany[] = [];
  for (const company of TALANTON_PORTFOLIO_COMPANIES) {
    const attention = primaryAttentionReason(company);
    if (!attention) continue;
    rows.push({
      companyId: company.id,
      companyName: company.name,
      country: company.country,
      sector: company.sector,
      healthScore: companyHealthScore(company),
      riskRating: company.riskRating,
      reason: attention.reason,
      detail: attention.detail,
      recommendedAction: attention.action,
      priority: attention.priority,
    });
  }

  const priorityRank = { Critical: 0, High: 1, Medium: 2 } as const;
  return rows
    .sort((a, b) => {
      const p = priorityRank[a.priority] - priorityRank[b.priority];
      if (p !== 0) return p;
      return a.healthScore - b.healthScore;
    })
    .slice(0, 8);
}

function buildHealthSummary(attention: PortfolioAttentionCompany[]): PortfolioHealthSummary {
  const companies = TALANTON_PORTFOLIO_COMPANIES;
  const healthScores = companies.map(companyHealthScore);
  const portfolioHealthScore = Math.round(
    healthScores.reduce((sum, s) => sum + s, 0) / healthScores.length,
  );
  const reportsOutstanding = TALANTON_QUARTERLY_REPORTS.filter(
    (r) => r.status === "Overdue" || r.status === "Not Started" || r.status === "Due Soon",
  ).length;
  const complianceIssues =
    companies.filter((c) => c.compliancePct < 75 || c.outstandingTraining >= 6).length +
    TALANTON_RISKS.filter((r) => r.status !== "Closed" && r.category !== "Operations").length;
  const highRiskCompanies = companies.filter(
    (c) => c.riskRating === "High" || c.riskRating === "Critical",
  ).length;

  const posture: PortfolioHealthSummary["posture"] =
    portfolioHealthScore >= 78 && attention.filter((a) => a.priority === "Critical").length === 0
      ? "Stable"
      : portfolioHealthScore >= 65
        ? "Watch"
        : "Elevated";

  const postureReason =
    posture === "Stable"
      ? "Most companies are reporting and training on track; residual items are manageable this fortnight."
      : posture === "Watch"
        ? "Several reporting and compliance items need leadership follow-up before they become material."
        : "Multiple high-risk and overdue items require immediate portfolio attention.";

  return {
    portfolioHealthScore,
    companiesRequiringAttention: attention.length,
    reportsOutstanding,
    complianceIssues,
    highRiskCompanies,
    totalPortfolioCompanies: companies.length,
    posture,
    postureReason,
  };
}

function buildRecentActivity(): PortfolioActivityItem[] {
  const submitted = TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Submitted").slice(0, 3);
  const completedTraining = TALANTON_MY_TRAINING.filter((t) => t.status === "Completed").slice(0, 2);
  const mitigating = TALANTON_RISKS.filter((r) => r.status === "Mitigating").slice(0, 2);

  const items: PortfolioActivityItem[] = [
    ...submitted.map((r, i) => ({
      id: `act-report-${r.id}`,
      kind: "report" as const,
      title: "Quarterly report submitted",
      detail: `${r.period} pack received and scored ${r.score}/100.`,
      companyName: companyNameById(r.companyId),
      occurredAt: r.lastSubmitted ?? `2026-07-${String(28 - i).padStart(2, "0")}`,
    })),
    ...completedTraining.map((t, i) => ({
      id: `act-train-${t.id}`,
      kind: "training" as const,
      title: "Compliance training completed",
      detail: `${t.learnerName} completed assigned module (${t.progress}%).`,
      companyName: companyNameById(t.companyId),
      occurredAt: `2026-07-${String(27 - i).padStart(2, "0")}`,
    })),
    {
      id: "act-doc-1",
      kind: "document",
      title: "Investment documentation uploaded",
      detail: "Updated Q2 governance pack and compliance certificate uploaded to the company file.",
      companyName: "Long Miles Coffee",
      occurredAt: "2026-07-26",
    },
    {
      id: "act-comp-1",
      kind: "compliance",
      title: "Compliance milestone reached",
      detail: "Portfolio-wide Code of Conduct completion crossed 86%.",
      companyName: null,
      occurredAt: "2026-07-25",
    },
    ...mitigating.map((r, i) => ({
      id: `act-risk-${r.id}`,
      kind: "risk" as const,
      title: "Risk mitigation progress",
      detail: `${r.title} — ${r.owner} advancing controls (due ${formatDisplayDate(r.dueDate)}).`,
      companyName: r.companyId ? companyNameById(r.companyId) : null,
      occurredAt: `2026-07-${String(24 - i).padStart(2, "0")}`,
    })),
    {
      id: "act-other-1",
      kind: "other",
      title: "Portfolio ops check-in completed",
      detail: "East Africa ops sync covered reporting cadence and training blockers.",
      companyName: null,
      occurredAt: "2026-07-23",
    },
  ];

  return items.sort((a, b) => b.occurredAt.localeCompare(a.occurredAt)).slice(0, 10);
}

function buildRecommendedActions(
  attention: PortfolioAttentionCompany[],
): PortfolioRecommendedAction[] {
  const fromAttention = attention.slice(0, 5).map((row, index) => ({
    id: `rec-${row.companyId}`,
    title: row.recommendedAction,
    rationale: `${row.reason}: ${row.detail}`,
    owner: index % 2 === 0 ? "Harry Turner" : "Portfolio Ops",
    urgency: (row.priority === "Critical"
      ? "Today"
      : row.priority === "High"
        ? "This week"
        : "This month") as PortfolioRecommendedAction["urgency"],
    companyId: row.companyId,
    companyName: row.companyName,
  }));

  const extras: PortfolioRecommendedAction[] = [
    {
      id: "rec-arc-ride",
      title: "Follow up ARC Ride quarterly report",
      rationale: "Reporting cadence slip risks incomplete IC visibility for mobility holdings.",
      owner: "Harry Turner",
      urgency: "This week",
      companyId: "ti-co-arc-ride",
      companyName: "ARC Ride",
    },
    {
      id: "rec-burn",
      title: "Review Burn Manufacturing performance",
      rationale: "Health & safety reporting lag and operational risk require a focused performance review.",
      owner: "Portfolio Ops",
      urgency: "This week",
      companyId: "ti-co-burn-manufacturing",
      companyName: "Burn Manufacturing",
    },
    {
      id: "rec-pezesha",
      title: "Schedule Pezesha compliance review",
      rationale: "AML refresher coverage remains incomplete; close before the next board materials cycle.",
      owner: "Head of Compliance",
      urgency: "This week",
      companyId: "ti-co-pezesha",
      companyName: "Pezesha",
    },
  ];

  const seen = new Set<string>();
  const merged: PortfolioRecommendedAction[] = [];
  for (const action of [...fromAttention, ...extras]) {
    const key = action.title.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(action);
  }
  return merged.slice(0, 7);
}

function formatBriefingText(input: {
  asOf: string;
  preparedFor: string;
  health: PortfolioHealthSummary;
  overallStatusBullets: string[];
  significantChanges: string[];
  companiesRequiringAttentionNarrative: string[];
  complianceConcerns: string[];
  reportingConcerns: string[];
  recommendedActionsNarrative: string[];
}): string {
  return [
    "Talanton Impact — Portfolio Executive Briefing",
    `Prepared for ${input.preparedFor}`,
    `As of ${formatDisplayDate(input.asOf)}`,
    "",
    "Overall portfolio status",
    ...input.overallStatusBullets.map((line) => `• ${line}`),
    "",
    "Significant changes",
    ...input.significantChanges.map((line) => `• ${line}`),
    "",
    "Companies requiring attention",
    ...input.companiesRequiringAttentionNarrative.map((line, i) => `${i + 1}. ${line}`),
    "",
    "Compliance concerns",
    ...input.complianceConcerns.map((line) => `• ${line}`),
    "",
    "Reporting concerns",
    ...input.reportingConcerns.map((line) => `• ${line}`),
    "",
    "Recommended actions",
    ...input.recommendedActionsNarrative.map((line, i) => `${i + 1}. ${line}`),
    "",
    `Portfolio health score: ${input.health.portfolioHealthScore}/100 (${input.health.posture})`,
  ].join("\n");
}

export function buildPortfolioExecutiveBriefing(asOf?: string | null): PortfolioExecutiveBriefing {
  const date = asOf && /^\d{4}-\d{2}-\d{2}$/.test(asOf) ? asOf : todayIso();
  const attentionCompanies = buildAttentionCompanies();
  const health = buildHealthSummary(attentionCompanies);
  const recentActivity = buildRecentActivity();
  const recommendedActions = buildRecommendedActions(attentionCompanies);

  const overdueReports = TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Overdue");
  const dueSoonReports = TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Due Soon");
  const openHighRisks = TALANTON_RISKS.filter(
    (r) => r.status !== "Closed" && (r.rating === "High" || r.rating === "Critical"),
  );

  const overallStatusBullets = [
    `${health.companiesRequiringAttention} of ${health.totalPortfolioCompanies} companies need leadership follow-up.`,
    `${health.reportsOutstanding} quarterly reports are overdue or due soon.`,
    `${health.highRiskCompanies} holdings are rated High or Critical risk.`,
    `${health.complianceIssues} open compliance items across the portfolio.`,
  ];

  const overallStatus = overallStatusBullets.join(" ");

  const significantChangeItems: BriefingChangeItem[] = [
    {
      title: "Q2 reporting cadence",
      detail: `${TALANTON_QUARTERLY_REPORTS.filter((r) => r.status === "Submitted").length} packs submitted; ${overdueReports.length} overdue${dueSoonReports.length ? `; ${dueSoonReports.length} due soon` : ""}.`,
    },
    {
      title: "Top open risk",
      detail: openHighRisks.length
        ? `${openHighRisks[0]!.title} at ${openHighRisks[0]!.companyId ? companyNameById(openHighRisks[0]!.companyId) : "portfolio level"} — owner ${openHighRisks[0]!.owner}.`
        : "No critical risks escalated this cycle.",
    },
    {
      title: "Compliance coverage",
      detail: `Portfolio average near ${Math.round(
        TALANTON_PORTFOLIO_COMPANIES.reduce((s, c) => s + c.compliancePct, 0) /
          TALANTON_PORTFOLIO_COMPANIES.length,
      )}% — gaps concentrated in AML, procurement, and modern slavery.`,
    },
  ];

  const significantChanges = significantChangeItems.map((item) => `${item.title}: ${item.detail}`);

  const companiesRequiringAttentionNarrative = attentionCompanies.map(
    (c) => `${c.companyName} — ${c.reason}. ${c.recommendedAction}`,
  );

  const complianceConcerns = [
    ...TALANTON_RISKS.filter((r) => r.status !== "Closed" && r.category !== "Operations")
      .slice(0, 3)
      .map(
        (r) =>
          `${r.title}${r.companyId ? ` (${companyNameById(r.companyId)})` : ""} — owner ${r.owner}, due ${formatDisplayDate(r.dueDate)}.`,
      ),
    ...attentionCompanies
      .filter((c) => c.reason === "Compliance training incomplete")
      .slice(0, 2)
      .map((c) => `${c.companyName}: ${c.detail}`),
  ].slice(0, 5);

  const reportingConcerns = [
    ...overdueReports.map(
      (r) => `${companyNameById(r.companyId)} — ${r.period} quarterly report overdue.`,
    ),
    ...dueSoonReports.slice(0, 2).map(
      (r) => `${companyNameById(r.companyId)} — ${r.period} report due soon (${formatDisplayDate(r.nextDue)}).`,
    ),
  ].slice(0, 6);

  const recommendedActionsNarrative = recommendedActions.map((a) => a.title);

  const briefingText = formatBriefingText({
    asOf: date,
    preparedFor: "Harry Turner and Talanton leadership",
    health,
    overallStatusBullets,
    significantChanges,
    companiesRequiringAttentionNarrative,
    complianceConcerns:
      complianceConcerns.length > 0 ? complianceConcerns : ["No material compliance escalations this cycle."],
    reportingConcerns:
      reportingConcerns.length > 0 ? reportingConcerns : ["Reporting cadence is current across the portfolio."],
    recommendedActionsNarrative,
  });

  const healthSummaryText = [
    "Portfolio Health Summary",
    `Posture: ${health.posture} — ${health.postureReason}`,
    `Companies Requiring Attention: ${health.companiesRequiringAttention}`,
    `Reports Outstanding: ${health.reportsOutstanding}`,
    `Compliance Issues: ${health.complianceIssues}`,
    `High Risk Companies: ${health.highRiskCompanies}`,
    `Total Portfolio Companies: ${health.totalPortfolioCompanies}`,
  ].join("\n");

  const activityText = [
    "Recent Portfolio Activity",
    ...recentActivity.map(
      (item) =>
        `${formatDisplayDate(item.occurredAt)} — ${item.title}${item.companyName ? ` · ${item.companyName}` : ""}. ${item.detail}`,
    ),
  ].join("\n");

  const actionsText = [
    "Recommended Actions",
    ...recommendedActions.map(
      (a, i) =>
        `${i + 1}. [${a.urgency}] ${a.title}${a.companyName ? ` (${a.companyName})` : ""} — ${a.rationale} Owner: ${a.owner}.`,
    ),
  ].join("\n");

  return {
    asOf: date,
    preparedFor: "Harry Turner and Talanton leadership",
    health,
    overallStatus,
    overallStatusBullets,
    significantChanges,
    significantChangeItems,
    companiesRequiringAttentionNarrative,
    complianceConcerns:
      complianceConcerns.length > 0 ? complianceConcerns : ["No material compliance escalations this cycle."],
    reportingConcerns:
      reportingConcerns.length > 0 ? reportingConcerns : ["Reporting cadence is current across the portfolio."],
    recommendedActionsNarrative,
    attentionCompanies,
    recentActivity,
    recommendedActions,
    briefingText,
    healthSummaryText,
    activityText,
    actionsText,
  };
}

export function formatAttentionCompanyText(company: PortfolioAttentionCompany): string {
  return [
    company.companyName,
    `${company.sector} · ${company.country}`,
    `Health Score: ${company.healthScore}/100`,
    `Risk Rating: ${company.riskRating}`,
    `Reason: ${company.reason}`,
    company.detail,
    `Recommended action: ${company.recommendedAction}`,
  ].join("\n");
}

export function formatRecommendedActionText(action: PortfolioRecommendedAction): string {
  return [
    action.title,
    action.companyName ? `Company: ${action.companyName}` : null,
    `Urgency: ${action.urgency}`,
    `Owner: ${action.owner}`,
    action.rationale,
  ]
    .filter(Boolean)
    .join("\n");
}
