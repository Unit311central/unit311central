/**
 * General executive task classification — job + focus + output contract.
 * No per-question handlers; class-level signals only.
 */

import { parseScopedPdfRequest, type ScopedPdfMetricId } from "@/lib/ai-operating-assistant/scoped-pdf-metrics";
import type { EaEvidenceSynthesisKind, ExecutiveJob, ExecutiveOutputContract, ExecutiveTask } from "./types";
import {
  detectEvidenceDomains,
  enrichEvidenceDomains,
  isAnalyticalInvestigation,
  isComparativeQuestion,
  isOpenEndedConcern,
} from "./evidence-domains";

const ANALYTICAL_BOARD_PDF_SIGNALS =
  /\b(board|executive)\b.*\b(risk|finding|evidence|recommend|action|implication|assessment)\b/i;

const ANALYTICAL_PDF_PHRASES =
  /\b(findings?|risks?|supporting\s+evidence|management\s+implications?|recommended\s+actions?)\b/i;

const BRIEF_SIGNALS =
  /\b(brief(ing)?|leadership\s+brief(ing)?|management\s+(?:should\s+)?know|priorities?\s+this\s+month|most\s+important\s+things|what\s+should\s+(?:we|management)\s+focus)\b/i;

const EXPLAIN_SIGNALS = /\b(explain|help\s+me\s+understand|what\s+does\s+.+\s+mean|clarify)\b/i;

const STRATEGIC_SIGNALS =
  /\b(what happens if|what would happen|how can we|how do we|recommend|strategy|scenario|reduce burn|increase revenue)\b/i;

function metricToDomains(metric: ScopedPdfMetricId): string[] {
  const map: Partial<Record<ScopedPdfMetricId, string[]>> = {
    revenue: ["revenue"],
    expenses: ["expenses"],
    cash: ["cash"],
    ar_outstanding: ["ar"],
    ar_overdue: ["ar"],
    crm_pipeline_value: ["sales"],
    headcount: ["headcount"],
    payroll_total: ["payroll"],
    pnl: ["revenue", "expenses", "profitability"],
    balance_sheet: ["cash", "profitability"],
    burn_rate: ["cash"],
    runway: ["cash"],
  };
  return map[metric] ?? [];
}

function metricsToFocusDomains(metrics: ScopedPdfMetricId[]): string[] {
  const set = new Set<string>();
  for (const metric of metrics) {
    for (const domain of metricToDomains(metric)) set.add(domain);
  }
  return [...set];
}

function isAnalyticalBoardReportTask(message: string): boolean {
  if (!/\b(pdf|report)\b/i.test(message)) return false;
  if (ANALYTICAL_BOARD_PDF_SIGNALS.test(message)) return true;
  if (/\b(pdf|report)\b.*\b(board|executive)\b/i.test(message) && ANALYTICAL_PDF_PHRASES.test(message)) {
    return true;
  }
  return ANALYTICAL_PDF_PHRASES.test(message) && /\b(board|executive)\b/i.test(message);
}

function isScopedMetricPdfTask(message: string): boolean {
  if (!/\b(pdf|report)\b/i.test(message)) return false;
  if (!/\b(create|generate|make|prepare|export|build)\b/i.test(message)) return false;
  const parsed = parseScopedPdfRequest(message);
  return parsed.useScopedPath || parsed.metrics.length >= 1;
}

function enrichStrategicFocus(domains: string[], message: string): string[] {
  const set = new Set(domains);
  const lower = message.toLowerCase();
  if (/\b(client|customer)\b/i.test(lower)) {
    set.add("clients");
    if (/\b(leav|los|churn|exit|biggest)\b/i.test(lower)) set.add("revenue");
  }
  if (/\b(increase|grow|boost|raise|improve)\b/i.test(lower) && /\brevenue\b/i.test(lower)) {
    set.add("revenue");
    set.add("sales");
  }
  if (/\b(burn|runway|reduce)\b/i.test(lower)) set.add("cash");
  return [...set];
}

function inferComparisonPair(
  message: string,
  domains: string[],
): [string, string] | undefined {
  const hasSales = domains.includes("sales") || /\b(sales|pipeline|crm|bookings?)\b/i.test(message);
  const hasRevenue = domains.includes("revenue") || /\b(revenue|turnover|recognised)\b/i.test(message);
  const hasCash = domains.includes("cash") || /\b(cash|runway|liquidity)\b/i.test(message);
  const hasHeadcount = domains.includes("headcount") || /\b(headcount|employees?|workforce)\b/i.test(message);
  const hasExpenses = domains.includes("expenses") || /\b(expenses?|costs?|spend)\b/i.test(message);
  const hasProjects = domains.includes("projects") || /\b(projects?|delivery)\b/i.test(message);

  if (hasSales && hasRevenue) return ["sales", "revenue"];
  if (hasSales && hasCash) return ["sales", "cash"];
  if (hasRevenue && hasExpenses) return ["revenue", "expenses"];
  if (hasHeadcount && hasExpenses) return ["headcount", "expenses"];
  if (hasProjects && hasSales) return ["projects", "sales"];
  if (domains.length >= 2) return [domains[0], domains[1]];
  return undefined;
}

