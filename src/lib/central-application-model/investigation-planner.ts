/**
 * General open-ended investigation / comparative / composite evidence planning.
 * No per-question handlers — domain signals drive tool selection.
 */

import type { AssistantBusinessContext } from "@/lib/ai-operating-assistant/types";
import { matchesFinancialChartCapability } from "./integrations/chart-capabilities";
import type { EaEvidencePlan, EaEvidenceSynthesisKind } from "./types";

export type EvidenceDomain =
  | "cash"
  | "revenue"
  | "expenses"
  | "profitability"
  | "ar"
  | "ap"
  | "payroll"
  | "headcount"
  | "sales"
  | "clients"
  | "projects"
  | "health";

const DOMAIN_SIGNALS: Record<EvidenceDomain, RegExp> = {
  cash: /\b(cash|bank|treasury|liquidity|runway|burn)\b/i,
  revenue: /\b(revenue|income|turnover|sales\s+income|top\s*line)\b/i,
  expenses: /\b(expenses?|costs?|spend|outgoings?|opex|cogs)\b/i,
  profitability: /\b(profit|margin|p&l|loss|ebitda|bottom\s*line)\b/i,
  ar: /\b(ar\b|receivable|outstanding\s+invoice|debtors?)\b/i,
  ap: /\b(ap\b|payable|creditors?|supplier\s+invoice)\b/i,
  payroll: /\b(payroll|wages|salaries|compensation|employer\s+cost)\b/i,
  headcount: /\b(headcount|employees?|staff|fte|people|workforce)\b/i,
  sales: /\b(sales|pipeline|crm|deals?|opportunities?|selling)\b/i,
  clients: /\b(clients?|customers?)\b/i,
  projects: /\b(projects?|delivery|milestones?)\b/i,
  health: /\b(health|at\s+risk|risky|distress|struggling)\b/i,
};

