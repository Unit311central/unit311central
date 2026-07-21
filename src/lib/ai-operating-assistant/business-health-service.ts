import { listProjects } from "@/lib/internal-projects-service";
import { listLeads } from "@/lib/crm-leads-service";
import { listInternalClients } from "@/lib/internal-clients-service";
import { DEBTORS_ACCOUNTS } from "@/lib/financials-ledger-mock-data";
import { listHrEmployees } from "@/lib/hr-employees-service";
import { vacationDaysRemaining } from "@/lib/hr-data";
import { isOverdue, type AssistantFollowUpAction } from "./tool-result";
import type { AssistantBusinessContext } from "./types";
import type { BusinessHealthScore, HealthDimension } from "./executive-types";
import { analysePlatformInsights } from "./insight-service";
import { buildExplanation } from "./explainability";

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function nav(href: string, label: string): AssistantFollowUpAction {
  return { id: `nav_${href}`, label, kind: "navigate", href };
}

/**
 * Business Health Score — AI-generated organisational health from live signals.
 */
export async function buildBusinessHealthScore(
  context: AssistantBusinessContext,
): Promise<BusinessHealthScore> {
  const { insights, dataGaps } = await analysePlatformInsights(context);
  const [projects, leads, clients] = await Promise.all([
    listProjects().catch(() => []),
    listLeads().catch(() => []),
    listInternalClients().catch(() => []),
  ]);

  const live = projects.filter((project) => project.phase === "live");
  const overdue = projects.filter((project) => isOverdue(project.endDate));
  const stale = insights.filter((entry) => entry.id.startsWith("project_stale_"));

  const projectScore = clampScore(
    88 - overdue.length * 12 - stale.length * 6 + Math.min(live.length, 5) * 2,
  );

  let financeScore = 72;
  const financeStrengths: string[] = [];
  const financeRisks: string[] = [];
  if (context.permissions.canAccessFinancials) {
    const overdueInvoices = DEBTORS_ACCOUNTS.filter(
      (account) => account.status === "overdue" || account.daysOverdue > 0,
    );
    financeScore = clampScore(90 - overdueInvoices.length * 10);
    if (overdueInvoices.length === 0) {
      financeStrengths.push("No overdue receivables in the current ledger snapshot");
    } else {
      financeRisks.push(`${overdueInvoices.length} overdue receivable accounts`);
    }
  } else {
    financeScore = 0;
    financeRisks.push("Finance dimension hidden for current role");
  }

  let hrScore = 75;
  const hrStrengths: string[] = [];
  const hrRisks: string[] = [];
  if (context.permissions.canAccessHr) {
    const employees = await listHrEmployees().catch(() => []);
    const leaveSignals = employees.filter((employee) => vacationDaysRemaining(employee) <= 0);
    const workload = insights.filter((entry) => entry.id.startsWith("workload_"));
    hrScore = clampScore(
      86 - leaveSignals.length * 4 - workload.length * 8 + Math.min(employees.length, 20),
    );
    if (employees.length > 0) hrStrengths.push(`${employees.length} employees on record`);
    if (workload.length > 0) hrRisks.push("Manager capacity pressure detected");
    if (leaveSignals.length > 0) hrRisks.push("Leave / vacation balance signals present");
  } else {
    hrScore = 0;
    hrRisks.push("HR dimension hidden for current role");
  }

  const complianceInsights = insights.filter((entry) => entry.category === "compliance");
  const complianceScore = clampScore(80 - complianceInsights.length * 8);
  const complianceRisks = complianceInsights.map((entry) => entry.title).slice(0, 3);
  const complianceStrengths =
    complianceInsights.length === 0
      ? ["No elevated compliance insights in the current pass"]
      : [];

  const hotLeads = leads.filter((lead) => {
    const status = lead.status.toLowerCase();
    return status.includes("hot") || status === "qualified" || status === "warm";
  });
  const crmGaps = insights.filter((entry) => entry.category === "crm");
  const crmScore = clampScore(78 + Math.min(hotLeads.length, 5) * 3 - crmGaps.length * 8);
  const crmStrengths =
    hotLeads.length > 0
      ? [`${hotLeads.length} hot/qualified opportunities in CRM`]
      : ["CRM pipeline loaded"];
  const crmRisks = crmGaps.slice(0, 3).map((entry) => entry.title);

  const opsInsights = insights.filter(
    (entry) => entry.category === "operations" || entry.severity === "critical",
  );
  const activeClients = clients.filter((client) => client.accountStatus === "Active").length;
  const operationsScore = clampScore(
    82 - opsInsights.length * 6 + Math.min(activeClients, 10),
  );

  const dimensions: HealthDimension[] = [
    {
      id: "projects",
      label: "Projects",
      score: projectScore,
      strengths:
        live.length > 0
          ? [`${live.length} live projects`]
          : ["Project registry available"],
      risks: [
        ...overdue.slice(0, 3).map((project) => `Overdue: ${project.name}`),
        ...stale.slice(0, 2).map((entry) => entry.title),
      ],
    },
    {
      id: "finance",
      label: "Finance",
      score: financeScore,
      strengths: financeStrengths,
      risks: financeRisks,
    },
    {
      id: "hr",
      label: "HR",
      score: hrScore,
      strengths: hrStrengths,
      risks: hrRisks,
    },
    {
      id: "compliance",
      label: "Compliance",
      score: complianceScore,
      strengths: complianceStrengths,
      risks: complianceRisks,
    },
    {
      id: "crm",
      label: "CRM",
      score: crmScore,
      strengths: crmStrengths,
      risks: crmRisks,
    },
    {
      id: "operations",
      label: "Operations",
      score: operationsScore,
      strengths: [`${activeClients} active clients`],
      risks: opsInsights.slice(0, 3).map((entry) => entry.title),
    },
  ];

  const scored = dimensions.filter((dimension) => dimension.score > 0);
  const overall = clampScore(
    scored.reduce((sum, dimension) => sum + dimension.score, 0) / Math.max(scored.length, 1),
  );

  // Confidence drops when data gaps or role-restricted dimensions are present
  const restricted = dimensions.filter((dimension) => dimension.score === 0).length;
  const confidence = clampScore(
    92 - dataGaps.length * 6 - restricted * 8 - (insights.length === 0 ? 15 : 0),
  );

  const strengths = scored
    .filter((dimension) => dimension.score >= 75)
    .flatMap((dimension) => dimension.strengths)
    .slice(0, 5);

  const risks = scored
    .filter((dimension) => dimension.score < 70 || dimension.risks.length > 0)
    .flatMap((dimension) => dimension.risks)
    .slice(0, 6);

  const recommendedActions: AssistantFollowUpAction[] = [
    ...insights.slice(0, 3).flatMap((entry) => entry.recommendedActions.slice(0, 1)),
    nav("/internaldashboard?view=projects", "Review Projects"),
  ];

  if (context.permissions.canAccessFinancials) {
    recommendedActions.push(nav("/internaldashboard?view=financials", "Review Finance"));
  }

  return {
    overall,
    confidence,
    dimensions,
    strengths:
      strengths.length > 0 ? strengths : ["Core operating modules are reachable with live data"],
    risks: risks.length > 0 ? risks : ["No elevated risks in the current analysis pass"],
    recommendedActions: recommendedActions.slice(0, 6),
    insightIds: insights.slice(0, 10).map((entry) => entry.id),
    dataGaps,
    explanation: buildExplanation({
      confidence,
      evidence: [
        ...scored.map((dimension) => ({
          label: `${dimension.label} score ${dimension.score}`,
          detail: dimension.risks[0] ?? dimension.strengths[0],
        })),
        ...insights.slice(0, 3).map((entry) => ({
          label: entry.title,
          detail: entry.summary,
          recordType: entry.entityType,
          recordId: entry.entityId,
          href: entry.explanation.drillDown?.href,
        })),
      ],
      dataSources: [
        "supabase:internal_projects",
        "supabase:internal_clients",
        "supabase:crm_leads",
        ...(context.permissions.canAccessFinancials ? ["dataset:debtors"] : []),
        ...(context.permissions.canAccessHr ? ["supabase:hr_employees"] : []),
        "ai:smart-insights",
      ],
      reasoningSummary: `Overall health ${overall}/100 blends ${scored.length} scored dimensions from live platform signals. Confidence ${confidence}% reflects data gaps and role-restricted areas.`,
      assumptions: [
        "Dimension scores are relative operating signals, not audited financial statements.",
        ...(dataGaps.slice(0, 3).map((gap) => `Data gap: ${gap}`)),
      ],
      recommendedActions: recommendedActions.slice(0, 6),
      dataGaps,
      drillDown: {
        label: "Open Projects for drill-down",
        href: "/internaldashboard?view=projects",
      },
    }),
    generatedAt: new Date().toISOString(),
  };
}