function isVisualiseTask(message: string): boolean {
  return /\b(graph|chart|plot|visuali[sz]e|trend)\b/i.test(message);
}

function isMultiDomainAnalytical(message: string, domains: string[]): boolean {
  const finance = domains.some((d) =>
    ["cash", "revenue", "expenses", "profitability", "ar", "ap", "payroll"].includes(d),
  );
  const sales = domains.includes("sales") || domains.includes("clients");
  const hr = domains.includes("headcount") || domains.includes("payroll");
  const projects = domains.includes("projects");
  const buckets = [finance, sales, hr, projects].filter(Boolean).length;
  if (buckets < 2) return false;
  return /\b(relative|versus|against|given|justify|sustainable|reconcile|compare|align|forecast|load|commitments?|afford)\b/i.test(
    message,
  );
}

export function synthesisKindForTask(task: ExecutiveTask): EaEvidenceSynthesisKind {
  if (task.job === "compare") return "comparative";
  if (task.job === "visualise") return "composite_chart";
  if (task.job === "report" && task.outputContract.kind === "analytical_pdf") return "board_report";
  if (task.job === "report" && task.outputContract.kind === "scoped_pdf") return "scoped_pdf";
  return "investigation";
}

export function classifyExecutiveTask(message: string): ExecutiveTask | null {
  const rawDomains = detectEvidenceDomains(message);
  const domains = enrichEvidenceDomains(message, rawDomains);
  const lower = message.toLowerCase();

  if (isScopedMetricPdfTask(message) && !isAnalyticalBoardReportTask(message)) {
    const parsed = parseScopedPdfRequest(message);
    const focusDomains = metricsToFocusDomains(parsed.metrics);
    return {
      job: "report",
      focusDomains: focusDomains.length ? focusDomains : domains,
      focusMetrics: parsed.metrics,
      outputContract: { kind: "scoped_pdf", metrics: parsed.metrics },
    };
  }

  if (isAnalyticalBoardReportTask(message)) {
    return {
      job: "report",
      focusDomains: domains.length ? domains : ["cash", "revenue", "sales", "headcount"],
      focusMetrics: [],
      outputContract: {
        kind: "analytical_pdf",
        sections: ["findings", "risks", "recommendations"],
      },
    };
  }

  if (isVisualiseTask(message)) {
    const chartDomains = domains.filter((d) =>
      ["revenue", "expenses", "cash", "headcount", "payroll", "sales", "ar"].includes(d),
    );
    const focus = chartDomains.length >= 2 ? chartDomains : domains.length ? domains : ["revenue", "cash"];
    return {
      job: "visualise",
      focusDomains: focus,
      focusMetrics: focus,
      outputContract: { kind: "chart", metrics: focus },
    };
  }

  if (isComparativeQuestion(message, rawDomains)) {
    const pair = inferComparisonPair(message, domains);
    const focusDomains = pair ? [pair[0], pair[1]] : domains.slice(0, 2);
    return {
      job: "compare",
      focusDomains,
      focusMetrics: [],
      outputContract: { kind: "answer" },
      comparisonPair: pair,
    };
  }

  if (BRIEF_SIGNALS.test(message)) {
    return {
      job: "brief",
      focusDomains: domains.length ? domains : ["revenue", "cash", "sales", "health"],
      focusMetrics: [],
      outputContract: { kind: "answer" },
    };
  }

  if (
    isOpenEndedConcern(message) ||
    isAnalyticalInvestigation(message) ||
    isMultiDomainAnalytical(message, domains)
  ) {
    return {
      job: "investigate",
      focusDomains: domains.length ? domains : ["cash", "revenue", "health"],
      focusMetrics: [],
      outputContract: { kind: "answer" },
    };
  }

  if (EXPLAIN_SIGNALS.test(message) && domains.length >= 1) {
    return {
      job: "explain",
      focusDomains: domains,
      focusMetrics: [],
      outputContract: { kind: "answer" },
    };
  }

  if (
    STRATEGIC_SIGNALS.test(lower) &&
    domains.length >= 1 &&
    !isVisualiseTask(message)
  ) {
    const focusDomains = enrichStrategicFocus(domains, message);
    return {
      job: "investigate",
      focusDomains: focusDomains.length ? focusDomains : domains,
      focusMetrics: [],
      outputContract: { kind: "answer" },
    };
  }

  return null;
}

export function buildExecutiveTaskFromPlan(
  message: string,
  domains: string[],
  job: ExecutiveJob,
  outputContract: ExecutiveOutputContract,
  comparisonPair?: [string, string],
): ExecutiveTask {
  return {
    job,
    focusDomains: domains,
    focusMetrics: outputContract.kind === "chart" ? outputContract.metrics : [],
    outputContract,
    comparisonPair,
  };
}
