/**
 * Task-driven evidence planning — minimal tools for the executive job + focus.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { matchesFinancialChartCapability } from "./integrations/chart-capabilities";
import type { EaEvidencePlan, ExecutiveTask } from "./types";
import { classifyExecutiveTask, synthesisKindForTask } from "./executive-task";
import {
  type EvidenceDomain,
  detectEvidenceDomains,
  enrichEvidenceDomains,
  messageNeedsFinance,
  messageNeedsHr,
} from "./evidence-domains";

function annotatePermissionGaps(
  plan: EaEvidencePlan,
  message: string,
  business: AssistantBusinessContext,
) {
  plan.restrictedEvidence = [];
  const domains = plan.domains as EvidenceDomain[];
  if (messageNeedsFinance(message, domains) && !business.permissions.canAccessFinancials) {
    plan.restrictedEvidence.push("financials");
  }
  if (messageNeedsHr(message, domains) && !business.permissions.canAccessHr) {
    plan.restrictedEvidence.push("hr");
  }
}

function planIsViable(plan: EaEvidencePlan): boolean {
  if (plan.synthesisKind === "scoped_pdf" || plan.synthesisKind === "board_report") return true;
  if (plan.synthesisKind === "comparative") {
    if (plan.tools.length >= 2) return true;
    return Boolean(plan.restrictedEvidence?.length && plan.tools.length >= 1);
  }
  if (
    (plan.synthesisKind === "investigation" || plan.task.job === "brief") &&
    plan.tools.length >= 1
  ) {
    return true;
  }
  if (
    (plan.synthesisKind === "investigation" || plan.task.job === "brief") &&
    plan.restrictedEvidence?.length &&
    plan.task.focusDomains.length
  ) {
    return true;
  }
  if (plan.tools.length >= 2) return true;
  if (plan.tools.length >= 1 && plan.synthesisKind === "composite_chart") return true;
  return Boolean(plan.restrictedEvidence?.length && plan.tools.length >= 1);
}

function shouldDeferToAtomicChartRouting(message: string, task: ExecutiveTask): boolean {
  if (task.job !== "visualise") return false;
  if (isCompositeChartRequest(message)) return false;
  if (matchesFinancialChartCapability(message)) return true;
  if (/\b(employee|headcount|workforce|staff)\s+growth\b/i.test(message)) return true;
  if (/\bshow\s+employee\s+growth\b/i.test(message)) return true;
  return false;
}

function pushTool(
  plan: EaEvidencePlan,
  tool: string,
  args: Record<string, unknown>,
  capabilityId?: string,
) {
  const exists = plan.tools.some(
    (t) => t.tool === tool && JSON.stringify(t.args) === JSON.stringify(args),
  );
  if (exists) return;
  plan.tools.push({ tool, args });
  if (capabilityId && !plan.capabilityIds.includes(capabilityId)) {
    plan.capabilityIds.push(capabilityId);
  }
}

function addDomainEvidence(
  plan: EaEvidencePlan,
  domain: string,
  business: AssistantBusinessContext,
) {
  switch (domain) {
    case "sales":
      pushTool(plan, "searchCRM", { query: "" }, "crm.pipeline.summary.read");
      break;
    case "clients":
      pushTool(plan, "searchClients", { query: "" }, "crm.clients.count.read");
      break;
    case "revenue":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
      }
      break;
    case "expenses":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getFinancialChartData", { series: "revenue_vs_expenses", months: 12 });
      }
      break;
    case "cash":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getCashPosition", {}, "financials.cashPosition.read");
      }
      break;
    case "ar":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "searchInvoices", { overdueOnly: true, outstandingOnly: true }, "finance.invoices.overdue.read");
        pushTool(plan, "getFinancialChartData", { series: "ar", months: 12 });
      }
      break;
    case "ap":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getCashPosition", {}, "financials.cashPosition.read");
      }
      break;
    case "payroll":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getCashPosition", {}, "financials.cashPosition.read");
      }
      if (business.permissions.canAccessHr) {
        pushTool(plan, "searchEmployees", { query: "", headcount: true }, "hr.employees.count.read");
      }
      break;
    case "headcount":
      if (business.permissions.canAccessHr) {
        pushTool(plan, "searchEmployees", { query: "", headcount: true }, "hr.employees.count.read");
      }
      break;
    case "projects":
      pushTool(plan, "searchProjects", {}, "project-management.projects.count.read");
      break;
    case "profitability":
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
        pushTool(plan, "getFinancialChartData", { series: "revenue_vs_expenses", months: 12 });
      }
      break;
    case "health":
      pushTool(plan, "getBusinessHealth", {});
      break;
    default:
      break;
  }
}

function planEvidenceForTask(
  plan: EaEvidencePlan,
  task: ExecutiveTask,
  business: AssistantBusinessContext,
) {
  if (task.outputContract.kind === "scoped_pdf") {
    return;
  }

  if (task.job === "compare" && task.comparisonPair) {
    for (const domain of task.comparisonPair) {
      addDomainEvidence(plan, domain, business);
    }
    return;
  }

  if (task.job === "visualise") {
    for (const domain of task.focusDomains) {
      addDomainEvidence(plan, domain, business);
    }
    if (
      task.focusDomains.includes("cash") &&
      business.permissions.canAccessFinancials &&
      !plan.tools.some((t) => t.args?.series === "cash")
    ) {
      pushTool(plan, "getFinancialChartData", { series: "cash", months: 12 });
    }
    return;
  }

  for (const domain of task.focusDomains) {
    addDomainEvidence(plan, domain, business);
  }

  if (
    (task.job === "investigate" || task.job === "brief") &&
    task.focusDomains.includes("cash") &&
    business.permissions.canAccessFinancials
  ) {
    pushTool(plan, "searchInvoices", { overdueOnly: true, outstandingOnly: true }, "finance.invoices.overdue.read");
  }
}

export function isCompositeChartRequest(message: string): boolean {
  const wantsChart = /\b(graph|chart|plot|visuali[sz]e|trend)\b/i.test(message);
  if (!wantsChart) return false;

  const domains = enrichEvidenceDomains(message, detectEvidenceDomains(message));
  const metricDomains = domains.filter((d) =>
    ["revenue", "expenses", "cash", "headcount", "payroll", "sales", "ar"].includes(d),
  );
  if (metricDomains.length < 2) return false;

  const singleChart = matchesFinancialChartCapability(message);
  if (!singleChart) return true;

  if (singleChart.series === "revenue_vs_expenses") {
    const onlyRevExp = metricDomains.every((d) => d === "revenue" || d === "expenses");
    return !onlyRevExp;
  }

  return metricDomains.length >= 2;
}

export function planInvestigation(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const task = classifyExecutiveTask(message);
  if (!task || task.job === "lookup") return null;
  if (shouldDeferToAtomicChartRouting(message, task)) return null;

  const domains = task.focusDomains as EvidenceDomain[];
  const synthesisKind = synthesisKindForTask(task);

  const plan: EaEvidencePlan = {
    capabilityIds: [],
    tools: [],
    reasoningGoal: message,
    permissionsRequired: ["authenticated"],
    synthesisKind,
    domains,
    restrictedEvidence: [],
    task,
  };

  annotatePermissionGaps(plan, message, business);
  planEvidenceForTask(plan, task, business);

  return planIsViable(plan) ? plan : null;
}

/** @deprecated Use planInvestigation — kept for existing imports */
export function planCrossModuleEvidence(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const plan = planInvestigation(message, business);
  if (plan?.synthesisKind === "comparative") return plan;
  return null;
}

export function planEvidenceGathering(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const plan = planInvestigation(message, business);
  if (plan?.synthesisKind === "investigation") return plan;
  return null;
}

export {
  isOpenEndedConcern,
  isAnalyticalInvestigation,
  isComparativeQuestion,
  detectEvidenceDomains,
  enrichEvidenceDomains,
} from "./evidence-domains";

export type { EvidenceDomain } from "./evidence-domains";
