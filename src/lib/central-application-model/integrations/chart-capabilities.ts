/**
 * Financial / sales chart capabilities — reusable time-series rendering.
 */

import type { EaResponseBlock } from "@/lib/ai-operating-assistant/capabilities/types";
import type { AssistantToolResult } from "@/lib/ai-operating-assistant/tool-result";
import { FUNCTIONAL_DOMAINS } from "../canonical-modules";
import type { EaSemanticCapabilityBinding } from "../types";

export type FinancialChartSeriesKind =
  | "revenue"
  | "revenue_vs_expenses"
  | "ar"
  | "cash"
  | "sales";

export function matchesFinancialChartCapability(
  message: string,
): { capabilityId: string; series: FinancialChartSeriesKind } | null {
  const lower = message.trim().toLowerCase();
  const wantsVisual =
    /\b(graph|chart|plot|visuali[sz]e|trend line|line chart|bar chart|trend)\b/i.test(lower);
  const wantsTimeSeries =
    /\b(over the last|last \d+\s+months?|last year|past year|year over year|monthly trend)\b/i.test(
      lower,
    );

  if (!wantsVisual && !wantsTimeSeries) return null;

  if (
    /\b(revenue|sales)\b[\s\S]{0,40}\b(expenses?|costs)\b/i.test(lower) ||
    /\b(expenses?|costs)\b[\s\S]{0,40}\b(revenue|sales)\b/i.test(lower)
  ) {
    return { capabilityId: "financials.chart.revenueVsExpenses.read", series: "revenue_vs_expenses" };
  }
  if (/\b(revenue|sales)\b/i.test(lower) && !/\b(expenses?|costs)\b/i.test(lower)) {
    return { capabilityId: "financials.chart.revenue.read", series: "revenue" };
  }
  if (/\b(ar\b|accounts?\s+receivable|receivables?)\b/i.test(lower)) {
    return { capabilityId: "financials.chart.ar.read", series: "ar" };
  }
  if (/\b(cash|bank)\b/i.test(lower)) {
    return { capabilityId: "financials.chart.cash.read", series: "cash" };
  }
  if (/\b(sales\s+performance|pipeline|crm|deals?)\b/i.test(lower)) {
    return { capabilityId: "crm.chart.salesPerformance.read", series: "sales" };
  }
  return null;
}

function monthLabel(isoMonth: string): string {
  const [year, month] = isoMonth.split("-").map(Number);
  if (!year || !month) return isoMonth;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleDateString("en-GB", {
    month: "short",
    year: "2-digit",
    timeZone: "UTC",
  });
}

function formatCurrency(amount: number, currency = "GBP"): string {
  return amount.toLocaleString("en-GB", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  });
}

function chartFromToolResult(
  result: AssistantToolResult,
  input: { series: FinancialChartSeriesKind },
): { text: string; blocks: EaResponseBlock[] } | null {
  const row = (result as { items?: Array<Record<string, unknown>> }).items?.[0];
  if (!row) return null;

  const labels = Array.isArray(row.labels)
    ? (row.labels as string[])
  : [];
  const datasets = Array.isArray(row.datasets)
    ? (row.datasets as Array<{ label: string; data: number[] }>)
    : [];

  if (!labels.length || !datasets.length) return null;

  const chartType =
    input.series === "revenue_vs_expenses" ? ("bar_chart" as const) : ("line_chart" as const);
  const title = String(row.title ?? "Chart");
  const summary = String(
    (result as { summary?: { message?: string } }).summary?.message ?? `${title} is shown below.`,
  );

  return {
    text: summary,
    blocks: [
      {
        type: chartType,
        title,
        labels,
        datasets,
      },
    ],
  };
}

const CHART_CAPABILITY_DEFS: Array<{
  id: string;
  series: FinancialChartSeriesKind;
  description: string;
  keywords: string[];
  moduleIds: string[];
  domainId: string;
  tool: string;
  months: number;
}> = [
  {
    id: "financials.chart.revenue.read",
    series: "revenue",
    description: "Revenue trend over time",
    keywords: ["revenue chart", "revenue graph", "revenue trend", "graph revenue", "show revenue"],
    moduleIds: ["financials"],
    domainId: FUNCTIONAL_DOMAINS.invoices,
    tool: "getFinancialChartData",
    months: 12,
  },
  {
    id: "financials.chart.revenueVsExpenses.read",
    series: "revenue_vs_expenses",
    description: "Revenue versus expenses comparison",
    keywords: [
      "revenue versus expenses",
      "revenue vs expenses",
      "graph revenue and expenses",
      "income and costs chart",
    ],
    moduleIds: ["financials"],
    domainId: FUNCTIONAL_DOMAINS.invoices,
    tool: "getFinancialChartData",
    months: 12,
  },
  {
    id: "financials.chart.ar.read",
    series: "ar",
    description: "Accounts receivable over time",
    keywords: ["ar chart", "ar over time", "receivables chart", "accounts receivable graph"],
    moduleIds: ["financials"],
    domainId: FUNCTIONAL_DOMAINS.invoices,
    tool: "getFinancialChartData",
    months: 12,
  },
  {
    id: "financials.chart.cash.read",
    series: "cash",
    description: "Cash position over time",
    keywords: ["cash chart", "cash position graph", "cash over time", "bank balance trend"],
    moduleIds: ["financials"],
    domainId: FUNCTIONAL_DOMAINS.cash,
    tool: "getFinancialChartData",
    months: 12,
  },
  {
    id: "crm.chart.salesPerformance.read",
    series: "sales",
    description: "Sales / CRM pipeline performance",
    keywords: ["sales performance chart", "graph sales performance", "pipeline chart", "crm chart"],
    moduleIds: ["business-central"],
    domainId: FUNCTIONAL_DOMAINS.crm,
    tool: "getFinancialChartData",
    months: 6,
  },
];

export function buildChartCapabilityBindings(): EaSemanticCapabilityBinding[] {
  return CHART_CAPABILITY_DEFS.map((def) => ({
    id: def.id,
    kind: "read" as const,
    moduleIds: def.moduleIds,
    domainId: def.domainId,
    entity: `${def.series}_chart`,
    description: def.description,
    keywords: def.keywords,
    permissions: ["canAccessFinancials"],
    requiredModules: def.moduleIds,
    tool: def.tool,
    buildArgs: () => ({ series: def.series, months: def.months }),
    executionStrategy: "deterministic" as const,
    deterministic: true,
    skipSynthesis: true,
    supportsVisualisation: true,
    formatAnswer(result, input) {
      return (
        chartFromToolResult(result as AssistantToolResult, {
          series: def.series,
        }) ?? {
          text: "Chart data is not available for your workspace yet.",
        }
      );
    },
  }));
}

export { monthLabel, formatCurrency };