const CONCERN_SIGNALS =
  /\b(worried|concerned|afraid|anxious|nervous|scared|bankrupt|insolvent|going\s+under|out\s+of\s+business|run\s+out|can't\s+pay|cash\s*crisis|financial\s+trouble|distress|survive|going\s+broke)\b/i;

const STRATEGIC_KEYWORDS = [
  "what happens if",
  "what would happen",
  "ramifications",
  "increase revenue",
  "reduce burn",
  "underperforming",
  "becoming risky",
  "how can i",
  "how do i",
  "what should we",
  "recommend",
  "strategy",
  "scenario",
  "biggest operational risks",
  "what should management focus",
];

const COMPARATIVE_SIGNALS =
  /\b(compare|contrast|explain\s+(?:any|the|why)|difference|differences|affect|affecting|impact|impacting|relate|relationship|between|why\s+(?:is|are|does|do)|how\s+does|align|misalign|gap|diverge|feels?\s+flat|doesn'?t\s+match)\b/i;

const BOARD_REPORT_SIGNALS =
  /\b(board|executive)\b.*\b(risk|finding|evidence|recommend|action|implication|position|assessment)\b/i;

const ANALYTICAL_PDF_SIGNALS =
  /\b(pdf|report)\b.*\b(board|executive)\b/i;

function detectDomains(message: string): EvidenceDomain[] {
  const found: EvidenceDomain[] = [];
  for (const [domain, pattern] of Object.entries(DOMAIN_SIGNALS) as Array<
    [EvidenceDomain, RegExp]
  >) {
    if (pattern.test(message)) found.push(domain);
  }
  return found;
}

function pushTool(
  plan: EaEvidencePlan,
  tool: string,
  args: Record<string, unknown>,
  capabilityId?: string,
) {
  plan.tools.push({ tool, args });
  if (capabilityId && !plan.capabilityIds.includes(capabilityId)) {
    plan.capabilityIds.push(capabilityId);
  }
}

function basePlan(
  message: string,
  synthesisKind: EaEvidenceSynthesisKind,
  domains: EvidenceDomain[],
): EaEvidencePlan {
  return {
    capabilityIds: [],
    tools: [],
    reasoningGoal: message,
    permissionsRequired: ["authenticated"],
    synthesisKind,
    domains,
  };
}

function addFinancialEvidence(plan: EaEvidencePlan, business: AssistantBusinessContext) {
  if (!business.permissions.canAccessFinancials) return;
  pushTool(plan, "getCashPosition", {}, "financials.cashPosition.read");
  pushTool(plan, "searchInvoices", { overdueOnly: true, outstandingOnly: true }, "finance.invoices.overdue.read");
  pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
  pushTool(plan, "getFinancialChartData", { series: "revenue_vs_expenses", months: 12 });
}

function addOperationalEvidence(plan: EaEvidencePlan, business: AssistantBusinessContext) {
  pushTool(plan, "searchCRM", { query: "" }, "crm.pipeline.summary.read");
  pushTool(plan, "searchClients", { query: "" }, "crm.clients.count.read");
  pushTool(plan, "searchProjects", {}, "project-management.projects.count.read");
  if (business.permissions.canAccessHr) {
    pushTool(plan, "searchEmployees", { query: "", headcount: true }, "hr.employees.count.read");
  }
  pushTool(plan, "getBusinessHealth", {});
}

export function isCompositeChartRequest(message: string): boolean {
  const wantsChart = /\b(graph|chart|plot|visuali[sz]e|trend)\b/i.test(message);
  if (!wantsChart) return false;

  const domains = detectDomains(message);
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

const SOFT_CONCERN_SIGNALS =
  /\b(feels?\s+tight|stretched|too\s+thin|losing\s+people|turnover\s+risk|burnout|overworked|can'?t\s+make\s+payroll|make\s+payroll|payroll\s+next)\b/i;

export function isOpenEndedConcern(message: string): boolean {
  const lower = message.toLowerCase();
  if (CONCERN_SIGNALS.test(lower)) return true;
  if (SOFT_CONCERN_SIGNALS.test(lower) && /\b(worried|concerned|not\s+sure|anxious|help|risk|should\s+i\s+know)\b/i.test(lower)) {
    return true;
  }
  if (/\bhelp me understand (the )?risk\b/i.test(lower)) return true;
  if (/\bhelp\b/i.test(lower) && CONCERN_SIGNALS.test(lower)) return true;
  if (
    /\b(are we|will we|is the company)\b/i.test(lower) &&
    /\b(ok|alright|fine|safe|survive|sustainable)\b/i.test(lower)
  ) {
    return true;
  }
  if (
    /\bwhat should (we|i) do\b/i.test(lower) &&
    /\b(financ|cash|money|business|company)\b/i.test(lower)
  ) {
    return true;
  }
  return false;
}

export function isComparativeQuestion(message: string, domains: EvidenceDomain[]): boolean {
  if (domains.length < 2) return false;
  if (
    domains.includes("revenue") &&
    domains.includes("expenses") &&
    /\b(revenue|sales)\b[\s\S]{0,40}\b(expenses?|costs)\b/i.test(message) &&
    !/\b(affect|impact|explain|difference|compare|why|pipeline|sales|crm)\b/i.test(message)
  ) {
    return false;
  }
  return COMPARATIVE_SIGNALS.test(message);
}

export function isAnalyticalBoardReportRequest(message: string): boolean {
  if (!/\b(pdf|report)\b/i.test(message)) return false;
  if (BOARD_REPORT_SIGNALS.test(message) || ANALYTICAL_PDF_SIGNALS.test(message)) return true;
  return /\b(findings?|risks?|supporting\s+evidence|management\s+implications?|recommended\s+actions?)\b/i.test(
    message,
  );
}

export function planInvestigation(
  message: string,
  business: AssistantBusinessContext,
): EaEvidencePlan | null {
  const domains = detectDomains(message);
  const lower = message.toLowerCase();

  if (isAnalyticalBoardReportRequest(message)) {
    const plan = basePlan(message, "board_report", domains);
    addFinancialEvidence(plan, business);
    addOperationalEvidence(plan, business);
    if (business.permissions.canAccessHr) {
      pushTool(plan, "searchEmployees", { query: "", headcount: true });
    }
    return plan.tools.length >= 2 ? plan : null;
  }

  if (isCompositeChartRequest(message)) {
    const plan = basePlan(message, "composite_chart", domains);
    if (business.permissions.canAccessFinancials) {
      if (domains.includes("revenue") || domains.length >= 2) {
        pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
      }
      if (domains.includes("expenses") || domains.length >= 2) {
        pushTool(plan, "getFinancialChartData", { series: "revenue_vs_expenses", months: 12 });
      }
      if (domains.includes("cash") || domains.length >= 2) {
        pushTool(plan, "getFinancialChartData", { series: "cash", months: 12 });
      }
      if (domains.includes("ar")) {
        pushTool(plan, "getFinancialChartData", { series: "ar", months: 12 });
      }
    }
    if (domains.includes("headcount") && business.permissions.canAccessHr) {
      pushTool(plan, "searchEmployees", { query: "", headcount: true });
    }
    if (domains.includes("sales")) {
      pushTool(plan, "searchCRM", { query: "" });
    }
    return plan.tools.length >= 2 ? plan : null;
  }

  if (isComparativeQuestion(message, domains)) {
    const plan = basePlan(message, "comparative", domains);
    if (domains.includes("sales") || domains.includes("revenue")) {
      pushTool(plan, "searchCRM", { query: "" }, "crm.pipeline.summary.read");
    }
    if (domains.includes("revenue") || domains.includes("profitability") || domains.includes("cash")) {
      if (business.permissions.canAccessFinancials) {
        pushTool(plan, "getFinancialChartData", { series: "revenue", months: 12 });
        pushTool(plan, "getCashPosition", {}, "financials.cashPosition.read");
      }
    }
    if (domains.includes("headcount") && business.permissions.canAccessHr) {
      pushTool(plan, "searchEmployees", { query: "", headcount: true });
    }
    if (domains.includes("expenses") && business.permissions.canAccessFinancials) {
      pushTool(plan, "getFinancialChartData", { series: "revenue_vs_expenses", months: 12 });
    }
    return plan.tools.length >= 2 ? plan : null;
  }

  if (isOpenEndedConcern(message) || (domains.includes("health") && /\bhelp\b/i.test(lower))) {
    const plan = basePlan(message, "investigation", domains.length ? domains : ["cash", "revenue", "health"]);
    addFinancialEvidence(plan, business);
    addOperationalEvidence(plan, business);
    return plan.tools.length >= 2 ? plan : null;
  }

  const strategic =
    STRATEGIC_KEYWORDS.some((kw) => lower.includes(kw)) ||
    (/\bincrease\b/.test(lower) && /\brevenue\b/.test(lower)) ||
    (/\breduce\b/.test(lower) && /\bburn\b/.test(lower)) ||
    (/\bhow can we\b/.test(lower) &&
      /\b(revenue|burn|costs|risk|growth|profit|margin|runway)\b/.test(lower)) ||
    /\bbiggest operational risks?\b/.test(lower) ||
    /\bwhat should management focus\b/.test(lower);
  if (strategic && domains.length >= 1 && !/\b(graph|chart|plot|visuali[sz]e)\b/i.test(lower)) {
    const plan = basePlan(message, "investigation", domains);
    addFinancialEvidence(plan, business);
    addOperationalEvidence(plan, business);
    return plan.tools.length >= 2 ? plan : null;
  }

  return null;
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
